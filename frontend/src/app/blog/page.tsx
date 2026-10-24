import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import EmptyState from '@/components/ui/EmptyState';
import BlogPostCard from '@/components/blog/BlogPostCard';
import BlogSearchBar from '@/components/blog/BlogSearchBar';
import { fetchBlogPosts, fetchBlogCategories, SITE_URL } from '@/lib/blog-server';
import { Newspaper } from 'lucide-react';

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The SabiLearn Blog',
      },
    ],
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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam, category = 'all', search = '' } = await searchParams;
  const page = parseInt(pageParam || '1', 10) || 1;

  const [{ data: posts, pagination }, categories] = await Promise.all([
    fetchBlogPosts({ page, limit: 9, category, search: search || undefined }),
    fetchBlogCategories(),
  ]);

  const [featured, ...rest] = posts;
  const buildHref = (nextPage: number, nextCategory?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('category', nextCategory ?? category);
    if (nextPage > 1) params.set('page', String(nextPage));
    return `/blog?${params.toString()}`;
  };

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

      <section className="border-b border-[var(--line)] bg-[var(--surface-card)] px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[var(--container-max)] text-center">
          <span className="mb-5 inline-block rounded-[var(--radius-full)] bg-[var(--brand-gold-100)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--brand-gold-600)] uppercase">
            The SabiLearn blog
          </span>
          <h1 className="mb-5 text-4xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-5xl">
            Study smarter, learn faster
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
            Practical guides on learning science, study techniques, and building real skills — written for Nigerian learners.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <BlogSearchBar initialValue={search} />
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildHref(1, 'all')}
                className={`rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition-colors ${category === 'all' ? 'border-[var(--ink-900)] bg-[var(--ink-900)] text-white' : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]'}`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={buildHref(1, c)}
                  className={`rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold capitalize transition-colors ${category === c ? 'border-[var(--ink-900)] bg-[var(--ink-900)] text-white' : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]'}`}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {posts.length === 0 ? (
            <EmptyState icon={<Newspaper className="size-12" />} title="No articles found" description="Try a different search or check back soon for new posts." />
          ) : (
            <div className="flex flex-col gap-8">
              {featured && page === 1 && !search && category === 'all' && <BlogPostCard post={featured} featured />}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(page === 1 && !search && category === 'all' ? rest : posts).map((post) => (
                  <BlogPostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(p)}
                  className={`flex size-10 items-center justify-center rounded-[var(--radius-md)] border text-sm font-semibold transition-colors ${p === page ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--ink-900)]' : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-700)] hover:border-[var(--ink-900)]'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
