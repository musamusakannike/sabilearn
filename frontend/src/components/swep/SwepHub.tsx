'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileQuestion, ImageIcon, Lock } from 'lucide-react';
import { courseApi } from '@/lib/api';
import { Course } from '@/lib/types';
import { swepQuiz } from '@/lib/swep';
import CourseCard from '@/components/ui/CourseCard';

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
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div className="flex size-28 shrink-0 items-end justify-center overflow-hidden rounded-3xl bg-[var(--brand-gold-100)] sm:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mascot/mascot-unilorin.webp"
              alt="Unilorin mascot"
              className="h-[7.5rem] w-auto object-contain sm:h-[8.5rem]"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold tracking-wide text-[var(--brand-gold-600)] uppercase">
              University of Ilorin · Free
            </p>
            <h1 className="mt-1 text-3xl font-[var(--font-display)] font-bold text-[var(--ink-900)] sm:text-4xl">
              SWEP 2026
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {swepQuiz.totalQuestions} past questions across {swepQuiz.totalUnits} workshop units.
              Practice with instant feedback — prepared by {swepQuiz.preparedBy}.
            </p>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mt-4 flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--brand-gold)]/40 bg-[var(--brand-gold-100)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-900)]">
            You&apos;re practicing as a guest. Sign up free to unlock all {swepQuiz.totalQuestions} questions.
          </p>
          <Link
            href="/auth/register"
            className="shrink-0 text-sm font-semibold text-[var(--brand-gold-600)] hover:opacity-80"
          >
            Create a free account
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href={`${base}/practice`}
          className="group flex flex-col rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)] hover:shadow-[var(--shadow-md)]"
        >
          <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-gold-100)]">
            <FileQuestion className="size-5 text-[var(--brand-gold-600)]" />
          </div>
          <h2 className="text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">Past questions</h2>
          <p className="mt-1 flex-1 text-sm text-[var(--text-muted)]">
            Filter by unit, go random, pick how many questions, then practice with explanations.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-gold-600)]">
            Start practice <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-6 opacity-90">
          <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-sunken)]">
            <ImageIcon className="size-5 text-[var(--ink-500)]" />
          </div>
          <h2 className="text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">Diagrams</h2>
          <p className="mt-1 flex-1 text-sm text-[var(--text-muted)]">
            Workshop diagrams and labelled figures for each unit.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--ink-500)] uppercase">
            <Lock className="size-3.5" /> Coming soon
          </span>
        </div>
      </div>

      {courses.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">Also on SabiLearn</h2>
              <p className="text-sm text-[var(--text-muted)]">Keep going with full courses after SWEP practice.</p>
            </div>
            <Link href="/dashboard/courses" className="text-sm font-semibold text-[var(--brand-gold-600)]">
              All courses
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                id={course._id}
                image={course.banner}
                title={course.title}
                category={course.category}
                description={course.description}
                free={course.isFree}
                price={course.price}
                topicCount={course.topicCount}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
