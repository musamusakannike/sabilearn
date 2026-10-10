"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  FileQuestion,
  MessageCircleQuestion,
  Play,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Trophy,
} from "lucide-react";
import {
  courseApi,
  leaderboardApi,
  progressApi,
} from "@/lib/api";
import {
  Course,
  Chapter,
  Topic,
  UserProgress,
  ResumptionData,
  DashboardData,
  ProgressStats,
  LeaderboardUser,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  SummarizerDialog,
  QuizGeneratorDialog,
  QAAIDialog,
} from "@/components/ai/AIToolDialogs";

type ActiveTool = "summarizer" | "quiz" | "qa" | "course" | null;

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [resumptionData, setResumptionData] = useState<ResumptionData>({
    resumptionCards: [],
    totalUnfinished: 0,
  });
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const [resumptionRes, dashboardRes, popularRes, statsRes, boardRes] =
          await Promise.all([
            progressApi.dashboardResumption(),
            progressApi.dashboard(),
            courseApi.popular().catch(() => null),
            progressApi.stats().catch(() => null),
            leaderboardApi.get("1w").catch(() => null),
          ]);

        if (resumptionRes.data?.success) {
          const rawData = resumptionRes.data.data;
          const filteredCards = (rawData.resumptionCards || []).filter(
            (p: UserProgress) => {
              const course =
                typeof p.course === "object" ? (p.course as Course) : null;
              return course && course._id && course.isPublished !== false;
            },
          );
          setResumptionData({
            resumptionCards: filteredCards,
            totalUnfinished: rawData.totalUnfinished,
          });
        }

        if (dashboardRes.data?.success) {
          setDashboard(dashboardRes.data.data);
        }

        if (statsRes?.data?.success) {
          setStats(statsRes.data.data);
        }

        if (boardRes?.data?.success) {
          setLeaders(boardRes.data.data || []);
        }

        if (popularRes?.data?.success) {
          setPopularCourses(popularRes.data.data || []);
        } else if (popularRes?.data?.data) {
          setPopularCourses(popularRes.data.data);
        }
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const { resumptionCards, totalUnfinished } = resumptionData;
  const firstName = user?.firstName?.trim();
  const hour = new Date().getHours();
  const streak = dashboard?.streak ?? user?.currentStreak ?? 0;
  const xp = dashboard?.totalXp ?? user?.totalXp ?? 0;
  const dailyGoalPct = stats?.dailyGoal?.progress ?? 0;

  const categories = useMemo(() => {
    const set = new Set<string>();
    resumptionCards.forEach((p) => {
      const course = typeof p.course === "object" ? (p.course as Course) : null;
      if (course?.category) set.add(course.category);
    });
    return Array.from(set);
  }, [resumptionCards]);

  const visibleCards = useMemo(() => {
    if (categoryFilter === "all") return resumptionCards;
    return resumptionCards.filter((p) => {
      const course = typeof p.course === "object" ? (p.course as Course) : null;
      return course?.category === categoryFilter;
    });
  }, [resumptionCards, categoryFilter]);

  let speech = "What do you want to learn today?";
  if (streak > 1) speech = `A ${streak}-day streak! Ready to keep it going?`;
  else if (resumptionCards.length > 0)
    speech = "Let’s pick up where you left off.";

  const aiTools: {
    kind: ActiveTool;
    title: string;
    description: string;
    cta: string;
    icon: React.ReactNode;
  }[] = [
    {
      kind: "summarizer",
      title: "Summarizer",
      description: "Turn any lengthy lecture note or PDF into a crisp, readable summary.",
      cta: "Try Summarizer",
      icon: <FileText className="size-6" />,
    },
    {
      kind: "quiz",
      title: "Quiz Generator",
      description: "Generate quick multiple-choice assessments from any topic or lesson.",
      cta: "Build Practice Test",
      icon: <FileQuestion className="size-6" />,
    },
    {
      kind: "course",
      title: "Generate Course",
      description: "Turn rough notes or a one-line prompt into a complete structured curriculum.",
      cta: "Draft New Track",
      icon: <BookOpen className="size-6" />,
    },
    {
      kind: "qa",
      title: "Q&A AI Tutor",
      description: "Ask any tricky coding or theory question and receive instant step-by-step guidance.",
      cta: "Ask Anything",
      icon: <MessageCircleQuestion className="size-6" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const myId = user?.id || user?._id;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-12 items-stretch gap-6">
        <div className="relative col-span-12 flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-sm lg:col-span-7">
          <div className="pointer-events-none absolute -top-12 -right-12 font-mono text-7xl font-black text-[var(--surface-sunken)] select-none">
            01001100
          </div>
          <div className="relative z-10 flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-[var(--ink-900)] shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/mascot/tutor-mascot.webp"
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[var(--success)] text-[9px] font-bold text-white">
                ✓
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="rounded-full border border-[var(--brand-gold-100)] bg-[var(--brand-gold-100)] px-2.5 py-1 text-xs font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">
                {greetingForHour(hour)}
              </span>
              <h1 className="mt-1 text-2xl font-[var(--font-display)] font-black text-[var(--ink-900)]">
                {firstName || "there"}
              </h1>
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-900)]">
                “{speech}”
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4 sm:gap-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)]/70 p-3">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Day Streak</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-lg font-black text-[var(--ink-900)]">{streak}</span>
                <span className="text-xs text-[var(--ink-500)]">Days</span>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)]/70 p-3">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Total XP</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-lg font-black text-[var(--brand-violet)]">{xp.toLocaleString()}</span>
                <span className="text-xs text-[var(--ink-500)]">Pts</span>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)]/70 p-3">
              <p className="text-[11px] font-bold text-[var(--ink-500)] uppercase">Daily Goal</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-lg font-black text-[var(--success)]">{Math.round(dailyGoalPct)}%</span>
                <span className="text-xs text-[var(--ink-500)]">done</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative col-span-12 flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--brand-gold-100)] bg-gradient-to-br from-[var(--brand-gold-100)] via-[var(--surface-sunken)] to-[var(--brand-gold-100)] p-6 shadow-sm lg:col-span-5">
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-gold-dark)] text-xl font-black text-[var(--ink-900)] shadow-md">
              {"</>"}
            </div>
            <div>
              <span className="mb-1 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">
                Browser IDE
              </span>
              <h3 className="text-lg font-extrabold text-[var(--ink-900)]">Code Playground</h3>
              <p className="mt-1 text-xs leading-relaxed font-medium text-[var(--ink-700)]">
                Write and run HTML, CSS, JavaScript, and Python directly inside your browser without installing anything.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[var(--brand-gold-100)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-900)]">
              <span className="size-2 animate-pulse rounded-full bg-[var(--success)]" />
              HTML, JS &amp; Python runtime ready
            </div>
            <Link
              href="/dashboard/playground"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-xs font-bold text-[var(--ink-900)] shadow-md transition-all hover:bg-[var(--brand-gold-600)]"
            >
              Open Playground
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold text-[var(--ink-900)]">AI Study Suite</h2>
            <span className="rounded-full border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)] px-2.5 py-0.5 text-xs font-bold text-[var(--brand-violet-600)]">
              4 tools
            </span>
          </div>
          <p className="text-xs font-semibold text-[var(--ink-500)]">
            Accelerate retention, generate tests, and transcribe summaries in seconds
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {aiTools.map((tool) => (
            <button
              key={tool.kind}
              type="button"
              onClick={() => {
                if (tool.kind === "quiz") router.push("/dashboard/ai/quiz");
                else if (tool.kind === "course") router.push("/dashboard/ai/course-architect");
                else setActiveTool(tool.kind);
              }}
              className="group flex flex-col justify-between rounded-2xl border border-[var(--brand-violet-100)] bg-[var(--brand-violet-100)]/50 p-5 text-left shadow-xs transition-all hover:bg-[var(--surface-card)] hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[var(--brand-violet-100)] text-[var(--brand-violet)] transition-transform group-hover:scale-110">
                  {tool.icon}
                </div>
                <h3 className="text-base font-bold text-[var(--ink-900)] transition-colors group-hover:text-[var(--brand-violet)]">
                  {tool.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-700)]">{tool.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-violet-100)] pt-3 text-xs font-bold text-[var(--brand-violet)]">
                <span>{tool.cta}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--ink-900)]">In-Progress Tracks</h2>
            <p className="text-xs font-medium text-[var(--ink-500)]">
              Continue where you left off across your enrolled topics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {totalUnfinished > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                    categoryFilter === "all"
                      ? "border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs"
                      : "border-transparent text-[var(--ink-500)] hover:bg-[var(--surface-card)]"
                  }`}
                >
                  All ({totalUnfinished})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      categoryFilter === cat
                        ? "border border-[var(--line)] bg-[var(--surface-card)] font-bold text-[var(--ink-900)]"
                        : "text-[var(--ink-500)] hover:bg-[var(--surface-card)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
            {totalUnfinished > 4 && (
              <Link
                href="/dashboard/progress"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-900)] hover:underline"
              >
                See more <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>

        {visibleCards.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-[var(--brand-gold-600)]" />
            <h3 className="text-base font-bold text-[var(--ink-900)]">No active course in progress</h3>
            <p className="mx-auto max-w-md text-xs text-[var(--ink-500)]">
              Start a new course today and your progress will appear here for quick resumption.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-xs font-semibold text-[var(--ink-900)] hover:brightness-105"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCards.map((progress) => {
              const course =
                typeof progress.course === "object" ? (progress.course as Course) : null;
              if (!course || !course._id || course.isPublished === false) return null;
              const chapter =
                typeof progress.lastChapter === "object"
                  ? (progress.lastChapter as Chapter)
                  : null;
              const topic =
                typeof progress.lastTopic === "object" ? (progress.lastTopic as Topic) : null;
              const pct = progress.percentCompleted || 0;

              return (
                <article
                  key={progress._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-36 w-full overflow-hidden border-b border-[var(--line)]">
                    {course.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.banner}
                        alt=""
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full bg-[var(--surface-sunken)]" />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge tone="gold">{course.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-[var(--brand-gold-600)] uppercase">
                          {course.category || "Course"}
                        </span>
                        {typeof course.totalObtainableXp === "number" && (
                          <>
                            <span className="text-[var(--ink-300)]">•</span>
                            <span className="text-[11px] font-semibold text-[var(--ink-500)]">
                              +{course.totalObtainableXp} XP
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base leading-snug font-bold text-[var(--ink-900)] transition-colors group-hover:text-[var(--brand-gold-600)]">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-500)]">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 border-t border-[var(--line)] pt-4">
                      <div className="mb-1.5 flex justify-between text-xs font-bold text-[var(--ink-700)]">
                        <span className="truncate pr-2">
                          {chapter?.title || topic?.title || "In progress"}
                        </span>
                        <span className="shrink-0 text-[var(--brand-gold-600)]">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                        <div
                          className="h-2 rounded-full bg-[var(--brand-gold)]"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ink-900)]">
                          {course.topicCount
                            ? `${course.topicCount} topics`
                            : course.lessonCount
                              ? `${course.lessonCount} lessons`
                              : "Continue"}
                        </span>
                        <Link
                          href={`/dashboard/courses/${course._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-gold)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--brand-gold-600)]"
                        >
                          <Play className="size-3 fill-current" />
                          Continue
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {popularCourses.length > 0 && resumptionCards.length === 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[var(--ink-900)]">Popular courses</h2>
            <Link href="/dashboard/courses" className="text-sm font-bold text-[var(--ink-900)] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popularCourses.slice(0, 3).map((course) => (
              <Link key={course._id} href={`/dashboard/courses/${course._id}`}>
                <article className="h-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 shadow-sm transition hover:shadow-md">
                  <h3 className="line-clamp-1 font-bold text-[var(--ink-900)]">{course.title}</h3>
                  <p className="text-xs text-[var(--ink-500)]">{course.category}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-500)]">{course.description}</p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-12 gap-6 pb-6">
        <div className="col-span-12 flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-sm lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--ink-900)]">Today&apos;s study goal</h3>
              <p className="text-xs text-[var(--ink-500)]">
                {stats?.dailyGoal
                  ? `${stats.dailyGoal.studiedMinutes} of ${stats.dailyGoal.minutes} minutes`
                  : "Set a daily goal in settings"}
              </p>
            </div>
            {stats?.dailyGoal?.met && (
              <span className="rounded-full border border-[var(--success)]/20 bg-[var(--success-100)] px-2.5 py-1 text-xs font-bold text-[var(--success)]">
                Goal met
              </span>
            )}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
            <div
              className="h-3 rounded-full bg-[var(--brand-gold)]"
              style={{ width: `${Math.min(100, dailyGoalPct)}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-xs font-semibold text-[var(--ink-500)]">
            <span>{stats?.totalSessions ?? 0} study sessions recorded</span>
            <Link href="/dashboard/progress" className="font-bold text-[var(--brand-gold-600)] hover:underline">
              View progress
            </Link>
          </div>
        </div>

        <div className="col-span-12 flex flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-sm lg:col-span-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--brand-gold-100)] text-[var(--brand-gold-600)]">
                <Trophy className="size-4" />
              </div>
              <div>
                <h3 className="text-base leading-tight font-bold text-[var(--ink-900)]">Weekly Leaders</h3>
                <p className="text-[11px] text-[var(--ink-500)]">Past 7 days on SabiLearn</p>
              </div>
            </div>
            <Link href="/dashboard/leaderboard" className="text-xs font-bold text-[var(--brand-gold-600)] hover:underline">
              View All
            </Link>
          </div>
          {leaders.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--ink-500)]">Leaderboard is empty this week.</p>
          ) : (
            <div className="my-2 divide-y divide-[var(--line)]">
              {leaders.slice(0, 3).map((entry, idx) => {
                const isYou = myId && String(entry._id) === String(myId);
                const name = entry.name || [entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Learner";
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div
                    key={entry._id}
                    className={`flex items-center justify-between py-2.5 ${isYou ? "-mx-3 rounded-xl bg-[var(--brand-gold-100)]/60 px-3" : "px-1"}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`w-5 text-center text-xs font-black ${idx === 0 ? "text-[var(--brand-gold-600)]" : "text-[var(--ink-300)]"}`}>
                        {idx + 1}
                      </span>
                      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[var(--ink-900)] text-xs font-bold text-white">
                        {entry.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.avatar} alt="" className="size-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-xs font-bold text-[var(--ink-900)]">
                          {name}
                          {isYou && (
                            <span className="rounded bg-[var(--brand-gold-dark)] px-1 text-[9px] font-black text-[var(--ink-900)]">
                              YOU
                            </span>
                          )}
                        </p>
                        {entry.currentStreak !== undefined && (
                          <p className="text-[10px] text-[var(--ink-500)]">{entry.currentStreak}-day streak</p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-extrabold text-[var(--ink-900)]">
                      {entry.periodXp.toLocaleString()} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <SummarizerDialog open={activeTool === "summarizer"} onClose={() => setActiveTool(null)} />
      <QuizGeneratorDialog open={activeTool === "quiz"} onClose={() => setActiveTool(null)} />
      <QAAIDialog open={activeTool === "qa"} onClose={() => setActiveTool(null)} />
    </div>
  );
}
