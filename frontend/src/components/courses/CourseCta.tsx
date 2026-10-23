'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { formatKobo } from '@/lib/money';
import { useIsClient, withRedirect } from '@/lib/redirect';

interface CourseCtaProps {
  courseId: string;
  slug: string;
  isFree: boolean;
  price: number;
}

const primaryBtn =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#0E0E1A] bg-[#F8BE43] px-5 py-3 font-[var(--font-display)] text-sm font-bold text-[#0E0E1A] shadow-sm transition-all duration-150 hover:bg-[#f2b330] hover:shadow active:translate-y-0.5';

/**
 * Adapts the call to action to auth state. Rendered client-side only so the page
 * itself stays fully static/crawlable for logged-out visitors and search engines.
 */
export default function CourseCta({ courseId, slug, isFree, price }: CourseCtaProps) {
  const { isAuthenticated, token } = useAuthStore();
  const mounted = useIsClient();
  const target = `/courses/${slug}`;

  // Auth state comes from localStorage, so only trust it on the client to avoid a hydration mismatch.

  if (mounted && (isAuthenticated || token)) {
    return (
      <Link href={`/dashboard/courses/${courseId}`} className={primaryBtn}>
        Continue in dashboard <ArrowRight className="size-4" />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Link href={withRedirect('/auth/register', target)} className={primaryBtn}>
        {isFree ? 'Sign up free to start' : `Sign up to unlock (${formatKobo(price)})`}
        <ArrowRight className="size-4" />
      </Link>
      <Link
        href={withRedirect('/auth/login', target)}
        className="text-center text-sm font-semibold text-[var(--ink-900)] hover:underline"
      >
        Already have an account? Log in
      </Link>
    </div>
  );
}
