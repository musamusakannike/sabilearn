export interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  color = 'var(--brand-primary)',
  height = 8,
  className = '',
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress'}
      className={`w-full overflow-hidden rounded-full bg-[var(--surface-sunken)] ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-200 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
