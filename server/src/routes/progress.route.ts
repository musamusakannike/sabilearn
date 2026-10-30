import { Router } from 'express';
import {
  getDashboard,
  getProgress,
  getContinueStudying,
  getNeedsImprovement,
  submitFlashcardSession,
  submitMcqSession,
  updateContentPosition,
  getCourseProgress,
  getTopicProgress,
  getDashboardResumption,
  completeTopic,
  submitExercise,
  savePosition,
  getAssessmentProgress,
  saveAssessmentProgress,
  clearAssessmentProgress,
} from '../controllers/progress.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireCourseAccess, resolveCourseIdFromParam, resolveCourseIdFromTopicParam, resolveCourseIdFromChapterParam } from '../middlewares/access.middleware';
import { validateFlashcardSession, validateMcqSession, validateContentPosition } from '../validations/progress.validation';

const router = Router();

router.get('/', protect, getDashboard);
router.get('/dashboard-resumption', protect, getDashboardResumption);
router.get('/stats', protect, getProgress);
router.get('/continue', protect, getContinueStudying);
router.get('/needs-improvement', protect, getNeedsImprovement);
router.get('/course/:courseId', protect, requireCourseAccess(resolveCourseIdFromParam('courseId')), getCourseProgress);
router.get('/topic/:topicId', protect, requireCourseAccess(resolveCourseIdFromTopicParam('topicId')), getTopicProgress);
router.get('/assessment/:chapterId', protect, requireCourseAccess(resolveCourseIdFromChapterParam('chapterId')), getAssessmentProgress);
router.put('/assessment/:chapterId', protect, requireCourseAccess(resolveCourseIdFromChapterParam('chapterId')), saveAssessmentProgress);
router.delete('/assessment/:chapterId', protect, requireCourseAccess(resolveCourseIdFromChapterParam('chapterId')), clearAssessmentProgress);
router.post('/topic-complete', protect, requireCourseAccess(resolveCourseIdFromParam('courseId')), completeTopic);
router.post('/exercise-submit', protect, requireCourseAccess(resolveCourseIdFromParam('courseId')), submitExercise);
router.post('/save-position', protect, requireCourseAccess(resolveCourseIdFromParam('courseId')), savePosition);
router.post('/flashcard-session', protect, requireCourseAccess(resolveCourseIdFromParam('course')), validateFlashcardSession, submitFlashcardSession);
router.post('/mcq-session', protect, requireCourseAccess(resolveCourseIdFromParam('course')), validateMcqSession, submitMcqSession);
router.post('/content-position', protect, requireCourseAccess(resolveCourseIdFromParam('course')), validateContentPosition, updateContentPosition);

export default router;
