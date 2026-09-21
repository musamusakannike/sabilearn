import mongoose, { Schema, Document } from 'mongoose';
import { IExercise, ExerciseSchema } from './chapter.model';

export type TopicContentType = 'text' | 'latex' | 'youtube' | 'image' | 'video' | 'audio' | 'code' | 'quiz' | 'exercise' | 'group';

export interface ITopicContent {
  type: TopicContentType;
  content: string;
  language?: string;
  title?: string;
  quiz?: any;
  exercise?: any;
  blocks?: any[];
}

export interface ITopic extends Document {
  course: mongoose.Types.ObjectId;
  chapter?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subConcepts?: string[];
  hasCodingTask?: boolean;
  practiceTaskSummary?: string;
  isGenerated?: boolean;
  contents: ITopicContent[];
  exercise?: IExercise;
  xp: number;
  order: number;
  isPublished: boolean;
  flashcardCount?: number;
  mcqCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicContentSchema = new Schema<ITopicContent>(
  {
    type: {
      type: String,
      enum: ['text', 'latex', 'youtube', 'image', 'video', 'audio', 'code', 'quiz', 'exercise', 'group'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: undefined,
    },
    title: {
      type: String,
      default: undefined,
    },
    quiz: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    exercise: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    blocks: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
  },
  { _id: true }
);

const TopicSchema: Schema = new Schema<ITopic>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    chapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    subConcepts: {
      type: [String],
      default: [],
    },
    hasCodingTask: {
      type: Boolean,
      default: false,
    },
    practiceTaskSummary: {
      type: String,
      default: '',
    },
    isGenerated: {
      type: Boolean,
      default: false,
    },
    contents: [TopicContentSchema],
    exercise: {
      type: ExerciseSchema,
      default: undefined,
    },
    xp: {
      type: Number,
      default: 50,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TopicSchema.virtual('flashcardCount', {
  ref: 'Flashcard',
  localField: '_id',
  foreignField: 'topic',
  count: true,
});

TopicSchema.virtual('mcqCount', {
  ref: 'MCQ',
  localField: '_id',
  foreignField: 'topic',
  count: true,
});

TopicSchema.set('toJSON', { virtuals: true });
TopicSchema.set('toObject', { virtuals: true });

export default mongoose.model<ITopic>('Topic', TopicSchema);
