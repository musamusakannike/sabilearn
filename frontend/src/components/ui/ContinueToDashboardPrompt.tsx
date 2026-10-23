'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';

export default function ContinueToDashboardPrompt() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    queueMicrotask(() => setOpen(true));
  }, [isAuthenticated]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Welcome back!"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Stay on this page</Button>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>Go to dashboard</Button>
        </>
      }
    >
      <div className="flex items-center gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/mascot/tutor-mascot.webp"
          alt="Tutor mascot"
          className="size-12 shrink-0 object-contain"
        />
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          {user?.firstName ? `Hi ${user.firstName}, you're` : "You're"} already signed in. Continue to your dashboard to pick up where you left off.
        </p>
      </div>
    </Dialog>
  );
}
