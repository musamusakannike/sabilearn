import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  listProjects,
  getProject,
  upsertProject,
  renameProject,
  deleteProject,
} from '../controllers/playground.controller';
import { validateUpsertProject, validateRenameProject } from '../validations/playground.validation';

const router = Router();

router.use(protect);
router.get('/projects', listProjects);
router.get('/projects/:id', getProject);
router.put('/projects', validateUpsertProject, upsertProject);
router.patch('/projects/:id', validateRenameProject, renameProject);
router.delete('/projects/:id', deleteProject);

export default router;
