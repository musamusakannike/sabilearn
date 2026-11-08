import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function cleanTextContent(text: string): string {
  if (typeof text !== 'string' || !text) return text;

  // Split text by code blocks (```...```) and inline code (`...`)
  // Delimiter capturing regex ensures odd-indexed items in the split array are code blocks/spans
  const tokens = text.split(/(```[\s\S]*?```|`[^`\n]*`)/g);

  const cleanedTokens = tokens.map((token) => {
    // If it is a code block or inline code, keep it untouched
    if (token.startsWith('```') || (token.startsWith('`') && token.endsWith('`') && token.length >= 2)) {
      return token;
    }

    // Normal prose:
    // 1. Remove markdown headings (e.g. ###, ##, ####) at line starts
    let cleaned = token.replace(/(^|\n)#{2,4}\s*/g, '$1');

    // 2. Remove bold asterisks "**" (and "***")
    cleaned = cleaned.replace(/\*{2,3}/g, '');

    return cleaned;
  });

  return cleanedTokens.join('');
}

export async function cleanupLatestCoursesMarkdown() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in server/.env');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }

  const latestCourseIds = [
    '6aefed07e080ec3c0b9f3f44', // Laplace Transforms
    '6aed71b82bcb6993dbc38f11', // Sequence and Series
    '6aed676241782af353ae869d', // Sets and Operations on Sets
    '6aed0a971bcf73a2815c6e4f', // Python Programming for Beginners
    '6aed05167bc2c423eeacd1cf', // Next.js for Beginners
    '6aecf23158b2a14fdcded829', // React.js for Beginners
    '6aecdf23b2733601907774e4', // ROS2 for Beginners
  ];

  console.log(`Starting cleanup for ${latestCourseIds.length} latest courses...`);

  let totalCoursesProcessed = 0;
  let totalTopicsUpdated = 0;
  let totalTextBlocksCleaned = 0;

  for (const courseIdStr of latestCourseIds) {
    const courseId = new mongoose.Types.ObjectId(courseIdStr);
    const course = await db.collection('courses').findOne({ _id: courseId });
    if (!course) {
      console.warn(`Course not found: ${courseIdStr}`);
      continue;
    }

    const topics = await db.collection('topics').find({ course: courseId }).toArray();
    let courseTopicsUpdated = 0;
    let courseBlocksCleaned = 0;

    for (const topic of topics) {
      let topicModified = false;

      function sanitizeBlocks(item: any) {
        if (!item) return;
        if (item.blocks && Array.isArray(item.blocks)) {
          item.blocks.forEach(sanitizeBlocks);
        }
        if (item.type === 'text' && typeof item.content === 'string') {
          const original = item.content;
          const cleaned = cleanTextContent(original);
          if (cleaned !== original) {
            item.content = cleaned;
            topicModified = true;
            courseBlocksCleaned++;
          }
        }
      }

      (topic.contents || []).forEach(sanitizeBlocks);

      if (topicModified) {
        await db.collection('topics').updateOne(
          { _id: topic._id },
          { $set: { contents: topic.contents, updatedAt: new Date() } }
        );
        courseTopicsUpdated++;
      }
    }

    console.log(
      `✓ Cleaned "${course.title}": ${courseTopicsUpdated}/${topics.length} topics updated (${courseBlocksCleaned} text blocks cleaned)`
    );

    totalCoursesProcessed++;
    totalTopicsUpdated += courseTopicsUpdated;
    totalTextBlocksCleaned += courseBlocksCleaned;
  }

  console.log('----------------------------------------------------');
  console.log(`Cleanup complete!`);
  console.log(`Total courses processed: ${totalCoursesProcessed}`);
  console.log(`Total topics updated: ${totalTopicsUpdated}`);
  console.log(`Total text blocks cleaned: ${totalTextBlocksCleaned}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  cleanupLatestCoursesMarkdown().catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  });
}
