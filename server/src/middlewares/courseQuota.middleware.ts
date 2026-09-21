import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import Subscription from '../models/subscription.model';
import Course from '../models/course.model';
import { isSubscriptionActive } from '../utils/subscription.util';

export const DAILY_COURSE_GENERATION_LIMIT = 5;

/**
 * Returns the start of today in UTC.
 */
export function getUtcStartOfDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Get current generation quota stats for a user.
 */
export async function getUserQuotaStats(userId: string, userRole = 'user'): Promise<{
  usedToday: number;
  remaining: number;
  dailyLimit: number;
  isSubscribed: boolean;
}> {
  if (userRole === 'admin') {
    return {
      usedToday: 0,
      remaining: DAILY_COURSE_GENERATION_LIMIT,
      dailyLimit: DAILY_COURSE_GENERATION_LIMIT,
      isSubscribed: true,
    };
  }

  const subscription = await Subscription.findOne({ user: userId }).select('status currentPeriodEnd');
  const subscribed = isSubscriptionActive(subscription);

  const startOfDay = getUtcStartOfDay();
  const usedToday = await Course.countDocuments({
    creator: userId,
    isAiGenerated: true,
    createdAt: { $gte: startOfDay },
  });

  const remaining = Math.max(0, DAILY_COURSE_GENERATION_LIMIT - usedToday);

  return {
    usedToday,
    remaining,
    dailyLimit: DAILY_COURSE_GENERATION_LIMIT,
    isSubscribed: subscribed,
  };
}

/**
 * Middleware: Requires an active paid subscription or admin role.
 */
export const requireSubscribedUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (user.role === 'admin') {
      next();
      return;
    }

    const subscription = await Subscription.findOne({ user: user._id }).select('status currentPeriodEnd');
    if (isSubscriptionActive(subscription)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message:
        'AI Course Generation is an exclusive feature for SabiLearn subscribed members. Please subscribe to unlock AI Course Generation.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Enforces maximum 5 course generations per day.
 */
export const checkDailyGenerationQuota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Admins bypass the daily cap
    if (user.role === 'admin') {
      next();
      return;
    }

    const startOfDay = getUtcStartOfDay();
    const usedToday = await Course.countDocuments({
      creator: user._id,
      isAiGenerated: true,
      createdAt: { $gte: startOfDay },
    });

    if (usedToday >= DAILY_COURSE_GENERATION_LIMIT) {
      res.status(429).json({
        success: false,
        message: `Daily limit reached. Subscribed users are allowed up to ${DAILY_COURSE_GENERATION_LIMIT} course generations per day. Please try again tomorrow.`,
        data: {
          usedToday,
          dailyLimit: DAILY_COURSE_GENERATION_LIMIT,
          remaining: 0,
        },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
