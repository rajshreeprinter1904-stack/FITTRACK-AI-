import React, { useMemo, useState } from 'react';
import { Check, Droplets, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type { AIMealPlan, FoodCatalogItem, MealType } from '../types/fitness';
import {
  DIETARY_LABELS,
  FOOD_DATABASE,
  getRecentDateKeys,
  VISUAL_ASSETS,
} from '../data/fitnessCatalog';
import { BarComparisonChart, ProgressRing, ResilientImage } from './InteractiveCharts';

const MEAL_SECTIONS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
];

export function NutritionSection() {
  const {
    profile,
    selectedDate,
    meals,
    dailyLogsMap,
    currentDayLog,
    addMeal,
    deleteMeal,
    addWater,
  } = useFitness();

  const [activeMealSlot, setActiveMealSlot] = useState<MealType>('breakfast');
  const [foodSearch, setFoodSearch] = useState('');
  const [filterByMyDiet, setFilterByMyDiet] = useState(false);

  // Custom Food Entry state
  const [customFoodName, setCustomFoodName] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [feedback, setFeedback] = useState('');

  // Custom water size
  const [vesselMl, setVesselMl] = useState('350');

  // AI Meal Plan state
  const [dietNote, setDietNote] = useState('');
  const [aiMeals, setAiMeals] = useState<AIMealPlan | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [mealError, setMealError] = useState('');

  const dayMeals = useMemo(
    () => meals.filter((m) => m.dateKey === selectedDate),
    [meals, selectedDate]
  );

  const totals = useMemo(
    () =>
      dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          proteinG: Math.round((acc.proteinG + m.proteinG) * 10) / 10,
          carbsG: Math.round((acc.carbsG + m.carbsG) * 10) / 10,
          fatG: Math.round((acc.fatG + m.fatG) * 10) / 10,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      ),
    [dayMeals]
  );

  const filteredDatabase = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    return FOOD_DATABASE.filter((item) => {
      const matchDiet =
        !filterByMyDiet || !profile || item.dietTags.includes(profile.dietaryPreference);
      const matchSearch = !q || item.foodName.toLowerCase().includes(q);
      return matchDiet && matchSearch;
    });
  }, [filterByMyDiet, foodSearch, profile]);

  const weeklyHydrationData = useMemo(() => {
    return getRecentDateKeys(7).map((dk) => ({
      label: dk.slice(5),
      value: dailyLogsMap[dk]?.waterMl ?? 0,
    }));
  }, [dailyLogsMap]);

  if (!profile) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleAddFromCatalog = async (item: FoodCatalogItem) => {
    await addMeal({
      dateKey: selectedDate,
      mealType: activeMealSlot,
      foodName: item.foodName,
      servingSize: item.servingSize,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
    });
    showToast(`Added "${item.foodName}" to ${activeMealSlot}.`);
  };

  const handleCustomFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;
    await addMeal({
      dateKey: selectedDate,
      mealType: activeMealSlot,
      foodName: customFoodName.trim(),
      servingSize: customServing.trim() || '1 serving',
      calories: Number(customCalories) || 0,
      proteinG: Number(customProtein) || 0,
      carbsG: Number(customCarbs) || 0,
      fatG: Number(customFat) || 0,
    });
    setCustomFoodName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    showToast(`Logged custom item to ${activeMealSlot}.`);
  };

  const generateAIMealPlan = async () => {
    setLoadingMeals(true);
    setMealError('');
    try {
      const resp = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          consumedToday: totals,
          customPreference: dietNote,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to generate meal plan.');
      setAiMeals(data);
    } catch (err) {
      setMealError(err instanceof Error ? err.message : 'AI Meal Planner unavailable.');
    } finally {
      setLoadingMeals(false);
    }
  };

  const logAIMealItem = async (m: AIMealPlan['meals'][number]) => {
    const validSlots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const slot: MealType = validSlots.includes(m.mealType) ? m.mealType : 'lunch';
    await addMeal({
      dateKey: selectedDate,
      mealType: slot,
      foodName: m.foodName,
      servingSize: m.servingSize,
      calories: m.calories,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
    });
    showToast(`Logged "${m.foodName}" (${m.calories} kcal).`);
  };

  const remainingKcal = profile.dailyCalorieGoal - totals.calories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {DIETARY_LABELS[profile.dietaryPreference]} · Target {profile.dailyCalorieGoal} kcal ({selectedDate})
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Nutrition, Macros & Hydration
          </h1>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Daily Nutrition Summary + Macro Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing
            value={totals.calories}
            max={profile.dailyCalorieGoal}
            size={138}
            strokeWidth={10}
            label={`${totals.calories}`}
            sublabel={`/ ${profile.dailyCalorieGoal} kcal`}
          />

          <div className="flex-1 w-full space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Daily Energy Balance</span>
              <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-white">
                {remainingKcal >= 0 ? `${remainingKcal} kcal remaining` : `${Math.abs(remainingKcal)} kcal over target`}
              </span>
            </div>

            {[
              {
                name: 'Protein',
                current: totals.proteinG,
                goal: profile.dailyProteinGoalG,
                bar: 'bg-emerald-500',
              },
              {
                name: 'Carbohydrates',
                current: totals.carbsG,
                goal: profile.dailyCarbsGoalG,
                bar: 'bg-sky-500',
              },
              {
                name: 'Dietary Fat',
                current: totals.fatG,
                goal: profile.dailyFatGoalG,
                bar: 'bg-amber-500',
              },
            ].map((macro) => (
              <div key={macro.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{macro.name}</span>
                  <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {macro.current}g / {macro.goal}g
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${macro.bar} transition-all`}
                    style={{ width: `${Math.min(100, Math.round((macro.current / Math.max(1, macro.goal)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Editorial Nutrition Card */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 overflow-hidden relative min-h-[210px]">
          <ResilientImage
            src={VISUAL_ASSETS.meal}
            alt="Balanced high-protein nutrition bowl"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 flex flex-col justify-end">
            <p className="text-xs text-emerald-400 font-medium">Daily Nutrition Report</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              Protein share:{' '}
              {totals.calories > 0
                ? `${Math.round(((totals.proteinG * 4) / totals.calories) * 100)}% of logged calories`
                : 'Log your first meal to view macro split'}
            </p>
            <p className="text-xs text-zinc-300 mt-1">
              Distributing {Math.round(profile.dailyProteinGoalG / 4)}g+ protein across 4 feedings maximizes muscle protein synthesis.
            </p>
          </div>
        </div>
      </div>

      {/* Logged Meals Today (Breakfast, Lunch, Dinner, Snacks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_SECTIONS.map((sec) => {
          const items = dayMeals.filter((m) => m.mealType === sec.id);
          const secKcal = items.reduce((s, i) => s + i.calories, 0);
          return (
            <div
              key={sec.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">{sec.label}</h2>
                  <p className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {secKcal} kcal · {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMealSlot(sec.id);
                    document.getElementById('food-database-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {sec.label}
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No {sec.label.toLowerCase()} items logged yet.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.foodName}</p>
                        <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                          {item.servingSize} · {item.calories} kcal · {item.proteinG}g P / {item.carbsG}g C / {item.fatG}g F
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMeal(item.id)}
                        aria-label="Remove food item"
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Food Calorie Database + Custom Food Form */}
      <div id="food-database-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Food Calorie Database</h2>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              {MEAL_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveMealSlot(s.id)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    activeMealSlot === s.id
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                placeholder="Search whole foods, bowls, shakes, snacks..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterByMyDiet((v) => !v)}
              className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium whitespace-nowrap cursor-pointer ${
                filterByMyDiet
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Match {DIETARY_LABELS[profile.dietaryPreference]}
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 pr-1">
            {filteredDatabase.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.foodName}</p>
                  <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {item.servingSize} · {item.calories} kcal · {item.proteinG}g P · {item.carbsG}g C · {item.fatG}g F
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFromCatalog(item)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + {activeMealSlot}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Macro Entry Form */}
        <form
          onSubmit={handleCustomFoodSubmit}
          className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Log Custom Meal ({activeMealSlot})
          </h2>

          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Food or Recipe Name</label>
            <input
              type="text"
              required
              maxLength={120}
              value={customFoodName}
              onChange={(e) => setCustomFoodName(e.target.value)}
              placeholder="e.g., Homemade Chicken Stir-Fry"
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Serving Size</label>
              <input
                type="text"
                maxLength={60}
                value={customServing}
                onChange={(e) => setCustomServing(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                min={0}
                max={5000}
                required
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Protein (g)</label>
              <input
                type="number"
                min={0}
                max={500}
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                min={0}
                max={800}
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Fat (g)</label>
              <input
                type="number"
                min={0}
                max={500}
                value={customFat}
                onChange={(e) => setCustomFat(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Add Custom Food to {activeMealSlot}
          </button>
        </form>
      </div>

      {/* AI Diet & Meal Planner + Weekly Hydration Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                AI Meal Planner & Diet Recommendations
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generates Breakfast, Lunch, Dinner & Snack matched to {profile.dailyCalorieGoal} kcal ({DIETARY_LABELS[profile.dietaryPreference]}).
              </p>
            </div>
            <button
              type="button"
              onClick={generateAIMealPlan}
              disabled={loadingMeals}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {loadingMeals ? 'Planning Meals...' : 'Generate AI Meal Plan'}
            </button>
          </div>

          <input
            type="text"
            value={dietNote}
            onChange={(e) => setDietNote(e.target.value)}
            placeholder="Optional dietary request: e.g., dairy-free, Indian vegetarian high-protein, under 15-min prep..."
            className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
          />

          {mealError && <p className="text-xs text-red-600 dark:text-red-400">{mealError}</p>}

          {aiMeals && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 text-xs space-y-1">
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">{aiMeals.strategySummary}</p>
                <p className="text-emerald-600 dark:text-emerald-400">{aiMeals.hydrationTip}</p>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {aiMeals.meals.map((m, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                        {m.mealType}
                      </p>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{m.foodName}</p>
                      <p className="text-[11px] font-mono tabular-nums text-zinc-500">
                        {m.servingSize} · {m.calories} kcal · {m.proteinG}g P / {m.carbsG}g C / {m.fatG}g F
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{m.prepNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => logAIMealItem(m)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Log Meal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Hydration Report & Vessel Controls */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Weekly Hydration Report</h2>
              <Droplets className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Today: {currentDayLog.waterMl} / {profile.dailyWaterGoalMl} ml
            </p>
          </div>

          <BarComparisonChart
            data={weeklyHydrationData}
            unit="ml"
            goal={profile.dailyWaterGoalMl}
            height={155}
          />

          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-3 gap-2">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => addWater(ml)}
                  className="min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-xs font-mono tabular-nums font-medium cursor-pointer"
                >
                  +{ml} ml
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={3000}
                value={vesselMl}
                onChange={(e) => setVesselMl(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
              />
              <button
                type="button"
                onClick={() => addWater(Math.max(50, Number(vesselMl) || 350))}
                className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Add Custom Bottle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
