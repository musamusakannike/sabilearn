import { Router } from 'express';
import {
  summarize,
  generateQuiz,
  generateQuizFromMaterials,
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
import multer from 'multer';
import { requireSubscribedUser, checkDailyGenerationQuota } from '../middlewares/courseQuota.middleware';
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

const quizUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
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
      cb(new Error(`Unsupported file format: ${file.originalname}. Only PDF, DOCX, and images (JPEG, PNG, WEBP) are supported.`));
    }
  },
});

// Protect all AI routes
router.use(protect);

// Homepage & Study AI Features
router.post('/summarize', validateSummarize, summarize);
router.post('/generate-quiz', validateGenerateQuiz, generateQuiz);
router.post(
  '/generate-quiz/materials',
  requireSubscribedUser,
  checkDailyGenerationQuota,
  quizUpload.any(),
  generateQuizFromMaterials
);
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
