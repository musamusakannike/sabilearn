import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Search,
  Sparkles,
  X,
  ClipboardCheck,
  Award,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import EmptyState from "@/components/ui/EmptyState";
import PublicCourseCard from "@/components/courses/PublicCourseCard";
import { fetchPublicCourses } from "@/lib/course-server";
import { SITE_URL } from "@/lib/blog-server";
import Image from "next/image";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Courses — Learn Tech Skills Online",
  description:
    "Browse SabiLearn courses in web development, backend, mobile, AI, blockchain and more. Structured lessons, interactive exercises and quizzes built for Nigerian learners.",
  alternates: { canonical: `${SITE_URL}/courses` },
  openGraph: {
    title: "SabiLearn Courses — Learn a skill. Sabi it for life.",
    description:
      "Structured, project-based courses with interactive exercises and quizzes.",
    url: `${SITE_URL}/courses`,
    siteName: "SabiLearn",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SabiLearn Courses",
      },
    ],
  },
};

interface CoursesPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

const GOLD = "var(--brand-gold-500,#F9B233)";

const pill = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink-900)] ${
    active
      ? "border-transparent bg-[var(--brand-gold-500,#F9B233)] text-[var(--ink-900)]"
      : "border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]"
  }`;

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category = "all", search = "" } = await searchParams;

  // Catalog is small, so fetch everything published once and filter in memory;
  // this also gives us an accurate category list (only categories that have courses).
  const { data: all } = await fetchPublicCourses({ limit: 100 });
  const categories = Array.from(new Set(all.map((c) => c.category))).sort();
  const countFor = (cat: string) =>
    all.filter((c) => c.category === cat).length;
  const freeCount = all.filter((c) => c.isFree).length;

  const term = search.trim().toLowerCase();
  const courses = all.filter(
    (c) =>
      (category === "all" || c.category === category) &&
      (!term ||
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)),
  );
  const isFiltered = category !== "all" || term !== "";

  const href = (nextCategory: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (nextCategory !== "all") params.set("category", nextCategory);
    const qs = params.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Courses",
            item: `${SITE_URL}/courses`,
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: all
          .filter((c) => c.slug)
          .map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/courses/${c.slug}`,
            name: c.title,
          })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar active="Courses" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-12 pb-14 sm:px-8 sm:pt-16 sm:pb-20 lg:pb-24">
        <div className="relative mx-auto flex  max-w-[var(--container-max)] items-center gap-12">
          <div>
            <h1 className="mb-5 max-w-xl text-4xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-5xl lg:text-6xl">
              Learn a skill. Sabi it for life.
            </h1>
            <p className="mb-8 max-w-lg text-base leading-[var(--leading-relaxed)] text-[var(--text-muted)] sm:text-lg">
              Structured lessons, hands-on projects and quizzes. Start free, no
              card required.
            </p>

            <form
              action="/courses"
              role="search"
              className="flex max-w-lg items-center gap-2 rounded-[var(--radius-full)] border border-[var(--line)] bg-[var(--surface-card)] p-1.5 shadow-[var(--shadow-sm)] focus-within:border-[var(--ink-900)]"
            >
              {category !== "all" && (
                <input type="hidden" name="category" value={category} />
              )}
              <Search
                className="ml-3 size-5 shrink-0 text-[var(--ink-500)]"
                aria-hidden
              />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search React, Python, AI..."
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[var(--radius-full)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-900)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink-900)]"
                style={{ background: GOLD }}
              >
                Search
              </button>
            </form>
          </div>
          <div className="relative flex items-center justify-center lg:col-span-6 xl:col-span-7">
            <div className="relative w-full max-w-[680px]">
              <Image
                src="/images/hero.webp"
                alt="SabiLearn dashboard with courses, student learning badge and progress tracking"
                width={780}
                height={580}
                priority
                fetchPriority="high"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 680px"
                className="h-auto w-full object-contain drop-shadow-sm select-none"
              />
            </div>
          </div>{" "}
        </div>
      </section>

      {/* Catalog */}
      <section className="border-t border-[var(--line)] bg-[var(--surface-card)] px-6 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-[var(--container-max)]">
          {/* Category pills: single scrolling row on mobile, wrapping on larger screens */}
          <nav aria-label="Course categories" className="-mx-6 mb-6 sm:mx-0">
            <div className="flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              <Link
                href={href("all")}
                className={pill(category === "all")}
                aria-current={category === "all" ? "page" : undefined}
              >
                All
                <span className="text-xs opacity-70">{all.length}</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={href(c)}
                  className={pill(category === c)}
                  aria-current={category === c ? "page" : undefined}
                >
                  {c}
                  <span className="text-xs opacity-70">{countFor(c)}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-3xl">
              {category === "all" ? "All courses" : category}
            </h2>
            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <span>
                {courses.length} {courses.length === 1 ? "result" : "results"}
                {term && (
                  <>
                    {" "}
                    for{" "}
                    <span className="font-semibold text-[var(--ink-900)]">
                      &ldquo;{search.trim()}&rdquo;
                    </span>
                  </>
                )}
              </span>
              {isFiltered && (
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1 rounded-[var(--radius-full)] border border-[var(--line)] px-3 py-1 font-semibold text-[var(--ink-700)] transition-colors hover:border-[var(--ink-900)]"
                >
                  <X className="size-3.5" /> Clear
                </Link>
              )}
            </div>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-12" />}
              title="No courses found"
              description="Try a different search or pick another category."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <PublicCourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section
        className="relative overflow-hidden px-6 py-16 sm:px-8 sm:py-20"
        style={{ background: GOLD }}
      >
        <div className="relative mx-auto flex max-w-[var(--container-max)] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="mb-3 text-3xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-4xl">
              Want every course in one pass?
            </h2>
            <p className="text-base leading-[var(--leading-relaxed)] text-[var(--ink-900)]/80">
              The All-Access Pass unlocks every course, the AI study assistant
              and verified certificates.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--ink-900)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink-900)]"
            >
              <Sparkles className="size-4" /> See pricing
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border-2 border-[var(--ink-900)] px-6 py-3 text-sm font-semibold text-[var(--ink-900)] transition-colors hover:bg-[var(--ink-900)] hover:text-white"
            >
              <BookOpen className="size-4" /> Read the blog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
