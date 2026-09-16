import mongoose, { Schema, Document } from 'mongoose';

export type PlaygroundKind = 'web' | 'python';

export interface IPlaygroundProject extends Document {
  user: mongoose.Types.ObjectId;
  localId: string;
  name: string;
  kind: PlaygroundKind;
  files: Record<string, string>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlaygroundProjectSchema: Schema = new Schema<IPlaygroundProject>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    localId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    kind: {
      type: String,
      enum: ['web', 'python'],
      required: true,
    },
    files: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

PlaygroundProjectSchema.index({ user: 1, localId: 1 }, { unique: true });

export default mongoose.model<IPlaygroundProject>('PlaygroundProject', PlaygroundProjectSchema);
