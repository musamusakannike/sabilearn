'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export type AppTrack = 'tech' | 'academic';

interface TrackContextValue {
  track: AppTrack;
  setTrack: (track: AppTrack) => void;
  toggleTrack: () => void;
  isTech: boolean;
  isAcademic: boolean;
}

const TrackContext = createContext<TrackContextValue | undefined>(undefined);

const TRACK_STORAGE_KEY = 'sabilearn_track';

export function TrackProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrackState] = useState<AppTrack>('tech');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Check local storage
    const saved = localStorage.getItem(TRACK_STORAGE_KEY) as AppTrack | null;
    if (saved === 'tech' || saved === 'academic') {
      setTrackState(saved);
      return;
    }

    // 2. Check cached user profile
    try {
      const userStr = localStorage.getItem('sabilearn_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.activeTrack === 'tech' || user.activeTrack === 'academic') {
          setTrackState(user.activeTrack);
          localStorage.setItem(TRACK_STORAGE_KEY, user.activeTrack);
          return;
        }
      }
    } catch {
      // fallback to tech
    }
  }, []);

  const setTrack = useCallback((newTrack: AppTrack) => {
    setTrackState(newTrack);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRACK_STORAGE_KEY, newTrack);
      window.dispatchEvent(new CustomEvent('sabilearn_track_change', { detail: newTrack }));

      // Update backend user profile if logged in
      const token = localStorage.getItem('sabilearn_token');
      if (token) {
        api.put('/users/me', { activeTrack: newTrack }).catch(() => {
          // silent fallback
        });
      }
    }
  }, []);

  const toggleTrack = useCallback(() => {
    setTrack(track === 'tech' ? 'academic' : 'tech');
  }, [track, setTrack]);

  return (
    <TrackContext.Provider
      value={{
        track,
        setTrack,
        toggleTrack,
        isTech: track === 'tech',
        isAcademic: track === 'academic',
      }}
    >
      {children}
    </TrackContext.Provider>
  );
}

export function useTrack(): TrackContextValue {
  const context = useContext(TrackContext);
  if (!context) {
    // Provide safe SSR fallback
    return {
      track: 'tech',
      setTrack: () => {},
      toggleTrack: () => {},
      isTech: true,
      isAcademic: false,
    };
  }
  return context;
}
