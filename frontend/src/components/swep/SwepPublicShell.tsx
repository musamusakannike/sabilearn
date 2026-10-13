'use client';

import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import SwepChrome from '@/components/swep/SwepChrome';

const navLinks = [
  { label: 'SWEP', href: '/swep' },
  { label: 'Courses', href: '/dashboard/courses' },
  { label: 'Blog', href: '/blog' },
];

export default function SwepPublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <SwepChrome />
      <Navbar links={navLinks} active="SWEP" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
