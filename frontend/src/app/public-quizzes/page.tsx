import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, GraduationCap, Sparkles } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  getCourseQuestions,
  PUBLIC_QUIZ_COURSES,
} from '@/data/public-quizzes/registry';
import { SITE_URL } from '@/lib/blog-server';

export const metadata: Metadata = {
  title: 'Public Course Quizzes — Free Practice MCQs | SabiLearn',
  description:
    'Take free, exam-style university course MCQ quizzes with instant feedback and worked LaTeX explanations on SabiLearn.',
  alternates: { canonical: `${SITE_URL}/public-quizzes` },
};

export default function PublicQuizzesIndexPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--surface-page)] pb-24">
        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-gold-100)] px-3.5 py-1 text-xs font-bold text-[var(--ink-900)]">
              Free Practice Hub
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Public Course Quizzes
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--ink-700)]">
              No sign-up needed. Pick a university course below to drill exam-style MCQs with instant feedback and step-by-step LaTeX calculation explanations.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_QUIZ_COURSES.map((course) => {
              const questions = getCourseQuestions(course);
              const calcs = questions.filter((q) => q.difficulty === 'calculation').length;
              return (
                <Link
                  key={course.slug}
                  href={`/public-quizzes/${course.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[0_5px_0_#0E0E1A] no-underline transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_#0E0E1A]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-lg border border-[var(--ink-900)] bg-[var(--brand-gold)] px-2.5 py-1 text-xs font-extrabold text-[var(--ink-900)]">
                        {course.code}
                      </span>
                      <span className="rounded-full bg-[var(--brand-violet-100)] px-2.5 py-0.5 text-xs font-bold text-[var(--brand-violet)]">
                        {questions.length} MCQs
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-[var(--ink-900)] group-hover:text-[var(--brand-violet)] transition-colors">
                      {course.title}
                    </h2>

                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-500)]">
                      <GraduationCap className="h-3.5 w-3.5" /> {course.institution}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--ink-700)]">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs font-bold text-[var(--ink-700)]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> {course.topics.length} Topics
                      </span>
                      {calcs > 0 && (
                        <span className="inline-flex items-center gap-1 text-[var(--brand-violet)]">
                          <Calculator className="h-3.5 w-3.5" /> {calcs} Calcs
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[var(--ink-900)] transition-transform group-hover:translate-x-1">
                      Start <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
