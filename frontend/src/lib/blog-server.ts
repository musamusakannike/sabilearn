import { blogApi } from './api';
import { BlogPost, PaginatedResponse } from './types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sabilearn.online').replace(/\/+$/, '');

export async function fetchBlogPosts(params: Record<string, unknown>): Promise<PaginatedResponse<BlogPost>> {
  try {
    const res = await blogApi.list(params);
    return res.data as PaginatedResponse<BlogPost>;
  } catch {
    return { success: false, data: [], pagination: { page: 1, limit: 9, total: 0, pages: 0 } };
  }
}

export async function fetchBlogCategories(): Promise<string[]> {
  try {
    const res = await blogApi.categories();
    return res.data.data as string[];
  } catch {
    return [];
  }
}

export interface BlogPostDetail {
  post: BlogPost;
  related: BlogPost[];
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  try {
    const res = await blogApi.bySlug(slug);
    return { post: res.data.data as BlogPost, related: (res.data.related || []) as BlogPost[] };
  } catch {
    return null;
  }
}
