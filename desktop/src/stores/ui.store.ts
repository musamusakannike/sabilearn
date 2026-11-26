import { create } from 'zustand';
import { kvStore, desktopWindow } from '@/platform';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  durationMs?: number;
}

export type ConnectivityState = 'online' | 'offline' | 'syncing';

interface UiState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  soundEffects: boolean;
  closeToTray: boolean;
  connectivity: ConnectivityState;
  pendingSyncCount: number;
  unreadNotifications: number;
  toasts: ToastItem[];
  lastRoute: string;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setCloseToTray: (enabled: boolean) => void;
  setConnectivity: (state: ConnectivityState, pendingCount?: number) => void;
  setUnreadNotifications: (count: number) => void;
  setLastRoute: (route: string) => void;
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyThemeToDom(resolved: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  resolvedTheme: 'light',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  shortcutsOpen: false,
  soundEffects: false,
  closeToTray: false,
  connectivity: 'online',
  pendingSyncCount: 0,
  unreadNotifications: 0,
  toasts: [],
  lastRoute: '/',
  hydrated: false,

  hydrate: async () => {
    const [theme, sidebarCollapsed, soundEffects, closeToTray, lastRoute] = await Promise.all([
      kvStore.get<ThemeMode>('ui_theme'),
      kvStore.get<boolean>('ui_sidebar_collapsed'),
      kvStore.get<boolean>('ui_sound_effects'),
      kvStore.get<boolean>('ui_close_to_tray'),
      kvStore.get<string>('ui_last_route'),
    ]);

    const nextTheme: ThemeMode = theme || 'system';
    const resolved = resolveTheme(nextTheme);
    applyThemeToDom(resolved);

    const tray = !!closeToTray;
    void desktopWindow.setCloseToTray(tray);

    set({
      theme: nextTheme,
      resolvedTheme: resolved,
      sidebarCollapsed: !!sidebarCollapsed,
      soundEffects: !!soundEffects,
      closeToTray: tray,
      lastRoute: lastRoute && lastRoute.startsWith('/') ? lastRoute : '/',
      hydrated: true,
    });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', () => {
        const current = get().theme;
        if (current === 'system') {
          const next = resolveTheme('system');
          applyThemeToDom(next);
          set({ resolvedTheme: next });
        }
      });
    }
  },

  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    applyThemeToDom(resolved);
    set({ theme, resolvedTheme: resolved });
    void kvStore.set('ui_theme', theme);
  },

  toggleTheme: () => {
    const next = get().resolvedTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    void kvStore.set('ui_sidebar_collapsed', collapsed);
  },

  toggleSidebar: () => {
    get().setSidebarCollapsed(!get().sidebarCollapsed);
  },

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),

  setSoundEffects: (enabled) => {
    set({ soundEffects: enabled });
    void kvStore.set('ui_sound_effects', enabled);
  },

  setCloseToTray: (enabled) => {
    set({ closeToTray: enabled });
    void kvStore.set('ui_close_to_tray', enabled);
    void desktopWindow.setCloseToTray(enabled);
  },

  setConnectivity: (connectivity, pendingCount) =>
    set((s) => ({
      connectivity,
      pendingSyncCount: pendingCount !== undefined ? pendingCount : s.pendingSyncCount,
    })),

  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),

  setLastRoute: (lastRoute) => {
    set({ lastRoute });
    void kvStore.set('ui_last_route', lastRoute);
  },

  toast: (item) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = item.durationMs ?? 3800;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...item, id }] }));
    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
