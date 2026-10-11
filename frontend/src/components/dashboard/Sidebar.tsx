"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  X,
  LayoutDashboard,
  Users,
  Activity,
  ChevronDown,
  BookOpen,
  Newspaper,
  Smartphone,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { paymentApi, progressApi } from "@/lib/api";
import { formatKobo } from "@/lib/money";
import { PaymentStatus } from "@/lib/types";

const SUBSCRIPTION_PRICE_KOBO = Number(
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_KOBO || 300000,
);

type NavItemConfig = {
  href: string;
  label: string;
  badgeKey?: "courses" | "ai";
  renderIcon: (active: boolean) => React.ReactNode;
};

const navItems: NavItemConfig[] = [
  {
    href: "/dashboard",
    label: "Home",
    renderIcon: () => (
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/courses",
    label: "Courses & Tracks",
    badgeKey: "courses",
    renderIcon: (active: boolean) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${
          active
            ? "text-orange-600"
            : "text-stone-400 group-hover:text-stone-600"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/playground",
    label: "Code Playground",
    renderIcon: (active: boolean) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${
          active
            ? "text-orange-600"
            : "text-stone-400 group-hover:text-stone-600"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/ai/quiz",
    label: "AI Study Suite",
    badgeKey: "ai",
    renderIcon: () => (
      <svg
        className="w-5 h-5 shrink-0 text-purple-600 transition-colors"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2ZM6.5 17.5L5 21.5L3.5 17.5L-0.5 16L3.5 14.5L5 10.5L6.5 14.5L10.5 16L6.5 17.5Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/leaderboard",
    label: "Leaderboard",
    renderIcon: (active: boolean) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${
          active
            ? "text-orange-600"
            : "text-stone-400 group-hover:text-stone-600"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    renderIcon: (active: boolean) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${
          active
            ? "text-orange-600"
            : "text-stone-400 group-hover:text-stone-600"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const adminItems = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/activity", label: "Activity", icon: Activity },
  {
    href: "/dashboard/admin/app-review",
    label: "App Review",
    icon: Smartphone,
  },
];

const AI_TOOL_COUNT = 4;

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sabilearn_sidebar_collapsed") === "1";
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
        localStorage.setItem("sabilearn_sidebar_collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/ai/quiz")
      return (
        pathname.startsWith("/dashboard/ai") ||
        pathname.startsWith("/dashboard/generate-course")
      );
    return pathname.startsWith(href);
  };

  const isSubscribed = payment?.subscription?.status === "active";
  const initials = (
    user?.firstName?.charAt(0) ||
    user?.name?.charAt(0) ||
    "M"
  ).toUpperCase();
  const compact = collapsed;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        data-purpose="collapsible-sidebar"
        className={`fixed top-0 left-0 z-50 flex h-screen shrink-0 flex-col justify-between border-r border-stone-200/80 bg-white p-5 select-none transition-all duration-300 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-72 lg:w-[4.75rem]" : "w-72"}`}
      >
        {/* Brand & Navigation Group */}
        <div className="flex min-h-0 flex-col gap-5">
          {/* Logo and Toggle Header */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-3 group ${compact ? "lg:hidden" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://pub-080732c6fb61453c92062218797bf9df.r2.dev/logo.png"
                alt="SabiLearn"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 lg:inline-flex"
              title={collapsed ? "Expand navigation" : "Minimize navigation"}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {collapsed ? (
                  <path
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                ) : (
                  <path
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-sm font-semibold text-stone-600">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const courseBadge =
                item.badgeKey === "courses" && activeCourses > 0;
              const aiBadge = item.badgeKey === "ai";

              if (active) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={compact ? item.label : undefined}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-orange-50 text-orange-600 shadow-xs shadow-orange-100 font-bold transition-all ${
                      compact ? "lg:justify-center lg:px-2" : ""
                    }`}
                  >
                    {item.renderIcon(true)}
                    <span
                      className={`flex-1 truncate ${compact ? "lg:hidden" : ""}`}
                    >
                      {item.label}
                    </span>
                    {courseBadge && (
                      <span
                        className={`rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600 ${
                          compact ? "lg:hidden" : ""
                        }`}
                      >
                        {activeCourses} Active
                      </span>
                    )}
                    {aiBadge && (
                      <span
                        className={`rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 ${
                          compact ? "lg:hidden" : ""
                        }`}
                      >
                        {AI_TOOL_COUNT} Tools
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={compact ? item.label : undefined}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-stone-600 transition-colors hover:bg-cream-100 hover:text-stone-900 ${
                    compact ? "lg:justify-center lg:px-2" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    {item.renderIcon(false)}
                    <span className={`truncate ${compact ? "lg:hidden" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                  {courseBadge && (
                    <span
                      className={`rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600 ${
                        compact ? "lg:hidden" : ""
                      }`}
                    >
                      {activeCourses} Active
                    </span>
                  )}
                  {aiBadge && (
                    <span
                      className={`rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 ${
                        compact ? "lg:hidden" : ""
                      }`}
                    >
                      {AI_TOOL_COUNT} Tools
                    </span>
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="mt-4 border-t border-stone-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  title={compact ? "Admin" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold ${
                    compact ? "lg:justify-center lg:px-2" : ""
                  } ${isAdminRoute ? "text-purple-700 bg-purple-50" : "text-stone-600 hover:bg-cream-100 hover:text-stone-900"}`}
                >
                  <Shield
                    className="size-[18px] shrink-0 text-stone-400"
                    strokeWidth={2}
                  />
                  <span
                    className={`flex-1 text-left ${compact ? "lg:hidden" : ""}`}
                  >
                    Admin
                  </span>
                  <ChevronDown
                    className={`size-4 text-stone-400 transition-transform ${
                      adminExpanded ? "rotate-180" : ""
                    } ${compact ? "lg:hidden" : ""}`}
                  />
                </button>
                {adminExpanded && (
                  <div
                    className={`mt-1 space-y-0.5 pl-4 ${compact ? "lg:hidden" : ""}`}
                  >
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                            active
                              ? "bg-purple-100 text-purple-700"
                              : "text-stone-600 hover:bg-cream-100 hover:text-stone-900"
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

            {/* Bottom Profile and Pro Upgrade Section */}
            <div
              className={`flex flex-col gap-4 ${compact ? "lg:items-center" : ""}`}
            >
              {!isSubscribed && (
                <div
                  className={`relative overflow-hidden rounded-lg border border-orange-200/70 bg-gradient-to-br from-amber-50 to-orange-100 p-4 shadow-sm ${
                    compact ? "lg:hidden" : ""
                  }`}
                >
                  <div className="pointer-events-none absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-orange-400/20 blur-xl" />
                  <span className="mb-2 inline-block rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                    SabiLearn Pro
                  </span>
                  <p className="text-xs leading-snug font-medium text-stone-700">
                    Unlimited AI queries, code compilation &amp; verified certs.
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">
                      {formatKobo(SUBSCRIPTION_PRICE_KOBO)}
                      <span className="text-[10px] font-normal text-stone-500">
                        /mo
                      </span>
                    </span>
                    <Link
                      href="/dashboard/subscribe"
                      onClick={onClose}
                      className="rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700"
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
                  className={`hidden size-10 items-center justify-center rounded bg-orange-50 text-orange-600 ${
                    compact ? "lg:flex" : ""
                  }`}
                >
                  <svg
                    className="size-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2ZM6.5 17.5L5 21.5L3.5 17.5L-0.5 16L3.5 14.5L5 10.5L6.5 14.5L10.5 16L6.5 17.5Z" />
                  </svg>
                </Link>
              )}
            </div>
          </nav>

          <hr className="border-stone-200/80" />

          {/* User Profile Quick Bar */}
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`flex cursor-pointer items-center rounded-xl p-1.5 transition hover:bg-stone-50 ${
              compact ? 'lg:justify-center' : 'justify-between'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-900 text-sm font-bold text-white shadow">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={"/images/mascot/tutor-mascot.webp"} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className={`min-w-0 ${compact ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm leading-tight font-bold text-stone-900">
                  {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Musa Kannike')}
                </p>
                <p className="truncate text-[11px] text-stone-500">
                  {isSubscribed ? 'Pro Learner Tier' : 'Free Learner Tier'}
                </p>
              </div>
            </div>
            <div className={`rounded-lg p-1 text-stone-400 hover:text-stone-600 ${compact ? 'lg:hidden' : ''}`} title="Settings">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
