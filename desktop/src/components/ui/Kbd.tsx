import React from 'react';

export function Kbd({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={[
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-[5px]',
        'bg-[var(--surface-sunken)] border border-[var(--border-strong)] text-[11px] font-mono font-medium text-[var(--text-secondary)]',
        className,
      ].join(' ')}
    >
      {children}
    </kbd>
  );
}
