import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'gold'
  | 'ai'
  | 'success'
  | 'warning'
  | 'danger'
  | 'beginner'
  | 'intermediate'
  | 'advanced';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border-default)]',
  gold: 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)]',
  ai: 'bg-[var(--brand-ai-soft)] text-[var(--brand-ai)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  beginner: 'bg-[var(--success-bg)] text-[var(--success)]',
  intermediate: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  advanced: 'bg-[var(--danger-bg)] text-[var(--danger)]',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
