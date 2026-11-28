import {
  getCourseTopicById,
  getPublicQuizCourse,
} from '@/data/public-quizzes/registry';
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
  params: Promise<{ courseSlug: string; topicId: string }>;
}) {
  const { courseSlug, topicId } = await params;
  const course = getPublicQuizCourse(courseSlug);
  const topic = course ? getCourseTopicById(course, topicId) : undefined;
  const subtitle =
    topicId === 'all'
      ? 'Full Course Practice'
      : topicId === 'random'
        ? 'Random Mix Challenge'
        : topicId === 'custom'
          ? 'Custom Filtered Quiz'
          : topic?.title;

  return renderPublicQuizOgImage(course, subtitle);
}
