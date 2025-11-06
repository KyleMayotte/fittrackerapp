import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { spacing, radius, typography } from '../theme';
import { colors } from '../theme/colors';

interface Exercise {
  name: string;
  sets: any[];
}

interface Workout {
  date: string;
  exercises: Exercise[];
}

interface ExerciseSelectorProps {
  workoutHistory: Workout[];
  selectedExercise: string | null;
  onSelectExercise: (exerciseName: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  workoutHistory,
  selectedExercise,
  onSelectExercise,
  onExpandedChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandedChange = (expanded: boolean) => {
    setIsExpanded(expanded);
    if (!expanded) {
      setSearchQuery('');
    }
    onExpandedChange?.(expanded);
  };

  // Default exercises to show
  const DEFAULT_EXERCISES = ['Bench Press', 'Squat', 'Deadlift'];

  // Get all unique exercises from workout history with their workout count
  const exerciseList = useMemo(() => {
    const exerciseMap = new Map<string, number>();

    workoutHistory.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const count = exerciseMap.get(exercise.name) || 0;
        exerciseMap.set(exercise.name, count + 1);
      });
    });

    // Add default exercises with 0 count if they don't exist
    DEFAULT_EXERCISES.forEach(defaultExercise => {
      if (!exerciseMap.has(defaultExercise)) {
        exerciseMap.set(defaultExercise, 0);
      }
    });

    return Array.from(exerciseMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Sort default exercises first, then by count
        const aIsDefault = DEFAULT_EXERCISES.includes(a.name);
        const bIsDefault = DEFAULT_EXERCISES.includes(b.name);

        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;
        if (aIsDefault && bIsDefault) {
          return DEFAULT_EXERCISES.indexOf(a.name) - DEFAULT_EXERCISES.indexOf(b.name);
        }

        return b.count - a.count;
      });
  }, [workoutHistory]);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exerciseList;
    }
    const query = searchQuery.toLowerCase();
    return exerciseList.filter(exercise =>
      exercise.name.toLowerCase().includes(query)
    );
  }, [exerciseList, searchQuery]);

  // Group exercises by muscle group (basic categorization)
  const categorizeExercise = (name: string): string => {
    const lowerName = name.toLowerCase();

    // Chest
    if (lowerName.includes('bench') || lowerName.includes('chest') ||
        lowerName.includes('press') && (lowerName.includes('dumbbell') || lowerName.includes('barbell'))) {
      return 'Chest';
    }
    // Back
    if (lowerName.includes('pull') || lowerName.includes('row') ||
        lowerName.includes('lat') || lowerName.includes('deadlift')) {
      return 'Back';
    }
    // Shoulders
    if (lowerName.includes('shoulder') || lowerName.includes('lateral') ||
        lowerName.includes('overhead') || lowerName.includes('military')) {
      return 'Shoulders';
    }
    // Legs
    if (lowerName.includes('squat') || lowerName.includes('leg') ||
        lowerName.includes('lunge') || lowerName.includes('calf')) {
      return 'Legs';
    }
    // Arms
    if (lowerName.includes('curl') || lowerName.includes('tricep') ||
        lowerName.includes('bicep') || lowerName.includes('arm')) {
      return 'Arms';
    }
    // Core
    if (lowerName.includes('crunch') || lowerName.includes('plank') ||
        lowerName.includes('ab') || lowerName.includes('core')) {
      return 'Core';
    }

    return 'Other';
  };

  const groupedExercises = useMemo(() => {
    const groups = new Map<string, typeof exerciseList>();

    filteredExercises.forEach(exercise => {
      const category = categorizeExercise(exercise.name);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(exercise);
    });

    // Sort groups by priority
    const priorityOrder = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Other'];
    return Array.from(groups.entries()).sort((a, b) => {
      const indexA = priorityOrder.indexOf(a[0]);
      const indexB = priorityOrder.indexOf(b[0]);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [filteredExercises]);

  // Handle exercise selection
  const handleSelectExercise = (exerciseName: string) => {
    // Add to recent searches if it wasn't a default exercise
    if (!DEFAULT_EXERCISES.includes(exerciseName) && !recentSearches.includes(exerciseName)) {
      setRecentSearches(prev => [exerciseName, ...prev.slice(0, 4)]); // Keep last 5
    }
    setSearchQuery('');
    handleExpandedChange(false);
    onSelectExercise(exerciseName);
  };

  // Clear recent searches
  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Get default exercises
  const defaultExercises = useMemo(() => {
    return exerciseList.filter(ex => DEFAULT_EXERCISES.includes(ex.name));
  }, [exerciseList]);

  // Get recent search exercises
  const recentExercises = useMemo(() => {
    return recentSearches
      .map(name => exerciseList.find(ex => ex.name === name))
      .filter((ex): ex is { name: string; count: number } => ex !== undefined);
  }, [recentSearches, exerciseList]);

  // Get all other exercises (excluding defaults and recents)
  const allOtherExercises = useMemo(() => {
    const excludeNames = new Set([...DEFAULT_EXERCISES, ...recentSearches]);
    return exerciseList.filter(ex => !excludeNames.has(ex.name));
  }, [exerciseList, recentSearches]);

  if (exerciseList.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No exercises found</Text>
        <Text style={styles.emptySubtext}>
          Complete workouts to track your progress
        </Text>
      </View>
    );
  }

  // Render exercise item
  const renderExerciseItem = (exercise: { name: string; count: number }) => (
    <TouchableOpacity
      key={exercise.name}
      style={[
        styles.exerciseItem,
        selectedExercise === exercise.name && styles.exerciseItemSelected,
      ]}
      onPress={() => handleSelectExercise(exercise.name)}
    >
      <View style={styles.exerciseItemContent}>
        <Text style={[
          styles.exerciseName,
          selectedExercise === exercise.name && styles.exerciseNameSelected,
        ]}>
          {exercise.name}
        </Text>
        <Text style={styles.exerciseCount}>
          {exercise.count > 0 ? `${exercise.count} sessions` : 'No sessions yet'}
        </Text>
      </View>
      {selectedExercise === exercise.name && (
        <View style={styles.selectedIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => handleExpandedChange(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (!isExpanded) handleExpandedChange(true);
          }}
          onFocus={() => handleExpandedChange(true)}
          editable={isExpanded}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Expanded view */}
      {isExpanded && (
        <View pointerEvents="box-none">
          {/* Active search filtering */}
          {searchQuery.trim() ? (
            <>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderText}>Search Results</Text>
              </View>
              <View style={styles.exerciseList}>
                {filteredExercises.map(renderExerciseItem)}
              </View>
              {filteredExercises.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No exercises match "{searchQuery}"</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Recent searches section */}
              {recentExercises.length > 0 && (
                <>
                  <View style={[styles.sectionHeaderContainer, styles.sectionHeaderWithAction]}>
                    <Text style={styles.sectionHeaderText}>Recently Searched</Text>
                    <TouchableOpacity onPress={handleClearRecentSearches} style={styles.clearRecentButton}>
                      <Text style={styles.clearRecentText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exerciseList}>
                    {recentExercises.map(renderExerciseItem)}
                  </View>
                </>
              )}

              {/* All other exercises section */}
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderText}>All Exercises</Text>
              </View>
              <View style={styles.exerciseList}>
                {allOtherExercises.map(renderExerciseItem)}
              </View>
            </>
          )}
        </View>
      )}

      {/* Default exercises - show at bottom when not searching */}
      {!searchQuery.trim() && (
        <View style={styles.exerciseList}>
          {defaultExercises.map(renderExerciseItem)}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderContainer: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearRecentButton: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  clearRecentText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
  },
  exerciseList: {
    gap: spacing.xs,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseItemSelected: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  exerciseNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  exerciseCount: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectedIndicator: {
    width: 4,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginLeft: spacing.md,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  showMoreText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.h4,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  noResults: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ExerciseSelector;
