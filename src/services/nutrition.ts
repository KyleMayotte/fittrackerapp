// Nutrition Service
// Handles food logging, meal search, and nutrition tracking

import api from './api';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  _id?: string;
  userEmail: string;
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  mealType: MealType;
  date: string;
  createdAt?: string;
  micronutrients?: any; // Keep for backward compatibility but not used
}

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
  micronutrients?: any; // Keep for backward compatibility but not used
}

export interface SavedMeal {
  _id?: string;
  userEmail: string;
  name: string;
  foods: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  createdAt?: string;
}

export interface BarcodeProduct {
  name: string;
  calories: number;
  protein: number;
  brand?: string;
  servingSize?: string;
  imageUrl?: string;
}

export interface VoiceLogResult {
  name: string;
  calories: number;
  protein: number;
  transcription?: string;
}

class NutritionService {
  /**
   * Get all food entries for a user
   */
  async getFoods(userEmail: string, token: string): Promise<FoodEntry[]> {
    try {
      const response = await api.get<FoodEntry[]>(
        `/food?userEmail=${userEmail}`,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a food entry
   */
  async addFood(food: FoodEntry, token: string): Promise<FoodEntry> {
    try {
      const response = await api.post<FoodEntry>('/food', food, token);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a food entry
   */
  async deleteFood(id: string, token: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(
        `/food?id=${id}`,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search food database via backend API
   */
  async searchFood(query: string): Promise<FoodSearchResult[]> {
    try {
      const response = await api.get<{ foods: FoodSearchResult[] }>(
        `/food-search?query=${encodeURIComponent(query)}`
      );
      return response.foods;
    } catch (error) {
      console.error('Food search error:', error);
      throw error;
    }
  }

  /**
   * Lookup product by barcode
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProduct> {
    try {
      const response = await api.get<BarcodeProduct>(
        `/barcode-lookup?barcode=${barcode}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analyze meal from image using AI
   */
  async analyzeMealImage(imageFile: File | Blob, token: string): Promise<FoodSearchResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.postFormData<FoodSearchResult>(
        '/meal-vision',
        formData,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log food via voice recording
   */
  async voiceFoodLog(audioBlob: Blob, token: string): Promise<VoiceLogResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await api.postFormData<VoiceLogResult>(
        '/voice-food-log',
        formData,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get saved meals
   */
  async getSavedMeals(userEmail: string, token: string): Promise<SavedMeal[]> {
    try {
      const response = await api.get<SavedMeal[]>(
        `/saved-meals?userEmail=${userEmail}`,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save a meal template
   */
  async saveMeal(meal: SavedMeal, token: string): Promise<SavedMeal> {
    try {
      const response = await api.post<SavedMeal>('/saved-meals', meal, token);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a saved meal
   */
  async deleteSavedMeal(id: string, token: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(
        `/saved-meals?id=${id}`,
        token
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new NutritionService();
