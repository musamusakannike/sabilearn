'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Code2, GraduationCap, Smartphone, Sparkles, Trophy } from 'lucide-react';

export const APP_STORE_URL = 'https://apps.apple.com/us/app/sabilearn/id6800027018';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.codiac.sabilearn';

export type PromoKind = 'playground' | 'ai' | 'swep' | 'pro' | 'app' | 'leaderboard';

export interface PromoBanner {
  kind: PromoKind;
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
}

export const COURSE_PROMOS: PromoBanner[] = [
  {
    kind: 'playground',
    kicker: 'Browser IDE',
    title: 'Code Playground',
    body: 'Write and run HTML, CSS, JavaScript, and Python in the browser — no install.',
    href: '/dashboard/playground',
    cta: 'Open Playground',
  },
  {
    kind: 'ai',
    kicker: 'AI Study Suite',
    title: 'Summaries, quizzes & courses',
    body: 'Turn lecture notes into summaries, practice tests, or a full structured track.',
    href: '/dashboard/ai/quiz',
    cta: 'Try AI tools',
  },
  {
    kind: 'swep',
    kicker: 'Unilorin',
    title: 'SWEP past questions',
    body: 'Practice with the SWEP bank and timed quizzes built for Unilorin students.',
    href: '/dashboard/swep',
    cta: 'Open SWEP',
  },
  {
    kind: 'pro',
    kicker: 'SabiLearn Pro',
    title: 'Unlock every premium course',
    body: 'One monthly plan for all-access courses, AI generation, and verified certs.',
    href: '/dashboard/subscribe',
    cta: 'See plans',
  },
  {
    kind: 'app',
    kicker: 'Learn on the go',
    title: 'SabiLearn on iOS & Android',
    body: 'Pick up streaks, lessons, and quizzes from your phone. Same account, same progress.',
    href: PLAY_STORE_URL,
    cta: 'Get the app',
    external: true,
  },
  {
    kind: 'leaderboard',
    kicker: 'XP Sprint',
    title: 'Climb the weekly leaderboard',
    body: 'Earn XP from lessons and quizzes. See how you stack up against other learners.',
    href: '/dashboard/leaderboard',
    cta: 'View leaderboard',
  },
];

const KIND_STYLES: Record<
  PromoKind,
  { wrap: string; iconWrap: string; kicker: string; cta: string; Icon: typeof Code2 }
> = {
  playground: {
    wrap: 'border-[var(--brand-gold-100)] bg-gradient-to-br from-[var(--brand-gold-100)] via-[var(--surface-sunken)] to-[var(--brand-gold-100)]',
    iconWrap: 'bg-[var(--brand-gold-dark)] text-[var(--ink-900)]',
    kicker: 'bg-white/70 text-[var(--brand-gold-600)]',
    cta: 'bg-[var(--brand-gold)] text-[var(--ink-900)] hover:bg-[var(--brand-gold-600)]',
    Icon: Code2,
  },
  ai: {
    wrap: 'border-[var(--brand-violet-100)] bg-gradient-to-br from-[var(--brand-violet-100)] via-[var(--surface-card)] to-[var(--brand-violet-100)]',
    iconWrap: 'bg-[var(--brand-violet)] text-white',
    kicker: 'bg-white/80 text-[var(--brand-violet-600)]',
    cta: 'bg-[var(--brand-violet)] text-white hover:bg-[var(--brand-violet-600)]',
    Icon: Sparkles,
  },
  swep: {
    wrap: 'border-[var(--line)] bg-gradient-to-br from-[var(--ink-900)] to-[#1c1c2e] text-white',
    iconWrap: 'bg-[var(--brand-gold)] text-[var(--ink-900)]',
    kicker: 'bg-white/10 text-[var(--brand-gold)]',
    cta: 'bg-[var(--brand-gold)] text-[var(--ink-900)] hover:bg-[var(--brand-gold-600)]',
    Icon: GraduationCap,
  },
  pro: {
    wrap: 'border-[var(--brand-gold-100)] bg-gradient-to-r from-[var(--surface-card)] to-[var(--brand-gold-100)]',
    iconWrap: 'bg-[var(--ink-900)] text-[var(--brand-gold)]',
    kicker: 'bg-[var(--ink-900)] text-[var(--brand-gold)]',
    cta: 'bg-[var(--ink-900)] text-white hover:opacity-90',
    Icon: Sparkles,
  },
  app: {
    wrap: 'border-[var(--line)] bg-[var(--surface-card)]',
    iconWrap: 'bg-[var(--surface-sunken)] text-[var(--ink-900)]',
    kicker: 'bg-[var(--surface-sunken)] text-[var(--ink-700)]',
    cta: 'bg-[var(--ink-900)] text-white hover:opacity-90',
    Icon: Smartphone,
  },
  leaderboard: {
    wrap: 'border-[var(--brand-gold-100)] bg-[var(--surface-card)]',
    iconWrap: 'bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]',
    kicker: 'bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]',
    cta: 'bg-[var(--brand-gold)] text-[var(--ink-900)] hover:bg-[var(--brand-gold-600)]',
    Icon: Trophy,
  },
};

export default function FeaturePromoBanner({ banner }: { banner: PromoBanner }) {
  const style = KIND_STYLES[banner.kind];
  const Icon = style.Icon;
  const isDark = banner.kind === 'swep';

  return (
    <div
      className={`relative col-span-1 overflow-hidden rounded-3xl border p-6 shadow-sm md:col-span-2 lg:col-span-3 ${style.wrap}`}
    >
      <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-white/20 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-md ${style.iconWrap}`}>
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${style.kicker}`}>
              {banner.kicker}
            </span>
            <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[var(--ink-900)]'}`}>{banner.title}</h3>
            <p className={`mt-1 max-w-xl text-xs leading-relaxed font-medium ${isDark ? 'text-white/80' : 'text-[var(--ink-700)]'}`}>
              {banner.body}
            </p>
          </div>
        </div>
        {banner.kind === 'app' ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition ${style.cta}`}
            >
              Google Play
              <ArrowRight className="size-3.5" />
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[var(--ink-700)] underline-offset-2 hover:underline"
            >
              App Store
            </a>
          </div>
        ) : banner.external ? (
          <a
            href={banner.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition ${style.cta}`}
          >
            {banner.cta}
            <ArrowRight className="size-3.5" />
          </a>
        ) : (
          <Link
            href={banner.href}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition ${style.cta}`}
          >
            {banner.cta}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Courses between banners: one viewport of rows, using card row height ~380px. */
export function bannerEveryNCourses(width: number, height: number): number {
  const cols = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
  const rowHeight = 380;
  const usable = Math.max(360, height - 220);
  const rows = Math.max(1, Math.round(usable / rowHeight));
  return cols * rows;
}
