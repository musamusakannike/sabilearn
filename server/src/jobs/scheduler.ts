import cron from 'node-cron';
import User, { IUser } from '../models/user.model';
import Notification from '../models/notification.model';
import StudySession from '../models/studySession.model';
import {
  deliver,
  pruneStaleNotifications,
  sendVariableStudyReminder,
  sendStreakRiskReminder,
} from '../services/notification.service';
import { expireLapsedStreaks } from '../services/streak.service';
import { daysBetweenKeys, localDayKey, localHour, localMinute, startOfLocalDay } from '../utils/time.util';

/**
 * Recurring engagement jobs.
 *
 * Everything runs in-process on a single node. Each job is idempotent through
 * dedupe keys, so a restart mid-tick re-runs safely — but if this server is
 * ever scaled past one instance, move these to a locked job queue or two
 * replicas will both fire the sweep.
 */

/** Cadence in days between scheduled study reminders for a user. */
const STUDY_REMINDER_CADENCE_DAYS = 5;

/** Local hour at which the "your streak is at risk" nudge goes out. */
const STREAK_RISK_HOUR = 20;

/**
 * How close to the user's chosen minute a tick has to land to count. Must stay
 * strictly below the job interval: at exactly 15 both the :00 and :15 ticks
 * would match a target of :00, and only the dedupe key would stop a double
 * send.
 */
const REMINDER_WINDOW_MINUTES = 15;

/** Guards against a nudge storm if the process has been down for a while. */
const MAX_DUE_PER_SWEEP = 500;

async function hasStudiedToday(user: IUser): Promise<boolean> {
  const dayStart = startOfLocalDay(new Date(), user.settings?.timezoneOffset ?? 0);
  const count = await StudySession.countDocuments({
    user: user._id,
    createdAt: { $gte: dayStart },
  });
  return count > 0;
}

/** Users who can actually receive a push right now. */
function pushableUsersQuery(): Record<string, unknown> {
  return {
    expoPushToken: { $exists: true, $ne: '' },
    'settings.pushNotifications': { $ne: false },
  };
}

/**
 * 5-day study reminder. Runs every 15 minutes and picks out the users whose
 * chosen local time has just come around, ensuring at least 5 days have passed
 * since their last reminder (or account creation), and skipping anyone who already studied today.
 *
 * Event-driven guardrails (why the drawer stopped piling up identical rows):
 * - Users with an active streak (>= 2 days) are owned by the evening
 *   streak-risk nudge — no generic reminder for them.
 * - Max one nudge push per user per local day across reminder + streak.
 */
export async function runStudyReminders(now = new Date()): Promise<number> {
  const users = await User.find({
    ...pushableUsersQuery(),
    'settings.studyReminders': { $ne: false },
  });

  let sent = 0;

  for (const user of users) {
    const offset = user.settings?.timezoneOffset ?? 0;
    const targetHour = user.settings?.reminderHour ?? 19;
    const targetMinute = user.settings?.reminderMinute ?? 0;

    if (localHour(now, offset) !== targetHour) continue;
    if (Math.abs(localMinute(now, offset) - targetMinute) >= REMINDER_WINDOW_MINUTES) continue;

    if (await hasStudiedToday(user)) continue;

    // Event-driven: active streaks get the evening rescue nudge, not this.
    if ((user.currentStreak ?? 0) >= 2) continue;

    const dayKey = localDayKey(now, offset);

    // One nudge per day: a streak-risk already sent today wins.
    const alreadyNudged = await Notification.exists({
      user: user._id,
      category: { $in: ['reminder', 'streak'] },
      dedupeKey: { $in: [`reminder:${user._id}:${dayKey}`, `streak-risk:${user._id}:${dayKey}`] },
    });
    if (alreadyNudged) continue;

    // Ensure at least 5 days have elapsed since the user's last study reminder
    const lastReminder = await Notification.findOne({
      user: user._id,
      category: 'reminder',
    }).sort({ createdAt: -1 });

    if (lastReminder) {
      const lastReminderDayKey = localDayKey(lastReminder.createdAt, offset);
      const daysSince = daysBetweenKeys(lastReminderDayKey, dayKey);
      if (daysSince < STUDY_REMINDER_CADENCE_DAYS) continue;
    } else if (user.createdAt) {
      const userCreatedDayKey = localDayKey(user.createdAt, offset);
      const daysSinceCreation = daysBetweenKeys(userCreatedDayKey, dayKey);
      if (daysSinceCreation < STUDY_REMINDER_CADENCE_DAYS) continue;
    }

    const created = await sendVariableStudyReminder(user, dayKey);
    if (created) sent += 1;
  }

  return sent;
}

/**
 * Evening streak rescue. Only goes to users with something to lose — a streak
 * of at least two days — so it stays a genuine warning rather than background
 * noise.
 */
export async function runStreakRiskReminders(now = new Date()): Promise<number> {
  const users = await User.find({
    ...pushableUsersQuery(),
    'settings.streakAlerts': { $ne: false },
    currentStreak: { $gte: 2 },
  });

  let sent = 0;

  for (const user of users) {
    const offset = user.settings?.timezoneOffset ?? 0;
    if (localHour(now, offset) !== STREAK_RISK_HOUR) continue;
    if (await hasStudiedToday(user)) continue;

    const dayKey = localDayKey(now, offset);

    // One nudge per day: a generic reminder already sent today wins.
    const alreadyNudged = await Notification.exists({
      user: user._id,
      category: { $in: ['reminder', 'streak'] },
      dedupeKey: { $in: [`reminder:${user._id}:${dayKey}`, `streak-risk:${user._id}:${dayKey}`] },
    });
    if (alreadyNudged) continue;

    const created = await sendStreakRiskReminder(user._id as never, user.currentStreak, dayKey);
    if (created) sent += 1;
  }

  return sent;
}

/**
 * Delivers notifications whose `scheduledFor` has come due — the mechanism
 * behind admin-authored announcements like scheduled maintenance warnings.
 */
export async function runScheduledDispatch(now = new Date()): Promise<number> {
  const due = await Notification.find({
    scheduledFor: { $ne: null, $lte: now },
    sentAt: null,
  }).limit(MAX_DUE_PER_SWEEP);

  for (const notification of due) {
    await deliver(notification);
  }

  return due.length;
}

/**
 * Retention sweep so the drawer can't accumulate months of stale nudges.
 */
export async function runNotificationPrune(now = new Date()): Promise<number> {
  return pruneStaleNotifications(now);
}

/**
 * Zeroes streaks that have already lapsed, so a user who stopped studying a
 * week ago doesn't still see "5-day streak" on their dashboard.
 */
export async function runLapsedStreakCleanup(): Promise<number> {
  return expireLapsedStreaks();
}

type Job = { name: string; expression: string; run: () => Promise<number | void> };

const JOBS: Job[] = [
  {
    name: 'scheduled-dispatch',
    expression: '*/5 * * * *', // every 5 minutes
    run: () => runScheduledDispatch(),
  },
  {
    name: 'study-reminders',
    expression: '*/15 * * * *', // every 15 minutes, filtered per user timezone
    run: () => runStudyReminders(),
  },
  {
    name: 'streak-risk',
    expression: '*/15 * * * *', // every 15 minutes, filtered to 20:00 local
    run: () => runStreakRiskReminders(),
  },
  {
    name: 'notification-prune',
    expression: '45 1 * * *', // 01:45 UTC daily
    run: () => runNotificationPrune(),
  },
  {
    name: 'streak-cleanup',
    expression: '30 0 * * *', // 00:30 UTC daily
    run: () => runLapsedStreakCleanup(),
  },
];

let started = false;

/**
 * Starts all recurring jobs. Safe to call once at boot; repeat calls are
 * ignored so a hot reload doesn't double-schedule everything.
 */
export function startScheduler(): void {
  if (started) return;

  if (process.env.ENABLE_SCHEDULER === 'false') {
    console.log('Scheduler disabled via ENABLE_SCHEDULER=false');
    return;
  }

  for (const job of JOBS) {
    cron.schedule(job.expression, async () => {
      try {
        const count = await job.run();
        if (typeof count === 'number' && count > 0) {
          console.log(`[scheduler] ${job.name}: ${count} processed`);
        }
      } catch (error) {
        console.error(`[scheduler] ${job.name} failed:`, error);
      }
    });
  }

  started = true;
  console.log(`Scheduler started with ${JOBS.length} jobs`);
}
