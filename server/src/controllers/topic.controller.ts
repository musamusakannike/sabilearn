import { Request, Response, NextFunction } from 'express';
import Topic from '../models/topic.model';
import Chapter from '../models/chapter.model';
import Course from '../models/course.model';
import Flashcard from '../models/flashcard.model';
import MCQ from '../models/mcq.model';
import UserProgress from '../models/userProgress.model';
import { CourseArchitectService } from '../services/courseArchitect.service';

export const reorderTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topicIds = req.body.topicIds || req.body.order;
    const { chapterId } = req.body;
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      res.status(400).json({ success: false, message: 'topicIds or order array is required.' });
      return;
    }
    await Promise.all(
      topicIds.map((id: string, index: number) => {
        const updateData: Record<string, unknown> = { order: index };
        if (chapterId !== undefined) {
          updateData.chapter = chapterId || null;
        }
        return Topic.findByIdAndUpdate(id, updateData);
      })
    );
    res.status(200).json({ success: true, message: 'Topics reordered successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getTopicsByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topics = await Topic.find({ course: req.params.courseId })
      .select('-contents -exercise')
      .populate({ path: 'flashcardCount' })
      .populate({ path: 'mcqCount' })
      .sort({ order: 1, createdAt: 1 });

    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};

export const getTopicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate({ path: 'flashcardCount' })
      .populate({ path: 'mcqCount' });

    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    // Lazy / On-Demand Content Generation:
    // If the topic was created via the fast course architect (empty contents),
    // generate its full pedagogical contents on first view and cache it to the database.
    if (!topic.contents || topic.contents.length === 0) {
      try {
        const courseDoc = await Course.findById(topic.course).select('title difficulty isAiGenerated');
        const chapterDoc = topic.chapter ? await Chapter.findById(topic.chapter).select('title') : null;

        if (courseDoc && (courseDoc.isAiGenerated || (topic.subConcepts && topic.subConcepts.length > 0))) {
          const generatedTopicData = await CourseArchitectService.generateTopicContent({
            courseTitle: courseDoc.title || 'Course',
            chapterTitle: chapterDoc?.title || 'Chapter',
            topicTitle: topic.title,
            topicDescription: topic.description || '',
            subConcepts: topic.subConcepts || [],
            hasCodingTask: topic.hasCodingTask,
            practiceTaskSummary: topic.practiceTaskSummary,
            order: topic.order || 0,
            difficulty: courseDoc.difficulty || 'beginner',
          });

          if (generatedTopicData?.contents && generatedTopicData.contents.length > 0) {
            topic.contents = generatedTopicData.contents as any;
            topic.isGenerated = true;
            topic.xp = topic.xp || 50;
            await topic.save();
          }
        }
      } catch (genErr: any) {
        console.error(`On-demand topic generation error for topic [${topic._id}]:`, genErr.message);
      }
    }

    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);

    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    await Flashcard.deleteMany({ topic: req.params.id });
    await MCQ.deleteMany({ topic: req.params.id });
    await UserProgress.deleteMany({ topic: req.params.id });

    res.status(200).json({ success: true, message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
