import { Router } from 'express';
import multer from 'multer';
import {
  getQuota,
  generatePlan,
  generateTopic,
  generateCapstone,
  saveCourse,
  generateFullCourse,
  getPublicAiCourses,
  getMyAiCourses,
  getAiCourseByIdOrSlug,
  updateCourseVisibility,
  deleteAiCourse,
} from '../controllers/courseArchitect.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';
import {
  requireSubscribedUser,
  checkDailyGenerationQuota,
} from '../middlewares/courseQuota.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    const name = file.originalname.toLowerCase();

    if (
      mime.startsWith('image/') ||
      mime === 'application/pdf' ||
      mime.includes('wordprocessingml') ||
      mime.includes('msword') ||
      /\.(png|jpe?g|webp|gif|pdf|docx?)$/i.test(name)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file format: ${file.originalname}. Only PDF, DOCX, and images (JPEG, PNG, WEBP) are supported.`
        )
      );
    }
  },
});

// ==========================================
// COURSE ARCHITECT & GENERATION ENDPOINTS
// Base: /api/v1/ai/course-architect
// ==========================================

// Quota check
router.get('/quota', protect, getQuota);

// Step 1: Document/Image Upload & Course Plan Generation
router.post(
  '/plan',
  protect,
  requireSubscribedUser,
  checkDailyGenerationQuota,
  upload.any(),
  generatePlan
);

// Step 2: Individual Topic Content Generation
router.post('/topic', protect, requireSubscribedUser, generateTopic);

// Step 3: Chapter Capstone Assessment Generation
router.post('/capstone', protect, requireSubscribedUser, generateCapstone);

// Step 4: Save Generated Course to Database
router.post(
  '/save',
  protect,
  requireSubscribedUser,
  checkDailyGenerationQuota,
  saveCourse
);

// 1-Click One-Shot Full Course Generator
router.post(
  '/generate-full',
  protect,
  requireSubscribedUser,
  checkDailyGenerationQuota,
  upload.any(),
  generateFullCourse
);

// ==========================================
// AI-GENERATED COURSES DISCOVERY & MANAGEMENT
// Base: /api/v1/ai/courses
// ==========================================
export const aiCoursesRouter = Router();

// Public community catalog of AI courses
aiCoursesRouter.get('/public', getPublicAiCourses);

// Authenticated user's personal created courses
aiCoursesRouter.get('/my-courses', protect, getMyAiCourses);

// View AI-generated course by ID or shareSlug
aiCoursesRouter.get('/:idOrSlug', optionalAuth, getAiCourseByIdOrSlug);

// Update visibility ('public' | 'unlisted' | 'private')
aiCoursesRouter.patch('/:id/visibility', protect, updateCourseVisibility);

// Delete AI generated course
aiCoursesRouter.delete('/:id', protect, deleteAiCourse);

export default router;
