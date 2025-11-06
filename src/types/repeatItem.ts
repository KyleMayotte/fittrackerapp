import { MealType } from '../services/nutrition';

export type RecurrenceType = 'daily' | 'weekly';

export interface RepeatItemFood {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

export interface RepeatItem {
  _id: string;
  name: string;
  mealType: MealType;
  foods: RepeatItemFood[];
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  isActive: boolean;
  createdAt: string;
}

export interface RepeatItemSchedule {
  repeatItemId: string;
  date: string;
  isLogged: boolean;
  isAutoAdded: boolean;
}
