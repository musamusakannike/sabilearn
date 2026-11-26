import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  IconBell,
  IconBook,
  IconBrain,
  IconCards,
  IconCloudOff,
  IconCode,
  IconFlame,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTrophy,
  IconWifi,
} from '@tabler/icons-react';
import { useUiStore } from '@/stores/ui.store';
import { isMac } from '@/platform';
import { Kbd, Tooltip } from '@/components/ui';

export interface AppShellProps {
  children: React.ReactNode;
  streak?: number;
  totalXp?: number;
  dailyGoalPercent?: number;
  userName?: string;
  onRefresh?: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/courses', label: 'Courses', icon: IconBook },
  { to: '/study', label: 'Study', icon: IconCards },
  { to: '/playground', label: 'Playground', icon: IconCode },
  { to: '/ai-quiz', label: 'AI Quiz', icon: IconBrain },
  { to: '/generate-course', label: 'Course Architect', icon: IconSparkles },
  { to: '/leaderboard', label: 'Leaderboard', icon: IconTrophy },
  { to: '/notifications', label: 'Alerts', icon: IconBell, showBadge: true },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export function AppShell({
  children,
  streak = 0,
  totalXp = 0,
  dailyGoalPercent = 0,
  userName,
  onRefresh,
}: AppShellProps) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const connectivity = useUiStore((s) => s.connectivity);
  const pendingSyncCount = useUiStore((s) => s.pendingSyncCount);
  const unreadNotifications = useUiStore((s) => s.unreadNotifications);
  const location = useLocation();
  const navigate = useNavigate();

  const mod = isMac() ? '⌘' : 'Ctrl';

  const breadcrumb = (() => {
    const p = location.pathname;
    if (p === '/') return 'Home';
    if (p.startsWith('/courses')) return 'Courses';
    if (p.startsWith('/course/')) return 'Course Workspace';
    if (p.startsWith('/study')) return 'Study Decks';
    if (p.startsWith('/playground')) return 'Code Playground';
    if (p.startsWith('/ai-quiz')) return 'AI Quiz Hub';
    if (p.startsWith('/generate-course')) return 'AI Course Architect';
    if (p.startsWith('/leaderboard')) return 'Leaderboard';
    if (p.startsWith('/notifications')) return 'Alerts';
    if (p.startsWith('/subscribe')) return 'All-Access Subscription';
    if (p.startsWith('/settings')) return 'Settings';
    return 'SabiLearn';
  })();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Persistent Collapsible Left Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={[
          'flex flex-col shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-card)] transition-[width] duration-150 ease-out select-none',
          collapsed ? 'w-[68px]' : 'w-[236px]',
        ].join(' ')}
      >
        {/* Brand header */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between h-12 px-3.5 border-b border-[var(--border-subtle)] shrink-0"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          >
            <img
              src="/assets/icon.png"
              alt="SabiLearn"
              className="w-7 h-7 rounded-[7px] shrink-0 object-cover"
            />
            {!collapsed && (
              <span className="font-bold text-[16px] tracking-tight text-[var(--text-primary)] truncate">
                SabiLearn
              </span>
            )}
          </button>
          <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} shortcut={`${mod}+B`}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={17} stroke={1.6} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={17} stroke={1.6} />
              )}
            </button>
          </Tooltip>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13.5px] font-medium transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <Icon size={18} stroke={1.6} className="shrink-0" />
                {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                {item.showBadge && unreadNotifications > 0 && (
                  <span
                    className={[
                      'inline-flex items-center justify-center rounded-full bg-[var(--danger)] text-white text-[10px] font-bold',
                      collapsed
                        ? 'absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1'
                        : 'min-w-[18px] h-[18px] px-1.5',
                    ].join(' ')}
                  >
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Stats & Offline Status Pill */}
        <div className="p-2.5 border-t border-[var(--border-subtle)] space-y-2 shrink-0">
          {!collapsed && (
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                  <IconFlame size={14} className="text-[var(--brand-primary)]" />
                  {streak}d streak
                </span>
                <span className="font-mono font-semibold text-[var(--text-secondary)]">
                  {totalXp.toLocaleString()} XP
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--border-default)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, dailyGoalPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                <span>Daily goal</span>
                <span>{Math.min(100, Math.round(dailyGoalPercent))}%</span>
              </div>
            </div>
          )}

          {/* Connectivity / Sync status */}
          <div
            className={[
              'flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-medium',
              collapsed ? 'justify-center' : '',
              connectivity === 'offline'
                ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                : connectivity === 'syncing'
                  ? 'bg-[var(--brand-ai-soft)] text-[var(--brand-ai)]'
                  : 'bg-[var(--success-bg)]/60 text-[var(--success)]',
            ].join(' ')}
            title={
              connectivity === 'offline'
                ? `Offline (${pendingSyncCount} pending)`
                : connectivity === 'syncing'
                  ? `Syncing (${pendingSyncCount} pending)`
                  : 'Online'
            }
          >
            {connectivity === 'offline' ? (
              <IconCloudOff size={14} className="shrink-0" />
            ) : connectivity === 'syncing' ? (
              <IconRefresh size={14} className="shrink-0 animate-spin" />
            ) : (
              <IconWifi size={14} className="shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">
                {connectivity === 'offline'
                  ? pendingSyncCount > 0
                    ? `Offline (${pendingSyncCount} pending)`
                    : 'Offline mode'
                  : connectivity === 'syncing'
                    ? `Syncing (${pendingSyncCount})`
                    : pendingSyncCount > 0
                      ? `Online (${pendingSyncCount} queued)`
                      : 'Online'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Right Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar / Draggable Title Area */}
        <header
          data-tauri-drag-region
          className="h-12 shrink-0 flex items-center justify-between gap-4 px-5 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/85 select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate">
              {breadcrumb}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Command Palette trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[12.5px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <IconSearch size={14} />
              <span className="hidden sm:inline">Search or jump...</span>
              <Kbd>{mod}K</Kbd>
            </button>

            {onRefresh && (
              <Tooltip label="Refresh" shortcut="F5">
                <button
                  type="button"
                  onClick={onRefresh}
                  aria-label="Refresh"
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <IconRefresh size={16} stroke={1.6} />
                </button>
              </Tooltip>
            )}

            {userName && (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] text-[11px] font-bold flex items-center justify-center">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="text-[12.5px] font-medium text-[var(--text-secondary)] max-w-[120px] truncate hidden md:inline">
                  {userName}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Region */}
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
