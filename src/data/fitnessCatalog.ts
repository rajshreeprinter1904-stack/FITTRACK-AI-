import gymImg from '../assets/images/workout_strength_gym_1793525638023.jpg';
import homeImg from '../assets/images/workout_home_bodyweight_1793525638373.jpg';
import cardioImg from '../assets/images/workout_cardio_running_1793525640294.jpg';
import yogaImg from '../assets/images/workout_yoga_mobility_1793525641147.jpg';
import mealImg from '../assets/images/nutrition_balanced_meal_1793525642239.jpg';

import type {
  BodyMeasurement,
  DailyLog,
  DietaryPreference,
  ExerciseCatalogItem,
  FitnessGoal,
  FitnessLevel,
  FoodCatalogItem,
  GenderOption,
  MealEntry,
  ReminderSetting,
  UserProfile,
  WorkoutCategory,
  WorkoutEntry,
  WorkoutPreference,
} from '../types/fitness';

export const VISUAL_ASSETS = {
  gym: gymImg,
  home: homeImg,
  cardio: cardioImg,
  yoga: yogaImg,
  meal: mealImg,
};

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  gym: 'Gym Strength',
  home: 'Home Workout',
  cardio: 'Cardio HIIT',
  running_walking: 'Running & Walking',
  cycling: 'Cycling',
  yoga: 'Yoga & Stretching',
};

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: 'Fat Loss & Lean Definition',
  build_muscle: 'Hypertrophy & Muscle Gain',
  endurance: 'Cardio Stamina & Conditioning',
  recomp: 'Body Recomposition',
  wellness: 'Daily Longevity & Mobility',
};

export const DIETARY_LABELS: Record<DietaryPreference, string> = {
  balanced: 'Balanced Whole Foods',
  high_protein: 'High-Protein Performance',
  vegetarian: 'Vegetarian',
  vegan: 'Plant-Based Vegan',
  keto: 'Low-Carb Ketogenic',
  mediterranean: 'Mediterranean',
};

export const EQUIPMENT_OPTIONS: { id: string; label: string }[] = [
  { id: 'bodyweight', label: 'Bodyweight Only' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'barbell', label: 'Barbell & Plates' },
  { id: 'kettlebells', label: 'Kettlebells' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'pullup_bar', label: 'Pull-Up Bar' },
  { id: 'bench', label: 'Weight Bench' },
  { id: 'cable_machine', label: 'Cable Machine' },
  { id: 'treadmill', label: 'Treadmill' },
  { id: 'stationary_bike', label: 'Cycle / Spin Bike' },
  { id: 'yoga_mat', label: 'Yoga Mat' },
];

export const EXERCISE_LIBRARY: ExerciseCatalogItem[] = [
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Back Squat',
    category: 'gym',
    muscleGroup: 'Quadriceps · Glutes · Core',
    equipment: 'Barbell & Squat Rack',
    difficulty: 'intermediate',
    kcalPerMin: 8.5,
    defaultSets: 4,
    defaultReps: 8,
    imageUrl: gymImg,
    formCue: 'Brace 360-degree core pressure and drive knees in line with toes.',
    instructions: [
      'Position barbell securely across upper traps and unrack with a shoulder-width stance.',
      'Inhale, brace your midsection, and descend by sitting hips back and bending knees until thighs break parallel.',
      'Drive through mid-foot to stand tall without rounding your lumbar spine.',
    ],
  },
  {
    id: 'ex-incline-db-press',
    name: 'Incline Dumbbell Bench Press',
    category: 'gym',
    muscleGroup: 'Upper Chest · Anterior Delts · Triceps',
    equipment: 'Dumbbells & Incline Bench',
    difficulty: 'beginner',
    kcalPerMin: 7.0,
    defaultSets: 4,
    defaultReps: 10,
    imageUrl: gymImg,
    formCue: 'Tuck elbows at a 45-degree angle to protect shoulder capsules.',
    instructions: [
      'Set bench to a 30-degree incline and plant feet firmly into the floor.',
      'Lower dumbbells with control over 2-3 seconds until wrists align just outside chest level.',
      'Press smoothly upward to lockout while keeping shoulder blades retracted.',
    ],
  },
  {
    id: 'ex-romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'gym',
    muscleGroup: 'Hamstrings · Glutes · Posterior Chain',
    equipment: 'Barbell or Dumbbells',
    difficulty: 'intermediate',
    kcalPerMin: 8.0,
    defaultSets: 3,
    defaultReps: 10,
    imageUrl: gymImg,
    formCue: 'Push hips straight back like closing a car door while keeping lats tight.',
    instructions: [
      'Stand tall holding barbell at hip crease with soft, unlocked knees.',
      'Hinge hips backward while sliding the bar close along your thighs to mid-shin.',
      'Squeeze glutes to return upright once full hamstring tension is reached.',
    ],
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Wide-Grip Lat Pulldown',
    category: 'gym',
    muscleGroup: 'Latissimus Dorsi · Upper Back · Biceps',
    equipment: 'Cable Machine',
    difficulty: 'beginner',
    kcalPerMin: 6.5,
    defaultSets: 4,
    defaultReps: 12,
    imageUrl: gymImg,
    formCue: 'Lead the pull by driving elbows down toward your back pockets.',
    instructions: [
      'Grip the bar slightly wider than shoulder width and secure thighs under the pad.',
      'Depress scapulae first, then pull bar smoothly to upper sternum.',
      'Control the eccentric return all the way to overhead lat stretch.',
    ],
  },
  {
    id: 'ex-kb-goblet-squat',
    name: 'Kettlebell Goblet Squat',
    category: 'home',
    muscleGroup: 'Quads · Glutes · Upper Back',
    equipment: 'Kettlebell or Dumbbell',
    difficulty: 'beginner',
    kcalPerMin: 7.5,
    defaultSets: 3,
    defaultReps: 12,
    imageUrl: homeImg,
    formCue: 'Hold weight close to sternum so torso stays tall throughout the squat.',
    instructions: [
      'Cup kettlebell horns at chest height with elbows tucked downward.',
      'Lower hips cleanly between heels while keeping heels planted.',
      'Exhale and extend hips and knees evenly back to standing.',
    ],
  },
  {
    id: 'ex-pushup-tempo',
    name: 'Tempo Deficit Push-Ups',
    category: 'home',
    muscleGroup: 'Pectorals · Triceps · Anterior Core',
    equipment: 'Bodyweight Only',
    difficulty: 'beginner',
    kcalPerMin: 6.8,
    defaultSets: 4,
    defaultReps: 15,
    imageUrl: homeImg,
    formCue: 'Maintain a rigid plank line from ankles through shoulders.',
    instructions: [
      'Place hands slightly wider than shoulders and squeeze glutes and quads.',
      'Lower chest over a controlled 3-second count until 2 cm above the mat.',
      'Press forcefully back to full arm extension.',
    ],
  },
  {
    id: 'ex-bulgarian-split',
    name: 'Bulgarian Split Squat',
    category: 'home',
    muscleGroup: 'Glutes · Quadriceps · Hip Stabilizers',
    equipment: 'Bodyweight or Dumbbells',
    difficulty: 'intermediate',
    kcalPerMin: 8.2,
    defaultSets: 3,
    defaultReps: 10,
    imageUrl: homeImg,
    formCue: 'Slight forward torso lean increases glute recruitment.',
    instructions: [
      'Elevate rear instep on a bench or sturdy couch step behind you.',
      'Lower back knee toward the mat while keeping front shin stable.',
      'Press through front heel to stand tall; complete reps on both legs.',
    ],
  },
  {
    id: 'ex-band-face-pull',
    name: 'Resistance Band Rear-Delt Row',
    category: 'home',
    muscleGroup: 'Rear Delts · Rotator Cuff · Rhomboids',
    equipment: 'Resistance Bands',
    difficulty: 'beginner',
    kcalPerMin: 4.8,
    defaultSets: 3,
    defaultReps: 18,
    imageUrl: homeImg,
    formCue: 'Pull band apart toward temples while externally rotating thumbs.',
    instructions: [
      'Anchor resistance band at eye level and step back to establish tension.',
      'Pull handles toward forehead while flaring elbows high and wide.',
      'Pause 1 second at peak contraction before returning slowly.',
    ],
  },
  {
    id: 'ex-hiit-burpee-interval',
    name: 'Metabolic HIIT Circuit',
    category: 'cardio',
    muscleGroup: 'Full Body · Cardiovascular System',
    equipment: 'Bodyweight & Mat',
    difficulty: 'intermediate',
    kcalPerMin: 11.5,
    defaultSets: 5,
    defaultReps: 45,
    imageUrl: cardioImg,
    formCue: 'Keep landings quiet and rhythmic during 45s work / 15s recovery rounds.',
    instructions: [
      'Warm up joints for 3 minutes with jumping jacks and hip openers.',
      'Alternate 45 seconds of athletic burpees, mountain climbers, and high knees.',
      'Breathe nasally during 15-second transitions to regulate heart rate.',
    ],
  },
  {
    id: 'ex-jump-rope-conditioning',
    name: 'Jump Rope Speed Conditioning',
    category: 'cardio',
    muscleGroup: 'Calves · Forearms · Aerobic Capacity',
    equipment: 'Jump Rope',
    difficulty: 'beginner',
    kcalPerMin: 10.5,
    defaultSets: 6,
    defaultReps: 60,
    imageUrl: cardioImg,
    formCue: 'Rotate rope from wrists rather than shoulders with compact 2 cm hops.',
    instructions: [
      'Hold handles lightly at hip height with elbows tucked near ribs.',
      'Bounce lightly on the balls of your feet for 60-second rounds.',
      'Rest 30 seconds between sets to maintain crisp footwork.',
    ],
  },
  {
    id: 'ex-zone2-tempo-run',
    name: 'Zone 2 Aerobic Run',
    category: 'running_walking',
    muscleGroup: 'Aerobic Base · Lower Body Endurance',
    equipment: 'Running Shoes or Treadmill',
    difficulty: 'beginner',
    kcalPerMin: 10.0,
    defaultSets: 1,
    defaultReps: 35,
    imageUrl: cardioImg,
    formCue: 'Maintain a conversational cadence around 170 steps per minute.',
    instructions: [
      'Begin with a 5-minute brisk walk and dynamic leg swings.',
      'Settle into a sustainable conversational pace where full sentences are comfortable.',
      'Cool down with 3 minutes of easy walking and calf mobility.',
    ],
  },
  {
    id: 'ex-incline-power-walk',
    name: 'Incline Power Walk',
    category: 'running_walking',
    muscleGroup: 'Glutes · Calves · Low-Impact Fat Oxidation',
    equipment: 'Outdoor Hills or Treadmill',
    difficulty: 'beginner',
    kcalPerMin: 6.8,
    defaultSets: 1,
    defaultReps: 30,
    imageUrl: cardioImg,
    formCue: 'Swing arms naturally rather than holding onto treadmill rails.',
    instructions: [
      'Set treadmill incline between 8% and 12% at 4.8-5.5 km/h (or select a steady outdoor hill).',
      'Walk with upright posture and deliberate heel-to-toe roll.',
      'Sustain steady breathing for 30 minutes.',
    ],
  },
  {
    id: 'ex-interval-cycling',
    name: 'Endurance & Sprint Cycling Intervals',
    category: 'cycling',
    muscleGroup: 'Quadriceps · Hamstrings · VO2 Max',
    equipment: 'Road Bike or Stationary Spin Bike',
    difficulty: 'intermediate',
    kcalPerMin: 9.8,
    defaultSets: 8,
    defaultReps: 60,
    imageUrl: cardioImg,
    formCue: 'Keep upper body relaxed and drive smooth 360-degree pedal strokes.',
    instructions: [
      'Adjust saddle to hip-bone height so knee retains a slight 25-degree bend at bottom stroke.',
      'Spin 5 minutes easy at 85-90 RPM, then alternate 60s high resistance with 90s recovery.',
      'Finish with a 4-minute low-resistance flush spin.',
    ],
  },
  {
    id: 'ex-vinyasa-mobility-flow',
    name: 'Athletic Vinyasa & Thoracic Mobility',
    category: 'yoga',
    muscleGroup: 'Hip Flexors · Thoracic Spine · Core Stability',
    equipment: 'Yoga Mat',
    difficulty: 'beginner',
    kcalPerMin: 4.0,
    defaultSets: 1,
    defaultReps: 25,
    imageUrl: yogaImg,
    formCue: 'Synchronize slow 4-second inhales and 6-second exhales with each transition.',
    instructions: [
      'Flow from Downward Dog into World’s Greatest Lunge with thoracic rotation on both sides.',
      'Transition through Warrior II and Half Moon balance to build ankle and hip stability.',
      'Close with 3 minutes of Pigeon stretch and supine diaphragmatic breathing.',
    ],
  },
  {
    id: 'ex-evening-decompression',
    name: 'Evening Recovery & Hamstring Stretch',
    category: 'yoga',
    muscleGroup: 'Hamstrings · Lower Back · Parasympathetic Recovery',
    equipment: 'Yoga Mat',
    difficulty: 'beginner',
    kcalPerMin: 3.0,
    defaultSets: 1,
    defaultReps: 15,
    imageUrl: yogaImg,
    formCue: 'Never force end-range tension; melt deeper on each exhale.',
    instructions: [
      'Hold Cat-Cow spinal waves for 8 slow breaths.',
      'Perform 90/90 hip switches and seated hamstring fold for 60 seconds per side.',
      'Finish with Legs-Up-The-Wall posture to down-regulate heart rate before sleep.',
    ],
  },
];

export const FOOD_DATABASE: FoodCatalogItem[] = [
  {
    id: 'f-oats-whey',
    foodName: 'Rolled Oats with Whey Isolate & Blueberries',
    servingSize: '1 bowl (80g oats + 1 scoop)',
    calories: 430,
    proteinG: 34,
    carbsG: 56,
    fatG: 7,
    suggestedMeal: 'breakfast',
    dietTags: ['balanced', 'high_protein', 'vegetarian'],
  },
  {
    id: 'f-eggs-avocado-toast',
    foodName: '3 Pasture Eggs & Avocado on Sourdough',
    servingSize: '3 eggs + 1 slice + 1/2 avocado',
    calories: 465,
    proteinG: 24,
    carbsG: 28,
    fatG: 29,
    suggestedMeal: 'breakfast',
    dietTags: ['balanced', 'high_protein', 'vegetarian', 'mediterranean'],
  },
  {
    id: 'f-greek-yogurt-parfait',
    foodName: '0% Greek Yogurt, Chia Seeds & Walnuts',
    servingSize: '250g bowl',
    calories: 310,
    proteinG: 28,
    carbsG: 18,
    fatG: 13,
    suggestedMeal: 'breakfast',
    dietTags: ['balanced', 'high_protein', 'vegetarian', 'mediterranean'],
  },
  {
    id: 'f-tofu-scramble',
    foodName: 'Spiced Tofu Scramble with Spinach & Mushrooms',
    servingSize: '280g plate',
    calories: 295,
    proteinG: 25,
    carbsG: 12,
    fatG: 16,
    suggestedMeal: 'breakfast',
    dietTags: ['balanced', 'vegan', 'vegetarian', 'keto'],
  },
  {
    id: 'f-chicken-quinoa-bowl',
    foodName: 'Grilled Chicken Breast, Quinoa & Roasted Broccoli',
    servingSize: '180g chicken + 150g quinoa',
    calories: 540,
    proteinG: 52,
    carbsG: 54,
    fatG: 11,
    suggestedMeal: 'lunch',
    dietTags: ['balanced', 'high_protein', 'mediterranean'],
  },
  {
    id: 'f-salmon-sweet-potato',
    foodName: 'Wild Salmon Bowl with Sweet Potato & Edamame',
    servingSize: '170g fillet + 180g sides',
    calories: 610,
    proteinG: 44,
    carbsG: 48,
    fatG: 24,
    suggestedMeal: 'dinner',
    dietTags: ['balanced', 'high_protein', 'mediterranean'],
  },
  {
    id: 'f-paneer-tikka-salad',
    foodName: 'Grilled Paneer Tikka & Chickpea Power Bowl',
    servingSize: '320g bowl',
    calories: 515,
    proteinG: 31,
    carbsG: 39,
    fatG: 25,
    suggestedMeal: 'lunch',
    dietTags: ['balanced', 'high_protein', 'vegetarian'],
  },
  {
    id: 'f-lentil-dal-brown-rice',
    foodName: 'Yellow Moong Dal Tadka with Brown Basmati Rice',
    servingSize: '1 bowl dal + 150g rice',
    calories: 470,
    proteinG: 21,
    carbsG: 76,
    fatG: 8,
    suggestedMeal: 'lunch',
    dietTags: ['balanced', 'vegetarian', 'vegan'],
  },
  {
    id: 'f-turkey-wrap',
    foodName: 'Lean Turkey, Hummus & Greens Whole-Wheat Wrap',
    servingSize: '1 large wrap (240g)',
    calories: 420,
    proteinG: 36,
    carbsG: 42,
    fatG: 11,
    suggestedMeal: 'lunch',
    dietTags: ['balanced', 'high_protein'],
  },
  {
    id: 'f-sirloin-asparagus',
    foodName: 'Grass-Fed Sirloin Steak with Garlic Asparagus',
    servingSize: '200g steak + 120g greens',
    calories: 490,
    proteinG: 50,
    carbsG: 8,
    fatG: 28,
    suggestedMeal: 'dinner',
    dietTags: ['high_protein', 'keto', 'balanced'],
  },
  {
    id: 'f-tempeh-stir-fry',
    foodName: 'Sesame Ginger Tempeh & Bok Choy Stir-Fry',
    servingSize: '320g plate',
    calories: 455,
    proteinG: 30,
    carbsG: 38,
    fatG: 19,
    suggestedMeal: 'dinner',
    dietTags: ['vegan', 'vegetarian', 'high_protein', 'balanced'],
  },
  {
    id: 'f-cod-mediterranean',
    foodName: 'Baked White Cod, Olives, Couscous & Zucchini',
    servingSize: '200g fish + 140g sides',
    calories: 445,
    proteinG: 42,
    carbsG: 44,
    fatG: 10,
    suggestedMeal: 'dinner',
    dietTags: ['mediterranean', 'high_protein', 'balanced'],
  },
  {
    id: 'f-whey-shake',
    foodName: 'Whey Protein Shake in Water',
    servingSize: '1.5 scoops (45g)',
    calories: 175,
    proteinG: 36,
    carbsG: 4,
    fatG: 2,
    suggestedMeal: 'snack',
    dietTags: ['high_protein', 'balanced', 'vegetarian', 'keto'],
  },
  {
    id: 'f-plant-protein-banana',
    foodName: 'Pea & Rice Protein Smoothie with Banana',
    servingSize: '400ml shaker',
    calories: 255,
    proteinG: 27,
    carbsG: 30,
    fatG: 3,
    suggestedMeal: 'snack',
    dietTags: ['vegan', 'vegetarian', 'high_protein', 'balanced'],
  },
  {
    id: 'f-apple-almond-butter',
    foodName: 'Crisp Apple Slices & Natural Almond Butter',
    servingSize: '1 medium apple + 20g butter',
    calories: 215,
    proteinG: 5,
    carbsG: 26,
    fatG: 11,
    suggestedMeal: 'snack',
    dietTags: ['balanced', 'vegan', 'vegetarian', 'mediterranean'],
  },
  {
    id: 'f-cottage-cheese-berries',
    foodName: 'Low-Fat Cottage Cheese & Raspberries',
    servingSize: '200g cup',
    calories: 190,
    proteinG: 25,
    carbsG: 13,
    fatG: 4,
    suggestedMeal: 'snack',
    dietTags: ['high_protein', 'vegetarian', 'balanced'],
  },
  {
    id: 'f-roasted-almonds',
    foodName: 'Dry-Roasted Almonds & Sea Salt',
    servingSize: '30g handful',
    calories: 174,
    proteinG: 6,
    carbsG: 6,
    fatG: 15,
    suggestedMeal: 'snack',
    dietTags: ['keto', 'vegan', 'vegetarian', 'mediterranean', 'balanced'],
  },
  {
    id: 'f-boiled-eggs-snack',
    foodName: '2 Hard-Boiled Eggs with Black Pepper',
    servingSize: '2 large eggs',
    calories: 155,
    proteinG: 13,
    carbsG: 1,
    fatG: 11,
    suggestedMeal: 'snack',
    dietTags: ['keto', 'high_protein', 'vegetarian', 'balanced'],
  },
];

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getRecentDateKeys(daysCount: number, endDate: Date = new Date()): string[] {
  const result: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const dt = new Date(endDate);
    dt.setDate(endDate.getDate() - i);
    result.push(getLocalDateKey(dt));
  }
  return result;
}

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const hMeters = Math.max(0.8, heightCm / 100);
  const bmi = Math.round((weightKg / (hMeters * hMeters)) * 10) / 10;
  let category = 'Normal range';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Healthy weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese class';
  return { bmi, category };
}

export function calculatePersonalizedTargets(input: {
  age: number;
  gender: GenderOption;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  fitnessLevel: FitnessLevel;
  fitnessGoal: FitnessGoal;
  dietaryPreference: DietaryPreference;
}) {
  const genderOffset = input.gender === 'female' ? -161 : input.gender === 'male' ? 5 : -78;
  const bmr = 10 * input.currentWeightKg + 6.25 * input.heightCm - 5 * input.age + genderOffset;
  const activityMultiplier =
    input.fitnessLevel === 'advanced' ? 1.6 : input.fitnessLevel === 'intermediate' ? 1.48 : 1.35;
  const tdee = bmr * activityMultiplier;

  let calorieGoal = Math.round(tdee);
  if (input.fitnessGoal === 'lose_weight') calorieGoal = Math.round(tdee - 420);
  else if (input.fitnessGoal === 'build_muscle') calorieGoal = Math.round(tdee + 280);
  else if (input.fitnessGoal === 'recomp') calorieGoal = Math.round(tdee - 150);
  else if (input.fitnessGoal === 'endurance') calorieGoal = Math.round(tdee + 180);

  calorieGoal = Math.max(1350, Math.min(4800, calorieGoal));

  let proteinPerKg = 1.8;
  if (input.fitnessGoal === 'build_muscle' || input.fitnessGoal === 'recomp') proteinPerKg = 2.1;
  if (input.dietaryPreference === 'high_protein') proteinPerKg = 2.2;
  if (input.dietaryPreference === 'vegan' || input.dietaryPreference === 'vegetarian') {
    proteinPerKg = Math.min(proteinPerKg, 1.8);
  }

  const dailyProteinGoalG = Math.round(input.currentWeightKg * proteinPerKg);
  const proteinCals = dailyProteinGoalG * 4;

  let fatShare = 0.28;
  if (input.dietaryPreference === 'keto') fatShare = 0.65;
  else if (input.dietaryPreference === 'mediterranean') fatShare = 0.34;

  const dailyFatGoalG = Math.max(35, Math.round((calorieGoal * fatShare) / 9));
  const fatCals = dailyFatGoalG * 9;
  const remainingCals = Math.max(80, calorieGoal - proteinCals - fatCals);
  const dailyCarbsGoalG = Math.round(remainingCals / 4);

  const dailyStepsGoal =
    input.fitnessGoal === 'lose_weight' || input.fitnessGoal === 'endurance'
      ? 10500
      : input.fitnessLevel === 'beginner'
        ? 8000
        : 9500;

  const dailyWaterGoalMl = Math.round((input.currentWeightKg * 36) / 50) * 50;
  const dailySleepGoalHours = 8;
  const dailyActiveMinutesGoal =
    input.fitnessLevel === 'advanced' ? 60 : input.fitnessLevel === 'intermediate' ? 45 : 30;

  return {
    dailyCalorieGoal: calorieGoal,
    dailyProteinGoalG,
    dailyCarbsGoalG,
    dailyFatGoalG,
    dailyStepsGoal,
    dailyWaterGoalMl: Math.max(2000, Math.min(5000, dailyWaterGoalMl)),
    dailySleepGoalHours,
    dailyActiveMinutesGoal,
  };
}

export function computeDailyFitnessScore(params: {
  steps: number;
  stepsGoal: number;
  activeMinutes: number;
  activeGoal: number;
  waterMl: number;
  waterGoal: number;
  sleepHours: number;
  sleepGoal: number;
  caloriesConsumed: number;
  calorieGoal: number;
}): number {
  const stepRatio = Math.min(1, params.steps / Math.max(1, params.stepsGoal));
  const activeRatio = Math.min(1, params.activeMinutes / Math.max(1, params.activeGoal));
  const waterRatio = Math.min(1, params.waterMl / Math.max(1, params.waterGoal));
  const sleepRatio = Math.min(1, params.sleepHours / Math.max(1, params.sleepGoal));

  let nutritionRatio = 0;
  if (params.caloriesConsumed > 0) {
    const diff = Math.abs(params.caloriesConsumed - params.calorieGoal);
    nutritionRatio = Math.max(0.25, 1 - diff / Math.max(600, params.calorieGoal * 0.5));
  }

  const raw =
    stepRatio * 25 +
    activeRatio * 25 +
    waterRatio * 20 +
    sleepRatio * 15 +
    nutritionRatio * 15;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function createDefaultReminders(userId: string): ReminderSetting[] {
  return [
    { id: 'rem-workout', userId, category: 'workout', label: 'Evening Training Session', time24h: '18:00', enabled: true },
    { id: 'rem-water', userId, category: 'water', label: 'Midday Hydration Check (500 ml)', time24h: '13:30', enabled: true },
    { id: 'rem-meal', userId, category: 'meal', label: 'High-Protein Lunch Log', time24h: '12:30', enabled: true },
    { id: 'rem-sleep', userId, category: 'sleep', label: 'Wind-Down & Sleep Schedule', time24h: '22:30', enabled: true },
    { id: 'rem-goal', userId, category: 'goal', label: 'Evening Step & Goal Review', time24h: '20:30', enabled: true },
    { id: 'rem-motivation', userId, category: 'motivation', label: 'Morning Mindset Check-In', time24h: '08:00', enabled: true },
  ];
}

export function createEmptyDailyLog(userId: string, dateKey: string): DailyLog {
  return {
    id: dateKey,
    userId,
    dateKey,
    steps: 0,
    distanceKm: 0,
    caloriesBurned: 0,
    activeMinutes: 0,
    waterMl: 0,
    sleepHours: 0,
    sleepQuality: 'good',
    bedTime: '23:00',
    wakeTime: '07:00',
    restingHeartRateBpm: 0,
    fitnessScore: 0,
  };
}

/**
 * Generates realistic sample data EXCLUSIVELY for the interactive Demo Account.
 */
export function createDemoDataset() {
  const demoUid = 'demo_athlete';
  const baseInput = {
    age: 29,
    gender: 'male' as GenderOption,
    heightCm: 178,
    currentWeightKg: 79.4,
    targetWeightKg: 75.0,
    fitnessLevel: 'intermediate' as FitnessLevel,
    fitnessGoal: 'recomp' as FitnessGoal,
    dietaryPreference: 'high_protein' as DietaryPreference,
  };
  const targets = calculatePersonalizedTargets(baseInput);

  const profile: UserProfile = {
    userId: demoUid,
    name: 'Alex Rivera (Demo)',
    ...baseInput,
    workoutPreference: 'hybrid' as WorkoutPreference,
    equipment: ['dumbbells', 'barbell', 'kettlebells', 'pullup_bar', 'yoga_mat'],
    ...targets,
    onboardingCompleted: true,
  };

  const dates30 = getRecentDateKeys(30);
  const dailyLogs: Record<string, DailyLog> = {};
  const workouts: WorkoutEntry[] = [];
  const meals: MealEntry[] = [];
  const measurements: BodyMeasurement[] = [];

  dates30.forEach((dateKey, idx) => {
    const wave = Math.sin(idx * 0.65);
    const isRestDay = idx % 4 === 2;
    const steps = Math.round(8600 + wave * 2100 + (idx % 3) * 420);
    const distanceKm = Math.round((steps * 0.00076) * 10) / 10;
    const workoutMins = isRestDay ? 20 : 45 + (idx % 3) * 10;
    const workoutKcal = isRestDay ? 110 : 340 + (idx % 4) * 55;
    const caloriesBurned = Math.round(workoutKcal + steps * 0.038);
    const waterMl = Math.min(3500, 2250 + (idx % 5) * 250);
    const sleepHours = Math.round((7.1 + (idx % 4) * 0.35) * 10) / 10;
    const calsIn = targets.dailyCalorieGoal - 90 + ((idx % 5) - 2) * 65;

    const score = computeDailyFitnessScore({
      steps,
      stepsGoal: profile.dailyStepsGoal,
      activeMinutes: workoutMins,
      activeGoal: profile.dailyActiveMinutesGoal,
      waterMl,
      waterGoal: profile.dailyWaterGoalMl,
      sleepHours,
      sleepGoal: profile.dailySleepGoalHours,
      caloriesConsumed: calsIn,
      calorieGoal: profile.dailyCalorieGoal,
    });

    dailyLogs[dateKey] = {
      id: dateKey,
      userId: demoUid,
      dateKey,
      steps,
      distanceKm,
      caloriesBurned,
      activeMinutes: workoutMins,
      waterMl,
      sleepHours,
      sleepQuality: sleepHours >= 7.8 ? 'excellent' : sleepHours >= 7.2 ? 'good' : 'fair',
      bedTime: '22:45',
      wakeTime: '06:30',
      restingHeartRateBpm: 58 + (idx % 4),
      fitnessScore: score,
    };

    if (!isRestDay) {
      const catCycle: WorkoutCategory[] = ['gym', 'running_walking', 'home', 'cycling', 'gym', 'yoga'];
      const category = catCycle[idx % catCycle.length];
      const titleMap: Record<WorkoutCategory, string> = {
        gym: 'Upper Body Compound Strength',
        home: 'Kettlebell & Core Conditioning',
        cardio: 'Metabolic HIIT Intervals',
        running_walking: 'Zone 2 Morning Tempo Run',
        cycling: 'Threshold Spin Intervals',
        yoga: 'Thoracic & Hip Mobility Flow',
      };
      workouts.push({
        id: `demo-w-${dateKey}`,
        userId: demoUid,
        dateKey,
        category,
        title: titleMap[category],
        durationMin: workoutMins,
        caloriesBurned: workoutKcal,
        distanceKm: category === 'running_walking' ? 5.6 : category === 'cycling' ? 14.8 : 0,
        sets: category === 'gym' || category === 'home' ? 16 : 1,
        reps: category === 'gym' || category === 'home' ? 10 : workoutMins,
        weightKg: category === 'gym' ? 65 : category === 'home' ? 20 : 0,
        exercisesSummary:
          category === 'gym'
            ? 'Incline DB Press 4x10 · Barbell Row 4x8 · RDL 3x10 · Lat Pulldown 4x12'
            : category === 'home'
              ? 'Goblet Squat 4x12 · Tempo Push-Ups 4x15 · Split Squat 3x10'
              : 'Steady cadence aerobic session with structured warm-up and cool-down',
        notes: 'Sample demo session — strong bar speed and steady breathing.',
      });
    }

    // Populate recent 7 days of meals for rich nutrition history
    if (idx >= dates30.length - 7) {
      meals.push(
        {
          id: `demo-m1-${dateKey}`,
          userId: demoUid,
          dateKey,
          mealType: 'breakfast',
          foodName: 'Rolled Oats with Whey Isolate & Blueberries',
          servingSize: '1 bowl (80g oats + 1 scoop)',
          calories: 430,
          proteinG: 34,
          carbsG: 56,
          fatG: 7,
        },
        {
          id: `demo-m2-${dateKey}`,
          userId: demoUid,
          dateKey,
          mealType: 'lunch',
          foodName: 'Grilled Chicken Breast, Quinoa & Roasted Broccoli',
          servingSize: '180g chicken + 150g quinoa',
          calories: 540,
          proteinG: 52,
          carbsG: 54,
          fatG: 11,
        },
        {
          id: `demo-m3-${dateKey}`,
          userId: demoUid,
          dateKey,
          mealType: 'dinner',
          foodName: 'Wild Salmon Bowl with Sweet Potato & Edamame',
          servingSize: '170g fillet + 180g sides',
          calories: 610,
          proteinG: 44,
          carbsG: 48,
          fatG: 24,
        },
        {
          id: `demo-m4-${dateKey}`,
          userId: demoUid,
          dateKey,
          mealType: 'snack',
          foodName: '0% Greek Yogurt, Chia Seeds & Walnuts',
          servingSize: '250g bowl',
          calories: 310,
          proteinG: 28,
          carbsG: 18,
          fatG: 13,
        }
      );
    }

    // Weekly body transformation check-ins showing 81.6kg -> 79.4kg trend
    if (idx % 5 === 0 || idx === dates30.length - 1) {
      const progressFactor = idx / (dates30.length - 1);
      const weight = Math.round((81.6 - progressFactor * 2.2) * 10) / 10;
      const bf = Math.round((18.4 - progressFactor * 1.3) * 10) / 10;
      const { bmi } = calculateBMI(weight, profile.heightCm);
      measurements.push({
        id: `demo-meas-${dateKey}`,
        userId: demoUid,
        dateKey,
        weightKg: weight,
        bodyFatPct: bf,
        bmi,
        chestCm: Math.round((101.5 + progressFactor * 0.8) * 10) / 10,
        waistCm: Math.round((85.2 - progressFactor * 2.4) * 10) / 10,
        hipCm: Math.round((97.0 - progressFactor * 1.1) * 10) / 10,
        armCm: Math.round((36.4 + progressFactor * 0.5) * 10) / 10,
        note: idx === dates30.length - 1 ? 'Latest morning check-in (Demo sample)' : 'Routine weekly check-in',
        localPhotoId: '',
      });
    }
  });

  return {
    profile,
    dailyLogs,
    workouts: workouts.reverse(),
    meals: meals.reverse(),
    measurements: measurements.reverse(),
    reminders: createDefaultReminders(demoUid),
  };
}
