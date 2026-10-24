'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
}

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Courses', href: '/courses' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Navbar({
  links = DEFAULT_NAV_LINKS,
  active,
}: {
  links?: NavLink[];
  active?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const sourceLinks = links && links.length > 0 ? links : DEFAULT_NAV_LINKS;

  // On the homepage ('/'), relative hash anchors ('#features') scroll natively in the page.
  // On other pages ('/courses', '/blog', etc.), hash links must point back to home ('/#features').
  const resolvedLinks = sourceLinks.map((l) => {
    if (pathname === '/' && l.href.startsWith('/#')) {
      return { ...l, href: l.href.slice(1) };
    }
    if (pathname && pathname !== '/' && l.href.startsWith('#')) {
      return { ...l, href: `/${l.href}` };
    }
    return l;
  });

  const isLinkActive = (l: NavLink) => {
    if (active) {
      return l.label.toLowerCase() === active.toLowerCase();
    }
    if (pathname) {
      if (l.href === pathname) return true;
      if (
        l.href !== '/' &&
        !l.href.startsWith('#') &&
        !l.href.startsWith('/#') &&
        pathname.startsWith(l.href)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <header className="relative z-40 w-full bg-[var(--surface-page)] px-6 py-5 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="font-[var(--font-display)] text-xl font-bold tracking-tight text-[#0E0E1A]">
            Sabi<span className="text-[#F8BE43]">Learn</span>
          </span>
        </Link>

        {/* Center: Nav links (Desktop) */}
        <nav className="hidden items-center gap-8 md:flex">
          {resolvedLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-[15px] font-medium transition-colors ${
                isLinkActive(l)
                  ? 'text-[#0E0E1A] font-bold'
                  : 'text-[#2D2D3A] hover:text-[#0E0E1A]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: Auth CTAs (Desktop) */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/auth/login"
            className="text-[15px] font-semibold text-[#0E0E1A] transition-colors hover:text-[var(--brand-violet-600)]"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border-2 border-[#0E0E1A] bg-[#F8BE43] px-5 py-2.5 font-[var(--font-display)] text-sm font-bold text-[#0E0E1A] shadow-sm transition-all duration-150 hover:bg-[#f2b330] hover:shadow active:translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/auth/register"
            className="rounded-lg border-2 border-[#0E0E1A] bg-[#F8BE43] px-3.5 py-1.5 font-[var(--font-display)] text-xs font-bold text-[#0E0E1A]"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#0E0E1A]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-card)] p-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-3">
            {resolvedLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1.5 text-base font-medium transition-colors ${
                  isLinkActive(l) ? 'font-bold text-[#0E0E1A]' : 'text-[#2D2D3A]'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 border-t border-[var(--line)] pt-3 flex flex-col gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-base font-semibold text-[#0E0E1A]"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border-2 border-[#0E0E1A] bg-[#F8BE43] py-2.5 text-center font-[var(--font-display)] text-sm font-bold text-[#0E0E1A]"
              >
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
