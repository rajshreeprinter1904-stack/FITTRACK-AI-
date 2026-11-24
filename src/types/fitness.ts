export type GenderOption = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'endurance' | 'recomp' | 'wellness';
export type WorkoutPreference = 'gym' | 'home' | 'outdoor' | 'hybrid';
export type DietaryPreference =
  | 'balanced'
  | 'high_protein'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'mediterranean';

export type WorkoutCategory =
  | 'gym'
  | 'home'
  | 'cardio'
  | 'running_walking'
  | 'cycling'
  | 'yoga';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type ReminderCategory = 'workout' | 'water' | 'meal' | 'sleep' | 'goal' | 'motivation';
export type AppSection = 'home' | 'workout' | 'nutrition' | 'progress' | 'profile';

export interface UserProfile {
  userId: string;
  name: string;
  age: number;
  gender: GenderOption;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  fitnessLevel: FitnessLevel;
  fitnessGoal: FitnessGoal;
  workoutPreference: WorkoutPreference;
  equipment: string[];
  dietaryPreference: DietaryPreference;
  dailyCalorieGoal: number;
  dailyProteinGoalG: number;
  dailyCarbsGoalG: number;
  dailyFatGoalG: number;
  dailyStepsGoal: number;
  dailyWaterGoalMl: number;
  dailySleepGoalHours: number;
  dailyActiveMinutesGoal: number;
  onboardingCompleted: boolean;
}

export interface DailyLog {
  id: string; // YYYY-MM-DD
  userId: string;
  dateKey: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
  waterMl: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  bedTime: string;
  wakeTime: string;
  restingHeartRateBpm: number;
  fitnessScore: number;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  dateKey: string;
  category: WorkoutCategory;
  title: string;
  durationMin: number;
  caloriesBurned: number;
  distanceKm: number;
  sets: number;
  reps: number;
  weightKg: number;
  exercisesSummary: string;
  notes: string;
}

export interface MealEntry {
  id: string;
  userId: string;
  dateKey: string;
  mealType: MealType;
  foodName: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  dateKey: string;
  weightKg: number;
  bodyFatPct: number;
  bmi: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  armCm: number;
  note: string;
  localPhotoId: string;
}

export interface ReminderSetting {
  id: string;
  userId: string;
  category: ReminderCategory;
  label: string;
  time24h: string;
  enabled: boolean;
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  category: WorkoutCategory;
  muscleGroup: string;
  equipment: string;
  difficulty: FitnessLevel;
  kcalPerMin: number;
  defaultSets: number;
  defaultReps: number;
  imageUrl: string;
  instructions: string[];
  formCue: string;
}

export interface FoodCatalogItem {
  id: string;
  foodName: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  suggestedMeal: MealType;
  dietTags: DietaryPreference[];
}

export interface AIWorkoutPlan {
  planTitle: string;
  weeklyScheduleSummary: string;
  progressionNote: string;
  sessions: {
    dayLabel: string;
    sessionTitle: string;
    category: WorkoutCategory;
    durationMin: number;
    estimatedCalories: number;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      restSec: number;
      coachingCue: string;
    }[];
  }[];
}

export interface AIMealPlan {
  strategySummary: string;
  hydrationTip: string;
  meals: {
    mealType: MealType;
    foodName: string;
    servingSize: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    prepNote: string;
  }[];
}

export interface AIDailyInsights {
  motivationalMessage: string;
  dailyImprovementTip: string;
  workoutAdjustment: string;
  nutritionFeedback: string;
  sleepRecommendation: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  category: ReminderCategory;
  timestamp: string;
  read: boolean;
}
