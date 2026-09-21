import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import Course from '../models/course.model';
import Flashcard from '../models/flashcard.model';
import MCQ from '../models/mcq.model';
import StudySession from '../models/studySession.model';
import Topic from '../models/topic.model';
import UserProgress from '../models/userProgress.model';
import { recordStudyDay, announceStreakProgress } from '../services/streak.service';
import { sendAchievement } from '../services/notification.service';
import User from '../models/user.model';

/**
 * Advances the user's streak for today and sends any achievement it earned.
 * Called after every recorded session; a no-op on the day's second session.
 */
async function awardStreakAchievements(userId: mongoose.Types.ObjectId | string): Promise<void> {
  try {
    const result = await recordStudyDay(userId);
    if (result) {
      await announceStreakProgress(userId, result);
    }
  } catch (error) {
    console.error('Failed to record study streak:', error);
  }
}

import XpLog from '../models/xpLog.model';
import Chapter from '../models/chapter.model';

export const getDashboardResumption = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const progressList = await UserProgress.find({ user: userId, isCompleted: false })
      .populate({
        path: 'course',
        match: { isPublished: true },
        select: 'title description banner category difficulty authors isPublished',
      })
      .populate({ path: 'lastChapter', select: 'title' })
      .populate({ path: 'lastTopic', select: 'title' })
      .sort({ lastStudiedAt: -1 });

    const validProgressList = progressList.filter((p) => {
      const course = p.course as any;
      return course && course._id && course.isPublished !== false;
    });

    const totalUnfinished = validProgressList.length;
    const cards = validProgressList.slice(0, 4);

    res.status(200).json({
      success: true,
      data: {
        resumptionCards: cards,
        totalUnfinished,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completeTopic = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { courseId, topicId } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    let earnedXp = 0;
    const existingLog = await XpLog.findOne({ user: userId, sourceType: 'topic', sourceId: topicId });
    if (!existingLog) {
      earnedXp = topic.xp || 50;
      await XpLog.create({
        user: userId,
        xp: earnedXp,
        sourceType: 'topic',
        sourceId: topicId,
        course: courseId,
      });
      await User.findByIdAndUpdate(userId, { $inc: { totalXp: earnedXp } });
    }

    let progress = await UserProgress.findOne({ user: userId, course: courseId });
    if (!progress) {
      progress = new UserProgress({ user: userId, course: courseId, completedTopics: [], completedChapters: [] });
    }

    const topicObjId = new mongoose.Types.ObjectId(topicId);
    if (!progress.completedTopics.some((id) => id.toString() === topicId)) {
      progress.completedTopics.push(topicObjId);
    }

    progress.lastTopic = topicObjId;
    if (topic.chapter) {
      progress.lastChapter = topic.chapter;
    }
    progress.lastStudiedAt = new Date();

    const totalTopicsInCourse = await Topic.countDocuments({ course: courseId });
    if (totalTopicsInCourse > 0) {
      progress.percentCompleted = Math.min(100, Math.round((progress.completedTopics.length / totalTopicsInCourse) * 100));
      if (progress.percentCompleted >= 100) {
        progress.isCompleted = true;
      }
    }

    await progress.save();

    void awardStreakAchievements(userId);

    const user = await User.findById(userId).select('totalXp');

    res.status(200).json({
      success: true,
      message: 'Topic completed successfully.',
      earnedXp,
      totalXp: user?.totalXp || 0,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

export const submitExercise = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { courseId, topicId, chapterId, answers, duration } = req.body;
    // answers: Array of { questionId: string, questionXp: number, isCorrect: boolean }

    if (!Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ success: false, message: 'Answers array is required.' });
      return;
    }

    let progress = await UserProgress.findOne({ user: userId, course: courseId });
    if (!progress) {
      progress = new UserProgress({ user: userId, course: courseId, completedTopics: [], completedChapters: [], passedExercises: [] });
    }

    const exerciseKey = topicId ? `topic_${topicId}` : `chapter_${chapterId}`;
    const alreadyRewarded = progress.passedExercises.includes(exerciseKey);

    let totalEarnedXp = 0;
    let correctCount = 0;

    for (const ans of answers) {
      if (ans.isCorrect) {
        correctCount++;
        const questionId = ans.questionId;
        const qXp = ans.questionXp || 20;

        // Only award XP if the assessment has not been previously completed/rewarded
        if (!alreadyRewarded) {
          const existingLog = await XpLog.findOne({ user: userId, sourceType: 'exercise_question', sourceId: questionId });
          if (!existingLog) {
            totalEarnedXp += qXp;
            await XpLog.create({
              user: userId,
              xp: qXp,
              sourceType: 'exercise_question',
              sourceId: questionId,
              course: courseId,
            });
          }
        }
      }
    }

    if (totalEarnedXp > 0 && !alreadyRewarded) {
      await User.findByIdAndUpdate(userId, { $inc: { totalXp: totalEarnedXp } });
    }

    const scorePercent = Math.round((correctCount / answers.length) * 100);
    const isPassed = scorePercent >= 50;

    if (isPassed && !progress.passedExercises.includes(exerciseKey)) {
      progress.passedExercises.push(exerciseKey);
    }

    if (isPassed && topicId) {
      const topicObjId = new mongoose.Types.ObjectId(topicId);
      if (!progress.completedTopics.some((id) => id.toString() === topicId)) {
        progress.completedTopics.push(topicObjId);
      }
    }

    progress.lastStudiedAt = new Date();
    await progress.save();

    // Record study session so accuracy and study metrics reflect exercise activity
    try {
      await StudySession.create({
        user: userId,
        course: courseId,
        topic: topicId || null,
        type: 'exercise',
        mcqAnswered: answers.length,
        mcqCorrect: correctCount,
        duration: typeof duration === 'number' ? Math.max(0, Math.round(duration)) : 0,
        score: scorePercent,
      });
    } catch (sessionErr) {
      console.error('Failed to log exercise study session:', sessionErr);
    }

    void awardStreakAchievements(userId);

    const user = await User.findById(userId).select('totalXp');

    res.status(200).json({
      success: true,
      scorePercent,
      isPassed,
      alreadyRewarded,
      earnedXp: totalEarnedXp,
      totalXp: user?.totalXp || 0,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

export const savePosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { courseId, chapterId, topicId, contentIndex } = req.body;

    const progress = await UserProgress.findOneAndUpdate(
      { user: userId, course: courseId },
      {
        $set: {
          lastChapter: chapterId || null,
          lastTopic: topicId || null,
          lastContentIndex: contentIndex || 0,
          lastStudiedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const progress = await UserProgress.find({ user: userId })
      .populate({
        path: 'course',
        match: { isPublished: true },
        select: 'title description banner category difficulty isPublished',
      })
      .populate({ path: 'lastTopic', select: 'title description' })
      .sort({ lastStudiedAt: -1 });

    const validProgress = progress
      .filter((p) => {
        const course = p.course as any;
        return course && course._id && course.isPublished !== false;
      })
      .slice(0, 4);

    const totalSessions = await StudySession.countDocuments({ user: userId });
    const totalFlashcards = await StudySession.aggregate([
      { $match: { user: userId._id } },
      { $group: { _id: null, total: { $sum: '$flashcardsStudied' } } },
    ]);

    const accuracyStats = await StudySession.aggregate([
      { $match: { user: userId._id, mcqAnswered: { $gt: 0 } } },
      { $group: { _id: null, totalAnswered: { $sum: '$mcqAnswered' }, totalCorrect: { $sum: '$mcqCorrect' } } },
    ]);

    const avgAccuracy = accuracyStats.length > 0 && accuracyStats[0].totalAnswered > 0
      ? Math.round((accuracyStats[0].totalCorrect / accuracyStats[0].totalAnswered) * 100)
      : 0;

    const user = await User.findById(userId).select('currentStreak longestStreak totalXp');

    res.status(200).json({
      success: true,
      data: {
        continueStudying: validProgress,
        streak: user?.currentStreak ?? 0,
        longestStreak: user?.longestStreak ?? 0,
        totalXp: user?.totalXp ?? 0,
        quickStats: {
          totalSessions,
          totalFlashcards: totalFlashcards[0]?.total || 0,
          avgAccuracy,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const sessions = await StudySession.find({ user: userId }).sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s) => s.createdAt >= today);
    const todayStudyTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    // Read the stored streak rather than recomputing it here: the scheduler and
    // the achievement notifications work off the same field, and two
    // independent calculations would eventually disagree.
    const user = await User.findById(userId).select('currentStreak longestStreak lastStudyDate settings.dailyGoalMinutes totalXp');
    const streak = user?.currentStreak ?? 0;
    const longestStreak = user?.longestStreak ?? 0;
    const totalXp = user?.totalXp ?? 0;
    const dailyGoalMinutes = user?.settings?.dailyGoalMinutes ?? 15;

    const totalFlashcards = sessions.reduce((sum, s) => sum + s.flashcardsStudied, 0);
    const questionSessions = sessions.filter((s) => s.mcqAnswered > 0);
    const totalQuestionsAnswered = questionSessions.reduce((sum, s) => sum + s.mcqAnswered, 0);
    const totalQuestionsCorrect = questionSessions.reduce((sum, s) => sum + s.mcqCorrect, 0);
    const avgAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100) : 0;

    const todayStudyMinutes = Math.round(todayStudyTime / 60);
    const dailyGoalProgress = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayStudyMinutes / dailyGoalMinutes) * 100)) : 0;

    res.status(200).json({
      success: true,
      data: {
        streak,
        longestStreak,
        totalXp,
        todayStudyTime,
        totalSessions: sessions.length,
        totalFlashcards,
        avgAccuracy,
        dailyGoal: {
          minutes: dailyGoalMinutes,
          studiedMinutes: todayStudyMinutes,
          progress: dailyGoalProgress,
          met: todayStudyMinutes >= dailyGoalMinutes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContinueStudying = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const progress = await UserProgress.find({
      user: userId,
      isCompleted: false,
      lastStudiedAt: { $ne: null },
    })
      .populate({
        path: 'course',
        match: { isPublished: true },
        select: 'title description banner category difficulty isPublished',
      })
      .populate({ path: 'lastTopic', select: 'title description' })
      .sort({ lastStudiedAt: -1 });

    const validProgress = progress.filter((p) => {
      const course = p.course as any;
      return course && course._id && course.isPublished !== false;
    });

    res.status(200).json({ success: true, data: validProgress });
  } catch (error) {
    next(error);
  }
};

export const getNeedsImprovement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
};

export const submitFlashcardSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, message: 'Flashcard feature is deprecated.' });
  } catch (error) {
    next(error);
  }
};

export const submitMcqSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { course, topic, mcqAnswered, mcqCorrect, score, duration } = req.body;

    await StudySession.create({
      user: userId,
      course,
      topic,
      type: 'mcq',
      mcqAnswered,
      mcqCorrect,
      score,
      duration,
    });

    void awardStreakAchievements(userId);

    res.status(200).json({ success: true, message: 'MCQ session recorded.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Saves exactly which content block within a topic the learner is on, so
 * "continue studying" can resume mid-lesson instead of restarting the topic.
 * Called frequently (e.g. as the learner scrolls/steps through content), so
 * it deliberately skips the streak/session bookkeeping that the flashcard and
 * MCQ endpoints do.
 */
export const updateContentPosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { course, topic, contentIndex } = req.body;

    const progress = await UserProgress.findOneAndUpdate(
      { user: userId, course, topic },
      { $set: { lastContentIndex: contentIndex, lastStudiedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

/**
 * The learner's saved position within a single topic, so the lesson player can
 * resume at the exact content block instead of restarting from the top.
 */
export const getTopicProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { topicId } = req.params;

    const progress = await UserProgress.findOne({ user: userId, topic: topicId }).select('lastContentIndex isCompleted lastStudiedAt');

    res.status(200).json({ success: true, data: progress || { lastContentIndex: 0, isCompleted: false, lastStudiedAt: null } });
  } catch (error) {
    next(error);
  }
};

/**
 * Percent of a course's topics the learner has completed, for the course-level
 * progress bar shown on the course/dashboard screens.
 */
export const getCourseProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { courseId } = req.params;

    const totalTopics = await Topic.countDocuments({ course: courseId, isPublished: true });
    const completedTopics = await UserProgress.countDocuments({ user: userId, course: courseId, isCompleted: true });

    const percentComplete = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    res.status(200).json({
      success: true,
      data: { course: courseId, totalTopics, completedTopics, percentComplete },
    });
  } catch (error) {
    next(error);
  }
};
