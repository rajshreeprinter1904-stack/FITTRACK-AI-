/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Dumbbell,
  Home,
  LineChart,
  Moon,
  Sun,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import type { AppSection } from './types/fitness';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthLanding } from './components/AuthLanding';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeSection } from './components/HomeSection';
import { WorkoutSection } from './components/WorkoutSection';
import { NutritionSection } from './components/NutritionSection';
import { ProgressSection } from './components/ProgressSection';
import { ProfileSection } from './components/ProfileSection';

const NAV_ITEMS: { id: AppSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'profile', label: 'Profile', icon: User },
];

function AppWorkspace() {
  const {
    authReady,
    firebaseUser,
    isDemo,
    profile,
    theme,
    toggleTheme,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
  } = useFitness();

  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [notifOpen, setNotifOpen] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3 text-center">
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto animate-pulse" />
          <div className="h-2 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (!firebaseUser && !isDemo) {
    return <AuthLanding />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex">
      {/* Show Onboarding Wizard automatically for new cloud users */}
      {profile && !profile.onboardingCompleted && !isDemo && <OnboardingModal />}

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#0D0E12] p-5 justify-between sticky top-0 h-screen">
        <div className="space-y-8">
          <div className="px-2">
            <span className="text-xl font-bold tracking-tight font-display text-zinc-900 dark:text-white">
              FITTRACK <span className="text-emerald-500">AI</span>
            </span>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {profile && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 space-y-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{profile.name}</p>
            <p className="text-[11px] font-mono tabular-nums text-zinc-500">
              {profile.currentWeightKg} kg → {profile.targetWeightKg} kg
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Compact Sticky Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-30 h-12 sm:h-14 px-4 sm:px-8 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden text-base font-bold font-display tracking-tight whitespace-nowrap">
              FITTRACK <span className="text-emerald-500">AI</span>
            </span>
            <span className="hidden lg:inline text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Workspace / <strong className="text-zinc-900 dark:text-zinc-100 capitalize">{activeSection}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light and dark mode"
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                markAllNotificationsRead();
              }}
              aria-label="Open reminders and notifications"
              className="relative min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-zinc-950 font-mono text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notification Drawer */}
        {notifOpen && (
          <div className="fixed right-4 top-14 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Recent Alerts & Reminders</span>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">
                No triggered alerts yet. Manage scheduled reminders or test an alert in Profile.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>{n.title}</span>
                      <span className="font-mono tabular-nums text-zinc-400">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          {activeSection === 'home' && <HomeSection onNavigate={setActiveSection} />}
          {activeSection === 'workout' && <WorkoutSection />}
          {activeSection === 'nutrition' && <NutritionSection />}
          {activeSection === 'progress' && <ProgressSection />}
          {activeSection === 'profile' && <ProfileSection />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (5 Tabs, Compact <= 15% Sticky Cap) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-[#0D0E12]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-5 items-center px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
                active
                  ? 'text-emerald-500 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FitnessProvider>
        <AppWorkspace />
      </FitnessProvider>
    </ErrorBoundary>
  );
}
