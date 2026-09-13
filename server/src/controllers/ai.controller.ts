import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DeepSeekService } from '../services/deepseek.service';
import AiHistory from '../models/aiHistory.model';
import Course from '../models/course.model';
import Topic from '../models/topic.model';

/**
 * Helper to handle SSE streaming setup or standard JSON output.
 */
function isStreamRequested(req: AuthenticatedRequest): boolean {
  if (req.body.stream === false) return false;
  return true; // Default to streaming for AI endpoints
}

function setupSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Flush headers if method is available
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }
}

/**
 * POST /api/v1/ai/summarize
 */
export const summarize = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    if (stream) {
      setupSSEHeaders(res);
      let accumulated = '';

      await DeepSeekService.summarize(text, (chunk) => {
        accumulated += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      const history = await AiHistory.create({
        user: userId,
        type: 'summarize',
        title: `Summary: ${text.slice(0, 30)}...`,
        prompt: text,
        result: accumulated,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: accumulated,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await DeepSeekService.summarize(text);
      const history = await AiHistory.create({
        user: userId,
        type: 'summarize',
        title: `Summary: ${text.slice(0, 30)}...`,
        prompt: text,
        result,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/generate-quiz
 */
export const generateQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topic, count = 3 } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    if (stream) {
      setupSSEHeaders(res);

      const questions = await DeepSeekService.generateQuiz(topic, count, (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      const history = await AiHistory.create({
        user: userId,
        type: 'quiz',
        title: `Quiz: ${topic}`,
        prompt: topic,
        metadata: { count },
        result: questions,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: questions,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const questions = await DeepSeekService.generateQuiz(topic, count);
      const history = await AiHistory.create({
        user: userId,
        type: 'quiz',
        title: `Quiz: ${topic}`,
        prompt: topic,
        metadata: { count },
        result: questions,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result: questions,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/generate-flashcards
 */
export const generateFlashcards = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topic, count = 3 } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    if (stream) {
      setupSSEHeaders(res);

      const flashcards = await DeepSeekService.generateFlashcards(topic, count, (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      const history = await AiHistory.create({
        user: userId,
        type: 'flashcards',
        title: `Flashcards: ${topic}`,
        prompt: topic,
        metadata: { count },
        result: flashcards,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: flashcards,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const flashcards = await DeepSeekService.generateFlashcards(topic, count);
      const history = await AiHistory.create({
        user: userId,
        type: 'flashcards',
        title: `Flashcards: ${topic}`,
        prompt: topic,
        metadata: { count },
        result: flashcards,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result: flashcards,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/qa
 */
export const qa = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { question, context } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    if (stream) {
      setupSSEHeaders(res);
      let accumulated = '';

      await DeepSeekService.askQA(question, context, (chunk) => {
        accumulated += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      const history = await AiHistory.create({
        user: userId,
        type: 'qa',
        title: `Q&A: ${question.slice(0, 30)}...`,
        prompt: question,
        metadata: { context },
        result: accumulated,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: accumulated,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await DeepSeekService.askQA(question, context);
      const history = await AiHistory.create({
        user: userId,
        type: 'qa',
        title: `Q&A: ${question.slice(0, 30)}...`,
        prompt: question,
        metadata: { context },
        result,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/explain
 * In-Lesson Contextual AI Tutor
 */
export const explainLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mode, topicTitle, stepTitle, stepContent, question } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    const titlePrefix =
      mode === 'eli5'
        ? 'ELI5 Explanation'
        : mode === 'analogy'
        ? 'Relatable Analogy'
        : 'In-Lesson Q&A';

    if (stream) {
      setupSSEHeaders(res);
      let accumulated = '';

      await DeepSeekService.explainLessonStep(
        { mode, topicTitle, stepTitle, stepContent, question },
        (chunk) => {
          accumulated += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      const history = await AiHistory.create({
        user: userId,
        type: 'tutor_explain',
        title: `${titlePrefix}: ${stepTitle || topicTitle || 'Step'}`,
        prompt: question || `${mode.toUpperCase()} explanation for ${stepTitle || topicTitle}`,
        metadata: { mode, topicTitle, stepTitle, stepContentSnippet: stepContent?.slice(0, 150) },
        result: accumulated,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: accumulated,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await DeepSeekService.explainLessonStep({
        mode,
        topicTitle,
        stepTitle,
        stepContent,
        question,
      });

      const history = await AiHistory.create({
        user: userId,
        type: 'tutor_explain',
        title: `${titlePrefix}: ${stepTitle || topicTitle || 'Step'}`,
        prompt: question || `${mode.toUpperCase()} explanation for ${stepTitle || topicTitle}`,
        metadata: { mode, topicTitle, stepTitle, stepContentSnippet: stepContent?.slice(0, 150) },
        result,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/courses/:courseId/quiz
 */
export const generateCourseQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { count = 5, difficulty = 'medium' } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    const topics = await Topic.find({ course: courseId }).select('title description');
    const topicsSummary = topics.map((t) => `- ${t.title}: ${t.description}`).join('\n');
    const contextDescription = `Description: ${course.description}\nCategory: ${course.category}\nDifficulty: ${course.difficulty}\nTopics:\n${topicsSummary}`;

    if (stream) {
      setupSSEHeaders(res);

      const questions = await DeepSeekService.generateQuizForContext(
        'course',
        course.title,
        contextDescription,
        count,
        difficulty,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      const history = await AiHistory.create({
        user: userId,
        type: 'course_quiz',
        title: `Course Quiz: ${course.title}`,
        prompt: `Generate ${count} ${difficulty} quiz questions for course: ${course.title}`,
        metadata: { courseId: course._id, courseTitle: course.title, count, difficulty },
        result: questions,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: questions,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const questions = await DeepSeekService.generateQuizForContext(
        'course',
        course.title,
        contextDescription,
        count,
        difficulty
      );

      const history = await AiHistory.create({
        user: userId,
        type: 'course_quiz',
        title: `Course Quiz: ${course.title}`,
        prompt: `Generate ${count} ${difficulty} quiz questions for course: ${course.title}`,
        metadata: { courseId: course._id, courseTitle: course.title, count, difficulty },
        result: questions,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result: questions,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/topics/:topicId/quiz
 */
export const generateTopicQuiz = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    const { count = 3, difficulty = 'medium' } = req.body;
    const userId = req.user!._id;
    const stream = isStreamRequested(req);

    const topic = await Topic.findById(topicId);
    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    const textContentBlocks = topic.contents
      .filter((c) => c.type === 'text' || c.type === 'latex' || c.type === 'code')
      .map((c) => c.content)
      .join('\n\n');

    const contextDescription = `Description: ${topic.description}\nContent:\n${textContentBlocks || topic.description}`;

    if (stream) {
      setupSSEHeaders(res);

      const questions = await DeepSeekService.generateQuizForContext(
        'topic',
        topic.title,
        contextDescription,
        count,
        difficulty,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      const history = await AiHistory.create({
        user: userId,
        type: 'topic_quiz',
        title: `Topic Quiz: ${topic.title}`,
        prompt: `Generate ${count} ${difficulty} quiz questions for topic: ${topic.title}`,
        metadata: {
          topicId: topic._id,
          topicTitle: topic.title,
          courseId: topic.course,
          count,
          difficulty,
        },
        result: questions,
      });

      res.write(
        `data: ${JSON.stringify({
          done: true,
          historyId: history._id,
          result: questions,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const questions = await DeepSeekService.generateQuizForContext(
        'topic',
        topic.title,
        contextDescription,
        count,
        difficulty
      );

      const history = await AiHistory.create({
        user: userId,
        type: 'topic_quiz',
        title: `Topic Quiz: ${topic.title}`,
        prompt: `Generate ${count} ${difficulty} quiz questions for topic: ${topic.title}`,
        metadata: {
          topicId: topic._id,
          topicTitle: topic.title,
          courseId: topic.course,
          count,
          difficulty,
        },
        result: questions,
      });

      res.status(200).json({
        success: true,
        data: {
          historyId: history._id,
          type: history.type,
          prompt: history.prompt,
          result: questions,
          createdAt: history.createdAt,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/history
 */
export const getHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { type, page = 1, limit = 10 } = req.query;

    const query: any = { user: userId };
    if (type && typeof type === 'string') {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      AiHistory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AiHistory.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/history/:id
 */
export const getHistoryById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const item = await AiHistory.findOne({ _id: id, user: userId });
    if (!item) {
      res.status(404).json({ success: false, message: 'AI generation history item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/ai/history/:id
 */
export const deleteHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const deleted = await AiHistory.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'AI generation history item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'AI generation history item deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
