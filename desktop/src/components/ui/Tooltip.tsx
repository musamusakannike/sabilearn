import React from 'react';
import { Kbd } from './Kbd';

export interface TooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}

export function Tooltip({ label, shortcut, children }: TooltipProps) {
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--surface-inverse)] text-[var(--text-inverse)] px-2.5 py-1 text-[12px] font-medium shadow-[var(--shadow-md)] inline-flex items-center gap-1.5"
      >
        <span>{label}</span>
        {shortcut && <Kbd className="!bg-white/15 !border-white/25 !text-white">{shortcut}</Kbd>}
      </span>
    </span>
  );
}
