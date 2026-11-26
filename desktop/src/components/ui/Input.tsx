import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightSlot, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <div
          className={[
            'flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-card)] border px-3 h-10 transition-colors',
            error
              ? 'border-[var(--danger)]'
              : 'border-[var(--border-default)] focus-within:border-[var(--brand-primary)]',
          ].join(' ')}
        >
          {leftIcon && <span className="text-[var(--text-tertiary)] shrink-0">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${className}`}
            {...rest}
          />
          {rightSlot && <span className="shrink-0">{rightSlot}</span>}
        </div>
        {error && <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>}
        {!error && hint && <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
