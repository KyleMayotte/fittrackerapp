// Services barrel export
// Import all services from a single location

export { default as api } from './api';
export { default as authService } from './auth';
export { default as exerciseService } from './exercise';
export { default as workoutService } from './workouts';
export { default as nutritionService } from './nutrition';
export { default as goalsService } from './goals';
export { default as progressService } from './progress';

// Re-export named functions from function-based services
export * from './exerciseDB';
export * from './firebaseFriend';
export * from './openai';

// Re-export types for convenience
export type * from './auth';
export type * from './exercise';
export type * from './workouts';
export type * from './nutrition';
export type * from './goals';
export type * from './progress';
