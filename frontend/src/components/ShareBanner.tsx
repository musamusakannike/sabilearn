"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function ShareBanner() {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[var(--accent-subtle)] border-b border-[var(--accent-muted)] py-3 px-4 sm:px-6 relative z-50">
      <div className="max-w-6xl mx-auto relative flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left pr-10 sm:pr-12">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">💡</span>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
            You are viewing a shared learning resource from <span className="font-bold text-[var(--accent)]">Sabi Learn</span>. Sabi the way your brain dey work!
          </p>
        </div>
        {!loading && !user && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/50 font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] px-4 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              Create free account
            </Link>
          </div>
        )}
        {!loading && user && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] px-4 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50 transition-colors cursor-pointer"
          aria-label="Close banner"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

