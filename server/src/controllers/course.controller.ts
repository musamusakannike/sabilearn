import { Request, Response, NextFunction } from 'express';
import Course, { ICourse, ICourseAuthor } from '../models/course.model';
import Category from '../models/category.model';
import Topic from '../models/topic.model';
import Chapter from '../models/chapter.model';
import Flashcard from '../models/flashcard.model';
import MCQ from '../models/mcq.model';
import UserProgress from '../models/userProgress.model';
import { uploadToR2 } from '../utils/r2.util';
import { broadcastCoursePublished } from '../services/notification.service';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const getCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const skip = (page - 1) * limit;

    const includeDrafts = req.query.includeDrafts === 'true';
    const includeAi = req.query.includeAi === 'true';
    const filter: Record<string, unknown> = includeDrafts ? {} : { isPublished: true };

    if (!includeAi) {
      filter.isAiGenerated = { $ne: true };
    }

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

    const courses = await Course.find(filter)
      .populate({ path: 'topicCount' })
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(filter);

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

export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'chapters',
        options: { sort: { order: 1 } },
        populate: {
          path: 'topics',
          options: { sort: { order: 1 } },
          select: 'title description isPublished order defaultFlow',
        },
      });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const registeredUsersCount = await UserProgress.distinct('user', {
      course: req.params.id,
    }).then((users) => users.length);

    // Compute lesson count and obtainable XP across all topics in this course
    const courseTopics = await Topic.find({ course: req.params.id, isPublished: true }).select('xp exercise contents');
    const lessonCount = courseTopics.reduce((acc, t) => acc + (t.contents?.length || 0), 0);
    const totalObtainableXp = courseTopics.reduce((acc, t) => {
      const topicXp = t.xp || 50;
      const exerciseXp = (t.exercise?.questions || []).reduce((qAcc, q) => qAcc + (q.xp || 10), 0);
      return acc + topicXp + exerciseXp;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        registeredUsersCount,
        lessonCount,
        totalObtainableXp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = getCourse;


const parseJsonOrArray = <T>(val: unknown): T[] | undefined => {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split('\n').map((s) => s.trim()).filter(Boolean) as unknown as T[];
    }
  }
  return undefined;
};

export const createCourse = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      description,
      longDescription,
      category,
      difficulty,
      isPublished,
      banner,
      isFree,
      price,
      authors,
      whatYouWillLearn,
      prerequisites,
      order,
    } = req.body;

    let bannerUrl = typeof banner === 'string' ? banner : '';
    if (req.file) {
      const fileKey = `courses/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      bannerUrl = await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);
    }

    const parsedAuthors = parseJsonOrArray<ICourseAuthor>(authors);
    const parsedLearn = parseJsonOrArray<string>(whatYouWillLearn);
    const parsedPrereqs = parseJsonOrArray<string>(prerequisites);

    const newCourseData = {
      title,
      description,
      longDescription: longDescription || '',
      category,
      difficulty: difficulty || 'beginner',
      isPublished: isPublished === 'true' || isPublished === true,
      banner: bannerUrl,
      isFree: isFree === undefined ? true : (isFree === 'true' || isFree === true),
      price: price !== undefined ? Math.max(0, Number(price)) : 0,
      authors: (parsedAuthors || []) as ICourseAuthor[],
      whatYouWillLearn: parsedLearn || [],
      prerequisites: parsedPrereqs || [],
      order: order !== undefined ? Number(order) : 0,
    };

    const course: ICourse = await Course.create(newCourseData);

    if (course.isPublished) {
      void broadcastCoursePublished(course);
    }

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      description,
      longDescription,
      category,
      difficulty,
      isPublished,
      banner,
      isFree,
      price,
      authors,
      whatYouWillLearn,
      prerequisites,
      order,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (longDescription !== undefined) updates.longDescription = longDescription;
    if (category !== undefined) updates.category = category;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (isPublished !== undefined) updates.isPublished = isPublished === 'true' || isPublished === true;
    if (typeof banner === 'string') updates.banner = banner;
    if (isFree !== undefined) updates.isFree = isFree === 'true' || isFree === true;
    if (price !== undefined) updates.price = Math.max(0, Number(price));
    if (order !== undefined) updates.order = Number(order);

    if (authors !== undefined) {
      const parsedAuthors = parseJsonOrArray(authors);
      if (parsedAuthors !== undefined) updates.authors = parsedAuthors;
    }
    if (whatYouWillLearn !== undefined) {
      const parsedLearn = parseJsonOrArray<string>(whatYouWillLearn);
      if (parsedLearn !== undefined) updates.whatYouWillLearn = parsedLearn;
    }
    if (prerequisites !== undefined) {
      const parsedPrereqs = parseJsonOrArray<string>(prerequisites);
      if (parsedPrereqs !== undefined) updates.prerequisites = parsedPrereqs;
    }

    if (req.file) {
      const fileKey = `courses/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      updates.banner = await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);
    }

    // Captured before the write so we can tell a genuine publish from a no-op
    // save on an already-published course.
    const wasPublished = await Course.exists({ _id: req.params.id, isPublished: true });

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    if (!wasPublished && course.isPublished) {
      void broadcastCoursePublished(course);
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    const topics = await Topic.find({ course: req.params.id }).select('_id');
    const topicIds = topics.map((t) => t._id);

    if (topicIds.length > 0) {
      await Flashcard.deleteMany({ topic: { $in: topicIds } });
      await MCQ.deleteMany({ topic: { $in: topicIds } });
      await UserProgress.deleteMany({ topic: { $in: topicIds } });
    }
    await Topic.deleteMany({ course: req.params.id });
    await Chapter.deleteMany({ course: req.params.id });
    await UserProgress.deleteMany({ course: req.params.id });

    res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getPopularTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate({ path: 'topicCount' })
      .sort({ order: 1, createdAt: -1 })
      .limit(6);

    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

const DEFAULT_CATEGORIES = [
  'Web development',
  'Data science',
  'Design',
  'Business',
  'Mobile development',
  'Marketing',
];

export const getCourseCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [savedCategories, courseCategories] = await Promise.all([
      Category.find().select('name').lean(),
      Course.distinct('category'),
    ]);

    const set = new Map<string, string>();

    DEFAULT_CATEGORIES.forEach((cat) => {
      if (cat && cat.trim()) set.set(cat.trim().toLowerCase(), cat.trim());
    });

    savedCategories.forEach((cat) => {
      if (cat?.name && cat.name.trim()) set.set(cat.name.trim().toLowerCase(), cat.name.trim());
    });

    courseCategories.forEach((cat) => {
      if (typeof cat === 'string' && cat.trim()) set.set(cat.trim().toLowerCase(), cat.trim());
    });

    const sortedCategories = Array.from(set.values()).sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      data: sortedCategories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Category name must be at least 2 characters long.' });
      return;
    }

    const trimmedName = name.trim();

    // Check if category already exists in Category collection (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Category already exists.' });
      return;
    }

    const category = await Category.create({
      name: trimmedName,
      description: typeof description === 'string' ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      data: {
        _id: category._id,
        name: category.name,
        description: category.description,
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      res.status(400).json({ success: false, message: 'Category already exists.' });
      return;
    }
    next(error);
  }
};

