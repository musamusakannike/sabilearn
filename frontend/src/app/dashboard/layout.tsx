'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import NotificationDrawer from '@/components/dashboard/NotificationDrawer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthGuard>
      <div className="flex h-dvh w-full overflow-hidden bg-cream-100 font-sans text-stone-900 antialiased selection:bg-orange-200 selection:text-orange-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <NotificationDrawer />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-cream-100">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-cream-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
