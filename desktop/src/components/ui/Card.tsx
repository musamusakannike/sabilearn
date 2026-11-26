import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'featured' | 'sunken';
  padded?: boolean;
  interactive?: boolean;
}

export function Card({
  variant = 'default',
  padded = true,
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const variantCls =
    variant === 'featured'
      ? 'bg-[var(--surface-card)] border-2 border-[var(--border-structural)] shadow-[var(--shadow-sm)]'
      : variant === 'sunken'
        ? 'bg-[var(--surface-sunken)] border border-[var(--border-subtle)]'
        : 'bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-xs)]';

  return (
    <div
      className={[
        'rounded-[var(--radius-lg)] transition-all duration-150',
        variantCls,
        padded ? 'p-5' : '',
        interactive
          ? 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
