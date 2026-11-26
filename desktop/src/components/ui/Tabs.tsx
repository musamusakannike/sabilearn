import React from 'react';

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium transition-all duration-150 cursor-pointer',
              active
                ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] font-semibold'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span className="ml-0.5 text-[11px] opacity-75">({opt.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
