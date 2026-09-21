import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth.middleware';
import Subscription from '../models/subscription.model';
import Course from '../models/course.model';
import AiHistory from '../models/aiHistory.model';
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
  const subscription = await Subscription.findOne({ user: userId }).select('status currentPeriodEnd');
  const subscribed = userRole === 'admin' || isSubscriptionActive(subscription);

  const usedToday = await countSharedGenerationsToday(userId);
  const remaining = subscribed ? Math.max(0, DAILY_COURSE_GENERATION_LIMIT - usedToday) : 0;

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
        'AI generation is an exclusive feature for SabiLearn subscribed members. Please subscribe to unlock course and quiz generation.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Courses plus standalone material quizzes share one daily pool.
 */
export async function countSharedGenerationsToday(userId: string): Promise<number> {
  const startOfDay = getUtcStartOfDay();
  const creatorId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const [courses, quizzes] = await Promise.all([
    Course.countDocuments({
      creator: creatorId,
      isAiGenerated: true,
      createdAt: { $gte: startOfDay },
    }),
    AiHistory.countDocuments({
      user: creatorId,
      type: 'quiz',
      'metadata.countsTowardQuota': true,
      createdAt: { $gte: startOfDay },
    }),
  ]);
  return courses + quizzes;
}

/**
 * Middleware: Enforces maximum 5 shared AI generations per day.
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

    const usedToday = await countSharedGenerationsToday(user._id.toString());

    if (usedToday >= DAILY_COURSE_GENERATION_LIMIT) {
      res.status(429).json({
        success: false,
        message: `Daily limit reached. Subscribed users are allowed up to ${DAILY_COURSE_GENERATION_LIMIT} AI generations per day. Please try again tomorrow.`,
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

