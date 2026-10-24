import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';
import CourseCta from '@/components/courses/CourseCta';
import { fetchCourseBySlug, fetchCourseSlugById } from '@/lib/course-server';
import { SITE_URL } from '@/lib/blog-server';
import { formatKobo } from '@/lib/money';

export const revalidate = 300;

const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value);

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = isMongoId(slug) ? null : await fetchCourseBySlug(slug);

  if (!course) return { title: 'Course not found' };

  const url = `${SITE_URL}/courses/${course.slug}`;
  const ogImage = course.banner || '/og-image.png';

  return {
    title: course.isFree ? `${course.title} — Free Course` : `${course.title} — Course`,
    description: course.description,
    keywords: [course.title, course.category, 'SabiLearn', 'online course Nigeria'],
    alternates: { canonical: url },
    openGraph: {
      title: course.title,
      description: course.description,
      url,
      siteName: 'SabiLearn',
      locale: 'en_NG',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: course.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.description,
      images: [ogImage],
    },
  };
}

export default async function PublicCoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  // Legacy ID URLs (e.g. old blog links) permanently redirect to the slug URL.
  if (isMongoId(slug)) {
    const resolved = await fetchCourseSlugById(slug);
    if (resolved) permanentRedirect(`/courses/${resolved}`);
    notFound();
  }

  const course = await fetchCourseBySlug(slug);
  if (!course || !course.slug) notFound();

  const url = `${SITE_URL}/courses/${course.slug}`;
  const chapters = course.chapters ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Courses', item: `${SITE_URL}/courses` },
          { '@type': 'ListItem', position: 3, name: course.title, item: url },
        ],
      },
      {
        '@type': 'Course',
        name: course.title,
        description: course.description,
        url,
        provider: { '@type': 'Organization', name: 'SabiLearn', sameAs: SITE_URL },
        educationalLevel: course.difficulty,
        isAccessibleForFree: course.isFree,
        inLanguage: 'en',
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
        offers: {
          '@type': 'Offer',
          category: course.isFree ? 'Free' : 'Paid',
          price: course.isFree ? 0 : course.price / 100,
          priceCurrency: 'NGN',
          url,
        },
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar active="Courses" />

      <main className="flex-1 px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-[var(--container-max)]">
          <Link
            href="/courses"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ArrowLeft className="size-4" /> All courses
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone="gold">{course.category}</Badge>
                <Badge tone="neutral">{course.difficulty}</Badge>
                <Badge tone={course.isFree ? 'success' : 'dark'}>{course.isFree ? 'Free' : 'Premium'}</Badge>
              </div>

              <h1 className="mb-4 text-3xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-4xl">
                {course.title}
              </h1>
              <p className="mb-6 text-lg leading-[var(--leading-relaxed)] text-[var(--text-muted)]">{course.description}</p>

              {course.banner && (
                <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--surface-sunken)]">
                  <Image src={course.banner} alt={course.title} fill unoptimized priority className="object-cover" />
                </div>
              )}

              <dl className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Chapters', value: chapters.length },
                  { label: 'Topics', value: course.topicCount ?? 0 },
                  { label: 'Lessons', value: course.lessonCount ?? 0 },
                  { label: 'Total XP', value: course.totalObtainableXp ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-sm)]">
                    <dd className="text-2xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">{s.value}</dd>
                    <dt className="text-xs font-medium text-[var(--ink-500)]">{s.label}</dt>
                  </div>
                ))}
              </dl>

              {course.longDescription && (
                <section className="mb-10">
                  <h2 className="mb-3 text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">About this course</h2>
                  <p className="leading-[var(--leading-relaxed)] whitespace-pre-line text-[var(--text-muted)]">{course.longDescription}</p>
                </section>
              )}

              {course.whatYouWillLearn?.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                    <Sparkles className="size-5 text-[var(--brand-gold-600)]" /> What you&apos;ll learn
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {course.whatYouWillLearn.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-[var(--ink-700)]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {course.prerequisites && course.prerequisites.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-3 text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">Prerequisites</h2>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)]">
                    {course.prerequisites.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                  <Layers className="size-5 text-[var(--brand-gold-600)]" /> Course outline
                </h2>
                <div className="flex flex-col gap-3">
                  {chapters.map((chapter, i) => (
                    <details
                      key={chapter._id}
                      open={i === 0}
                      className="group rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)]"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-[var(--ink-300)] uppercase">Chapter {i + 1}</p>
                          <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--ink-900)]">{chapter.title}</h3>
                        </div>
                        <span className="text-xs font-medium text-[var(--ink-500)]">{chapter.topics.length} topics</span>
                      </summary>
                      {chapter.description && (
                        <p className="mt-3 text-sm text-[var(--text-muted)]">{chapter.description}</p>
                      )}
                      <ul className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-4">
                        {chapter.topics.map((topic) => (
                          <li key={topic._id} className="flex items-start gap-2 text-sm text-[var(--ink-700)]">
                            <BookOpen className="mt-0.5 size-4 shrink-0 text-[var(--ink-300)]" />
                            <span>{topic.title}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[var(--radius-2xl)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-md)]">
                <p className="mb-1 text-3xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                  {course.isFree ? 'Free' : formatKobo(course.price)}
                </p>
                <p className="mb-5 text-sm text-[var(--text-muted)]">
                  {course.isFree
                    ? 'Create a free account to start learning. No card required.'
                    : 'One-time purchase. Create an account to unlock this course.'}
                </p>
                <CourseCta courseId={course._id} slug={course.slug} isFree={course.isFree} price={course.price} />
                {course.registeredUsersCount ? (
                  <p className="mt-5 text-center text-xs text-[var(--ink-500)]">
                    {course.registeredUsersCount.toLocaleString('en-NG')} learners enrolled
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
