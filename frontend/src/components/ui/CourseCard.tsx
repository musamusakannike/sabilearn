'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CourseCardProps {
  id: string;
  image?: string;
  title: string;
  category?: string;
  description?: string;
  free?: boolean;
  price?: number;
  progress?: number;
  chapterTitle?: string;
  topicCount?: number;
  lessonCount?: number;
  lessonsCount?: string;
  difficulty?: string;
  totalObtainableXp?: number;
  ctaLabel?: string;
  href?: string;
  actions?: React.ReactNode;
}

export default function CourseCard({
  id,
  image,
  title,
  category,
  description,
  free = true,
  price: _price,
  progress,
  chapterTitle,
  topicCount,
  lessonCount,
  lessonsCount,
  difficulty,
  totalObtainableXp,
  ctaLabel,
  href,
  actions,
}: CourseCardProps) {
  const [hasImgError, setHasImgError] = useState(false);
  const showImage = Boolean(image) && !hasImgError;
  const to = href ?? (id.startsWith('sample-') ? '/dashboard/courses' : `/dashboard/courses/${id}`);

  const displayLessonsCount =
    lessonsCount ||
    (topicCount ? `${topicCount} Topics` : lessonCount ? `${lessonCount} Lessons` : '24 Lessons');

  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : 0;
  const currentChapter = chapterTitle || 'Chapter 1: Getting Started';
  const badgeDifficulty = difficulty || (free ? 'Free' : 'Beginner');

  return (
    <article className="group flex h-full flex-col justify-between overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md">
      {/* Visual Card Header */}
      <Link
        href={to}
        className="relative block h-36 w-full overflow-hidden rounded-t-lg border-b border-stone-150 bg-stone-100"
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            onError={() => setHasImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-amber-50 to-orange-100 text-3xl font-extrabold text-orange-600">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs ${
              badgeDifficulty.toLowerCase() === 'free'
                ? 'bg-orange-100 text-orange-800'
                : badgeDifficulty.toLowerCase() === 'intermediate'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {badgeDifficulty}
          </span>
        </div>
      </Link>

      {/* Content Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {actions && <div className="mb-2.5 flex items-center justify-end">{actions}</div>}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              {category || 'Development'}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-[11px] font-semibold text-stone-500">
              +{totalObtainableXp ?? 1000} XP
            </span>
          </div>
          <Link href={to}>
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-stone-900 transition-colors group-hover:text-orange-600">
              {title}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 text-xs text-stone-500">
            {description || 'Master modern concepts and build real-world applications.'}
          </p>
        </div>

        {/* Progress and Action Bar */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="mb-1.5 flex justify-between text-xs font-bold text-stone-600">
            <span className="truncate pr-2">{currentChapter}</span>
            <span className="shrink-0 text-orange-600">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div className="h-2 rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">{displayLessonsCount}</span>
            <Link
              href={to}
              className="rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700"
            >
              {ctaLabel ?? 'Continue Lesson'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

