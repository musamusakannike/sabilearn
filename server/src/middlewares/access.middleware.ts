import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Course from '../models/course.model';
import Topic from '../models/topic.model';
import Chapter from '../models/chapter.model';
import Transaction from '../models/transaction.model';
import Subscription from '../models/subscription.model';
import { AuthenticatedRequest } from './auth.middleware';
import { isSubscriptionActive } from '../utils/subscription.util';

/**
 * Gates a route to users who can access a given course: it's free, they hold an
 * active subscription, or they have a successful one-off purchase for it.
 * `resolveCourseId` extracts the course id from the request (e.g. req.params.courseId,
 * or a lookup via a topic/lesson id) since the id isn't always directly on the URL.
 */
export const requireCourseAccess = (
  resolveCourseId: (req: AuthenticatedRequest) => Promise<string | null> | string | null
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      if (user.role === 'admin') {
        next();
        return;
      }

      const courseId = await resolveCourseId(req);
      if (!courseId || !mongoose.isValidObjectId(courseId)) {
        res.status(404).json({ success: false, message: 'Course not found.' });
        return;
      }

      const course = await Course.findById(courseId).select('isFree');
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found.' });
        return;
      }

      if (course.isFree) {
        next();
        return;
      }

      const subscription = await Subscription.findOne({ user: user._id }).select('status currentPeriodEnd');
      if (isSubscriptionActive(subscription)) {
        next();
        return;
      }

      const purchased = await Transaction.exists({
        user: user._id,
        course: courseId,
        type: 'course_purchase',
        status: 'success',
      });
      if (purchased) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'This course requires a purchase or an active subscription.',
      });
    } catch (error) {
      next(error);
    }
  };
};

export const resolveCourseIdFromParam = (paramName = 'courseId') => (req: AuthenticatedRequest) => {
  const value =
    (req.params?.[paramName] as string) ||
    (req.body?.[paramName] as string) ||
    (req.query?.[paramName] as string) ||
    (req.body?.courseId as string) ||
    (req.body?.course as string) ||
    (req.params?.id as string) ||
    null;
  return value;
};

export const resolveCourseIdFromTopicParam = (paramName = 'topicId') => async (req: AuthenticatedRequest) => {
  const topicId =
    (req.params?.[paramName] as string) ||
    (req.body?.[paramName] as string) ||
    (req.query?.[paramName] as string) ||
    (req.body?.topicId as string) ||
    (req.body?.topic as string) ||
    (req.params?.id as string) ||
    null;

  if (!topicId || !mongoose.isValidObjectId(topicId)) return null;
  const topic = await Topic.findById(topicId).select('course');
  return topic ? String(topic.course) : null;
};

export const resolveCourseIdFromChapterParam = (paramName = 'chapterId') => async (req: AuthenticatedRequest) => {
  const chapterId =
    (req.params?.[paramName] as string) ||
    (req.body?.chapterId as string) ||
    null;

  if (!chapterId || !mongoose.isValidObjectId(chapterId)) return null;
  const chapter = await Chapter.findById(chapterId).select('course');
  return chapter ? String(chapter.course) : null;
};
