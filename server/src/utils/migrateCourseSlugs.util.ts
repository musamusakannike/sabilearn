import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/course.model';
import { generateUniqueCourseSlug } from './courseSlug.util';

dotenv.config();

/**
 * Idempotent backfill: assigns a unique slug to every course that lacks one.
 * Run with: npx ts-node src/utils/migrateCourseSlugs.util.ts
 */
const run = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const courses = await Course.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] }).select('title');

  for (const course of courses) {
    const slug = await generateUniqueCourseSlug(course.title, String(course._id));
    await Course.updateOne({ _id: course._id }, { $set: { slug } });
    console.log(`${course.title} -> ${slug}`);
  }

  console.log(`Backfilled ${courses.length} course slug(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
