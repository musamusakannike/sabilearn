import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import PlaygroundProject from '../models/playgroundProject.model';
import { MAX_PROJECTS_PER_USER } from '../validations/playground.validation';

function serialize(doc: {
  _id: unknown;
  localId: string;
  name: string;
  kind: string;
  files: Record<string, string>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(doc._id),
    localId: doc.localId,
    name: doc.name,
    kind: doc.kind,
    files: doc.files,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const listProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const includeDeleted = req.query.includeDeleted === '1';
    const full = req.query.full === '1';

    const filter: Record<string, unknown> = { user: userId };
    if (!includeDeleted) filter.deletedAt = null;

    const docs = await PlaygroundProject.find(filter).sort({ updatedAt: -1 });
    const data = docs.map((d) => {
      const item = serialize(d);
      if (!full) {
        const { files: _files, ...meta } = item;
        return { ...meta, fileKeys: Object.keys(d.files || {}) };
      }
      return item;
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await PlaygroundProject.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }
    res.status(200).json({ success: true, data: serialize(doc) });
  } catch (error) {
    next(error);
  }
};

export const upsertProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { localId, name, kind, files, updatedAt, deletedAt } = req.body;
    const incomingUpdated = updatedAt ? new Date(updatedAt) : new Date();
    const incomingDeleted = deletedAt ? new Date(deletedAt) : null;

    const existing = await PlaygroundProject.findOne({ user: userId, localId: String(localId).trim() });

    if (existing) {
      if (existing.updatedAt.getTime() > incomingUpdated.getTime()) {
        res.status(200).json({
          success: true,
          conflict: true,
          data: serialize(existing),
          message: 'Server copy is newer; local was not overwritten.',
        });
        return;
      }

      existing.name = String(name).trim();
      existing.kind = kind;
      existing.files = files;
      existing.deletedAt = incomingDeleted;
      existing.updatedAt = incomingUpdated;
      await existing.save();
      res.status(200).json({ success: true, data: serialize(existing) });
      return;
    }

    const activeCount = await PlaygroundProject.countDocuments({ user: userId, deletedAt: null });
    if (!incomingDeleted && activeCount >= MAX_PROJECTS_PER_USER) {
      res.status(400).json({
        success: false,
        message: `You can save up to ${MAX_PROJECTS_PER_USER} playground projects.`,
      });
      return;
    }

    const created = await PlaygroundProject.create({
      user: userId,
      localId: String(localId).trim(),
      name: String(name).trim(),
      kind,
      files,
      deletedAt: incomingDeleted,
      createdAt: incomingUpdated,
      updatedAt: incomingUpdated,
    });

    res.status(201).json({ success: true, data: serialize(created) });
  } catch (error) {
    next(error);
  }
};

export const renameProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await PlaygroundProject.findOne({
      _id: req.params.id,
      user: req.user!._id,
      deletedAt: null,
    });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }
    doc.name = String(req.body.name).trim();
    await doc.save();
    res.status(200).json({ success: true, data: serialize(doc) });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await PlaygroundProject.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }
    doc.deletedAt = new Date();
    await doc.save();
    res.status(200).json({ success: true, data: serialize(doc) });
  } catch (error) {
    next(error);
  }
};
