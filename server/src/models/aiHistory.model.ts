import mongoose, { Schema, Document } from 'mongoose';

export type AIGenerationType = 'summarize' | 'quiz' | 'flashcards' | 'qa' | 'course_quiz' | 'topic_quiz' | 'tutor_explain';

export interface IAiHistory extends Document {
  user: mongoose.Types.ObjectId;
  type: AIGenerationType;
  title: string;
  prompt: string;
  metadata?: {
    courseId?: mongoose.Types.ObjectId | string;
    topicId?: mongoose.Types.ObjectId | string;
    courseTitle?: string;
    topicTitle?: string;
    count?: number;
    difficulty?: string;
    [key: string]: any;
  };
  result: any;
  createdAt: Date;
  updatedAt: Date;
}

const AiHistorySchema: Schema = new Schema<IAiHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['summarize', 'quiz', 'flashcards', 'qa', 'course_quiz', 'topic_quiz', 'tutor_explain'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AiHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IAiHistory>('AiHistory', AiHistorySchema);
