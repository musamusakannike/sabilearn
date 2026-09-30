import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sabilearn_has_onboarded';
const PREFS_KEY = 'sabilearn_onboarding_preferences';

export interface ReminderTime {
  hour: number; // 1-12
  minute: number; // 0-59
  period: 'AM' | 'PM';
}

export interface OnboardingPreferences {
  interest: string; // 'games' | 'ai' | 'websites' | 'mobile'
  starterCourse: string; // 'python' | 'robotics' | 'django' | 'web_dev' | 'blockchain' | 'prompt_engineering'
  dailyGoalMinutes: number; // 5 | 10 | 20
  reminderTime: ReminderTime;
}

interface OnboardingState extends OnboardingPreferences {
  hasOnboarded: boolean;
  isInitialized: boolean;
  setInterest: (interest: string) => void;
  setStarterCourse: (course: string) => void;
  setDailyGoalMinutes: (minutes: number) => void;
  setReminderTime: (time: ReminderTime) => void;
  initialize: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasOnboarded: false,
  isInitialized: false,
  interest: 'ai',
  starterCourse: 'python',
  dailyGoalMinutes: 10,
  reminderTime: { hour: 5, minute: 30, period: 'PM' },

  setInterest: (interest: string) => set({ interest }),
  setStarterCourse: (starterCourse: string) => set({ starterCourse }),
  setDailyGoalMinutes: (dailyGoalMinutes: number) => set({ dailyGoalMinutes }),
  setReminderTime: (reminderTime: ReminderTime) => set({ reminderTime }),

  initialize: async () => {
    try {
      const [hasOnboardedVal, prefsVal] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PREFS_KEY),
      ]);

      let prefs: Partial<OnboardingPreferences> = {};
      if (prefsVal) {
        try {
          prefs = JSON.parse(prefsVal);
        } catch {}
      }

      set({
        hasOnboarded: hasOnboardedVal === 'true',
        interest: prefs.interest ?? 'ai',
        starterCourse: prefs.starterCourse ?? 'python',
        dailyGoalMinutes: prefs.dailyGoalMinutes ?? 10,
        reminderTime: prefs.reminderTime ?? { hour: 5, minute: 30, period: 'PM' },
      });
    } catch {
      // default to initial state
    } finally {
      set({ isInitialized: true });
    }
  },

  completeOnboarding: async () => {
    const { interest, starterCourse, dailyGoalMinutes, reminderTime } = get();
    set({ hasOnboarded: true });

    try {
      const prefs: OnboardingPreferences = {
        interest,
        starterCourse,
        dailyGoalMinutes,
        reminderTime,
      };
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, 'true'),
        AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)),
      ]);
    } catch {
      // non-fatal
    }
  },
}));

