import { Request, Response, NextFunction } from 'express';
import BlogPost from '../models/blog.model';
import { slugify, estimateReadingTime } from '../utils/slug.util';
import { uploadToR2 } from '../utils/r2.util';
import sharp from 'sharp';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { broadcastBlogPostPublished } from '../services/notification.service';

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

const processBlogCoverImage = async (buffer: Buffer): Promise<{ buffer: Buffer; mimetype: string; extension: string }> => {
  try {
    const optimized = await sharp(buffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    return { buffer: optimized, mimetype: 'image/jpeg', extension: 'jpg' };
  } catch {
    return { buffer, mimetype: 'image/jpeg', extension: 'jpg' };
  }
};

const generateUniqueSlug = async (title: string, ignoreId?: string): Promise<string> => {
  const base = slugify(title);
  let slug = base;
  let suffix = 1;

  while (await BlogPost.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};

export const getBlogPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 9;
    const skip = (page - 1) * limit;

    const includeDrafts = req.query.includeDrafts === 'true';
    const filter: Record<string, unknown> = includeDrafts ? {} : { isPublished: true };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const posts = await BlogPost.find(filter)
      .select('-content')
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await BlogPost.distinct('category', { isPublished: true });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar');

    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found.' });
      return;
    }

    const related = await BlogPost.find({
      _id: { $ne: post._id },
      isPublished: true,
      category: post.category,
    })
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(3);

    res.status(200).json({ success: true, data: post, related });
  } catch (error) {
    next(error);
  }
};

export const getBlogPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name avatar');

    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found.' });
      return;
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const createBlogPost = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, excerpt, content, category, tags, isPublished, coverImage, seoTitle, seoDescription } = req.body;

    let coverImageUrl = typeof coverImage === 'string' ? coverImage : '';
    if (req.file) {
      const processed = await processBlogCoverImage(req.file.buffer);
      const safeName = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
      const fileKey = `blog/${Date.now()}-${safeName}.${processed.extension}`;
      coverImageUrl = await uploadToR2(processed.buffer, fileKey, processed.mimetype);
    }

    const slug = await generateUniqueSlug(title);
    const published = isPublished === 'true' || isPublished === true;
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : Array.isArray(tags) ? tags : [];

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      category,
      tags: parsedTags,
      coverImage: coverImageUrl,
      author: req.user!._id,
      isPublished: published,
      publishedAt: published ? new Date() : null,
      readingTimeMinutes: estimateReadingTime(content || ''),
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    });

    if (published) {
      broadcastBlogPostPublished(post).catch((err) => {
        console.error('Failed to broadcast blog push notification:', err);
      });
    }

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const updateBlogPost = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, excerpt, content, category, tags, isPublished, coverImage, seoTitle, seoDescription } = req.body;

    const existing = await BlogPost.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Blog post not found.' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (typeof title === 'string' && title !== existing.title) {
      updates.title = title;
      updates.slug = await generateUniqueSlug(title, String(req.params.id));
    }
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (content !== undefined) {
      updates.content = content;
      updates.readingTimeMinutes = estimateReadingTime(content);
    }
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (typeof coverImage === 'string') updates.coverImage = coverImage;
    if (seoTitle !== undefined) updates.seoTitle = seoTitle;
    if (seoDescription !== undefined) updates.seoDescription = seoDescription;

    if (req.file) {
      const processed = await processBlogCoverImage(req.file.buffer);
      const safeName = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/\s+/g, '-');
      const fileKey = `blog/${Date.now()}-${safeName}.${processed.extension}`;
      updates.coverImage = await uploadToR2(processed.buffer, fileKey, processed.mimetype);
    }

    let wasNewlyPublished = false;
    if (isPublished !== undefined) {
      const published = isPublished === 'true' || isPublished === true;
      updates.isPublished = published;
      if (published && !existing.isPublished) {
        updates.publishedAt = new Date();
        wasNewlyPublished = true;
      }
    }

    const post = await BlogPost.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('author', 'name avatar');

    if (wasNewlyPublished && post) {
      broadcastBlogPostPublished(post).catch((err) => {
        console.error('Failed to broadcast blog push notification:', err);
      });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Blog post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
