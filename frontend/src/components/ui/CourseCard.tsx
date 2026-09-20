'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatKobo } from '@/lib/money';

interface CourseCardProps {
  id: string;
  image?: string;
  // level?: string;
  title: string;
  category?: string;
  description?: string;
  free?: boolean;
  /** Price in kobo (NGN smallest unit). */
  price?: number;
  progress?: number;
  topicCount?: number;
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
}: CourseCardProps) {
  const [hasImgError, setHasImgError] = useState(false);
  const showImage = Boolean(image) && !hasImgError;

  return (
    <Link
      href={`/dashboard/courses/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-(--line)/60 bg-(--surface-card) font-(--font-body) shadow-(--shadow-sm) transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
    >
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-(--surface-sunken)">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            onError={() => setHasImgError(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-(--surface-sunken) text-3xl font-(--font-display) font-bold text-(--ink-300) select-none">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 p-4.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            {category && <span className="text-xs font-medium uppercase tracking-wider text-(--text-muted)">{category}</span>}
          </div>
          <h4 className="m-0 line-clamp-1 font-(--font-display) text-(length:--text-md) font-bold text-foreground transition-colors group-hover:text-(--brand-gold-600)">
            {title}
          </h4>
          {description && (
            <p className="m-0 line-clamp-2 text-xs leading-relaxed text-(--text-muted)">
              {description}
            </p>
          )}
        </div>
        {typeof progress === 'number' ? (
          <div className="mt-1">
            <div className="h-1.5 rounded-(--radius-full) bg-(--surface-sunken)">
              <div className="h-full rounded-(--radius-full) bg-(--brand-gold)" style={{ width: `${progress}%` }} />
            </div>
            <span className="mt-1 block text-xs text-(--text-muted)">{progress}% complete</span>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-(--line)/40 pt-2.5">
            <span className="font-(--font-display) font-bold text-foreground">
              {free ? 'Free' : formatKobo(price ?? 0)}
            </span>
            {typeof topicCount === 'number' && (
              <span className="text-xs font-medium text-(--text-muted)">{topicCount} topics</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
