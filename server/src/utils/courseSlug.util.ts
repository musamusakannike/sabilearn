import Course from '../models/course.model';
import { slugify } from './slug.util';

/**
 * Generates a course slug from its title that is unique across all courses.
 * Appends -2, -3, ... on collision. `ignoreId` excludes the course being updated.
 */
export const generateUniqueCourseSlug = async (title: string, ignoreId?: string): Promise<string> => {
  const base = slugify(title) || 'course';
  let slug = base;
  let suffix = 1;

  while (await Course.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};
