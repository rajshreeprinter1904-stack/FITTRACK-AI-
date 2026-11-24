import { jsPDF } from 'jspdf';
import type {
  BodyMeasurement,
  DailyLog,
  MealEntry,
  UserProfile,
  WorkoutEntry,
} from '../types/fitness';
import {
  calculateBMI,
  DIETARY_LABELS,
  FITNESS_GOAL_LABELS,
  getLocalDateKey,
  WORKOUT_CATEGORY_LABELS,
} from '../data/fitnessCatalog';

export function exportFitnessReportPDF(params: {
  profile: UserProfile;
  dailyLogs: DailyLog[];
  workouts: WorkoutEntry[];
  meals: MealEntry[];
  measurements: BodyMeasurement[];
  timeframeLabel: string;
  isDemo: boolean;
}) {
  const { profile, dailyLogs, workouts, meals, measurements, timeframeLabel, isDemo } = params;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 48;

  const ensureSpace = (needed: number) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 48;
    }
  };

  // Header Banner
  doc.setFillColor(12, 14, 18);
  doc.rect(0, 0, pageWidth, 94, 'F');
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FITTRACK AI', 40, 40);

  doc.setTextColor(244, 244, 245);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Track Every Day. Transform Your Life. — Comprehensive Performance & Transformation Report', 40, 58);
  doc.setTextColor(161, 161, 170);
  doc.text(
    `Generated: ${getLocalDateKey()}  |  Period: ${timeframeLabel}${isDemo ? '  |  Account: Demo Sample Data' : ''}`,
    40,
    75
  );

  y = 122;

  // Section 1: Athlete Profile & Daily Targets
  const { bmi, category: bmiCategory } = calculateBMI(profile.currentWeightKg, profile.heightCm);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Athlete Profile & Personalized Daily Targets', 40, y);
  y += 18;

  doc.setDrawColor(226, 232, 240);
  doc.line(40, y - 10, pageWidth - 40, y - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const profileLines = [
    `Name: ${profile.name}   |   Age: ${profile.age} yrs   |   Height: ${profile.heightCm} cm`,
    `Current Weight: ${profile.currentWeightKg} kg   |   Target Weight: ${profile.targetWeightKg} kg   |   BMI: ${bmi} (${bmiCategory})`,
    `Goal: ${FITNESS_GOAL_LABELS[profile.fitnessGoal]}   |   Level: ${profile.fitnessLevel}   |   Diet: ${DIETARY_LABELS[profile.dietaryPreference]}`,
    `Daily Targets: ${profile.dailyCalorieGoal} kcal (${profile.dailyProteinGoalG}g P / ${profile.dailyCarbsGoalG}g C / ${profile.dailyFatGoalG}g F)  |  ${profile.dailyStepsGoal.toLocaleString()} steps  |  ${profile.dailyWaterGoalMl} ml water  |  ${profile.dailySleepGoalHours}h sleep`,
  ];
  profileLines.forEach((line) => {
    doc.text(line, 40, y);
    y += 16;
  });

  y += 14;

  // Section 2: Period Averages
  const count = Math.max(1, dailyLogs.length);
  const avgScore = Math.round(dailyLogs.reduce((s, l) => s + l.fitnessScore, 0) / count);
  const avgSteps = Math.round(dailyLogs.reduce((s, l) => s + l.steps, 0) / count);
  const avgBurned = Math.round(dailyLogs.reduce((s, l) => s + l.caloriesBurned, 0) / count);
  const avgWater = Math.round(dailyLogs.reduce((s, l) => s + l.waterMl, 0) / count);
  const avgSleep = (dailyLogs.reduce((s, l) => s + l.sleepHours, 0) / count).toFixed(1);
  const totalWorkoutMins = workouts.reduce((s, w) => s + w.durationMin, 0);
  const totalMealCals = meals.reduce((s, m) => s + m.calories, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`2. Activity, Hydration & Recovery Summary (${dailyLogs.length} Logged Days)`, 40, y);
  y += 18;
  doc.line(40, y - 10, pageWidth - 40, y - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = [
    `Average Daily Fitness Score: ${avgScore} / 100`,
    `Average Daily Steps: ${avgSteps.toLocaleString()} steps   |   Average Calories Burned: ${avgBurned} kcal / day`,
    `Average Hydration: ${avgWater} ml / day   |   Average Sleep Duration: ${avgSleep} hrs / night`,
    `Logged Workouts in Period: ${workouts.length} sessions (${totalWorkoutMins} total active workout minutes)`,
    `Total Logged Nutrition Entries: ${meals.length} items (${totalMealCals.toLocaleString()} total kcal recorded)`,
  ];
  summaryLines.forEach((line) => {
    doc.text(line, 40, y);
    y += 16;
  });

  y += 14;
  ensureSpace(120);

  // Section 3: Recent Workouts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Recent Logged Workouts', 40, y);
  y += 18;
  doc.line(40, y - 10, pageWidth - 40, y - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  if (workouts.length === 0) {
    doc.text('No workout sessions logged in this period.', 40, y);
    y += 16;
  } else {
    workouts.slice(0, 12).forEach((w) => {
      ensureSpace(22);
      const line = `${w.dateKey}  |  ${WORKOUT_CATEGORY_LABELS[w.category]}  |  ${w.title}  —  ${w.durationMin} min, ${w.caloriesBurned} kcal${w.distanceKm > 0 ? `, ${w.distanceKm} km` : ''}`;
      doc.text(line.slice(0, 108), 40, y);
      y += 15;
    });
  }

  y += 14;
  ensureSpace(120);

  // Section 4: Body Transformation History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('4. Body Transformation & Anthropometric Check-Ins', 40, y);
  y += 18;
  doc.line(40, y - 10, pageWidth - 40, y - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  if (measurements.length === 0) {
    doc.text('No body measurement check-ins recorded yet.', 40, y);
    y += 16;
  } else {
    measurements.slice(0, 10).forEach((m) => {
      ensureSpace(20);
      doc.text(
        `${m.dateKey}  |  Weight: ${m.weightKg} kg  |  BMI: ${m.bmi}  |  Body Fat: ${m.bodyFatPct}%  |  Waist: ${m.waistCm} cm  |  Chest: ${m.chestCm} cm`,
        40,
        y
      );
      y += 15;
    });
  }

  // Footer note on measurement integrity
  ensureSpace(45);
  y += 16;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text(
    'Measurement Transparency: All FITTRACK AI metrics reflect user-logged workouts, meals, and manual vitals check-ins.',
    40,
    y
  );

  doc.save(`FITTRACK_AI_Report_${getLocalDateKey()}.pdf`);
}
