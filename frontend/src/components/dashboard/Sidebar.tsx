"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/ThemeProvider";
import { BetaBadge } from "@/components/BetaBadge";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

const primaryNavItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Courses",
    href: "/dashboard/courses",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Quizzes",
    href: "/dashboard/quizzes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

const secondaryNavItems = [
  {
    label: "History",
    href: "/dashboard/history",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    label: "Documents",
    href: "/dashboard/documents",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Videos",
    href: "/dashboard/videos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOnSecondaryRoute = secondaryNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [moreOpen, setMoreOpen] = useState(isOnSecondaryRoute);
  
  const sidebarWidth = 300;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = sidebarWidth / 2;
    const isSwipeLeft = info.velocity.x < -300;
    const isSwipeRight = info.velocity.x > 300;
    
    // Sidebar slides in from the right, so dragging LEFT = closing
    if (isSwipeLeft || info.offset.x < -threshold) {
      setMobileOpen(false);
    }
  };

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--border-subtle)]">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <Image
            src="/synapse.webp"
            alt="Sabi Learn Logo"
            width={32}
            height={32}
            priority
            className="object-contain w-full h-full"
          />
        </div>
        {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
          <span className="font-[family-name:var(--font-display)] text-sm font-bold">Sabi Learn</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {primaryNavItems.map((item, idx) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                  <span className="font-medium flex items-center gap-2">
                    {item.label}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* More toggle */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
            moreOpen
              ? "text-[var(--text-primary)] bg-[var(--bg-hover)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          )}
        >
          <span className="flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </span>
          {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <span className="font-medium flex-1 text-left flex items-center justify-between">
              More
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("transition-transform duration-200", moreOpen && "rotate-180")}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          )}
        </button>

        {/* Secondary nav items */}
        {moreOpen && secondaryNavItems.map((item, idx) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (idx + primaryNavItems.length) * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  (!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && "pl-6",
                  isActive
                    ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                  <span className="font-medium flex items-center gap-2">
                    {item.label}
                    {item.label === "Videos" && <BetaBadge />}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme Switcher */}
      <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
            "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          )}
          title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
        >
          <span className="flex-shrink-0">
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </span>
          {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <span className="font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>
      </div>

      {/* User */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[var(--accent)]">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.premium ? "Premium" : "Free plan"}</p>
            </div>
          )}
        </div>
        {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
          <button
            onClick={logout}
            className="mt-3 w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors px-1"
          >
            Sign out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Invisible screen edge listener for swipe to pull sidebar open (right to left) */}
      {!mobileOpen && (
        <div 
          className="fixed top-0 right-0 w-6 h-full z-50 md:hidden"
          style={{ pointerEvents: "auto" }}
          onTouchStart={(e) => {
            const touchStartX = e.touches[0].clientX;
            const handleTouchMove = (moveEvent: TouchEvent) => {
              const deltaX = moveEvent.touches[0].clientX - touchStartX;
              if (deltaX < -50) {
                setMobileOpen(true);
                document.removeEventListener("touchmove", handleTouchMove);
              }
            };
            document.addEventListener("touchmove", handleTouchMove);
            document.addEventListener("touchend", () => {
              document.removeEventListener("touchmove", handleTouchMove);
            }, { once: true });
          }}
        />
      )}

      {/* Mobile capsule toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-6 right-6 z-50 md:hidden flex items-center gap-2 rounded-full py-2 px-4 bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border)] shadow-[0_0_15px_rgba(232,168,56,0.15)] transition-all active:scale-95"
      >
        <div className="relative w-12 h-3.5 overflow-hidden flex items-center justify-end">
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] absolute right-0"
              >
                CLOSE
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] absolute right-0"
              >
                MENU
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {mobileOpen ? (
          <X className="w-4 h-4 text-[var(--text-primary)]" />
        ) : (
          <Menu className="w-4 h-4 text-[var(--text-primary)]" />
        )}
      </button>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Slide-out Sidebar Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            drag="x"
            dragConstraints={{ left: 0, right: sidebarWidth }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={{ x: sidebarWidth }}
            animate={{ x: 0 }}
            exit={{ x: sidebarWidth }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[300px] sm:w-[400px] z-40 flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] shadow-2xl md:hidden"
          >
            {navContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop static left sidebar */}
      <aside
        className={cn(
          "h-full hidden md:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-all duration-200 flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
