import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import EmptyState from '@/components/ui/EmptyState';
import PublicCourseCard from '@/components/courses/PublicCourseCard';
import { fetchPublicCourses } from '@/lib/course-server';
import { SITE_URL } from '@/lib/blog-server';

export const revalidate = 300;

const navLinks = [
  { label: 'Courses', href: '/courses' },
  { label: 'Blog', href: '/blog' },
  { label: 'AI tools', href: '/#ai-tools' },
];

export const metadata: Metadata = {
  title: 'Courses — Learn Tech Skills Online',
  description:
    'Browse SabiLearn courses in web development, backend, mobile, AI, blockchain and more. Structured lessons, interactive exercises and quizzes built for Nigerian learners.',
  alternates: { canonical: `${SITE_URL}/courses` },
  openGraph: {
    title: 'SabiLearn Courses — Learn a skill. Sabi it for life.',
    description: 'Structured, project-based courses with interactive exercises and quizzes.',
    url: `${SITE_URL}/courses`,
    siteName: 'SabiLearn',
    locale: 'en_NG',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SabiLearn Courses' }],
  },
};

interface CoursesPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

const pill = (active: boolean) =>
  `rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? 'border-[var(--ink-900)] bg-[var(--ink-900)] text-white'
      : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]'
  }`;

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category = 'all', search = '' } = await searchParams;

  // Catalog is small, so fetch everything published once and filter in memory;
  // this also gives us an accurate category list (only categories that have courses).
  const { data: all } = await fetchPublicCourses({ limit: 100 });
  const categories = Array.from(new Set(all.map((c) => c.category))).sort();

  const term = search.trim().toLowerCase();
  const courses = all.filter(
    (c) =>
      (category === 'all' || c.category === category) &&
      (!term || c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term))
  );

  const href = (nextCategory: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (nextCategory !== 'all') params.set('category', nextCategory);
    const qs = params.toString();
    return qs ? `/courses?${qs}` : '/courses';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Courses', item: `${SITE_URL}/courses` },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: all
          .filter((c) => c.slug)
          .map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/courses/${c.slug}`,
            name: c.title,
          })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar links={navLinks} active="Courses" />

      <section className="border-b border-[var(--line)] bg-[var(--surface-card)] px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[var(--container-max)] text-center">
          <span className="mb-5 inline-block rounded-[var(--radius-full)] bg-[var(--brand-gold-100)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--brand-gold-600)] uppercase">
            Courses
          </span>
          <h1 className="mb-5 text-4xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-5xl">
            Learn a skill. Sabi it for life.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
            Structured lessons, hands-on projects and quizzes. Start free — no card required.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Link href={href('all')} className={pill(category === 'all')}>
                All
              </Link>
              {categories.map((c) => (
                <Link key={c} href={href(c)} className={pill(category === c)}>
                  {c}
                </Link>
              ))}
            </div>
            <form action="/courses" className="flex gap-2">
              {category !== 'all' && <input type="hidden" name="category" value={category} />}
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search courses"
                aria-label="Search courses"
                className="w-full rounded-[var(--radius-full)] border border-[var(--line)] bg-[var(--surface-card)] px-4 py-2 text-sm text-[var(--ink-900)] outline-none focus:border-[var(--ink-900)] sm:w-64"
              />
            </form>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-12" />}
              title="No courses found"
              description="Try a different search or category."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <PublicCourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
