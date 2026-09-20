'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { courseApi } from '@/lib/api';
import { Course, PaginatedResponse } from '@/lib/types';
import CourseCard from '@/components/ui/CourseCard';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const DEFAULT_CATEGORIES = ['Web development', 'Data science', 'Design', 'Business', 'Mobile development', 'Marketing'];

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>}>
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

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
      const params: Record<string, unknown> = { page, limit: 12 };
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (difficulty !== 'all') params.difficulty = difficulty;
      const res = await courseApi.list(params);
      const data = res.data as PaginatedResponse<Course>;
      setCourses(data.data);
      setPages(data.pagination.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, category, difficulty]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Courses</h1>
        <p className="text-sm text-(--text-muted)">Browse full SabiLearn catalog and free public interactive courses</p>
      </div>

      {/* Free Public Featured Course Section */}
      {/* <Card className="p-5 border border-[var(--brand-gold-100)] bg-[var(--brand-gold-50,var(--surface-sunken))]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--brand-gold-100)] flex items-center justify-center shrink-0 text-[var(--brand-gold-600)]">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="gold">Free Public Course</Badge>
                <Badge tone="neutral">Interactive Terminal Flow</Badge>
              </div>
              <h3 className="text-base font-bold text-[var(--ink-900)]">Git & Version Control Mastery</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xl">
                Master repositories, branching, staging, merging, and remote collaboration with our custom interactive flow. No database or payment required.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/courses/free/git"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-400)] text-[var(--ink-900)] font-semibold text-sm rounded-[var(--radius-md)] transition-colors shrink-0"
          >
            Start Free Git Course <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card> */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--ink-300)" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses…"
            className="w-full rounded-md border border-(--line) bg-(--surface-card) py-2.5 pr-4 pl-10 text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} options={['all', ...categories]} placeholder="Category" />
        </div>
        <div className="w-full sm:w-44">
          <Select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} options={['all', 'beginner', 'intermediate', 'advanced']} placeholder="Level" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-12" />} title="No courses found" description="Try adjusting your search or filters." />
      ) : (
        <>
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
          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-9 rounded-md text-sm font-semibold ${p === page ? 'bg-(--brand-gold) text-foreground' : 'border border-(--line) bg-(--surface-card) text-(--text-muted)'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
