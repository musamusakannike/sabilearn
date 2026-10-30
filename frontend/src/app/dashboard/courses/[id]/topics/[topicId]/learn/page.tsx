'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chapterApi, topicApi } from '@/lib/api';
import { Chapter, Topic } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StepPlayer from '@/components/lesson/StepPlayer';

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const topicId = params.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [nextTopicId, setNextTopicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [res, chaptersRes] = await Promise.all([
          topicApi.get(topicId),
          chapterApi.byCourse(courseId),
        ]);
        const loadedTopic: Topic = res.data.data;
        const chapters: Chapter[] = chaptersRes.data.data || [];
        setTopic(loadedTopic);

        const orderedTopics = chapters.flatMap((chapter) =>
          (chapter.topics || []).map((chapterTopic) => ({ chapter, topic: chapterTopic })),
        );
        const currentIndex = orderedTopics.findIndex(({ topic: item }) => item._id === topicId);
        const currentChapterId = loadedTopic.chapter;
        const nextTopic = currentIndex >= 0
          ? orderedTopics.slice(currentIndex + 1).find(({ chapter, topic: item }) => {
              const sameChapter = chapter._id === currentChapterId;
              return !item.isCompleted && (sameChapter || (chapter.status !== 'locked' && item.isUnlocked));
            })
          : undefined;
        setNextTopicId(nextTopic?.topic._id || null);
      } catch (e: unknown) {
        const error = e as { response?: { status?: number } };
        if (error.response?.status === 403) {
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
  const handleContinue = () => {
    if (nextTopicId) {
      router.push(`/dashboard/courses/${courseId}/topics/${nextTopicId}/learn`);
      return;
    }
    handleClose();
  };

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
      onContinue={handleContinue}
    />
  );
}
