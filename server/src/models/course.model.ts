import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseAuthor {
  name: string;
  avatar: string;
  role?: string;
  bio?: string;
}

export interface IAcademicMeta {
  courseCode?: string;
  faculty?: string;
  department?: string;
  level?: '100L' | '200L' | '300L' | '400L' | '500L' | 'postgraduate';
  semester?: 'first' | 'second';
  creditUnits?: number;
}

export interface ICourse extends Document {
  title: string;
  /** URL-safe unique slug used for public course pages (/courses/:slug) */
  slug?: string;
  description: string;
  longDescription: string;
  banner: string;
  category: string;
  /** Search tags and alternate codes (e.g., maths, MTH, MAT101, algebra) */
  tags?: string[];
  /** Primary track: 'tech' for coding/engineering/software, 'academic' for university courses */
  track: 'tech' | 'academic';
  /** Metadata specific to academic university courses */
  academicMeta?: IAcademicMeta;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  authors: ICourseAuthor[];
  whatYouWillLearn: string[];
  prerequisites: string[];
  isPublished: boolean;
  order: number;
  /** Free courses are accessible to everyone regardless of subscription/purchase. */
  isFree: boolean;
  /** Price in kobo (NGN smallest unit). Ignored when isFree is true. */
  price: number;
  /** Whether the course was generated via the AI Course Architect */
  isAiGenerated: boolean;
  /** Creator/owner of this course (null for official platform courses) */
  creator?: mongoose.Types.ObjectId | null;
  /** Visibility for AI generated courses: private (only creator), unlisted (link only), public (community catalog) */
  visibility: 'public' | 'unlisted' | 'private';
  /** Unique shareable slug or token for public/unlisted courses */
  shareSlug?: string;
  /** Summary of original source/upload prompt */
  sourceSummary?: string;
  /** Full extracted source text / document context used to generate curriculum and lessons */
  sourceContext?: string;
  /** Macro Annotated Document Index produced by Phase 1 */
  documentIndex?: any[];
  /** Sanitized structural chunks for targeted Phase 2 micro-grounding */
  sourceChunks?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseAuthorSchema = new Schema<ICourseAuthor>(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'Instructor' },
    bio: { type: String, default: '' },
  },
  { _id: false }
);

const CourseSchema: Schema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    longDescription: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    track: {
      type: String,
      enum: ['tech', 'academic'],
      default: 'tech',
      index: true,
    },
    academicMeta: {
      courseCode: { type: String, trim: true, uppercase: true, index: true },
      faculty: { type: String, trim: true },
      department: { type: String, trim: true },
      level: {
        type: String,
        enum: ['100L', '200L', '300L', '400L', '500L', 'postgraduate'],
        index: true,
      },
      semester: {
        type: String,
        enum: ['first', 'second'],
      },
      creditUnits: { type: Number, min: 0 },
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    authors: {
      type: [CourseAuthorSchema],
      default: [],
    },
    whatYouWillLearn: [{ type: String }],
    prerequisites: [{ type: String }],
    isPublished: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'private',
      index: true,
    },
    shareSlug: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    sourceSummary: {
      type: String,
      default: '',
    },
    sourceContext: {
      type: String,
      default: '',
    },
    documentIndex: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    sourceChunks: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'course',
});

CourseSchema.virtual('topicCount', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'course',
  count: true,
});

CourseSchema.set('toJSON', { virtuals: true });
CourseSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
