import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Course from '../models/course.model';
import Chapter from '../models/chapter.model';
import Topic from '../models/topic.model';
import UserProgress from '../models/userProgress.model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OFFLINE_COURSE_IDS = [
  '6aab2e6321805f5b24f0fc83', // Web Development for Beginners: HTML, CSS & JavaScript from Scratch
  '6aed0a971bcf73a2815c6e4f', // Python Programming for Beginners: From First Line to Full Applications
];

async function exportOfflineCourses() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in server/.env');
  }

  await mongoose.connect(mongoUri);

  const coursesBundle: Record<string, any> = {};

  for (const courseId of OFFLINE_COURSE_IDS) {
    const courseDoc = await Course.findById(courseId)
      .select('-sourceContext -documentIndex -sourceChunks -sourceSummary')
      .lean();

    if (!courseDoc) {
      throw new Error(`Course ${courseId} not found in database`);
    }

    const chapters = await Chapter.find({ course: courseId }).sort({ order: 1 }).lean();
    const topics = await Topic.find({ course: courseId, isPublished: true }).sort({ order: 1 }).lean();

    const registeredUsersCount = await UserProgress.distinct('user', { course: courseId }).then((u) => u.length);
    const lessonCount = topics.reduce((acc, t) => acc + (t.contents?.length || 0), 0);
    const totalObtainableXp = topics.reduce((acc, t) => {
      const topicXp = t.xp || 50;
      const exerciseXp = (t.exercise?.questions || []).reduce((qAcc, q) => qAcc + (q.xp || 10), 0);
      return acc + topicXp + exerciseXp;
    }, 0);

    const serializedCourse = {
      ...courseDoc,
      _id: String(courseDoc._id),
      topicCount: topics.length,
      registeredUsersCount,
      lessonCount,
      totalObtainableXp,
    };

    const serializedChapters = chapters.map((ch) => ({
      ...ch,
      _id: String(ch._id),
      course: String(ch.course),
      exercise: ch.exercise
        ? {
            ...ch.exercise,
            questions: (ch.exercise.questions || []).map((q: any) => ({
              ...q,
              _id: q._id ? String(q._id) : undefined,
            })),
          }
        : undefined,
    }));

    const serializedTopics = topics.map((t) => ({
      ...t,
      _id: String(t._id),
      course: String(t.course),
      chapter: t.chapter ? String(t.chapter) : undefined,
      contents: (t.contents || []).map((c: any) => ({
        ...c,
        _id: c._id ? String(c._id) : undefined,
      })),
      exercise: t.exercise
        ? {
            ...t.exercise,
            questions: (t.exercise.questions || []).map((q: any) => ({
              ...q,
              _id: q._id ? String(q._id) : undefined,
            })),
          }
        : undefined,
    }));

    coursesBundle[String(courseDoc._id)] = {
      course: serializedCourse,
      chapters: serializedChapters,
      topics: serializedTopics,
      exportedAt: new Date().toISOString(),
    };

    console.log(
      `Exported "${courseDoc.title}" (${courseDoc._id}): ${serializedChapters.length} chapters, ${serializedTopics.length} topics, ${lessonCount} steps`
    );
  }

  const outDir = path.resolve(__dirname, '../../../mobile/src/assets/offlineCourses');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'bundledCourses.json');
  fs.writeFileSync(outFile, JSON.stringify(coursesBundle, null, 2), 'utf8');

  const stats = fs.statSync(outFile);
  console.log(`Successfully wrote bundle to ${outFile} (${(stats.size / 1024).toFixed(1)} KB)`);

  await mongoose.disconnect();
}

exportOfflineCourses().catch((err) => {
  console.error('Failed to export offline courses:', err);
  process.exit(1);
});
