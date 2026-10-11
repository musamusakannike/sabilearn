import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyProgress: boolean;
  language: string;
  /** Daily "time to study" reminder. */
  studyReminders: boolean;
  /** Evening nudge when an active streak is about to break. */
  streakAlerts: boolean;
  /** Local hour (0-23) the daily reminder should land. */
  reminderHour: number;
  /** Minutes past reminderHour (0-59). */
  reminderMinute: number;
  /**
   * Offset from UTC in minutes (e.g. Lagos = 60, New York in EDT = -240).
   * The device re-reports this on every launch, so DST corrects itself
   * without needing a timezone database on the server.
   */
  timezoneOffset: number;
  /** Minutes of study the user wants to complete each day. */
  dailyGoalMinutes: number;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  firebaseUid?: string;
  role: 'user' | 'admin';
  settings?: IUserSettings;
  expoPushToken?: string;
  /** Consecutive days with at least one study session, as of lastStudyDate. */
  currentStreak: number;
  longestStreak: number;
  /** Midnight UTC of the user's local day on which they last studied. */
  lastStudyDate?: Date | null;
  totalStudyDays: number;
  totalXp: number;
  /** Local YYYY-MM-DD of the last first-topic or streak engagement email. */
  lastEngagementEmailDay?: string | null;
  /** Local YYYY-MM-DD of the last streak-risk email. */
  lastStreakEmailDay?: string | null;
  /** Local week key `YYYY-Www` of the last weekly digest. */
  lastWeeklyEmailWeek?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      // Opt-in is enforced by the OS permission prompt, so defaulting this to
      // false silently suppressed every push for users who had already granted
      // permission. The app-level toggle is a way to opt back *out*.
      pushNotifications: { type: Boolean, default: true },
      weeklyProgress: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
      studyReminders: { type: Boolean, default: true },
      streakAlerts: { type: Boolean, default: true },
      reminderHour: { type: Number, default: 19, min: 0, max: 23 },
      reminderMinute: { type: Number, default: 0, min: 0, max: 59 },
      timezoneOffset: { type: Number, default: 0, min: -840, max: 840 },
      dailyGoalMinutes: { type: Number, default: 15, min: 1, max: 480 },
    },
    expoPushToken: {
      type: String,
      default: '',
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
    totalStudyDays: {
      type: Number,
      default: 0,
    },
    totalXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEngagementEmailDay: {
      type: String,
      default: null,
    },
    lastStreakEmailDay: {
      type: String,
      default: null,
    },
    lastWeeklyEmailWeek: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
