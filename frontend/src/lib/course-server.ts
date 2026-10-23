import { courseApi } from './api';
import { Course, PaginatedResponse } from './types';

export interface PublicCourseTopic {
  _id: string;
  title: string;
  description?: string;
  order: number;
}

export interface PublicCourseChapter {
  _id: string;
  title: string;
  description?: string;
  order: number;
  topics: PublicCourseTopic[];
}

export type PublicCourse = Omit<Course, 'chapters'> & { chapters: PublicCourseChapter[] };

export async function fetchPublicCourses(params: Record<string, unknown>): Promise<PaginatedResponse<Course>> {
  try {
    const res = await courseApi.list(params);
    return res.data as PaginatedResponse<Course>;
  } catch {
    return { success: false, data: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } };
  }
}

export async function fetchCourseCategories(): Promise<string[]> {
  try {
    const res = await courseApi.categories();
    const data = res.data.data as Array<string | { name: string }>;
    return data.map((c) => (typeof c === 'string' ? c : c.name));
  } catch {
    return [];
  }
}

export async function fetchCourseBySlug(slug: string): Promise<PublicCourse | null> {
  try {
    const res = await courseApi.bySlug(slug);
    return res.data.data as PublicCourse;
  } catch {
    return null;
  }
}

/** Resolves a legacy Mongo ID URL to its course slug (null if unknown/unpublished). */
export async function fetchCourseSlugById(id: string): Promise<string | null> {
  try {
    const res = await courseApi.get(id);
    const course = res.data.data as Course;
    return course.isPublished && course.slug ? course.slug : null;
  } catch {
    return null;
  }
}
