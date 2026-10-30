import mongoose, { Schema, Document } from 'mongoose';

export type CourseRequestCategory = 'academic' | 'non-academic';

export interface ICourseRequest extends Document {
  courseName: string;
  category: CourseRequestCategory;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseRequestSchema = new Schema<ICourseRequest>(
  {
    courseName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    category: { type: String, enum: ['academic', 'non-academic'], required: true, index: true },
    details: { type: String, trim: true, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseRequest>('CourseRequest', CourseRequestSchema);
