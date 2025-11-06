import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { typography, spacing } from '../theme';
import LogMealScreen from './LogMealScreen';
import FriendsScreen from './FriendsScreen';
import AtlasChatScreen from './AtlasChatScreen';
import { useNutrition } from '../hooks/useNutrition';
import { getTodayDate } from '../utils/date';
import { useNavigation } from '@react-navigation/native';

type ModalScreen = null | 'log-meal' | 'friends' | 'atlas';

interface WorkoutHistory {
  id: string;
  templateId: string;
  templateName: string;
  emoji: string;
  date: string;
  duration: number;
  exercises: any[];
}

const HomeDashboard: React.FC = () => {
  const { theme, colors } = useTheme();
  const { user, logout, token } = useAuthContext();
  const navigation = useNavigation<any>();
  const [modalScreen, setModalScreen] = useState<ModalScreen>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const userEmail = user?.email || '';
  const authToken = token || '';
  const { foods, fetchFoods } = useNutrition(userEmail, authToken);

  // Load workout history and nutrition data
  useEffect(() => {
    loadWorkoutHistory();
    if (userEmail && authToken) {
      fetchFoods();
    }
  }, [refreshKey, userEmail, authToken]);

  // Reload data when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  const loadWorkoutHistory = async () => {
    try {
      const userEmail = user?.email || 'guest';
      const storageKey = `@muscleup/workout_history_${userEmail}`;
      const storedHistory = await AsyncStorage.getItem(storageKey);
      if (storedHistory) {
        setWorkoutHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Failed to load workout history:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate today's stats
  const getTodayStats = () => {
    const today = getTodayDate();

    // Count workouts today
    const todayWorkouts = workoutHistory.filter(w => w.date === today);
    const workoutCount = todayWorkouts.length;

    // Calculate calories and protein from meals
    const todayFoods = foods.filter(f => f.date === today);
    const totalCalories = todayFoods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = todayFoods.reduce((sum, f) => sum + f.protein, 0);

    return {
      workouts: workoutCount,
      calories: totalCalories,
      protein: totalProtein,
    };
  };

  // Get recent activity (last 5 items)
  const getRecentActivity = () => {
    const today = getTodayDate();
    const todayFoods = foods.filter(f => f.date === today);
    const todayWorkouts = workoutHistory.filter(w => w.date === today);

    const activities: Array<{
      id: string;
      type: 'workout' | 'meal';
      title: string;
      subtitle: string;
      emoji: string;
      time?: string;
    }> = [];

    // Add workouts
    todayWorkouts.forEach(workout => {
      activities.push({
        id: workout.id,
        type: 'workout',
        title: workout.templateName,
        subtitle: `${workout.exercises.length} exercises • ${workout.duration} min`,
        emoji: workout.emoji,
      });
    });

    // Add meals (group by meal type)
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    mealTypes.forEach(mealType => {
      const mealFoods = todayFoods.filter(f => f.mealType === mealType);
      if (mealFoods.length > 0) {
        const totalCals = mealFoods.reduce((sum, f) => sum + f.calories, 0);
        const mealEmojis = {
          breakfast: '🌅',
          lunch: '☀️',
          dinner: '🌙',
          snack: '🍎',
        };
        activities.push({
          id: `${mealType}-${today}`,
          type: 'meal',
          title: mealType.charAt(0).toUpperCase() + mealType.slice(1),
          subtitle: `${mealFoods.length} items • ${totalCals} cal`,
          emoji: mealEmojis[mealType],
        });
      }
    });

    return activities.slice(0, 5);
  };

  const todayStats = getTodayStats();
  const recentActivity = getRecentActivity();

  // Show modal screens
  if (modalScreen === 'log-meal') {
    return <LogMealScreen onBack={() => setModalScreen(null)} />;
  }

  if (modalScreen === 'friends') {
    return <FriendsScreen onBack={() => setModalScreen(null)} />;
  }

  if (modalScreen === 'atlas') {
    return <AtlasChatScreen onBack={() => setModalScreen(null)} userEmail={userEmail} />;
  }

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    greeting: {
      ...styles.greeting,
      color: colors.textSecondary,
    },
    userName: {
      ...styles.userName,
      color: colors.textPrimary,
    },
    cardTitle: {
      ...styles.cardTitle,
      color: colors.textPrimary,
    },
    statValue: {
      ...styles.statValue,
      color: colors.primary,
    },
    statLabel: {
      ...styles.statLabel,
      color: colors.textSecondary,
    },
    divider: {
      ...styles.divider,
      backgroundColor: colors.border,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: colors.textPrimary,
    },
    emptyText: {
      ...styles.emptyText,
      color: colors.textSecondary,
    },
    emptySubtext: {
      ...styles.emptySubtext,
      color: colors.textTertiary,
    },
    activityTitle: {
      ...styles.activityTitle,
      color: colors.textPrimary,
    },
    activitySubtitle: {
      ...styles.activitySubtitle,
      color: colors.textSecondary,
    },
    activityDivider: {
      ...styles.activityDivider,
      backgroundColor: colors.border,
    },
    avatarSmall: {
      ...styles.avatarSmall,
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={dynamicStyles.avatarSmall}>
              <Text style={styles.avatarEmoji}>💪</Text>
            </View>
            <View>
              <Text style={dynamicStyles.greeting}>{getGreeting()}</Text>
              <Text style={dynamicStyles.userName}>{user?.name || user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Card */}
        <Card style={styles.statsCard} shadow="medium">
          <Text style={dynamicStyles.cardTitle}>Today's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statValue}>{todayStats.workouts}</Text>
              <Text style={dynamicStyles.statLabel}>Workouts</Text>
            </View>
            <View style={dynamicStyles.divider} />
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statValue}>{Math.round(todayStats.protein)}</Text>
              <Text style={dynamicStyles.statLabel}>Protein</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <Card
              style={styles.actionCard}
              onPress={() => navigation.navigate('Workout')}
              shadow="small">
              <Text style={styles.actionEmoji}>💪</Text>
              <Text style={styles.actionTitle}>Start Workout</Text>
              <Text style={styles.actionSubtitle}>Begin your session</Text>
            </Card>
            <Card
              style={styles.actionCard}
              onPress={() => setModalScreen('log-meal')}
              shadow="small">
              <Text style={styles.actionEmoji}>🍎</Text>
              <Text style={styles.actionTitle}>Log Meal</Text>
              <Text style={styles.actionSubtitle}>Track nutrition</Text>
            </Card>
          </View>
          <View style={styles.actionGrid}>
            <Card
              style={styles.actionCard}
              onPress={() => setModalScreen('friends')}
              shadow="small">
              <Text style={styles.actionEmoji}>👥</Text>
              <Text style={styles.actionTitle}>Manage Friends</Text>
              <Text style={styles.actionSubtitle}>Add & invite</Text>
            </Card>
            <Card
              style={styles.actionCard}
              onPress={() => setModalScreen('atlas')}
              shadow="small">
              <Text style={styles.actionEmoji}>🤖</Text>
              <Text style={styles.actionTitle}>Chat with Atlas</Text>
              <Text style={styles.actionSubtitle}>AI workout coach</Text>
            </Card>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Recent Activity</Text>
          {recentActivity.length > 0 ? (
            <Card style={styles.activityCard} shadow="small">
              {recentActivity.map((activity, index) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <View style={styles.activityInfo}>
                      <Text style={dynamicStyles.activityTitle}>{activity.title}</Text>
                      <Text style={dynamicStyles.activitySubtitle}>{activity.subtitle}</Text>
                    </View>
                  </View>
                  {index < recentActivity.length - 1 && <View style={dynamicStyles.activityDivider} />}
                </View>
              ))}
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={dynamicStyles.emptyText}>No recent activity</Text>
              <Text style={dynamicStyles.emptySubtext}>
                Start your first workout to see your activity here
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  settingsIcon: {
    fontSize: 28,
  },
  greeting: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h3,
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  divider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.label,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  activitySubtitle: {
    ...typography.bodySmall,
  },
  activityDivider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
});

export default HomeDashboard;
