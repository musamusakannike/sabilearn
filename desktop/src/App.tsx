import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import {
  CommandPalette,
  PaletteSearchResult,
  ShortcutsModal,
  Skeleton,
  ToastViewport,
} from './components/ui';
import { useUiStore } from './stores/ui.store';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStore } from './stores/onboarding.store';
import { useProgressStore } from './stores/progress.store';
import { usePlaygroundStore } from './stores/playground.store';
import { notificationApi, paymentApi, searchApi } from './lib/api';
import { checkOnline } from './lib/connectivity';
import { getQueuedSessions, syncQueuedSessions } from './lib/offlineSync';
import {
  desktopNotifications,
  desktopWindow,
  listenDeepLinks,
} from './platform';

import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { OnboardingWizard } from './features/auth/OnboardingWizard';
import { HomePage } from './features/home/HomePage';
import { CoursesPage } from './features/courses/CoursesPage';
import { CourseDetailPage } from './features/courses/CourseDetailPage';
import { AiToolModal, QuickAiToolKind } from './features/ai-tools/AiToolModal';

// Route-level code splitting for heavier views (KaTeX lessons, CodeMirror playground, AI hubs)
const LessonWorkspacePage = React.lazy(() =>
  import('./features/lesson/LessonWorkspacePage').then((m) => ({ default: m.LessonWorkspacePage }))
);
const ChapterAssessmentPage = React.lazy(() =>
  import('./features/assessment/ChapterAssessmentPage').then((m) => ({
    default: m.ChapterAssessmentPage,
  }))
);
const StudyHubPage = React.lazy(() =>
  import('./features/study/StudyHubPage').then((m) => ({ default: m.StudyHubPage }))
);
const FlashcardDeckPage = React.lazy(() =>
  import('./features/study/FlashcardDeckPage').then((m) => ({ default: m.FlashcardDeckPage }))
);
const McqDeckPage = React.lazy(() =>
  import('./features/study/McqDeckPage').then((m) => ({ default: m.McqDeckPage }))
);
const PlaygroundLibraryPage = React.lazy(() =>
  import('./features/playground/PlaygroundLibraryPage').then((m) => ({
    default: m.PlaygroundLibraryPage,
  }))
);
const PlaygroundIdePage = React.lazy(() =>
  import('./features/playground/PlaygroundIdePage').then((m) => ({ default: m.PlaygroundIdePage }))
);
const AiQuizHubPage = React.lazy(() =>
  import('./features/ai-quiz/AiQuizHubPage').then((m) => ({ default: m.AiQuizHubPage }))
);
const AiQuizAttemptPage = React.lazy(() =>
  import('./features/ai-quiz/AiQuizAttemptPage').then((m) => ({ default: m.AiQuizAttemptPage }))
);
const CourseArchitectPage = React.lazy(() =>
  import('./features/course-architect/CourseArchitectPage').then((m) => ({
    default: m.CourseArchitectPage,
  }))
);
const LeaderboardPage = React.lazy(() =>
  import('./features/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const NotificationsPage = React.lazy(() =>
  import('./features/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
);
const SubscribePage = React.lazy(() =>
  import('./features/subscription/SubscribePage').then((m) => ({ default: m.SubscribePage }))
);
const SettingsPage = React.lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

function RouteFallback() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/onboarding'];

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    hydrated: uiHydrated,
    hydrate: hydrateUi,
    lastRoute,
    setLastRoute,
    shortcutsOpen,
    setShortcutsOpen,
    setCommandPaletteOpen,
    toggleSidebar,
    setConnectivity,
    setUnreadNotifications,
    toast,
  } = useUiStore();

  const { user, isAuthenticated, isInitialized: authReady, initialize: initAuth, fetchMe } =
    useAuthStore();
  const {
    hasOnboarded,
    isInitialized: onboardingReady,
    initialize: initOnboarding,
  } = useOnboardingStore();
  const { dashboard, stats, fetchDashboard, fetchStats } = useProgressStore();
  const playgroundProjects = usePlaygroundStore((s) => s.projects);

  const [quickAiTool, setQuickAiTool] = useState<QuickAiToolKind>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const restoredRouteRef = useRef(false);
  const lastReminderDayRef = useRef<string | null>(null);

  // Initialize stores
  useEffect(() => {
    void hydrateUi();
    void initAuth();
    void initOnboarding();
  }, [hydrateUi, initAuth, initOnboarding]);

  // Disable default webview "Inspect" context menu in production builds while preserving text selection
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const onCtx = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (window.getSelection()?.toString()) return;
      e.preventDefault();
    };
    window.addEventListener('contextmenu', onCtx);
    return () => window.removeEventListener('contextmenu', onCtx);
  }, []);

  // Persist last visited authenticated route & restore on relaunch
  useEffect(() => {
    if (!uiHydrated || !authReady || !onboardingReady) return;
    if (isAuthenticated && !restoredRouteRef.current) {
      restoredRouteRef.current = true;
      if (location.pathname === '/' && lastRoute && lastRoute !== '/' && !PUBLIC_PATHS.includes(lastRoute)) {
        navigate(lastRoute, { replace: true });
      }
    }
  }, [uiHydrated, authReady, onboardingReady, isAuthenticated, lastRoute, location.pathname, navigate]);

  useEffect(() => {
    if (isAuthenticated && !PUBLIC_PATHS.includes(location.pathname)) {
      setLastRoute(location.pathname + location.search);
    }
  }, [isAuthenticated, location.pathname, location.search, setLastRoute]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
        return;
      }
      if (e.key === '?' && !inInput) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r' && !e.shiftKey)) {
        e.preventDefault();
        setRefreshTick((t) => t + 1);
        void fetchDashboard();
        void fetchStats();
        toast({ title: 'Refreshed' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, setCommandPaletteOpen, setShortcutsOpen, toggleSidebar, fetchDashboard, fetchStats, toast]);

  // Connectivity heartbeat & offline mutation queue replay
  useEffect(() => {
    const runSyncCheck = async () => {
      const online = await checkOnline(true);
      const queued = await getQueuedSessions();
      if (!online) {
        setConnectivity('offline', queued.length);
        return;
      }
      if (queued.length > 0) {
        setConnectivity('syncing', queued.length);
        const res = await syncQueuedSessions();
        setConnectivity('online', res.remaining);
        if (res.synced) {
          toast({ title: 'Offline progress synced', variant: 'success' });
        }
      } else {
        setConnectivity('online', 0);
      }
    };

    void runSyncCheck();
    const interval = setInterval(() => void runSyncCheck(), 30_000);
    window.addEventListener('online', () => void runSyncCheck());
    window.addEventListener('offline', () => {
      void getQueuedSessions().then((q) => setConnectivity('offline', q.length));
    });

    return () => {
      clearInterval(interval);
    };
  }, [setConnectivity, toast]);

  // Deep-link listener (sabilearn://payment-callback?reference=...) & tray Study Now event
  useEffect(() => {
    let unlistenDeep: (() => void) | undefined;
    let unlistenTray: (() => void) | undefined;

    void listenDeepLinks(async (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname === 'payment-callback' || parsed.pathname.includes('payment-callback')) {
          const ref = parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
          if (ref) {
            const res = await paymentApi.verify(ref);
            if (res.data?.status === 'success') {
              toast({ title: 'Payment verified!', variant: 'success' });
              void fetchMe();
              navigate('/courses');
            } else {
              navigate('/subscribe');
            }
          }
        }
      } catch {
        // ignore invalid deep link
      }
    }).then((u) => {
      unlistenDeep = u;
    });

    void desktopWindow.listenTrayEvents(() => {
      navigate('/');
    }).then((u) => {
      unlistenTray = u;
    });

    return () => {
      unlistenDeep?.();
      unlistenTray?.();
    };
  }, [fetchMe, navigate, toast]);

  // Notification polling + exact local daily reminder timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollNotifications = async () => {
      try {
        const res = await notificationApi.list();
        const list = (res.data || []) as Array<{ isRead: boolean }>;
        setUnreadNotifications(list.filter((n) => !n.isRead).length);
      } catch {
        // ignore offline
      }
    };

    void pollNotifications();
    const pollTimer = setInterval(() => void pollNotifications(), 120_000);

    // Check every 60s if current local hour & minute match user's chosen reminder time
    const reminderTimer = setInterval(() => {
      const settings = user?.settings;
      if (!settings?.studyReminders) return;
      const now = new Date();
      const targetHour = settings.reminderHour ?? 19;
      const targetMin = settings.reminderMinute ?? 0;
      const todayKey = now.toISOString().slice(0, 10);
      if (
        now.getHours() === targetHour &&
        now.getMinutes() === targetMin &&
        lastReminderDayRef.current !== todayKey
      ) {
        lastReminderDayRef.current = todayKey;
        void desktopNotifications.notify(
          'Time to study with SabiLearn',
          `Hit your ${settings.dailyGoalMinutes ?? 15}-minute daily goal and keep your streak alive!`
        );
      }
    }, 60_000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(reminderTimer);
    };
  }, [isAuthenticated, user?.settings, setUnreadNotifications]);

  // Command palette remote search (courses, topics, local playground projects)
  const handlePaletteSearch = useCallback(
    async (query: string): Promise<PaletteSearchResult[]> => {
      const results: PaletteSearchResult[] = [];
      const q = query.toLowerCase();

      for (const proj of playgroundProjects) {
        if (proj.name.toLowerCase().includes(q)) {
          results.push({
            id: proj.localId,
            title: proj.name,
            subtitle: `${proj.kind} playground`,
            route: `/playground/${proj.localId}`,
            category: 'Playground',
          });
        }
      }

      try {
        const res = await searchApi.global(query);
        const data = res.data || res;
        for (const c of (data?.courses || []).slice(0, 5)) {
          results.push({
            id: c._id,
            title: c.title,
            subtitle: c.category,
            route: `/course/${c._id}`,
            category: 'Course',
          });
        }
        for (const t of (data?.topics || []).slice(0, 5)) {
          const cid = typeof t.course === 'object' ? t.course?._id : t.course;
          if (cid) {
            results.push({
              id: t._id,
              title: t.title,
              subtitle: 'Lesson',
              route: `/course/${cid}/topic/${t._id}/learn`,
              category: 'Topic',
            });
          }
        }
      } catch {
        // offline: local playground matches still returned
      }

      return results;
    },
    [playgroundProjects]
  );

  if (!uiHydrated || !authReady || !onboardingReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <img src="/assets/icon.png" alt="SabiLearn" className="w-12 h-12 rounded-xl animate-pulse" />
          <span className="text-[13px] font-medium text-[var(--text-tertiary)]">Loading SabiLearn...</span>
        </div>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to={hasOnboarded ? '/login' : '/onboarding'} replace />;
  }

  if (isAuthenticated && isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to={hasOnboarded ? '/login' : '/onboarding'} replace />} />
        </Routes>
        <ToastViewport />
      </>
    );
  }

  return (
    <>
      <AppShell
        streak={dashboard?.streak ?? stats?.streak ?? user?.currentStreak ?? 0}
        totalXp={dashboard?.totalXp ?? stats?.totalXp ?? user?.totalXp ?? 0}
        dailyGoalPercent={stats?.dailyGoal?.progress ?? 0}
        userName={user?.firstName || user?.name}
        onRefresh={() => {
          setRefreshTick((t) => t + 1);
          void fetchDashboard();
          void fetchStats();
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes key={refreshTick}>
            <Route path="/" element={<HomePage onOpenAiTool={setQuickAiTool} />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/course/:id" element={<CourseDetailPage />} />
            <Route path="/course/:id/topic/:topicId/learn" element={<LessonWorkspacePage />} />
            <Route path="/course/:id/topic/:topicId" element={<LessonWorkspacePage />} />
            <Route path="/course/:id/chapter/:chapterId/assessment" element={<ChapterAssessmentPage />} />
            <Route path="/study" element={<StudyHubPage />} />
            <Route path="/course/:id/flashcards" element={<FlashcardDeckPage />} />
            <Route path="/course/:id/topic/:topicId/flashcards" element={<FlashcardDeckPage />} />
            <Route path="/course/:id/mcq" element={<McqDeckPage />} />
            <Route path="/course/:id/topic/:topicId/mcq" element={<McqDeckPage />} />
            <Route path="/playground" element={<PlaygroundLibraryPage />} />
            <Route path="/playground/:id" element={<PlaygroundIdePage />} />
            <Route path="/ai-quiz" element={<AiQuizHubPage />} />
            <Route path="/ai-quiz/:id" element={<AiQuizAttemptPage />} />
            <Route path="/generate-course" element={<CourseArchitectPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>

      <AiToolModal kind={quickAiTool} onClose={() => setQuickAiTool(null)} />
      <CommandPalette onSearchRemote={handlePaletteSearch} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastViewport />
    </>
  );
}
