import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, Newspaper } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import EmptyState from '@/components/ui/EmptyState';
import BlogPostCard from '@/components/blog/BlogPostCard';
import BlogSearchBar from '@/components/blog/BlogSearchBar';
import { fetchBlogPosts, fetchBlogCategories, SITE_URL } from '@/lib/blog-server';

export const metadata: Metadata = {
  title: 'Blog — Study Guides, Learning Science & Tech Tutorials',
  description:
    'Practical study guides, learning techniques, and tech tutorials designed for Nigerian learners to study faster and sabi skills for life.',
  keywords: [
    'study techniques Nigeria',
    'learning science',
    'SabiLearn blog',
    'tech tutorials Nigeria',
    'study guides',
    'exam preparation Nigeria',
    'how to study smarter',
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'The SabiLearn Blog — Study Smarter, Learn Faster',
    description:
      'Practical study guides, learning science, and how-tos to help you learn faster and sabi it for life.',
    url: `${SITE_URL}/blog`,
    siteName: 'SabiLearn',
    locale: 'en_NG',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'The SabiLearn Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The SabiLearn Blog — Study Smarter, Learn Faster',
    description:
      'Practical study guides, learning science, and how-tos to help you learn faster and sabi it for life.',
    images: ['/og-image.png'],
  },
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

const tab = (active: boolean) =>
  `relative shrink-0 whitespace-nowrap border-b-[3px] px-1 py-3.5 text-sm font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ink-900)] ${
    active
      ? 'border-[var(--brand-gold)] text-[var(--ink-900)]'
      : 'border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]'
  }`;

const pageBtn = (active: boolean) =>
  `flex size-10 items-center justify-center rounded-[var(--radius-full)] border text-sm font-semibold transition-colors ${
    active
      ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--ink-900)]'
      : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]'
  }`;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam, category = 'all', search = '' } = await searchParams;
  const page = parseInt(pageParam || '1', 10) || 1;

  const [{ data: posts, pagination }, categories] = await Promise.all([
    fetchBlogPosts({ page, limit: 9, category, search: search || undefined }),
    fetchBlogCategories(),
  ]);

  const buildHref = (nextPage: number, nextCategory?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('category', nextCategory ?? category);
    if (nextPage > 1) params.set('page', String(nextPage));
    return `/blog?${params.toString()}`;
  };

  // Front-page layout only on the unfiltered first page
  const isFrontPage = page === 1 && !search && category === 'all';
  const [featured, ...rest] = posts;
  const latest = isFrontPage ? rest.slice(0, 4) : [];
  const stream = isFrontPage ? rest.slice(4) : posts;
  const trending = posts.slice(0, 5);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        ],
      },
      {
        '@type': 'Blog',
        name: 'The SabiLearn Blog',
        url: `${SITE_URL}/blog`,
        description:
          'Practical study guides, learning science, and how-tos to help you learn faster and sabi it for life.',
        blogPost: posts.map((post) => ({
          '@type': 'BlogPosting',
          headline: post.title,
          url: `${SITE_URL}/blog/${post.slug}`,
          datePublished: post.publishedAt || undefined,
          dateModified: post.updatedAt,
          description: post.excerpt,
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar active="Blog" />

      {/* Masthead */}
      <header className="px-6 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-4xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-5xl">
                Study smarter, learn faster
              </h1>
              <p className="max-w-xl text-base leading-[var(--leading-relaxed)] text-[var(--text-muted)] sm:text-lg">
                Guides on learning science, study techniques and building real skills, written for Nigerian learners.
              </p>
            </div>
            <div className="w-full md:max-w-sm">
              <BlogSearchBar initialValue={search} />
            </div>
          </div>

          {/* Category strip */}
          <nav
            aria-label="Blog categories"
            className="-mx-6 mt-8 border-t-4 border-[var(--ink-900)] border-b border-b-[var(--line)] sm:mx-0"
          >
            <div className="flex gap-6 overflow-x-auto px-6 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Link href={buildHref(1, 'all')} className={tab(category === 'all')} aria-current={category === 'all' ? 'page' : undefined}>
                Latest
              </Link>
              {categories.map((c) => (
                <Link key={c} href={buildHref(1, c)} className={tab(category === c)} aria-current={category === c ? 'page' : undefined}>
                  {c}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="px-6 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-[var(--container-max)]">
          {search && (
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              Results for{' '}
              <span className="font-semibold text-[var(--ink-900)]">&ldquo;{search}&rdquo;</span>{' '}
              <Link href="/blog" className="font-semibold text-[var(--ink-900)] underline underline-offset-4">
                Clear
              </Link>
            </p>
          )}

          {posts.length === 0 ? (
            <EmptyState
              icon={<Newspaper className="size-12" />}
              title="No articles found"
              description="Try a different search or check back soon for new posts."
            />
          ) : (
            <div className="grid gap-12 lg:grid-cols-12">
              {/* Main column */}
              <div className="lg:col-span-8">
                {isFrontPage && featured && (
                  <div className="mb-10 grid gap-10 border-b border-[var(--line)] pb-10 xl:grid-cols-1">
                    <BlogPostCard post={featured} variant="feature" />
                    {latest.length > 0 && (
                      <div className="grid gap-x-8 sm:grid-cols-2">
                        {latest.map((post) => (
                          <BlogPostCard key={post._id} post={post} variant="compact" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {stream.length > 0 && (
                  <section aria-label="More stories">
                    {isFrontPage && (
                      <h2 className="mb-6 text-xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                        More stories
                      </h2>
                    )}
                    <div className="flex flex-col">
                      {stream.map((post) => (
                        <BlogPostCard key={post._id} post={post} variant="row" />
                      ))}
                    </div>
                  </section>
                )}

                {pagination.pages > 1 && (
                  <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    {page > 1 && (
                      <Link href={buildHref(page - 1)} aria-label="Previous page" className={pageBtn(false)}>
                        <ArrowLeft className="size-4" />
                      </Link>
                    )}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                      <Link key={p} href={buildHref(p)} aria-current={p === page ? 'page' : undefined} className={pageBtn(p === page)}>
                        {p}
                      </Link>
                    ))}
                    {page < pagination.pages && (
                      <Link href={buildHref(page + 1)} aria-label="Next page" className={pageBtn(false)}>
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </nav>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="flex flex-col gap-8 lg:sticky lg:top-24">
                  <section aria-labelledby="trending" className="border-t-4 border-[var(--ink-900)] pt-4">
                    <h2 id="trending" className="mb-4 text-lg font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                      Trending
                    </h2>
                    <ol className="flex flex-col">
                      {trending.map((post, i) => (
                        <li key={post._id} className="border-b border-[var(--line)] last:border-b-0">
                          <Link href={`/blog/${post.slug}`} className="group flex gap-4 py-3.5">
                            <span className="w-6 shrink-0 text-2xl leading-none font-[var(--font-display)] font-bold text-[var(--brand-gold)]">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-[var(--leading-snug)] font-semibold text-[var(--ink-900)] group-hover:underline">
                              {post.title}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--brand-gold)] p-6">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-[48%_52%_55%_45%/50%_45%_55%_50%] bg-white/30"
                    />
                    <GraduationCap className="relative mb-3 size-8 text-[var(--ink-900)]" />
                    <h2 className="relative mb-2 text-xl leading-[var(--leading-snug)] font-[var(--font-display)] font-bold text-[var(--ink-900)]">
                      Ready to put it into practice?
                    </h2>
                    <p className="relative mb-5 text-sm leading-[var(--leading-relaxed)] text-[var(--ink-900)]/80">
                      Take a structured course with interactive exercises and quizzes. Start free.
                    </p>
                    <Link
                      href="/courses"
                      className="relative inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--ink-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Browse courses <ArrowRight className="size-4" />
                    </Link>
                  </section>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}