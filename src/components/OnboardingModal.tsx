import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type {
  DietaryPreference,
  FitnessGoal,
  FitnessLevel,
  GenderOption,
  WorkoutPreference,
} from '../types/fitness';
import {
  calculatePersonalizedTargets,
  DIETARY_LABELS,
  EQUIPMENT_OPTIONS,
  FITNESS_GOAL_LABELS,
} from '../data/fitnessCatalog';

export function OnboardingModal({ onComplete }: { onComplete?: () => void }) {
  const { profile, saveOnboardingOrProfile } = useFitness();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age ?? 28);
  const [gender, setGender] = useState<GenderOption>(profile?.gender ?? 'prefer_not_to_say');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? 174);
  const [currentWeightKg, setCurrentWeightKg] = useState(profile?.currentWeightKg ?? 74);
  const [targetWeightKg, setTargetWeightKg] = useState(profile?.targetWeightKg ?? 70);

  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(profile?.fitnessLevel ?? 'intermediate');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(profile?.fitnessGoal ?? 'recomp');
  const [workoutPreference, setWorkoutPreference] = useState<WorkoutPreference>(
    profile?.workoutPreference ?? 'hybrid'
  );
  const [equipment, setEquipment] = useState<string[]>(
    profile?.equipment?.length ? profile.equipment : ['bodyweight', 'dumbbells']
  );
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(
    profile?.dietaryPreference ?? 'balanced'
  );

  const computedTargets = useMemo(
    () =>
      calculatePersonalizedTargets({
        age: Number(age) || 28,
        gender,
        heightCm: Number(heightCm) || 174,
        currentWeightKg: Number(currentWeightKg) || 74,
        targetWeightKg: Number(targetWeightKg) || 70,
        fitnessLevel,
        fitnessGoal,
        dietaryPreference,
      }),
    [age, currentWeightKg, dietaryPreference, fitnessGoal, fitnessLevel, gender, heightCm, targetWeightKg]
  );

  const toggleEquipment = (id: string) => {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 12)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveOnboardingOrProfile({
        name: name.trim() || 'Athlete',
        age: Number(age) || 28,
        gender,
        heightCm: Number(heightCm) || 174,
        currentWeightKg: Number(currentWeightKg) || 74,
        targetWeightKg: Number(targetWeightKg) || 70,
        fitnessLevel,
        fitnessGoal,
        workoutPreference,
        equipment,
        dietaryPreference,
        ...computedTargets,
      });
      onComplete?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 sm:p-8 space-y-6 my-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Step {step} of 3 · Personalized Calibration
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mt-0.5">Build Your FITTRACK AI Plan</h2>
          </div>
          <span className="font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
            {Math.round((step / 3) * 100)}%
          </span>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Full Name or Athlete Handle
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jordan Patel"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Age (years)
              </label>
              <input
                type="number"
                min={13}
                max={110}
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Gender (optional)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderOption)}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                min={100}
                max={250}
                required
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Current (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={350}
                  required
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Target (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={350}
                  required
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Fitness Level
                </label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value as FitnessLevel)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Primary Fitness Goal
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value as FitnessGoal)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  {(Object.keys(FITNESS_GOAL_LABELS) as FitnessGoal[]).map((g) => (
                    <option key={g} value={g}>
                      {FITNESS_GOAL_LABELS[g]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Workout Preference
                </label>
                <select
                  value={workoutPreference}
                  onChange={(e) => setWorkoutPreference(e.target.value as WorkoutPreference)}
                  className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="gym">Gym Facility</option>
                  <option value="home">Home Studio</option>
                  <option value="outdoor">Outdoor & Running</option>
                  <option value="hybrid">Hybrid (Gym + Home)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Available Workout Equipment (select up to 12)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((item) => {
                  const selected = equipment.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleEquipment(item.id)}
                      className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(DIETARY_LABELS) as DietaryPreference[]).map((diet) => {
                  const active = dietaryPreference === diet;
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setDietaryPreference(diet)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      {DIETARY_LABELS[diet]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Personalized Daily Targets Preview
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Daily Calories</span>
                  <strong className="font-mono tabular-nums text-base text-emerald-600 dark:text-emerald-400">
                    {computedTargets.dailyCalorieGoal} kcal
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Macros (P / C / F)</span>
                  <strong className="font-mono tabular-nums text-base text-zinc-900 dark:text-zinc-100">
                    {computedTargets.dailyProteinGoalG}g / {computedTargets.dailyCarbsGoalG}g / {computedTargets.dailyFatGoalG}g
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Daily Steps</span>
                  <strong className="font-mono tabular-nums text-base text-zinc-900 dark:text-zinc-100">
                    {computedTargets.dailyStepsGoal.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Hydration & Sleep</span>
                  <strong className="font-mono tabular-nums text-base text-zinc-900 dark:text-zinc-100">
                    {computedTargets.dailyWaterGoalMl} ml · {computedTargets.dailySleepGoalHours}h
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Generating Dashboard...' : 'Launch Personalized Dashboard'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
