import { PersonalRecord, PRComparison } from '../types/pr';
import { loadPRs } from './prTracking';
import { getFriendWorkouts } from './friendSystem';

/**
 * Calculate PRs from friend workouts
 * This analyzes all of a friend's workouts to find their best lift for each exercise
 */
export function calculateFriendPRs(friendWorkouts: any[]): PersonalRecord[] {
  const exerciseBests = new Map<string, PersonalRecord>();

  friendWorkouts.forEach(workout => {
    workout.exercises.forEach((exercise: any) => {
      exercise.sets.forEach((set: any) => {
        if (!set.completed) return;

        const exerciseName = exercise.name.toLowerCase();
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;

        if (weight === 0 || reps === 0) return;

        // Calculate one rep max using Epley formula
        const estimatedOneRepMax = reps === 1 ? weight : weight * (1 + reps / 30);

        const existing = exerciseBests.get(exerciseName);

        if (!existing || estimatedOneRepMax > existing.estimatedOneRepMax) {
          exerciseBests.set(exerciseName, {
            exerciseName: exercise.name,
            weight,
            reps,
            date: workout.date,
            workoutId: workout.id,
            estimatedOneRepMax,
          });
        }
      });
    });
  });

  return Array.from(exerciseBests.values());
}

/**
 * Compare your PRs with a friend's PRs
 * Returns comparisons for all exercises where either you or your friend has a PR
 */
export async function comparePRsWithFriend(userId: string, friendId: string): Promise<PRComparison[]> {
  try {
    // Get your PRs
    const myPRs = await loadPRs();

    // Get friend's workouts and calculate their PRs
    const friendWorkouts = await getFriendWorkouts(userId, friendId, 100); // Get more workouts for accurate PR calculation
    const friendPRs = calculateFriendPRs(friendWorkouts);

    // Get all unique exercise names
    const allExercises = new Set<string>();
    myPRs.forEach(pr => allExercises.add(pr.exerciseName.toLowerCase()));
    friendPRs.forEach(pr => allExercises.add(pr.exerciseName.toLowerCase()));

    // Create comparisons
    const comparisons: PRComparison[] = [];

    allExercises.forEach(exerciseName => {
      const myPR = myPRs.find(pr => pr.exerciseName.toLowerCase() === exerciseName);
      const friendPR = friendPRs.find(pr => pr.exerciseName.toLowerCase() === exerciseName);

      // Use the display name from whichever PR exists
      const displayName = myPR?.exerciseName || friendPR?.exerciseName || exerciseName;

      const myOneRepMax = myPR?.estimatedOneRepMax || 0;
      const friendOneRepMax = friendPR?.estimatedOneRepMax || 0;

      comparisons.push({
        exerciseName: displayName,
        yourBest: myPR || null,
        friendBest: friendPR || null,
        youAhead: myOneRepMax > friendOneRepMax,
        difference: Math.abs(myOneRepMax - friendOneRepMax),
      });
    });

    // Sort by difference (biggest gaps first) to show most competitive lifts
    return comparisons.sort((a, b) => {
      // Put exercises where both have PRs first
      const aBothHave = a.yourBest && a.friendBest ? 1 : 0;
      const bBothHave = b.yourBest && b.friendBest ? 1 : 0;

      if (aBothHave !== bBothHave) {
        return bBothHave - aBothHave;
      }

      // Then sort by difference
      return b.difference - a.difference;
    });
  } catch (error) {
    console.error('Error comparing PRs:', error);
    return [];
  }
}

/**
 * Get overall stats comparing you vs friend
 */
export async function getComparisonStats(userId: string, friendId: string) {
  const comparisons = await comparePRsWithFriend(userId, friendId);

  const totalExercises = comparisons.length;
  const youAhead = comparisons.filter(c => c.youAhead && c.yourBest && c.friendBest).length;
  const friendAhead = comparisons.filter(c => !c.youAhead && c.yourBest && c.friendBest).length;
  const tied = comparisons.filter(c => c.yourBest && c.friendBest && c.difference === 0).length;

  return {
    totalExercises,
    youAhead,
    friendAhead,
    tied,
    comparisons,
  };
}
