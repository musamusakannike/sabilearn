'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  ImageIcon,
  Layers,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { courseApi } from '@/lib/api';
import { Course } from '@/lib/types';
import { SWEP_EDITIONS, TOTAL_SWEP_QUESTIONS, swep2018Quiz, swep2025Quiz } from '@/lib/swep';
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
    <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--brand-gold)]/20 bg-gradient-to-br from-[var(--surface-card)] via-[var(--surface-card)] to-[var(--brand-gold-100)]/40 p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative flex size-28 shrink-0 items-end justify-center overflow-hidden rounded-3xl bg-[var(--brand-gold-100)] shadow-inner sm:size-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mascot/mascot-unilorin.webp"
              alt="Unilorin mascot"
              className="h-[7.5rem] w-auto object-contain sm:h-[8.5rem]"
            />
            <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-[var(--brand-gold)] text-[10px] font-black text-white shadow-sm">
              ★
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold-100)] px-3 py-0.5 text-xs font-bold text-[var(--brand-gold-600)] uppercase">
                <GraduationCap className="size-3.5" /> University of Ilorin
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-3.5" /> 100% Free Access
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-[var(--font-display)] font-extrabold tracking-tight text-[var(--ink-900)] sm:text-4xl">
              SWEP Past Questions & Workshop Practice
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Master your engineering workshop rotations with <strong className="text-[var(--ink-900)]">{TOTAL_SWEP_QUESTIONS} past questions</strong>.
              Includes authentic 2018 examination papers and the 2025/2026 practice curriculum with instant feedback and explanations.
            </p>

            {/* Quick Stat Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-800)] shadow-xs">
                📄 <strong>321</strong> 2018 Exam Questions
              </span>
              <span className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-800)] shadow-xs">
                🎯 <strong>180</strong> 2025/2026 Prep Questions
              </span>
              <span className="rounded-xl border border-[var(--line)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-800)] shadow-xs">
                ⚡ <strong>8-9</strong> Workshop Units
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Notice Banner */}
      {!isAuthenticated && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[var(--brand-gold)]/40 bg-[var(--brand-gold-100)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-900)]">
            You&apos;re currently practicing as a guest. Create a free account to track high scores, earn XP, and unlock all {TOTAL_SWEP_QUESTIONS} questions!
          </p>
          <Link
            href="/auth/register"
            className="shrink-0 text-sm font-bold text-[var(--brand-gold-600)] hover:underline"
          >
            Create free account →
          </Link>
        </div>
      )}

      {/* Past Questions Editions Header */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-[var(--font-display)] font-extrabold text-[var(--ink-900)] sm:text-2xl">
            Choose Examination Year
          </h2>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Select an edition to start a targeted unit practice or full exam simulation.
          </p>
        </div>
        <Link
          href={`${base}/practice`}
          className="hidden items-center gap-1.5 text-sm font-semibold text-[var(--brand-gold-600)] hover:underline sm:inline-flex"
        >
          Custom setup <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Editions Grid */}
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {/* Edition 1: 2018 Past Questions */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border-2 border-[var(--brand-gold)]/50 bg-[var(--surface-card)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand-gold)] hover:shadow-[var(--shadow-lg)]">
          <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[var(--brand-gold-100)] opacity-60 blur-xl" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]">
                <BookOpen className="size-6" />
              </div>
              <span className="rounded-full bg-[var(--brand-gold-100)] px-3 py-1 text-xs font-bold text-[var(--brand-gold-700)]">
                ⭐ Official Exam Paper
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-[var(--font-display)] font-black text-[var(--ink-900)]">
              SWEP 2018 Past Questions
            </h3>
            <p className="mt-1 text-xs font-semibold text-[var(--brand-gold-600)] uppercase">
              321 Questions · 8 Workshop Units · 2017/2018 Session
            </p>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Authentic past questions extracted directly from the official Unilorin SWEP 2018 exam papers across all 8 workshop units with verified answers and explanations.
            </p>

            {/* Units Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Foundry (28)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Chemical (30)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Plumbing & Concrete (57)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Automobile & Diesel (67)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Machining & Welding (71)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Electrical & Electronics (40)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Equipment Maint. (15)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Biomedical (13)
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--line)]">
            <Link
              href={`${base}/practice?year=2018`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-gold-600)] active:scale-[0.99]"
            >
              Practice 2018 Questions <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Edition 2: 2025/2026 Practice Questions */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border-2 border-sky-400/50 bg-[var(--surface-card)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:shadow-[var(--shadow-lg)]">
          <div className="absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-sky-100 opacity-60 blur-xl" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <FileQuestion className="size-6" />
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                ✨ Modern Practice Set
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-[var(--font-display)] font-black text-[var(--ink-900)]">
              SWEP 2025/2026 Practice Set
            </h3>
            <p className="mt-1 text-xs font-semibold text-sky-600 uppercase">
              180 Questions · 9 Workshop Units · Prepared by Mr. Maven
            </p>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Curated practice test bank matching the modern SWEP curriculum with step-by-step explanations, including Aeroponics and Wood & Upholstery.
            </p>

            {/* Units Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Chemical Process (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Foundry (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                PCB (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                MPA (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                MMF (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                EPE (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Food & Aeroponics (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Equipment Maint. (20)
              </span>
              <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                Biomedical & Wood (20)
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--line)]">
            <Link
              href={`${base}/practice?year=2025`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.99]"
            >
              Practice 2025/2026 Set <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Features: Custom Practice & Diagrams */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href={`${base}/practice`}
          className="group flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 transition-all hover:border-[var(--brand-gold)] hover:shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--ink-900)]">Custom Practice Mode</h4>
              <p className="text-xs text-[var(--text-muted)]">Configure order, question count, and switch editions easily</p>
            </div>
          </div>
          <ArrowRight className="size-5 text-[var(--brand-gold-600)] transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 opacity-80">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--surface-sunken)] text-[var(--ink-500)]">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--ink-900)]">Workshop Diagrams</h4>
              <p className="text-xs text-[var(--text-muted)]">Visual component layouts & labeled apparatus</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-500)] uppercase">
            <Lock className="size-3" /> Coming soon
          </span>
        </div>
      </div>

      {/* Suggested Courses */}
      {courses.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-[var(--font-display)] font-extrabold text-[var(--ink-900)]">
                More Engineering Courses on SabiLearn
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Accelerate your university grades with full structured courses.</p>
            </div>
            <Link href="/dashboard/courses" className="text-sm font-semibold text-[var(--brand-gold-600)] hover:underline">
              All courses →
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
