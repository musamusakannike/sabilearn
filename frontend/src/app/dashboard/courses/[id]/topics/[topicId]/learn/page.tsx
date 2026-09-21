'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { topicApi } from '@/lib/api';
import { Topic } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StepPlayer from '@/components/lesson/StepPlayer';

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const topicId = params.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await topicApi.get(topicId);
        setTopic(res.data.data);
      } catch (e: any) {
        if (e.response?.status === 403) {
          setAccessDenied(true);
          router.replace(`/dashboard/courses/${courseId}?paywall=true`);
        } else {
          console.error(e);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [topicId, courseId, router]);

  const handleClose = () => router.push(`/dashboard/courses/${courseId}`);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[var(--surface-page)] p-6 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm font-bold text-[var(--ink-900)]">Preparing your lesson…</p>
        <p className="text-xs text-[var(--text-muted)]">Formatting interactive takeaways and practice check-ins</p>
      </div>
    );
  }

  if (accessDenied || !topic) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--surface-page)] p-6 text-center">
        <p className="text-[var(--text-muted)]">
          {accessDenied
            ? 'This lesson requires course purchase or an active subscription.'
            : 'Topic not found.'}
        </p>
        <button
          onClick={handleClose}
          className="cursor-pointer rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition-all hover:brightness-105"
        >
          {accessDenied ? 'View Access Options' : 'Go back'}
        </button>
      </div>
    );
  }

  return (
    <StepPlayer
      topic={topic}
      onClose={handleClose}
    />
  );
}
