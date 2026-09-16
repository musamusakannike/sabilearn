import { Request, Response, NextFunction } from 'express';

export const MAX_PROJECTS_PER_USER = 50;
export const MAX_FILE_BYTES = 100 * 1024;
export const MAX_FILES = 4;

const WEB_KEYS = new Set(['index.html', 'styles.css', 'script.js']);
const PYTHON_KEYS = new Set(['main.py']);

export function allowedFileKeys(kind: string): Set<string> {
  return kind === 'python' ? PYTHON_KEYS : WEB_KEYS;
}

export const validateUpsertProject = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  const { localId, name, kind, files, updatedAt, deletedAt } = req.body;

  if (!localId || typeof localId !== 'string' || localId.trim().length < 8) {
    errors.push('localId is required.');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required.');
  } else if (name.trim().length > 80) {
    errors.push('name must be 80 characters or fewer.');
  }

  if (kind !== 'web' && kind !== 'python') {
    errors.push('kind must be web or python.');
  }

  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    errors.push('files must be an object.');
  } else {
    const keys = Object.keys(files);
    if (keys.length === 0 || keys.length > MAX_FILES) {
      errors.push(`files must contain 1–${MAX_FILES} entries.`);
    }
    const allowed = kind === 'python' || kind === 'web' ? allowedFileKeys(kind) : null;
    for (const key of keys) {
      if (allowed && !allowed.has(key)) {
        errors.push(`Unexpected file key: ${key}`);
      }
      if (typeof files[key] !== 'string') {
        errors.push(`File ${key} must be a string.`);
      } else if (Buffer.byteLength(files[key], 'utf8') > MAX_FILE_BYTES) {
        errors.push(`File ${key} exceeds ${MAX_FILE_BYTES} bytes.`);
      }
    }
  }

  if (updatedAt !== undefined && (typeof updatedAt !== 'string' || Number.isNaN(Date.parse(updatedAt)))) {
    errors.push('updatedAt must be an ISO date string.');
  }

  if (deletedAt !== undefined && deletedAt !== null) {
    if (typeof deletedAt !== 'string' || Number.isNaN(Date.parse(deletedAt))) {
      errors.push('deletedAt must be null or an ISO date string.');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

export const validateRenameProject = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];
  if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
    errors.push('name is required.');
  } else if (req.body.name.trim().length > 80) {
    errors.push('name must be 80 characters or fewer.');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};
