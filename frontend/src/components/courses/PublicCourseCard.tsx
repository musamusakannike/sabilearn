import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatKobo } from '@/lib/money';
import { Course } from '@/lib/types';

const levelDots = (difficulty?: string) => {
  const d = (difficulty ?? '').toLowerCase();
  if (d.startsWith('adv')) return 3;
  if (d.startsWith('inter')) return 2;
  return 1;
};

export default function PublicCourseCard({ course }: { course: Course }) {
  const href = course.slug ? `/courses/${course.slug}` : `/courses/${course._id}`;
  const level = levelDots(course.difficulty);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--line)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-[var(--ink-900)] hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink-900)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--brand-gold-100)]">
        {course.banner ? (
          <Image
            src={course.banner}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--brand-gold-600)]">
            <BookOpen className="size-12" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <h3 className="line-clamp-2 text-lg leading-[var(--leading-snug)] font-[var(--font-display)] font-bold text-[var(--ink-900)] sm:text-xl">
          {course.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4">
          <span className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-700)] capitalize">
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 w-4 rounded-full ${n <= level ? 'bg-[var(--brand-gold-500,#F9B233)]' : 'bg-[var(--line)]'}`}
                />
              ))}
            </span>
            {course.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ink-900)]">
            View course
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
    </Link>
  );
}