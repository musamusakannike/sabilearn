import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model';
import UserProgress from '../models/userProgress.model';
import Topic from '../models/topic.model';
import Chapter from '../models/chapter.model';
import Course from '../models/course.model';
import StudySession from '../models/studySession.model';
import XpLog from '../models/xpLog.model';
import { sendEmail } from '../utils/email.util';
import {
  incompleteFirstTopicHtml,
  incompleteFirstTopicText,
  streakRiskHtml,
  streakRiskText,
  weeklyProgressHtml,
  weeklyProgressText,
  firstTopicCelebrationHtml,
  firstTopicCelebrationText,
  firstCourseCelebrationHtml,
  firstCourseCelebrationText,
  sevenDayStreakHtml,
  sevenDayStreakText,
  nextTopicHtml,
  nextTopicText,
  resumeCourseHtml,
  resumeCourseText,
  LEARN_URL,
  DASHBOARD_URL,
  COURSES_URL,
} from '../utils/engagementEmail.util';
import {
  localDayKey,
  localHour,
  localWeekday,
  localWeekKey,
  startOfLocalDay,
  daysBetweenKeys,
  dateToDayKey,
} from '../utils/time.util';

const BLOCKED_DOMAINS = new Set(['example.com', 'test.com', 'localhost']);
const FIRST_TOPIC_DELAY_MS = 2 * 60 * 60 * 1000;
const QUIET_START = 8;
const QUIET_END = 21;
const STREAK_EMAIL_HOUR = 17;
const WEEKLY_EMAIL_HOUR = 10;
const MAX_PER_SWEEP = 200;
const NEXT_TOPIC_DELAY_MS = 24 * 60 * 60 * 1000;
const RESUME_IDLE_MIN_MS = 3 * 24 * 60 * 60 * 1000;
const RESUME_IDLE_MAX_MS = 5 * 24 * 60 * 60 * 1000;
const RESUME_SILENCE_MS = 14 * 24 * 60 * 60 * 1000;

type CelebrationKind = 'first-topic' | 'first-course' | 'streak-7';

export function greetingName(user: IUser): string {
  const name = (user.firstName || user.name || 'Learner').trim();
  return name || 'Learner';
}

export function isSendableEmail(email?: string): boolean {
  const e = String(email || '').trim().toLowerCase();
  if (!e.includes('@')) return false;
  const domain = e.split('@')[1] || '';
  return !BLOCKED_DOMAINS.has(domain);
}

export function wantsEmail(user: IUser): boolean {
  return user.settings?.emailNotifications !== false && isSendableEmail(user.email);
}

function inQuietHours(now: Date, offset: number): boolean {
  const hour = localHour(now, offset);
  return hour < QUIET_START || hour >= QUIET_END;
}

async function hasStudiedToday(user: IUser, now: Date): Promise<boolean> {
  const dayStart = startOfLocalDay(now, user.settings?.timezoneOffset ?? 0);
  const count = await StudySession.countDocuments({
    user: user._id,
    createdAt: { $gte: dayStart },
  });
  return count > 0;
}

export async function findFirstTopicId(
  courseId: mongoose.Types.ObjectId | string
): Promise<mongoose.Types.ObjectId | null> {
  const firstChapter = await Chapter.findOne({ course: courseId }).sort({ order: 1 }).select('_id');
  const query: Record<string, unknown> = { course: courseId, isPublished: { $ne: false } };
  if (firstChapter) query.chapter = firstChapter._id;
  const topic = await Topic.findOne(query).sort({ order: 1 }).select('_id');
  return topic?._id ?? null;
}

export async function maybeStampFirstTopicOpened(
  userId: mongoose.Types.ObjectId | string,
  courseId: mongoose.Types.ObjectId | string | undefined,
  topicId: mongoose.Types.ObjectId | string | undefined
): Promise<void> {
  if (!courseId || !topicId) return;
  const firstId = await findFirstTopicId(courseId);
  if (!firstId || firstId.toString() !== String(topicId)) return;

  await UserProgress.updateOne(
    {
      user: userId,
      course: courseId,
      completedTopics: { $ne: firstId },
      $or: [{ firstTopicOpenedAt: null }, { firstTopicOpenedAt: { $exists: false } }],
    },
    { $set: { firstTopicOpenedAt: new Date() } }
  );
}

async function latestResume(userId: mongoose.Types.ObjectId | string): Promise<{
  courseTitle?: string;
  bannerUrl?: string;
  learnUrl: string;
}> {
  const progress = await UserProgress.findOne({
    user: userId,
    isCompleted: false,
  })
    .sort({ lastStudiedAt: -1 })
    .populate({ path: 'course', select: 'title banner isPublished' })
    .populate({ path: 'lastTopic', select: '_id' });

  const course = progress?.course as { _id?: unknown; title?: string; banner?: string; isPublished?: boolean } | undefined;
  const lastTopic = progress?.lastTopic as { _id?: unknown } | undefined;
  if (course?._id && course.isPublished !== false && lastTopic?._id) {
    return {
      courseTitle: course.title,
      bannerUrl: course.banner || undefined,
      learnUrl: LEARN_URL(String(course._id), String(lastTopic._id)),
    };
  }
  if (course?._id && course.isPublished !== false) {
    return {
      courseTitle: course.title,
      bannerUrl: course.banner || undefined,
      learnUrl: `${DASHBOARD_URL}/courses/${String(course._id)}`,
    };
  }
  return { learnUrl: DASHBOARD_URL };
}

export async function runIncompleteFirstTopicEmails(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - FIRST_TOPIC_DELAY_MS);
  const rows = await UserProgress.find({
    firstTopicOpenedAt: { $ne: null, $lte: cutoff },
    firstTopicNudgeSentAt: null,
    isCompleted: false,
  })
    .limit(MAX_PER_SWEEP)
    .populate({ path: 'user' })
    .populate({ path: 'course', select: 'title banner isPublished' });

  let sent = 0;

  for (const progress of rows) {
    const user = progress.user as unknown as IUser | null;
    const course = progress.course as unknown as {
      _id: mongoose.Types.ObjectId;
      title?: string;
      banner?: string;
      isPublished?: boolean;
    } | null;
    if (!user || !course?._id || course.isPublished === false) {
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      continue;
    }
    if (!wantsEmail(user)) {
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      continue;
    }

    const offset = user.settings?.timezoneOffset ?? 0;
    if (inQuietHours(now, offset)) continue;

    const dayKey = localDayKey(now, offset);
    if (user.lastEngagementEmailDay === dayKey) continue;

    const firstId = await findFirstTopicId(course._id);
    if (!firstId) {
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      continue;
    }

    if (progress.completedTopics?.some((id) => id.toString() === firstId.toString())) {
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      continue;
    }

    if ((progress.completedTopics?.length ?? 0) > 0) {
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      continue;
    }

    const topic = await Topic.findById(firstId).select('title');
    const name = greetingName(user);
    const courseTitle = course.title || 'your course';
    const topicTitle = topic?.title || 'your first lesson';
    const learnUrl = LEARN_URL(String(course._id), String(firstId));
    const bannerUrl = course.banner || undefined;

    try {
      await sendEmail({
        to: user.email,
        subject: `${name}, still want to finish “${topicTitle}”?`,
        html: incompleteFirstTopicHtml({
          name,
          courseTitle,
          topicTitle,
          bannerUrl,
          learnUrl,
        }),
        text: incompleteFirstTopicText({ name, courseTitle, topicTitle, learnUrl }),
      });
      progress.firstTopicNudgeSentAt = now;
      await progress.save();
      user.lastEngagementEmailDay = dayKey;
      await user.save();
      sent += 1;
    } catch (error) {
      console.error('[engagement-email] first-topic failed', user.email, error);
    }
  }

  return sent;
}

export async function runStreakRiskEmails(now = new Date()): Promise<number> {
  const users = await User.find({
    currentStreak: { $gte: 2 },
    'settings.streakAlerts': { $ne: false },
  }).limit(MAX_PER_SWEEP * 4);

  let sent = 0;

  for (const user of users) {
    if (!wantsEmail(user)) continue;
    const offset = user.settings?.timezoneOffset ?? 0;
    if (localHour(now, offset) !== STREAK_EMAIL_HOUR) continue;
    if (inQuietHours(now, offset)) continue;

    const dayKey = localDayKey(now, offset);
    if (user.lastStreakEmailDay === dayKey || user.lastEngagementEmailDay === dayKey) continue;

    const lastKey = user.lastStudyDate ? dateToDayKey(user.lastStudyDate) : null;
    if (!lastKey || daysBetweenKeys(lastKey, dayKey) !== 1) continue;

    if (await hasStudiedToday(user, now)) continue;

    const resume = await latestResume(user._id as mongoose.Types.ObjectId);
    const name = greetingName(user);
    const streak = user.currentStreak;

    try {
      await sendEmail({
        to: user.email,
        subject: `Your ${streak}-day streak is open until tonight`,
        html: streakRiskHtml({
          name,
          streak,
          courseTitle: resume.courseTitle,
          bannerUrl: resume.bannerUrl,
          learnUrl: resume.learnUrl,
        }),
        text: streakRiskText({
          name,
          streak,
          courseTitle: resume.courseTitle,
          learnUrl: resume.learnUrl,
        }),
      });
      user.lastStreakEmailDay = dayKey;
      user.lastEngagementEmailDay = dayKey;
      await user.save();
      sent += 1;
      if (sent >= MAX_PER_SWEEP) break;
    } catch (error) {
      console.error('[engagement-email] streak failed', user.email, error);
    }
  }

  return sent;
}

export async function runWeeklyProgressEmails(now = new Date()): Promise<number> {
  const users = await User.find({
    'settings.weeklyProgress': { $ne: false },
  }).limit(MAX_PER_SWEEP * 4);

  let sent = 0;

  for (const user of users) {
    if (!wantsEmail(user)) continue;
    const offset = user.settings?.timezoneOffset ?? 0;
    if (localWeekday(now, offset) !== 0) continue;
    if (localHour(now, offset) !== WEEKLY_EMAIL_HOUR) continue;

    const weekKey = localWeekKey(now, offset);
    if (user.lastWeeklyEmailWeek === weekKey) continue;

    const dayKey = localDayKey(now, offset);
    if (user.lastEngagementEmailDay === dayKey) continue;

    const recentDays = [user.lastStreakEmailDay, user.lastEngagementEmailDay].filter(
      (d): d is string => Boolean(d)
    );
    const recentlyMailed = recentDays.some((d) => {
      const gap = daysBetweenKeys(d, dayKey);
      return gap >= 0 && gap <= 2;
    });
    if (recentlyMailed) continue;

    const weekStart = new Date(startOfLocalDay(now, offset).getTime() - 7 * 24 * 60 * 60 * 1000);
    const sessions = await StudySession.countDocuments({
      user: user._id,
      createdAt: { $gte: weekStart },
    });
    const topicsCompleted = await XpLog.countDocuments({
      user: user._id,
      sourceType: 'topic',
      createdAt: { $gte: weekStart },
    });
    const inProgress = await UserProgress.countDocuments({
      user: user._id,
      isCompleted: false,
      lastStudiedAt: { $gte: weekStart },
    });

    if (sessions === 0 && topicsCompleted === 0 && inProgress === 0) continue;

    const resume = await latestResume(user._id as mongoose.Types.ObjectId);
    const name = greetingName(user);

    try {
      await sendEmail({
        to: user.email,
        subject: `${name}, your week on SabiLearn`,
        html: weeklyProgressHtml({
          name,
          streak: user.currentStreak ?? 0,
          topicsCompleted,
          sessions,
          courseTitle: resume.courseTitle,
          bannerUrl: resume.bannerUrl,
          learnUrl: resume.learnUrl,
        }),
        text: weeklyProgressText({
          name,
          streak: user.currentStreak ?? 0,
          topicsCompleted,
          sessions,
          courseTitle: resume.courseTitle,
          learnUrl: resume.learnUrl,
        }),
      });
      user.lastWeeklyEmailWeek = weekKey;
      await user.save();
      sent += 1;
      if (sent >= MAX_PER_SWEEP) break;
    } catch (error) {
      console.error('[engagement-email] weekly failed', user.email, error);
    }
  }

  return sent;
}

export async function findNextTopic(
  courseId: mongoose.Types.ObjectId | string,
  afterTopicId: mongoose.Types.ObjectId | string
): Promise<{ _id: mongoose.Types.ObjectId; title: string } | null> {
  const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 }).select('_id');
  const chapterIds = chapters.map((c) => c._id);
  const topics = await Topic.find({
    course: courseId,
    isPublished: { $ne: false },
  }).select('_id title chapter order');

  const chapterIndex = new Map(chapterIds.map((id, i) => [id.toString(), i]));
  topics.sort((a, b) => {
    const ca = chapterIndex.get(a.chapter?.toString() || '') ?? 999;
    const cb = chapterIndex.get(b.chapter?.toString() || '') ?? 999;
    if (ca !== cb) return ca - cb;
    return (a.order || 0) - (b.order || 0);
  });

  const idx = topics.findIndex((t) => t._id.toString() === String(afterTopicId));
  const next = idx >= 0 ? topics[idx + 1] : topics[0];
  if (!next) return null;
  return { _id: next._id as mongoose.Types.ObjectId, title: next.title };
}

function queueCelebration(
  user: IUser,
  kind: CelebrationKind,
  courseId?: mongoose.Types.ObjectId | string,
  topicId?: mongoose.Types.ObjectId | string
): void {
  const rank: Record<CelebrationKind, number> = {
    'first-course': 3,
    'streak-7': 2,
    'first-topic': 1,
  };
  const current = user.pendingCelebration as CelebrationKind | null;
  if (current && rank[current] >= rank[kind]) return;
  user.pendingCelebration = kind;
  user.pendingCelebrationCourse = courseId
    ? new mongoose.Types.ObjectId(String(courseId))
    : null;
  user.pendingCelebrationTopic = topicId
    ? new mongoose.Types.ObjectId(String(topicId))
    : null;
}

export async function onTopicCompleted(
  userId: mongoose.Types.ObjectId | string,
  courseId: mongoose.Types.ObjectId | string,
  topicId: mongoose.Types.ObjectId | string,
  courseJustCompleted: boolean
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const allProgress = await UserProgress.find({ user: userId }).select(
    'completedTopics isCompleted'
  );
  const totalTopics = allProgress.reduce((n, p) => n + (p.completedTopics?.length ?? 0), 0);
  const completedCourses = allProgress.filter((p) => p.isCompleted).length;

  if (totalTopics === 1 && !user.firstTopicCelebrationSentAt) {
    queueCelebration(user, 'first-topic', courseId, topicId);
  }
  if (courseJustCompleted && completedCourses === 1 && !user.firstCourseCelebrationSentAt) {
    queueCelebration(user, 'first-course', courseId, topicId);
  }

  if (!courseJustCompleted) {
    const next = await findNextTopic(courseId, topicId);
    if (next) {
      user.nextTopicSuggestAt = new Date(Date.now() + NEXT_TOPIC_DELAY_MS);
      user.nextTopicCourse = new mongoose.Types.ObjectId(String(courseId));
      user.nextTopicId = next._id;
    } else {
      user.nextTopicSuggestAt = null;
      user.nextTopicCourse = null;
      user.nextTopicId = null;
    }
  } else {
    user.nextTopicSuggestAt = null;
    user.nextTopicCourse = null;
    user.nextTopicId = null;
  }

  await user.save();
  await runCelebrationEmails();
}

export async function onSevenDayStreak(userId: mongoose.Types.ObjectId | string): Promise<void> {
  const user = await User.findById(userId);
  if (!user || user.sevenDayStreakEmailedAt) return;
  queueCelebration(user, 'streak-7');
  await user.save();
  await runCelebrationEmails();
}

export async function runCelebrationEmails(now = new Date()): Promise<number> {
  const users = await User.find({ pendingCelebration: { $ne: null } }).limit(MAX_PER_SWEEP);
  let sent = 0;

  for (const user of users) {
    if (!wantsEmail(user) || !user.pendingCelebration) {
      user.pendingCelebration = null;
      await user.save();
      continue;
    }
    const offset = user.settings?.timezoneOffset ?? 0;
    if (inQuietHours(now, offset)) continue;
    const dayKey = localDayKey(now, offset);
    if (user.lastCelebrationEmailDay === dayKey) continue;

    const name = greetingName(user);
    const kind = user.pendingCelebration as CelebrationKind;
    const course = user.pendingCelebrationCourse
      ? await Course.findById(user.pendingCelebrationCourse).select('title banner isPublished')
      : null;
    const topic = user.pendingCelebrationTopic
      ? await Topic.findById(user.pendingCelebrationTopic).select('title')
      : null;
    const resume = await latestResume(user._id as mongoose.Types.ObjectId);
    const bannerUrl = course?.banner || resume.bannerUrl;
    const courseTitle = course?.title || resume.courseTitle || 'SabiLearn';

    try {
      if (kind === 'first-topic') {
        const topicTitle = topic?.title || 'your first lesson';
        let learnUrl = resume.learnUrl;
        if (course && topic) {
          const next = await findNextTopic(course._id, topic._id);
          learnUrl = next
            ? LEARN_URL(String(course._id), String(next._id))
            : `${DASHBOARD_URL}/courses/${String(course._id)}`;
        }
        await sendEmail({
          to: user.email,
          subject: `${name}, you finished your first topic`,
          html: firstTopicCelebrationHtml({
            name,
            courseTitle,
            topicTitle,
            bannerUrl,
            learnUrl,
          }),
          text: firstTopicCelebrationText({ name, courseTitle, topicTitle, learnUrl }),
        });
        user.firstTopicCelebrationSentAt = now;
      } else if (kind === 'first-course') {
        await sendEmail({
          to: user.email,
          subject: `${name}, you finished ${courseTitle}`,
          html: firstCourseCelebrationHtml({
            name,
            courseTitle,
            bannerUrl,
            learnUrl: COURSES_URL,
          }),
          text: firstCourseCelebrationText({
            name,
            courseTitle,
            learnUrl: COURSES_URL,
          }),
        });
        user.firstCourseCelebrationSentAt = now;
        if (!user.firstTopicCelebrationSentAt) {
          user.firstTopicCelebrationSentAt = now;
        }
      } else {
        await sendEmail({
          to: user.email,
          subject: `${name}, seven days in a row`,
          html: sevenDayStreakHtml({
            name,
            bannerUrl: resume.bannerUrl,
            learnUrl: resume.learnUrl,
          }),
          text: sevenDayStreakText({ name, learnUrl: resume.learnUrl }),
        });
        user.sevenDayStreakEmailedAt = now;
      }
      user.pendingCelebration = null;
      user.pendingCelebrationCourse = null;
      user.pendingCelebrationTopic = null;
      user.lastCelebrationEmailDay = dayKey;
      user.lastEngagementEmailDay = dayKey;
      await user.save();
      sent += 1;
    } catch (error) {
      console.error('[engagement-email] celebration failed', user.email, error);
    }
  }

  return sent;
}

export async function runNextTopicEmails(now = new Date()): Promise<number> {
  const users = await User.find({
    nextTopicSuggestAt: { $ne: null, $lte: now },
    nextTopicId: { $ne: null },
  }).limit(MAX_PER_SWEEP);

  let sent = 0;

  for (const user of users) {
    if (!wantsEmail(user) || !user.nextTopicId || !user.nextTopicCourse) {
      user.nextTopicSuggestAt = null;
      await user.save();
      continue;
    }
    const offset = user.settings?.timezoneOffset ?? 0;
    if (inQuietHours(now, offset)) continue;
    const dayKey = localDayKey(now, offset);
    if (user.lastEngagementEmailDay === dayKey || user.lastCelebrationEmailDay === dayKey) {
      continue;
    }

    const progress = await UserProgress.findOne({
      user: user._id,
      course: user.nextTopicCourse,
    });
    const alreadyDone = progress?.completedTopics?.some(
      (id) => id.toString() === String(user.nextTopicId)
    );
    if (alreadyDone || progress?.isCompleted) {
      user.nextTopicSuggestAt = null;
      user.nextTopicCourse = null;
      user.nextTopicId = null;
      await user.save();
      continue;
    }

    const course = await Course.findById(user.nextTopicCourse).select('title banner isPublished');
    const topic = await Topic.findById(user.nextTopicId).select('title');
    if (!course || course.isPublished === false || !topic) {
      user.nextTopicSuggestAt = null;
      user.nextTopicCourse = null;
      user.nextTopicId = null;
      await user.save();
      continue;
    }

    const name = greetingName(user);
    const learnUrl = LEARN_URL(String(course._id), String(topic._id));
    try {
      await sendEmail({
        to: user.email,
        subject: `${name}, next up: ${topic.title}`,
        html: nextTopicHtml({
          name,
          courseTitle: course.title,
          topicTitle: topic.title,
          bannerUrl: course.banner || undefined,
          learnUrl,
        }),
        text: nextTopicText({
          name,
          courseTitle: course.title,
          topicTitle: topic.title,
          learnUrl,
        }),
      });
      user.nextTopicSuggestAt = null;
      user.nextTopicCourse = null;
      user.nextTopicId = null;
      user.lastNextTopicEmailAt = now;
      user.lastEngagementEmailDay = dayKey;
      await user.save();
      sent += 1;
    } catch (error) {
      console.error('[engagement-email] next-topic failed', user.email, error);
    }
  }

  return sent;
}

export async function runResumeCourseEmails(now = new Date()): Promise<number> {
  const idleMin = new Date(now.getTime() - RESUME_IDLE_MAX_MS);
  const idleMax = new Date(now.getTime() - RESUME_IDLE_MIN_MS);
  const rows = await UserProgress.find({
    isCompleted: false,
    lastStudiedAt: { $gte: idleMin, $lte: idleMax },
  })
    .limit(MAX_PER_SWEEP)
    .populate({ path: 'user' })
    .populate({ path: 'course', select: 'title banner isPublished' })
    .populate({ path: 'lastTopic', select: 'title' });

  let sent = 0;

  for (const progress of rows) {
    const user = progress.user as unknown as IUser | null;
    const course = progress.course as unknown as {
      _id: mongoose.Types.ObjectId;
      title?: string;
      banner?: string;
      isPublished?: boolean;
    } | null;
    if (!user || !wantsEmail(user) || !course?._id || course.isPublished === false) continue;
    const hasStarted = (progress.completedTopics?.length ?? 0) > 0 || Boolean(progress.lastTopic);
    if (!hasStarted) continue;

    if (progress.lastResumeEmailAt && progress.lastResumeEmailAt >= progress.lastStudiedAt) {
      continue;
    }
    if (user.lastResumeEmailAt && now.getTime() - user.lastResumeEmailAt.getTime() < RESUME_SILENCE_MS) {
      continue;
    }

    const offset = user.settings?.timezoneOffset ?? 0;
    if (inQuietHours(now, offset)) continue;
    const dayKey = localDayKey(now, offset);
    if (user.lastEngagementEmailDay === dayKey || user.lastCelebrationEmailDay === dayKey) continue;

    const lastTopic = progress.lastTopic as unknown as { _id?: unknown; title?: string } | null;
    const learnUrl = lastTopic?._id
      ? LEARN_URL(String(course._id), String(lastTopic._id))
      : `${DASHBOARD_URL}/courses/${String(course._id)}`;
    const name = greetingName(user);
    const courseTitle = course.title || 'your course';

    try {
      await sendEmail({
        to: user.email,
        subject: `${name}, pick up ${courseTitle}`,
        html: resumeCourseHtml({
          name,
          courseTitle,
          topicTitle: lastTopic?.title,
          bannerUrl: course.banner || undefined,
          learnUrl,
        }),
        text: resumeCourseText({
          name,
          courseTitle,
          topicTitle: lastTopic?.title,
          learnUrl,
        }),
      });
      progress.lastResumeEmailAt = now;
      await progress.save();
      user.lastResumeEmailAt = now;
      user.lastEngagementEmailDay = dayKey;
      await user.save();
      sent += 1;
    } catch (error) {
      console.error('[engagement-email] resume failed', user.email, error);
    }
  }

  return sent;
}
