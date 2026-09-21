import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DocumentProcessorService } from '../services/documentProcessor.service';
import {
  CourseArchitectService,
  CoursePlan,
  GeneratedChapterData,
} from '../services/courseArchitect.service';
import { getUserQuotaStats } from '../middlewares/courseQuota.middleware';
import Course, { ICourse, ICourseAuthor } from '../models/course.model';
import Chapter from '../models/chapter.model';
import Topic from '../models/topic.model';
import Category from '../models/category.model';
import UserProgress from '../models/userProgress.model';
import AiHistory from '../models/aiHistory.model';
import { uploadToR2 } from '../utils/r2.util';

interface MulterRequest extends AuthenticatedRequest {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

/**
 * Helper to generate a URL-safe random share slug.
 */
function generateShareSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${base || 'course'}-${randomSuffix}`;
}

/**
 * GET /api/v1/ai/course-architect/quota
 * Get user's remaining daily AI course generation quota.
 */
export const getQuota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const stats = await getUserQuotaStats(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/course-architect/plan
 * Process uploaded files and generate structured course plan.
 */
export const generatePlan = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseTitle, userGuidePrompt, difficulty = 'beginner', clarificationAnswers } = req.body;

    let filesList: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      filesList = req.files;
    } else if (req.files && typeof req.files === 'object') {
      filesList = Object.values(req.files).flat();
    }

    let parsedClarifications = clarificationAnswers;
    if (typeof clarificationAnswers === 'string') {
      try {
        parsedClarifications = JSON.parse(clarificationAnswers);
      } catch {
        parsedClarifications = undefined;
      }
    }

    // 1. Process documents, extract text, and rasterize/collect image attachments
    const processed = await DocumentProcessorService.processUploads(filesList, userGuidePrompt);

    // 2. Generate plan with DeepSeek
    const plan = await CourseArchitectService.generatePlan({
      courseTitle,
      userGuidePrompt,
      extractedText: processed.extractedText,
      imageAttachments: processed.imageAttachments,
      difficulty,
      clarificationAnswers: parsedClarifications,
    });

    res.status(200).json({
      success: true,
      data: {
        plan,
        fileSummaries: processed.fileSummaries,
        detectedTypes: processed.detectedTypes,
        totalPages: processed.totalPages,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/course-architect/topic
 * Generate rich content for a single topic.
 */
export const generateTopic = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      courseTitle,
      chapterTitle,
      topicTitle,
      topicDescription,
      subConcepts = [],
      hasCodingTask = false,
      practiceTaskSummary = '',
      order = 0,
      difficulty = 'beginner',
    } = req.body;

    if (!topicTitle) {
      res.status(400).json({ success: false, message: 'topicTitle is required.' });
      return;
    }

    const topic = await CourseArchitectService.generateTopicContent({
      courseTitle,
      chapterTitle,
      topicTitle,
      topicDescription,
      subConcepts: Array.isArray(subConcepts) ? subConcepts : [],
      hasCodingTask: Boolean(hasCodingTask),
      practiceTaskSummary,
      order: Number(order) || 0,
      difficulty,
    });

    res.status(200).json({
      success: true,
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/course-architect/capstone
 * Generate Chapter Capstone Assessment.
 */
export const generateCapstone = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      courseTitle,
      chapterTitle,
      chapterDescription = '',
      capstoneGoal = '',
      topics = [],
      difficulty = 'medium',
    } = req.body;

    if (!chapterTitle) {
      res.status(400).json({ success: false, message: 'chapterTitle is required.' });
      return;
    }

    const exercise = await CourseArchitectService.generateCapstoneAssessment({
      courseTitle,
      chapterTitle,
      chapterDescription,
      capstoneGoal,
      topics: Array.isArray(topics) ? topics : [],
      difficulty,
    });

    res.status(200).json({
      success: true,
      data: { exercise },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/course-architect/save
 * Save the completed course plan, chapters, topics, and exercises to the database.
 */
export const saveCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      plan,
      generatedChapters,
      visibility = 'private',
      banner = '',
    }: {
      plan: CoursePlan;
      generatedChapters: GeneratedChapterData[];
      visibility?: 'public' | 'unlisted' | 'private';
      banner?: string;
    } = req.body;

    if (!plan || !generatedChapters || !Array.isArray(generatedChapters) || generatedChapters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Course plan and generated chapters are required.',
      });
      return;
    }

    // 1. Ensure Category exists
    const categoryName = plan.category || 'General Studies';
    let categoryDoc = await Category.findOne({
      name: { $regex: `^${categoryName.trim()}$`, $options: 'i' },
    });
    if (!categoryDoc) {
      categoryDoc = await Category.create({
        name: categoryName.trim(),
        description: `Explore courses in ${categoryName.trim()}.`,
      });
    }

    // 2. Prepare author details
    const authorName = user.name || `${user.firstName} ${user.lastName}`.trim() || 'SabiLearn Creator';
    const authorAvatar =
      user.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

    const defaultBanner =
      banner ||
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80';

    const shareSlug = generateShareSlug(plan.title);

    // 3. Create Course Document
    const course = await Course.create({
      title: plan.title,
      description: plan.description,
      longDescription: plan.longDescription || plan.description,
      banner: defaultBanner,
      category: categoryDoc.name,
      difficulty: plan.difficulty || 'beginner',
      authors: [
        {
          name: authorName,
          role: 'Course Creator',
          avatar: authorAvatar,
          bio: 'Created with SabiLearn AI Course Architect.',
        },
      ],
      whatYouWillLearn: plan.whatYouWillLearn || [],
      prerequisites: plan.prerequisites || [],
      isPublished: visibility === 'public',
      isFree: true,
      price: 0,
      order: 100,
      isAiGenerated: true,
      creator: user._id,
      visibility,
      shareSlug,
      sourceSummary: `Generated from plan with ${generatedChapters.length} chapters.`,
    });

    // 4. Save Chapters, Capstones & Topics
    let totalChapters = 0;
    let totalTopics = 0;

    for (let chIdx = 0; chIdx < generatedChapters.length; chIdx++) {
      const chData = generatedChapters[chIdx];
      const createdChapter = await Chapter.create({
        course: course._id,
        title: chData.title,
        description: chData.description || '',
        order: chIdx,
        exercise: chData.exercise,
      });
      totalChapters++;

      for (let tIdx = 0; tIdx < chData.topics.length; tIdx++) {
        const tData = chData.topics[tIdx];
        await Topic.create({
          course: course._id,
          chapter: createdChapter._id,
          title: tData.title,
          description: tData.description || '',
          order: tIdx,
          contents: tData.contents,
          xp: 50,
          isPublished: true,
        });
        totalTopics++;
      }
    }

    // 5. Initialize user progress / auto-enroll the creator
    const firstTopic = await Topic.findOne({ course: course._id }).sort({ order: 1 });
    await UserProgress.findOneAndUpdate(
      { user: user._id, course: course._id },
      {
        $setOnInsert: {
          user: user._id,
          course: course._id,
          lastTopic: firstTopic?._id,
          completedTopics: [],
          percentCompleted: 0,
        },
      },
      { upsert: true, new: true }
    );

    // 6. Record Generation in AI History
    await AiHistory.create({
      user: user._id,
      type: 'course_generation',
      title: `Generated Course: ${course.title}`,
      prompt: plan.title,
      metadata: {
        courseId: course._id,
        category: course.category,
        visibility: course.visibility,
        totalChapters,
        totalTopics,
        shareSlug: course.shareSlug,
      },
      result: {
        courseId: course._id,
        chaptersCount: totalChapters,
        topicsCount: totalTopics,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        courseId: course._id,
        title: course.title,
        shareSlug: course.shareSlug,
        visibility: course.visibility,
        stats: {
          chapters: totalChapters,
          topics: totalTopics,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/course-architect/generate-full
 * 1-click end-to-end course generation and saving.
 */
export const generateFullCourse = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      courseTitle = '',
      userGuidePrompt = '',
      difficulty = 'beginner',
      visibility = 'private',
      banner = '',
    } = req.body;

    let filesList: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      filesList = req.files;
    } else if (req.files && typeof req.files === 'object') {
      filesList = Object.values(req.files).flat();
    }

    // 1. Process documents
    const processed = await DocumentProcessorService.processUploads(filesList, userGuidePrompt);

    // 2. Generate course plan only (fast, 1 LLM call)
    const plan = await CourseArchitectService.generatePlan({
      courseTitle,
      userGuidePrompt,
      extractedText: processed.extractedText,
      imageAttachments: processed.imageAttachments,
      difficulty,
    });

    // 3. Pre-generate only the very first topic so the student can start immediately
    let firstTopicContents: any[] = [];
    const firstChapterPlan = plan.chapters?.[0];
    const firstTopicPlan = firstChapterPlan?.topics?.[0];
    if (firstTopicPlan) {
      try {
        const firstTopicData = await CourseArchitectService.generateTopicContent({
          courseTitle: plan.title,
          chapterTitle: firstChapterPlan.title,
          topicTitle: firstTopicPlan.title,
          topicDescription: firstTopicPlan.description,
          subConcepts: firstTopicPlan.subConcepts,
          hasCodingTask: firstTopicPlan.hasCodingTask,
          practiceTaskSummary: firstTopicPlan.practiceTaskSummary,
          order: 0,
          difficulty: plan.difficulty,
        });
        firstTopicContents = firstTopicData.contents || [];
      } catch (e: any) {
        console.warn('Failed to pre-generate first topic, will generate on-demand:', e.message);
      }
    }

    // 4. Save to database
    let bannerUrl = typeof banner === 'string' ? banner : '';
    const bannerFile = filesList.find((f) => f.fieldname === 'banner');
    if (bannerFile) {
      const fileKey = `courses/banners/${Date.now()}-${bannerFile.originalname.replace(/\s+/g, '-')}`;
      bannerUrl = await uploadToR2(bannerFile.buffer, fileKey, bannerFile.mimetype);
    }

    // 5. Create category if needed
    const categoryName = plan.category || 'General Studies';
    let categoryDoc = await Category.findOne({
      name: { $regex: `^${categoryName.trim()}$`, $options: 'i' },
    });
    if (!categoryDoc) {
      categoryDoc = await Category.create({
        name: categoryName.trim(),
        description: `Explore courses in ${categoryName.trim()}.`,
      });
    }

    const authorName = user.name || `${user.firstName} ${user.lastName}`.trim() || 'SabiLearn Creator';
    const authorAvatar =
      user.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

    const defaultBanner =
      bannerUrl ||
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80';

    const shareSlug = generateShareSlug(plan.title);

    const course = await Course.create({
      title: plan.title,
      description: plan.description,
      longDescription: plan.longDescription || plan.description,
      banner: defaultBanner,
      category: categoryDoc.name,
      difficulty: plan.difficulty || 'beginner',
      authors: [
        {
          name: authorName,
          role: 'Course Creator',
          avatar: authorAvatar,
          bio: 'Created with SabiLearn AI Course Architect.',
        },
      ],
      whatYouWillLearn: plan.whatYouWillLearn || [],
      prerequisites: plan.prerequisites || [],
      isPublished: visibility === 'public',
      isFree: true,
      price: 0,
      order: 100,
      isAiGenerated: true,
      creator: user._id,
      visibility,
      shareSlug,
      sourceSummary: `Generated from ${processed.fileSummaries.length} files (${processed.totalPages} pages).`,
    });

    let totalChapters = 0;
    let totalTopics = 0;

    for (let chIdx = 0; chIdx < plan.chapters.length; chIdx++) {
      const chData = plan.chapters[chIdx];
      const createdChapter = await Chapter.create({
        course: course._id,
        title: chData.title,
        description: chData.description || '',
        order: chIdx,
        capstoneGoal: chData.capstoneGoal || 'Evaluate mastery of chapter topics',
        capstoneDifficulty: plan.capstoneDifficulty || 'medium',
      });
      totalChapters++;

      for (let tIdx = 0; tIdx < chData.topics.length; tIdx++) {
        const tData = chData.topics[tIdx];
        const isFirst = chIdx === 0 && tIdx === 0;
        const contents = isFirst && firstTopicContents.length > 0 ? firstTopicContents : [];
        const isGenerated = contents.length > 0;

        await Topic.create({
          course: course._id,
          chapter: createdChapter._id,
          title: tData.title,
          description: tData.description || '',
          subConcepts: tData.subConcepts || [],
          hasCodingTask: Boolean(tData.hasCodingTask),
          practiceTaskSummary: tData.practiceTaskSummary || '',
          order: tIdx,
          contents,
          isGenerated,
          xp: 50,
          isPublished: true,
        });
        totalTopics++;
      }
    }

    // Auto-enroll user
    const firstTopic = await Topic.findOne({ course: course._id }).sort({ order: 1 });
    await UserProgress.findOneAndUpdate(
      { user: user._id, course: course._id },
      {
        $setOnInsert: {
          user: user._id,
          course: course._id,
          lastTopic: firstTopic?._id,
          completedTopics: [],
          percentCompleted: 0,
        },
      },
      { upsert: true, new: true }
    );

    // Record AI History
    await AiHistory.create({
      user: user._id,
      type: 'course_generation',
      title: `Generated Course: ${course.title}`,
      prompt: courseTitle || userGuidePrompt || 'One-click course generation',
      metadata: {
        courseId: course._id,
        category: course.category,
        visibility: course.visibility,
        totalChapters,
        totalTopics,
        shareSlug: course.shareSlug,
        filesCount: filesList.length,
      },
      result: {
        courseId: course._id,
        chaptersCount: totalChapters,
        topicsCount: totalTopics,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        courseId: course._id,
        title: course.title,
        shareSlug: course.shareSlug,
        visibility: course.visibility,
        stats: {
          chapters: totalChapters,
          topics: totalTopics,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/courses/public
 * Public community discovery endpoint for AI-generated public courses.
 */
export const getPublicAiCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string, 10) || 12));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      isAiGenerated: true,
      visibility: 'public',
    };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.difficulty && req.query.difficulty !== 'all') {
      filter.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate({ path: 'topicCount' })
        .populate({ path: 'creator', select: 'name firstName lastName avatar' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/courses/my-courses
 * Get all AI courses generated by the authenticated user.
 */
export const getMyAiCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      creator: userId,
      isAiGenerated: true,
    };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate({ path: 'topicCount' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/courses/:idOrSlug
 * Get a specific AI-generated course by ID or shareSlug with chapters and topics.
 */
export const getAiCourseByIdOrSlug = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = mongoose.isValidObjectId(idOrSlug);

    const query = isObjectId ? { _id: idOrSlug, isAiGenerated: true } : { shareSlug: idOrSlug, isAiGenerated: true };

    const course = await Course.findOne(query)
      .populate({ path: 'creator', select: 'name firstName lastName avatar' })
      .populate({
        path: 'chapters',
        options: { sort: { order: 1 } },
        populate: {
          path: 'topics',
          options: { sort: { order: 1 } },
          select: 'title description isPublished order xp contents',
        },
      });

    if (!course) {
      res.status(404).json({ success: false, message: 'AI Generated Course not found.' });
      return;
    }

    // Access check:
    // If public or unlisted, anyone with the link can view
    // If private, only the creator or platform admin can view
    const isPublicOrUnlisted = course.visibility === 'public' || course.visibility === 'unlisted';
    const isCreator = req.user && course.creator && String(course.creator._id || course.creator) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isPublicOrUnlisted && !isCreator && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'This course is private and can only be viewed by its creator.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/ai/courses/:id/visibility
 * Update visibility of an AI-generated course ('public' | 'unlisted' | 'private').
 */
export const updateCourseVisibility = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    const user = req.user!;

    if (!['public', 'unlisted', 'private'].includes(visibility)) {
      res.status(400).json({
        success: false,
        message: 'Invalid visibility. Must be one of: "public", "unlisted", "private".',
      });
      return;
    }

    const course = await Course.findOne({ _id: id, isAiGenerated: true });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    // Only creator or admin can change visibility
    const isCreator = course.creator && String(course.creator) === String(user._id);
    if (!isCreator && user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to modify this course.' });
      return;
    }

    course.visibility = visibility;
    course.isPublished = visibility === 'public';
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course visibility updated to ${visibility}.`,
      data: {
        courseId: course._id,
        visibility: course.visibility,
        shareSlug: course.shareSlug,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/ai/courses/:id
 * Delete an AI generated course by creator or admin.
 */
export const deleteAiCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const course = await Course.findOne({ _id: id, isAiGenerated: true });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    const isCreator = course.creator && String(course.creator) === String(user._id);
    if (!isCreator && user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this course.' });
      return;
    }

    const topics = await Topic.find({ course: course._id }).select('_id');
    const topicIds = topics.map((t) => t._id);

    await Topic.deleteMany({ course: course._id });
    await Chapter.deleteMany({ course: course._id });
    await UserProgress.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);

    res.status(200).json({
      success: true,
      message: 'AI generated course deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
