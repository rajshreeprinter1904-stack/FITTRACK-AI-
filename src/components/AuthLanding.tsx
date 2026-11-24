import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Dumbbell, Flame, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { VISUAL_ASSETS } from '../data/fitnessCatalog';
import { ResilientImage } from './InteractiveCharts';

export function AuthLanding() {
  const { signInWithGoogle, enterDemoMode, theme, toggleTheme } = useFitness();
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogleLogin = async () => {
    setBusy(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in popup was closed or blocked.';
      setAuthError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-zinc-200 dark:border-zinc-800/90 max-w-7xl w-full mx-auto">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight font-display text-zinc-900 dark:text-white whitespace-nowrap shrink-0"
        >
          FITTRACK <span className="text-emerald-500">AI</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Activity
          </a>
          <a href="#coaching" className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            AI Coach
          </a>
          <a href="#nutrition" className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Nutrition
          </a>
          <a href="#security" className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Privacy
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Connecting...' : 'Sign In with Google'}
          </button>
        </div>
      </header>

      {/* Main 1440px Balanced Split Hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10 lg:py-16 space-y-16">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8 py-2">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide">
                  Personal Fitness Trainer · Activity Tracker · Nutrition Planner
                </p>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <h1
                className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                Track Every Day. Transform Your Life.
              </h1>

              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Unify daily step goals, strength and cardio workouts, macro-accurate meal planning, hydration, sleep recovery, and anthropometric transformation graphs — synced securely to your private cloud account.
              </p>
            </div>

            <div className="space-y-4">
              {authError && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg px-3.5 py-2.5">
                  {authError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {busy ? 'Signing in...' : 'Continue with Google'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={enterDemoMode}
                  className="min-h-[48px] px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium text-sm flex items-center justify-center transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Explore Demo Account (Sample Data)
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Google Sign-In creates your empty personal cloud logbook. Demo Account loads 30 days of labeled sample data for instant exploration.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 min-h-[340px]">
            <ResilientImage
              src={VISUAL_ASSETS.gym}
              alt="FITTRACK AI modern strength training facility"
              className="w-full h-full lg:h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <p className="text-xs text-emerald-400 font-medium mb-1">
                Adaptive Coaching · Progressive Overload · Macro Sync
              </p>
              <p className="text-lg sm:text-xl font-semibold text-white max-w-md">
                Personalized training splits, calorie targets, and recovery insights calibrated from your real logged history.
              </p>
            </div>
          </div>
        </section>

        {/* Full-Width 4-Column Capability Strip Below Hero Split */}
        <section id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Daily Activity & Vitals</span>
              <Flame className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Log steps, distance, active minutes, one-tap hydration vessels, sleep schedules, and manual heart rate check-ins.
            </p>
          </div>

          <div id="coaching" className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Fitness & Diet Coach</span>
              <Dumbbell className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Generate equipment-matched workout routines, macro-balanced daily meal plans, and recovery adjustments on demand.
            </p>
          </div>

          <div id="nutrition" className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Transformation Reports</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Interactive Daily, Weekly, Monthly, and Yearly charts for weight, BMI, body measurements, and downloadable PDF reports.
            </p>
          </div>

          <div id="security" className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Private & Honest Data</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              User-isolated Firestore rules, on-device progress photos, and zero fabricated sensor telemetry.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-5 px-6 lg:px-12 text-xs text-zinc-500 dark:text-zinc-500 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>FITTRACK AI · Personal Fitness, Nutrition & Transformation Platform</span>
        <span>Cloud Sync Secured · Exportable PDF & JSON History</span>
      </footer>
    </div>
  );
}
