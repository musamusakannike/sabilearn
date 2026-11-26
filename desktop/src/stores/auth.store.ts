import { create } from 'zustand';
import { secureStore } from '@/platform';
import { ApiError, authApi, setOnUnauthorizedCallback, userApi } from '@/lib/api';
import { IUserSettings, User } from '@/lib/types';
import {
  cacheUserProfile,
  clearCachedUserProfile,
  getCachedUserProfile,
} from '@/lib/offlineSync';
import { obtainFirebaseIdTokenViaGoogle } from '@/lib/googleAuth';
import { useOnboardingStore } from './onboarding.store';

export const DEFAULT_SETTINGS: IUserSettings = {
  emailNotifications: true,
  pushNotifications: false,
  weeklyProgress: true,
  language: 'en',
  studyReminders: true,
  streakAlerts: true,
  reminderHour: 19,
  reminderMinute: 0,
  timezoneOffset: -new Date().getTimezoneOffset(),
  dailyGoalMinutes: 15,
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    level: 'beginner' | 'intermediate' | 'advanced';
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (data: Partial<IUserSettings>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatar?: string; error?: string }>;
}

async function syncOnboardingPreferences(
  updateSettingsFn: (settings: Partial<IUserSettings>) => Promise<unknown>
) {
  try {
    const onboarding = useOnboardingStore.getState();
    if (!onboarding.hasOnboarded) return;
    const { reminderTime, dailyGoalMinutes } = onboarding;
    if (reminderTime) {
      let hour24 = reminderTime.hour % 12;
      if (reminderTime.period === 'PM') hour24 += 12;
      await updateSettingsFn({
        reminderHour: hour24,
        reminderMinute: reminderTime.minute,
        dailyGoalMinutes: dailyGoalMinutes || 15,
        timezoneOffset: -new Date().getTimezoneOffset(),
      });
    }
  } catch {
    // non-fatal
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const token = await secureStore.getToken();
      if (token) {
        const cached = await getCachedUserProfile();
        if (cached) {
          set({ user: cached, isAuthenticated: true });
        }
        await get().fetchMe();
      }
    } catch {
      await secureStore.deleteToken();
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email.trim(), password);
      if (res.success && res.token) {
        await secureStore.setToken(res.token);
        if (res.user) {
          set({ user: res.user, isAuthenticated: true });
          void cacheUserProfile(res.user);
        } else {
          await get().fetchMe();
        }
        await syncOnboardingPreferences(get().updateSettings);
        set({ isLoading: false });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.message || 'Login failed.' };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err instanceof Error ? err.message : 'Login failed.' };
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      if (res.success && res.token) {
        await secureStore.setToken(res.token);
        if (res.user) {
          set({ user: res.user, isAuthenticated: true });
          void cacheUserProfile(res.user);
        } else {
          await get().fetchMe();
        }
        await syncOnboardingPreferences(get().updateSettings);
        set({ isLoading: false });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.message || 'Registration failed.' };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Registration failed.',
      };
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const firebaseIdToken = await obtainFirebaseIdTokenViaGoogle();
      const res = await authApi.google(firebaseIdToken);
      if (res.success && res.token) {
        await secureStore.setToken(res.token);
        if (res.user) {
          set({ user: res.user, isAuthenticated: true });
          void cacheUserProfile(res.user);
        } else {
          await get().fetchMe();
        }
        await syncOnboardingPreferences(get().updateSettings);
        set({ isLoading: false });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.message || 'Google sign-in failed.' };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Google sign-in failed.',
      };
    }
  },

  logout: async () => {
    await secureStore.deleteToken();
    await clearCachedUserProfile();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      const res = await userApi.deleteAccount();
      if (res.success) {
        await get().logout();
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: res.message || 'Failed to delete account.' };
    } catch (err) {
      set({ isLoading: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete account.',
      };
    }
  },

  fetchMe: async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.user) {
        set({ user: res.user, isAuthenticated: true });
        void cacheUserProfile(res.user);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await secureStore.deleteToken();
        await clearCachedUserProfile();
        set({ user: null, isAuthenticated: false });
      } else if (!get().user) {
        const cached = await getCachedUserProfile();
        if (cached) {
          set({ user: cached, isAuthenticated: true });
        }
      }
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await userApi.updateProfile(data as Record<string, unknown>);
      if (res.success && res.data) {
        set({ user: res.data });
        void cacheUserProfile(res.data);
        return { success: true };
      }
      return { success: false, error: res.message || 'Failed to update profile.' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update profile.',
      };
    }
  },

  updateSettings: async (data) => {
    const previous = get().user;
    if (!previous) return { success: false, error: 'Not signed in.' };

    const merged = { ...DEFAULT_SETTINGS, ...previous.settings, ...data };
    const optimistic = { ...previous, settings: merged };
    set({ user: optimistic });
    void cacheUserProfile(optimistic);

    try {
      const res = await userApi.updateSettings(data as Record<string, unknown>);
      if (res.success) {
        const updated = {
          ...get().user!,
          settings: { ...merged, ...(res.data?.settings || {}) },
        };
        set({ user: updated });
        void cacheUserProfile(updated);
        return { success: true };
      }
      set({ user: previous });
      void cacheUserProfile(previous);
      return { success: false, error: res.message || 'Failed to update settings.' };
    } catch (err) {
      set({ user: previous });
      void cacheUserProfile(previous);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update settings.',
      };
    }
  },

  uploadAvatar: async (file) => {
    try {
      const form = new FormData();
      form.append('avatar', file, file.name);
      const res = await userApi.uploadAvatar(form);
      if (res.success) {
        const newAvatar = res.data?.avatar || res.data?.user?.avatar;
        const current = get().user;
        const updated = current
          ? { ...current, ...(res.data?.user || {}), avatar: newAvatar || current.avatar }
          : res.data?.user || null;
        set({ user: updated });
        if (updated) void cacheUserProfile(updated);
        return { success: true, avatar: newAvatar };
      }
      return { success: false, error: res.message || 'Failed to upload avatar.' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to upload avatar.',
      };
    }
  },
}));

setOnUnauthorizedCallback(async () => {
  await useAuthStore.getState().logout();
});
