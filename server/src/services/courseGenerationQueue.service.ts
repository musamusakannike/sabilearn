import { EventEmitter } from 'events';
import crypto from 'crypto';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface CourseGenerationJob {
  id: string;
  userId: string;
  status: JobStatus;
  progress: number; // 0 to 100
  stage: string;
  error?: string;
  result?: any;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    courseTitle?: string;
    totalPages?: number;
    fileCount?: number;
  };
}

export type JobEventListener = (job: CourseGenerationJob) => void;

class CourseGenerationQueueService extends EventEmitter {
  private jobs: Map<string, CourseGenerationJob> = new Map();
  private maxConcurrency = parseInt(process.env.QUEUE_CONCURRENCY || '1', 10);
  private activeJobsCount = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor() {
    super();
    // Allow up to 100 SSE listener connections
    this.setMaxListeners(100);

    // Periodically clean up jobs older than 1 hour to save RAM on EC2 t3.micro
    setInterval(() => this.cleanupOldJobs(), 15 * 60 * 1000);
  }

  /**
   * Create a new tracking job.
   */
  public createJob(
    userId: string,
    metadata?: { courseTitle?: string; totalPages?: number; fileCount?: number }
  ): CourseGenerationJob {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const job: CourseGenerationJob = {
      id,
      userId,
      status: 'queued',
      progress: 5,
      stage: 'Queued for processing...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata,
    };

    this.jobs.set(id, job);
    this.emit(`update:${id}`, job);
    return job;
  }

  /**
   * Retrieve job state.
   */
  public getJob(id: string): CourseGenerationJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Enqueue an async execution task with concurrency throttling.
   */
  public enqueue(jobId: string, task: () => Promise<void>): void {
    const runner = async () => {
      this.activeJobsCount++;
      this.updateProgress(jobId, 10, 'Starting document ingestion and preprocessing...');
      try {
        await task();
      } catch (err: any) {
        this.failJob(jobId, err.message || 'Unexpected generation error.');
      } finally {
        this.activeJobsCount--;
        this.processNext();
      }
    };

    if (this.activeJobsCount < this.maxConcurrency) {
      void runner();
    } else {
      this.queue.push(runner);
      this.updateProgress(jobId, 5, 'Waiting in queue for server worker slot...');
    }
  }

  private processNext(): void {
    if (this.queue.length > 0 && this.activeJobsCount < this.maxConcurrency) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        void nextTask();
      }
    }
  }

  /**
   * Update real-time progress of a job and notify SSE listeners.
   */
  public updateProgress(jobId: string, progress: number, stage: string, data?: Partial<CourseGenerationJob>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progress = Math.min(100, Math.max(0, progress));
    job.stage = stage;
    job.updatedAt = Date.now();
    if (data) {
      Object.assign(job, data);
    }

    this.emit(`update:${jobId}`, job);
  }

  /**
   * Mark job as completed with course result.
   */
  public completeJob(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.stage = 'Course generation complete!';
    job.result = result;
    job.updatedAt = Date.now();

    this.emit(`update:${jobId}`, job);
    this.emit(`complete:${jobId}`, job);
  }

  /**
   * Mark job as failed.
   */
  public failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.stage = `Failed: ${error}`;
    job.updatedAt = Date.now();

    this.emit(`update:${jobId}`, job);
    this.emit(`fail:${jobId}`, job);
  }

  /**
   * Subscribe to real-time updates for a job (used by Server-Sent Events).
   */
  public subscribe(jobId: string, listener: JobEventListener): () => void {
    const eventName = `update:${jobId}`;
    this.on(eventName, listener);

    // Send initial snapshot immediately
    const current = this.jobs.get(jobId);
    if (current) {
      listener(current);
    }

    return () => {
      this.off(eventName, listener);
    };
  }

  /**
   * Garbage collection for jobs older than 1 hour.
   */
  private cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, job] of this.jobs.entries()) {
      if (job.updatedAt < oneHourAgo) {
        this.jobs.delete(id);
      }
    }
  }
}

export const courseGenerationQueue = new CourseGenerationQueueService();
