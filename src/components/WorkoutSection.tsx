import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type { AIWorkoutPlan, ExerciseCatalogItem, WorkoutCategory } from '../types/fitness';
import {
  EXERCISE_LIBRARY,
  getRecentDateKeys,
  WORKOUT_CATEGORY_LABELS,
} from '../data/fitnessCatalog';
import { ResilientImage } from './InteractiveCharts';

type WorkoutSubTab = 'log' | 'library' | 'ai_plan' | 'history';

export function WorkoutSection() {
  const { profile, selectedDate, workouts, addWorkout, deleteWorkout } = useFitness();
  const [subTab, setSubTab] = useState<WorkoutSubTab>('log');

  // Logger state
  const [category, setCategory] = useState<WorkoutCategory>('gym');
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState('45');
  const [caloriesBurned, setCaloriesBurned] = useState('320');
  const [distanceKm, setDistanceKm] = useState('0');
  const [sets, setSets] = useState('12');
  const [reps, setReps] = useState('10');
  const [weightKg, setWeightKg] = useState('40');
  const [exercisesSummary, setExercisesSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [savedBanner, setSavedBanner] = useState('');

  // Live Workout Stopwatch
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Exercise Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | WorkoutCategory>('all');
  const [expandedExId, setExpandedExId] = useState<string | null>(null);

  // AI Workout Plan Generator
  const [focusNote, setFocusNote] = useState('');
  const [aiPlan, setAiPlan] = useState<AIWorkoutPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // History range filter
  const [historyRange, setHistoryRange] = useState<'7d' | '30d' | 'all'>('30d');

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesCat = catFilter === 'all' || ex.category === catFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesText =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [catFilter, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (historyRange === 'all') return workouts;
    const days = historyRange === '7d' ? 7 : 30;
    const validDates = new Set(getRecentDateKeys(days));
    return workouts.filter((w) => validDates.has(w.dateKey));
  }, [historyRange, workouts]);

  const historyStats = useMemo(() => {
    return filteredHistory.reduce(
      (acc, w) => ({
        sessions: acc.sessions + 1,
        minutes: acc.minutes + w.durationMin,
        calories: acc.calories + w.caloriesBurned,
        distance: Math.round((acc.distance + w.distanceKm) * 10) / 10,
      }),
      { sessions: 0, minutes: 0, calories: 0, distance: 0 }
    );
  }, [filteredHistory]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleSubmitWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    await addWorkout({
      dateKey: selectedDate,
      category,
      title: title.trim() || WORKOUT_CATEGORY_LABELS[category],
      durationMin: Number(durationMin) || 30,
      caloriesBurned: Number(caloriesBurned) || 200,
      distanceKm: Number(distanceKm) || 0,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weightKg: Number(weightKg) || 0,
      exercisesSummary: exercisesSummary.trim(),
      notes: notes.trim(),
    });
    setTitle('');
    setExercisesSummary('');
    setNotes('');
    setSavedBanner('Workout session saved to history and synced with today’s active burn.');
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const quickLogFromLibrary = async (ex: ExerciseCatalogItem) => {
    const dur = ex.category === 'running_walking' || ex.category === 'cycling' ? ex.defaultReps : 20;
    const estKcal = Math.round(dur * ex.kcalPerMin);
    await addWorkout({
      dateKey: selectedDate,
      category: ex.category,
      title: ex.name,
      durationMin: dur,
      caloriesBurned: estKcal,
      distanceKm: ex.category === 'running_walking' ? 4.2 : ex.category === 'cycling' ? 11.0 : 0,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
      weightKg: 0,
      exercisesSummary: `${ex.name}: ${ex.defaultSets} sets x ${ex.defaultReps} reps`,
      notes: `Logged from Exercise Library`,
    });
    setSavedBanner(`Added "${ex.name}" (${estKcal} kcal) to ${selectedDate}.`);
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const generateAIPlan = async () => {
    if (!profile) return;
    setLoadingPlan(true);
    setPlanError('');
    try {
      const recent7 = new Set(getRecentDateKeys(7));
      const recentWorkoutsCount = workouts.filter((w) => recent7.has(w.dateKey)).length;
      const resp = await fetch('/api/ai/workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, recentWorkoutsCount, focusNote }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not generate workout plan.');
      setAiPlan(data);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'AI plan generation failed.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const logAISession = async (session: AIWorkoutPlan['sessions'][number]) => {
    const validCats: WorkoutCategory[] = ['gym', 'home', 'cardio', 'running_walking', 'cycling', 'yoga'];
    const safeCat: WorkoutCategory = validCats.includes(session.category) ? session.category : 'gym';
    const summary = session.exercises
      .map((e) => `${e.name} (${e.sets}x${e.reps})`)
      .join(' · ')
      .slice(0, 1000);
    await addWorkout({
      dateKey: selectedDate,
      category: safeCat,
      title: session.sessionTitle,
      durationMin: session.durationMin || 45,
      caloriesBurned: session.estimatedCalories || 300,
      distanceKm: 0,
      sets: session.exercises.reduce((s, e) => s + (Number(e.sets) || 3), 0),
      reps: 10,
      weightKg: 0,
      exercisesSummary: summary,
      notes: `Completed from AI Plan: ${aiPlan?.planTitle || ''}`,
    });
    setSavedBanner(`Logged "${session.sessionTitle}" to ${selectedDate}.`);
    setTimeout(() => setSavedBanner(''), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gym · Home · Cardio · Running & Walking · Cycling · Yoga & Mobility
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Training & Exercise Hub
          </h1>
        </div>

        {/* Functional Segmented Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'log', label: 'Log Workout' },
            { id: 'library', label: 'Exercise Library' },
            { id: 'ai_plan', label: 'AI Plan Coach' },
            { id: 'history', label: 'History' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as WorkoutSubTab)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === t.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {savedBanner && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {savedBanner}
        </div>
      )}

      {/* 1. LOG WORKOUT SESSION */}
      {subTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmitWorkout}
            className="lg:col-span-8 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-5"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Record Workout or Cardio Session ({selectedDate})
            </h2>

            {/* Category Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(WORKOUT_CATEGORY_LABELS) as WorkoutCategory[]).map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                    }`}
                  >
                    {WORKOUT_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g., ${WORKOUT_CATEGORY_LABELS[category]} Session`}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  required
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Estimated Calories Burned (kcal)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  required
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                />
              </div>

              {(category === 'running_walking' || category === 'cycling' || category === 'cardio') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Distance Covered (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={500}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                  />
                </div>
              )}

              <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Total Sets
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Avg Reps
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Top Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={1000}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Exercises Breakdown (Sets x Reps @ Weight)
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={exercisesSummary}
                  onChange={(e) => setExercisesSummary(e.target.value)}
                  placeholder="e.g., Barbell Squat 4x8 @ 80kg · RDL 3x10 @ 70kg · Plank 3x60s"
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Session Notes (optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="RPE, energy levels, or personal record notes..."
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Save Workout Session
            </button>
          </form>

          {/* Live Session Stopwatch Helper */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Session Stopwatch</h3>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="py-4 text-center rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-4xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                  {formatTimer(elapsedSec)}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1">Track live workout or rest intervals</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setElapsedSec(0);
                  }}
                  className="min-h-[44px] rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              {elapsedSec >= 60 && (
                <button
                  type="button"
                  onClick={() => setDurationMin(String(Math.max(1, Math.round(elapsedSec / 60))))}
                  className="w-full min-h-[40px] rounded-xl border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/10 cursor-pointer"
                >
                  Apply {Math.max(1, Math.round(elapsedSec / 60))} min to Form Duration
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">30-Day Training Volume</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {historyStats.sessions} sessions · {historyStats.minutes} min · {historyStats.calories.toLocaleString()} kcal
              </p>
              <button
                type="button"
                onClick={() => setSubTab('library')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1 inline-block cursor-pointer"
              >
                Browse Exercise Library with Form Guides →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXERCISE LIBRARY WITH IMAGES & INSTRUCTIONS */}
      {subTab === 'library' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises, target muscles, or equipment..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setCatFilter('all')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  catFilter === 'all'
                    ? 'bg-emerald-500 text-zinc-950 font-semibold'
                    : 'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                All Categories
              </button>
              {(Object.keys(WORKOUT_CATEGORY_LABELS) as WorkoutCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFilter(c)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                    catFilter === c
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {WORKOUT_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExercises.map((ex) => {
              const isOpen = expandedExId === ex.id;
              return (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      <ResilientImage
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{WORKOUT_CATEGORY_LABELS[ex.category]}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{ex.difficulty}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{ex.kcalPerMin} kcal/min</span>
                      </p>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">{ex.name}</h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {ex.muscleGroup} · {ex.equipment}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        Cue: {ex.formCue}
                      </p>

                      {isOpen && (
                        <ol className="list-decimal list-inside space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                          {ex.instructions.map((stepText, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {stepText}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedExId(isOpen ? null : ex.id)}
                      className="flex-1 min-h-[42px] px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium whitespace-nowrap cursor-pointer"
                    >
                      {isOpen ? 'Hide Instructions' : 'Instructions'}
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogFromLibrary(ex)}
                      className="flex-1 min-h-[42px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs whitespace-nowrap cursor-pointer"
                    >
                      Quick Log ({ex.defaultSets}x{ex.defaultReps})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. AI WORKOUT PLAN GENERATOR */}
      {subTab === 'ai_plan' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  AI Personalized Training Split
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Calibrated for {profile?.fitnessLevel} level · {profile?.workoutPreference} · Equipment:{' '}
                  {profile?.equipment?.join(', ') || 'bodyweight'}
                </p>
              </div>
              <button
                type="button"
                onClick={generateAIPlan}
                disabled={loadingPlan}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loadingPlan ? 'Building Custom Split...' : 'Generate Personalized Workout Plan'}
              </button>
            </div>

            <input
              type="text"
              value={focusNote}
              onChange={(e) => setFocusNote(e.target.value)}
              placeholder="Optional customization: e.g., 4-day upper/lower split, focus on glutes & posture, or 30-min sessions..."
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {planError && (
              <p className="text-xs text-red-600 dark:text-red-400">{planError}</p>
            )}
          </div>

          {aiPlan && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 space-y-1.5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">{aiPlan.planTitle}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{aiPlan.weeklyScheduleSummary}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{aiPlan.progressionNote}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiPlan.sessions.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {s.dayLabel} · {s.durationMin} min · ~{s.estimatedCalories} kcal
                          </p>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                            {s.sessionTitle}
                          </h4>
                        </div>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {s.exercises.map((ex, i) => (
                          <div key={i} className="py-2 text-xs space-y-0.5">
                            <div className="flex items-center justify-between font-medium text-zinc-900 dark:text-zinc-100">
                              <span>{ex.name}</span>
                              <span className="font-mono tabular-nums text-zinc-500">
                                {ex.sets} x {ex.reps} · {ex.restSec}s rest
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{ex.coachingCue}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => logAISession(s)}
                      className="w-full min-h-[42px] rounded-xl border border-emerald-500/60 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Log Completed Session to {selectedDate}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. WEEKLY & MONTHLY WORKOUT HISTORY */}
      {subTab === 'history' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
              <span>{historyStats.sessions} sessions</span>
              <span>·</span>
              <span>{historyStats.minutes} min</span>
              <span>·</span>
              <span>{historyStats.calories.toLocaleString()} kcal</span>
              {historyStats.distance > 0 && (
                <>
                  <span>·</span>
                  <span>{historyStats.distance} km</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {[
                { id: '7d', label: 'Weekly (7d)' },
                { id: '30d', label: 'Monthly (30d)' },
                { id: 'all', label: 'All Time' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setHistoryRange(r.id as '7d' | '30d' | 'all')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                    historyRange === r.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-10 text-center space-y-3">
              <Dumbbell className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No workouts logged in this period yet
              </p>
              <button
                type="button"
                onClick={() => setSubTab('log')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs cursor-pointer"
              >
                Log First Workout
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredHistory.map((w) => (
                <div key={w.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                      {w.dateKey} · {WORKOUT_CATEGORY_LABELS[w.category]} · {w.durationMin} min · {w.caloriesBurned} kcal
                      {w.distanceKm > 0 ? ` · ${w.distanceKm} km` : ''}
                    </p>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{w.title}</h3>
                    {w.exercisesSummary && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">{w.exercisesSummary}</p>
                    )}
                    {(w.sets > 0 || w.weightKg > 0) && (
                      <p className="text-[11px] font-mono tabular-nums text-zinc-500">
                        Volume: {w.sets} sets · {w.reps} reps{w.weightKg > 0 ? ` · ${w.weightKg} kg top load` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteWorkout(w.id)}
                    aria-label="Delete workout"
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
