import mongoose from 'mongoose';
import Notification, {
  INotification,
  NotificationCategory,
  NotificationType,
} from '../models/notification.model';
import { ICourse } from '../models/course.model';
import { IBlogPost } from '../models/blog.model';
import { IUser } from '../models/user.model';
import { sendPushToUser, sendPushToAllUsers } from '../utils/push.util';

/**
 * The single entry point for producing notifications. Controllers and jobs go
 * through here rather than touching the model and push utils directly, so
 * dedupe and scheduling behaviour can't be forgotten at a call site.
 */

export interface NotifyInput {
  /** Omit or pass null to broadcast to every user. */
  user?: mongoose.Types.ObjectId | string | null;
  type?: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  /**
   * Unique per logical event. A second attempt with the same key is dropped,
   * which is what stops an hourly cron from re-sending the same nudge.
   */
  dedupeKey?: string;
  /** Future date defers delivery to the scheduler sweep. */
  scheduledFor?: Date | null;
}

export interface NotifyResult {
  notification: INotification | null;
  /** False when a dedupeKey collision meant this was already handled. */
  created: boolean;
  /** True when the push went out now (rather than being queued for later). */
  delivered: boolean;
}

/**
 * Creates a notification and, unless it is scheduled for the future, pushes it.
 *
 * Never throws: a failed nudge must not take down the request that triggered
 * it. Callers that care can inspect the result.
 */
export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const {
    user = null,
    type = 'info',
    category,
    title,
    message,
    actionUrl = '',
    data = {},
    dedupeKey,
    scheduledFor = null,
  } = input;

  const isDeferred = scheduledFor instanceof Date && scheduledFor.getTime() > Date.now();

  try {
    const doc = {
      user: user ? new mongoose.Types.ObjectId(String(user)) : null,
      type,
      category,
      title,
      message,
      actionUrl,
      data,
      scheduledFor,
      sentAt: null as Date | null,
      ...(dedupeKey ? { dedupeKey } : {}),
    };

    let notification: INotification;

    if (dedupeKey) {
      // Upsert-on-key: concurrent cron ticks race here safely, and only the
      // insert winner gets `created: true` and therefore sends the push.
      const existing = await Notification.findOne({ dedupeKey });
      if (existing) {
        return { notification: existing, created: false, delivered: false };
      }
      try {
        notification = await Notification.create(doc);
      } catch (err) {
        // Unique index rejected a concurrent insert — someone else got there.
        if ((err as { code?: number }).code === 11000) {
          return { notification: null, created: false, delivered: false };
        }
        throw err;
      }
    } else {
      notification = await Notification.create(doc);
    }

    if (isDeferred) {
      return { notification, created: true, delivered: false };
    }

    await deliver(notification);
    return { notification, created: true, delivered: true };
  } catch (error) {
    console.error(`Failed to create notification (${category}):`, error);
    return { notification: null, created: false, delivered: false };
  }
}

/**
 * Sends the push for an already-persisted notification and stamps `sentAt`.
 * Used both for immediate delivery and by the scheduler's due-sweep.
 */
export async function deliver(notification: INotification): Promise<void> {
  const payload = {
    notificationId: String(notification._id),
    actionUrl: notification.actionUrl || '',
    type: notification.type,
    category: notification.category,
    ...(notification.data || {}),
  };

  try {
    if (notification.user) {
      await sendPushToUser(
        notification.user.toString(),
        notification.title,
        notification.message,
        payload
      );
    } else {
      await sendPushToAllUsers(notification.title, notification.message, payload);
    }
  } catch (error) {
    console.error('Push delivery failed:', error);
  }

  notification.sentAt = new Date();
  await notification.save();
}

/* ------------------------------------------------------------------ *
 * Archetype helpers — one per notification kind the app actually sends.
 * ------------------------------------------------------------------ */

/**
 * "Welcome to SabiLearn!" — fires once per account, on first sign-up through
 * any auth path.
 */
export async function sendWelcomeNotification(user: IUser): Promise<void> {
  await notify({
    user: user._id as mongoose.Types.ObjectId,
    type: 'announcement',
    category: 'welcome',
    title: 'Welcome to SabiLearn!',
    message: `Hi ${user.firstName || 'there'} — start your learning journey by exploring our courses.`,
    actionUrl: '/dashboard/courses',
    dedupeKey: `welcome:${user._id}`,
  });
}

/**
 * "New Course Available" — broadcast when a course becomes publicly visible.
 * Keyed on the course so re-publishing never spams twice.
 */
export async function broadcastCoursePublished(course: ICourse): Promise<void> {
  await notify({
    user: null,
    type: 'info',
    category: 'course',
    title: 'New Course Available',
    message: `${course.title} is now available. ${course.description}`,
    actionUrl: `/dashboard/courses/${course._id}`,
    data: { courseId: String(course._id) },
    dedupeKey: `course-published:${course._id}`,
  });
}

/**
 * "New Blog Post" — broadcast when an article is published on the blog.
 * Keyed on the post ID so re-publishing never spams twice.
 */
export async function broadcastBlogPostPublished(
  post: IBlogPost | { _id: mongoose.Types.ObjectId | string; title: string; excerpt?: string; slug: string }
): Promise<void> {
  const url = `https://www.sabilearn.online/blog/${post.slug}`;
  await notify({
    user: null,
    type: 'announcement',
    category: 'blog',
    title: `New Article: ${post.title}`,
    message: post.excerpt || `Read our latest article "${post.title}" on SabiLearn.`,
    actionUrl: url,
    data: {
      blogId: String(post._id),
      slug: post.slug,
      url,
      actionUrl: url,
    },
    dedupeKey: `blog-published:${post._id}`,
  });
}

/**
 * "Study Streak Achievement" and friends — the `success` archetype. The
 * dedupeKey is supplied by the caller because milestones repeat over time
 * (streak 7 this month, streak 7 again after a lapse).
 */
export async function sendAchievement(
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string,
  dedupeKey: string,
  actionUrl = '/dashboard/progress'
): Promise<void> {
  await notify({
    user: userId,
    type: 'success',
    category: 'achievement',
    title,
    message,
    actionUrl,
    dedupeKey,
  });
}

/** Daily "time to study" nudge. One per user per local day. */
export async function sendStudyReminder(
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string,
  dayKey: string
): Promise<boolean> {
  // Collapse: an unread reminder from a previous day is stale — remove it so
  // the drawer never piles up N identical rows ("43 unread, same sentence").
  await Notification.deleteMany({
    user: new mongoose.Types.ObjectId(String(userId)),
    category: 'reminder',
    isRead: false,
  });
  const result = await notify({
    user: userId,
    type: 'info',
    category: 'reminder',
    title,
    message,
    actionUrl: '/dashboard/courses',
    dedupeKey: `reminder:${userId}:${dayKey}`,
  });
  return result.created;
}

/**
 * Variable, personalized study-reminder copy. Deterministic per (user, day) so
 * a retry within the same day keeps the same wording instead of flip-flopping,
 * but consecutive nudges (5 days apart) rotate through variants.
 */
export function buildStudyReminderContent(
  user: Pick<IUser, '_id' | 'firstName' | 'currentStreak'>,
  dayKey: string
): { title: string; message: string } {
  const streak = user.currentStreak ?? 0;
  const name = user.firstName ? `, ${user.firstName}` : '';

  if (streak > 0) {
    const variants = [
      {
        title: `${streak}-day streak going${name} — keep it alive?`,
        message: `You're on a ${streak}-day streak. A short session today keeps it going.`,
      },
      {
        title: `Day ${streak + 1} is one session away`,
        message: `One quick review today takes your ${streak}-day streak to ${streak + 1}.`,
      },
      {
        title: `Protect your ${streak}-day streak`,
        message: `A few flashcards now is all it takes to hold onto ${streak} days of momentum.`,
      },
    ];
    return variants[hashString(`${user._id}:${dayKey}`) % variants.length];
  }

  const variants = [
    {
      title: `A fresh start${name}?`,
      message: 'Two flashcards is enough to restart the habit. Open one deck and do the first card.',
    },
    {
      title: 'Small reps beat long sessions',
      message: 'Five minutes of recall today compounds faster than an hour on the weekend. Try one quiz.',
    },
    {
      title: 'Your decks miss you',
      message: 'Pick one course and finish a single lesson — momentum starts there.',
    },
    {
      title: 'Learn one thing today',
      message: 'Answer three questions correctly and call it a win. Consistency beats intensity.',
    },
  ];
  return variants[hashString(`${user._id}:${dayKey}`) % variants.length];
}

/** Thin wrapper: picks variable copy, then sends (with collapse). */
export async function sendVariableStudyReminder(
  user: Pick<IUser, '_id' | 'firstName' | 'currentStreak'>,
  dayKey: string
): Promise<boolean> {
  const { title, message } = buildStudyReminderContent(user, dayKey);
  return sendStudyReminder(user._id as never, title, message, dayKey);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Retention sweep: read notifications older than 30 days are gone, and unread
 * generic nudges (reminder/streak) older than 14 days are stale by definition.
 * Returns how many documents were removed.
 */
export async function pruneStaleNotifications(now = new Date()): Promise<number> {
  const readCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const nudgeCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [read, nudges] = await Promise.all([
    Notification.deleteMany({ isRead: true, updatedAt: { $lt: readCutoff } }),
    Notification.deleteMany({
      category: { $in: ['reminder', 'streak'] },
      isRead: false,
      createdAt: { $lt: nudgeCutoff },
    }),
  ]);
  return (read.deletedCount ?? 0) + (nudges.deletedCount ?? 0);
}

/** Evening "your streak is about to break" nudge. One per user per local day. */
export async function sendStreakRiskReminder(
  userId: mongoose.Types.ObjectId | string,
  streak: number,
  dayKey: string
): Promise<boolean> {
  // Same collapse rule as reminders: yesterday's unread rescue is stale.
  await Notification.deleteMany({
    user: new mongoose.Types.ObjectId(String(userId)),
    category: 'streak',
    isRead: false,
  });
  const result = await notify({
    user: userId,
    type: 'warning',
    category: 'streak',
    title: `Don't lose your ${streak}-day streak`,
    message: `You haven't studied today. A few minutes of flashcards keeps your ${streak}-day streak alive.`,
    actionUrl: '/dashboard/courses',
    data: { streak },
    dedupeKey: `streak-risk:${userId}:${dayKey}`,
  });
  return result.created;
}
