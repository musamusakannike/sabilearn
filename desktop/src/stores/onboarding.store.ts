import { create } from 'zustand';
import { kvStore } from '@/platform';

const STORAGE_KEY = 'onboarding_completed_v1';
const PREFS_KEY = 'onboarding_prefs_v1';

export interface ReminderTime {
  hour: number; // 1-12
  minute: number; // 0-59
  period: 'AM' | 'PM';
}

export interface OnboardingPreferences {
  interest: string;
  starterCourse: string;
  dailyGoalMinutes: number;
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
  dailyGoalMinutes: 15,
  reminderTime: { hour: 7, minute: 0, period: 'PM' },

  setInterest: (interest) => set({ interest }),
  setStarterCourse: (starterCourse) => set({ starterCourse }),
  setDailyGoalMinutes: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
  setReminderTime: (reminderTime) => set({ reminderTime }),

  initialize: async () => {
    try {
      const [done, prefs] = await Promise.all([
        kvStore.get<boolean>(STORAGE_KEY),
        kvStore.get<Partial<OnboardingPreferences>>(PREFS_KEY),
      ]);
      set({
        hasOnboarded: done === true,
        interest: prefs?.interest ?? 'ai',
        starterCourse: prefs?.starterCourse ?? 'python',
        dailyGoalMinutes: prefs?.dailyGoalMinutes ?? 15,
        reminderTime: prefs?.reminderTime ?? { hour: 7, minute: 0, period: 'PM' },
      });
    } finally {
      set({ isInitialized: true });
    }
  },

  completeOnboarding: async () => {
    const { interest, starterCourse, dailyGoalMinutes, reminderTime } = get();
    set({ hasOnboarded: true });
    await Promise.all([
      kvStore.set(STORAGE_KEY, true),
      kvStore.set(PREFS_KEY, { interest, starterCourse, dailyGoalMinutes, reminderTime }),
    ]);
  },
}));
