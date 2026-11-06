import { Request, Response, NextFunction } from 'express';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { verifyToken } from '../utils/token.util';
import User, { IUser, ClientPlatform } from '../models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  firebaseUser?: DecodedIdToken;
}

export function detectClientPlatform(req: Request): ClientPlatform {
  const header = String(req.headers['x-client-platform'] || '').trim().toLowerCase();
  if (header === 'ios' || header === 'android' || header === 'web') {
    return header;
  }
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (ua.includes('cfnetwork') || ua.includes('darwin') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'ios';
  }
  if (ua.includes('android') || ua.includes('okhttp')) {
    return 'android';
  }
  return 'web';
}

export function recordClientActivity(req: Request, user: IUser): void {
  try {
    const platform = detectClientPlatform(req);
    const now = new Date();
    const shouldUpdatePlatform = user.lastPlatform !== platform;
    const shouldUpdateActive = !user.lastActiveAt || now.getTime() - new Date(user.lastActiveAt).getTime() > 5 * 60 * 1000;

    if (shouldUpdatePlatform || shouldUpdateActive) {
      user.lastPlatform = platform;
      user.lastActiveAt = now;
      void User.updateOne(
        { _id: user._id },
        { $set: { lastPlatform: platform, lastActiveAt: now } }
      ).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Middleware to protect routes using local JWT authentication.
 */
export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
      return;
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({ success: false, message: 'User associated with this token not found.' });
        return;
      }

      req.user = user;
      recordClientActivity(req, user);
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Not authorized, token verification failed.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to protect routes using Firebase ID Token authentication.
 * Syncs the authenticated Firebase user with MongoDB representation.
 */
export const protectFirebase = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, no Firebase token provided.' });
      return;
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.firebaseUser = decodedToken;
      
      // Sync or lookup the user in MongoDB
      let user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (!user && decodedToken.email) {
        user = await User.create({
          email: decodedToken.email,
          name: decodedToken.name || 'Firebase User',
          firebaseUid: decodedToken.uid,
          role: 'user',
        });
      }
      
      if (user) {
        req.user = user;
        recordClientActivity(req, user);
      }
      
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Not authorized, Firebase token verification failed.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles.
 */
export const authorize = (...roles: ('user' | 'admin')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access forbidden: Insufficient permissions.' });
      return;
    }
    next();
  };
};

export const adminOnly = authorize('admin');

/**
 * Middleware to optionally attach user to request if JWT token is provided.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          recordClientActivity(req, user);
        }
      } catch (err) {
        // ignore invalid token for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
