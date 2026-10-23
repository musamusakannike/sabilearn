import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatKobo } from '@/lib/money';
import { Course } from '@/lib/types';

export default function PublicCourseCard({ course }: { course: Course }) {
  const href = course.slug ? `/courses/${course.slug}` : `/courses/${course._id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-normal)] hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-sunken)]">
        {course.banner ? (
          <Image
            src={course.banner}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[var(--ink-300)]">
            <BookOpen className="size-10" />
          </div>
        )}
        <span className="absolute top-3 left-3">
          <Badge tone="gold">{course.category}</Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-lg leading-[var(--leading-snug)] font-[var(--font-display)] font-bold text-[var(--ink-900)]">
          {course.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-[var(--leading-relaxed)] text-[var(--text-muted)]">{course.description}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-[var(--ink-500)]">
          <span className="font-medium capitalize">{course.difficulty}</span>
          <span className="font-semibold text-[var(--ink-900)]">{course.isFree ? 'Free' : formatKobo(course.price)}</span>
        </div>
      </div>
    </Link>
  );
}
