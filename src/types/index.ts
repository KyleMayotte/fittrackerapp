// Central type definitions

// Re-export types from services for convenience
export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '../services/auth';

export type {
  Exercise,
  WorkoutTemplate,
  WorkoutSession,
  ExerciseSearchResult,
  AIWorkoutPlanInput,
} from '../services/workouts';

export type {
  MealType,
  FoodEntry,
  FoodSearchResult,
  SavedMeal,
  BarcodeProduct,
  VoiceLogResult,
} from '../services/nutrition';

export type {
  WeightGoalType,
  UserGoals,
  GoalRecommendation,
  GoalRecommendationInput,
} from '../services/goals';

export type {
  WeightEntry,
} from '../services/progress';

// Additional shared types
import type { WorkoutSession as WS } from '../services/workouts';

export type CardioType = 'walk' | 'run' | 'bike' | 'swim' | 'other';

export interface CardioActivity {
  id: string;
  type: CardioType;
  duration: number; // in minutes
  distance?: number; // in miles/km
  date: string;
  notes?: string;
}

export interface DailyActivity {
  date: string;
  workouts: WS[];
  cardio?: CardioActivity[];
  nutrition: {
    calories: number;
    caloriesGoal: number;
    protein: number;
    proteinGoal: number;
  };
  weight?: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
}

export interface ProgressStats {
  currentWeight: number;
  startWeight: number;
  weightChange: number;
  goalWeight?: number;
}

// API Response types
export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
