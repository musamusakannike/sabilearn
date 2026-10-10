'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  User,
  Shield,
  X,
  LayoutDashboard,
  Users,
  Activity,
  ChevronDown,
  Code2,
  Sparkles,
  Newspaper,
  Trophy,
  Smartphone,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { paymentApi, progressApi } from '@/lib/api';
import { formatKobo } from '@/lib/money';
import { PaymentStatus } from '@/lib/types';

const SUBSCRIPTION_PRICE_KOBO = Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_KOBO || 300000);

const navItems: {
  href: string;
  label: string;
  icon: typeof Home;
  badgeKey?: 'courses' | 'ai';
}[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/courses', label: 'Courses & Tracks', icon: BookOpen, badgeKey: 'courses' },
  { href: '/dashboard/playground', label: 'Code Playground', icon: Code2 },
  { href: '/dashboard/ai/quiz', label: 'AI Study Suite', icon: Sparkles, badgeKey: 'ai' },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/swep', label: 'SWEP', icon: GraduationCap },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard/admin/app-review', label: 'App Review', icon: Smartphone },
];

const AI_TOOL_COUNT = 4;

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('sabilearn_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [activeCourses, setActiveCourses] = useState(0);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [resumptionRes, payRes] = await Promise.all([
          progressApi.dashboardResumption().catch(() => null),
          paymentApi.me().catch(() => null),
        ]);
        if (resumptionRes?.data?.success) {
          setActiveCourses(resumptionRes.data.data?.totalUnfinished || 0);
        }
        if (payRes?.data?.data) {
          setPayment(payRes.data.data);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sabilearn_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/ai/quiz') return pathname.startsWith('/dashboard/ai') || pathname.startsWith('/dashboard/generate-course');
    return pathname.startsWith(href);
  };

  const isSubscribed = payment?.subscription?.status === 'active';
  const initials = (user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U').toUpperCase();
  const compact = collapsed;

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col justify-between border-r border-[var(--line)] bg-[var(--surface-card)] p-5 transition-all duration-300 lg:sticky lg:z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-72 lg:w-[4.75rem]' : 'w-72'}`}
      >
        <div className="flex min-h-0 flex-col gap-6">
          <div className="flex items-center justify-between pb-1">
            <Link href="/dashboard" onClick={onClose} className={`flex min-w-0 items-center gap-3 ${compact ? 'lg:hidden' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="SabiLearn" className="h-9 w-auto object-contain" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)] lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden rounded-lg p-1.5 text-[var(--ink-300)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-700)] lg:inline-flex"
              title={collapsed ? 'Expand navigation' : 'Minimize navigation'}
            >
              {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>
          </div>

          <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto text-sm font-semibold text-[var(--ink-700)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const courseBadge = item.badgeKey === 'courses' && activeCourses > 0;
              const aiBadge = item.badgeKey === 'ai';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={compact ? item.label : undefined}
                  className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-all ${
                    compact ? 'lg:justify-center lg:px-2' : 'justify-between'
                  } ${
                    active
                      ? 'border border-[var(--brand-gold-100)] bg-[var(--brand-gold-100)] font-bold text-[var(--brand-gold-600)] shadow-sm'
                      : 'text-[var(--ink-700)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <Icon
                      className={`size-5 shrink-0 ${active ? 'text-[var(--brand-gold-600)]' : item.badgeKey === 'ai' ? 'text-[var(--brand-violet)]' : 'text-[var(--ink-300)]'}`}
                      strokeWidth={2}
                    />
                    <span className={`truncate ${compact ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </span>
                  {courseBadge && (
                    <span className={`rounded-full border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-bold text-[var(--ink-700)] ${compact ? 'lg:hidden' : ''}`}>
                      {activeCourses} Active
                    </span>
                  )}
                  {aiBadge && (
                    <span className={`rounded-full border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-violet-600)] ${compact ? 'lg:hidden' : ''}`}>
                      {AI_TOOL_COUNT} Tools
                    </span>
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  title={compact ? 'Admin' : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${
                    compact ? 'lg:justify-center lg:px-2' : ''
                  } ${isAdminRoute ? 'text-[var(--brand-violet)]' : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'}`}
                >
                  <Shield className="size-[18px] shrink-0" strokeWidth={2} />
                  <span className={`flex-1 text-left ${compact ? 'lg:hidden' : ''}`}>Admin</span>
                  <ChevronDown className={`size-4 text-[var(--ink-300)] transition-transform ${adminExpanded ? 'rotate-180' : ''} ${compact ? 'lg:hidden' : ''}`} />
                </button>
                {adminExpanded && (
                  <div className={`mt-1 space-y-0.5 pl-4 ${compact ? 'lg:hidden' : ''}`}>
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-[var(--brand-violet-100)] text-[var(--brand-violet-600)]'
                              : 'text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]'
                          }`}
                        >
                          <Icon className="size-4 shrink-0" strokeWidth={2} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className={`flex flex-col gap-4 ${compact ? 'lg:items-center' : ''}`}>
          {!isSubscribed && (
            <div className={`relative overflow-hidden rounded-2xl border border-[var(--brand-gold-100)] bg-gradient-to-br from-[var(--brand-gold-100)] to-[var(--surface-sunken)] p-4 shadow-sm ${compact ? 'lg:hidden' : ''}`}>
              <span className="mb-2 inline-block rounded-md bg-[var(--brand-gold-dark)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--ink-900)] uppercase">
                SabiLearn Pro
              </span>
              <p className="text-xs leading-snug font-medium text-[var(--ink-700)]">
                Unlimited AI queries, code compilation &amp; verified certs.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink-900)]">
                  {formatKobo(SUBSCRIPTION_PRICE_KOBO)}
                  <span className="text-[10px] font-normal text-[var(--ink-500)]">/mo</span>
                </span>
                <Link
                  href="/dashboard/subscribe"
                  onClick={onClose}
                  className="rounded-lg bg-[var(--brand-gold)] px-2.5 py-1 text-xs font-bold text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--brand-gold-600)]"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}
          {!isSubscribed && (
            <Link
              href="/dashboard/subscribe"
              onClick={onClose}
              title="Upgrade"
              className={`hidden size-10 items-center justify-center rounded-xl bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)] ${compact ? 'lg:flex' : ''}`}
            >
              <Sparkles className="size-4" />
            </Link>
          )}

          <div className="border-t border-[var(--line)]" />

          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`flex items-center rounded-xl p-1.5 transition hover:bg-[var(--surface-sunken)] ${compact ? 'lg:justify-center' : 'justify-between'}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--ink-900)] text-sm font-bold text-white shadow">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="size-full object-cover" />
                ) : (
                  initials
                )}
                <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-[var(--success)]" />
              </div>
              <div className={`min-w-0 ${compact ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm leading-tight font-bold text-[var(--ink-900)]">{user?.name || 'Learner'}</p>
                <p className="truncate text-[11px] text-[var(--ink-500)]">
                  {isSubscribed ? 'Pro learner' : 'Free learner'}
                </p>
              </div>
            </div>
            <MoreVertical className={`size-4 shrink-0 text-[var(--ink-300)] ${compact ? 'lg:hidden' : ''}`} />
          </Link>
        </div>
      </aside>
    </>
  );
}
