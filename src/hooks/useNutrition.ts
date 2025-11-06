// Nutrition tracking hook
// Provides food logging and meal management

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nutritionService, { FoodEntry, SavedMeal } from '../services/nutrition';
import { getTodayDate } from '../utils/date';
import { calculateTotalCalories, calculateTotalProtein } from '../utils/nutrition';

const FOODS_STORAGE_KEY = '@muscleup/foods';

export const useNutrition = (userEmail: string, token: string) => {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from AsyncStorage
  const loadFromStorage = async (): Promise<FoodEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(FOODS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load foods from storage:', error);
      return [];
    }
  };

  // Save to AsyncStorage
  const saveToStorage = async (foodsData: FoodEntry[]) => {
    try {
      await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(foodsData));
    } catch (error) {
      console.error('Failed to save foods to storage:', error);
    }
  };

  // Load foods from storage on mount
  useEffect(() => {
    loadFromStorage().then(setFoods);
  }, []);

  // Fetch foods (optimized for speed - load cache first)
  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from cache immediately for instant display
      const cachedFoods = await loadFromStorage();
      if (cachedFoods.length > 0) {
        setFoods(cachedFoods);
        // Don't stop loading - API sync still happening
      }

      // Then sync with API in background
      const data = await nutritionService.getFoods(userEmail, token);
      setFoods(data);
      await saveToStorage(data);
    } catch (err: any) {
      console.log('API unavailable, using cached data');
      const storedFoods = await loadFromStorage();
      setFoods(storedFoods);
      setError(null); // Don't show error if we have local data
    } finally {
      // Only stop loading after both cache load AND API sync complete (or fail)
      setLoading(false);
    }
  };

  // Add food (offline-first with permanent local storage)
  const addFood = async (food: FoodEntry) => {
    // Create food entry with local ID (offline-first approach)
    const localFood: FoodEntry = {
      ...food,
      _id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Immediately save to UI and AsyncStorage (permanent, not temp)
    const updatedFoods = [...foods, localFood];
    setFoods(updatedFoods);
    await saveToStorage(updatedFoods);

    // Then sync with API in the background (best effort)
    try {
      const newFood = await nutritionService.addFood(food, token);
      // Replace local item with server item (has real _id)
      const syncedFoods = foods.map(f => f._id === localFood._id ? newFood : f)
        .filter(f => f._id !== localFood._id)
        .concat([newFood]);
      setFoods(syncedFoods);
      await saveToStorage(syncedFoods);
      return newFood;
    } catch (err: any) {
      // API failed but data is already saved locally - NO ROLLBACK
      console.log('Failed to sync food to API, saved locally only:', err);
      // Don't set error or throw - user's data is safe in local storage
      return localFood;
    }
  };

  // Delete food (offline-first with permanent local deletion)
  const deleteFood = async (id: string) => {
    const deletedFood = foods.find(f => f._id === id);

    // Remove from UI and AsyncStorage immediately
    const updated = foods.filter(f => f._id !== id);
    setFoods(updated);
    await saveToStorage(updated);

    // Then try to delete from API (best effort)
    try {
      // Only call API if this is a server item (not local-only)
      if (!id.startsWith('local-')) {
        await nutritionService.deleteFood(id, token);
      }
    } catch (err: any) {
      // API failed but local deletion already happened
      console.log('Failed to delete from API, deleted locally only:', err);
      // Don't rollback - user wanted it deleted, it's deleted locally
      // When they come back online, this will be out of sync but that's better than
      // confusing them by restoring something they deleted
    }
  };

  // Search foods
  const searchFood = async (query: string) => {
    try {
      return await nutritionService.searchFood(query);
    } catch (err: any) {
      // Silently fail - don't set error to avoid annoying popup
      console.log('Food search unavailable (USDA API rate limit or network issue)');
      return [];
    }
  };

  // Lookup barcode
  const lookupBarcode = async (barcode: string) => {
    try {
      return await nutritionService.lookupBarcode(barcode);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup barcode');
      throw err;
    }
  };

  // Analyze meal image
  const analyzeMealImage = async (imageFile: Blob) => {
    try {
      setLoading(true);
      setError(null);
      const result = await nutritionService.analyzeMealImage(imageFile, token);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Voice food log
  const voiceFoodLog = async (audioBlob: Blob) => {
    try {
      setLoading(true);
      setError(null);
      const result = await nutritionService.voiceFoodLog(audioBlob, token);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process voice log');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved meals
  const fetchSavedMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nutritionService.getSavedMeals(userEmail, token);
      setSavedMeals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch saved meals');
    } finally {
      setLoading(false);
    }
  };

  // Save meal
  const saveMeal = async (meal: SavedMeal) => {
    try {
      setLoading(true);
      setError(null);
      const newMeal = await nutritionService.saveMeal(meal, token);
      setSavedMeals(prev => [...prev, newMeal]);
      return newMeal;
    } catch (err: any) {
      setError(err.message || 'Failed to save meal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete saved meal
  const deleteSavedMeal = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await nutritionService.deleteSavedMeal(id, token);
      setSavedMeals(prev => prev.filter(m => m._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete saved meal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get today's totals
  const getTodayTotals = () => {
    const today = getTodayDate();
    const todayFoods = foods.filter(f => f.date === today);

    return {
      calories: calculateTotalCalories(todayFoods),
      protein: calculateTotalProtein(todayFoods),
    };
  };

  return {
    foods,
    savedMeals,
    loading,
    error,
    fetchFoods,
    addFood,
    deleteFood,
    searchFood,
    lookupBarcode,
    analyzeMealImage,
    voiceFoodLog,
    fetchSavedMeals,
    saveMeal,
    deleteSavedMeal,
    getTodayTotals,
  };
};
