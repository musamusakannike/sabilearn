import { Router } from 'express';
import multer from 'multer';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getPopularTopics,
  getCourseCategories,
  createCourseCategory,
  getPublicCourseBySlug,
} from '../controllers/course.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { validateCreateCourse, validateUpdateCourse } from '../validations/course.validation';
import { validatePagination } from '../validations/pagination.validation';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.get('/', validatePagination, getCourses);
router.get('/popular', getPopularTopics);
router.get('/categories', getCourseCategories);
router.get('/slug/:slug', getPublicCourseBySlug);
router.post('/categories', protect, authorize('admin'), createCourseCategory);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('admin'), upload.single('banner'), validateCreateCourse, createCourse);
router.put('/:id', protect, authorize('admin'), upload.single('banner'), validateUpdateCourse, updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

export default router;
