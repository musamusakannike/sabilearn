import { Router } from 'express';
import {
  getChaptersByCourse,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  getChapterAssessment,
} from '../controllers/chapter.controller';
import { protect, optionalAuth, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.get('/course/:courseId', optionalAuth, getChaptersByCourse);
router.get('/:id/assessment', optionalAuth, getChapterAssessment);
router.post('/', protect, adminOnly, createChapter);
router.put('/reorder', protect, adminOnly, reorderChapters);
router.put('/:id', protect, adminOnly, updateChapter);
router.delete('/:id', protect, adminOnly, deleteChapter);

export default router;
