import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { spacing, radius, typography } from '../theme';
import { colors } from '../theme/colors';

interface LifetimeStatsProps {
  workoutHistory: any[];
  foods: any[];
  proteinGoal?: number;
}

const LifetimeStats: React.FC<LifetimeStatsProps> = ({
  workoutHistory,
  foods,
  proteinGoal = 150
}) => {
  // Calculate all stats from workoutHistory and foods
  const calculateStats = () => {
    const workouts = workoutHistory || [];

    // Total workouts
    const totalWorkouts = workouts.length;

    // Total sets, reps, and volume
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let volumeLast30Days = 0;
    let volumePrevious30Days = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date);

      if (workout.exercises) {
        workout.exercises.forEach(exercise => {
          if (exercise.sets) {
            exercise.sets.forEach(set => {
              if (set.completed) {
                const volume = (set.weight || 0) * (set.reps || 0);

                totalSets++;
                totalReps += set.reps || 0;
                totalVolume += volume;

                // Calculate volume for trend comparison
                if (workoutDate >= thirtyDaysAgo) {
                  volumeLast30Days += volume;
                } else if (workoutDate >= sixtyDaysAgo && workoutDate < thirtyDaysAgo) {
                  volumePrevious30Days += volume;
                }
              }
            });
          }
        });
      }
    });

    // Calculate volume trend percentage
    let volumeTrendPercent = 0;
    if (volumePrevious30Days > 0) {
      volumeTrendPercent = Math.round(((volumeLast30Days - volumePrevious30Days) / volumePrevious30Days) * 100);
    }

    // Get workout dates for heatmap (last 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toDateString();
    });

    const workoutDateSet = new Set(
      workouts.map(w => new Date(w.date).toDateString())
    );

    const heatmapData = last7Days.map(dateStr => ({
      date: dateStr,
      hasWorkout: workoutDateSet.has(dateStr),
    }));

    // Total protein days (days that hit protein goal)
    const dailyProteinData: { [date: string]: number } = {};
    (foods || []).forEach(food => {
      if (!dailyProteinData[food.date]) {
        dailyProteinData[food.date] = 0;
      }
      dailyProteinData[food.date] += food.protein || 0;
    });

    const totalProteinDays = Object.values(dailyProteinData).filter(
      protein => protein >= proteinGoal
    ).length;

    // Calculate streaks
    const workoutDates = workouts
      .map(w => w.date)
      .sort()
      .filter((date, index, self) => self.indexOf(date) === index); // unique dates

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    if (workoutDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if there's a workout today or yesterday
      const lastWorkoutDate = new Date(workoutDates[workoutDates.length - 1]);
      lastWorkoutDate.setHours(0, 0, 0, 0);
      const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate streaks
      for (let i = 0; i < workoutDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(workoutDates[i - 1]);
          const currDate = new Date(workoutDates[i]);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);

      // Current streak is only valid if last workout was today or yesterday
      if (daysSinceLastWorkout <= 1) {
        currentStreak = tempStreak;
      }
    }

    // Weekly PRs - count PRs achieved this week (resets every Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    let weeklyPRs = 0;

    // Group exercises by name and track their max values
    const exerciseMaxByDate: { [exerciseName: string]: { date: string; value: number }[] } = {};

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (exercise.sets && exercise.sets.length > 0) {
          // Calculate best set for this workout (by estimated 1RM)
          let bestValue = 0;
          exercise.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
              // Epley formula for estimated 1RM
              const estimated1RM = set.weight * (1 + set.reps / 30);
              bestValue = Math.max(bestValue, estimated1RM);
            }
          });

          if (bestValue > 0) {
            if (!exerciseMaxByDate[exercise.name]) {
              exerciseMaxByDate[exercise.name] = [];
            }
            exerciseMaxByDate[exercise.name].push({
              date: workout.date,
              value: bestValue,
            });
          }
        }
      });
    });

    // For each exercise, check if this week had a PR
    Object.keys(exerciseMaxByDate).forEach(exerciseName => {
      const records = exerciseMaxByDate[exerciseName].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let maxValueBeforeThisWeek = 0;
      let hasPRThisWeek = false;

      records.forEach(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);

        if (recordDate >= startOfWeek) {
          // This is a workout from this week
          if (record.value > maxValueBeforeThisWeek) {
            hasPRThisWeek = true;
          }
        } else {
          // Track max from before this week
          maxValueBeforeThisWeek = Math.max(maxValueBeforeThisWeek, record.value);
        }
      });

      if (hasPRThisWeek) {
        weeklyPRs++;
      }
    });

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      totalVolume,
      volumeTrendPercent,
      totalProteinDays,
      maxStreak,
      currentStreak,
      weeklyPRs,
      heatmapData,
    };
  };

  const stats = calculateStats();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatVolume = (lbs: number): string => {
    const tons = lbs / 2000;
    if (tons >= 1) return `${tons.toFixed(1)}T`;
    return `${formatNumber(lbs)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>
          {stats.totalWorkouts === 0
            ? "Start your fitness journey today!"
            : "Your training summary"}
        </Text>
      </View>

      {/* Empty State Message */}
      {stats.totalWorkouts === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>💪 Complete your first workout to see your progress!</Text>
        </View>
      )}

      {/* Compact Grid Layout - 2 rows of 3 */}
      <View style={styles.statsGrid}>
        <View style={styles.gridRow}>
          <LinearGradient
            colors={colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={styles.compactStatValue}>{formatNumber(stats.totalWorkouts)}</Text>
            <Text style={styles.compactStatLabel}>Workouts</Text>
          </LinearGradient>

          <LinearGradient
            colors={colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={styles.compactStatValue}>{formatNumber(stats.totalSets)}</Text>
            <Text style={styles.compactStatLabel}>Sets</Text>
          </LinearGradient>

          <LinearGradient
            colors={colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={styles.compactStatValue}>{formatVolume(stats.totalVolume)}</Text>
            <Text style={styles.compactStatLabel}>Volume</Text>
            {stats.volumeTrendPercent !== 0 && (
              <Text style={[
                styles.volumeTrend,
                stats.volumeTrendPercent > 0 && { color: colors.success },
                stats.volumeTrendPercent < 0 && { color: colors.error },
              ]}>
                {stats.volumeTrendPercent > 0 ? '↑' : '↓'} {Math.abs(stats.volumeTrendPercent)}%
              </Text>
            )}
          </LinearGradient>
        </View>

        <View style={styles.gridRow}>
          {/* Streak Card with Heatmap */}
          <LinearGradient
            colors={colors.gradientSecondary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={[styles.compactStatValue, stats.currentStreak > 0 && { color: colors.success }]}>
              {stats.currentStreak}
            </Text>
            <Text style={styles.compactStatLabel}>Streak</Text>
            {stats.maxStreak > 0 && (
              <Text style={styles.streakBest}>Best: {stats.maxStreak}</Text>
            )}
            {/* Heatmap */}
            <View style={styles.heatmapContainer}>
              {stats.heatmapData.map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.heatmapDay,
                    day.hasWorkout && styles.heatmapDayActive,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>

          <LinearGradient
            colors={colors.gradientSecondary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={styles.compactStatValue}>{stats.totalProteinDays}</Text>
            <Text style={styles.compactStatLabel}>Protein</Text>
          </LinearGradient>

          <LinearGradient
            colors={colors.gradientSecondary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactStatCard}
          >
            <Text style={styles.compactStatValue}>{stats.weeklyPRs}</Text>
            <Text style={styles.compactStatLabel}>PRs this week</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    gap: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  compactStatCard: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 70,
    justifyContent: 'center',
  },
  compactStatValue: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  compactStatLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  streakBest: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 1,
  },
  volumeTrend: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  heatmapContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    justifyContent: 'center',
  },
  heatmapDay: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  heatmapDayActive: {
    backgroundColor: colors.success,
  },
});

export default LifetimeStats;
