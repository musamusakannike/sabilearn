import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Clock, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { fetchBlogPostBySlug, SITE_URL } from '@/lib/blog-server';

const navLinks = [
  { label: 'Courses', href: '/courses' },
  { label: 'Blog', href: '/blog' },
  { label: 'AI tools', href: '/#ai-tools' },
];

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchBlogPostBySlug(slug);

  if (!result) {
    return { title: 'Post not found — SabiLearn Blog' };
  }

  const { post } = result;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const authorName = typeof post.author === 'object' && post.author ? post.author.name : 'SabiLearn';
  const ogImage = post.coverImage || '/og-image.png';

  return {
    title: `${title} — SabiLearn Blog`,
    description,
    keywords: post.tags.length > 0 ? post.tags : ['SabiLearn', 'study guide', post.category],
    authors: [{ name: authorName }],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'SabiLearn',
      locale: 'en_NG',
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: [authorName],
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@sabilearn',
      site: '@sabilearn',
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const result = await fetchBlogPostBySlug(slug);

  if (!result) {
    notFound();
  }

  const { post, related } = result;
  const author = typeof post.author === 'object' ? post.author : null;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${SITE_URL}/og-image.png`,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt,
    inLanguage: 'en-NG',
    articleSection: post.category,
    keywords: post.tags.join(', '),
    wordCount,
    author: author ? { '@type': 'Person', name: author.name } : { '@type': 'Organization', name: 'SabiLearn' },
    publisher: {
      '@type': 'Organization',
      name: 'SabiLearn',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar links={navLinks} active="Blog" />

      <article className="px-6 py-14 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[var(--ink-500)]">
            <Link href="/" className="font-semibold hover:text-[var(--ink-900)]">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="font-semibold hover:text-[var(--ink-900)]">Blog</Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-[240px] truncate text-[var(--ink-300)]">{post.title}</span>
          </nav>

          <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-500)] hover:text-[var(--ink-900)]">
            <ArrowLeft className="size-4" /> Back to blog
          </Link>

          <Badge tone="gold">{post.category}</Badge>
          <h1 className="my-4 text-3xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] sm:text-4xl">
            {post.title}
          </h1>
          <div className="mb-8 flex items-center gap-3 text-sm text-[var(--text-muted)]">
            {author?.name && <span className="font-semibold text-[var(--ink-700)]">{author.name}</span>}
            <span>{formatDate(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{post.readingTimeMinutes} min read</span>
          </div>

          {post.coverImage && (
            <div className="relative mb-10 h-[280px] w-full overflow-hidden rounded-[var(--radius-2xl)] shadow-[var(--shadow-md)] sm:h-[440px]">
              <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            </div>
          )}

          <div className="blog-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                img: ({ alt, ...props }) => (
                  // eslint-disable-next-line @next/next/no-img-element -- author-uploaded, dimensions unknown ahead of time
                  <img {...props} alt={alt || ''} loading="lazy" decoding="async" />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-[var(--line)] pt-8">
              {post.tags.map((tag) => (
                <Badge key={tag} tone="neutral">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[var(--line)] bg-[var(--surface-card)] px-6 py-16 sm:px-8">
          <div className="mx-auto max-w-[var(--container-max)]">
            <h2 className="mb-8 text-2xl font-[var(--font-display)] font-bold text-[var(--ink-900)]">More like this</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((p) => (
                <BlogPostCard key={p._id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
