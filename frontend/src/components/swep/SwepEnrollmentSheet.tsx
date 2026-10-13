'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSwepEnrollment } from '@/hooks/useSwepEnrollment';
import Button from '@/components/ui/Button';

export default function SwepEnrollmentSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { showSheet, accept, decline, dismissSheetForSession } = useSwepEnrollment();
  const onSwepRoute = pathname.startsWith('/swep') || pathname.startsWith('/dashboard/swep');
  const visible = showSheet && !onSwepRoute;

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissSheetForSession();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismissSheetForSession]);

  const onYes = () => {
    accept();
    router.push(isAuthenticated ? '/dashboard/swep' : '/swep');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-[rgba(14,14,26,0.55)]"
            onClick={dismissSheetForSession}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="swep-enroll-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl bg-[var(--surface-page)] sm:mb-0"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-12 rounded-full bg-[var(--line)]" />
            </div>
            <button
              type="button"
              onClick={dismissSheetForSession}
              className="absolute top-4 right-4 rounded-full p-1.5 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <div className="px-5 pt-2 pb-7">
              <div className="mx-auto mb-3 flex size-16 items-end justify-center overflow-hidden rounded-xl bg-[var(--brand-gold-100)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mascot/mascot-unilorin.webp"
                  alt=""
                  className="h-14 w-auto object-contain"
                />
              </div>
              <p className="mb-1 text-center text-[11px] font-medium tracking-wide text-[var(--ink-500)] uppercase">
                University of Ilorin · SWEP
              </p>
              <h2
                id="swep-enroll-title"
                className="text-center text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]"
              >
                Are you enrolled for SWEP at Unilorin?
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-[var(--ink-500)]">
                Free past questions with explanations across workshop units.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button fullWidth onClick={onYes}>
                  Yes, take me there
                </Button>
                <Button fullWidth variant="secondary" onClick={decline}>
                  No, I&apos;m not
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
