'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { formatKobo } from '@/lib/money';
import Badge from '@/components/ui/Badge';

interface CourseCardProps {
  id: string;
  image?: string;
  title: string;
  category?: string;
  description?: string;
  free?: boolean;
  price?: number;
  progress?: number;
  topicCount?: number;
  lessonCount?: number;
  difficulty?: string;
  totalObtainableXp?: number;
  ctaLabel?: string;
  href?: string;
  actions?: React.ReactNode;
}

export default function CourseCard({
  id,
  image,
  title,
  category,
  description,
  free = true,
  price,
  progress,
  topicCount,
  lessonCount,
  difficulty,
  totalObtainableXp,
  ctaLabel,
  href,
  actions,
}: CourseCardProps) {
  const [hasImgError, setHasImgError] = useState(false);
  const showImage = Boolean(image) && !hasImgError;
  const to = href ?? `/dashboard/courses/${id}`;
  const metaCount = topicCount
    ? `${topicCount} topics`
    : lessonCount
      ? `${lessonCount} lessons`
      : null;
  const priceLabel = free ? 'Free' : formatKobo(price ?? 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] shadow-sm transition hover:shadow-md">
      <Link href={to} className="relative block h-36 w-full overflow-hidden border-b border-[var(--line)]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            onError={() => setHasImgError(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--surface-sunken)] text-3xl font-[var(--font-display)] font-bold text-[var(--ink-300)]">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {difficulty && <Badge tone="gold">{difficulty}</Badge>}
          {free && <Badge tone="success">Free</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {actions && <div className="mb-3 flex items-center justify-end">{actions}</div>}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {category && (
              <span className="text-[11px] font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">
                {category}
              </span>
            )}
            {typeof totalObtainableXp === 'number' && totalObtainableXp > 0 && (
              <>
                <span className="text-[var(--ink-300)]">•</span>
                <span className="text-[11px] font-semibold text-[var(--ink-500)]">+{totalObtainableXp} XP</span>
              </>
            )}
          </div>
          <Link href={to}>
            <h3 className="text-base leading-snug font-bold text-[var(--ink-900)] transition-colors group-hover:text-[var(--brand-gold-600)]">
              {title}
            </h3>
          </Link>
          {description && <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-500)]">{description}</p>}
        </div>

        <div className="mt-5 border-t border-[var(--line)] pt-4">
          {typeof progress === 'number' ? (
            <>
              <div className="mb-1.5 flex justify-between text-xs font-bold text-[var(--ink-700)]">
                <span>Progress</span>
                <span className="text-[var(--brand-gold-600)]">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                <div className="h-2 rounded-full bg-[var(--brand-gold)]" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            </>
          ) : null}
          <div className={`flex items-center justify-between ${typeof progress === 'number' ? 'mt-4' : ''}`}>
            <span className="text-xs font-bold text-[var(--ink-900)]">{metaCount ?? priceLabel}</span>
            <Link
              href={to}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-gold)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--brand-gold-600)]"
            >
              <Play className="size-3 fill-current" />
              {ctaLabel ?? (typeof progress === 'number' ? 'Continue' : 'Open')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
