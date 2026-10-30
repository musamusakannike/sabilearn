import { Request, Response, NextFunction } from 'express';
import CourseRequest from '../models/courseRequest.model';

export const createCourseRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseName = typeof req.body.courseName === 'string' ? req.body.courseName.trim() : '';
    const category = req.body.category;
    const details = typeof req.body.details === 'string' ? req.body.details.trim() : '';

    if (courseName.length < 2 || courseName.length > 120) {
      res.status(400).json({ success: false, message: 'Course name must be between 2 and 120 characters.' });
      return;
    }
    if (category !== 'academic' && category !== 'non-academic') {
      res.status(400).json({ success: false, message: 'Choose Academic or Non-academic.' });
      return;
    }
    if (details.length > 1000) {
      res.status(400).json({ success: false, message: 'Details must be 1000 characters or fewer.' });
      return;
    }

    const courseRequest = await CourseRequest.create({ courseName, category, details });
    res.status(201).json({
      success: true,
      message: 'Your course request has been submitted.',
      data: { id: courseRequest._id, courseName: courseRequest.courseName, category: courseRequest.category, createdAt: courseRequest.createdAt },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await CourseRequest.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};
