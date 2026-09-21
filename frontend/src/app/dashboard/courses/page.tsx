'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Plus,
  Share2,
  Trash2,
  Check,
  Lock,
  Globe,
  Eye,
} from 'lucide-react';
import { courseApi, courseArchitectApi } from '@/lib/api';
import { Course, PaginatedResponse } from '@/lib/types';
import CourseCard from '@/components/ui/CourseCard';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';

const DEFAULT_CATEGORIES = [
  'Web development',
  'Data science',
  'Design',
  'Business',
  'Mobile development',
  'Marketing',
];

type CourseTab = 'catalog' | 'my-courses' | 'community-ai';

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<CourseTab>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // My courses management state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    courseApi
      .categories()
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        }
      })
      .catch((e) => {
        console.error('Failed to fetch course categories', e);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'catalog') {
        const params: Record<string, unknown> = { page, limit: 12 };
        if (search) params.search = search;
        if (category !== 'all') params.category = category;
        if (difficulty !== 'all') params.difficulty = difficulty;
        const res = await courseApi.list(params);
        const data = res.data as PaginatedResponse<Course>;
        setCourses(data.data || []);
        setPages(data.pagination?.pages || 1);
      } else if (activeTab === 'my-courses') {
        const res = await courseArchitectApi.myCourses({ page, limit: 12 });
        const data = res.data;
        setCourses(data.data || []);
        setPages(data.pagination?.pages || 1);
      } else if (activeTab === 'community-ai') {
        const params: Record<string, unknown> = { page, limit: 12 };
        if (search) params.search = search;
        if (category !== 'all') params.category = category;
        if (difficulty !== 'all') params.difficulty = difficulty;
        const res = await courseArchitectApi.publicCourses(params);
        const data = res.data;
        setCourses(data.data || []);
        setPages(data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, search, category, difficulty]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, 250);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const handleCopyShareLink = (course: Course) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/dashboard/courses/${course._id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(course._id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleUpdateVisibility = async (courseId: string, newVisibility: 'public' | 'unlisted' | 'private') => {
    try {
      await courseArchitectApi.updateVisibility(courseId, newVisibility);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId ? { ...c, visibility: newVisibility, isPublished: newVisibility === 'public' } : c
        )
      );
    } catch (err) {
      console.error('Failed to update visibility:', err);
      alert('Failed to update course visibility.');
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    setIsDeleting(true);
    try {
      await courseArchitectApi.deleteCourse(deleteCourseId);
      setCourses((prev) => prev.filter((c) => c._id !== deleteCourseId));
      setDeleteCourseId(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert('Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header and Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Courses
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Browse the SabiLearn catalog and courses generated by you and the community.
          </p>
        </div>
        <Button
          variant="ai"
          size="md"
          onClick={() => router.push('/dashboard/ai/course-architect')}
          className="flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="size-4" />
          <span>Generate course</span>
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex rounded-xl bg-[var(--surface-sunken)] p-1 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('catalog');
            setPage(1);
          }}
          className={`flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'catalog'
              ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs'
              : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
          }`}
        >
          All Catalog
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('my-courses');
            setPage(1);
          }}
          className={`flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'my-courses'
              ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs'
              : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
          }`}
        >
          Generated by You
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('community-ai');
            setPage(1);
          }}
          className={`flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'community-ai'
              ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-xs'
              : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
          }`}
        >
          Community AI
        </button>
      </div>

      {/* Search & Filter Bar (shown for catalog and community-ai) */}
      {activeTab !== 'my-courses' && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ink-300)]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search courses…"
              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface-card)] py-2.5 pr-4 pl-10 text-sm text-[var(--ink-900)] outline-none focus:border-[var(--brand-violet)]"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={['all', ...categories]}
              placeholder="Category"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              options={['all', 'beginner', 'intermediate', 'advanced']}
              placeholder="Level"
            />
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-12 text-[var(--ink-300)]" />}
          title={
            activeTab === 'my-courses'
              ? 'No generated courses yet'
              : 'No courses found'
          }
          description={
            activeTab === 'my-courses'
              ? 'Use the AI Course Architect to create full interactive courses from your notes, documents, or prompts.'
              : 'Try adjusting your search or filters.'
          }
          action={
            activeTab === 'my-courses' ? (
              <Button
                variant="ai"
                size="md"
                onClick={() => router.push('/dashboard/ai/course-architect')}
              >
                Generate your first course
              </Button>
            ) : undefined
          }
        />
      ) : activeTab === 'my-courses' ? (
        /* My Generated Courses Custom Cards Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const visibility = course.visibility || (course.isPublished ? 'public' : 'private');
            return (
              <div
                key={course._id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top Bar with Category & Visibility Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[var(--brand-violet)]">
                      {course.category || 'AI Course'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={visibility}
                        onChange={(e) =>
                          handleUpdateVisibility(
                            course._id,
                            e.target.value as 'public' | 'unlisted' | 'private'
                          )
                        }
                        className="rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-700)] outline-none cursor-pointer hover:border-[var(--brand-violet)]"
                      >
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="public">Public</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(course)}
                        title="Copy share link"
                        className="rounded-md p-1 text-[var(--ink-500)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink-900)] transition-colors"
                      >
                        {copiedId === course._id ? (
                          <Check className="size-4 text-[var(--success)]" />
                        ) : (
                          <Share2 className="size-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteCourseId(course._id)}
                        title="Delete course"
                        className="rounded-md p-1 text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger)] transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3 className="line-clamp-2 text-base font-bold text-[var(--ink-900)]">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="line-clamp-2 text-xs text-[var(--text-muted)]">
                    {course.description || 'Interactive course generated with SabiLearn Course Architect.'}
                  </p>

                  {/* Meta Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--ink-500)]">
                    <Badge tone="neutral">
                      {course.topicCount || 0} topics
                    </Badge>
                    <Badge tone="violet">
                      {course.difficulty || 'beginner'}
                    </Badge>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-5 border-t border-[var(--line)] pt-4">
                  <Link
                    href={`/dashboard/courses/${course._id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-violet)] py-2.5 text-xs font-bold text-white transition-all hover:bg-[var(--brand-violet-600)]"
                  >
                    <BookOpen className="size-3.5" />
                    <span>Open course</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Catalog and Community AI Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              id={course._id}
              image={course.banner}
              title={course.title}
              category={course.category}
              description={course.description}
              topicCount={course.topicCount}
              free={course.isFree}
              price={course.price}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`size-9 rounded-md text-sm font-semibold ${
                p === page
                  ? 'bg-[var(--brand-gold)] text-[var(--ink-900)]'
                  : 'border border-[var(--line)] bg-[var(--surface-card)] text-[var(--text-muted)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteCourseId)}
        onClose={() => setDeleteCourseId(null)}
        title="Delete Generated Course"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteCourseId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={isDeleting}
              onClick={handleDeleteCourse}
              className="text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger-100)]"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink-700)]">
          Are you sure you want to delete this generated course? This will permanently remove its chapters, topics, lessons, and quiz questions.
        </p>
      </Dialog>
    </div>
  );
}
