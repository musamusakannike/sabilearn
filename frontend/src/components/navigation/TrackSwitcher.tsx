'use client';

import React from 'react';
import { useTrack } from '@/context/TrackContext';
import { Code2, GraduationCap } from 'lucide-react';

interface TrackSwitcherProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function TrackSwitcher({ className = '', size = 'md' }: TrackSwitcherProps) {
  const { track, setTrack } = useTrack();

  const isSmall = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Track switcher"
      className={`inline-flex items-center p-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-inner transition-colors ${className}`}
    >
      {/* Tech Track Button */}
      <button
        type="button"
        onClick={() => setTrack('tech')}
        className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${
          isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
        } ${
          track === 'tech'
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
        }`}
        aria-pressed={track === 'tech'}
      >
        <Code2 className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Tech Skills</span>
      </button>

      {/* Academic Hub Button */}
      <button
        type="button"
        onClick={() => setTrack('academic')}
        className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${
          isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
        } ${
          track === 'academic'
            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
        }`}
        aria-pressed={track === 'academic'}
      >
        <GraduationCap className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Academic Hub</span>
      </button>
    </div>
  );
}
