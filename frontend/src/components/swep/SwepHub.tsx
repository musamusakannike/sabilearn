'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { courseApi } from '@/lib/api';
import { Course } from '@/lib/types';
import { SWEP_EDITIONS, TOTAL_SWEP_QUESTIONS } from '@/lib/swep';

export default function SwepHub({
  base,
  isAuthenticated,
}: {
  base: '/swep' | '/dashboard/swep';
  isAuthenticated: boolean;
}) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await courseApi.popular();
        const list = (res.data?.data || []) as Course[];
        setCourses(Array.isArray(list) ? list.slice(0, 3) : []);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-[var(--brand-gold-100)] sm:size-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mascot/mascot-unilorin.webp"
            alt=""
            className="h-11 w-auto object-contain sm:h-12"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-[var(--ink-500)] uppercase">
            University of Ilorin
          </p>
          <h1 className="text-lg font-[var(--font-display)] font-bold tracking-tight text-[var(--ink-900)] sm:text-xl">
            SWEP workshop practice
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ink-500)]">
            {TOTAL_SWEP_QUESTIONS} questions with explanations. Free.
          </p>
        </div>
      </header>

      {!isAuthenticated ? (
        <p className="mt-4 text-sm text-[var(--ink-700)]">
          Guests can try a short set.{' '}
          <Link href="/auth/register" className="font-semibold text-[var(--ink-900)] underline-offset-2 hover:underline">
            Create a free account
          </Link>{' '}
          to unlock all questions and save scores.
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">Choose a set</h2>
          <Link
            href={`${base}/practice`}
            className="text-sm font-medium text-[var(--ink-700)] underline-offset-2 hover:underline"
          >
            Custom setup
          </Link>
        </div>

        <ul className="mt-1">
          {SWEP_EDITIONS.map((edition, index) => (
            <li
              key={edition.id}
              className={index === 0 ? 'border-b border-[var(--line-muted)] py-5' : 'py-5'}
            >
              <h3 className="text-base font-semibold text-[var(--ink-900)]">{edition.shortLabel}</h3>
              <p className="mt-0.5 text-sm text-[var(--ink-500)]">{edition.badge}</p>
              <p className="mt-2 hidden text-sm leading-relaxed text-[var(--ink-700)] sm:block">
                {edition.description}
              </p>
              <Link
                href={`${base}/practice?year=${edition.id}`}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--brand-gold)] px-4 text-sm font-semibold text-[var(--ink-900)] sm:inline-flex sm:w-auto"
              >
                Practice {edition.id === '2018' ? '2018' : '2025/2026'}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {courses.length > 0 ? (
        <section className="mt-4 border-t border-[var(--line-muted)] pt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">More courses</h2>
            <Link
              href="/dashboard/courses"
              className="text-sm font-medium text-[var(--ink-700)] underline-offset-2 hover:underline"
            >
              All courses
            </Link>
          </div>
          <ul className="mt-3">
            {courses.map((course) => (
              <li key={course._id} className="border-b border-[var(--line-muted)] last:border-b-0">
                <Link
                  href={`/dashboard/courses/${course._id}`}
                  className="flex min-h-12 items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-[var(--ink-900)]">
                    {course.title}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ink-500)]">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
