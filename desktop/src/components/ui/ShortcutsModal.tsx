import { Modal } from './Modal';
import { Kbd } from './Kbd';
import { isMac } from '@/platform';

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mod = isMac() ? '⌘' : 'Ctrl';

  const groups = [
    {
      title: 'Navigation & Shell',
      items: [
        { keys: [mod, 'K'], label: 'Open Command Palette / Global Search' },
        { keys: [mod, 'B'], label: 'Toggle Left Sidebar' },
        { keys: [mod, ','], label: 'Open Settings' },
        { keys: ['?'], label: 'Show Keyboard Shortcuts' },
        { keys: ['Esc'], label: 'Close Modal / Panel / Lightbox' },
        { keys: ['F5'], label: 'Refresh current view' },
      ],
    },
    {
      title: 'Lessons, Quizzes & Study',
      items: [
        { keys: ['→', 'Enter'], label: 'Next lesson step / Check answer' },
        { keys: ['←'], label: 'Previous lesson step' },
        { keys: ['1–4', 'A–D'], label: 'Select quiz or assessment option' },
        { keys: ['Space'], label: 'Flip flashcard' },
        { keys: [mod, 'Shift', 'A'], label: 'Toggle In-Lesson AI Tutor' },
      ],
    },
    {
      title: 'Code Playground',
      items: [
        { keys: [mod, 'Enter'], label: 'Run Python / Refresh Preview' },
      ],
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Navigate SabiLearn faster without touching the mouse."
      maxWidth={560}
    >
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              {g.title}
            </h3>
            <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-sunken)]/35">
              {g.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-[13px]"
                >
                  <span className="text-[var(--text-primary)]">{item.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
