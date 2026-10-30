'use client';

import { FormEvent, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, GraduationCap, Sparkles } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { courseRequestApi } from '@/lib/api';

type Category = 'academic' | 'non-academic';

export default function RequestCoursePage() {
  const [courseName, setCourseName] = useState('');
  const [category, setCategory] = useState<Category>('academic');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await courseRequestApi.submit({ courseName: courseName.trim(), category, details: details.trim() });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'We could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <Navbar active="Request a course" />
      <main className="flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <section>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold-100)] px-3.5 py-2 text-sm font-semibold text-[var(--ink-900)]">
              <Sparkles className="size-4" /> Your next course starts here
            </div>
            <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--ink-900)] sm:text-5xl">
              What do you really want to learn?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink-500)]">
              Tell us the course you have in mind. It can be academic or something you want to learn for life or work.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4">
              <Clock3 className="mt-0.5 size-5 shrink-0 text-[var(--brand-gold-600)]" />
              <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                We’ll do our best to bring requested courses within two weeks. It’s a goal, not a guarantee.
              </p>
            </div>
          </section>

          <Card className="p-6 sm:p-8">
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                <h2 className="mt-4 text-2xl font-bold text-[var(--ink-900)]">Request received!</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
                  Thanks for helping us decide what to teach next. We’ll do our best to bring it within two weeks.
                </p>
                <button
                  type="button"
                  className="mt-6 text-sm font-semibold text-[var(--brand-violet-600)] hover:underline"
                  onClick={() => { setSubmitted(false); setCourseName(''); setDetails(''); }}
                >
                  Submit another course
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Suggest a course</h2>
                  <p className="mt-1 text-sm text-[var(--ink-500)]">No account needed. Just tell us what you want to learn.</p>
                </div>

                <Input
                  label="Course you want to learn"
                  placeholder="e.g. Basic Accounting or Sewing"
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                />

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-[var(--ink-900)]">What kind of course is it?</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'academic', label: 'Academic', icon: GraduationCap },
                      { value: 'non-academic', label: 'Non-academic', icon: BookOpen },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={category === value}
                        onClick={() => setCategory(value)}
                        className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border-[1.5px] px-3 py-3 text-sm font-semibold transition-colors ${category === value ? 'border-[var(--ink-900)] bg-[var(--brand-gold-100)] text-[var(--ink-900)]' : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-500)] hover:border-[var(--ink-300)]'}`}
                      >
                        <Icon className="size-4" />{label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-900)]">
                  Anything specific you want included? <span className="font-normal text-[var(--ink-300)]">(Optional)</span>
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="Share a topic, skill level, or goal for this course..."
                    className="resize-y rounded-[var(--radius-md)] border-[1.5px] border-[var(--line)] bg-[var(--surface-card)] px-3.5 py-3 text-base font-normal text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-300)] focus:border-[var(--ink-900)]"
                  />
                </label>

                {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
                <Button type="submit" fullWidth loading={submitting}>Send course request</Button>
              </form>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
