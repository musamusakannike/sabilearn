import React, { useCallback, useRef, useState } from 'react';

export interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  className?: string;
}

export function SplitPane({
  left,
  right,
  initialLeftPercent = 50,
  minLeftPercent = 25,
  maxLeftPercent = 75,
  className = '',
}: SplitPaneProps) {
  const [leftPct, setLeftPct] = useState(initialLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const onMove = (ev: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || rect.width <= 0) return;
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.max(minLeftPercent, Math.min(maxLeftPercent, pct)));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [minLeftPercent, maxLeftPercent]
  );

  return (
    <div ref={containerRef} className={`flex w-full h-full min-h-0 overflow-hidden ${className}`}>
      <div className="h-full min-w-0 overflow-hidden" style={{ width: `${leftPct}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={onMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setLeftPct((p) => Math.max(minLeftPercent, p - 3));
          if (e.key === 'ArrowRight') setLeftPct((p) => Math.min(maxLeftPercent, p + 3));
        }}
        className="w-1.5 shrink-0 cursor-col-resize bg-[var(--border-subtle)] hover:bg-[var(--brand-primary)] transition-colors"
      />
      <div className="h-full flex-1 min-w-0 overflow-hidden">{right}</div>
    </div>
  );
}
