import { Router } from 'express';
import { createCourseRequest, getCourseRequests } from '../controllers/courseRequest.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', createCourseRequest);
router.get('/', protect, authorize('admin'), getCourseRequests);

export default router;
