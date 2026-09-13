import { Router } from 'express';
import {
  summarize,
  generateQuiz,
  generateFlashcards,
  qa,
  explainLesson,
  generateCourseQuiz,
  generateTopicQuiz,
  getHistory,
  getHistoryById,
  deleteHistory,
} from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';
import { requireCourseAccess, resolveCourseIdFromParam, resolveCourseIdFromTopicParam } from '../middlewares/access.middleware';
import {
  validateSummarize,
  validateGenerateQuiz,
  validateGenerateFlashcards,
  validateQA,
  validateExplainLesson,
  validateCourseQuiz,
  validateTopicQuiz,
} from '../validations/ai.validation';

const router = Router();

// Protect all AI routes
router.use(protect);

// Homepage & Study AI Features
router.post('/summarize', validateSummarize, summarize);
router.post('/generate-quiz', validateGenerateQuiz, generateQuiz);
router.post('/generate-flashcards', validateGenerateFlashcards, generateFlashcards);
router.post('/qa', validateQA, qa);
router.post('/explain', validateExplainLesson, explainLesson);

// Course & Topic Quiz Features
router.post('/courses/:courseId/quiz', requireCourseAccess(resolveCourseIdFromParam('courseId')), validateCourseQuiz, generateCourseQuiz);
router.post('/topics/:topicId/quiz', requireCourseAccess(resolveCourseIdFromTopicParam('topicId')), validateTopicQuiz, generateTopicQuiz);

// Generation History Features
router.get('/history', getHistory);
router.get('/history/:id', getHistoryById);
router.delete('/history/:id', deleteHistory);

export default router;
