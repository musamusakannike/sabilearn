import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { ClientPlatform } from '../models/user.model';
import Course from '../models/course.model';
import Topic from '../models/topic.model';
import Flashcard from '../models/flashcard.model';
import MCQ from '../models/mcq.model';
import StudySession from '../models/studySession.model';
import Subscription from '../models/subscription.model';
import Transaction from '../models/transaction.model';
import UserProgress from '../models/userProgress.model';
import AiHistory from '../models/aiHistory.model';
import PlaygroundProject from '../models/playgroundProject.model';
import { sendEmail } from '../utils/email.util';
import {
  proUpgradeCelebrationHtml,
  proUpgradeCelebrationText,
} from '../utils/engagementEmail.util';
import { sendProUpgradeNotification } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Helper to compute date range filter based on timeframe.
 */
function getTimeframeStartDate(timeframe: string): Date | null {
  const now = new Date();
  if (timeframe === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (timeframe === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (timeframe === '90d') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  return null; // 'all'
}

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    const startDate = getTimeframeStartDate(timeframe);
    const dateMatch = startDate ? { createdAt: { $gte: startDate } } : {};
    const now = new Date();

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // One-time lightweight backfill for users who haven't logged a lastPlatform yet
    // Inferred strictly from Subscription.store (app_store -> ios, play_store -> android, web -> web)
    // or Expo push token pattern, without any fake data.
    const backfillSubs = await Subscription.find({ store: { $in: ['app_store', 'play_store', 'web'] } }).select('user store');
    if (backfillSubs.length > 0) {
      const updates = backfillSubs.map((sub) => {
        const platform: ClientPlatform = sub.store === 'app_store' ? 'ios' : sub.store === 'play_store' ? 'android' : 'web';
        return {
          updateOne: {
            filter: { _id: sub.user, lastPlatform: null },
            update: { $set: { lastPlatform: platform } },
          },
        };
      });
      await User.bulkWrite(updates as any).catch(() => {});
    }

    // Parallel aggregate queries
    const [
      totalUsers,
      newUsersPeriod,
      dauCount,
      wauCount,
      mauCount,
      totalCourses,
      officialCourses,
      aiCourses,
      totalTopics,
      totalFlashcards,
      totalMcqs,
      activeSessions24h,
      totalStudySessions,
      studyDurationAgg,
      totalXpAgg,
      activeSubsCount,
      subscriptionsByBilling,
      subscriptionsByStore,
      revenueTotalAgg,
      revenuePeriodAgg,
      enrolledLearnersDistinct,
      courseEnrollmentCount,
      completedCoursesCount,
      platformAgg,
      active30dPlatformAgg,
      trackAgg,
      levelAgg,
      streakAgg,
      aiHistoryAgg,
      playgroundAgg,
      userGrowthRaw,
      revenueSeriesRaw,
      studyActivityRaw,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(dateMatch),
      User.countDocuments({
        $or: [{ lastActiveAt: { $gte: oneDayAgo } }, { lastStudyDate: { $gte: oneDayAgo } }],
      }),
      User.countDocuments({
        $or: [{ lastActiveAt: { $gte: sevenDaysAgo } }, { lastStudyDate: { $gte: sevenDaysAgo } }],
      }),
      User.countDocuments({
        $or: [{ lastActiveAt: { $gte: thirtyDaysAgo } }, { lastStudyDate: { $gte: thirtyDaysAgo } }],
      }),
      Course.countDocuments(),
      Course.countDocuments({ isAiGenerated: { $ne: true } }),
      Course.countDocuments({ isAiGenerated: true }),
      Topic.countDocuments(),
      Flashcard.countDocuments(),
      MCQ.countDocuments(),
      StudySession.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      StudySession.countDocuments(dateMatch),
      StudySession.aggregate([
        ...(startDate ? [{ $match: { createdAt: { $gte: startDate } } }] : []),
        { $group: { _id: null, totalDuration: { $sum: '$duration' } } },
      ]),
      User.aggregate([{ $group: { _id: null, totalXp: { $sum: '$totalXp' } } }]),
      Subscription.countDocuments({
        status: 'active',
        $or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: null }, { currentPeriodEnd: { $gt: now } }],
      }),
      Subscription.aggregate([
        {
          $match: {
            status: 'active',
            $or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: null }, { currentPeriodEnd: { $gt: now } }],
          },
        },
        { $group: { _id: '$billingType', count: { $sum: 1 } } },
      ]),
      Subscription.aggregate([
        {
          $match: {
            status: 'active',
            $or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: null }, { currentPeriodEnd: { $gt: now } }],
          },
        },
        { $group: { _id: { $ifNull: ['$store', 'web'] }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'success', ...(startDate ? { createdAt: { $gte: startDate } } : {}) } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      UserProgress.distinct('user', { 'completedTopics.0': { $exists: true } }),
      UserProgress.countDocuments({ 'completedTopics.0': { $exists: true } }),
      UserProgress.countDocuments({ isCompleted: true }),
      User.aggregate([
        { $group: { _id: { $ifNull: ['$lastPlatform', 'unknown'] }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        {
          $match: {
            $or: [{ lastActiveAt: { $gte: thirtyDaysAgo } }, { lastStudyDate: { $gte: thirtyDaysAgo } }],
          },
        },
        { $group: { _id: { $ifNull: ['$lastPlatform', 'unknown'] }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: { $ifNull: ['$activeTrack', 'tech'] }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: { $ifNull: ['$level', 'beginner'] }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        {
          $bucket: {
            groupBy: '$currentStreak',
            boundaries: [0, 1, 3, 7, 14, 30, 999999],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      AiHistory.aggregate([
        ...(startDate ? [{ $match: { createdAt: { $gte: startDate } } }] : []),
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      PlaygroundProject.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$kind', count: { $sum: 1 } } },
      ]),
      // Daily User registrations
      User.aggregate([
        ...(startDate ? [{ $match: { createdAt: { $gte: startDate } } }] : [{ $match: { createdAt: { $gte: thirtyDaysAgo } } }]),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            registrations: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Daily Revenue series
      Transaction.aggregate([
        {
          $match: {
            status: 'success',
            ...(startDate ? { createdAt: { $gte: startDate } } : { createdAt: { $gte: thirtyDaysAgo } }),
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
      // Daily Study Sessions series
      StudySession.aggregate([
        ...(startDate ? [{ $match: { createdAt: { $gte: startDate } } }] : [{ $match: { createdAt: { $gte: thirtyDaysAgo } } }]),
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            count: { $sum: 1 },
            duration: { $sum: '$duration' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
    ]);

    // Format series for Recharts
    const growthMap = new Map<string, { date: string; registrations: number }>();
    userGrowthRaw.forEach((item) => {
      growthMap.set(item._id, { date: item._id, registrations: item.registrations });
    });
    const userGrowthSeries = Array.from(growthMap.values());

    const revenueMap = new Map<string, { date: string; totalKobo: number; subscriptionKobo: number; courseKobo: number }>();
    revenueSeriesRaw.forEach((item) => {
      const d = item._id.date;
      if (!revenueMap.has(d)) {
        revenueMap.set(d, { date: d, totalKobo: 0, subscriptionKobo: 0, courseKobo: 0 });
      }
      const entry = revenueMap.get(d)!;
      entry.totalKobo += item.amount;
      if (item._id.type === 'subscription') {
        entry.subscriptionKobo += item.amount;
      } else {
        entry.courseKobo += item.amount;
      }
    });
    const revenueSeries = Array.from(revenueMap.values());

    const activityMap = new Map<string, { date: string; flashcard: number; mcq: number; exercise: number; quiz: number; total: number; durationMinutes: number }>();
    studyActivityRaw.forEach((item) => {
      const d = item._id.date;
      if (!activityMap.has(d)) {
        activityMap.set(d, { date: d, flashcard: 0, mcq: 0, exercise: 0, quiz: 0, total: 0, durationMinutes: 0 });
      }
      const entry = activityMap.get(d)!;
      const typeKey = (item._id.type as 'flashcard' | 'mcq' | 'exercise' | 'quiz') || 'flashcard';
      if (entry[typeKey] !== undefined) {
        entry[typeKey] += item.count;
      }
      entry.total += item.count;
      entry.durationMinutes += Math.round((item.duration || 0) / 60);
    });
    const studyActivitySeries = Array.from(activityMap.values());

    // Format buckets and distributions
    const streakLabels: Record<string, string> = {
      '0': '0 days',
      '1': '1 - 2 days',
      '3': '3 - 6 days',
      '7': '7 - 13 days',
      '14': '14 - 29 days',
      '30': '30+ days',
    };
    const streakDistribution = streakAgg.map((s) => ({
      range: streakLabels[String(s._id)] || `${s._id} days`,
      count: s.count,
    }));

    const platformDistribution = platformAgg.map((p) => {
      const active30d = active30dPlatformAgg.find((a) => a._id === p._id)?.count || 0;
      return {
        platform: p._id,
        total: p.count,
        active30d,
        percentage: totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        overview: {
          totalUsers,
          newUsersPeriod,
          dau: dauCount,
          wau: wauCount,
          mau: mauCount,
          totalCourses,
          officialCourses,
          aiCourses,
          totalTopics,
          totalFlashcards,
          totalMcqs,
          activeSessions24h,
          totalStudySessions,
          totalStudyDurationMinutes: Math.round((studyDurationAgg[0]?.totalDuration || 0) / 60),
          totalXpEarned: totalXpAgg[0]?.totalXp || 0,
          activeSubscribers: activeSubsCount,
          conversionRate: totalUsers > 0 ? Number(((activeSubsCount / totalUsers) * 100).toFixed(1)) : 0,
          totalRevenueKobo: revenueTotalAgg[0]?.totalAmount || 0,
          periodRevenueKobo: revenuePeriodAgg[0]?.totalAmount || 0,
          totalTransactionsCount: revenueTotalAgg[0]?.count || 0,
          enrolledLearnersDistinct: enrolledLearnersDistinct.length,
          courseEnrollmentCount,
          completedCoursesCount,
        },
        platformDistribution,
        subscriptionBreakdown: {
          byBillingType: subscriptionsByBilling.map((s) => ({ billingType: s._id, count: s.count })),
          byStore: subscriptionsByStore.map((s) => ({ store: s._id, count: s.count })),
          activeSubscribers: activeSubsCount,
          freeUsers: Math.max(0, totalUsers - activeSubsCount),
        },
        learningDistribution: {
          byTrack: trackAgg.map((t) => ({ track: t._id, count: t.count })),
          byLevel: levelAgg.map((l) => ({ level: l._id, count: l.count })),
          streakDistribution,
        },
        aiAndPlayground: {
          aiUsageByType: aiHistoryAgg.map((a) => ({ type: a._id, count: a.count })),
          playgroundByKind: playgroundAgg.map((p) => ({ kind: p._id, count: p.count })),
        },
        charts: {
          userGrowth: userGrowthSeries,
          revenue: revenueSeries,
          studyActivity: studyActivitySeries,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCoursePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await Course.find()
      .select('title slug category track difficulty isFree price isPublished isAiGenerated createdAt')
      .lean();

    const courseIds = courses.map((c) => c._id);

    // Parallel aggregate lookups to avoid N+1 queries
    const [
      topicCounts,
      startedAgg,
      enrolledAgg,
      completedAgg,
      avgProgressAgg,
      sessionScoresAgg,
      flashcardCounts,
      mcqCounts,
    ] = await Promise.all([
      Topic.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      UserProgress.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      UserProgress.aggregate([
        { $match: { course: { $in: courseIds }, 'completedTopics.0': { $exists: true } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      UserProgress.aggregate([
        { $match: { course: { $in: courseIds }, isCompleted: true } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      UserProgress.aggregate([
        { $match: { course: { $in: courseIds }, 'completedTopics.0': { $exists: true } } },
        { $group: { _id: '$course', avgPercent: { $avg: '$percentCompleted' } } },
      ]),
      StudySession.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
          $group: {
            _id: '$course',
            totalSessions: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            mcqCount: { $sum: { $cond: [{ $eq: ['$type', 'mcq'] }, 1, 0] } },
            mcqScoreSum: { $sum: { $cond: [{ $eq: ['$type', 'mcq'] }, '$score', 0] } },
          },
        },
      ]),
      Flashcard.aggregate([
        {
          $lookup: {
            from: 'topics',
            localField: 'topic',
            foreignField: '_id',
            as: 'topicDoc',
          },
        },
        { $unwind: '$topicDoc' },
        { $match: { 'topicDoc.course': { $in: courseIds } } },
        { $group: { _id: '$topicDoc.course', count: { $sum: 1 } } },
      ]),
      MCQ.aggregate([
        {
          $lookup: {
            from: 'topics',
            localField: 'topic',
            foreignField: '_id',
            as: 'topicDoc',
          },
        },
        { $unwind: '$topicDoc' },
        { $match: { 'topicDoc.course': { $in: courseIds } } },
        { $group: { _id: '$topicDoc.course', count: { $sum: 1 } } },
      ]),
    ]);

    const topicCountMap = new Map(topicCounts.map((t) => [String(t._id), t.count]));
    const startedMap = new Map(startedAgg.map((s) => [String(s._id), s.count]));
    const enrolledMap = new Map(enrolledAgg.map((e) => [String(e._id), e.count]));
    const completedMap = new Map(completedAgg.map((c) => [String(c._id), c.count]));
    const avgProgressMap = new Map(avgProgressAgg.map((p) => [String(p._id), Math.round(p.avgPercent || 0)]));
    const sessionMap = new Map(sessionScoresAgg.map((s) => [String(s._id), s]));
    const flashcardMap = new Map(flashcardCounts.map((f) => [String(f._id), f.count]));
    const mcqMap = new Map(mcqCounts.map((m) => [String(m._id), m.count]));

    const performance = courses.map((course) => {
      const cId = String(course._id);
      const sessionData = sessionMap.get(cId);
      const avgScore = sessionData && sessionData.mcqCount > 0
        ? Math.round(sessionData.mcqScoreSum / sessionData.mcqCount)
        : 0;

      return {
        courseId: course._id,
        title: course.title,
        slug: course.slug,
        category: course.category,
        track: course.track || 'tech',
        difficulty: course.difficulty,
        isFree: course.isFree,
        isPublished: course.isPublished,
        isAiGenerated: course.isAiGenerated,
        topicCount: topicCountMap.get(cId) || 0,
        flashcardCount: flashcardMap.get(cId) || 0,
        mcqCount: mcqMap.get(cId) || 0,
        startedCount: startedMap.get(cId) || 0,
        enrollment: enrolledMap.get(cId) || 0, // Users who completed >= 1 lesson
        completedCount: completedMap.get(cId) || 0,
        avgProgress: avgProgressMap.get(cId) || 0,
        avgScore,
        totalStudyDurationMinutes: Math.round((sessionData?.totalDuration || 0) / 60),
      };
    });

    performance.sort((a, b) => b.enrollment - a.enrollment);

    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};

export const getUserGrowth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          date: { $first: '$createdAt' },
        },
      },
      { $sort: { date: 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: growth });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await StudySession.find()
      .populate({ path: 'user', select: 'name firstName lastName email avatar' })
      .populate({ path: 'course', select: 'title slug category track' })
      .populate({ path: 'topic', select: 'title' })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * Detailed single user inspection for admin.
 */
export const getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID.' });
      return;
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const userId = user._id;

    // Fetch subscription, progress, sessions, transactions, AI and playground history in parallel
    const [
      subscription,
      allProgress,
      recentSessions,
      studySummaryAgg,
      transactions,
      aiHistory,
      playgroundProjects,
      aiCoursesCreated,
    ] = await Promise.all([
      Subscription.findOne({ user: userId }).populate('grantedBy', 'name email'),
      UserProgress.find({ user: userId })
        .populate({ path: 'course', select: 'title slug banner track category difficulty isFree' })
        .populate({ path: 'lastTopic', select: 'title' })
        .sort({ lastStudiedAt: -1 }),
      StudySession.find({ user: userId })
        .populate({ path: 'course', select: 'title slug' })
        .populate({ path: 'topic', select: 'title' })
        .sort({ createdAt: -1 })
        .limit(25),
      StudySession.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            totalFlashcards: { $sum: '$flashcardsStudied' },
            totalMcqs: { $sum: '$mcqAnswered' },
            totalMcqCorrect: { $sum: '$mcqCorrect' },
            avgScore: { $avg: '$score' },
          },
        },
      ]),
      Transaction.find({ user: userId })
        .populate('course', 'title slug')
        .sort({ createdAt: -1 }),
      AiHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
      PlaygroundProject.find({ user: userId, deletedAt: null }).sort({ updatedAt: -1 }),
      Course.find({ creator: userId, isAiGenerated: true }).select('title slug isPublished visibility createdAt'),
    ]);

    // Check if subscription is actively valid
    const isProActive = Boolean(
      subscription &&
      subscription.status === 'active' &&
      (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd).getTime() > Date.now())
    );

    // Differentiate enrolled (completed >= 1 topic) vs started-only (0 completed topics)
    const enrolledCourses = allProgress
      .filter((p) => (p.completedTopics?.length || 0) > 0)
      .map((p) => {
        const course = p.course as any;
        return {
          progressId: p._id,
          courseId: course?._id,
          title: course?.title || 'Unknown Course',
          slug: course?.slug,
          banner: course?.banner,
          track: course?.track,
          category: course?.category,
          difficulty: course?.difficulty,
          isFree: course?.isFree,
          completedTopicsCount: p.completedTopics?.length || 0,
          completedChaptersCount: p.completedChapters?.length || 0,
          passedExercisesCount: p.passedExercises?.length || 0,
          percentCompleted: p.percentCompleted || 0,
          isCompleted: p.isCompleted,
          lastStudiedAt: p.lastStudiedAt,
          firstTopicOpenedAt: p.firstTopicOpenedAt,
          lastTopicTitle: (p.lastTopic as any)?.title,
        };
      });

    const startedOnlyCourses = allProgress
      .filter((p) => (p.completedTopics?.length || 0) === 0)
      .map((p) => {
        const course = p.course as any;
        return {
          progressId: p._id,
          courseId: course?._id,
          title: course?.title || 'Unknown Course',
          slug: course?.slug,
          track: course?.track,
          category: course?.category,
          firstTopicOpenedAt: p.firstTopicOpenedAt,
          lastStudiedAt: p.lastStudiedAt,
        };
      });

    // Inferred platform fallback
    let detectedPlatform = user.lastPlatform;
    if (!detectedPlatform) {
      if (subscription?.store === 'app_store') detectedPlatform = 'ios';
      else if (subscription?.store === 'play_store') detectedPlatform = 'android';
      else if (subscription?.store === 'web') detectedPlatform = 'web';
      else detectedPlatform = 'web'; // Default client fallback
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          lastPlatform: detectedPlatform,
          lastActiveAt: user.lastActiveAt || user.lastStudyDate || user.updatedAt,
        },
        subscription: subscription
          ? {
              ...subscription.toObject(),
              isProActive,
            }
          : null,
        isProActive,
        enrolledCourses,
        startedOnlyCourses,
        summary: {
          enrolledCoursesCount: enrolledCourses.length,
          completedCoursesCount: enrolledCourses.filter((c) => c.isCompleted).length,
          startedOnlyCoursesCount: startedOnlyCourses.length,
          totalStudySessions: studySummaryAgg[0]?.totalSessions || 0,
          totalStudyDurationMinutes: Math.round((studySummaryAgg[0]?.totalDuration || 0) / 60),
          totalFlashcardsStudied: studySummaryAgg[0]?.totalFlashcards || 0,
          totalMcqsAnswered: studySummaryAgg[0]?.totalMcqs || 0,
          totalMcqCorrect: studySummaryAgg[0]?.totalMcqCorrect || 0,
          avgMcqScore: Math.round(studySummaryAgg[0]?.avgScore || 0),
          totalTransactions: transactions.length,
          totalSpentKobo: transactions.filter((t) => t.status === 'success').reduce((sum, t) => sum + t.amount, 0),
          aiGenerationsCount: aiHistory.length,
          aiCoursesCount: aiCoursesCreated.length,
          playgroundProjectsCount: playgroundProjects.length,
        },
        recentSessions,
        transactions,
        aiHistory,
        aiCoursesCreated,
        playgroundProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Upgrade user to Pro for a fixed duration.
 */
export const upgradeUserPro = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { durationDays, note, sendEmail: shouldSendEmail = true } = req.body;

    const days = parseInt(durationDays, 10);
    if (!days || days < 1 || days > 3650) {
      res.status(400).json({ success: false, message: 'Valid durationDays between 1 and 3650 is required.' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Determine current period end
    const existing = await Subscription.findOne({ user: user._id });
    const now = new Date();
    const baseDate = existing?.currentPeriodEnd && new Date(existing.currentPeriodEnd).getTime() > now.getTime()
      ? new Date(existing.currentPeriodEnd)
      : now;

    const currentPeriodEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        billingType: 'admin_grant',
        store: 'admin',
        status: 'active',
        currentPeriodEnd,
        grantedBy: req.user!._id,
        grantNote: note ? String(note).trim() : '',
        grantedDays: days,
        grantedAt: now,
      },
      { upsert: true, new: true }
    );

    let emailSent = false;
    let emailError: string | null = null;

    if (shouldSendEmail && user.email) {
      try {
        const name = user.firstName || user.name || 'Learner';
        await sendEmail({
          to: user.email,
          subject: '🎉 Congratulations! You have been upgraded to SabiLearn Pro',
          html: proUpgradeCelebrationHtml({
            name,
            days,
            currentPeriodEnd,
            note: note ? String(note).trim() : undefined,
          }),
          text: proUpgradeCelebrationText({
            name,
            days,
            currentPeriodEnd,
            note: note ? String(note).trim() : undefined,
          }),
        });
        emailSent = true;
      } catch (err) {
        console.error('[Admin Upgrade] Failed to send upgrade email:', err);
        emailError = err instanceof Error ? err.message : 'Failed to send email';
      }
    }

    // Send in-app and push notification
    void sendProUpgradeNotification(user, days, currentPeriodEnd);

    res.status(200).json({
      success: true,
      message: `User upgraded to Pro for ${days} days until ${currentPeriodEnd.toDateString()}.`,
      data: {
        subscription,
        currentPeriodEnd,
        emailSent,
        emailError,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Revoke/cancel an active subscription.
 */
export const revokeSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOneAndUpdate(
      { user: id },
      {
        status: 'cancelled',
        currentPeriodEnd: new Date(),
      },
      { new: true }
    );

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription record not found for this user.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Subscription has been revoked successfully.',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};
