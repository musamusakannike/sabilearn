import { getPublicQuizCourse } from '@/data/public-quizzes/registry';
import {
  PUBLIC_QUIZ_OG_SIZE,
  renderPublicQuizOgImage,
} from '@/lib/public-quiz-og';

export const alt = 'SabiLearn Public Course Quiz';
export const size = PUBLIC_QUIZ_OG_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = getPublicQuizCourse(courseSlug);
  return renderPublicQuizOgImage(course);
}
