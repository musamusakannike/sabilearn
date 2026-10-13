'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Check, FileQuestion, ListOrdered, Lock, Shuffle, Sparkles } from 'lucide-react';
import {
  COUNT_OPTIONS,
  GUEST_MAX_QUESTIONS,
  SWEP_EDITIONS,
  SwepYear,
  filterQuestions,
  getSwepQuiz,
  parseYearParam,
  swepPracticeHref,
} from '@/lib/swep';

type Step = 1 | 2 | 3;

export default function SwepPracticeSetup({
  base,
  isAuthenticated,
}: {
  base: '/swep' | '/dashboard/swep';
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize year from URL query parameter (defaulting to 2018 if specified or requested)
  const initialYear = parseYearParam(searchParams.get('year'));
  const [year, setYear] = useState<SwepYear>(initialYear);

  const [step, setStep] = useState<Step>(1);
  const [unit, setUnit] = useState<number | 'all'>('all');
  const [random, setRandom] = useState(true);
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState('10');

  const activeQuiz = useMemo(() => getSwepQuiz(year), [year]);
  const poolSize = useMemo(() => filterQuestions(unit, year).length, [unit, year]);
  const guestMax = Math.min(GUEST_MAX_QUESTIONS, poolSize);
  const maxAllowed = isAuthenticated ? poolSize : guestMax;

  const handleYearChange = (newYear: SwepYear) => {
    setYear(newYear);
    setUnit('all'); // Reset unit selection when switching examination edition
  };

  const applyCount = (n: number) => {
    const clamped = Math.max(1, Math.min(n, poolSize));
    setCount(clamped);
    setCustomCount(String(clamped));
  };

  const guestLocked = !isAuthenticated && count > guestMax;
  const start = () => {
    if (guestLocked) {
      router.push('/auth/register');
      return;
    }
    const sessionCount = Math.min(count, maxAllowed);
    router.push(swepPracticeHref(base, { year, unit, count: sessionCount, random }));
  };

  const steps = [
    { n: 1 as const, label: 'Edition & Unit' },
    { n: 2 as const, label: 'Order' },
    { n: 3 as const, label: 'Quantity' },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-4 sm:px-0">
      <Link
        href={base}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--ink-900)]"
      >
        <ArrowLeft className="size-4" /> Back to SWEP Hub
      </Link>

      {/* Stepper Indicator */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-1 flex-col gap-1.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                s.n < step ? 'bg-[#22C55E]' : s.n === step ? 'bg-[#FF8A00]' : 'bg-slate-200'
              }`}
            />
            <span
              className={`text-[11px] font-semibold ${
                s.n === step ? 'text-[var(--ink-900)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {s.n}. {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        {step === 1 && (
          <>
            <div className="mb-5">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">
                Select Year & Unit
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose the past question edition, then pick a workshop unit or study across all units.
              </p>
            </div>

            {/* Edition Switcher Tabs */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
                Examination Edition
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-sunken)] p-1.5">
                <button
                  type="button"
                  onClick={() => handleYearChange('2018')}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl py-2.5 px-3 text-center transition-all ${
                    year === '2018'
                      ? 'bg-[var(--surface-card)] shadow-xs font-bold text-[var(--ink-900)] ring-1 ring-black/5'
                      : 'text-[var(--text-muted)] hover:text-[var(--ink-800)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm">
                    <BookOpen className="size-4 text-[var(--brand-gold)]" />
                    SWEP 2018
                  </span>
                  <span className="text-[11px] font-medium text-[var(--brand-gold-600)]">
                    321 Official Questions
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleYearChange('2025')}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl py-2.5 px-3 text-center transition-all ${
                    year === '2025'
                      ? 'bg-[var(--surface-card)] shadow-xs font-bold text-[var(--ink-900)] ring-1 ring-black/5'
                      : 'text-[var(--text-muted)] hover:text-[var(--ink-800)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm">
                    <FileQuestion className="size-4 text-sky-600" />
                    SWEP 2025/2026
                  </span>
                  <span className="text-[11px] font-medium text-sky-600">
                    180 Practice Questions
                  </span>
                </button>
              </div>
            </div>

            {/* Units Selection List */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
                  Workshop Units ({activeQuiz.totalUnits})
                </label>
                <span className="text-xs font-semibold text-[var(--brand-gold-600)]">
                  {year === '2018' ? 'Official Exam Units' : 'Modern Rotation Units'}
                </span>
              </div>

              <div className="grid max-h-[20rem] gap-2 overflow-y-auto pr-1">
                {/* All Units Option */}
                <button
                  type="button"
                  onClick={() => setUnit('all')}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    unit === 'all'
                      ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/60 text-[var(--ink-900)] shadow-xs'
                      : 'border-[var(--line)] text-[var(--ink-800)] hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="block font-bold text-sm sm:text-base">
                      All Workshop Units Combined
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Comprehensive simulation across all {activeQuiz.totalUnits} rotations
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--surface-card)] px-2.5 py-1 text-xs font-bold text-[var(--brand-gold-700)]">
                    {activeQuiz.totalQuestions} Qs
                  </span>
                </button>

                {/* Individual Units */}
                {activeQuiz.units.map((u) => (
                  <button
                    key={u.unitNumber}
                    type="button"
                    onClick={() => setUnit(u.unitNumber)}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      unit === u.unitNumber
                        ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/60 text-[var(--ink-900)] shadow-xs'
                        : 'border-[var(--line)] text-[var(--ink-800)] hover:border-slate-400'
                    }`}
                  >
                    <div className="pr-2">
                      <span className="block text-xs font-bold uppercase tracking-wider text-[var(--brand-gold-600)]">
                        Unit {u.unitNumber}
                      </span>
                      <span className="block text-sm font-semibold text-[var(--ink-900)]">
                        {u.unitName}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)]">
                      {u.questionCount} Qs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">Question Order</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Random is closer to the real CBT exam experience. Sequential follows the booklet question numbering.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => setRandom(true)}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 text-left transition-all ${
                  random
                    ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/50'
                    : 'border-[var(--line)] hover:border-slate-400'
                }`}
              >
                <Shuffle className="mt-0.5 size-5 shrink-0 text-[#FF8A00]" />
                <span>
                  <span className="block font-bold text-[var(--ink-900)]">Random (Shuffled)</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                    Shuffle questions randomly from the chosen {poolSize} pool.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRandom(false)}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 text-left transition-all ${
                  !random
                    ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/50'
                    : 'border-[var(--line)] hover:border-slate-400'
                }`}
              >
                <ListOrdered className="mt-0.5 size-5 shrink-0 text-[#FF8A00]" />
                <span>
                  <span className="block font-bold text-[var(--ink-900)]">Sequential (Chronological)</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                    Follow the exact paper sequence from Question 1 to {poolSize}.
                  </span>
                </span>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">How Many Questions?</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              <strong className="text-[var(--ink-900)]">{poolSize} questions</strong> available in this {year === '2018' ? '2018' : '2025'} set
              {!isAuthenticated && ` · guests can take up to ${guestMax}`}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-6">
              {COUNT_OPTIONS.map((n) => {
                const disabledByPool = n > poolSize;
                const locked = !isAuthenticated && n > guestMax;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabledByPool}
                    onClick={() => applyCount(n)}
                    className={`relative cursor-pointer rounded-2xl border py-4 text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-40 ${
                      count === n
                        ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/70 text-[var(--ink-900)]'
                        : 'border-[var(--line)] text-[var(--text-muted)] hover:border-slate-400'
                    }`}
                  >
                    {n}
                    {locked && !disabledByPool && (
                      <Lock className="absolute top-1.5 right-1.5 size-3 text-[var(--ink-400)]" />
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => applyCount(poolSize)}
                className={`relative cursor-pointer rounded-2xl border py-4 text-sm font-bold transition-all ${
                  count === poolSize
                    ? 'border-2 border-[var(--brand-gold)] bg-[var(--brand-gold-100)]/70 text-[var(--ink-900)]'
                    : 'border-[var(--line)] text-[var(--text-muted)] hover:border-slate-400'
                }`}
              >
                All ({poolSize})
                {!isAuthenticated && poolSize > guestMax && (
                  <Lock className="absolute top-1.5 right-1.5 size-3 text-[var(--ink-400)]" />
                )}
              </button>
            </div>

            <label className="mt-6 flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[var(--ink-900)]">Or enter custom count:</span>
              <input
                type="number"
                min={1}
                max={poolSize}
                value={customCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCustomCount(raw);
                  const n = Number(raw);
                  if (Number.isInteger(n) && n >= 1) applyCount(n);
                }}
                className="rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--surface-card)] px-4 py-3 text-base text-[var(--ink-900)] outline-none focus:border-[var(--brand-gold)]"
              />
              <span className="text-xs text-[var(--text-muted)]">
                Between 1 and {poolSize} questions
                {guestLocked && (
                  <>
                    {' · '}
                    <Link href="/auth/register" className="font-semibold text-[#FF8A00] hover:underline">
                      Sign up free
                    </Link>{' '}
                    to practice beyond {guestMax} questions
                  </>
                )}
              </span>
            </label>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
              className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs transition-all hover:bg-[var(--surface-sunken)] active:scale-95"
              aria-label="Previous step"
            >
              <ArrowLeft className="size-6 stroke-[2.5]" />
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)))}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-[#FF8A00] px-8 py-4 text-lg font-bold tracking-wide text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#F07D00] active:scale-[0.98]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={count < 1}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-[#FF8A00] px-8 py-4 text-lg font-bold tracking-wide text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#F07D00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guestLocked
                ? 'Sign up to start this set'
                : `Start ${Math.min(count, maxAllowed)} ${year === '2018' ? '2018' : '2025'} Questions`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
