# Firestore Security Rules Setup

## Current Issue
Old test workouts with incomplete data (0 min, 0 sets) are showing in the feed. These need to be deleted from Firestore.

## Step 1: Delete Old Test Data

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database** → **Data** tab
4. Click on the **`sharedWorkouts`** collection
5. **Delete all documents** in this collection (these are old test workouts)
6. Optional: Also clear `workoutLikes` and `workoutComments` collections if they exist

## Step 2: Verify Security Rules

Go to **Firestore Database** → **Rules** tab and ensure you have these exact rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow authenticated users to read/write their own invite codes
    match /inviteCodes/{codeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Allow authenticated users to read/write friend relationships
    match /friendRelationships/{relationshipId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null &&
                      (resource.data.userId == request.auth.uid ||
                       resource.data.friendId == request.auth.uid);
    }

    // Allow authenticated users to read all shared workouts and write their own
    match /sharedWorkouts/{workoutId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.data.friendId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.friendId == request.auth.uid;
    }

    // Allow authenticated users to read all likes and write their own
    match /workoutLikes/{likeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Allow authenticated users to read all comments and write their own
    match /workoutComments/{commentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **"Publish"** and wait 5-10 seconds for rules to propagate.

## Step 3: Test New Workout Upload

1. **Complete a new workout** (do at least 1 set of 1 exercise)
2. **Check Metro bundler console** for these logs:
   ```
   📝 Completed workout data:
     - Duration: X minutes (should NOT be 0)
     - Exercises: X (should NOT be 0)
   📤 Starting to share workout...
   ✅ Workout share completed!
   ```
3. **Navigate to Feed tab**
4. **Pull down to refresh**
5. Your new workout should appear with correct duration and exercise count

## Step 4: Verify Data in Firestore

After completing a workout:

1. Go to **Firestore Database** → **Data**
2. Click **`sharedWorkouts`** collection
3. You should see a new document with structure:
   ```
   {
     id: "1234567890",
     friendId: "your-firebase-uid",
     friendName: "Your Name",
     templateName: "Upper Body",
     emoji: "💪",
     date: "2025-02-01",
     duration: 15,  // NOT 0
     exercises: [
       {
         name: "Bench Press",
         sets: [
           { reps: 10, weight: 135, completed: true }
         ]
       }
     ]
   }
   ```

## Troubleshooting

### If workouts still don't appear:
1. Check Metro console for errors during workout completion
2. Verify Firebase Authentication is working (you're logged in)
3. Check Firestore rules are published and not in test mode
4. Ensure you deleted all old test data from `sharedWorkouts` collection

### If you see "Permission Denied" errors:
1. Verify the security rules are exactly as shown above
2. Make sure you're logged in (check Auth tab in Firebase Console)
3. Verify `request.auth.uid` matches your `user.id` in the app

## Expected Behavior

✅ New workouts appear immediately after completion when you navigate to Feed tab
✅ Workouts show correct duration (not 0 min)
✅ Workouts show exercise names and set counts (not "0 sets")
✅ You can like and comment on your own and friends' workouts
✅ Pull-to-refresh updates the feed
