import bundledCoursesRaw from '../assets/offlineCourses/bundledCourses.json';
import { Chapter, Course, PaymentStatus, Topic, User } from './types';
import {
  AssessmentSavedState,
  getCachedCourseChapters,
  getCachedCourseDetail,
  getCachedPaymentStatus,
  getCachedTopicDetail,
  getCachedUserProfile,
  getLocalCourseProgress,
  LocalCourseProgressState,
  queueSession,
  saveLocalCourseProgress,
} from './offlineSync';

export interface BundledCourseEntry {
  course: Course;
  chapters: Chapter[];
  topics: Topic[];
  exportedAt: string;
}

const BUNDLE: Record<string, BundledCourseEntry> = bundledCoursesRaw as unknown as Record<
  string,
  BundledCourseEntry
>;

export const BUNDLED_COURSE_IDS = Object.keys(BUNDLE);

export function getBundledCourse(courseId: string): BundledCourseEntry | null {
  return BUNDLE[courseId] || null;
}

export function isBundledCourse(courseId: string): boolean {
  return !!BUNDLE[courseId];
}

export function getBundledCourseList(): Course[] {
  return Object.values(BUNDLE).map((entry) => entry.course);
}

/**
 * Access guard mirroring server `requireCourseAccess` in `server/src/middlewares/access.middleware.ts`
 * and `isSubscriptionActive` in `server/src/utils/subscription.util.ts`.
 */
export function checkOfflineCourseAccess(
  course: Course,
  user: User | null,
  paymentStatus: PaymentStatus | null
): boolean {
  if (user?.role === 'admin') return true;
  if (course.isFree) return true;

  const sub = paymentStatus?.subscription;
  if (sub && sub.status === 'active') {
    if (sub.billingType === 'recurring' || !sub.currentPeriodEnd) {
      return true;
    }
    const endMs = new Date(sub.currentPeriodEnd).getTime();
    if (!isNaN(endMs) && endMs > Date.now()) {
      return true;
    }
  }

  if (paymentStatus?.purchasedCourseIds?.includes(course._id)) {
    return true;
  }

  return false;
}

/**
 * Progression guard mirroring server `getChaptersByCourse` in `server/src/controllers/chapter.controller.ts`.
 */
export function computeChaptersWithStatus(
  chapters: Chapter[],
  topics: Topic[],
  localProgress: LocalCourseProgressState,
  hasAccess: boolean
): Chapter[] {
  const earnedTopicIds = new Set(localProgress.earnedTopicIds || []);
  const completedTopicIds = new Set(
    (localProgress.completedTopics || []).filter((id) => earnedTopicIds.has(id))
  );
  const passedExerciseIds = new Set(localProgress.passedExercises || []);

  let previousTopicCompleted = true;
  let previousChapterCompleted = true;

  return chapters.map((chapter, chapterIdx) => {
    const chapterTopics = topics.filter(
      (t) =>
        t.chapter?.toString() === chapter._id.toString() ||
        (chapterIdx === 0 && !t.chapter)
    );

    const isChapterUnlocked = chapterIdx === 0 ? true : previousChapterCompleted;
    let chapterCompletedCount = 0;

    const topicsWithStatus = chapterTopics.map((topic, topicIdx) => {
      const topicIdStr = topic._id.toString();
      const isCompleted = completedTopicIds.has(topicIdStr);

      let isUnlocked = false;
      if (!isChapterUnlocked || !hasAccess) {
        isUnlocked = false;
      } else if (topicIdx === 0) {
        isUnlocked = true;
      } else {
        isUnlocked = previousTopicCompleted;
      }

      if (isCompleted) {
        chapterCompletedCount++;
      }

      previousTopicCompleted = isCompleted;

      return {
        ...topic,
        isUnlocked,
        isCompleted,
        inProgress: localProgress.lastTopic?.toString() === topicIdStr,
      };
    });

    const hasCapstone = (chapter.exercise?.questions?.length || 0) > 0;
    const capstonePassed = passedExerciseIds.has(`chapter_${chapter._id.toString()}`);
    const totalRequirements = chapterTopics.length + (hasCapstone ? 1 : 0);
    const completedRequirements =
      chapterCompletedCount + (hasCapstone && capstonePassed ? 1 : 0);
    const chapterPercent =
      totalRequirements > 0
        ? Math.round((completedRequirements / totalRequirements) * 100)
        : 0;
    const isChapterCompleted =
      totalRequirements > 0 && completedRequirements === totalRequirements;

    previousChapterCompleted = isChapterCompleted;

    let status: 'completed' | 'inprogress' | 'locked' = 'locked';
    if (!isChapterUnlocked || !hasAccess) {
      status = 'locked';
    } else if (isChapterCompleted) {
      status = 'completed';
    } else {
      status = 'inprogress';
    }

    return {
      ...chapter,
      status,
      progressPercent: chapterPercent,
      isAssessmentPassed: capstonePassed,
      topics: topicsWithStatus,
    };
  });
}

/**
 * Resolves course detail from: 1) local cache, 2) static bundle.
 */
export async function getOfflineCourseDetail(courseId: string): Promise<Course | null> {
  const cached = await getCachedCourseDetail(courseId);
  if (cached) return cached;
  const bundled = getBundledCourse(courseId);
  return bundled ? bundled.course : null;
}

/**
 * Resolves chapters from: 1) local cache, 2) static bundle.
 */
export async function getOfflineChapters(courseId: string): Promise<Chapter[]> {
  const cached = await getCachedCourseChapters(courseId);
  if (cached && cached.length > 0) return cached;
  const bundled = getBundledCourse(courseId);
  return bundled ? bundled.chapters : [];
}

/**
 * Resolves topics from: 1) static bundle, 2) individual cached topics.
 */
export async function getOfflineTopics(courseId: string): Promise<Topic[]> {
  const bundled = getBundledCourse(courseId);
  if (bundled) return bundled.topics;
  return [];
}

/**
 * Resolves single topic from: 1) local topic cache, 2) static bundle.
 */
export async function getOfflineTopicById(topicId: string): Promise<Topic | null> {
  const cached = await getCachedTopicDetail(topicId);
  if (cached) return cached;

  for (const entry of Object.values(BUNDLE)) {
    const found = entry.topics.find((t) => t._id === topicId);
    if (found) return found;
  }
  return null;
}

/**
 * Completes a topic offline:
 * - Checks entitlement guard
 * - Deduplicates XP award (records in rewardedXpKeys and earnedTopicIds)
 * - Updates local course progress & percent completed
 * - Enqueues idempotent /progress/topic-complete mutation
 */
export async function completeTopicOffline(
  courseId: string,
  topicId: string,
  userId?: string | null
): Promise<{
  success: boolean;
  earnedXp: number;
  isCourseComplete: boolean;
  progress: LocalCourseProgressState;
}> {
  const course = await getOfflineCourseDetail(courseId);
  const topic = await getOfflineTopicById(topicId);
  const user = await getCachedUserProfile();
  const paymentStatus = await getCachedPaymentStatus();

  if (!course || !topic) {
    throw new Error('Course or topic not found');
  }

  const hasAccess = checkOfflineCourseAccess(course, user, paymentStatus);
  if (!hasAccess) {
    throw new Error('Access denied to this course');
  }

  const localState = await getLocalCourseProgress(courseId, userId);
  const xpKey = `topic_${topicId}`;
  let earnedXp = 0;

  if (!localState.rewardedXpKeys.includes(xpKey)) {
    earnedXp = topic.xp || 50;
    localState.rewardedXpKeys.push(xpKey);
    localState.earnedTopicIds.push(topicId);
  }

  if (!localState.completedTopics.includes(topicId)) {
    localState.completedTopics.push(topicId);
  }

  localState.lastTopic = topicId;
  if (topic.chapter) {
    localState.lastChapter = topic.chapter;
  }
  localState.lastStudiedAt = new Date().toISOString();

  const allTopics = await getOfflineTopics(courseId);
  const totalTopicsCount = allTopics.length || (course.topicCount || 0);

  if (totalTopicsCount > 0) {
    localState.percentCompleted = Math.min(
      100,
      Math.round((localState.completedTopics.length / totalTopicsCount) * 100)
    );
    if (localState.percentCompleted >= 100) {
      localState.isCompleted = true;
    }
  }

  await saveLocalCourseProgress(courseId, localState, userId);

  // Update cached user totalXp if earned
  if (earnedXp > 0 && user) {
    user.totalXp = (user.totalXp || 0) + earnedXp;
    await AsyncStorageSetUser(user);
  }

  // Queue server mutation
  await queueSession(
    '/progress/topic-complete',
    { courseId, topicId },
    { dedupeKey: `topic_complete_${courseId}_${topicId}` }
  );

  return {
    success: true,
    earnedXp,
    isCourseComplete: localState.isCompleted,
    progress: localState,
  };
}

/**
 * Submits chapter capstone or topic exercise offline:
 * - Checks entitlement guard
 * - Calculates score and pass status (>= 50%)
 * - Deduplicates question XP
 * - Enqueues /progress/exercise-submit mutation
 */
export async function submitExerciseOffline(
  payload: {
    courseId: string;
    chapterId?: string;
    topicId?: string;
    answers: { questionId: string; questionXp?: number; isCorrect: boolean }[];
    duration?: number;
  },
  userId?: string | null
): Promise<{
  success: boolean;
  scorePercent: number;
  isPassed: boolean;
  earnedXp: number;
  alreadyRewarded: boolean;
  progress: LocalCourseProgressState;
}> {
  const { courseId, chapterId, topicId, answers, duration } = payload;
  const course = await getOfflineCourseDetail(courseId);
  const user = await getCachedUserProfile();
  const paymentStatus = await getCachedPaymentStatus();

  if (!course) throw new Error('Course not found');
  const hasAccess = checkOfflineCourseAccess(course, user, paymentStatus);
  if (!hasAccess) throw new Error('Access denied to this course');

  const localState = await getLocalCourseProgress(courseId, userId);
  const exerciseKey = topicId ? `topic_${topicId}` : `chapter_${chapterId}`;
  const alreadyRewarded = localState.passedExercises.includes(exerciseKey);

  let earnedXp = 0;
  let correctCount = 0;

  for (const ans of answers) {
    if (ans.isCorrect) {
      correctCount++;
      const qKey = `exercise_question_${ans.questionId}`;
      const qXp = ans.questionXp || 20;

      if (!alreadyRewarded && !localState.rewardedXpKeys.includes(qKey)) {
        earnedXp += qXp;
        localState.rewardedXpKeys.push(qKey);
      }
    }
  }

  const scorePercent = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const isPassed = scorePercent >= 50;

  if (isPassed && !localState.passedExercises.includes(exerciseKey)) {
    localState.passedExercises.push(exerciseKey);
  }

  localState.lastStudiedAt = new Date().toISOString();
  await saveLocalCourseProgress(courseId, localState, userId);

  if (earnedXp > 0 && user) {
    user.totalXp = (user.totalXp || 0) + earnedXp;
    await AsyncStorageSetUser(user);
  }

  await queueSession(
    '/progress/exercise-submit',
    {
      courseId,
      chapterId,
      topicId,
      answers,
      duration: typeof duration === 'number' ? Math.max(0, Math.round(duration)) : 0,
    },
    { dedupeKey: `exercise_submit_${courseId}_${exerciseKey}` }
  );

  return {
    success: true,
    scorePercent,
    isPassed,
    earnedXp,
    alreadyRewarded,
    progress: localState,
  };
}

export async function saveAssessmentProgressOffline(
  chapterId: string,
  data: {
    currentIndex: number;
    userAnswers: Record<string, string>;
    checkedSteps: Record<string, boolean>;
  },
  userId?: string | null
): Promise<void> {
  const chapter = await findChapterById(chapterId);
  if (!chapter) return;
  const courseId = chapter.course.toString();
  const localState = await getLocalCourseProgress(courseId, userId);

  const state: AssessmentSavedState = {
    chapter: chapterId,
    currentIndex: data.currentIndex,
    userAnswers: data.userAnswers,
    checkedSteps: data.checkedSteps,
    updatedAt: new Date().toISOString(),
  };

  localState.assessmentProgress[chapterId] = state;
  await saveLocalCourseProgress(courseId, localState, userId);

  await queueSession(
    `/progress/assessment/${chapterId}`,
    data as unknown as Record<string, unknown>,
    {
      method: 'PUT',
      dedupeKey: `assessment_progress_${chapterId}`,
    }
  );
}

export async function clearAssessmentProgressOffline(
  chapterId: string,
  userId?: string | null
): Promise<void> {
  const chapter = await findChapterById(chapterId);
  if (!chapter) return;
  const courseId = chapter.course.toString();
  const localState = await getLocalCourseProgress(courseId, userId);
  delete localState.assessmentProgress[chapterId];
  await saveLocalCourseProgress(courseId, localState, userId);

  await queueSession(
    `/progress/assessment/${chapterId}`,
    {},
    {
      method: 'DELETE',
      cancelDedupeKey: `assessment_progress_${chapterId}`,
      dedupeKey: `clear_assessment_${chapterId}`,
    }
  );
}

export async function savePositionOffline(
  courseId: string,
  data: { chapterId?: string; topicId?: string; contentIndex: number },
  userId?: string | null
): Promise<void> {
  const localState = await getLocalCourseProgress(courseId, userId);
  if (data.chapterId) localState.lastChapter = data.chapterId;
  if (data.topicId) {
    localState.lastTopic = data.topicId;
    localState.topicPositions[data.topicId] = data.contentIndex;
  }
  localState.lastContentIndex = data.contentIndex;
  localState.lastStudiedAt = new Date().toISOString();
  await saveLocalCourseProgress(courseId, localState, userId);

  await queueSession(
    '/progress/save-position',
    { courseId, ...data },
    { dedupeKey: `save_position_${courseId}` }
  );
}

export async function saveContentPositionOffline(
  data: { course: string; topic: string; contentIndex: number },
  userId?: string | null
): Promise<void> {
  const localState = await getLocalCourseProgress(data.course, userId);
  localState.lastTopic = data.topic;
  localState.lastContentIndex = data.contentIndex;
  localState.topicPositions[data.topic] = data.contentIndex;
  localState.lastStudiedAt = new Date().toISOString();
  await saveLocalCourseProgress(data.course, localState, userId);

  await queueSession(
    '/progress/content-position',
    data,
    { dedupeKey: `content_pos_${data.course}_${data.topic}` }
  );
}

export async function getTopicProgressOffline(
  topicId: string,
  userId?: string | null
): Promise<{ lastContentIndex: number; isCompleted: boolean } | null> {
  const topic = await getOfflineTopicById(topicId);
  if (!topic) return null;
  const courseId = topic.course.toString();
  const localState = await getLocalCourseProgress(courseId, userId);

  const isCompleted = localState.completedTopics.includes(topicId);
  const savedIndex = localState.topicPositions[topicId];
  const lastContentIndex = isCompleted
    ? Math.max(0, (topic.contents?.length || 1) - 1)
    : typeof savedIndex === 'number'
    ? savedIndex
    : localState.lastTopic === topicId
    ? localState.lastContentIndex
    : 0;

  return { lastContentIndex, isCompleted };
}

export async function getAssessmentProgressOffline(
  chapterId: string,
  userId?: string | null
): Promise<AssessmentSavedState | null> {
  const chapter = await findChapterById(chapterId);
  if (!chapter) return null;
  const localState = await getLocalCourseProgress(chapter.course.toString(), userId);
  return localState.assessmentProgress[chapterId] || null;
}

export async function seedLocalProgressFromDashboard(
  continueStudying: any[],
  userId?: string | null
): Promise<void> {
  if (!Array.isArray(continueStudying)) return;
  for (const item of continueStudying) {
    const courseId = typeof item.course === 'object' ? item.course?._id : item.course;
    if (!courseId) continue;
    const local = await getLocalCourseProgress(courseId, userId);

    if (Array.isArray(item.completedTopics)) {
      item.completedTopics.forEach((tId: any) => {
        const idStr = String(tId);
        if (!local.completedTopics.includes(idStr)) local.completedTopics.push(idStr);
        if (!local.earnedTopicIds.includes(idStr)) local.earnedTopicIds.push(idStr);
      });
    }
    if (Array.isArray(item.passedExercises)) {
      item.passedExercises.forEach((eKey: any) => {
        const keyStr = String(eKey);
        if (!local.passedExercises.includes(keyStr)) local.passedExercises.push(keyStr);
      });
    }
    if (item.lastTopic) {
      local.lastTopic = typeof item.lastTopic === 'object' ? item.lastTopic?._id : item.lastTopic;
    }
    if (item.lastChapter) {
      local.lastChapter = typeof item.lastChapter === 'object' ? item.lastChapter?._id : item.lastChapter;
    }
    if (typeof item.lastContentIndex === 'number') {
      local.lastContentIndex = item.lastContentIndex;
    }
    if (typeof item.percentCompleted === 'number') {
      local.percentCompleted = item.percentCompleted;
    }
    if (typeof item.isCompleted === 'boolean') {
      local.isCompleted = item.isCompleted;
    }
    await saveLocalCourseProgress(courseId, local, userId);
  }
}

async function findChapterById(chapterId: string): Promise<Chapter | null> {
  for (const entry of Object.values(BUNDLE)) {
    const found = entry.chapters.find((ch) => ch._id === chapterId);
    if (found) return found;
  }
  return null;
}

async function AsyncStorageSetUser(user: User): Promise<void> {
  try {
    const { cacheUserProfile } = await import('./offlineSync');
    await cacheUserProfile(user);
  } catch {
    // ignore
  }
}
