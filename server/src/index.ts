import dotenv from 'dotenv';
// Initialize environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.config';
import { initFirebase } from './config/firebase.config';
import authRoutes from './routes/auth.route';
import courseRoutes from './routes/course.route';
import topicRoutes from './routes/topic.route';
import flashcardRoutes from './routes/flashcard.route';
import mcqRoutes from './routes/mcq.route';
import progressRoutes from './routes/progress.route';
import userRoutes from './routes/user.route';
import notificationRoutes from './routes/notification.route';
import adminRoutes from './routes/admin.route';
import searchRoutes from './routes/search.route';
import mediaRoutes from './routes/media.route';
import paymentRoutes from './routes/payment.route';
import blogRoutes from './routes/blog.route';
import aiRoutes from './routes/ai.route';
import courseArchitectRoutes, { aiCoursesRouter } from './routes/courseArchitect.route';
import chapterRoutes from './routes/chapter.route';
import leaderboardRoutes from './routes/leaderboard.route';
import appReviewRoutes from './routes/appReview.route';
import playgroundRoutes from './routes/playground.route';
import { errorHandler } from './middlewares/error.middleware';
import { startScheduler } from './jobs/scheduler';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Initialize Firebase Admin
initFirebase();

// Global Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
// Mounted before express.json() so the webhook route's express.raw() middleware
// sees the untouched request body — required for Paystack signature verification.
app.use('/api/v1/payments', paymentRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('dev'));

// Base/Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/chapters', chapterRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/flashcards', flashcardRoutes);
app.use('/api/v1/mcqs', mcqRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ai/course-architect', courseArchitectRoutes);
app.use('/api/v1/ai/courses', aiCoursesRouter);
app.use('/api/v1/playground', playgroundRoutes);
app.use('/api/v1/app-review', appReviewRoutes);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Global Error Handling Middleware
app.use(errorHandler);

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Started after listen so a scheduler fault can never block the port binding.
  startScheduler();
});
