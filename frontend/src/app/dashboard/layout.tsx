'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useLessonViewStore } from '@/store/lesson-view.store';
import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import NotificationDrawer from '@/components/dashboard/NotificationDrawer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, fetchMe } = useAuthStore();
  const pathname = usePathname();
  const { isFullscreen, syncFromStorage } = useLessonViewStore();

  useEffect(() => {
    if (token) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const isLearnRoute = Boolean(pathname && /\/courses\/[^/]+\/topics\/[^/]+\/learn/.test(pathname));
  const hideChrome = isLearnRoute && isFullscreen;

  return (
    <AuthGuard>
      <div className="flex h-dvh w-full overflow-hidden bg-cream-100 font-sans text-stone-900 antialiased selection:bg-orange-200 selection:text-orange-900">
        {!hideChrome && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <NotificationDrawer />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-cream-100">
          {!hideChrome && <Header onMenuClick={() => setSidebarOpen(true)} />}
          <main
            className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-cream-100 ${
              hideChrome ? 'p-0' : 'px-4 sm:px-6 lg:px-8'
            }`}
          >
            <div className="w-full h-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
