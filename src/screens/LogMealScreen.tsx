import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNutrition } from '../hooks/useNutrition';
import { useGoals } from '../hooks/useGoals';
import { Button, Card } from '../components';
import { typography, spacing, radius } from '../theme';
import { FoodEntry } from '../services/nutrition';
import { getTodayDate } from '../utils/date';

interface LogMealScreenProps {
  onBack?: () => void;
}

const LogMealScreen: React.FC<LogMealScreenProps> = ({ onBack }) => {
  const { theme, colors } = useTheme();
  const { user, token: authToken } = useAuthContext();
  const [previousProteinGoalMet, setPreviousProteinGoalMet] = useState(false);

  // Simple form state
  const [foodName, setFoodName] = useState('');
  const [proteinAmount, setProteinAmount] = useState('');
  const [caloriesAmount, setCaloriesAmount] = useState('');
  const [isAddingFood, setIsAddingFood] = useState(false);

  // Get token from auth context
  const token = authToken || '';
  const userEmail = user?.email || '';

  const { addFood, deleteFood, foods, fetchFoods } = useNutrition(userEmail, token);
  const { goals, fetchGoals } = useGoals(userEmail, token);

  // Load goals and today's foods
  useEffect(() => {
    if (!user || !token) {
      Alert.alert('Not Logged In', 'Please log in to use this feature.');
      return;
    }

    const loadData = async () => {
      try {
        await Promise.all([fetchGoals(), fetchFoods()]);
      } catch (err) {
        console.error('Error loading meal data:', err);
      }
    };

    loadData();
  }, [user, token]);

  // Calculate today's total protein
  const getTodayProtein = () => {
    const today = getTodayDate();
    const todayFoods = foods.filter(f => f.date === today);
    return todayFoods.reduce((sum, food) => sum + food.protein, 0);
  };

  const todayProtein = getTodayProtein();
  const proteinGoal = goals?.dailyProtein || 150;
  const proteinPercentage = Math.min((todayProtein / proteinGoal) * 100, 100);
  const proteinRemaining = Math.max(proteinGoal - todayProtein, 0);

  // Check if protein goal is met and award XP
  const checkAndAwardProteinGoalXP = async () => {
    const proteinGoalMet = todayProtein >= proteinGoal;

    // Track if protein goal was met
    setPreviousProteinGoalMet(proteinGoalMet);
  };

  useEffect(() => {
    checkAndAwardProteinGoalXP();
  }, [todayProtein]);

  const handleQuickAdd = async () => {
    if (isAddingFood) return; // Prevent double-submit

    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name.');
      return;
    }

    const protein = parseFloat(proteinAmount);
    if (isNaN(protein) || protein <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid protein amount greater than 0.');
      return;
    }
    if (protein > 999) {
      Alert.alert('Invalid Input', 'Protein amount must be less than 1000g.');
      return;
    }

    const calories = parseFloat(caloriesAmount);
    if (isNaN(calories) || calories < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid calorie amount.');
      return;
    }
    if (calories > 9999) {
      Alert.alert('Invalid Input', 'Calorie amount must be less than 10000.');
      return;
    }

    const today = getTodayDate();
    const foodEntry: FoodEntry = {
      userEmail: user?.email || '',
      name: foodName.trim(),
      calories: calories,
      protein: protein,
      carbs: 0,
      fat: 0,
      mealType: 'snack', // Default, doesn't matter anymore
      date: today,
    };

    setIsAddingFood(true);
    try {
      await addFood(foodEntry);
      setFoodName('');
      setProteinAmount('');
      setCaloriesAmount('');
      Keyboard.dismiss();
    } catch (err) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
      console.error('Add food error:', err);
    } finally {
      setIsAddingFood(false);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      await deleteFood(foodId);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete food.');
      console.error('Delete error:', err);
    }
  };

  const getTodayFoods = () => {
    const today = getTodayDate();
    return foods.filter(f => f.date === today).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const todayFoods = getTodayFoods();

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    heroTitle: {
      ...styles.heroTitle,
      color: colors.textPrimary,
    },
    proteinNumber: {
      ...styles.proteinNumber,
      color: colors.textPrimary,
    },
    proteinGoal: {
      ...styles.proteinGoal,
      color: colors.textSecondary,
    },
    progressBarLarge: {
      ...styles.progressBarLarge,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    progressText: {
      ...styles.progressText,
      color: colors.textSecondary,
    },
    cardTitle: {
      ...styles.cardTitle,
      color: colors.textPrimary,
    },
    input: {
      ...styles.input,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    foodName: {
      ...styles.foodName,
      color: colors.textPrimary,
    },
    foodProtein: {
      ...styles.foodProtein,
      color: colors.textSecondary,
    },
    deleteButton: {
      ...styles.deleteButton,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    deleteIcon: {
      ...styles.deleteIcon,
      color: colors.textSecondary,
    },
    totalRow: {
      ...styles.totalRow,
      borderTopColor: colors.border,
    },
    totalLabel: {
      ...styles.totalLabel,
      color: colors.textPrimary,
    },
    totalValue: {
      ...styles.totalValue,
      color: colors.primary,
    },
    emptyStateText: {
      ...styles.emptyStateText,
      color: colors.textSecondary,
    },
    emptyStateSubtext: {
      ...styles.emptyStateSubtext,
      color: colors.textSecondary,
    },
    foodItem: {
      ...styles.foodItem,
      backgroundColor: colors.surface,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Protein Progress */}
        <Card style={styles.heroCard} shadow="medium">
          <View style={styles.heroContent}>
            <Text style={dynamicStyles.heroTitle}>Daily Protein</Text>

            <View style={styles.proteinDisplay}>
              <Text style={dynamicStyles.proteinNumber}>{Math.round(todayProtein)}</Text>
              <Text style={dynamicStyles.proteinGoal}> / {proteinGoal}g</Text>
            </View>

            <View style={dynamicStyles.progressBarLarge}>
              <View
                style={[
                  styles.progressFillLarge,
                  {
                    width: `${Math.min(proteinPercentage, 100)}%`,
                    backgroundColor: proteinPercentage >= 100 ? colors.success : colors.primary
                  }
                ]}
              />
            </View>

            <Text style={dynamicStyles.progressText}>
              {proteinPercentage >= 100
                ? `Goal complete!`
                : `${Math.round(proteinRemaining)}g remaining`
              }
            </Text>
          </View>
        </Card>

        {/* Quick Add Food */}
        <Card style={styles.addCard} shadow="medium">
          <Text style={dynamicStyles.cardTitle}>Log Food</Text>

          <View style={styles.formRow}>
            <TextInput
              style={[dynamicStyles.input, styles.inputName]}
              placeholder="Food name"
              placeholderTextColor={colors.textSecondary}
              value={foodName}
              onChangeText={setFoodName}
              returnKeyType="next"
            />
            <TextInput
              style={[dynamicStyles.input, styles.inputProtein]}
              placeholder="Protein (g)"
              placeholderTextColor={colors.textSecondary}
              value={proteinAmount}
              onChangeText={(text) => {
                // Only allow numbers and decimal point, no negative
                const sanitized = text.replace(/[^0-9.]/g, '');
                setProteinAmount(sanitized);
              }}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <TextInput
              style={[dynamicStyles.input, styles.inputProtein]}
              placeholder="Calories"
              placeholderTextColor={colors.textSecondary}
              value={caloriesAmount}
              onChangeText={(text) => {
                // Only allow numbers and decimal point, no negative
                const sanitized = text.replace(/[^0-9.]/g, '');
                setCaloriesAmount(sanitized);
              }}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleQuickAdd}
            />
          </View>

          <Button
            title="Add Food"
            onPress={handleQuickAdd}
            size="large"
            loading={isAddingFood}
            disabled={isAddingFood}
          />
        </Card>

        {/* Today's Foods */}
        <Card style={styles.foodsCard} shadow="medium">
          <Text style={dynamicStyles.cardTitle}>Today's Log</Text>

          {todayFoods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={dynamicStyles.emptyStateText}>No foods logged today</Text>
              <Text style={dynamicStyles.emptyStateSubtext}>
                Start tracking your protein above
              </Text>
            </View>
          ) : (
            <View style={styles.foodsList}>
              {todayFoods.map((food, index) => (
                <View key={food._id} style={dynamicStyles.foodItem}>
                  <View style={styles.foodInfo}>
                    <Text style={dynamicStyles.foodName}>{food.name}</Text>
                    <Text style={dynamicStyles.foodProtein}>
                      {Math.round(food.protein)}g
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteFood(food._id!)}
                    style={dynamicStyles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Text style={dynamicStyles.deleteIcon}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={dynamicStyles.totalRow}>
                <Text style={dynamicStyles.totalLabel}>Total</Text>
                <Text style={dynamicStyles.totalValue}>{Math.round(todayProtein)}g</Text>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.lg,
  },
  heroContent: {
    gap: spacing.md,
  },
  heroTitle: {
    ...typography.h3,
    fontWeight: '700',
  },
  proteinDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  proteinNumber: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 56,
  },
  proteinGoal: {
    fontSize: 20,
    fontWeight: '500',
  },
  progressBarLarge: {
    width: '100%',
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.body,
    fontWeight: '500',
  },
  addCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    ...typography.body,
  },
  inputName: {
    flex: 2,
  },
  inputProtein: {
    flex: 1,
  },
  foodsCard: {
    marginBottom: spacing.xl,
  },
  foodsList: {
    gap: spacing.xs,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  foodInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: {
    ...typography.body,
    fontWeight: '500',
  },
  foodProtein: {
    ...typography.body,
    fontWeight: '600',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  deleteIcon: {
    fontSize: 20,
    fontWeight: '400',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...typography.h4,
    fontWeight: '600',
  },
  totalValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
});

export default LogMealScreen;
