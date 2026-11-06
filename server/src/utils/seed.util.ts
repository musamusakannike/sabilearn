import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import Course, { ICourse } from '../models/course.model';
import Topic, { ITopicContent } from '../models/topic.model';
import Flashcard from '../models/flashcard.model';
import MCQ from '../models/mcq.model';
import StudySession from '../models/studySession.model';
import UserProgress from '../models/userProgress.model';
import Notification from '../models/notification.model';
import { connectDB } from '../config/db.config';

interface TopicSeed {
  title: string;
  description: string;
  contents: ITopicContent[];
  flashcards: { question: string; answer: string }[];
  mcqs: {
    question: string;
    options: { text: string; isCorrect: boolean }[];
    explanation: string;
  }[];
}

interface CourseSeed {
  course: Partial<ICourse>;
  topics: TopicSeed[];
}

const coursesSeed: CourseSeed[] = [
  {
    course: {
      title: 'Python Programming Fundamentals',
      description: 'Learn to write real Python code from scratch.',
      longDescription: 'A hands-on introduction to Python covering variables, control flow, functions, and data structures — with runnable code examples throughout.',
      category: 'Programming',
      track: 'tech',
      difficulty: 'beginner',
      whatYouWillLearn: [
        'Write and run Python scripts',
        'Use variables, loops, and conditionals',
        'Define and call functions',
        'Work with lists and dictionaries',
      ],
      isPublished: true,
      order: 1,
    },
    topics: [
      {
        title: 'Variables and Data Types',
        description: 'How Python stores and labels data.',
        contents: [
          { type: 'text', content: 'Python variables are created the moment you assign a value to them — no declarations needed. Every value has a type, but Python figures it out for you.' },
          {
            type: 'code',
            content: "name = \"Ada\"\nage = 28\nis_student = False\n\nprint(f\"{name} is {age} years old\")",
            language: 'python',
          } as ITopicContent,
          { type: 'text', content: 'Common built-in types include str, int, float, bool, list, and dict.' },
        ],
        flashcards: [
          { question: 'How do you create a variable in Python?', answer: 'Assign a value with =, e.g. x = 5. No type declaration is needed.' },
          { question: 'What function converts a value to a string?', answer: 'str()' },
        ],
        mcqs: [
          {
            question: 'What is the output of print(type(5))?',
            options: [
              { text: "<class 'int'>", isCorrect: true },
              { text: "<class 'float'>", isCorrect: false },
              { text: "<class 'str'>", isCorrect: false },
              { text: "<class 'bool'>", isCorrect: false },
            ],
            explanation: '5 has no decimal point, so Python infers the int type.',
          },
        ],
      },
      {
        title: 'Control Flow',
        description: 'Making decisions and repeating work with if statements and loops.',
        contents: [
          { type: 'text', content: 'if/elif/else statements let your program branch based on conditions. for and while loops let it repeat.' },
          {
            type: 'code',
            content: 'for n in range(1, 6):\n    if n % 2 == 0:\n        print(f"{n} is even")\n    else:\n        print(f"{n} is odd")',
            language: 'python',
          } as ITopicContent,
        ],
        flashcards: [
          { question: 'What does range(1, 6) produce?', answer: 'The integers 1, 2, 3, 4, 5 (stops before 6).' },
          { question: 'What keyword starts a loop condition check without a counter?', answer: 'while' },
        ],
        mcqs: [
          {
            question: 'Which operator checks the remainder of a division in Python?',
            options: [
              { text: '%', isCorrect: true },
              { text: '//', isCorrect: false },
              { text: '**', isCorrect: false },
              { text: '&', isCorrect: false },
            ],
            explanation: '% is the modulo operator, returning the remainder of division.',
          },
        ],
      },
      {
        title: 'Functions',
        description: 'Packaging reusable logic with def.',
        contents: [
          { type: 'text', content: 'Functions are defined with def, can take parameters with default values, and return a value with return.' },
          {
            type: 'code',
            content: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Chidi"))\nprint(greet("Amara", greeting="Sabi"))',
            language: 'python',
          } as ITopicContent,
        ],
        flashcards: [
          { question: 'What keyword defines a function in Python?', answer: 'def' },
          { question: 'What happens if a function has no return statement?', answer: 'It returns None.' },
        ],
        mcqs: [
          {
            question: 'What does greet("Amara", greeting="Sabi") return, given the example above?',
            options: [
              { text: '"Sabi, Amara!"', isCorrect: true },
              { text: '"Hello, Amara!"', isCorrect: false },
              { text: '"Amara, Sabi!"', isCorrect: false },
              { text: 'None', isCorrect: false },
            ],
            explanation: 'The keyword argument greeting="Sabi" overrides the default value "Hello".',
          },
        ],
      },
    ],
  },
  {
    course: {
      title: 'Study Skills for Self-Learners',
      description: 'Build habits that make independent learning stick.',
      longDescription: 'Practical, non-technical strategies for staying consistent, retaining what you study, and avoiding burnout — useful alongside any course on SabiLearn.',
      category: 'Study Skills',
      track: 'tech',
      difficulty: 'beginner',
      whatYouWillLearn: [
        'Build a sustainable daily study streak',
        'Use spaced repetition effectively',
        'Set realistic weekly goals',
      ],
      isPublished: true,
      order: 2,
    },
    topics: [
      {
        title: 'Building a Study Streak',
        description: 'Why consistency beats cramming.',
        contents: [
          { type: 'text', content: 'A short daily session beats a long weekly one. SabiLearn tracks your streak automatically — study once a day, at your own pace, in your own timezone.' },
        ],
        flashcards: [
          { question: 'What matters more for retention: session length or consistency?', answer: 'Consistency — frequent short sessions beat infrequent long ones.' },
        ],
        mcqs: [
          {
            question: 'What resets a SabiLearn study streak?',
            options: [
              { text: 'Missing a full local day without studying', isCorrect: true },
              { text: 'Studying a different course', isCorrect: false },
              { text: 'Logging out', isCorrect: false },
              { text: 'Switching devices', isCorrect: false },
            ],
            explanation: 'Streaks are tracked per local day; a missed day resets the streak.',
          },
        ],
      },
    ],
  },
  {
    course: {
      title: 'Elementary Mathematics I (MTH 101)',
      description: 'Foundational algebra, trigonometry, and coordinate geometry for 100L STEM students.',
      longDescription: 'Comprehensive 100-level university mathematics covering set theory, quadratic equations, progressions (AP & GP), binomial theorem, and circular functions.',
      category: 'Mathematics',
      track: 'academic',
      academicMeta: {
        courseCode: 'MTH 101',
        faculty: 'Physical Sciences',
        department: 'Mathematics',
        level: '100L',
        semester: 'first',
        creditUnits: 3,
      },
      difficulty: 'beginner',
      whatYouWillLearn: [
        'Solve quadratic equations using factoring and the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
        'Analyze sets, mappings, and real number properties',
        'Compute sums of Arithmetic and Geometric Progressions',
        'Apply binomial expansion for rational indices',
      ],
      isPublished: true,
      order: 3,
    },
    topics: [
      {
        title: 'Quadratic Equations & Roots',
        description: 'Derivation and application of the quadratic formula.',
        contents: [
          {
            type: 'text',
            content: 'A quadratic equation in standard form is written as:\n\n$$ax^2 + bx + c = 0$$\n\nwhere $a \\neq 0$. The roots are given by the quadratic formula:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nThe discriminant $\\Delta = b^2 - 4ac$ determines the nature of the roots:\n- If $\\Delta > 0$, roots are real and distinct.\n- If $\\Delta = 0$, roots are real and equal.\n- If $\\Delta < 0$, roots are complex conjugates.',
          },
        ],
        flashcards: [
          {
            question: 'What is the discriminant formula for $ax^2 + bx + c = 0$?',
            answer: '$\\Delta = b^2 - 4ac$',
          },
          {
            question: 'What does $\\Delta < 0$ indicate about the roots of a quadratic equation?',
            answer: 'The roots are complex conjugates (no real solutions).',
          },
        ],
        mcqs: [
          {
            question: 'If the discriminant $\\Delta = b^2 - 4ac = 0$, what can you say about the roots?',
            options: [
              { text: 'They are real and equal', isCorrect: true },
              { text: 'They are real and distinct', isCorrect: false },
              { text: 'They are imaginary numbers', isCorrect: false },
              { text: 'No roots exist', isCorrect: false },
            ],
            explanation: 'When $\\Delta = 0$, $\\sqrt{0} = 0$, giving the single repeated root $x = -b / (2a)$.',
          },
        ],
      },
    ],
  },
];

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Topic.deleteMany({}),
      Flashcard.deleteMany({}),
      MCQ.deleteMany({}),
      StudySession.deleteMany({}),
      UserProgress.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const admin = await User.create({
      email: 'admin@sabilearn.online',
      password: adminPassword,
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      level: 'advanced',
      role: 'admin',
      bio: 'System administrator for SabiLearn.',
    });

    const user = await User.create({
      email: 'student@sabilearn.online',
      password: userPassword,
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      level: 'intermediate',
      role: 'user',
      bio: 'Learning to code and build better study habits on SabiLearn.',
    });

    console.log('Creating courses, topics, flashcards, and MCQs...');
    let totalTopics = 0;
    let totalFlashcards = 0;
    let totalMcqs = 0;

    for (const seed of coursesSeed) {
      const course = await Course.create(seed.course);

      for (let i = 0; i < seed.topics.length; i++) {
        const topicSeed = seed.topics[i];
        const topic = await Topic.create({
          course: course._id,
          title: topicSeed.title,
          description: topicSeed.description,
          contents: topicSeed.contents,
          order: i + 1,
          isPublished: true,
        });
        totalTopics++;

        if (topicSeed.flashcards.length > 0) {
          const flashcardDocs = topicSeed.flashcards.map((f) => ({
            topic: topic._id,
            question: f.question,
            answer: f.answer,
          }));
          await Flashcard.insertMany(flashcardDocs);
          totalFlashcards += flashcardDocs.length;
        }

        if (topicSeed.mcqs.length > 0) {
          const mcqDocs = topicSeed.mcqs.map((m) => ({
            topic: topic._id,
            question: m.question,
            options: m.options,
            explanation: m.explanation,
          }));
          await MCQ.insertMany(mcqDocs);
          totalMcqs += mcqDocs.length;
        }
      }
    }

    console.log('Creating notifications...');
    const pythonCourse = await Course.findOne({ category: 'Programming' });
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    await Notification.create([
      {
        user: user._id,
        type: 'announcement',
        category: 'welcome',
        title: 'Welcome to SabiLearn!',
        message: 'Start your learning journey by exploring our courses.',
        actionUrl: '/dashboard/courses',
        isRead: false,
        sentAt: new Date(),
        dedupeKey: `welcome:${user._id}`,
      },
      {
        user: null,
        type: 'info',
        category: 'course',
        title: 'New Course Available',
        message: 'Python Programming Fundamentals is now available.',
        isRead: false,
        actionUrl: pythonCourse ? `/dashboard/courses/${pythonCourse._id}` : '/dashboard/courses',
        sentAt: new Date(),
        dedupeKey: pythonCourse ? `course-published:${pythonCourse._id}` : undefined,
      },
      {
        user: user._id,
        type: 'success',
        category: 'achievement',
        title: 'Study Streak Achievement',
        message: 'You have completed your first study session. Keep it up!',
        actionUrl: '/dashboard/progress',
        isRead: false,
        sentAt: new Date(),
        dedupeKey: `achievement:first-session:${user._id}`,
      },
      {
        user: null,
        type: 'warning',
        category: 'system',
        title: 'Scheduled Maintenance',
        message: 'The platform will undergo maintenance this Sunday from 2-4 AM EST.',
        isRead: false,
        scheduledFor: inTwoDays,
        sentAt: null,
      },
    ]);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('Admin login:  admin@sabilearn.online / admin123');
    console.log('User login:   student@sabilearn.online / user123');
    console.log(`Created: ${coursesSeed.length} courses, ${totalTopics} topics, ${totalFlashcards} flashcards, ${totalMcqs} MCQs`);
    console.log('========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
