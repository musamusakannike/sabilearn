"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { courseApi, leaderboardApi, progressApi } from "@/lib/api";
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

const SAMPLE_COURSES = [
  {
    _id: "sample-backend",
    title: "Backend Development for Beginners: Node.js, Express & MongoDB",
    category: "Backend Development",
    xp: 1300,
    difficulty: "Beginner",
    banner:
      "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1791638471848-backend.webp",
    description:
      "Master backend development from scratch. Build real REST APIs, handle auth, and connect Mongo databases.",
    chapterTitle: "Chapter 1: Node Architecture",
    pct: 35,
    lessonsCount: "278 Lessons",
  },
  {
    _id: "sample-prompt",
    title: "Prompt Engineering Essentials: ChatGPT & DeepSeek",
    category: "Artificial Intelligence",
    xp: 950,
    difficulty: "Free",
    banner:
      "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1789774755336-prompt-eng.webp",
    description:
      "Learn how to talk to modern AI tools like ChatGPT, Claude, and DeepSeek to get fast, accurate answers.",
    chapterTitle: "Chapter 4: Few-Shot Prompting",
    pct: 60,
    lessonsCount: "42 Lessons",
  },
  {
    _id: "sample-blockchain",
    title: "Blockchain & Cryptocurrency for Beginners",
    category: "Web3 & Blockchain",
    xp: 1100,
    difficulty: "Beginner",
    banner:
      "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1789774964508-blockchain.webp",
    description:
      "Master blockchain fundamentals, smart contract design, consensus algorithms, and decentralized tokenomics.",
    chapterTitle: "Chapter 1: Cryptographic Hashes",
    pct: 15,
    lessonsCount: "88 Lessons",
  },
];

const WEEK_DAYS = [
  { day: "Mon", height: "66%", isMax: false },
  { day: "Tue", height: "80%", isMax: false },
  { day: "Wed", height: "50%", isMax: false },
  { day: "Thu", height: "100%", isMax: true },
  { day: "Fri", height: "60%", isMax: false },
  { day: "Sat", height: "25%", isMax: false },
  { day: "Sun", height: "16%", isMax: false },
];

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
  const firstName =
    user?.firstName?.trim() || user?.name?.split(" ")[0] || "Musa";
  const hour = new Date().getHours();
  const streak = dashboard?.streak ?? user?.currentStreak ?? 0;
  const xp = dashboard?.totalXp ?? user?.totalXp ?? 1700;
  const dailyGoalPct = stats?.dailyGoal?.progress ?? 75;

  const categories = useMemo(() => {
    const set = new Set<string>();
    if (resumptionCards.length > 0) {
      resumptionCards.forEach((p) => {
        const course =
          typeof p.course === "object" ? (p.course as Course) : null;
        if (course?.category) set.add(course.category);
      });
    } else {
      set.add("Development");
      set.add("AI & Web3");
    }
    return Array.from(set);
  }, [resumptionCards]);

  const visibleCards = useMemo(() => {
    if (resumptionCards.length === 0) return [];
    if (categoryFilter === "all") return resumptionCards;
    return resumptionCards.filter((p) => {
      const course = typeof p.course === "object" ? (p.course as Course) : null;
      return course?.category === categoryFilter;
    });
  }, [resumptionCards, categoryFilter]);

  let speech = "Let’s pick up where you left off.";
  if (streak > 1) speech = `A ${streak}-day streak! Ready to keep it going?`;
  else if (resumptionCards.length === 0 && !streak)
    speech = "“Let’s pick up where you left off.”";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const myId = user?.id || user?._id;

  // Render cards list: if user has active cards, render them. If not, fallback to sample reference courses.
  const displayCourses =
    visibleCards.length > 0
      ? visibleCards.map((progress) => {
          const course =
            typeof progress.course === "object"
              ? (progress.course as Course)
              : null;
          const chapter =
            typeof progress.lastChapter === "object"
              ? (progress.lastChapter as Chapter)
              : null;
          const topic =
            typeof progress.lastTopic === "object"
              ? (progress.lastTopic as Topic)
              : null;
          const pct = progress.percentCompleted || 0;
          return {
            _id: course?._id || progress._id,
            title: course?.title || "In-Progress Track",
            category: course?.category || "Development",
            xp: course?.totalObtainableXp || 1000,
            difficulty: course?.difficulty || "Beginner",
            banner:
              course?.banner ||
              "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1791638471848-backend.webp",
            description:
              course?.description ||
              "Continue your lessons and master new tech skills.",
            chapterTitle:
              chapter?.title || topic?.title || "Chapter 1: Getting Started",
            pct,
            lessonsCount: course?.topicCount
              ? `${course.topicCount} Topics`
              : course?.lessonCount
                ? `${course.lessonCount} Lessons`
                : "24 Lessons",
          };
        })
      : SAMPLE_COURSES;

  // Build Leaderboard top 3
  const topLeaders = [
    {
      rank: 1,
      name:
        leaders[0]?.name ||
        (user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "NIL"),
      isYou: true,
      streak: leaders[0]?.currentStreak ?? streak ?? 4,
      xp: leaders[0]?.periodXp ?? 650,
      avatar: leaders[0]?.avatar || user?.avatar,
      initial: "M",
      color: "bg-stone-900",
    },
    {
      rank: 2,
      name: leaders[1]?.name || "NIL",
      isYou: false,
      track: "Kotlin Track",
      streak: leaders[1]?.currentStreak ?? 3,
      xp: leaders[1]?.periodXp ?? 590,
      avatar: leaders[1]?.avatar,
      initial: "AT",
      color: "bg-emerald-600",
    },
    {
      rank: 3,
      name: leaders[2]?.name || "NIL",
      isYou: false,
      track: "Frontend Track",
      streak: leaders[2]?.currentStreak ?? 2,
      xp: leaders[2]?.periodXp ?? 510,
      avatar: leaders[2]?.avatar,
      initial: "CA",
      color: "bg-indigo-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* BEGIN: WelcomeAndQuickActionSection */}
      <section
        className="grid grid-cols-12 gap-6 items-stretch"
        data-purpose="welcome-and-quick-action"
      >
        {/* Musa Welcome Greeting Banner (60% width / lg:col-span-7) */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-md p-6 border border-stone-200/90 relative overflow-hidden flex flex-col justify-between">
          {/* Subtle background binary pattern */}
          <div className="absolute -right-12 -top-12 text-stone-100 font-mono text-7xl font-black binary-ambient pointer-events-none select-none">
            01001100
          </div>
          <div className="flex items-start gap-5 relative z-10">
            {/* Avatar Container with Mobile Reference styling */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-stone-900 border-2 border-stone-100 shadow-md flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.sabilearn.online/images/mascot/tutor-mascot.webp"
                  alt="Musa"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </div>
            </div>
            {/* Greeting speech bubble & name */}
            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase font-bold tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                {greetingForHour(hour)}
              </span>
              <h1 className="text-2xl font-black text-stone-900 mt-1 truncate">
                {firstName}
              </h1>
              {/* Speech Bubble as seen in Screenshot */}
              <div className="mt-2.5 bg-cream-100 border border-stone-200/80 rounded-2xl px-4 py-2.5 text-stone-800 text-sm font-semibold inline-flex items-center gap-2">
                <span>“{speech.replace(/^[“”"]|[“”"]$/g, "")}”</span>
              </div>
            </div>
          </div>

          {/* Learning Quick Stats Row */}
          <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
            <div className="bg-cream-100/70 rounded-xl p-3 border border-stone-200/60">
              <p className="text-[11px] font-bold text-stone-500 uppercase">
                Day Streak
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-stone-900">
                  {streak}
                </span>
                <span className="text-xs text-stone-500">Days</span>
              </div>
            </div>
            <div className="bg-cream-100/70 rounded-xl p-3 border border-stone-200/60">
              <p className="text-[11px] font-bold text-stone-500 uppercase">
                Total XP
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-purple-700">
                  {xp.toLocaleString()}
                </span>
                <span className="text-xs text-stone-500">Pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code Playground Launcher Banner (40% width / lg:col-span-5) */}
        <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 rounded-md p-6 border border-orange-200/80 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-36 h-36 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              &lt;/&gt;
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">
                Browser IDE
              </span>
              <h3 className="text-lg font-extrabold text-stone-900">
                Code Playground
              </h3>
              <p className="text-xs text-stone-700 font-medium mt-1 leading-relaxed">
                Write and run HTML, CSS, JavaScript, and Python directly inside
                your browser without installing anything.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-orange-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Node &amp; Python 3 Runtime Ready
            </div>
            <Link
              href="/dashboard/playground"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <span>Playground</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      {/* END: WelcomeAndQuickActionSection */}

      {/* BEGIN: AIStudyToolsSuiteSection */}
      <section className="space-y-4" data-purpose="ai-study-tools-suite">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-stone-900">
              AI Study Suite
            </h2>
          </div>
          <p className="text-xs font-semibold text-stone-500">
            Accelerate retention, generate tests, and transcribe summaries in
            seconds
          </p>
        </div>

        {/* 4 AI Tools Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tool 1: Summarizer */}
          <div
            onClick={() => setActiveTool("summarizer")}
            className="bg-lavender-50 hover:bg-white border border-lavender-200 rounded-md p-5 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-lavender-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L9.5 8.5L3 11L9.5 13.5L12 20L14.5 13.5L21 11L14.5 8.5L12 2ZM6.5 17.5L5 21.5L3.5 17.5L-0.5 16L3.5 14.5L5 10.5L6.5 14.5L10.5 16L6.5 17.5Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-purple-700 transition-colors">
                Summarizer
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Turn any lengthy lecture note or PDF into a crisp, readable
                summary.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Try Summarizer</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>

          {/* Tool 2: Quiz Generator */}
          <div
            onClick={() => router.push("/dashboard/ai/quiz")}
            className="bg-lavender-50 hover:bg-white border border-lavender-200 rounded-md p-5 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-lavender-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-purple-700 transition-colors">
                Quiz Generator
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Generate quick multiple-choice assessments from any topic or
                lesson.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Build Practice Test</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>

          {/* Tool 3: Generate Course */}
          <div
            onClick={() => router.push("/dashboard/ai/course-architect")}
            className="bg-lavender-50 hover:bg-white border border-lavender-200 rounded-md p-5 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-lavender-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-purple-700 transition-colors">
                Generate Course
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Turn rough notes or a one-line prompt into a complete structured
                curriculum.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Draft New Track</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>

          {/* Tool 4: Q&A AI Tutor */}
          <div
            onClick={() => setActiveTool("qa")}
            className="bg-lavender-50 hover:bg-white border border-lavender-200 rounded-md p-5 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-lavender-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-purple-700 transition-colors">
                Q&amp;A AI Tutor
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Ask any tricky coding or theory question and receive instant
                step-by-step guidance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Ask Anything</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* END: AIStudyToolsSuiteSection */}

      {/* BEGIN: RecentCoursesSection */}
      <section className="space-y-4" data-purpose="recent-in-progress-courses">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">
              In-Progress Tracks
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Continue where you left off across your enrolled topics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-400">Filter:</span>
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                categoryFilter === "all"
                  ? "bg-white border border-stone-200 text-stone-800"
                  : "bg-transparent hover:bg-white text-stone-500"
              }`}
            >
              All (
              {totalUnfinished > 0 ? totalUnfinished : displayCourses.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  categoryFilter === cat
                    ? "bg-white border border-stone-200 font-bold text-stone-800 shadow-xs"
                    : "bg-transparent hover:bg-white font-semibold text-stone-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCourses.map((course) => (
            <article
              key={course._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
            >
              {/* Visual Card Header */}
              <div className="relative h-36 w-full overflow-hidden rounded-t-lg border-b border-stone-150">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.banner}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs ${
                      course.difficulty?.toLowerCase() === "free"
                        ? "bg-orange-100 text-orange-800"
                        : course.difficulty?.toLowerCase() === "intermediate"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {course.difficulty}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                      {course.category}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      +{course.xp} XP
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                {/* Progress and Action Bar */}
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <div className="flex justify-between text-xs font-bold text-stone-600 mb-1.5">
                    <span className="truncate pr-2">{course.chapterTitle}</span>
                    <span className="text-orange-600 shrink-0">
                      {course.pct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${course.pct}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">
                      {course.lessonsCount}
                    </span>
                    <Link
                      href={
                        course._id.startsWith("sample-")
                          ? "/dashboard/courses"
                          : `/dashboard/courses/${course._id}`
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Continue Lesson
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {/* END: RecentCoursesSection */}

      {/* BEGIN: SecondaryActivityAndLeaderboardRow */}
      <section
        className="grid grid-cols-12 gap-6 pb-6"
        data-purpose="secondary-analytics-row"
      >
        {/* Leaderboard Spotlight (5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-md p-6 border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900 leading-tight">
                  Weekly Leaders
                </h3>
                <p className="text-[11px] text-stone-500">
                  Global SabiLearn Sprint
                </p>
              </div>
            </div>
            <Link
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
              href="/dashboard/leaderboard"
            >
              View All
            </Link>
          </div>

          {/* List of Top Learners */}
          <div className="divide-y divide-stone-100 my-2">
            {topLeaders.map((leader) => (
              <div
                key={leader.rank}
                className={`py-2.5 flex items-center justify-between ${
                  leader.isYou ? "bg-amber-50/60 -mx-3 px-3 rounded-xl" : "px-1"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 text-center text-xs font-black ${
                      leader.rank === 1
                        ? "text-amber-700"
                        : "text-stone-400 font-bold"
                    }`}
                  >
                    {leader.rank}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full ${leader.color} text-white flex items-center justify-center font-bold text-xs ${
                      leader.rank === 1 ? "ring-2 ring-amber-400" : ""
                    } overflow-hidden`}
                  >
                    {leader.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={leader.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      leader.initial
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold flex items-center gap-1 ${
                        leader.isYou ? "text-stone-950" : "text-stone-800"
                      }`}
                    >
                      {leader.name}{" "}
                      {leader.isYou && (
                        <span className="text-[9px] bg-orange-600 text-white px-1 rounded font-black">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {leader.track
                        ? leader.track
                        : `Lag: ${leader.streak}-day streak`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-extrabold ${
                    leader.rank === 1 ? "text-amber-900" : "text-stone-700"
                  }`}
                >
                  {leader.xp} XP
                </span>
              </div>
            ))}
          </div>

          {/* Leaderboard Footer Notice */}
          <p className="text-[11px] text-center text-stone-400 font-medium">
            Resetting in 2 days, 14 hours
          </p>
        </div>
      </section>
      {/* END: SecondaryActivityAndLeaderboardRow */}

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
