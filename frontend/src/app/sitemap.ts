import type { MetadataRoute } from 'next';
import { fetchBlogPosts, SITE_URL } from '@/lib/blog-server';
import { fetchPublicCourses } from '@/lib/course-server';

// Bump manually when a static page's content meaningfully changes — not on every build.
const STATIC_CONTENT_UPDATED_AT = new Date('2026-08-09');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/courses`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/delete-account`, lastModified: STATIC_CONTENT_UPDATED_AT, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const { data: posts } = await fetchBlogPosts({ limit: 200 });

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const { data: courses } = await fetchPublicCourses({ limit: 100 });

  const courseRoutes: MetadataRoute.Sitemap = courses
    .filter((course) => course.slug)
    .map((course) => ({
      url: `${SITE_URL}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...courseRoutes, ...postRoutes];
}
