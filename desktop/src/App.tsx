import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { CommandPalette, ShortcutsModal, ToastViewport } from './components/ui';
import { useUiStore } from './stores/ui.store';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-[var(--text-tertiary)] mt-2">SabiLearn Desktop scaffold ready.</p>
    </div>
  );
}

export function App() {
  const hydrate = useUiStore((s) => s.hydrate);
  const shortcutsOpen = useUiStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Placeholder title="Home" />} />
          <Route path="*" element={<Placeholder title="SabiLearn Desktop" />} />
        </Routes>
      </AppShell>
      <CommandPalette />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastViewport />
    </>
  );
}
