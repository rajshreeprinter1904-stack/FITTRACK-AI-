import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  BodyMeasurement,
  DailyLog,
  InAppNotification,
  MealEntry,
  ReminderSetting,
  UserProfile,
  WorkoutEntry,
} from '../types/fitness';
import {
  calculateBMI,
  calculatePersonalizedTargets,
  computeDailyFitnessScore,
  createDefaultReminders,
  createDemoDataset,
  createEmptyDailyLog,
  getLocalDateKey,
} from '../data/fitnessCatalog';

const DEMO_STORAGE_KEY = 'fittrack_ai_demo_state_v1';
const THEME_STORAGE_KEY = 'fittrack_ai_theme_v1';

interface DemoState {
  profile: UserProfile;
  dailyLogs: Record<string, DailyLog>;
  workouts: WorkoutEntry[];
  meals: MealEntry[];
  measurements: BodyMeasurement[];
  reminders: ReminderSetting[];
}

interface FitnessContextValue {
  authReady: boolean;
  firebaseUser: User | null;
  isDemo: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;
  profile: UserProfile | null;
  dailyLogsMap: Record<string, DailyLog>;
  currentDayLog: DailyLog;
  workouts: WorkoutEntry[];
  meals: MealEntry[];
  measurements: BodyMeasurement[];
  reminders: ReminderSetting[];
  notifications: InAppNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsRead: () => void;
  triggerTestNotification: (title: string, body: string) => void;
  signInWithGoogle: () => Promise<void>;
  enterDemoMode: () => void;
  resetDemoData: () => void;
  logout: () => Promise<void>;
  saveOnboardingOrProfile: (nextProfile: Omit<UserProfile, 'userId' | 'onboardingCompleted'>) => Promise<void>;
  updateDailyLogFields: (
    dateKey: string,
    patch: Partial<
      Pick<
        DailyLog,
        | 'steps'
        | 'distanceKm'
        | 'caloriesBurned'
        | 'activeMinutes'
        | 'waterMl'
        | 'sleepHours'
        | 'sleepQuality'
        | 'bedTime'
        | 'wakeTime'
        | 'restingHeartRateBpm'
      >
    >
  ) => Promise<void>;
  addWater: (amountMl: number, dateKey?: string) => Promise<void>;
  addSteps: (deltaSteps: number, dateKey?: string) => Promise<void>;
  addWorkout: (entry: Omit<WorkoutEntry, 'id' | 'userId'>) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  addMeal: (entry: Omit<MealEntry, 'id' | 'userId'>) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  addMeasurement: (entry: Omit<BodyMeasurement, 'id' | 'userId' | 'bmi'>) => Promise<void>;
  deleteMeasurement: (measurementId: string) => Promise<void>;
  upsertReminder: (reminder: Omit<ReminderSetting, 'userId'>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextValue | null>(null);

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateKey());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLogsMap, setDailyLogsMap] = useState<Record<string, DailyLog>>({});
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const firedReminderKeysRef = useRef<Set<string>>(new Set());

  // Sync root <html> class for Dual-Theme architecture
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  //Persist demo changes locally when in Demo Mode
  const persistDemoState = useCallback((next: DemoState) => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota issues in demo
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemo(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners when authenticated with Firebase
  useEffect(() => {
    if (!authReady || !firebaseUser || isDemo) return;

    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    // 1. UserProfile listener
    const userDocRef = doc(db, 'users', uid);
    unsubs.push(
      onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setProfile({
              userId: uid,
              name: String(d.name ?? firebaseUser.displayName ?? 'Athlete'),
              age: Number(d.age ?? 28),
              gender: d.gender ?? 'prefer_not_to_say',
              heightCm: Number(d.heightCm ?? 172),
              currentWeightKg: Number(d.currentWeightKg ?? 72),
              targetWeightKg: Number(d.targetWeightKg ?? 68),
              fitnessLevel: d.fitnessLevel ?? 'intermediate',
              fitnessGoal: d.fitnessGoal ?? 'recomp',
              workoutPreference: d.workoutPreference ?? 'hybrid',
              equipment: Array.isArray(d.equipment) ? d.equipment : [],
              dietaryPreference: d.dietaryPreference ?? 'balanced',
              dailyCalorieGoal: Number(d.dailyCalorieGoal ?? 2150),
              dailyProteinGoalG: Number(d.dailyProteinGoalG ?? 150),
              dailyCarbsGoalG: Number(d.dailyCarbsGoalG ?? 215),
              dailyFatGoalG: Number(d.dailyFatGoalG ?? 68),
              dailyStepsGoal: Number(d.dailyStepsGoal ?? 9500),
              dailyWaterGoalMl: Number(d.dailyWaterGoalMl ?? 2500),
              dailySleepGoalHours: Number(d.dailySleepGoalHours ?? 8),
              dailyActiveMinutesGoal: Number(d.dailyActiveMinutesGoal ?? 45),
              onboardingCompleted: Boolean(d.onboardingCompleted),
            });
          } else {
            // New user who hasn't completed onboarding yet
            const defaults = calculatePersonalizedTargets({
              age: 28,
              gender: 'prefer_not_to_say',
              heightCm: 172,
              currentWeightKg: 72,
              targetWeightKg: 68,
              fitnessLevel: 'beginner',
              fitnessGoal: 'recomp',
              dietaryPreference: 'balanced',
            });
            setProfile({
              userId: uid,
              name: (firebaseUser.displayName || 'Athlete').slice(0, 80),
              age: 28,
              gender: 'prefer_not_to_say',
              heightCm: 172,
              currentWeightKg: 72,
              targetWeightKg: 68,
              fitnessLevel: 'beginner',
              fitnessGoal: 'recomp',
              workoutPreference: 'hybrid',
              equipment: ['bodyweight', 'dumbbells'],
              dietaryPreference: 'balanced',
              ...defaults,
              onboardingCompleted: false,
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    // Only attach subcollection listeners once parent profile exists or is created;
    // Note: list queries evaluate resource.data.userId == request.auth.uid cleanly even when empty!
    const logsQuery = query(collection(db, 'users', uid, 'dailyLogs'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        logsQuery,
        (snap) => {
          const map: Record<string, DailyLog> = {};
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            map[docSnap.id] = {
              id: docSnap.id,
              userId: uid,
              dateKey: String(d.dateKey ?? docSnap.id),
              steps: Number(d.steps ?? 0),
              distanceKm: Number(d.distanceKm ?? 0),
              caloriesBurned: Number(d.caloriesBurned ?? 0),
              activeMinutes: Number(d.activeMinutes ?? 0),
              waterMl: Number(d.waterMl ?? 0),
              sleepHours: Number(d.sleepHours ?? 0),
              sleepQuality: d.sleepQuality ?? 'good',
              bedTime: String(d.bedTime ?? '23:00'),
              wakeTime: String(d.wakeTime ?? '07:00'),
              restingHeartRateBpm: Number(d.restingHeartRateBpm ?? 0),
              fitnessScore: Number(d.fitnessScore ?? 0),
            };
          });
          setDailyLogsMap(map);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/dailyLogs`)
      )
    );

    const workoutsQuery = query(collection(db, 'users', uid, 'workouts'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        workoutsQuery,
        (snap) => {
          const list: WorkoutEntry[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: uid,
              dateKey: String(d.dateKey ?? getLocalDateKey()),
              category: d.category ?? 'gym',
              title: String(d.title ?? 'Workout'),
              durationMin: Number(d.durationMin ?? 30),
              caloriesBurned: Number(d.caloriesBurned ?? 200),
              distanceKm: Number(d.distanceKm ?? 0),
              sets: Number(d.sets ?? 0),
              reps: Number(d.reps ?? 0),
              weightKg: Number(d.weightKg ?? 0),
              exercisesSummary: String(d.exercisesSummary ?? ''),
              notes: String(d.notes ?? ''),
            });
          });
          list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
          setWorkouts(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/workouts`)
      )
    );

    const mealsQuery = query(collection(db, 'users', uid, 'meals'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        mealsQuery,
        (snap) => {
          const list: MealEntry[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: uid,
              dateKey: String(d.dateKey ?? getLocalDateKey()),
              mealType: d.mealType ?? 'lunch',
              foodName: String(d.foodName ?? 'Meal'),
              servingSize: String(d.servingSize ?? '1 serving'),
              calories: Number(d.calories ?? 0),
              proteinG: Number(d.proteinG ?? 0),
              carbsG: Number(d.carbsG ?? 0),
              fatG: Number(d.fatG ?? 0),
            });
          });
          list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
          setMeals(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/meals`)
      )
    );

    const measQuery = query(collection(db, 'users', uid, 'measurements'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        measQuery,
        (snap) => {
          const list: BodyMeasurement[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: uid,
              dateKey: String(d.dateKey ?? getLocalDateKey()),
              weightKg: Number(d.weightKg ?? 70),
              bodyFatPct: Number(d.bodyFatPct ?? 0),
              bmi: Number(d.bmi ?? 22),
              chestCm: Number(d.chestCm ?? 0),
              waistCm: Number(d.waistCm ?? 0),
              hipCm: Number(d.hipCm ?? 0),
              armCm: Number(d.armCm ?? 0),
              note: String(d.note ?? ''),
              localPhotoId: String(d.localPhotoId ?? ''),
            });
          });
          list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
          setMeasurements(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/measurements`)
      )
    );

    const remQuery = query(collection(db, 'users', uid, 'reminders'), where('userId', '==', uid));
    unsubs.push(
      onSnapshot(
        remQuery,
        (snap) => {
          const list: ReminderSetting[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: uid,
              category: d.category ?? 'workout',
              label: String(d.label ?? 'Reminder'),
              time24h: String(d.time24h ?? '09:00'),
              enabled: Boolean(d.enabled),
            });
          });
          setReminders(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/reminders`)
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser, isDemo]);

  // Smart Reminder Scheduler
  const triggerTestNotification = useCallback((title: string, body: string) => {
    const item: InAppNotification = {
      id: makeSafeId('notif'),
      title,
      body,
      category: 'motivation',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 20));
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // Ignore iframe notification restrictions
      }
    }
  }, []);

  useEffect(() => {
    if (reminders.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hh}:${mm}`;
      const dateKey = getLocalDateKey(now);

      reminders.forEach((rem) => {
        if (!rem.enabled || rem.time24h !== hhmm) return;
        const dedupeKey = `${dateKey}-${rem.id}-${hhmm}`;
        if (firedReminderKeysRef.current.has(dedupeKey)) return;
        firedReminderKeysRef.current.add(dedupeKey);

        const item: InAppNotification = {
          id: makeSafeId('rem'),
          title: `FITTRACK AI · ${rem.category.toUpperCase()}`,
          body: rem.label,
          category: rem.category,
          timestamp: hhmm,
          read: false,
        };
        setNotifications((prev) => [item, ...prev].slice(0, 20));
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(item.title, { body: item.body });
          } catch {
            // Safe fallback to in-app notification drawer
          }
        }
      });
    }, 25000);
    return () => clearInterval(interval);
  }, [reminders]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const enterDemoMode = useCallback(() => {
    let dataset: DemoState;
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      dataset = saved ? (JSON.parse(saved) as DemoState) : createDemoDataset();
    } catch {
      dataset = createDemoDataset();
    }
    setProfile(dataset.profile);
    setDailyLogsMap(dataset.dailyLogs);
    setWorkouts(dataset.workouts);
    setMeals(dataset.meals);
    setMeasurements(dataset.measurements);
    setReminders(dataset.reminders);
    setIsDemo(true);
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = createDemoDataset();
    persistDemoState(fresh);
    setProfile(fresh.profile);
    setDailyLogsMap(fresh.dailyLogs);
    setWorkouts(fresh.workouts);
    setMeals(fresh.meals);
    setMeasurements(fresh.measurements);
    setReminders(fresh.reminders);
  }, [persistDemoState]);

  const logout = useCallback(async () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
      setDailyLogsMap({});
      setWorkouts([]);
      setMeals([]);
      setMeasurements([]);
      setReminders([]);
      return;
    }
    await signOut(auth);
    setProfile(null);
  }, [isDemo]);

  // Save Onboarding or Profile Edit
  const saveOnboardingOrProfile = useCallback(
    async (input: Omit<UserProfile, 'userId' | 'onboardingCompleted'>) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid) return;

      const sanitized: UserProfile = {
        userId: uid,
        name: input.name.trim().slice(0, 80) || 'Athlete',
        age: clamp(Math.round(input.age), 10, 120),
        gender: input.gender,
        heightCm: clamp(Number(input.heightCm), 80, 260),
        currentWeightKg: clamp(Number(input.currentWeightKg), 25, 400),
        targetWeightKg: clamp(Number(input.targetWeightKg), 25, 400),
        fitnessLevel: input.fitnessLevel,
        fitnessGoal: input.fitnessGoal,
        workoutPreference: input.workoutPreference,
        equipment: (input.equipment || []).slice(0, 12).map((e) => String(e).slice(0, 40)),
        dietaryPreference: input.dietaryPreference,
        dailyCalorieGoal: clamp(Math.round(input.dailyCalorieGoal), 800, 10000),
        dailyProteinGoalG: clamp(Math.round(input.dailyProteinGoalG), 20, 600),
        dailyCarbsGoalG: clamp(Math.round(input.dailyCarbsGoalG), 0, 1200),
        dailyFatGoalG: clamp(Math.round(input.dailyFatGoalG), 10, 400),
        dailyStepsGoal: clamp(Math.round(input.dailyStepsGoal), 1000, 100000),
        dailyWaterGoalMl: clamp(Math.round(input.dailyWaterGoalMl), 500, 15000),
        dailySleepGoalHours: clamp(Number(input.dailySleepGoalHours), 4, 14),
        dailyActiveMinutesGoal: clamp(Math.round(input.dailyActiveMinutesGoal), 5, 600),
        onboardingCompleted: true,
      };

      if (isDemo) {
        setProfile(sanitized);
        persistDemoState({
          profile: sanitized,
          dailyLogs: dailyLogsMap,
          workouts,
          meals,
          measurements,
          reminders,
        });
        return;
      }

      const userRef = doc(db, 'users', uid);
      try {
        const existingSnap = await getDoc(userRef);
        if (!existingSnap.exists()) {
          await setDoc(userRef, {
            ...sanitized,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Store isolated PII email record if available
          if (firebaseUser?.email) {
            const piiRef = doc(db, 'users', uid, 'private', 'info');
            await setDoc(piiRef, {
              userId: uid,
              email: firebaseUser.email.slice(0, 254),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          // Seed initial reminders + initial weight measurement check-in
          const defaultRems = createDefaultReminders(uid);
          for (const rem of defaultRems) {
            await setDoc(doc(db, 'users', uid, 'reminders', rem.id), {
              userId: uid,
              category: rem.category,
              label: rem.label,
              time24h: rem.time24h,
              enabled: rem.enabled,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          const todayKey = getLocalDateKey();
          const { bmi } = calculateBMI(sanitized.currentWeightKg, sanitized.heightCm);
          const initMeasId = `meas-${todayKey}`;
          await setDoc(doc(db, 'users', uid, 'measurements', initMeasId), {
            userId: uid,
            dateKey: todayKey,
            weightKg: sanitized.currentWeightKg,
            bodyFatPct: 0,
            bmi,
            chestCm: 0,
            waistCm: 0,
            hipCm: 0,
            armCm: 0,
            note: 'Initial onboarding baseline',
            localPhotoId: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const { userId: _ignore, ...mutableFields } = sanitized;
          await updateDoc(userRef, {
            ...mutableFields,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, reminders, workouts]
  );

  // Update DailyLog helper with score recalculation
  const updateDailyLogFields = useCallback(
    async (
      dateKey: string,
      patch: Partial<
        Pick<
          DailyLog,
          | 'steps'
          | 'distanceKm'
          | 'caloriesBurned'
          | 'activeMinutes'
          | 'waterMl'
          | 'sleepHours'
          | 'sleepQuality'
          | 'bedTime'
          | 'wakeTime'
          | 'restingHeartRateBpm'
        >
      >
    ) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;

      const base = dailyLogsMap[dateKey] ?? createEmptyDailyLog(uid, dateKey);
      const dayMeals = meals.filter((m) => m.dateKey === dateKey);
      const caloriesConsumed = dayMeals.reduce((sum, m) => sum + m.calories, 0);

      const merged = {
        ...base,
        ...patch,
      };
      const steps = clamp(Math.round(merged.steps), 0, 200000);
      const distanceKm = clamp(Math.round(merged.distanceKm * 100) / 100, 0, 500);
      const caloriesBurned = clamp(Math.round(merged.caloriesBurned), 0, 20000);
      const activeMinutes = clamp(Math.round(merged.activeMinutes), 0, 1440);
      const waterMl = clamp(Math.round(merged.waterMl), 0, 25000);
      const sleepHours = clamp(Math.round(merged.sleepHours * 10) / 10, 0, 24);
      const restingHeartRateBpm = clamp(Math.round(merged.restingHeartRateBpm), 0, 240);
      const bedTime = (merged.bedTime || '23:00').slice(0, 10);
      const wakeTime = (merged.wakeTime || '07:00').slice(0, 10);

      const fitnessScore = computeDailyFitnessScore({
        steps,
        stepsGoal: profile.dailyStepsGoal,
        activeMinutes,
        activeGoal: profile.dailyActiveMinutesGoal,
        waterMl,
        waterGoal: profile.dailyWaterGoalMl,
        sleepHours,
        sleepGoal: profile.dailySleepGoalHours,
        caloriesConsumed,
        calorieGoal: profile.dailyCalorieGoal,
      });

      const nextDoc: DailyLog = {
        id: dateKey,
        userId: uid,
        dateKey,
        steps,
        distanceKm,
        caloriesBurned,
        activeMinutes,
        waterMl,
        sleepHours,
        sleepQuality: merged.sleepQuality,
        bedTime,
        wakeTime,
        restingHeartRateBpm,
        fitnessScore,
      };

      if (isDemo) {
        const nextLogs = { ...dailyLogsMap, [dateKey]: nextDoc };
        setDailyLogsMap(nextLogs);
        persistDemoState({
          profile,
          dailyLogs: nextLogs,
          workouts,
          meals,
          measurements,
          reminders,
        });
        return;
      }

      const logRef = doc(db, 'users', uid, 'dailyLogs', dateKey);
      try {
        const snap = await getDoc(logRef);
        if (!snap.exists()) {
          const { id: _ignoreId, ...createPayload } = nextDoc;
          await setDoc(logRef, {
            ...createPayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(logRef, {
            steps,
            distanceKm,
            caloriesBurned,
            activeMinutes,
            waterMl,
            sleepHours,
            sleepQuality: merged.sleepQuality,
            bedTime,
            wakeTime,
            restingHeartRateBpm,
            fitnessScore,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/dailyLogs/${dateKey}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const addWater = useCallback(
    async (amountMl: number, dateKey: string = selectedDate) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid) return;
      const current = dailyLogsMap[dateKey]?.waterMl ?? 0;
      await updateDailyLogFields(dateKey, { waterMl: Math.max(0, current + amountMl) });
    },
    [dailyLogsMap, firebaseUser, isDemo, selectedDate, updateDailyLogFields]
  );

  const addSteps = useCallback(
    async (deltaSteps: number, dateKey: string = selectedDate) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid) return;
      const base = dailyLogsMap[dateKey] ?? createEmptyDailyLog(uid, dateKey);
      const nextSteps = Math.max(0, base.steps + deltaSteps);
      const addedKm = Math.round(deltaSteps * 0.00076 * 100) / 100;
      const addedKcal = Math.round(deltaSteps * 0.038);
      await updateDailyLogFields(dateKey, {
        steps: nextSteps,
        distanceKm: Math.max(0, Math.round((base.distanceKm + addedKm) * 100) / 100),
        caloriesBurned: Math.max(0, base.caloriesBurned + addedKcal),
      });
    },
    [dailyLogsMap, firebaseUser, isDemo, selectedDate, updateDailyLogFields]
  );

  const addWorkout = useCallback(
    async (entry: Omit<WorkoutEntry, 'id' | 'userId'>) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;

      const id = makeSafeId('wrk');
      const clean: WorkoutEntry = {
        id,
        userId: uid,
        dateKey: entry.dateKey,
        category: entry.category,
        title: entry.title.trim().slice(0, 120) || 'Workout Session',
        durationMin: clamp(Math.round(entry.durationMin), 1, 720),
        caloriesBurned: clamp(Math.round(entry.caloriesBurned), 0, 10000),
        distanceKm: clamp(Math.round(entry.distanceKm * 100) / 100, 0, 500),
        sets: clamp(Math.round(entry.sets), 0, 200),
        reps: clamp(Math.round(entry.reps), 0, 5000),
        weightKg: clamp(Math.round(entry.weightKg * 10) / 10, 0, 1000),
        exercisesSummary: (entry.exercisesSummary || '').slice(0, 1000),
        notes: (entry.notes || '').slice(0, 500),
      };

      const baseLog = dailyLogsMap[clean.dateKey] ?? createEmptyDailyLog(uid, clean.dateKey);

      if (isDemo) {
        const nextWorkouts = [clean, ...workouts];
        setWorkouts(nextWorkouts);
        const dayMeals = meals.filter((m) => m.dateKey === clean.dateKey);
        const calsIn = dayMeals.reduce((s, m) => s + m.calories, 0);
        const nextActive = baseLog.activeMinutes + clean.durationMin;
        const nextBurned = baseLog.caloriesBurned + clean.caloriesBurned;
        const nextDist = Math.round((baseLog.distanceKm + clean.distanceKm) * 100) / 100;
        const nextLog: DailyLog = {
          ...baseLog,
          activeMinutes: nextActive,
          caloriesBurned: nextBurned,
          distanceKm: nextDist,
          fitnessScore: computeDailyFitnessScore({
            steps: baseLog.steps,
            stepsGoal: profile.dailyStepsGoal,
            activeMinutes: nextActive,
            activeGoal: profile.dailyActiveMinutesGoal,
            waterMl: baseLog.waterMl,
            waterGoal: profile.dailyWaterGoalMl,
            sleepHours: baseLog.sleepHours,
            sleepGoal: profile.dailySleepGoalHours,
            caloriesConsumed: calsIn,
            calorieGoal: profile.dailyCalorieGoal,
          }),
        };
        const nextLogs = { ...dailyLogsMap, [clean.dateKey]: nextLog };
        setDailyLogsMap(nextLogs);
        persistDemoState({
          profile,
          dailyLogs: nextLogs,
          workouts: nextWorkouts,
          meals,
          measurements,
          reminders,
        });
        return;
      }

      try {
        const { id: _ignore, ...payload } = clean;
        await setDoc(doc(db, 'users', uid, 'workouts', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await updateDailyLogFields(clean.dateKey, {
          activeMinutes: baseLog.activeMinutes + clean.durationMin,
          caloriesBurned: baseLog.caloriesBurned + clean.caloriesBurned,
          distanceKm: Math.round((baseLog.distanceKm + clean.distanceKm) * 100) / 100,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/workouts/${id}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, updateDailyLogFields, workouts]
  );

  const deleteWorkout = useCallback(
    async (workoutId: string) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;
      if (isDemo) {
        const nextWorkouts = workouts.filter((w) => w.id !== workoutId);
        setWorkouts(nextWorkouts);
        persistDemoState({ profile, dailyLogs: dailyLogsMap, workouts: nextWorkouts, meals, measurements, reminders });
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/workouts/${workoutId}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const addMeal = useCallback(
    async (entry: Omit<MealEntry, 'id' | 'userId'>) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;

      const id = makeSafeId('meal');
      const clean: MealEntry = {
        id,
        userId: uid,
        dateKey: entry.dateKey,
        mealType: entry.mealType,
        foodName: entry.foodName.trim().slice(0, 120) || 'Food Item',
        servingSize: entry.servingSize.trim().slice(0, 60) || '1 serving',
        calories: clamp(Math.round(entry.calories), 0, 10000),
        proteinG: clamp(Math.round(entry.proteinG * 10) / 10, 0, 1000),
        carbsG: clamp(Math.round(entry.carbsG * 10) / 10, 0, 1500),
        fatG: clamp(Math.round(entry.fatG * 10) / 10, 0, 1000),
      };

      if (isDemo) {
        const nextMeals = [clean, ...meals];
        setMeals(nextMeals);
        const baseLog = dailyLogsMap[clean.dateKey] ?? createEmptyDailyLog(uid, clean.dateKey);
        const calsIn = nextMeals
          .filter((m) => m.dateKey === clean.dateKey)
          .reduce((s, m) => s + m.calories, 0);
        const nextLog: DailyLog = {
          ...baseLog,
          fitnessScore: computeDailyFitnessScore({
            steps: baseLog.steps,
            stepsGoal: profile.dailyStepsGoal,
            activeMinutes: baseLog.activeMinutes,
            activeGoal: profile.dailyActiveMinutesGoal,
            waterMl: baseLog.waterMl,
            waterGoal: profile.dailyWaterGoalMl,
            sleepHours: baseLog.sleepHours,
            sleepGoal: profile.dailySleepGoalHours,
            caloriesConsumed: calsIn,
            calorieGoal: profile.dailyCalorieGoal,
          }),
        };
        const nextLogs = { ...dailyLogsMap, [clean.dateKey]: nextLog };
        setDailyLogsMap(nextLogs);
        persistDemoState({
          profile,
          dailyLogs: nextLogs,
          workouts,
          meals: nextMeals,
          measurements,
          reminders,
        });
        return;
      }

      try {
        const { id: _ignore, ...payload } = clean;
        await setDoc(doc(db, 'users', uid, 'meals', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Refresh daily score with updated meal intake
        const baseLog = dailyLogsMap[clean.dateKey] ?? createEmptyDailyLog(uid, clean.dateKey);
        await updateDailyLogFields(clean.dateKey, { steps: baseLog.steps });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/meals/${id}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, updateDailyLogFields, workouts]
  );

  const deleteMeal = useCallback(
    async (mealId: string) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;
      if (isDemo) {
        const nextMeals = meals.filter((m) => m.id !== mealId);
        setMeals(nextMeals);
        persistDemoState({ profile, dailyLogs: dailyLogsMap, workouts, meals: nextMeals, measurements, reminders });
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', uid, 'meals', mealId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/meals/${mealId}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const addMeasurement = useCallback(
    async (entry: Omit<BodyMeasurement, 'id' | 'userId' | 'bmi'>) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;

      const weightKg = clamp(Math.round(entry.weightKg * 10) / 10, 25, 400);
      const { bmi } = calculateBMI(weightKg, profile.heightCm);
      const id = makeSafeId('meas');
      const clean: BodyMeasurement = {
        id,
        userId: uid,
        dateKey: entry.dateKey,
        weightKg,
        bodyFatPct: clamp(Math.round(entry.bodyFatPct * 10) / 10, 0, 75),
        bmi: clamp(bmi, 8, 100),
        chestCm: clamp(Math.round(entry.chestCm * 10) / 10, 0, 300),
        waistCm: clamp(Math.round(entry.waistCm * 10) / 10, 0, 300),
        hipCm: clamp(Math.round(entry.hipCm * 10) / 10, 0, 300),
        armCm: clamp(Math.round(entry.armCm * 10) / 10, 0, 150),
        note: (entry.note || '').slice(0, 300),
        localPhotoId: (entry.localPhotoId || '').slice(0, 128),
      };

      if (isDemo) {
        const nextMeas = [clean, ...measurements];
        const nextProfile = { ...profile, currentWeightKg: weightKg };
        setMeasurements(nextMeas);
        setProfile(nextProfile);
        persistDemoState({
          profile: nextProfile,
          dailyLogs: dailyLogsMap,
          workouts,
          meals,
          measurements: nextMeas,
          reminders,
        });
        return;
      }

      try {
        const { id: _ignore, ...payload } = clean;
        await setDoc(doc(db, 'users', uid, 'measurements', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Sync latest weight to UserProfile via Quick Weight Sync action
        await updateDoc(doc(db, 'users', uid), {
          currentWeightKg: weightKg,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/measurements/${id}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const deleteMeasurement = useCallback(
    async (measurementId: string) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;
      if (isDemo) {
        const nextMeas = measurements.filter((m) => m.id !== measurementId);
        setMeasurements(nextMeas);
        persistDemoState({ profile, dailyLogs: dailyLogsMap, workouts, meals, measurements: nextMeas, reminders });
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', uid, 'measurements', measurementId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/measurements/${measurementId}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const upsertReminder = useCallback(
    async (reminder: Omit<ReminderSetting, 'userId'>) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;

      const id = reminder.id ? reminder.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) : makeSafeId('rem');
      const clean: ReminderSetting = {
        id,
        userId: uid,
        category: reminder.category,
        label: reminder.label.trim().slice(0, 100) || 'Daily Reminder',
        time24h: /^\d{2}:\d{2}$/.test(reminder.time24h) ? reminder.time24h : '09:00',
        enabled: Boolean(reminder.enabled),
      };

      if (isDemo) {
        const existsIdx = reminders.findIndex((r) => r.id === id);
        const nextRems =
          existsIdx >= 0
            ? reminders.map((r) => (r.id === id ? clean : r))
            : [...reminders, clean];
        setReminders(nextRems);
        persistDemoState({ profile, dailyLogs: dailyLogsMap, workouts, meals, measurements, reminders: nextRems });
        return;
      }

      const remRef = doc(db, 'users', uid, 'reminders', id);
      try {
        const snap = await getDoc(remRef);
        if (!snap.exists()) {
          const { id: _ignore, ...payload } = clean;
          await setDoc(remRef, {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(remRef, {
            category: clean.category,
            label: clean.label,
            time24h: clean.time24h,
            enabled: clean.enabled,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/reminders/${id}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid;
      if (!uid || !profile) return;
      if (isDemo) {
        const nextRems = reminders.filter((r) => r.id !== reminderId);
        setReminders(nextRems);
        persistDemoState({ profile, dailyLogs: dailyLogsMap, workouts, meals, measurements, reminders: nextRems });
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/reminders/${reminderId}`);
      }
    },
    [dailyLogsMap, firebaseUser, isDemo, meals, measurements, persistDemoState, profile, reminders, workouts]
  );

  const currentDayLog = useMemo(() => {
    const uid = isDemo ? 'demo_athlete' : firebaseUser?.uid || 'guest';
    const existing = dailyLogsMap[selectedDate];
    if (existing) return existing;
    return createEmptyDailyLog(uid, selectedDate);
  }, [dailyLogsMap, firebaseUser, isDemo, selectedDate]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<FitnessContextValue>(
    () => ({
      authReady,
      firebaseUser,
      isDemo,
      theme,
      toggleTheme,
      selectedDate,
      setSelectedDate,
      profile,
      dailyLogsMap,
      currentDayLog,
      workouts,
      meals,
      measurements,
      reminders,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsRead,
      triggerTestNotification,
      signInWithGoogle,
      enterDemoMode,
      resetDemoData,
      logout,
      saveOnboardingOrProfile,
      updateDailyLogFields,
      addWater,
      addSteps,
      addWorkout,
      deleteWorkout,
      addMeal,
      deleteMeal,
      addMeasurement,
      deleteMeasurement,
      upsertReminder,
      deleteReminder,
    }),
    [
      addMeal,
      addMeasurement,
      addSteps,
      addWater,
      addWorkout,
      authReady,
      currentDayLog,
      dailyLogsMap,
      deleteMeal,
      deleteMeasurement,
      deleteReminder,
      deleteWorkout,
      enterDemoMode,
      firebaseUser,
      isDemo,
      logout,
      markAllNotificationsRead,
      meals,
      measurements,
      notifications,
      profile,
      reminders,
      resetDemoData,
      saveOnboardingOrProfile,
      selectedDate,
      signInWithGoogle,
      theme,
      toggleTheme,
      triggerTestNotification,
      unreadNotificationsCount,
      updateDailyLogFields,
      upsertReminder,
      workouts,
    ]
  );

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error('useFitness must be used inside FitnessProvider');
  return ctx;
}
