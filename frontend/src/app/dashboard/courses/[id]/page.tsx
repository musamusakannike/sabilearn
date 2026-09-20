'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Share2,
  Users,
  Zap,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  Award,
  CreditCard,
  Code2,
  Check,
} from 'lucide-react';
import { courseApi, chapterApi, progressApi, paymentApi } from '@/lib/api';
import { Course, Chapter, Topic, PaymentStatus, Exercise } from '@/lib/types';
import { formatKobo } from '@/lib/money';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ExerciseModal from '@/components/courses/ExerciseModal';
import CoursePaywallModal from '@/components/courses/CoursePaywallModal';
import CoursePaywallBanner from '@/components/courses/CoursePaywallBanner';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Accordion toggle states
  const [accordionState, setAccordionState] = useState({
    learn: false,
    prerequisites: false,
    description: false,
  });

  // Collapsed chapter dropdown states
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [expandedAuthors, setExpandedAuthors] = useState(false);
  const [activeExercise, setActiveExercise] = useState<{ exercise: Exercise; chapterId: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) return;

    (async () => {
      try {
        const [courseRes, chaptersRes, paymentRes] = await Promise.all([
          courseApi.get(id),
          chapterApi.byCourse(id),
          paymentApi.me().catch(() => ({ data: { data: null } })),
        ]);

        if (!active) return;
        const courseData: Course = courseRes.data.data;
        const fetchedChapters: Chapter[] = chaptersRes.data.data || [];
        const payStatus: PaymentStatus = paymentRes.data.data;

        setCourse(courseData);
        setChapters(fetchedChapters);
        setPaymentStatus(payStatus);

        // Check if redirected from a locked lesson
        const hasAccessRightNow =
          !courseData ||
          courseData.isFree ||
          payStatus?.subscription?.status === 'active' ||
          !!payStatus?.purchasedCourseIds?.includes(courseData._id);

        if (!hasAccessRightNow && searchParams.get('paywall') === 'true') {
          setIsPaywallOpen(true);
        }

        // Default expand chapter 1
        if (fetchedChapters.length > 0) {
          setOpenChapters((prev) => ({ ...prev, [fetchedChapters[0]._id]: true }));
        }
      } catch (e) {
        console.error('Failed to load course details:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, searchParams]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, chaptersRes, paymentRes] = await Promise.all([
        courseApi.get(id),
        chapterApi.byCourse(id),
        paymentApi.me().catch(() => ({ data: { data: null } })),
      ]);

      setCourse(courseRes.data.data);
      const fetchedChapters: Chapter[] = chaptersRes.data.data || [];
      setChapters(fetchedChapters);
      setPaymentStatus(paymentRes.data.data);
    } catch (e) {
      console.error('Failed to reload course details:', e);
    }
  };

  const hasAccess =
    !course ||
    course.isFree ||
    paymentStatus?.subscription?.status === 'active' ||
    !!paymentStatus?.purchasedCourseIds?.includes(course._id);

  const toggleAccordion = (key: keyof typeof accordionState) => {
    setAccordionState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChapterDropdown = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  const handleOpenTopic = (chapter: Chapter, topic: Topic) => {
    if (!hasAccess) {
      setIsPaywallOpen(true);
      return;
    }
    if (!topic.isUnlocked) return;

    // Save position asynchronously
    progressApi.savePosition({
      courseId: id,
      chapterId: chapter._id,
      topicId: topic._id,
      contentIndex: 0,
    }).catch(() => {});

    // Navigate directly to dedicated lesson page
    router.push(`/dashboard/courses/${id}/topics/${topic._id}/learn`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--text-muted)]">Course not found.</p>
        <Link href="/dashboard/courses" className="mt-2 inline-block font-semibold text-[var(--brand-gold-600)] hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  const authors = course.authors || [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Toast feedback for copied link */}
      {copiedToast && (
        <div className="animate-in fade-in fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl duration-200">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>Course link copied to clipboard!</span>
        </div>
      )}

      {/* Back button */}
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--ink-900)]">
        <ArrowLeft className="size-4" /> Back to courses
      </Link>

      {/* Hero Section */}
      <div className="relative space-y-6 overflow-hidden">
        {/* Banner image if available */}
        {course.banner && (
          <div className="mb-4 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.banner} alt={course.title} className="size-full object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge tone="neutral">{course.category}</Badge>
            <Badge tone="gold">{course.difficulty}</Badge>
            {!course.isFree && <Badge tone={hasAccess ? 'success' : 'dark'}>{hasAccess ? 'Unlocked' : 'Premium'}</Badge>}
          </div>

          <div className="flex items-center gap-3">
            {!course.isFree && !hasAccess && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-xs font-bold text-slate-950 shadow-xs transition-all hover:brightness-105"
              >
                <Lock className="size-3.5" />
                <span>Unlock ({formatKobo(course.price)})</span>
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-2 text-xs font-semibold text-[var(--ink-900)] transition-colors hover:bg-[var(--line)]"
            >
              <Share2 className="size-4 text-[var(--brand-gold-600)]" />
              <span>Share Course</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-[var(--font-display)] font-extrabold text-[var(--ink-900)] md:text-3xl">
          {course.title}
        </h1>

        {/* Author(s) Profile */}
        {authors.length > 0 && (
          <div className="flex items-center gap-3 border-t border-[var(--line)] pt-4">
            <div className="flex shrink-0 -space-x-2 overflow-hidden">
              {authors.slice(0, expandedAuthors ? authors.length : 3).map((author, aIdx) => (
                <div
                  key={aIdx}
                  className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[var(--brand-gold-100)] text-sm font-bold text-[var(--brand-gold-600)]"
                  title={author.name}
                >
                  {author.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={author.avatar} alt={author.name} className="size-full object-cover" />
                  ) : (
                    author.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Author(s)</p>
              <p className="truncate text-sm font-bold text-[var(--ink-900)]">
                {expandedAuthors ? (
                  authors.map((a) => a.name).join(', ')
                ) : (
                  <>
                    {authors[0].name}
                    {authors.length > 1 && (
                      <button
                        onClick={() => setExpandedAuthors(!expandedAuthors)}
                        className="ml-2 text-xs font-semibold text-[var(--brand-gold-600)] hover:underline"
                      >
                        +{authors.length - 1} more
                      </button>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Hero Metadata Stats Row */}
        <div className="grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4 text-center">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
              <BookOpen className="size-4 text-[var(--brand-gold-600)]" />
              <span>Lessons</span>
            </div>
            <p className="text-lg font-extrabold text-[var(--ink-900)]">{course.lessonCount || 0}</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
              <Users className="size-4 text-[var(--brand-gold-600)]" />
              <span>Registered</span>
            </div>
            <p className="text-lg font-extrabold text-[var(--ink-900)]">{course.registeredUsersCount || 0}</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
              <Zap className="size-4 fill-amber-500 text-amber-500" />
              <span>Total XP</span>
            </div>
            <p className="text-lg font-extrabold text-amber-600">+{course.totalObtainableXp || 0}</p>
          </div>
        </div>

        {/* Course Paywall Banner if user lacks access to premium course */}
        {!course.isFree && !hasAccess && (
          <div className="pt-2">
            <CoursePaywallBanner
              course={course}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 3 Collapsed Dropdowns (Accordion) */}
      <div className="space-y-3">
        {/* What You'll Learn Accordion */}
        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
            <button
              onClick={() => toggleAccordion('learn')}
              className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <span>What you&apos;ll learn</span>
              {accordionState.learn ? <ChevronUp className="size-5 text-[var(--text-muted)]" /> : <ChevronDown className="size-5 text-[var(--text-muted)]" />}
            </button>
            {accordionState.learn && (
              <div className="grid grid-cols-1 gap-3 border-t border-[var(--line)] px-6 pt-2 pb-6 md:grid-cols-2">
                {course.whatYouWillLearn.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold-100)] text-xs font-bold text-[var(--brand-gold-600)]">
                      ✓
                    </div>
                    <p className="text-sm text-[var(--ink-800)]">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prerequisites Accordion */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
          <button
            onClick={() => toggleAccordion('prerequisites')}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)]"
          >
            <span>Prerequisites</span>
            {accordionState.prerequisites ? <ChevronUp className="size-5 text-[var(--text-muted)]" /> : <ChevronDown className="size-5 text-[var(--text-muted)]" />}
          </button>
          {accordionState.prerequisites && (
            <div className="space-y-2 border-t border-[var(--line)] px-6 pt-2 pb-6">
              {course.prerequisites && course.prerequisites.length > 0 ? (
                course.prerequisites.map((prereq, idx) => (
                  <p key={idx} className="flex items-center gap-2 text-sm text-[var(--ink-800)]">
                    <span className="size-1.5 rounded-full bg-[var(--brand-gold)]" />
                    <span>{prereq}</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No prior prerequisites required. Perfect for beginners!</p>
              )}
            </div>
          )}
        </div>

        {/* Description Accordion */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
          <button
            onClick={() => toggleAccordion('description')}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-bold text-[var(--ink-900)] transition-colors hover:bg-[var(--surface-sunken)]"
          >
            <span>Description</span>
            {accordionState.description ? <ChevronUp className="size-5 text-[var(--text-muted)]" /> : <ChevronDown className="size-5 text-[var(--text-muted)]" />}
          </button>
          {accordionState.description && (
            <div className="border-t border-[var(--line)] px-6 pt-2 pb-6">
              <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--ink-800)]">
                {course.longDescription || course.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chapters & Topics List */}
      <div className="space-y-4">
        <h2 className="text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
          Course Structure
        </h2>

        {chapters.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
            <BookOpen className="mx-auto mb-2 size-10 text-[var(--ink-300)]" />
            <p className="text-sm text-[var(--text-muted)]">No chapters published yet for this course.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter, cIdx) => {
              const isOpen = !!openChapters[chapter._id];
              const isLocked = chapter.status === 'locked';
              const isCompleted = chapter.status === 'completed';
              const isInProgress = chapter.status === 'inprogress';

              return (
                <div
                  key={chapter._id}
                  className={`overflow-hidden rounded-2xl border bg-[var(--surface-card)] p-5 md:p-6 shadow-xs transition-all ${
                    isLocked ? 'border-[var(--line)] opacity-70' : 'border-[var(--line)] hover:border-[var(--brand-gold-300)]'
                  }`}
                >
                  {/* Top Row: Index Circle, Chapter Title, Status Badge, Progress Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-bold text-[var(--ink-800)]">
                        {cIdx + 1}
                      </span>
                      <h3 className="text-base font-bold text-[var(--ink-900)] md:text-lg">
                        {chapter.title}
                      </h3>
                      <Badge
                        tone={
                          !hasAccess
                            ? 'dark'
                            : isCompleted
                            ? 'success'
                            : isLocked
                            ? 'dark'
                            : isInProgress
                            ? 'gold'
                            : 'neutral'
                        }
                      >
                        {!hasAccess
                          ? 'Premium'
                          : isCompleted
                          ? 'Completed'
                          : isLocked
                          ? 'Locked'
                          : isInProgress
                          ? 'In Progress'
                          : 'Available'}
                      </Badge>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--surface-sunken)] sm:w-36 md:w-44">
                        <div
                          className="h-full rounded-full bg-[var(--brand-gold)] transition-all duration-300"
                          style={{ width: `${isCompleted ? 100 : chapter.progressPercent || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-muted)] md:text-sm">
                        {isCompleted ? 100 : chapter.progressPercent || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {chapter.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {chapter.description}
                    </p>
                  )}

                  {/* Divider Line */}
                  <div className="my-4 border-t border-[var(--line)]" />

                  {/* Sub-row: Hide/Show Chapter Details Link & Chapter Action CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => toggleChapterDropdown(chapter._id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--brand-gold-600)] transition-colors hover:text-[var(--brand-gold-dark)]"
                    >
                      <span>{isOpen ? 'Hide Chapter Details' : 'Show Chapter Details'}</span>
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>

                    <div>
                      {!hasAccess ? (
                        <button
                          onClick={() => setIsPaywallOpen(true)}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition-all hover:brightness-105"
                        >
                          <Lock className="size-4" />
                          <span>Unlock Chapter</span>
                        </button>
                      ) : isLocked ? (
                        <button
                          disabled
                          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-400"
                        >
                          <Lock className="size-4" />
                          <span>Locked</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => {
                            if (chapter.topics && chapter.topics.length > 0) {
                              handleOpenTopic(chapter, chapter.topics[0]);
                            }
                          }}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-900)] transition-colors hover:bg-[var(--line)]"
                        >
                          <Play className="size-4 fill-[var(--brand-gold-600)] text-[var(--brand-gold-600)]" />
                          <span>Retake Chapter</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const firstUnlocked =
                              (chapter.topics || []).find((t) => t.isUnlocked) || (chapter.topics || [])[0];
                            if (firstUnlocked) {
                              handleOpenTopic(chapter, firstUnlocked);
                            }
                          }}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-xs transition-all hover:brightness-105"
                        >
                          <span>{chapter.progressPercent && chapter.progressPercent > 0 ? 'Continue Chapter' : 'Start Chapter'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Topics List (Clean line items matching reference design) */}
                  {isOpen && (
                    <div className="mt-4 space-y-1 border-t border-[var(--line)]/50 pt-3">
                      {chapter.topics && chapter.topics.length > 0 ? (
                        chapter.topics.map((topic) => {
                          const tUnlocked = !hasAccess ? false : !!topic.isUnlocked;
                          const tCompleted = !!topic.isCompleted;
                          const hasCode =
                            topic.contents?.some((c) => c.type === 'code' || c.type === 'exercise') ||
                            !!topic.exercise ||
                            topic.title.toLowerCase().includes('command') ||
                            topic.title.toLowerCase().includes('code') ||
                            topic.title.toLowerCase().includes('shell') ||
                            topic.title.toLowerCase().includes('script') ||
                            topic.title.toLowerCase().includes('terminal');

                          return (
                            <div
                              key={topic._id}
                              onClick={() => {
                                if (!hasAccess) {
                                  setIsPaywallOpen(true);
                                } else if (topic.isUnlocked) {
                                  handleOpenTopic(chapter, topic);
                                }
                              }}
                              className={`group flex items-center justify-between rounded-lg px-2.5 py-2.5 transition-colors ${
                                !hasAccess
                                  ? 'cursor-pointer hover:bg-[var(--surface-sunken)]/60'
                                  : !topic.isUnlocked
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer hover:bg-[var(--surface-sunken)]/60'
                              }`}
                            >
                              {/* Left: Icon & Title */}
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center text-[var(--ink-800)]">
                                  {hasCode ? (
                                    <Code2 className="size-4 stroke-[2.2] text-[var(--ink-900)]" />
                                  ) : (
                                    <Play className="size-3.5 fill-none stroke-[2.2] text-[var(--brand-gold-600)]" />
                                  )}
                                </span>
                                <span className="truncate text-sm font-bold text-[var(--ink-900)] transition-colors group-hover:text-[var(--brand-gold-600)]">
                                  {topic.title}
                                </span>
                              </div>

                              {/* Right: Status Checkmark / Lock & XP */}
                              <div className="flex shrink-0 items-center gap-2 pl-4">
                                {!hasAccess ? (
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                                    <Lock className="size-3.5 text-[var(--brand-gold-600)]" />
                                    <span>{topic.xp || 50} XP</span>
                                  </div>
                                ) : !topic.isUnlocked ? (
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                                    <Lock className="size-3.5" />
                                    <span>{topic.xp || 50} XP</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {tCompleted && (
                                      <Check className="size-4 stroke-[3] text-emerald-500" />
                                    )}
                                    <span className="text-sm font-semibold text-[var(--ink-900)]">
                                      {topic.xp || 50} XP
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-2 text-center text-xs text-[var(--text-muted)]">
                          No topics available in this chapter yet.
                        </p>
                      )}

                      {/* Chapter Capstone Assessment item if present */}
                      {chapter.exercise && chapter.exercise.questions && chapter.exercise.questions.length > 0 && (
                        <div
                          onClick={() => {
                            if (!hasAccess) {
                              setIsPaywallOpen(true);
                              return;
                            }
                            if (isLocked) return;
                            router.push(`/dashboard/courses/${id}/chapters/${chapter._id}/assessment`);
                          }}
                          className={`group flex items-center justify-between rounded-lg px-2.5 py-2.5 transition-colors ${
                            !hasAccess
                              ? 'cursor-pointer hover:bg-[var(--surface-sunken)]/60'
                              : isLocked
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-pointer hover:bg-[var(--surface-sunken)]/60'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center text-amber-600">
                              <Award className="size-4" />
                            </span>
                            <div className="flex items-center gap-2 truncate">
                              <span className="truncate text-sm font-bold text-[var(--ink-900)] transition-colors group-hover:text-[var(--brand-gold-600)]">
                                {chapter.exercise.title || 'Chapter Capstone Assessment'}
                              </span>
                              <span className="shrink-0 rounded-md bg-[var(--brand-gold-100)] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-gold-600)]">
                                Capstone
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 pl-4">
                            <span className="text-sm font-semibold text-[var(--ink-900)]">
                              {chapter.exercise.questions.reduce((sum, q) => sum + (q.xp || 20), 0)} XP
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Paywall Modal */}
      {course && (
        <CoursePaywallModal
          open={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          course={course}
        />
      )}
    </div>
  );
}
