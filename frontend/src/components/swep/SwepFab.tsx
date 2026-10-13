'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSwepEnrollment } from '@/hooks/useSwepEnrollment';

export default function SwepFab() {
  const { isAuthenticated } = useAuthStore();
  const { showFab, dismissFab } = useSwepEnrollment();

  if (!showFab) return null;

  const href = isAuthenticated ? '/dashboard/swep' : '/swep';

  return (
    <div className="fixed right-4 bottom-5 z-[60] flex items-start gap-1 sm:right-6 sm:bottom-6">
      <Link
        href={href}
        className="flex items-center gap-2 rounded-full bg-[var(--surface-page)] py-1.5 pr-3.5 pl-1.5 ring-1 ring-[var(--line)]"
      >
        <span className="flex size-10 overflow-hidden rounded-full bg-[var(--brand-gold-100)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/mascot/mascot-unilorin.webp" alt="" className="size-full object-cover object-top" />
        </span>
        <span className="text-sm font-[var(--font-display)] font-bold text-[var(--ink-900)]">SWEP</span>
      </Link>
      <button
        type="button"
        onClick={dismissFab}
        aria-label="Hide SWEP shortcut"
        className="-mt-1 flex size-6 items-center justify-center rounded-full bg-[var(--surface-page)] text-[var(--ink-500)] ring-1 ring-[var(--line)] hover:text-[var(--ink-900)]"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
