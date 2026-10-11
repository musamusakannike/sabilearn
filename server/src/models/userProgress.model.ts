import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProgress extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lastChapter?: mongoose.Types.ObjectId;
  lastTopic?: mongoose.Types.ObjectId;
  lastContentIndex: number;
  completedTopics: mongoose.Types.ObjectId[];
  completedChapters: mongoose.Types.ObjectId[];
  passedExercises: string[];
  percentCompleted: number;
  isCompleted: boolean;
  lastStudiedAt: Date;
  /** Set the first time the learner actually opens the course's first topic. */
  firstTopicOpenedAt?: Date | null;
  /** Set when the 2-hour unfinished-first-topic email has been sent. */
  firstTopicNudgeSentAt?: Date | null;
  lastResumeEmailAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema: Schema = new Schema<IUserProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lastChapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    lastTopic: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    lastContentIndex: {
      type: Number,
      default: 0,
    },
    completedTopics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    completedChapters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    passedExercises: [{ type: String }],
    percentCompleted: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastStudiedAt: {
      type: Date,
      default: Date.now,
    },
    firstTopicOpenedAt: {
      type: Date,
      default: null,
    },
    firstTopicNudgeSentAt: {
      type: Date,
      default: null,
    },
    lastResumeEmailAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserProgressSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
