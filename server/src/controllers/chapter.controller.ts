import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Chapter from '../models/chapter.model';
import Topic from '../models/topic.model';
import UserProgress from '../models/userProgress.model';
import Course from '../models/course.model';
import { CourseArchitectService } from '../services/courseArchitect.service';

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

export const getChaptersByCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 });
    const topics = await Topic.find({ course: courseId }).select('-contents').sort({ order: 1 });

    let userProgress = null;
    if (userId) {
      userProgress = await UserProgress.findOne({ user: userId, course: courseId });
    }

    const completedTopicIds = new Set((userProgress?.completedTopics || []).map((id) => id.toString()));
    const passedExerciseIds = new Set(userProgress?.passedExercises || []);

    // Helper to check if a topic is completed/passed
    const isTopicDone = (t: any): boolean => {
      const topicIdStr = t._id.toString();
      if (completedTopicIds.has(topicIdStr)) return true;
      if (t.exercise && t.exercise.questions && t.exercise.questions.length > 0) {
        return passedExerciseIds.has(`topic_${topicIdStr}`);
      }
      return false;
    };

    // Calculate lock/unlock status sequentially across chapters and topics
    let previousTopicCompleted = true; // First topic of first chapter starts unlocked!
    let previousChapterCompleted = true; // First chapter starts unlocked!

    const chaptersWithStatus = chapters.map((chapter, chapterIdx) => {
      const chapterTopics = topics.filter((t) => t.chapter?.toString() === chapter._id.toString() || (chapterIdx === 0 && !t.chapter));

      const isChapterUnlocked = chapterIdx === 0 ? true : previousChapterCompleted;
      let chapterCompletedCount = 0;

      const topicsWithStatus = chapterTopics.map((topic, topicIdx) => {
        const topicIdStr = topic._id.toString();
        const isCompleted = completedTopicIds.has(topicIdStr) || passedExerciseIds.has(`topic_${topicIdStr}`);

        let isUnlocked = false;
        if (!isChapterUnlocked) {
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
          ...topic.toObject(),
          isUnlocked,
          isCompleted,
          inProgress: userProgress?.lastTopic?.toString() === topicIdStr,
        };
      });

      const totalTopicsInChapter = chapterTopics.length;
      const chapterPercent = totalTopicsInChapter > 0 ? Math.round((chapterCompletedCount / totalTopicsInChapter) * 100) : 0;
      const isChapterCompleted = totalTopicsInChapter > 0 && chapterCompletedCount === totalTopicsInChapter;

      previousChapterCompleted = isChapterCompleted;

      let status: 'completed' | 'inprogress' | 'locked' = 'locked';
      if (!isChapterUnlocked) {
        status = 'locked';
      } else if (isChapterCompleted) {
        status = 'completed';
      } else {
        status = 'inprogress';
      }

      return {
        ...chapter.toObject(),
        status,
        progressPercent: chapterPercent,
        topics: topicsWithStatus,
      };
    });

    res.status(200).json({
      success: true,
      data: chaptersWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { course, title, description, order, exercise } = req.body;
    const chapter = await Chapter.create({ course, title, description, order, exercise });
    res.status(201).json({ success: true, data: chapter });
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, order, exercise } = req.body;
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { title, description, order, exercise },
      { new: true, runValidators: true }
    );
    if (!chapter) {
      res.status(404).json({ success: false, message: 'Chapter not found.' });
      return;
    }
    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    next(error);
  }
};

export const reorderChapters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chapterIds = req.body.chapterIds || req.body.order;
    if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
      res.status(400).json({ success: false, message: 'chapterIds or order array is required.' });
      return;
    }
    await Promise.all(
      chapterIds.map((id: string, index: number) =>
        Chapter.findByIdAndUpdate(id, { order: index })
      )
    );
    res.status(200).json({ success: true, message: 'Chapters reordered successfully.' });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      res.status(404).json({ success: false, message: 'Chapter not found.' });
      return;
    }
    await Topic.deleteMany({ chapter: req.params.id });
    res.status(200).json({ success: true, message: 'Chapter deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chapters/:id/assessment
 * Get chapter capstone assessment, generating it on-demand if it hasn't been created yet.
 */
export const getChapterAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      res.status(404).json({ success: false, message: 'Chapter not found.' });
      return;
    }

    // If assessment already exists, return it
    if (chapter.exercise && chapter.exercise.questions && chapter.exercise.questions.length > 0) {
      res.status(200).json({ success: true, data: chapter.exercise });
      return;
    }

    // Generate on-demand if AI-generated or has capstoneGoal
    const course = await Course.findById(chapter.course).select('title difficulty isAiGenerated');
    const topics = await Topic.find({ chapter: chapter._id }).select('title description');

    if (course && (course.isAiGenerated || chapter.capstoneGoal)) {
      try {
        const generatedExercise = await CourseArchitectService.generateCapstoneAssessment({
          courseTitle: course.title || 'Course',
          chapterTitle: chapter.title,
          chapterDescription: chapter.description || '',
          capstoneGoal: chapter.capstoneGoal || 'Evaluate mastery of chapter topics',
          topics: topics.map((t) => ({ title: t.title, description: t.description })),
          difficulty: chapter.capstoneDifficulty || 'medium',
        });

        if (generatedExercise && generatedExercise.questions?.length > 0) {
          chapter.exercise = generatedExercise;
          await chapter.save();
          res.status(200).json({ success: true, data: chapter.exercise });
          return;
        }
      } catch (genErr: any) {
        console.error(`On-demand capstone generation error for chapter [${chapter._id}]:`, genErr.message);
      }
    }

    res.status(200).json({ success: true, data: chapter.exercise || { title: '', instructions: '', questions: [] } });
  } catch (error) {
    next(error);
  }
};

