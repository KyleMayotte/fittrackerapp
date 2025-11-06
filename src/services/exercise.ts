// Exercise Service
// Provides exercise database search using ExerciseDB API with GIF demonstrations

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISEDB_API_KEY } from '@env';

const CUSTOM_EXERCISES_KEY = '@muscleup/custom_exercises';

export interface ExerciseResult {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  gifUrl?: string; // URL to exercise demonstration GIF
  id?: string; // ExerciseDB ID for detailed lookups
  bodyPart?: string; // Body part targeted by exercise
}

class ExerciseService {
  /**
   * Save custom exercise to AsyncStorage
   */
  async saveCustomExercise(exerciseName: string): Promise<void> {
    try {
      const existing = await this.getCustomExercises();
      if (!existing.includes(exerciseName)) {
        existing.push(exerciseName);
        await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(existing));
      }
    } catch (error) {
      console.error('Failed to save custom exercise:', error);
    }
  }

  /**
   * Get all custom exercises from AsyncStorage
   */
  async getCustomExercises(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load custom exercises:', error);
      return [];
    }
  }

  /**
   * Delete a custom exercise
   */
  async deleteCustomExercise(exerciseName: string): Promise<void> {
    try {
      const existing = await this.getCustomExercises();
      const filtered = existing.filter(name => name !== exerciseName);
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete custom exercise:', error);
    }
  }

  /**
   * Search exercises by name
   * Uses ExerciseDB API with GIF demonstrations + custom exercises
   * Returns separate arrays for custom and database exercises
   */
  async searchExercises(query: string): Promise<{ custom: ExerciseResult[]; database: ExerciseResult[] }> {
    try {
      if (!query || query.trim().length < 2) {
        return { custom: [], database: [] };
      }

      // Search custom exercises
      const customExercises = await this.searchCustomExercises(query);

      // Use ExerciseDB API with key from .env
      // Convert query to lowercase since API is case-sensitive
      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query.toLowerCase())}?limit=20&offset=0`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': EXERCISEDB_API_KEY,
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
          },
        }
      );

      if (!response.ok) {
        console.warn('ExerciseDB API request failed, using local database');
        return { custom: customExercises, database: this.searchLocalExercises(query) };
      }

      const data = await response.json();

      // Transform API response to our format with GIF URLs
      // ExerciseDB API provides GIF URLs in format: https://v2.exercisedb.io/image/{id}
      const exercises: ExerciseResult[] = data.map((exercise: any) => ({
        id: exercise.id,
        name: exercise.name || 'Unknown Exercise',
        type: exercise.target || 'general',
        muscle: exercise.target || 'full body',
        equipment: exercise.equipment || 'bodyweight',
        difficulty: exercise.difficulty || 'intermediate',
        instructions: Array.isArray(exercise.instructions) ? exercise.instructions[0] : exercise.instructions || '',
        gifUrl: `https://v2.exercisedb.io/image/${exercise.id}`, // Construct GIF URL from ID
        bodyPart: exercise.bodyPart || exercise.target || 'full body',
      }));

      return { custom: customExercises, database: exercises.slice(0, 10) };
    } catch (error) {
      console.error('Exercise search error:', error);
      // Fallback to local database + custom exercises
      const customExercises = await this.searchCustomExercises(query);
      const localResults = this.searchLocalExercises(query);
      return { custom: customExercises, database: localResults };
    }
  }

  /**
   * Search custom exercises
   */
  private async searchCustomExercises(query: string): Promise<ExerciseResult[]> {
    const customExercises = await this.getCustomExercises();
    const lowerQuery = query.toLowerCase();

    return customExercises
      .filter(name => name.toLowerCase().includes(lowerQuery))
      .map(name => ({
        name,
        type: 'custom',
        muscle: 'custom',
        equipment: 'custom',
        difficulty: 'custom',
        instructions: 'Custom exercise',
        bodyPart: 'custom',
      }));
  }

  /**
   * Fallback: Search local exercise database
   */
  private searchLocalExercises(query: string): ExerciseResult[] {
    console.log('Searching local exercises for:', query);
    const localExercises: ExerciseResult[] = [
      // Chest
      { name: 'Bench Press', type: 'strength', muscle: 'chest', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Lie on bench, lower bar to chest, press up', bodyPart: 'chest' },
      { name: 'Push-ups', type: 'strength', muscle: 'chest', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Lower body to ground, push back up', bodyPart: 'chest' },
      { name: 'Dumbbell Chest Press', type: 'strength', muscle: 'chest', equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Press dumbbells up from chest', bodyPart: 'chest' },
      { name: 'Incline Bench Press', type: 'strength', muscle: 'chest', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Press on incline bench', bodyPart: 'chest' },
      { name: 'Cable Flyes', type: 'strength', muscle: 'chest', equipment: 'cable', difficulty: 'intermediate', instructions: 'Pull cables together in front of chest', bodyPart: 'chest' },

      // Back
      { name: 'Deadlift', type: 'strength', muscle: 'back', equipment: 'barbell', difficulty: 'advanced', instructions: 'Lift bar from ground to standing', bodyPart: 'back' },
      { name: 'Pull-ups', type: 'strength', muscle: 'back', equipment: 'bodyweight', difficulty: 'intermediate', instructions: 'Pull yourself up to bar', bodyPart: 'back' },
      { name: 'Barbell Row', type: 'strength', muscle: 'back', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Row bar to lower chest', bodyPart: 'back' },
      { name: 'Lat Pulldown', type: 'strength', muscle: 'back', equipment: 'cable', difficulty: 'beginner', instructions: 'Pull bar down to chest', bodyPart: 'back' },
      { name: 'Dumbbell Row', type: 'strength', muscle: 'back', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Row dumbbell to hip', bodyPart: 'back' },

      // Legs
      { name: 'Squat', type: 'strength', muscle: 'legs', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Lower hips, drive back up', bodyPart: 'legs' },
      { name: 'Leg Press', type: 'strength', muscle: 'legs', equipment: 'machine', difficulty: 'beginner', instructions: 'Push platform with legs', bodyPart: 'legs' },
      { name: 'Lunges', type: 'strength', muscle: 'legs', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Step forward and lower knee', bodyPart: 'legs' },
      { name: 'Romanian Deadlift', type: 'strength', muscle: 'legs', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Hinge at hips, lower bar', bodyPart: 'legs' },
      { name: 'Leg Curl', type: 'strength', muscle: 'legs', equipment: 'machine', difficulty: 'beginner', instructions: 'Curl legs toward glutes', bodyPart: 'legs' },
      { name: 'Calf Raises', type: 'strength', muscle: 'legs', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Raise up on toes', bodyPart: 'legs' },

      // Shoulders
      { name: 'Overhead Press', type: 'strength', muscle: 'shoulders', equipment: 'barbell', difficulty: 'intermediate', instructions: 'Press bar overhead', bodyPart: 'shoulders' },
      { name: 'Dumbbell Shoulder Press', type: 'strength', muscle: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Press dumbbells overhead', bodyPart: 'shoulders' },
      { name: 'Lateral Raises', type: 'strength', muscle: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Raise arms to sides', bodyPart: 'shoulders' },
      { name: 'Front Raises', type: 'strength', muscle: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Raise arms to front', bodyPart: 'shoulders' },

      // Arms
      { name: 'Bicep Curls', type: 'strength', muscle: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Curl weights to shoulders', bodyPart: 'arms' },
      { name: 'Tricep Dips', type: 'strength', muscle: 'triceps', equipment: 'bodyweight', difficulty: 'intermediate', instructions: 'Lower body between bars', bodyPart: 'arms' },
      { name: 'Hammer Curls', type: 'strength', muscle: 'biceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Curl with neutral grip', bodyPart: 'arms' },
      { name: 'Tricep Extensions', type: 'strength', muscle: 'triceps', equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Extend arms overhead', bodyPart: 'arms' },

      // Core
      { name: 'Plank', type: 'strength', muscle: 'core', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Hold body straight in push-up position', bodyPart: 'core' },
      { name: 'Crunches', type: 'strength', muscle: 'core', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Curl upper body toward knees', bodyPart: 'core' },
      { name: 'Russian Twists', type: 'strength', muscle: 'core', equipment: 'bodyweight', difficulty: 'intermediate', instructions: 'Rotate torso side to side', bodyPart: 'core' },
      { name: 'Leg Raises', type: 'strength', muscle: 'core', equipment: 'bodyweight', difficulty: 'intermediate', instructions: 'Raise legs while lying down', bodyPart: 'core' },
    ];

    const lowerQuery = query.toLowerCase();
    const results = localExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);

    console.log('Local search found:', results.length, 'exercises');
    return results;
  }
}

export default new ExerciseService();
