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
  LEARN_URL,
  DASHBOARD_URL,
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
