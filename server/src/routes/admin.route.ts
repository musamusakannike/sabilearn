import { Router } from 'express';
import {
  getAnalytics,
  getCoursePerformance,
  getUserGrowth,
  getRecentActivity,
  getUserDetails,
  upgradeUserPro,
  revokeSubscription,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/course-performance', protect, authorize('admin'), getCoursePerformance);
router.get('/user-growth', protect, authorize('admin'), getUserGrowth);
router.get('/recent-activity', protect, authorize('admin'), getRecentActivity);

router.get('/users/:id', protect, authorize('admin'), getUserDetails);
router.post('/users/:id/upgrade', protect, authorize('admin'), upgradeUserPro);
router.post('/users/:id/revoke-subscription', protect, authorize('admin'), revokeSubscription);

export default router;
