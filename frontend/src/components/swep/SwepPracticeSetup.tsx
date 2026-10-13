'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import {
  COUNT_OPTIONS,
  GUEST_MAX_QUESTIONS,
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
    setUnit('all');
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
    { n: 1 as const, label: 'Set & unit' },
    { n: 2 as const, label: 'Order' },
    { n: 3 as const, label: 'Count' },
  ];

  const selectedRow = 'bg-[var(--brand-gold-100)]/70 text-[var(--ink-900)]';
  const idleRow = 'text-[var(--ink-800)]';

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={base}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="mt-4 flex gap-2" aria-label="Setup steps">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-1 flex-col gap-1">
            <div
              className={`h-1 rounded-full ${
                s.n <= step ? 'bg-[var(--ink-900)]' : 'bg-[var(--line)]'
              }`}
            />
            <span className={`text-[11px] ${s.n === step ? 'font-semibold text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 pb-24">
        {step === 1 && (
          <>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">Set and unit</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">Pick an edition, then a workshop unit.</p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-sunken)] p-1">
              <button
                type="button"
                onClick={() => handleYearChange('2018')}
                className={`min-h-12 cursor-pointer rounded-lg px-2 text-center text-sm transition-colors ${
                  year === '2018' ? 'bg-[var(--surface-page)] font-semibold text-[var(--ink-900)]' : 'text-[var(--ink-500)]'
                }`}
              >
                2018
                <span className="mt-0.5 block text-[11px] font-medium">321 questions</span>
              </button>
              <button
                type="button"
                onClick={() => handleYearChange('2025')}
                className={`min-h-12 cursor-pointer rounded-lg px-2 text-center text-sm transition-colors ${
                  year === '2025' ? 'bg-[var(--surface-page)] font-semibold text-[var(--ink-900)]' : 'text-[var(--ink-500)]'
                }`}
              >
                2025/2026
                <span className="mt-0.5 block text-[11px] font-medium">180 questions</span>
              </button>
            </div>

            <p className="mt-5 mb-1 text-[11px] font-semibold tracking-wide text-[var(--ink-500)] uppercase">
              Units
            </p>
            <div className="divide-y divide-[var(--line-muted)]">
              <button
                type="button"
                onClick={() => setUnit('all')}
                className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-2 py-3 text-left ${
                  unit === 'all' ? selectedRow : idleRow
                }`}
              >
                <span className="text-sm font-semibold">All units</span>
                <span className="text-xs text-[var(--ink-500)]">{activeQuiz.totalQuestions}</span>
              </button>
              {activeQuiz.units.map((u) => (
                <button
                  key={u.unitNumber}
                  type="button"
                  onClick={() => setUnit(u.unitNumber)}
                  className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-2 py-3 text-left ${
                    unit === u.unitNumber ? selectedRow : idleRow
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-[var(--ink-500)]">Unit {u.unitNumber}</span>
                    <span className="block truncate text-sm font-medium text-[var(--ink-900)]">{u.unitName}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ink-500)]">{u.questionCount}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">Question order</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Random is closer to a CBT paper. Sequential follows booklet numbering.
            </p>
            <div className="mt-4 divide-y divide-[var(--line-muted)]">
              <button
                type="button"
                onClick={() => setRandom(true)}
                className={`flex min-h-14 w-full cursor-pointer flex-col items-start px-2 py-3 text-left ${
                  random ? selectedRow : idleRow
                }`}
              >
                <span className="text-sm font-semibold text-[var(--ink-900)]">Random</span>
                <span className="text-sm text-[var(--ink-500)]">Shuffle from {poolSize} questions</span>
              </button>
              <button
                type="button"
                onClick={() => setRandom(false)}
                className={`flex min-h-14 w-full cursor-pointer flex-col items-start px-2 py-3 text-left ${
                  !random ? selectedRow : idleRow
                }`}
              >
                <span className="text-sm font-semibold text-[var(--ink-900)]">Sequential</span>
                <span className="text-sm text-[var(--ink-500)]">Question 1 through {poolSize}</span>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">How many questions?</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              {poolSize} available
              {!isAuthenticated ? ` · guests up to ${guestMax}` : ''}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {COUNT_OPTIONS.map((n) => {
                const disabledByPool = n > poolSize;
                const locked = !isAuthenticated && n > guestMax;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabledByPool}
                    onClick={() => applyCount(n)}
                    className={`relative min-h-12 cursor-pointer rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:opacity-35 ${
                      count === n ? selectedRow : 'bg-[var(--surface-sunken)] text-[var(--ink-700)]'
                    }`}
                  >
                    {n}
                    {locked && !disabledByPool ? (
                      <Lock className="absolute top-1.5 right-1.5 size-3 text-[var(--ink-400)]" />
                    ) : null}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => applyCount(poolSize)}
                className={`relative min-h-12 cursor-pointer rounded-xl text-sm font-semibold ${
                  count === poolSize ? selectedRow : 'bg-[var(--surface-sunken)] text-[var(--ink-700)]'
                }`}
              >
                All
                {!isAuthenticated && poolSize > guestMax ? (
                  <Lock className="absolute top-1.5 right-1.5 size-3 text-[var(--ink-400)]" />
                ) : null}
              </button>
            </div>

            <label className="mt-5 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--ink-900)]">Custom count</span>
              <input
                type="number"
                min={1}
                max={poolSize}
                inputMode="numeric"
                value={customCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCustomCount(raw);
                  const n = Number(raw);
                  if (Number.isInteger(n) && n >= 1) applyCount(n);
                }}
                className="min-h-12 rounded-xl bg-[var(--surface-sunken)] px-4 text-base text-[var(--ink-900)] outline-none"
              />
              {guestLocked ? (
                <span className="text-xs text-[var(--ink-500)]">
                  <Link href="/auth/register" className="font-semibold text-[var(--ink-900)] underline-offset-2 hover:underline">
                    Sign up free
                  </Link>{' '}
                  to go past {guestMax} questions
                </span>
              ) : (
                <span className="text-xs text-[var(--ink-500)]">1 to {poolSize}</span>
              )}
            </label>
          </>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-[var(--line-muted)] bg-[var(--surface-page)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[var(--surface-sunken)] text-[var(--ink-900)]"
              aria-label="Previous step"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)))}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[var(--brand-gold)] px-6 text-base font-semibold text-[var(--ink-900)]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={count < 1}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[var(--brand-gold)] px-6 text-base font-semibold text-[var(--ink-900)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guestLocked
                ? 'Sign up to start'
                : `Start ${Math.min(count, maxAllowed)} questions`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
