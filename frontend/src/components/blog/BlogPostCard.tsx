import Link from 'next/link';
import Image from 'next/image';
import { Newspaper } from 'lucide-react';

/**
 * Loose post shape so this works with your existing blog type.
 * If your fields are named differently, change them in getPostMeta() below.
 */
export type PostLike = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: string | null;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function formatDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getPostMeta(post: PostLike) {
  const category = post.category ?? post.categories?.[0] ?? '';
  const image: string | undefined = post.coverImage ?? post.featuredImage ?? post.image ?? post.banner ?? post.thumbnail;
  const author: string | undefined =
    typeof post.author === 'string' ? post.author : post.author?.name ?? post.authorName;
  const readTime: string | undefined = post.readTime
    ? `${post.readTime} min read`
    : post.readingTime
      ? `${post.readingTime} min read`
      : undefined;
  return {
    category: String(category || ''),
    image,
    author,
    readTime,
    date: formatDate(post.publishedAt || post.updatedAt),
  };
}

function Meta({ post, className = '' }: { post: PostLike; className?: string }) {
  const { author, date, readTime } = getPostMeta(post);
  const parts = [author, date, readTime].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-xs text-[var(--ink-500)] ${className}`}>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden className="size-1 rounded-full bg-[var(--ink-300)]" />}
          <span className={i === 0 && author ? 'font-semibold text-[var(--ink-700)]' : ''}>{p}</span>
        </span>
      ))}
    </p>
  );
}

function Category({ value }: { value: string }) {
  if (!value) return null;
  return <span className="text-xs font-bold text-[var(--brand-gold-600)] capitalize">{value}</span>;
}

function Thumb({ src, alt, sizes }: { src?: string; alt: string; sizes: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--brand-gold-100)]">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          className="object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-[var(--brand-gold-600)]">
          <Newspaper className="size-8" />
        </div>
      )}
    </div>
  );
}

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink-900)]';

interface Props {
  post: PostLike;
  /** Legacy prop: same as variant="feature" */
  featured?: boolean;
  variant?: 'feature' | 'row' | 'compact';
}

export default function BlogPostCard({ post, featured, variant }: Props) {
  const v = variant ?? (featured ? 'feature' : 'row');
  const href = `/blog/${post.slug}`;
  const { category, image } = getPostMeta(post);

  if (v === 'feature') {
    return (
      <article>
        <Link href={href} className={`group block ${focus}`}>
          <div className="aspect-[16/9] overflow-hidden rounded-[var(--radius-2xl)]">
            <Thumb src={image} alt="" sizes="(max-width: 1024px) 100vw, 66vw" />
          </div>
          <div className="mt-5">
            <Category value={category} />
            <h2 className="mt-2 mb-3 text-3xl leading-[var(--leading-tight)] font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)] decoration-[var(--brand-gold)] decoration-4 underline-offset-4 group-hover:underline sm:text-4xl lg:text-[2.75rem]">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mb-4 line-clamp-3 max-w-2xl text-base leading-[var(--leading-relaxed)] text-[var(--text-muted)] sm:text-lg">
                {post.excerpt}
              </p>
            )}
            <Meta post={post} />
          </div>
        </Link>
      </article>
    );
  }

  if (v === 'compact') {
    return (
      <article className="border-b border-[var(--line)] py-4 first:pt-0 last:border-b-0 last:pb-0">
        <Link href={href} className={`group block ${focus}`}>
          <Category value={category} />
          <h3 className="mt-1 mb-1.5 text-base leading-[var(--leading-snug)] font-[var(--font-display)] font-bold text-[var(--ink-900)] group-hover:underline">
            {post.title}
          </h3>
          <Meta post={post} />
        </Link>
      </article>
    );
  }

  // row
  return (
    <article className="border-b border-[var(--line)] py-6 first:pt-0">
      <Link href={href} className={`group flex flex-col-reverse gap-4 sm:flex-row sm:gap-6 ${focus}`}>
        <div className="min-w-0 flex-1">
          <Category value={category} />
          <h3 className="mt-1.5 mb-2 text-xl leading-[var(--leading-snug)] font-[var(--font-display)] font-bold text-[var(--ink-900)] decoration-[var(--brand-gold)] decoration-[3px] underline-offset-4 group-hover:underline sm:text-2xl">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mb-3 line-clamp-2 text-sm leading-[var(--leading-relaxed)] text-[var(--text-muted)] sm:text-base">
              {post.excerpt}
            </p>
          )}
          <Meta post={post} />
        </div>
        <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[var(--radius-xl,1rem)] sm:aspect-[4/3] sm:w-52 lg:w-60">
          <Thumb src={image} alt="" sizes="(max-width: 640px) 100vw, 240px" />
        </div>
      </Link>
    </article>
  );
}