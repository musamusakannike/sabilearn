import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBook,
  IconBolt,
  IconBrain,
  IconCode,
  IconHome,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconSun,
  IconTrophy,
  IconBell,
  IconCards,
} from '@tabler/icons-react';
import { useUiStore } from '@/stores/ui.store';
import { Kbd } from './Kbd';

export interface PaletteSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  route: string;
  category: 'Course' | 'Topic' | 'Playground';
}

interface CommandPaletteProps {
  onSearchRemote?: (query: string) => Promise<PaletteSearchResult[]>;
}

export function CommandPalette({ onSearchRemote }: CommandPaletteProps) {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const resolvedTheme = useUiStore((s) => s.resolvedTheme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [remoteResults, setRemoteResults] = useState<PaletteSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setRemoteResults([]);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !onSearchRemote) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await onSearchRemote(trimmed);
        if (!cancelled) setRemoteResults(res);
      } catch {
        if (!cancelled) setRemoteResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, onSearchRemote]);

  const staticCommands = useMemo(
    () => [
      { id: 'nav-home', label: 'Go to Home', group: 'Navigate', icon: <IconHome size={16} />, action: () => navigate('/') },
      { id: 'nav-courses', label: 'Browse Courses', group: 'Navigate', icon: <IconBook size={16} />, action: () => navigate('/courses') },
      { id: 'nav-study', label: 'Study Decks (Flashcards & MCQs)', group: 'Navigate', icon: <IconCards size={16} />, action: () => navigate('/study') },
      { id: 'nav-playground', label: 'Open Code Playground', group: 'Navigate', icon: <IconCode size={16} />, action: () => navigate('/playground') },
      { id: 'nav-ai-quiz', label: 'AI Quiz Hub', group: 'AI Tools', icon: <IconBrain size={16} />, action: () => navigate('/ai-quiz') },
      { id: 'nav-architect', label: 'AI Course Architect', group: 'AI Tools', icon: <IconSparkles size={16} />, action: () => navigate('/generate-course') },
      { id: 'nav-leaderboard', label: 'Leaderboard', group: 'Navigate', icon: <IconTrophy size={16} />, action: () => navigate('/leaderboard') },
      { id: 'nav-alerts', label: 'Notifications & Alerts', group: 'Navigate', icon: <IconBell size={16} />, action: () => navigate('/notifications') },
      { id: 'nav-subscribe', label: 'Subscription & All-Access', group: 'Account', icon: <IconBolt size={16} />, action: () => navigate('/subscribe') },
      { id: 'nav-settings', label: 'Settings & Preferences', group: 'Account', icon: <IconSettings size={16} />, action: () => navigate('/settings') },
      {
        id: 'act-theme',
        label: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Theme`,
        group: 'Actions',
        icon: resolvedTheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />,
        action: () => toggleTheme(),
      },
    ],
    [navigate, resolvedTheme, toggleTheme]
  );

  const items = useMemo(() => {
    type PaletteRow = {
      id: string;
      label: string;
      subtitle?: string;
      group: string;
      icon: ReactNode;
      action: () => void;
    };
    const q = query.trim().toLowerCase();
    const filteredStatic: PaletteRow[] = q
      ? staticCommands.filter(
          (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
        )
      : staticCommands;

    const mappedRemote: PaletteRow[] = remoteResults.map((r) => ({
      id: `remote-${r.category}-${r.id}`,
      label: r.title,
      subtitle: r.subtitle,
      group: r.category,
      icon: r.category === 'Playground' ? <IconCode size={16} /> : <IconBook size={16} />,
      action: () => navigate(r.route),
    }));

    return [...mappedRemote, ...filteredStatic];
  }, [query, staticCommands, remoteResults, navigate]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [items.length]);

  if (!open) return null;

  const runItem = (idx: number) => {
    const item = items[idx];
    if (!item) return;
    setOpen(false);
    item.action();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-[var(--surface-overlay)]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-[580px] rounded-[var(--radius-xl)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--border-subtle)]">
          <IconSearch size={18} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(items.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runItem(selectedIdx);
              }
            }}
            placeholder="Search courses, topics, projects, or jump anywhere..."
            className="w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {searching && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent shrink-0" />
          )}
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--text-tertiary)]">
              No matching commands or results.
            </div>
          ) : (
            items.map((item, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => runItem(idx)}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                    active
                      ? 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[var(--text-tertiary)] shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{item.label}</div>
                      {item.subtitle && (
                        <div className="text-[11.5px] text-[var(--text-tertiary)] truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] shrink-0">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
