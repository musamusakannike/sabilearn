import { IconCheck, IconAlertTriangle, IconInfoCircle, IconX } from '@tabler/icons-react';
import { useUiStore } from '@/stores/ui.store';

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((t) => {
        const icon =
          t.variant === 'success' ? (
            <IconCheck size={16} className="text-[var(--success)] shrink-0 mt-0.5" />
          ) : t.variant === 'danger' ? (
            <IconAlertTriangle size={16} className="text-[var(--danger)] shrink-0 mt-0.5" />
          ) : t.variant === 'warning' ? (
            <IconAlertTriangle size={16} className="text-[var(--warning)] shrink-0 mt-0.5" />
          ) : (
            <IconInfoCircle size={16} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
          );

        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-[var(--shadow-md)] px-3.5 py-3"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.title}</p>
              {t.description && (
                <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
            >
              <IconX size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
