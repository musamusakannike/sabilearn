import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  mascot?: boolean;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  mascot = false,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-card)]/60 ${className}`}
    >
      {mascot ? (
        <img
          src="/assets/onboarding/tutor-mascot.webp"
          alt="SabiLearn Tutor"
          className="w-20 h-20 object-contain mb-3 select-none"
        />
      ) : (
        icon && (
          <div className="w-12 h-12 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-tertiary)] mb-3">
            {icon}
          </div>
        )
      )}
      <h3 className="text-[16px] font-bold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 text-[13px] text-[var(--text-tertiary)] max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
