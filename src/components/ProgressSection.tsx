import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Check, Download, Plus, Scale, Trash2 } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { calculateBMI, getLocalDateKey, getRecentDateKeys } from '../data/fitnessCatalog';
import {
  compressImageFileToDataUrl,
  loadLocalProgressPhotos,
  removeLocalProgressPhoto,
  saveLocalProgressPhoto,
  type StoredProgressPhoto,
} from '../lib/photoStorage';
import { exportFitnessReportPDF } from '../lib/pdfExport';
import { BarComparisonChart, type ChartPoint, TrendAreaChart } from './InteractiveCharts';

type ReportTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function ProgressSection() {
  const {
    profile,
    isDemo,
    selectedDate,
    dailyLogsMap,
    workouts,
    meals,
    measurements,
    addMeasurement,
    deleteMeasurement,
  } = useFitness();

  const [timeframe, setTimeframe] = useState<ReportTimeframe>('monthly');

  // Measurement check-in state
  const [weightKg, setWeightKg] = useState(String(profile?.currentWeightKg ?? 74));
  const [bodyFatPct, setBodyFatPct] = useState('17.5');
  const [chestCm, setChestCm] = useState('100');
  const [waistCm, setWaistCm] = useState('82');
  const [hipCm, setHipCm] = useState('96');
  const [armCm, setArmCm] = useState('36');
  const [measNote, setMeasNote] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  // Progress photos (stored privately on device)
  const [photos, setPhotos] = useState<StoredProgressPhoto[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setWeightKg(String(profile.currentWeightKg));
      setPhotos(loadLocalProgressPhotos(profile.userId));
    }
  }, [profile]);

  const dateKeysInWindow = useMemo(() => {
    if (timeframe === 'daily') return [selectedDate];
    if (timeframe === 'weekly') return getRecentDateKeys(7);
    if (timeframe === 'monthly') return getRecentDateKeys(30);
    return getRecentDateKeys(365);
  }, [selectedDate, timeframe]);

  // Aggregate points cleanly (monthly buckets for yearly view, daily points otherwise)
  const bucketedSeries = useMemo(() => {
    if (timeframe !== 'yearly') {
      return dateKeysInWindow.map((dk) => {
        const log = dailyLogsMap[dk];
        const dayMealsKcal = meals
          .filter((m) => m.dateKey === dk)
          .reduce((s, m) => s + m.calories, 0);
        const dayWorkoutMins = workouts
          .filter((w) => w.dateKey === dk)
          .reduce((s, w) => s + w.durationMin, 0);
        return {
          label: timeframe === 'daily' ? dk : dk.slice(5),
          fitnessScore: log?.fitnessScore ?? 0,
          steps: log?.steps ?? 0,
          caloriesBurned: log?.caloriesBurned ?? 0,
          waterMl: log?.waterMl ?? 0,
          sleepHours: log?.sleepHours ?? 0,
          nutritionKcal: dayMealsKcal,
          workoutMins: dayWorkoutMins || (log?.activeMinutes ?? 0),
        };
      });
    }

    // Group 365 days by YYYY-MM (12 months)
    const monthBuckets = new Map<
      string,
      {
        count: number;
        scoreSum: number;
        stepsSum: number;
        burnedSum: number;
        waterSum: number;
        sleepSum: number;
        kcalInSum: number;
        workoutMinsSum: number;
      }
    >();

    dateKeysInWindow.forEach((dk) => {
      const ym = dk.slice(0, 7);
      const curr = monthBuckets.get(ym) ?? {
        count: 0,
        scoreSum: 0,
        stepsSum: 0,
        burnedSum: 0,
        waterSum: 0,
        sleepSum: 0,
        kcalInSum: 0,
        workoutMinsSum: 0,
      };
      const log = dailyLogsMap[dk];
      const dayMealsKcal = meals
        .filter((m) => m.dateKey === dk)
        .reduce((s, m) => s + m.calories, 0);
      const dayWorkoutMins = workouts
        .filter((w) => w.dateKey === dk)
        .reduce((s, w) => s + w.durationMin, 0);

      if (log || dayMealsKcal > 0 || dayWorkoutMins > 0) {
        curr.count += 1;
        curr.scoreSum += log?.fitnessScore ?? 0;
        curr.stepsSum += log?.steps ?? 0;
        curr.burnedSum += log?.caloriesBurned ?? 0;
        curr.waterSum += log?.waterMl ?? 0;
        curr.sleepSum += log?.sleepHours ?? 0;
        curr.kcalInSum += dayMealsKcal;
        curr.workoutMinsSum += dayWorkoutMins || (log?.activeMinutes ?? 0);
      }
      monthBuckets.set(ym, curr);
    });

    return Array.from(monthBuckets.entries()).map(([ym, b]) => {
      const div = Math.max(1, b.count);
      return {
        label: ym.slice(2),
        fitnessScore: b.count ? Math.round(b.scoreSum / div) : 0,
        steps: b.count ? Math.round(b.stepsSum / div) : 0,
        caloriesBurned: b.count ? Math.round(b.burnedSum / div) : 0,
        waterMl: b.count ? Math.round(b.waterSum / div) : 0,
        sleepHours: b.count ? Math.round((b.sleepSum / div) * 10) / 10 : 0,
        nutritionKcal: b.count ? Math.round(b.kcalInSum / div) : 0,
        workoutMins: b.workoutMinsSum,
      };
    });
  }, [dailyLogsMap, dateKeysInWindow, meals, timeframe, workouts]);

  const weightChartData: ChartPoint[] = useMemo(() => {
    const asc = [...measurements].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return asc.map((m) => ({
      label: m.dateKey.slice(5),
      value: m.weightKg,
    }));
  }, [measurements]);

  if (!profile) return null;

  const { bmi, category: bmiCategory } = calculateBMI(profile.currentWeightKg, profile.heightCm);
  const latestMeas = measurements[0];

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMeasurement({
      dateKey: getLocalDateKey(),
      weightKg: Number(weightKg) || profile.currentWeightKg,
      bodyFatPct: Number(bodyFatPct) || 0,
      chestCm: Number(chestCm) || 0,
      waistCm: Number(waistCm) || 0,
      hipCm: Number(hipCm) || 0,
      armCm: Number(armCm) || 0,
      note: measNote.trim(),
      localPhotoId: '',
    });
    setMeasNote('');
    setSavedNotice('Body measurement check-in recorded and weight synced.');
    setTimeout(() => setSavedNotice(''), 3200);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 600);
      const item: StoredProgressPhoto = {
        id: `photo-${Date.now()}`,
        userId: profile.userId,
        dateKey: getLocalDateKey(),
        weightKg: profile.currentWeightKg,
        caption: photoCaption.trim() || `${profile.currentWeightKg} kg check-in`,
        dataUrl,
      };
      saveLocalProgressPhoto(item);
      setPhotos(loadLocalProgressPhotos(profile.userId));
      setPhotoCaption('');
      setSavedNotice('Progress photo saved privately on your device.');
      setTimeout(() => setSavedNotice(''), 3200);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = (id: string) => {
    removeLocalProgressPhoto(id);
    setPhotos(loadLocalProgressPhotos(profile.userId));
  };

  const handleExportPDF = () => {
    const windowSet = new Set(dateKeysInWindow);
    const logsInPeriod = Object.values(dailyLogsMap).filter((l) => windowSet.has(l.dateKey));
    const workoutsInPeriod = workouts.filter((w) => windowSet.has(w.dateKey));
    const mealsInPeriod = meals.filter((m) => windowSet.has(m.dateKey));
    exportFitnessReportPDF({
      profile,
      dailyLogs: logsInPeriod,
      workouts: workoutsInPeriod,
      meals: mealsInPeriod,
      measurements,
      timeframeLabel: timeframe.toUpperCase(),
      isDemo,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Timeframe Filter + PDF Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Interactive Analytics · Anthropometrics · Transformation Journal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Progress & Performance Reports
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {(
              [
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {savedNotice}
        </div>
      )}

      {/* Anthropometrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Weight', val: `${profile.currentWeightKg} kg` },
          { label: 'Target', val: `${profile.targetWeightKg} kg` },
          { label: 'Height', val: `${profile.heightCm} cm` },
          { label: 'BMI', val: `${bmi} (${bmiCategory.split(' ')[0]})` },
          { label: 'Body Fat', val: latestMeas?.bodyFatPct ? `${latestMeas.bodyFatPct}%` : '—' },
          { label: 'Chest', val: latestMeas?.chestCm ? `${latestMeas.chestCm} cm` : '—' },
          { label: 'Waist', val: latestMeas?.waistCm ? `${latestMeas.waistCm} cm` : '—' },
          { label: 'Hip / Arm', val: latestMeas?.hipCm ? `${latestMeas.hipCm}/${latestMeas.armCm} cm` : '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-3.5"
          >
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">{stat.label}</span>
            <strong className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-0.5 block truncate">
              {stat.val}
            </strong>
          </div>
        ))}
      </div>

      {/* Primary Charts Grid (8 Interactive Reports) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Weight Transformation Graph</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Logged check-ins vs {profile.targetWeightKg} kg target
            </p>
          </div>
          <TrendAreaChart
            data={weightChartData}
            unit="kg"
            targetLine={profile.targetWeightKg}
            emptyMessage="Log your weight below to start your transformation curve."
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Fitness Score Trends ({timeframe})</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Composite daily habit and training adherence</p>
          </div>
          <TrendAreaChart
            data={bucketedSeries.map((d) => ({ label: d.label, value: d.fitnessScore }))}
            unit="pts"
            targetLine={85}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Daily Steps Trajectory</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Goal: {profile.dailyStepsGoal.toLocaleString()} steps/day
            </p>
          </div>
          <TrendAreaChart
            data={bucketedSeries.map((d) => ({ label: d.label, value: d.steps }))}
            unit="steps"
            targetLine={profile.dailyStepsGoal}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Calories Burned & Workout Performance</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Active expenditure across workouts and movement</p>
          </div>
          <TrendAreaChart
            data={bucketedSeries.map((d) => ({ label: d.label, value: d.caloriesBurned }))}
            unit="kcal"
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Nutrition Intake Progress</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Logged meal calories vs {profile.dailyCalorieGoal} kcal target
            </p>
          </div>
          <BarComparisonChart
            data={bucketedSeries.slice(-10).map((d) => ({ label: d.label, value: d.nutritionKcal }))}
            unit=" kcal"
            goal={profile.dailyCalorieGoal}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Hydration & Sleep Consistency</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Water intake (ml) & active minutes ({bucketedSeries.reduce((s, x) => s + x.workoutMins, 0)} total min)
            </p>
          </div>
          <BarComparisonChart
            data={bucketedSeries.slice(-10).map((d) => ({ label: d.label, value: d.waterMl }))}
            unit=" ml"
            goal={profile.dailyWaterGoalMl}
          />
        </div>
      </div>

      {/* Body Measurements Logger + Progress Photos Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveMeasurement}
          className="lg:col-span-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Log Body Measurements</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Updates current weight, BMI, body fat %, and circumference history
              </p>
            </div>
            <Scale className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min={25}
                max={400}
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={70}
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={300}
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={300}
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Hip (cm)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={300}
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Arm (cm)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={150}
                value={armCm}
                onChange={(e) => setArmCm(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <input
            type="text"
            maxLength={280}
            value={measNote}
            onChange={(e) => setMeasNote(e.target.value)}
            placeholder="Check-in note (e.g., Morning fasted weigh-in)..."
            className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
          />

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Save Body Check-In
          </button>

          {measurements.length > 0 && (
            <div className="max-h-[180px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 pt-2">
              {measurements.slice(0, 8).map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                    {m.dateKey} · <strong>{m.weightKg} kg</strong> · BMI {m.bmi}
                    {m.waistCm > 0 ? ` · Waist ${m.waistCm}cm` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMeasurement(m.id)}
                    aria-label="Delete check-in"
                    className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Progress Photos Journal */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Transformation Progress Photos</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Encrypted & stored locally in your browser for complete visual privacy
              </p>
            </div>
            <Camera className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="Pose or milestone caption (e.g., Week 4 Front Relaxed)"
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
            <label className="min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
              <Camera className="w-4 h-4" />
              {uploadingPhoto ? 'Processing...' : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Upload front, side, or back check-in photos to compare visual body composition alongside scale weight.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[290px] overflow-y-auto pr-1">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-950 relative group"
                >
                  <img
                    src={p.dataUrl}
                    alt={p.caption}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-2 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1">
                    <div className="truncate">
                      <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {p.caption}
                      </p>
                      <p className="text-[10px] font-mono tabular-nums text-zinc-500">
                        {p.dateKey} · {p.weightKg} kg
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      aria-label="Delete photo"
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
