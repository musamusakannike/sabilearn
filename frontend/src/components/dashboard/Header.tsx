'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, Bell, Search, Flame, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { progressApi, searchApi } from '@/lib/api';

type SearchHit = {
  _id: string;
  title?: string;
  category?: string;
  course?: { _id?: string; title?: string } | string;
};

type SearchResults = {
  courses: SearchHit[];
  topics: SearchHit[];
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuthStore();
  const { unreadCount, openDrawer, fetchNotifications } = useNotificationStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [openResults, setOpenResults] = useState(false);
  const [streak, setStreak] = useState(user?.currentStreak ?? 0);
  const [xp, setXp] = useState(user?.totalXp ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    (async () => {
      try {
        const res = await progressApi.dashboard();
        if (res.data?.success) {
          setStreak(res.data.data?.streak ?? 0);
          setXp(res.data.data?.totalXp ?? 0);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const t = setTimeout(async () => {
      try {
        const res = await searchApi.global(q);
        if (res.data?.success) {
          setResults({
            courses: res.data.data.courses || [],
            topics: res.data.data.topics || [],
          });
          setOpenResults(true);
        }
      } catch {
        setResults({ courses: [], topics: [] });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpenResults(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    setOpenResults(false);
    setQuery('');
    router.push(href);
  };

  const initials =
    `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() ||
    user?.name?.charAt(0)?.toUpperCase() ||
    'U';

  const hasHits = results && (results.courses.length > 0 || results.topics.length > 0);

  const topicHref = (t: SearchHit) => {
    const course = typeof t.course === 'object' ? t.course : null;
    if (course?._id) return `/dashboard/courses/${course._id}/topics/${t._id}`;
    return '/dashboard/courses';
  };

  return (
    <header className="z-10 shrink-0 border-b border-[var(--line)] bg-[var(--surface-page)]/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:h-20 lg:px-8 lg:py-0">
      <div className="flex h-full flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="shrink-0 text-[var(--ink-500)] hover:text-[var(--ink-900)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>

          <div className="relative w-full max-w-md min-w-0" ref={boxRef}>
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-300)]">
              <Search className="size-4" />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results && setOpenResults(true)}
              placeholder="Search courses, AI tools, topics..."
              className="w-full rounded-full border border-[var(--line)] bg-[var(--surface-card)] py-2 pr-12 pl-10 text-sm text-[var(--ink-900)] shadow-sm outline-none placeholder:text-[var(--ink-300)] focus:border-transparent focus:ring-2 focus:ring-[var(--brand-gold)]"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-3 sm:flex">
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink-300)]">
                ⌘K
              </kbd>
            </div>
            {openResults && query.trim() && (
              <div className="absolute top-full z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] shadow-lg">
                {!hasHits ? (
                  <p className="px-4 py-3 text-sm text-[var(--ink-500)]">No matches for “{query.trim()}”</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto py-2 text-sm">
                    {results!.courses.map((c) => (
                      <li key={`c-${c._id}`}>
                        <button
                          type="button"
                          onClick={() => go(`/dashboard/courses/${c._id}`)}
                          className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--surface-sunken)]"
                        >
                          <span className="font-semibold text-[var(--ink-900)]">{c.title}</span>
                          <span className="text-[11px] text-[var(--ink-500)]">
                            Course{c.category ? ` · ${c.category}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                    {results!.topics.map((t) => (
                      <li key={`t-${t._id}`}>
                        <button
                          type="button"
                          onClick={() => go(topicHref(t))}
                          className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--surface-sunken)]"
                        >
                          <span className="font-semibold text-[var(--ink-900)]">{t.title}</span>
                          <span className="text-[11px] text-[var(--ink-500)]">Topic</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--brand-gold-100)] bg-[var(--brand-gold-100)]/60 px-3.5 py-1.5 sm:flex">
            <Flame className="size-5 fill-current text-[var(--brand-gold-dark)]" />
            <div className="text-xs">
              <span className="font-extrabold text-[var(--ink-900)]">{streak}</span>
              <span className="font-medium text-[var(--ink-500)]"> day streak</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)]/70 px-3.5 py-1.5 md:flex">
            <Zap className="size-4 fill-current text-[var(--brand-violet)]" />
            <div className="text-xs">
              <span className="font-extrabold text-[var(--ink-900)]">{xp.toLocaleString()}</span>
              <span className="font-medium text-[var(--ink-500)]"> XP</span>
            </div>
          </div>
          <button
            onClick={openDrawer}
            className="relative rounded-full border border-[var(--line)] bg-[var(--surface-card)] p-2.5 text-[var(--ink-700)] shadow-sm transition-all hover:border-[var(--ink-300)] hover:text-[var(--ink-900)]"
            aria-label="Open notifications"
          >
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[var(--brand-gold-dark)] ring-2 ring-white" />
            )}
            <Bell className="size-4" strokeWidth={2} />
          </button>
          <div className="hidden h-6 w-px bg-[var(--line)] sm:block" />
          <Link href="/dashboard/profile" className="flex items-center gap-2.5 pl-1" aria-label="Profile">
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[var(--brand-gold-dark)] to-[var(--brand-gold)] text-xs font-bold text-[var(--ink-900)] ring-2 ring-white">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="size-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="hidden text-sm font-semibold text-[var(--ink-900)] lg:inline">
              {user?.firstName || 'You'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
