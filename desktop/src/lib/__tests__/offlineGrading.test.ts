import { beforeEach, describe, expect, it } from 'vitest';
import {
  BUNDLED_COURSE_IDS,
  checkOfflineCourseAccess,
  computeChaptersWithStatus,
  getBundledCourse,
  getBundledCourseList,
} from '../offlineCourses';
import { LocalCourseProgressState } from '../offlineSync';
import { Chapter, Course, Topic } from '../types';

describe('offlineCourses & grading rules', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('ships 2 bundled courses ready to open offline', () => {
    const list = getBundledCourseList();
    expect(list.length).toBe(2);
    expect(BUNDLED_COURSE_IDS.length).toBe(2);
    const first = getBundledCourse(BUNDLED_COURSE_IDS[0]);
    expect(first?.chapters.length).toBeGreaterThan(0);
    expect(first?.topics.length).toBeGreaterThan(0);
  });

  it('enforces free, subscription, and single-course purchase access rules', () => {
    const paidCourse = { _id: 'c1', isFree: false } as Course;
    const freeCourse = { _id: 'c2', isFree: true } as Course;

    expect(checkOfflineCourseAccess(freeCourse, null, null)).toBe(true);
    expect(checkOfflineCourseAccess(paidCourse, null, null)).toBe(false);
    expect(
      checkOfflineCourseAccess(paidCourse, null, {
        subscription: { status: 'active', billingType: 'recurring' },
        purchasedCourseIds: [],
      })
    ).toBe(true);
    expect(
      checkOfflineCourseAccess(paidCourse, null, {
        subscription: { status: 'none' },
        purchasedCourseIds: ['c1'],
      })
    ).toBe(true);
  });

  it('computes sequential topic and chapter unlock status accurately', () => {
    const chapters: Chapter[] = [
      { _id: 'ch1', course: 'c1', title: 'Ch 1', description: '', order: 1 },
      { _id: 'ch2', course: 'c1', title: 'Ch 2', description: '', order: 2 },
    ];
    const topics: Topic[] = [
      { _id: 't1', course: 'c1', chapter: 'ch1', title: 'T1', description: '', contents: [], order: 1, isPublished: true, createdAt: '', updatedAt: '' },
      { _id: 't2', course: 'c1', chapter: 'ch1', title: 'T2', description: '', contents: [], order: 2, isPublished: true, createdAt: '', updatedAt: '' },
      { _id: 't3', course: 'c1', chapter: 'ch2', title: 'T3', description: '', contents: [], order: 1, isPublished: true, createdAt: '', updatedAt: '' },
    ];

    const progress: LocalCourseProgressState = {
      courseId: 'c1',
      completedTopics: ['t1'],
      earnedTopicIds: ['t1'],
      passedExercises: [],
      rewardedXpKeys: ['topic_t1'],
      lastContentIndex: 0,
      topicPositions: {},
      assessmentProgress: {},
      percentCompleted: 33,
      isCompleted: false,
      lastStudiedAt: '',
    };

    const computed = computeChaptersWithStatus(chapters, topics, progress, true);
    expect(computed[0].status).toBe('inprogress');
    expect(computed[0].topics?.[0].isCompleted).toBe(true);
    expect(computed[0].topics?.[1].isUnlocked).toBe(true);
    expect(computed[1].status).toBe('locked');
    expect(computed[1].topics?.[0].isUnlocked).toBe(false);
  });
});
