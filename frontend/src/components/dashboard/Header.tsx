'use client';

import React, { useEffect, useRef, useState } from 'react';
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

  const initials = (
    `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` ||
    user?.name?.slice(0, 2) ||
    'MK'
  ).toUpperCase();

  const hasHits = results && (results.courses.length > 0 || results.topics.length > 0);

  const topicHref = (t: SearchHit) => {
    const course = typeof t.course === 'object' ? t.course : null;
    if (course?._id) return `/dashboard/courses/${course._id}/topics/${t._id}`;
    return '/dashboard/courses';
  };

  return (
    <header
      data-purpose="top-header-bar"
      className="h-20 bg-cream-100/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="text-stone-600 hover:text-stone-900 lg:hidden p-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
          aria-label="Open navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Input with Command Key Pill */}
        <div className="relative w-full max-w-sm sm:w-96 min-w-0" ref={boxRef}>
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results && setOpenResults(true)}
            placeholder="Search courses, AI tools, topics..."
            className="w-full pl-10 pr-12 py-2 text-sm bg-white border border-stone-200 rounded-full shadow-sm placeholder:text-stone-400 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-stone-400 bg-stone-100 rounded border border-stone-300">
              ⌘K
            </kbd>
          </div>

          {openResults && query.trim() && (
            <div className="absolute top-full z-40 mt-2 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
              {!hasHits ? (
                <p className="px-4 py-3 text-sm text-stone-500">No matches for “{query.trim()}”</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-2 text-sm">
                  {results!.courses.map((c) => (
                    <li key={`c-${c._id}`}>
                      <button
                        type="button"
                        onClick={() => go(`/dashboard/courses/${c._id}`)}
                        className="flex w-full flex-col px-4 py-2 text-left hover:bg-stone-50 transition"
                      >
                        <span className="font-semibold text-stone-900">{c.title}</span>
                        <span className="text-[11px] text-stone-500">
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
                        className="flex w-full flex-col px-4 py-2 text-left hover:bg-stone-50 transition"
                      >
                        <span className="font-semibold text-stone-900">{t.title}</span>
                        <span className="text-[11px] text-stone-500">Topic</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Right Indicators and Utilities */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
        {/* Streak Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200/70 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="text-amber-500 flex items-center">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.08 8.16 13.93C8.07 13.84 8 13.72 7.94 13.6C6.88 11.96 6.88 9.69 7.74 7.94C5.97 9.53 4.96 11.94 5.03 14.37C5.12 17.5 7.42 20.24 10.5 20.84C13.95 21.5 17.3 19.82 18.59 16.66C19.26 14.96 19.04 12.87 17.66 11.2Z" />
            </svg>
          </span>
          <div className="text-xs">
            <span className="font-extrabold text-stone-900">{streak}</span>
            <span className="text-stone-500 font-medium"> day streak</span>
          </div>
        </div>

        {/* XP Pill */}
        <div className="hidden md:flex items-center gap-2 bg-purple-50 border border-purple-200/70 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="text-purple-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M7 2v11h3v9l7-12h-4l4-8z" />
            </svg>
          </span>
          <div className="text-xs">
            <span className="font-extrabold text-stone-900">{xp.toLocaleString()}</span>
            <span className="text-stone-500 font-medium"> XP</span>
          </div>
        </div>

        {/* Notification Bell Icon with unread indicator */}
        <button
          onClick={openDrawer}
          className="relative p-2.5 rounded-full bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all shadow-xs"
          aria-label="Open notifications"
        >
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full ring-2 ring-white" />
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-stone-200 hidden sm:block" />

        {/* Quick User Avatar button */}
        <Link href="/dashboard/profile" className="flex items-center gap-2.5 pl-1" aria-label="Profile">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-white overflow-hidden">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={'/images/mascot/tutor-mascot.webp'} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="text-sm font-semibold text-stone-800 hidden lg:inline">
            {user?.firstName || user?.name || 'Musa'}
          </span>
        </Link>
      </div>
    </header>
  );
}
