import { Request, Response, NextFunction } from 'express';
import AppReview, { SupportedOS } from '../models/appReview.model';

const DEFAULT_OS_CONFIGS: Record<SupportedOS, { inReview: boolean; reviewVersion: string; notes: string; hiddenComponents: string[]; customFlags: Record<string, boolean> }> = {
  ios: {
    inReview: false,
    reviewVersion: '',
    notes: 'Default iOS review configuration',
    hiddenComponents: [],
    customFlags: {},
  },
  android: {
    inReview: false,
    reviewVersion: '',
    notes: 'Default Android review configuration',
    hiddenComponents: ['subscription_paywall', 'paid_courses', 'code_playground'],
    customFlags: {},
  },
};

/**
 * Ensures default documents exist for ios and android in the database.
 */
async function ensureDefaultOSConfigs() {
  const osList: SupportedOS[] = ['ios', 'android'];
  for (const os of osList) {
    const exists = await AppReview.findOne({ os });
    if (!exists) {
      await AppReview.create({
        os,
        ...DEFAULT_OS_CONFIGS[os],
      });
    }
  }
}

/**
 * Public endpoint: Get app review status for a specific OS or all OSes.
 * GET /api/v1/app-review/status?os=ios&version=1.0.0
 */
export const getAppReviewStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawOs = (req.query.os as string | undefined)?.toLowerCase().trim();
    const version = (req.query.version as string | undefined)?.trim();

    // Fetch all configs from DB
    let configs = await AppReview.find().lean();
    if (configs.length < 2) {
      await ensureDefaultOSConfigs();
      configs = await AppReview.find().lean();
    }

    const configMap: Record<string, any> = {};
    configs.forEach((cfg) => {
      configMap[cfg.os] = {
        os: cfg.os,
        inReview: !!cfg.inReview,
        reviewVersion: cfg.reviewVersion || '',
        minVersion: cfg.minVersion || '',
        notes: cfg.notes || '',
        hiddenComponents: cfg.hiddenComponents || [],
        customFlags: cfg.customFlags || {},
        updatedAt: cfg.updatedAt,
      };
    });

    // Default if not populated
    if (!configMap.ios) configMap.ios = { os: 'ios', ...DEFAULT_OS_CONFIGS.ios };
    if (!configMap.android) configMap.android = { os: 'android', ...DEFAULT_OS_CONFIGS.android };

    const targetOs = rawOs === 'android' ? 'android' : rawOs === 'ios' ? 'ios' : 'all';
    const activeConfig = targetOs !== 'all' ? configMap[targetOs] : null;

    let inReview = false;
    let hiddenComponents: string[] = [];
    let customFlags: Record<string, boolean> = {};

    if (activeConfig) {
      // If version is provided and reviewVersion is specified, check if version matches
      if (activeConfig.inReview) {
        if (activeConfig.reviewVersion && version) {
          inReview = activeConfig.reviewVersion === version;
        } else {
          inReview = true;
        }
      }
      hiddenComponents = inReview ? activeConfig.hiddenComponents || [] : [];
      customFlags = inReview ? activeConfig.customFlags || {} : {};
    }

    res.status(200).json({
      success: true,
      data: {
        os: targetOs,
        inReview,
        reviewVersion: activeConfig?.reviewVersion || '',
        hiddenComponents,
        customFlags,
        all: configMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Get all OS review configurations with metadata.
 * GET /api/v1/app-review
 */
export const getAllAppReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let configs = await AppReview.find()
      .populate({ path: 'updatedBy', select: 'name firstName lastName email avatar' })
      .sort({ os: 1 })
      .lean();

    if (configs.length < 2) {
      await ensureDefaultOSConfigs();
      configs = await AppReview.find()
        .populate({ path: 'updatedBy', select: 'name firstName lastName email avatar' })
        .sort({ os: 1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Update review configuration for a specific OS.
 * PUT /api/v1/app-review/:os
 */
export const updateAppReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const osParam = req.params.os;
    const rawOs = (typeof osParam === 'string' ? osParam : Array.isArray(osParam) ? osParam[0] : '')?.toLowerCase().trim();
    if (rawOs !== 'ios' && rawOs !== 'android') {
      res.status(400).json({
        success: false,
        message: 'Invalid OS specified. Must be "ios" or "android".',
      });
      return;
    }

    const { inReview, reviewVersion, minVersion, notes, hiddenComponents, customFlags } = req.body;
    const userId = (req as any).user?._id;

    const updated = await AppReview.findOneAndUpdate(
      { os: rawOs },
      {
        $set: {
          ...(typeof inReview === 'boolean' && { inReview }),
          ...(typeof reviewVersion === 'string' && { reviewVersion: reviewVersion.trim() }),
          ...(typeof minVersion === 'string' && { minVersion: minVersion.trim() }),
          ...(typeof notes === 'string' && { notes: notes.trim() }),
          ...(Array.isArray(hiddenComponents) && { hiddenComponents }),
          ...(customFlags && typeof customFlags === 'object' && { customFlags }),
          updatedBy: userId || null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).populate({ path: 'updatedBy', select: 'name firstName lastName email' });

    res.status(200).json({
      success: true,
      message: `App review configuration for ${rawOs.toUpperCase()} updated successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Bulk update review configurations.
 * PUT /api/v1/app-review
 */
export const bulkUpdateAppReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { ios, android } = req.body;

    const updates: Promise<any>[] = [];

    if (ios && typeof ios === 'object') {
      updates.push(
        AppReview.findOneAndUpdate(
          { os: 'ios' },
          {
            $set: {
              ...(typeof ios.inReview === 'boolean' && { inReview: ios.inReview }),
              ...(typeof ios.reviewVersion === 'string' && { reviewVersion: ios.reviewVersion.trim() }),
              ...(typeof ios.minVersion === 'string' && { minVersion: ios.minVersion.trim() }),
              ...(typeof ios.notes === 'string' && { notes: ios.notes.trim() }),
              ...(Array.isArray(ios.hiddenComponents) && { hiddenComponents: ios.hiddenComponents }),
              ...(ios.customFlags && typeof ios.customFlags === 'object' && { customFlags: ios.customFlags }),
              updatedBy: userId || null,
            },
          },
          { new: true, upsert: true }
        )
      );
    }

    if (android && typeof android === 'object') {
      updates.push(
        AppReview.findOneAndUpdate(
          { os: 'android' },
          {
            $set: {
              ...(typeof android.inReview === 'boolean' && { inReview: android.inReview }),
              ...(typeof android.reviewVersion === 'string' && { reviewVersion: android.reviewVersion.trim() }),
              ...(typeof android.minVersion === 'string' && { minVersion: android.minVersion.trim() }),
              ...(typeof android.notes === 'string' && { notes: android.notes.trim() }),
              ...(Array.isArray(android.hiddenComponents) && { hiddenComponents: android.hiddenComponents }),
              ...(android.customFlags && typeof android.customFlags === 'object' && { customFlags: android.customFlags }),
              updatedBy: userId || null,
            },
          },
          { new: true, upsert: true }
        )
      );
    }

    await Promise.all(updates);

    const allConfigs = await AppReview.find()
      .populate({ path: 'updatedBy', select: 'name firstName lastName email' })
      .sort({ os: 1 });

    res.status(200).json({
      success: true,
      message: 'App review configurations updated successfully.',
      data: allConfigs,
    });
  } catch (error) {
    next(error);
  }
};
