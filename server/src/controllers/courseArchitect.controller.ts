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
import { courseGenerationQueue } from '../services/courseGenerationQueue.service';

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
    const {
      courseTitle,
      userGuidePrompt,
      difficulty = 'beginner',
      clarificationAnswers,
      startPage,
      endPage,
    } = req.body;

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

    const pageRange =
      startPage || endPage
        ? {
            start: startPage ? parseInt(startPage, 10) : undefined,
            end: endPage ? parseInt(endPage, 10) : undefined,
          }
        : undefined;

    // 1. Process documents with sanitization, normalization, and page range slicing
    const processed = await DocumentProcessorService.processUploads(
      filesList,
      userGuidePrompt,
      undefined,
      pageRange
    );

    // 2. Generate plan with Phase 1 Macro Document Indexing covering 100% of chunks
    const planResult = await CourseArchitectService.generatePlan({
      courseTitle,
      userGuidePrompt,
      extractedText: processed.extractedText,
      imageAttachments: processed.imageAttachments,
      difficulty,
      clarificationAnswers: parsedClarifications,
      chunks: processed.chunks,
    });

    res.status(200).json({
      success: true,
      data: {
        plan: planResult,
        documentIndex: planResult.documentIndex,
        chunks: planResult.chunks,
        extractedText: processed.extractedText,
        fileSummaries: processed.fileSummaries,
        detectedTypes: processed.detectedTypes,
        totalPages: processed.totalPages,
        isLargeDocument: processed.isLargeDocument,
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
      category = '',
      sourceContext = '',
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
      category,
      sourceContext,
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
      category = '',
      sourceContext = '',
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
      category,
      sourceContext,
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
      sourceContext = '',
    }: {
      plan: CoursePlan;
      generatedChapters: GeneratedChapterData[];
      visibility?: 'public' | 'unlisted' | 'private';
      banner?: string;
      sourceContext?: string;
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
      sourceContext: sourceContext || '',
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

interface FullCourseGenerationArgs {
  jobId?: string;
  user: any;
  courseTitle: string;
  userGuidePrompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'public' | 'unlisted' | 'private';
  banner: string;
  filesList: Express.Multer.File[];
  processed: any;
}

async function executeFullCourseGeneration(args: FullCourseGenerationArgs) {
  const {
    jobId,
    user,
    courseTitle,
    userGuidePrompt,
    difficulty,
    visibility,
    banner,
    filesList,
    processed,
  } = args;

  if (jobId) {
    courseGenerationQueue.updateProgress(
      jobId,
      25,
      'Phase 1: Analyzing document structure and building Annotated Index...'
    );
  }

  // 1. Generate plan with Phase 1 Macro Document Indexing covering 100% of chunks
  const planResult = await CourseArchitectService.generatePlan({
    courseTitle,
    userGuidePrompt,
    extractedText: processed.extractedText,
    imageAttachments: processed.imageAttachments,
    difficulty,
    chunks: processed.chunks,
  });

  if (jobId) {
    courseGenerationQueue.updateProgress(
      jobId,
      50,
      'Phase 1: Curriculum structured with 100% document coverage guaranteed...'
    );
  }

  // 2. Pre-generate only the very first topic with Phase 2 Micro targeted context injection
  let firstTopicContents: any[] = [];
  const firstChapterPlan = planResult.chapters?.[0];
  const firstTopicPlan = firstChapterPlan?.topics?.[0];
  if (firstTopicPlan) {
    if (jobId) {
      courseGenerationQueue.updateProgress(
        jobId,
        70,
        'Phase 2: Generating opening lesson with targeted chunk grounding...'
      );
    }
    try {
      const firstTopicData = await CourseArchitectService.generateTopicContent({
        courseTitle: planResult.title,
        chapterTitle: firstChapterPlan.title,
        topicTitle: firstTopicPlan.title,
        topicDescription: firstTopicPlan.description,
        subConcepts: firstTopicPlan.subConcepts,
        hasCodingTask: firstTopicPlan.hasCodingTask,
        practiceTaskSummary: firstTopicPlan.practiceTaskSummary,
        order: 0,
        difficulty: planResult.difficulty,
        category: planResult.category,
        sourceContext: processed.extractedText,
        chunks: planResult.chunks,
        documentIndex: planResult.documentIndex,
        sectionId: firstChapterPlan.sourceSectionId,
        sourceChunkIndices: firstChapterPlan.chunkIndices,
        chapterIndex: 0,
        topicIndex: 0,
      });
      firstTopicContents = firstTopicData.contents || [];
    } catch (e: any) {
      console.warn('Failed to pre-generate first topic, will generate on-demand:', e.message);
    }
  }

  if (jobId) {
    courseGenerationQueue.updateProgress(
      jobId,
      85,
      'Saving course modules, chapters, and topics to database...'
    );
  }

  // 3. Save to database
  let bannerUrl = typeof banner === 'string' ? banner : '';
  const bannerFile = filesList.find((f) => f.fieldname === 'banner');
  if (bannerFile) {
    const fileKey = `courses/banners/${Date.now()}-${bannerFile.originalname.replace(/\s+/g, '-')}`;
    bannerUrl = await uploadToR2(bannerFile.buffer, fileKey, bannerFile.mimetype);
  }

  const categoryName = planResult.category || 'General Studies';
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

  const shareSlug = generateShareSlug(planResult.title);

  const course = await Course.create({
    title: planResult.title,
    description: planResult.description,
    longDescription: planResult.longDescription || planResult.description,
    banner: defaultBanner,
    category: categoryDoc.name,
    difficulty: planResult.difficulty || 'beginner',
    authors: [
      {
        name: authorName,
        role: 'Course Creator',
        avatar: authorAvatar,
        bio: 'Created with SabiLearn AI Course Architect.',
      },
    ],
    whatYouWillLearn: planResult.whatYouWillLearn || [],
    prerequisites: planResult.prerequisites || [],
    isPublished: visibility === 'public',
    isFree: true,
    price: 0,
    order: 100,
    isAiGenerated: true,
    creator: user._id,
    visibility,
    shareSlug,
    sourceSummary: `Generated from ${processed.fileSummaries.length} files (${processed.totalPages} pages).`,
    sourceContext: processed.extractedText || '',
    documentIndex: planResult.documentIndex,
    sourceChunks: planResult.chunks,
  });

  let totalChapters = 0;
  let totalTopics = 0;

  for (let chIdx = 0; chIdx < planResult.chapters.length; chIdx++) {
    const chData = planResult.chapters[chIdx];
    const createdChapter = await Chapter.create({
      course: course._id,
      title: chData.title,
      description: chData.description || '',
      order: chIdx,
      capstoneGoal: chData.capstoneGoal || 'Evaluate mastery of chapter topics',
      capstoneDifficulty: planResult.capstoneDifficulty || 'medium',
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
        sectionId: chData.sourceSectionId || tData.sectionId,
        sourceChunkIndices: chData.chunkIndices || tData.sourceChunkIndices,
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

  const finalResult = {
    courseId: course._id,
    title: course.title,
    shareSlug: course.shareSlug,
    visibility: course.visibility,
    stats: {
      chapters: totalChapters,
      topics: totalTopics,
    },
  };

  if (jobId) {
    courseGenerationQueue.completeJob(jobId, finalResult);
  }

  return finalResult;
}

/**
 * POST /api/v1/ai/course-architect/generate-full
 * 1-click end-to-end course generation and saving.
 * Dispatches to async background queue with real-time SSE progress when files > 20 pages or on request.
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
      startPage,
      endPage,
      isAsync,
    } = req.body;

    let filesList: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      filesList = req.files;
    } else if (req.files && typeof req.files === 'object') {
      filesList = Object.values(req.files).flat();
    }

    const pageRange =
      startPage || endPage
        ? {
            start: startPage ? parseInt(startPage, 10) : undefined,
            end: endPage ? parseInt(endPage, 10) : undefined,
          }
        : undefined;

    // 1. Process documents with sanitization, normalization, and page range slicing
    const processed = await DocumentProcessorService.processUploads(
      filesList,
      userGuidePrompt,
      undefined,
      pageRange
    );

    // Check if background queue should be used (> 20 pages or explicit isAsync)
    const shouldUseQueue = processed.isLargeDocument || isAsync === 'true' || isAsync === true;

    if (shouldUseQueue) {
      const job = courseGenerationQueue.createJob(user._id.toString(), {
        courseTitle: courseTitle || 'Untitled Course',
        totalPages: processed.totalPages,
        fileCount: filesList.length,
      });

      // Enqueue job with concurrency control for EC2 t3.micro protection
      courseGenerationQueue.enqueue(job.id, async () => {
        await executeFullCourseGeneration({
          jobId: job.id,
          user,
          courseTitle,
          userGuidePrompt,
          difficulty: difficulty as any,
          visibility: visibility as any,
          banner,
          filesList,
          processed,
        });
      });

      res.status(202).json({
        success: true,
        async: true,
        jobId: job.id,
        totalPages: processed.totalPages,
        isLargeDocument: true,
        message: 'Large document detected. Course is generating in background queue.',
      });
      return;
    }

    // Synchronous execution for smaller files (<= 20 pages)
    const result = await executeFullCourseGeneration({
      user,
      courseTitle,
      userGuidePrompt,
      difficulty: difficulty as any,
      visibility: visibility as any,
      banner,
      filesList,
      processed,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/course-architect/progress/:jobId
 * Server-Sent Events (SSE) stream for real-time generation progress and stages.
 */
export const getJobProgressSse = (req: Request, res: Response): void => {
  const jobId = String(req.params.jobId);
  const job = courseGenerationQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ success: false, message: 'Generation job not found.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  const unsubscribe = courseGenerationQueue.subscribe(jobId, (updatedJob) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      clearInterval(heartbeat);
      res.end();
    }
  });

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};

/**
 * GET /api/v1/ai/course-architect/jobs/:jobId
 * Polling fallback endpoint to check job status and progress.
 */
export const getJobStatus = (req: Request, res: Response): void => {
  const jobId = String(req.params.jobId);
  const job = courseGenerationQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ success: false, message: 'Generation job not found.' });
    return;
  }

  res.status(200).json({ success: true, data: job });
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
