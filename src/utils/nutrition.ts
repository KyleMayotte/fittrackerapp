// Nutrition utility functions

import { FoodEntry } from '../services/nutrition';

/**
 * Calculate total calories from food entries
 */
export const calculateTotalCalories = (foods: FoodEntry[]): number => {
  return foods.reduce((total, food) => total + food.calories, 0);
};

/**
 * Calculate total protein from food entries
 */
export const calculateTotalProtein = (foods: FoodEntry[]): number => {
  return foods.reduce((total, food) => total + food.protein, 0);
};

/**
 * Group foods by meal type
 */
export const groupFoodsByMeal = (foods: FoodEntry[]) => {
  return {
    breakfast: foods.filter(f => f.mealType === 'breakfast'),
    lunch: foods.filter(f => f.mealType === 'lunch'),
    dinner: foods.filter(f => f.mealType === 'dinner'),
    snack: foods.filter(f => f.mealType === 'snack'),
  };
};

/**
 * Calculate meal totals for a specific meal type
 */
export const getMealTotals = (foods: FoodEntry[], mealType: string) => {
  const mealFoods = foods.filter(f => f.mealType === mealType);
  return {
    calories: calculateTotalCalories(mealFoods),
    protein: calculateTotalProtein(mealFoods),
  };
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.round((current / goal) * 100);
};

/**
 * Validate nutrition values
 */
export const validateNutritionValues = (calories: number, protein: number): boolean => {
  return calories > 0 && protein >= 0 && calories < 10000 && protein < 1000;
};
