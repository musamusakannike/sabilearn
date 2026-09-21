import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'mcq' | 'fill_in_blank' | 'code_execution';

export interface IQuestion {
  _id?: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  starterCode?: string;
  expectedOutput?: string;
  language?: string;
  xp: number;
}

export interface IExercise {
  title?: string;
  instructions?: string;
  questions: IQuestion[];
}

export interface IChapter extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  capstoneGoal?: string;
  capstoneDifficulty?: 'medium' | 'hard';
  exercise?: IExercise;
  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = new Schema<IQuestion>(
  {
    type: {
      type: String,
      enum: ['mcq', 'fill_in_blank', 'code_execution'],
      required: true,
    },
    question: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, default: '', trim: true },
    starterCode: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    xp: { type: Number, default: 20, min: 0 },
  },
  { _id: true }
);

export const ExerciseSchema = new Schema<IExercise>(
  {
    title: { type: String, default: '' },
    instructions: { type: String, default: '' },
    questions: [QuestionSchema],
  },
  { _id: false }
);

const ChapterSchema: Schema = new Schema<IChapter>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
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
    order: {
      type: Number,
      default: 0,
    },
    capstoneGoal: {
      type: String,
      default: '',
    },
    capstoneDifficulty: {
      type: String,
      enum: ['medium', 'hard'],
      default: 'medium',
    },
    exercise: {
      type: ExerciseSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

ChapterSchema.virtual('topics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'chapter',
});

ChapterSchema.set('toJSON', { virtuals: true });
ChapterSchema.set('toObject', { virtuals: true });

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
