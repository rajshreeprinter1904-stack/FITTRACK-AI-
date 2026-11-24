import React, { useMemo, useState } from 'react';
import {
  Activity,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Moon,
  Plus,
  Send,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type { AIDailyInsights, AppSection, SleepQuality } from '../types/fitness';
import {
  computeDailyFitnessScore,
  FITNESS_GOAL_LABELS,
  getLocalDateKey,
  getRecentDateKeys,
} from '../data/fitnessCatalog';
import { BarComparisonChart, ProgressRing } from './InteractiveCharts';

export function HomeSection({ onNavigate }: { onNavigate: (section: AppSection) => void }) {
  const {
    profile,
    isDemo,
    selectedDate,
    setSelectedDate,
    dailyLogsMap,
    currentDayLog,
    meals,
    workouts,
    addWater,
    addSteps,
    updateDailyLogFields,
  } = useFitness();

  const [customWaterMl, setCustomWaterMl] = useState('350');
  const [manualStepsInput, setManualStepsInput] = useState('');
  const [heartRateInput, setHeartRateInput] = useState(
    currentDayLog.restingHeartRateBpm > 0 ? String(currentDayLog.restingHeartRateBpm) : ''
  );

  // Sleep form state synced when date changes
  const [sleepHours, setSleepHours] = useState<string>(
    currentDayLog.sleepHours > 0 ? String(currentDayLog.sleepHours) : '7.5'
  );
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(currentDayLog.sleepQuality);
  const [bedTime, setBedTime] = useState(currentDayLog.bedTime || '23:00');
  const [wakeTime, setWakeTime] = useState(currentDayLog.wakeTime || '07:00');

  // AI Coach state
  const [insights, setInsights] = useState<AIDailyInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachReply, setCoachReply] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const dateStrip = useMemo(() => getRecentDateKeys(7), []);
  const todayKey = getLocalDateKey();

  const dayMeals = useMemo(
    () => meals.filter((m) => m.dateKey === selectedDate),
    [meals, selectedDate]
  );

  const nutritionTotals = useMemo(
    () =>
      dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          proteinG: acc.proteinG + m.proteinG,
          carbsG: acc.carbsG + m.carbsG,
          fatG: acc.fatG + m.fatG,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      ),
    [dayMeals]
  );

  const liveFitnessScore = useMemo(() => {
    if (!profile) return 0;
    return computeDailyFitnessScore({
      steps: currentDayLog.steps,
      stepsGoal: profile.dailyStepsGoal,
      activeMinutes: currentDayLog.activeMinutes,
      activeGoal: profile.dailyActiveMinutesGoal,
      waterMl: currentDayLog.waterMl,
      waterGoal: profile.dailyWaterGoalMl,
      sleepHours: currentDayLog.sleepHours,
      sleepGoal: profile.dailySleepGoalHours,
      caloriesConsumed: nutritionTotals.calories,
      calorieGoal: profile.dailyCalorieGoal,
    });
  }, [currentDayLog, nutritionTotals.calories, profile]);

  const goalCompletionPct = useMemo(() => {
    if (!profile) return 0;
    const parts = [
      Math.min(1, currentDayLog.steps / Math.max(1, profile.dailyStepsGoal)),
      Math.min(1, currentDayLog.activeMinutes / Math.max(1, profile.dailyActiveMinutesGoal)),
      Math.min(1, currentDayLog.waterMl / Math.max(1, profile.dailyWaterGoalMl)),
      Math.min(1, currentDayLog.sleepHours / Math.max(1, profile.dailySleepGoalHours)),
      Math.min(1, nutritionTotals.calories / Math.max(1, profile.dailyCalorieGoal)),
    ];
    return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  }, [currentDayLog, nutritionTotals.calories, profile]);

  const recent7WorkoutsCount = useMemo(() => {
    const set7 = new Set(dateStrip);
    return workouts.filter((w) => set7.has(w.dateKey)).length;
  }, [dateStrip, workouts]);

  const sleepChartData = useMemo(
    () =>
      dateStrip.map((dk) => ({
        label: dk.slice(5),
        value: dailyLogsMap[dk]?.sleepHours ?? 0,
      })),
    [dailyLogsMap, dateStrip]
  );

  if (!profile) return null;

  const handleSelectDate = (dk: string) => {
    setSelectedDate(dk);
    const log = dailyLogsMap[dk];
    setSleepHours(log && log.sleepHours > 0 ? String(log.sleepHours) : '7.5');
    setSleepQuality(log?.sleepQuality ?? 'good');
    setBedTime(log?.bedTime ?? '23:00');
    setWakeTime(log?.wakeTime ?? '07:00');
    setHeartRateInput(log && log.restingHeartRateBpm > 0 ? String(log.restingHeartRateBpm) : '');
  };

  const handleSaveManualSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(manualStepsInput);
    if (Number.isNaN(val) || val < 0) return;
    const estKm = Math.round(val * 0.00076 * 100) / 100;
    await updateDailyLogFields(selectedDate, {
      steps: Math.round(val),
      distanceKm: Math.max(currentDayLog.distanceKm, estKm),
    });
    setManualStepsInput('');
  };

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDailyLogFields(selectedDate, {
      sleepHours: Number(sleepHours) || 0,
      sleepQuality,
      bedTime,
      wakeTime,
    });
  };

  const handleSaveHeartRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const bpm = Number(heartRateInput);
    if (Number.isNaN(bpm) || bpm < 30 || bpm > 220) return;
    await updateDailyLogFields(selectedDate, { restingHeartRateBpm: Math.round(bpm) });
  };

  const fetchDailyCoaching = async () => {
    setLoadingInsights(true);
    setInsightsError('');
    try {
      const resp = await fetch('/api/ai/daily-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          todayLog: { ...currentDayLog, fitnessScore: liveFitnessScore },
          nutritionTotals,
          recentWorkoutsCount: recent7WorkoutsCount,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to generate insights.');
      setInsights(data);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Unable to reach AI Coach.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const askCoach = async (promptText?: string) => {
    const q = (promptText ?? coachQuestion).trim();
    if (!q) return;
    setLoadingChat(true);
    setInsightsError('');
    try {
      const summaryContext = `Steps today: ${currentDayLog.steps}/${profile.dailyStepsGoal}, Water: ${currentDayLog.waterMl}/${profile.dailyWaterGoalMl}ml, Sleep: ${currentDayLog.sleepHours}h, Nutrition: ${nutritionTotals.calories}/${profile.dailyCalorieGoal} kcal (${nutritionTotals.proteinG}g protein), Workouts last 7d: ${recent7WorkoutsCount}.`;
      const resp = await fetch('/api/ai/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, profile, summaryContext }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Coach unavailable.');
      setCoachReply(data.reply);
      if (!promptText) setCoachQuestion('');
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Coach unavailable.');
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting + Horizontal 7-Day Date Scroller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {FITNESS_GOAL_LABELS[profile.fitnessGoal]} · {profile.currentWeightKg} kg current · {profile.targetWeightKg} kg target
            {isDemo ? ' · Demo Sample Account' : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Daily Performance Overview
          </h1>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {dateStrip.map((dk) => {
            const dt = new Date(`${dk}T12:00:00`);
            const dayShort = dt.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
            const dayNum = dk.slice(8);
            const active = dk === selectedDate;
            return (
              <button
                key={dk}
                type="button"
                onClick={() => handleSelectDate(dk)}
                className={`min-h-[44px] min-w-[52px] px-2.5 py-1.5 rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-zinc-950 font-semibold'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-80">{dk === todayKey ? 'Today' : dayShort}</span>
                <span className="font-mono tabular-nums text-xs mt-0.5">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Focal Anchor: Daily Fitness Score + Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing
            value={liveFitnessScore}
            max={100}
            size={144}
            strokeWidth={11}
            label={`${liveFitnessScore}`}
            sublabel="Fitness Score"
          />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Daily Goal Completion</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                {goalCompletionPct}% <span className="text-xs font-normal text-zinc-500">on {selectedDate}</span>
              </p>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Weighted across logged steps (25%), active minutes (25%), hydration (20%), sleep duration (15%), and calorie target adherence (15%).
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('workout')}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log Workout
              </button>
              <button
                type="button"
                onClick={() => onNavigate('nutrition')}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log Meal
              </button>
            </div>
          </div>
        </div>

        {/* 4 Key Daily Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Steps Logged</span>
              <Footprints className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-3">
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                {currentDayLog.steps.toLocaleString()}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
                / {profile.dailyStepsGoal.toLocaleString()} · {currentDayLog.distanceKm} km
              </p>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((currentDayLog.steps / profile.dailyStepsGoal) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Active Burn</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-3">
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                {currentDayLog.caloriesBurned.toLocaleString()}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
                kcal · {currentDayLog.activeMinutes}/{profile.dailyActiveMinutesGoal} min
              </p>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((currentDayLog.activeMinutes / profile.dailyActiveMinutesGoal) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Calories In</span>
              <Utensils className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-3">
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                {nutritionTotals.calories.toLocaleString()}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
                / {profile.dailyCalorieGoal} kcal · {nutritionTotals.proteinG}g P
              </p>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((nutritionTotals.calories / profile.dailyCalorieGoal) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-medium">Water Intake</span>
              <Droplets className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="my-3">
              <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                {(currentDayLog.waterMl / 1000).toFixed(2)}L
              </p>
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
                {currentDayLog.waterMl} / {profile.dailyWaterGoalMl} ml
              </p>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((currentDayLog.waterMl / profile.dailyWaterGoalMl) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick Trackers: Steps + Hydration + Sleep & Manual Heart Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Steps & Activity Quick-Log */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Steps & Movement</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Manual step entry · Establishes distance & NEAT burn</p>
            </div>
            <Footprints className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2500].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => addSteps(inc)}
                className="min-h-[44px] px-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-mono tabular-nums font-medium transition-colors cursor-pointer"
              >
                +{inc.toLocaleString()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveManualSteps} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={200000}
              value={manualStepsInput}
              onChange={(e) => setManualStepsInput(e.target.value)}
              placeholder="Set exact daily steps..."
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              Save
            </button>
          </form>

          {/* Manual Resting Heart Rate Check-In */}
          <form onSubmit={handleSaveHeartRate} className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-500" />
                Manual Resting Heart Rate
              </span>
              <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {currentDayLog.restingHeartRateBpm > 0 ? `${currentDayLog.restingHeartRateBpm} bpm` : 'Not logged'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                max={220}
                value={heartRateInput}
                onChange={(e) => setHeartRateInput(e.target.value)}
                placeholder="Enter pulse check-in (bpm)"
                className="flex-1 h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="min-h-[40px] px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log BPM
              </button>
            </div>
          </form>
        </div>

        {/* 2. One-Tap Hydration Tracker */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">One-Tap Hydration</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentDayLog.waterMl} ml of {profile.dailyWaterGoalMl} ml goal
              </p>
            </div>
            <Droplets className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Glass', ml: 250 },
              { label: 'Bottle', ml: 500 },
              { label: 'Flask', ml: 750 },
            ].map((vessel) => (
              <button
                key={vessel.ml}
                type="button"
                onClick={() => addWater(vessel.ml)}
                className="min-h-[54px] px-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/10 flex flex-col items-center justify-center transition-colors cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{vessel.label}</span>
                <span className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{vessel.ml} ml
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={50}
              max={3000}
              step={50}
              value={customWaterMl}
              onChange={(e) => setCustomWaterMl(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Custom water size in ml"
            />
            <button
              type="button"
              onClick={() => addWater(Math.max(50, Number(customWaterMl) || 250))}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom ml
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span>Remaining today</span>
            <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.max(0, profile.dailyWaterGoalMl - currentDayLog.waterMl)} ml
            </span>
          </div>
        </div>

        {/* 3. Sleep Duration, Schedule & Quality Tracker */}
        <form
          onSubmit={handleSaveSleep}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Sleep & Recovery</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Target {profile.dailySleepGoalHours}h · Logged {currentDayLog.sleepHours}h ({currentDayLog.sleepQuality})
              </p>
            </div>
            <Moon className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Hours Slept</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={24}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Quality</label>
              <select
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value as SleepQuality)}
                className="w-full h-10 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Bedtime</label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Wake Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[42px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save Sleep Log
          </button>
        </form>
      </div>

      {/* AI Fitness Coach + 7-Day Sleep History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                AI Personal Fitness Coach
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Analyzes your logged steps, workouts, macros, hydration, and sleep to calibrate daily adjustments.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDailyCoaching}
              disabled={loadingInsights}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {loadingInsights ? 'Analyzing Progress...' : 'Generate Daily AI Insights'}
            </button>
          </div>

          {insightsError && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-3.5 py-2.5">
              {insightsError}
            </p>
          )}

          {insights ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Daily Coach Mindset & Priority Improvement
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{insights.motivationalMessage}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5">{insights.dailyImprovementTip}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-1">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                  Workout Adjustment
                </p>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">{insights.workoutAdjustment}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-1">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-emerald-500" />
                  Nutrition & Sleep Recovery
                </p>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {insights.nutritionFeedback} {insights.sleepRecommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-xs text-zinc-500 dark:text-zinc-400">
              Select <strong>Generate Daily AI Insights</strong> for personalized workout adjustments, macro guidance, and sleep recovery tips based on today&apos;s numbers, or ask a question below.
            </div>
          )}

          {/* Quick Coach Prompts + Q&A Input */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap gap-2">
              {[
                'Adjust today’s workout for a 25-min busy schedule',
                'Suggest a high-protein snack to hit my goal',
                'How can I improve my sleep recovery tonight?',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => askCoach(preset)}
                  disabled={loadingChat}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-xs text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askCoach();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={coachQuestion}
                onChange={(e) => setCoachQuestion(e.target.value)}
                placeholder="Ask your AI Coach about exercises, plateaus, macros, or recovery..."
                className="flex-1 h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={loadingChat || !coachQuestion.trim()}
                className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loadingChat ? 'Thinking...' : 'Ask Coach'}
              </button>
            </form>

            {coachReply && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                {coachReply}
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Sleep History & Hygiene */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">7-Day Sleep History</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Schedule: {currentDayLog.bedTime} – {currentDayLog.wakeTime} · Goal {profile.dailySleepGoalHours}h
            </p>
          </div>

          <BarComparisonChart
            data={sleepChartData}
            unit="h"
            goal={profile.dailySleepGoalHours}
            height={155}
          />

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-200">Sleep Optimization Protocol</p>
            <p className="leading-relaxed">
              {currentDayLog.sleepHours > 0 && currentDayLog.sleepHours < 7
                ? 'Under 7 hours logged: keep caffeine before 14:00, dim overhead screens 60 min before bed, and reduce training RPE by 1 point today.'
                : 'Maintain consistent wake times within 30 minutes daily and cool bedroom temperature (18-19°C) to support deep slow-wave recovery.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
