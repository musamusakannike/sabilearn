import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import User from '../models/user.model';
import Subscription from '../models/subscription.model';
import UserProgress from '../models/userProgress.model';
import { uploadToR2 } from '../utils/r2.util';

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user!._id,
        email: req.user!.email,
        name: req.user!.name,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        phone: req.user!.phone,
        bio: req.user!.bio,
        avatar: req.user!.avatar,
        level: req.user!.level,
        role: req.user!.role,
        currentStreak: req.user!.currentStreak ?? 0,
        longestStreak: req.user!.longestStreak ?? 0,
        totalXp: req.user!.totalXp ?? 0,
        totalStudyDays: req.user!.totalStudyDays ?? 0,
        settings: req.user!.settings || {
          emailNotifications: true,
          pushNotifications: false,
          weeklyProgress: true,
          language: 'en',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, phone, bio, level, email, activeTrack } = req.body;

    const updates: Record<string, unknown> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (level !== undefined) updates.level = level;
    if (email !== undefined) updates.email = email;
    if (activeTrack !== undefined) updates.activeTrack = activeTrack;

    if (firstName || lastName) {
      const fn = firstName || req.user!.firstName;
      const ln = lastName || req.user!.lastName;
      updates.name = `${fn} ${ln}`;
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const fileKey = `avatars/${req.user!._id}-${Date.now()}-${req.file.originalname}`;
    const avatarUrl = await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({ success: true, data: { avatar: avatarUrl, user } });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.role && (req.query.role === 'user' || req.query.role === 'admin')) {
      filter.role = req.query.role;
    }
    if (req.query.track && (req.query.track === 'tech' || req.query.track === 'academic')) {
      filter.activeTrack = req.query.track;
    }
    if (req.query.platform && ['web', 'ios', 'android'].includes(req.query.platform as string)) {
      filter.lastPlatform = req.query.platform;
    }

    // Sort order
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (req.query.sortBy === 'lastActiveAt') {
      sortOptions = { lastActiveAt: -1, createdAt: -1 };
    } else if (req.query.sortBy === 'totalXp') {
      sortOptions = { totalXp: -1 };
    } else if (req.query.sortBy === 'currentStreak') {
      sortOptions = { currentStreak: -1 };
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort(sortOptions).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);

    // Fetch subscriptions & enrolled courses count in bulk
    const now = new Date();
    const [subscriptions, progressEnrollmentAgg] = await Promise.all([
      Subscription.find({ user: { $in: userIds } }).lean(),
      UserProgress.aggregate([
        { $match: { user: { $in: userIds }, 'completedTopics.0': { $exists: true } } },
        {
          $group: {
            _id: '$user',
            enrolledCount: { $sum: 1 },
            completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          },
        },
      ]),
    ]);

    const subMap = new Map(subscriptions.map((s) => [String(s.user), s]));
    const progMap = new Map(progressEnrollmentAgg.map((p) => [String(p._id), p]));

    const enrichedUsers = users.map((u) => {
      const uId = String(u._id);
      const sub = subMap.get(uId);
      const prog = progMap.get(uId);

      const isProActive = Boolean(
        sub &&
        sub.status === 'active' &&
        (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() > now.getTime())
      );

      // Inferred platform fallback if null
      let platform = (u as any).lastPlatform;
      if (!platform) {
        if (sub?.store === 'app_store') platform = 'ios';
        else if (sub?.store === 'play_store') platform = 'android';
        else if (sub?.store === 'web') platform = 'web';
        else platform = 'web';
      }

      return {
        ...u,
        lastPlatform: platform,
        lastActiveAt: (u as any).lastActiveAt || (u as any).lastStudyDate || (u as any).updatedAt,
        subscription: sub
          ? {
              status: sub.status,
              billingType: sub.billingType,
              store: sub.store,
              currentPeriodEnd: sub.currentPeriodEnd,
              isProActive,
            }
          : null,
        isPro: isProActive,
        enrolledCoursesCount: prog?.enrolledCount || 0,
        completedCoursesCount: prog?.completedCount || 0,
      };
    });

    // Optional filter by status if requested (pro / free)
    let finalUsers = enrichedUsers;
    if (req.query.status === 'pro') {
      finalUsers = enrichedUsers.filter((u) => u.isPro);
    } else if (req.query.status === 'free') {
      finalUsers = enrichedUsers.filter((u) => !u.isPro);
    }

    res.status(200).json({
      success: true,
      data: finalUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      weeklyProgress,
      language,
      studyReminders,
      streakAlerts,
      reminderHour,
      reminderMinute,
      timezoneOffset,
      dailyGoalMinutes,
      preferredTrack,
    } = req.body;

    const settingsUpdate: Record<string, unknown> = {};
    if (emailNotifications !== undefined) settingsUpdate['settings.emailNotifications'] = emailNotifications;
    if (pushNotifications !== undefined) settingsUpdate['settings.pushNotifications'] = pushNotifications;
    if (weeklyProgress !== undefined) settingsUpdate['settings.weeklyProgress'] = weeklyProgress;
    if (language !== undefined) settingsUpdate['settings.language'] = language;
    if (studyReminders !== undefined) settingsUpdate['settings.studyReminders'] = studyReminders;
    if (streakAlerts !== undefined) settingsUpdate['settings.streakAlerts'] = streakAlerts;
    if (reminderHour !== undefined) settingsUpdate['settings.reminderHour'] = reminderHour;
    if (reminderMinute !== undefined) settingsUpdate['settings.reminderMinute'] = reminderMinute;
    if (timezoneOffset !== undefined) settingsUpdate['settings.timezoneOffset'] = timezoneOffset;
    if (dailyGoalMinutes !== undefined) settingsUpdate['settings.dailyGoalMinutes'] = dailyGoalMinutes;
    if (preferredTrack !== undefined) settingsUpdate['settings.preferredTrack'] = preferredTrack;

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: settingsUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: { settings: user!.settings } });
  } catch (error) {
    next(error);
  }
};

export const savePushToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, timezoneOffset, platform } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Push token is required.' });
      return;
    }

    const update: Record<string, unknown> = { expoPushToken: token };

    if (platform === 'ios' || platform === 'android') {
      update.lastPlatform = platform;
    }

    // The app re-reports its offset on every launch, which is how the server
    // picks up travel and daylight-saving shifts without a timezone database.
    if (Number.isInteger(timezoneOffset) && timezoneOffset >= -840 && timezoneOffset <= 840) {
      update['settings.timezoneOffset'] = timezoneOffset;
    }

    await User.findByIdAndUpdate(req.user!._id, { $set: update });

    res.status(200).json({ success: true, message: 'Push token saved.' });
  } catch (error) {
    next(error);
  }
};

export const removePushToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user!._id, { expoPushToken: '' });

    res.status(200).json({ success: true, message: 'Push token removed.' });
  } catch (error) {
    next(error);
  }
};

export const deleteMyAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
