import { Request, Response, NextFunction } from 'express';

export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];

  if (req.body.firstName !== undefined && (typeof req.body.firstName !== 'string' || req.body.firstName.trim().length === 0)) {
    errors.push('First name cannot be empty.');
  }

  if (req.body.lastName !== undefined && (typeof req.body.lastName !== 'string' || req.body.lastName.trim().length === 0)) {
    errors.push('Last name cannot be empty.');
  }

  if (req.body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      errors.push('A valid email address is required.');
    }
  }

  if (req.body.level !== undefined && !['beginner', 'intermediate', 'advanced'].includes(req.body.level)) {
    errors.push('Level must be beginner, intermediate, or advanced.');
  }

  if (req.body.activeTrack !== undefined && !['tech', 'academic'].includes(req.body.activeTrack)) {
    errors.push('activeTrack must be either "tech" or "academic".');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

export const validateUpdateSettings = (req: Request, res: Response, next: NextFunction): void => {
  const errors: string[] = [];

  if (req.body.emailNotifications !== undefined && typeof req.body.emailNotifications !== 'boolean') {
    errors.push('emailNotifications must be a boolean.');
  }

  if (req.body.pushNotifications !== undefined && typeof req.body.pushNotifications !== 'boolean') {
    errors.push('pushNotifications must be a boolean.');
  }

  if (req.body.weeklyProgress !== undefined && typeof req.body.weeklyProgress !== 'boolean') {
    errors.push('weeklyProgress must be a boolean.');
  }

  if (req.body.language !== undefined && (typeof req.body.language !== 'string' || req.body.language.trim().length === 0)) {
    errors.push('language must be a non-empty string.');
  }

  if (req.body.studyReminders !== undefined && typeof req.body.studyReminders !== 'boolean') {
    errors.push('studyReminders must be a boolean.');
  }

  if (req.body.streakAlerts !== undefined && typeof req.body.streakAlerts !== 'boolean') {
    errors.push('streakAlerts must be a boolean.');
  }

  if (req.body.reminderHour !== undefined) {
    const hour = req.body.reminderHour;
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      errors.push('reminderHour must be an integer between 0 and 23.');
    }
  }

  if (req.body.reminderMinute !== undefined) {
    const minute = req.body.reminderMinute;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      errors.push('reminderMinute must be an integer between 0 and 59.');
    }
  }

  if (req.body.timezoneOffset !== undefined) {
    const offset = req.body.timezoneOffset;
    // -840..840 covers UTC-14 through UTC+14.
    if (!Number.isInteger(offset) || offset < -840 || offset > 840) {
      errors.push('timezoneOffset must be an integer number of minutes between -840 and 840.');
    }
  }

  if (req.body.dailyGoalMinutes !== undefined) {
    const minutes = req.body.dailyGoalMinutes;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
      errors.push('dailyGoalMinutes must be an integer between 1 and 480.');
    }
  }

  if (req.body.preferredTrack !== undefined && !['tech', 'academic'].includes(req.body.preferredTrack)) {
    errors.push('preferredTrack must be either "tech" or "academic".');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};

export const validateUpdateRole = (req: Request, res: Response, next: NextFunction): void => {
  const { role } = req.body;
  const errors: string[] = [];

  if (!role || !['user', 'admin'].includes(role)) {
    errors.push('Role must be either "user" or "admin".');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
};
