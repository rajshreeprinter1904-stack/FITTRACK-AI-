import React, { useState } from 'react';
import {
  Bell,
  Download,
  Edit3,
  LogOut,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import type { ReminderCategory } from '../types/fitness';
import {
  DIETARY_LABELS,
  FITNESS_GOAL_LABELS,
  getLocalDateKey,
} from '../data/fitnessCatalog';
import { exportFitnessReportPDF } from '../lib/pdfExport';
import { OnboardingModal } from './OnboardingModal';

const REMINDER_CATEGORIES: { id: ReminderCategory; label: string }[] = [
  { id: 'workout', label: 'Workout Reminder' },
  { id: 'water', label: 'Water Reminder' },
  { id: 'meal', label: 'Meal Reminder' },
  { id: 'sleep', label: 'Sleep Schedule' },
  { id: 'goal', label: 'Daily Goal Check' },
  { id: 'motivation', label: 'Motivational Prompt' },
];

export function ProfileSection() {
  const {
    profile,
    isDemo,
    theme,
    toggleTheme,
    dailyLogsMap,
    workouts,
    meals,
    measurements,
    reminders,
    upsertReminder,
    deleteReminder,
    triggerTestNotification,
    resetDemoData,
    logout,
  } = useFitness();

  const [editingProfile, setEditingProfile] = useState(false);
  const [remCat, setRemCat] = useState<ReminderCategory>('water');
  const [remLabel, setRemLabel] = useState('');
  const [remTime, setRemTime] = useState('15:00');
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!profile) return null;

  const requestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setNotifPerm(res);
    } catch {
      // Ignore iframe permission errors
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertReminder({
      id: '',
      category: remCat,
      label: remLabel.trim() || REMINDER_CATEGORIES.find((c) => c.id === remCat)?.label || 'Reminder',
      time24h: remTime,
      enabled: true,
    });
    setRemLabel('');
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      accountMode: isDemo ? 'demo_sample' : 'cloud_authenticated',
      profile,
      dailyLogs: Object.values(dailyLogsMap),
      workouts,
      meals,
      measurements,
      reminders,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FITTRACK_AI_Data_${getLocalDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullPDF = () => {
    exportFitnessReportPDF({
      profile,
      dailyLogs: Object.values(dailyLogsMap),
      workouts,
      meals,
      measurements,
      timeframeLabel: 'COMPLETE HISTORY',
      isDemo,
    });
  };

  return (
    <div className="space-y-6">
      {editingProfile && <OnboardingModal onComplete={() => setEditingProfile(false)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Account Calibration · Smart Reminders · Appearance · Data Privacy
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Profile & Preferences
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {isDemo ? 'Exit Demo' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Athlete Summary Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {isDemo ? 'Interactive Demo Account (Sample Data)' : 'Cloud Synced Athlete Profile'}
          </p>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{profile.name}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {profile.age} yrs · {profile.heightCm} cm · {profile.currentWeightKg} kg → {profile.targetWeightKg} kg ·{' '}
            {FITNESS_GOAL_LABELS[profile.fitnessGoal]} · {DIETARY_LABELS[profile.dietaryPreference]}
          </p>
          <p className="text-xs font-mono tabular-nums text-zinc-500">
            Targets: {profile.dailyCalorieGoal} kcal ({profile.dailyProteinGoalG}g P / {profile.dailyCarbsGoalG}g C /{' '}
            {profile.dailyFatGoalG}g F) · {profile.dailyStepsGoal.toLocaleString()} steps · {profile.dailyWaterGoalMl} ml
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingProfile(true)}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          Edit Goals & Onboarding
        </button>
      </div>

      {/* Smart Reminders & Notification Center + Privacy & Data Export */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                Smart Reminders & Notifications
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure Workout, Water, Meal, Sleep, Daily Goal & Motivational alerts
              </p>
            </div>

            <div className="flex items-center gap-2">
              {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
                <button
                  type="button"
                  onClick={requestBrowserNotifications}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium cursor-pointer"
                >
                  Enable Browser Alerts
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  triggerTestNotification(
                    'FITTRACK AI · Daily Check-In',
                    `Stay locked in, ${profile.name}! Have you logged your water and training session today?`
                  )
                }
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Send Test Alert
              </button>
            </div>
          </div>

          <form onSubmit={handleAddReminder} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <select
              value={remCat}
              onChange={(e) => setRemCat(e.target.value as ReminderCategory)}
              className="sm:col-span-4 h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
            >
              {REMINDER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              maxLength={100}
              value={remLabel}
              onChange={(e) => setRemLabel(e.target.value)}
              placeholder="Custom reminder message..."
              className="sm:col-span-4 h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs"
            />
            <input
              type="time"
              value={remTime}
              onChange={(e) => setRemTime(e.target.value)}
              className="sm:col-span-2 h-11 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono tabular-nums"
            />
            <button
              type="submit"
              className="sm:col-span-2 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reminders.map((rem) => (
              <div key={rem.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{rem.label}</p>
                  <p className="text-[11px] font-mono tabular-nums text-zinc-500">
                    {rem.category} · {rem.time24h}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => upsertReminder({ ...rem, enabled: !rem.enabled })}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      rem.enabled
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {rem.enabled ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReminder(rem.id)}
                    aria-label="Delete reminder"
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy, Data Protection & Export */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Privacy, Integrity & Data Portability
            </h2>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <li>
                • <strong>Zero-Trust Cloud Isolation:</strong> All cloud fitness logs are isolated under your personal UID with strict Firestore rules and separate PII protection.
              </li>
              <li>
                • <strong>Measurement Honesty:</strong> Steps, pulse check-ins, workouts, and nutrition reflect your real logged entries—never simulated sensor streams.
              </li>
              <li>
                • <strong>On-Device Progress Photos:</strong> Transformation photos stay locally inside your browser storage rather than public cloud buckets.
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleExportFullPDF}
              className="w-full min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Full Fitness Report (PDF)
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full min-h-[44px] px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Complete Data Archive (JSON)
            </button>

            {isDemo && (
              <button
                type="button"
                onClick={resetDemoData}
                className="w-full min-h-[42px] px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Sample Dataset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
