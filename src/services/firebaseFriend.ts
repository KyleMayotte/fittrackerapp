import firestore from '@react-native-firebase/firestore';
import { Friend, FriendWorkout, InviteCode } from '../types/friend';

/**
 * Firebase Firestore collections:
 * - inviteCodes: { userId, code, userName, createdAt }
 * - friendRelationships: { userId, friendId, friendName, dateAdded }
 * - sharedWorkouts: { userId, workoutId, friendId, friendName, templateName, ... }
 */

const INVITE_CODES_COLLECTION = 'inviteCodes';
const FRIEND_RELATIONSHIPS_COLLECTION = 'friendRelationships';
const SHARED_WORKOUTS_COLLECTION = 'sharedWorkouts';
const WORKOUT_LIKES_COLLECTION = 'workoutLikes';
const WORKOUT_COMMENTS_COLLECTION = 'workoutComments';

/**
 * Generate a unique 6-character alphanumeric invite code
 */
export function generateInviteCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Get or create the user's invite code from Firestore
 */
export async function getMyInviteCode(userId: string, userName: string): Promise<InviteCode> {
  try {
    console.log('getMyInviteCode: Starting Firestore query...');
    const docRef = firestore().collection(INVITE_CODES_COLLECTION).doc(userId);

    console.log('getMyInviteCode: Getting document...');

    // Add timeout to detect if Firestore is not responding
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore query timeout - Is Firestore enabled in Firebase Console?')), 10000);
    });

    const doc = await Promise.race([docRef.get(), timeoutPromise]);

    console.log('getMyInviteCode: Document exists?', doc.exists);

    if (doc.exists) {
      const data = doc.data();
      console.log('getMyInviteCode: Document data:', data);
      if (data && data.code) {
        console.log('getMyInviteCode: Returning existing code:', data.code);
        return data as InviteCode;
      }
    }

    // Create new invite code
    console.log('getMyInviteCode: Creating new invite code...');
    const inviteCode: InviteCode = {
      code: generateInviteCode(),
      userId,
      userName,
      createdAt: new Date().toISOString(),
    };

    await Promise.race([docRef.set(inviteCode), timeoutPromise]);
    console.log('getMyInviteCode: Created new code:', inviteCode.code);
    return inviteCode;
  } catch (error: any) {
    console.error('Error getting invite code from Firestore:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw new Error(error?.message || 'Failed to load invite code. Check if Firestore is enabled in Firebase Console.');
  }
}

/**
 * Find a user by their invite code
 */
async function findUserByInviteCode(inviteCode: string): Promise<{ userId: string; userName: string } | null> {
  try {
    const snapshot = await firestore()
      .collection(INVITE_CODES_COLLECTION)
      .where('code', '==', inviteCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    return {
      userId: data.userId,
      userName: data.userName,
    };
  } catch (error) {
    console.error('Error finding user by invite code:', error);
    throw error;
  }
}

/**
 * Add a friend using their invite code
 */
export async function addFriend(userId: string, friendInviteCode: string, customName?: string): Promise<Friend> {
  try {
    // Find the friend by their invite code
    const friendData = await findUserByInviteCode(friendInviteCode);

    if (!friendData) {
      throw new Error('Invalid invite code');
    }

    if (friendData.userId === userId) {
      throw new Error('You cannot add yourself as a friend');
    }

    // Check if already friends
    const existingFriendDoc = await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .where('userId', '==', userId)
      .where('friendId', '==', friendData.userId)
      .limit(1)
      .get();

    if (!existingFriendDoc.empty) {
      throw new Error('Already friends with this user');
    }

    const newFriend: Friend = {
      id: friendData.userId,
      name: customName || friendData.userName,
      dateAdded: new Date().toISOString(),
    };

    // Add bidirectional friendship
    // User -> Friend
    await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .add({
        userId,
        friendId: friendData.userId,
        friendName: newFriend.name,
        dateAdded: newFriend.dateAdded,
      });

    // Friend -> User (so they can see each other)
    const myInviteCode = await getMyInviteCode(userId, customName || 'User');
    await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .add({
        userId: friendData.userId,
        friendId: userId,
        friendName: myInviteCode.userName,
        dateAdded: newFriend.dateAdded,
      });

    return newFriend;
  } catch (error) {
    console.error('Error adding friend in Firestore:', error);
    throw error;
  }
}

/**
 * Load all friends from Firestore
 */
export async function loadFriends(userId: string): Promise<Friend[]> {
  try {
    const snapshot = await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const friends: Friend[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      friends.push({
        id: data.friendId,
        name: data.friendName,
        dateAdded: data.dateAdded,
        lastWorkoutDate: data.lastWorkoutDate,
      });
    });

    return friends.sort((a, b) =>
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  } catch (error) {
    console.error('Error loading friends from Firestore:', error);
    return [];
  }
}

/**
 * Remove a friend from Firestore
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  try {
    // Remove User -> Friend relationship
    const userFriendSnapshot = await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .where('userId', '==', userId)
      .where('friendId', '==', friendId)
      .limit(1)
      .get();

    if (!userFriendSnapshot.empty) {
      await userFriendSnapshot.docs[0].ref.delete();
    }

    // Remove Friend -> User relationship
    const friendUserSnapshot = await firestore()
      .collection(FRIEND_RELATIONSHIPS_COLLECTION)
      .where('userId', '==', friendId)
      .where('friendId', '==', userId)
      .limit(1)
      .get();

    if (!friendUserSnapshot.empty) {
      await friendUserSnapshot.docs[0].ref.delete();
    }
  } catch (error) {
    console.error('Error removing friend from Firestore:', error);
    throw error;
  }
}

/**
 * Share a workout with all friends via Firestore
 */
export async function shareWorkout(
  userId: string,
  workoutId: string,
  templateName: string,
  emoji: string,
  date: string,
  duration: number,
  exercises: any[],
  myInviteCode: string,
  myName: string,
  photoUrl?: string
): Promise<void> {
  try {
    console.log('=== SHARING WORKOUT ===');
    console.log('userId:', userId);
    console.log('workoutId:', workoutId);
    console.log('templateName:', templateName);
    console.log('myName:', myName);
    console.log('photoUrl:', photoUrl);

    const friendWorkout: FriendWorkout = {
      id: workoutId,
      friendId: userId,
      friendName: myName,
      templateName,
      emoji,
      date,
      duration,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map((set: any) => ({
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0,
          completed: set.completed,
        })),
      })),
      ...(photoUrl && { photoUrl }), // Include photoUrl only if provided
    };

    console.log('Workout data:', JSON.stringify(friendWorkout, null, 2));

    const docId = `${userId}_${workoutId}`;
    console.log('Saving to Firestore with docId:', docId);

    // Store in Firestore - it will be accessible by all users who are friends with this userId
    await firestore()
      .collection(SHARED_WORKOUTS_COLLECTION)
      .doc(docId)
      .set(friendWorkout);

    console.log('✅ Workout shared successfully!');
  } catch (error) {
    console.error('❌ Error sharing workout to Firestore:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Load friend workouts from Firestore
 */
export async function loadFriendWorkouts(userId: string): Promise<FriendWorkout[]> {
  try {
    console.log('loadFriendWorkouts: userId:', userId);
    // Get list of friend IDs
    const friends = await loadFriends(userId);
    console.log('loadFriendWorkouts: friends loaded:', friends.length);
    console.log('loadFriendWorkouts: friends:', JSON.stringify(friends));
    const friendIds = friends.map(f => f.id);

    // Add yourself to the list so you can see your own workouts and their likes/comments
    const allUserIds = [userId, ...friendIds];
    console.log('loadFriendWorkouts: Loading workouts from:', allUserIds);

    if (allUserIds.length === 0) {
      console.log('loadFriendWorkouts: No user IDs, returning empty');
      return [];
    }

    // Firestore 'in' queries are limited to 10 items, so we need to batch
    const workouts: FriendWorkout[] = [];

    // Process in chunks of 10
    for (let i = 0; i < allUserIds.length; i += 10) {
      const chunk = allUserIds.slice(i, i + 10);
      console.log('loadFriendWorkouts: Querying chunk:', chunk);

      const snapshot = await firestore()
        .collection(SHARED_WORKOUTS_COLLECTION)
        .where('friendId', 'in', chunk)
        .get();

      console.log('loadFriendWorkouts: Query returned', snapshot.docs.length, 'workouts');

      snapshot.forEach(doc => {
        const workout = doc.data() as FriendWorkout;
        console.log('loadFriendWorkouts: Workout data:', JSON.stringify(workout));
        workouts.push(workout);
      });
    }

    console.log('loadFriendWorkouts: Total workouts:', workouts.length);

    // Sort by workout ID (timestamp) - newest first
    return workouts.sort((a, b) =>
      parseInt(b.id) - parseInt(a.id)
    );
  } catch (error) {
    console.error('Error loading friend workouts from Firestore:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }
}

/**
 * Get recent workouts from a specific friend
 */
export async function getFriendWorkouts(
  userId: string,
  friendId: string,
  limit: number = 10
): Promise<FriendWorkout[]> {
  try {
    const snapshot = await firestore()
      .collection(SHARED_WORKOUTS_COLLECTION)
      .where('friendId', '==', friendId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const workouts: FriendWorkout[] = [];

    snapshot.forEach(doc => {
      workouts.push(doc.data() as FriendWorkout);
    });

    return workouts;
  } catch (error) {
    console.error('Error getting friend workouts from Firestore:', error);
    return [];
  }
}

/**
 * Get all friends' recent workouts (for feed)
 */
export async function getAllFriendsWorkouts(userId: string, limit: number = 20): Promise<FriendWorkout[]> {
  try {
    console.log('getAllFriendsWorkouts: Loading workouts...');
    const allWorkouts = await loadFriendWorkouts(userId);
    console.log('getAllFriendsWorkouts: Loaded', allWorkouts.length, 'workouts');

    // Load likes and comments for each workout
    console.log('getAllFriendsWorkouts: Loading social data...');
    const workoutsWithSocial = await Promise.all(
      allWorkouts.map(async (workout) => {
        try {
          // Try to load social data, but if indexes aren't ready, catch and return empty arrays
          const [likes, comments] = await Promise.all([
            getWorkoutLikes(workout.id).catch(err => {
              console.log('Likes index not ready yet for workout', workout.id);
              return [];
            }),
            getWorkoutComments(workout.id).catch(err => {
              console.log('Comments index not ready yet for workout', workout.id);
              return [];
            }),
          ]);

          return {
            ...workout,
            likes,
            comments,
            likeCount: likes.length,
            commentCount: comments.length,
          };
        } catch (error) {
          // If loading social data fails for this workout, return it with empty social data
          console.error(`Error loading social data for workout ${workout.id}:`, error);
          return {
            ...workout,
            likes: [],
            comments: [],
            likeCount: 0,
            commentCount: 0,
          };
        }
      })
    );

    console.log('getAllFriendsWorkouts: Social data loaded');
    const result = workoutsWithSocial.slice(0, limit);
    console.log('getAllFriendsWorkouts: Returning', result.length, 'workouts');
    return result;
  } catch (error) {
    console.error('Error getting all friends workouts from Firestore:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }
}

/**
 * Like a workout
 */
export async function likeWorkout(workoutId: string, userId: string, userName: string): Promise<void> {
  try {
    const likeId = `${workoutId}_${userId}`;
    const like = {
      id: likeId,
      workoutId,
      userId,
      userName,
      createdAt: new Date().toISOString(),
    };

    await firestore()
      .collection(WORKOUT_LIKES_COLLECTION)
      .doc(likeId)
      .set(like);
  } catch (error) {
    console.error('Error liking workout:', error);
    throw error;
  }
}

/**
 * Unlike a workout
 */
export async function unlikeWorkout(workoutId: string, userId: string): Promise<void> {
  try {
    const likeId = `${workoutId}_${userId}`;
    await firestore()
      .collection(WORKOUT_LIKES_COLLECTION)
      .doc(likeId)
      .delete();
  } catch (error) {
    console.error('Error unliking workout:', error);
    throw error;
  }
}

/**
 * Get likes for a workout
 */
export async function getWorkoutLikes(workoutId: string): Promise<any[]> {
  try {
    const snapshot = await firestore()
      .collection(WORKOUT_LIKES_COLLECTION)
      .where('workoutId', '==', workoutId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting workout likes:', error);
    return [];
  }
}

/**
 * Add a comment to a workout (or reply to a comment)
 */
export async function addWorkoutComment(
  workoutId: string,
  userId: string,
  userName: string,
  text: string,
  parentCommentId?: string
): Promise<void> {
  try {
    const commentId = `${workoutId}_${userId}_${Date.now()}`;
    const comment = {
      id: commentId,
      workoutId,
      userId,
      userName,
      text,
      createdAt: new Date().toISOString(),
      ...(parentCommentId && { parentCommentId }),
    };

    await firestore()
      .collection(WORKOUT_COMMENTS_COLLECTION)
      .doc(commentId)
      .set(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Get comments for a workout (organized with nested replies)
 */
export async function getWorkoutComments(workoutId: string): Promise<any[]> {
  try {
    const snapshot = await firestore()
      .collection(WORKOUT_COMMENTS_COLLECTION)
      .where('workoutId', '==', workoutId)
      .orderBy('createdAt', 'asc')
      .get();

    const allComments = snapshot.docs.map(doc => doc.data());

    // Organize comments into parent-child structure
    const commentMap = new Map();
    const topLevelComments: any[] = [];

    // First pass: create map of all comments
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    allComments.forEach(comment => {
      if (comment.parentCommentId) {
        // This is a reply
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap.get(comment.id));
      }
    });

    return topLevelComments;
  } catch (error) {
    console.error('Error getting workout comments:', error);
    return [];
  }
}

/**
 * Delete a comment
 */
export async function deleteWorkoutComment(commentId: string): Promise<void> {
  try {
    await firestore()
      .collection(WORKOUT_COMMENTS_COLLECTION)
      .doc(commentId)
      .delete();
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
