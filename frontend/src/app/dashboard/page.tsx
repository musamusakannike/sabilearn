"use client";

import React, { useEffect, useState } from "react";
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
  Flame,
  Zap,
  Target,
  Code2,
  BookOpen,
} from "lucide-react";
import { courseApi, progressApi } from "@/lib/api";
import {
  Course,
  Chapter,
  Topic,
  UserProgress,
  ResumptionData,
  DashboardData,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";
import ProgressBar from "@/components/ui/ProgressBar";
import Card from "@/components/ui/Card";
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
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [expandedAuthors, setExpandedAuthors] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    (async () => {
      try {
        const [resumptionRes, dashboardRes, popularRes] = await Promise.all([
          progressApi.dashboardResumption(),
          progressApi.dashboard(),
          courseApi.popular().catch(() => null),
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

  const toggleExpandAuthors = (courseId: string) => {
    setExpandedAuthors((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { resumptionCards, totalUnfinished } = resumptionData;
  const firstName = user?.firstName?.trim();
  const hour = new Date().getHours();
  const streak = dashboard?.streak ?? user?.currentStreak ?? 0;
  const xp = dashboard?.totalXp ?? user?.totalXp ?? 0;
  const accuracy = dashboard?.quickStats?.avgAccuracy ?? 0;

  let speech = "What do you want to learn today?";
  if (streak > 1) speech = `A ${streak}-day streak! Ready to keep it going?`;
  else if (resumptionCards.length > 0)
    speech = "Let's pick up where you left off.";

  const aiTools: {
    kind: ActiveTool;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      kind: "summarizer",
      title: "Summarizer",
      description: "Turn any lecture note into a short summary",
      icon: <FileText className="size-5 text-[#5B4FE8]" />,
    },
    {
      kind: "quiz",
      title: "Quiz generator",
      description: "Generate a quick multiple-choice quiz",
      icon: <FileQuestion className="size-5 text-[#5B4FE8]" />,
    },
    {
      kind: "course",
      title: "Course generator",
      description: "Turn notes or a prompt into a full course",
      icon: <BookOpen className="size-5 text-[#5B4FE8]" />,
    },
    {
      kind: "qa",
      title: "Q&A AI",
      description: "Ask a question, get a direct answer",
      icon: <MessageCircleQuestion className="size-5 text-[#5B4FE8]" />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-muted)]">
          {greetingForHour(hour)}
        </p>
        <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink-900)] md:text-4xl">
          {firstName || "there"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/mascot/tutor-mascot.webp"
          alt=""
          className="size-[68px] shrink-0 object-contain"
        />
        <div className="relative flex-1">
          <div className="absolute top-1/2 -left-2 size-0 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-[#F4F4F6]" />
          <div className="rounded-2xl bg-[#F4F4F6] px-4 py-3 text-base font-medium text-[var(--ink-900)] md:text-lg">
            {speech}
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-[140px] items-center gap-2.5 rounded-2xl bg-[rgba(255,138,30,0.12)] p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,138,30,0.16)]">
            <Flame className="size-[18px] text-[#FF8A1E]" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--ink-900)]">
              {streak}
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              day streak
            </p>
          </div>
        </div>
        <div className="flex min-w-[140px] items-center gap-2.5 rounded-2xl bg-[rgba(91,79,232,0.1)] p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(91,79,232,0.12)]">
            <Zap className="size-[18px] text-[#5B4FE8]" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--ink-900)]">
              {xp}
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              XP earned
            </p>
          </div>
        </div>
        <div className="flex min-w-[140px] items-center gap-2.5 rounded-2xl bg-[rgba(16,185,129,0.12)] p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(16,185,129,0.14)]">
            <Target className="size-[18px] text-[#10B981]" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--ink-900)]">
              {Math.round(accuracy)}%
            </p>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              avg accuracy
            </p>
          </div>
        </div>
      </div>

      {/* <Link
        href="/dashboard/playground"
        className="flex items-center gap-4 rounded-2xl border border-[#FFD4A8] bg-[#FFF7EE] p-4 transition-opacity hover:opacity-95"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FF8A1E] text-[var(--ink-900)]">
          <Code2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--ink-900)]">Code Playground</p>
          <p className="text-sm text-[var(--text-muted)]">Write and run HTML, CSS, JavaScript and Python</p>
        </div>
        <span className="hidden rounded-[14px] bg-[#FF8A1E] px-3.5 py-2 text-sm font-bold text-[var(--ink-900)] sm:inline">
          Open
        </span>
      </Link> */}

      {/* <div className="relative overflow-hidden rounded-3xl border border-violet-800/30 bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 p-6 text-white shadow-xl md:p-10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-2xl leading-tight font-extrabold text-white md:text-3xl">
            Don&apos;t know where to start?
          </h2>
          <p className="text-sm leading-relaxed text-violet-100/90 md:text-base">
            Take our AI-powered skill assessment quiz to get personalized course recommendations tailored to your experience level and goals.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/ai/quiz"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-sm font-bold text-slate-950 shadow-md transition-all hover:scale-[1.02] hover:bg-amber-400"
            >
              <span>Start AI Quiz</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 -mb-16 size-64 rounded-full bg-indigo-500/20 blur-2xl" />
      </div> */}

      <div>
        <h2 className="mb-4 text-xl font-[var(--font-display)] font-bold tracking-tight text-[var(--ink-900)]">
          AI tools
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiTools.map((tool) => (
            <button
              key={tool.kind}
              type="button"
              onClick={() => {
                if (tool.kind === "quiz") {
                  router.push("/dashboard/ai/quiz");
                } else if (tool.kind === "course") {
                  router.push("/dashboard/ai/course-architect");
                } else {
                  setActiveTool(tool.kind);
                }
              }}
              className="flex min-h-[148px] flex-col items-start rounded-[20px] bg-[rgba(91,79,232,0.08)] p-4 text-left transition-opacity hover:opacity-90"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-[14px] bg-[rgba(91,79,232,0.12)]">
                {tool.icon}
              </div>
              <p className="mb-1 text-[17px] font-bold tracking-tight text-[var(--ink-900)]">
                {tool.title}
              </p>
              <p className="text-[13px] leading-[18px] text-[var(--text-muted)]">
                {tool.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">
              Continue studying
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Pick up right where you left off
            </p>
          </div>

          {totalUnfinished > 4 && (
            <Link
              href="/dashboard/progress"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ink-900)] hover:underline"
            >
              <span>See more ({totalUnfinished})</span>
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>

        {resumptionCards.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-[var(--brand-gold-600)]" />
            <h3 className="text-base font-bold text-[var(--ink-900)]">
              No active course in progress
            </h3>
            <p className="mx-auto max-w-md text-xs text-[var(--text-muted)]">
              Start a new course today and your progress will automatically
              appear here for quick resumption.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-xs font-semibold text-black transition-all hover:brightness-105"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resumptionCards.map((progress) => {
              const course =
                typeof progress.course === "object"
                  ? (progress.course as Course)
                  : null;
              if (!course || !course._id || course.isPublished === false)
                return null;

              const chapter =
                typeof progress.lastChapter === "object"
                  ? (progress.lastChapter as Chapter)
                  : null;
              const topic =
                typeof progress.lastTopic === "object"
                  ? (progress.lastTopic as Topic)
                  : null;
              const courseId = course._id;
              const isExpanded = expandedAuthors[courseId];
              const authors = course.authors || [];

              return (
                <Card
                  key={progress._id}
                  className="flex h-full flex-col justify-between gap-5 rounded-[20px] border border-[var(--line)] p-5 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mb-1 truncate text-xs text-[var(--text-muted)]">
                          {course?.category || "Course"}
                        </p>
                        <h3 className="line-clamp-1 text-lg font-bold text-[var(--ink-900)]">
                          {course?.title || "Course"}
                        </h3>
                      </div>
                      {course && <Badge tone="gold">{course.difficulty}</Badge>}
                    </div>

                    <p className="truncate text-sm text-[var(--text-muted)]">
                      {chapter ? chapter.title : "Started chapter"}
                      {topic && (
                        <span className="text-[var(--ink-700)]">
                          {" "}
                          · {topic.title}
                        </span>
                      )}
                    </p>

                    {authors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex shrink-0 -space-x-2 overflow-hidden">
                          {authors
                            .slice(0, isExpanded ? authors.length : 3)
                            .map((author, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--surface-card)] bg-[var(--brand-gold-100)] text-[10px] font-bold text-[var(--brand-gold-600)]"
                                title={author.name}
                              >
                                {author.avatar ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={author.avatar}
                                    alt={author.name}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  author.name.charAt(0).toUpperCase()
                                )}
                              </div>
                            ))}
                        </div>

                        <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-muted)]">
                          {isExpanded ? (
                            authors.map((a) => a.name).join(", ")
                          ) : (
                            <>
                              {authors[0].name}
                              {authors.length > 1 && (
                                <button
                                  onClick={() => toggleExpandAuthors(courseId)}
                                  className="ml-1 font-semibold text-[var(--brand-gold-600)] hover:underline"
                                >
                                  +{authors.length - 1} more
                                </button>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    <ProgressBar
                      value={progress.percentCompleted || 0}
                      label={`${progress.percentCompleted || 0}% complete · Page ${(progress.lastContentIndex || 0) + 1}`}
                    />
                  </div>

                  <Link
                    href={`/dashboard/courses/${courseId}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-xs transition-all hover:brightness-105"
                  >
                    <Play className="size-3.5 fill-black" />
                    <span>Continue learning</span>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {popularCourses.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">
              Popular courses
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-sm font-bold text-[var(--ink-900)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {popularCourses.slice(0, 4).map((course) => (
              <Link key={course._id} href={`/dashboard/courses/${course._id}`}>
                <Card className="h-full rounded-[20px] border border-[var(--line)] p-4 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 font-bold text-[var(--ink-900)]">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {course.category}
                      </p>
                    </div>
                    <Badge>{course.topicCount || 0} topics</Badge>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-[var(--text-muted)]">
                    {course.description}
                  </p>
                  <p className="text-sm font-bold text-[var(--ink-900)]">
                    View course
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <SummarizerDialog
        open={activeTool === "summarizer"}
        onClose={() => setActiveTool(null)}
      />
      <QuizGeneratorDialog
        open={activeTool === "quiz"}
        onClose={() => setActiveTool(null)}
      />
      <QAAIDialog
        open={activeTool === "qa"}
        onClose={() => setActiveTool(null)}
      />
    </div>
  );
}
