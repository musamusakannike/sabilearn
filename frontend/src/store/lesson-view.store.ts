'use client';

import { create } from 'zustand';

interface LessonViewState {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
  syncFromStorage: () => void;
}

export const useLessonViewStore = create<LessonViewState>((set) => ({
  isFullscreen: true,
  setIsFullscreen: (value: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sabilearn_fullscreen_pref', String(value));
      }
    } catch {
      /* ignore storage errors */
    }
    set({ isFullscreen: value });
  },
  toggleFullscreen: () => {
    set((state) => {
      const next = !state.isFullscreen;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sabilearn_fullscreen_pref', String(next));
        }
      } catch {
        /* ignore storage errors */
      }
      return { isFullscreen: next };
    });
  },
  syncFromStorage: () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sabilearn_fullscreen_pref');
        if (stored !== null) {
          set({ isFullscreen: stored === 'true' });
        }
      }
    } catch {
      /* ignore storage errors */
    }
  },
}));
