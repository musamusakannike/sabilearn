'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Plus, Share2, Trash2, Check, ArrowRight, Sparkles } from 'lucide-react';
import { courseApi, courseArchitectApi, progressApi } from '@/lib/api';
import { Course, Chapter, Topic, UserProgress, PaginatedResponse } from '@/lib/types';
import CourseCard from '@/components/ui/CourseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import FeaturePromoBanner, {
  COURSE_PROMOS,
  bannerEveryNCourses,
} from '@/components/courses/FeaturePromoBanner';

const DEFAULT_CATEGORIES = [
  'Artificial Intelligence',
  'Backend Development',
  'Web3 & Blockchain',
  'Frontend & UI',
  'Mobile Development',
  'Data Science',
];

const DEFAULT_ENROLLED_TRACKS = [
  {
    id: 'backend-mini',
    title: 'Backend Development for Beginners',
    subtitle: 'Chapter 1: Node & V8 Engine',
    banner: 'https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1791638471848-backend.webp',
    pct: 35,
    href: '/dashboard/courses',
  },
  {
    id: 'prompt-mini',
    title: 'Prompt Engineering Essentials',
    subtitle: 'Lesson 4: Few-shot prompting',
    banner: 'https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1789774755336-prompt-eng.webp',
    pct: 60,
    href: '/dashboard/courses',
  },
  {
    id: 'blockchain-mini',
    title: 'Blockchain & Cryptocurrency',
    subtitle: 'Lesson 1: Intro to Hashes',
    banner: 'https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1789774964508-blockchain.webp',
    pct: 15,
    href: '/dashboard/courses',
  },
];

type CourseTab = 'catalog' | 'my-courses' | 'community-ai';
type SortOption = 'popular' | 'recent' | 'xp';

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
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [myCoursesCount, setMyCoursesCount] = useState<number>(3);
  const [resumptionCards, setResumptionCards] = useState<UserProgress[]>([]);

  // My courses management state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const bannerInterval = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('resize', onStoreChange);
      return () => window.removeEventListener('resize', onStoreChange);
    },
    () => bannerEveryNCourses(window.innerWidth, window.innerHeight),
    () => 6,
  );

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    courseApi
      .categories()
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          const fetched = res.data.data as string[];
          setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...fetched])));
        }
      })
      .catch((e) => {
        console.error('Failed to fetch course categories', e);
      });

    // Also fetch count for user generated courses badge
    courseArchitectApi
      .myCourses({ limit: 1 })
      .then((res) => {
        if (!isMounted) return;
        const total = res.data?.pagination?.total ?? res.data?.data?.length;
        if (typeof total === 'number') {
          setMyCoursesCount(total);
        }
      })
      .catch(() => {});

    // Fetch user enrolled / resumption courses
    progressApi
      .dashboardResumption()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && Array.isArray(res.data.data?.resumptionCards)) {
          const cards = (res.data.data.resumptionCards as UserProgress[]).filter((p) => {
            const c = typeof p.course === 'object' ? (p.course as Course) : null;
            return c && c._id;
          });
          setResumptionCards(cards);
          if (cards.length > 0 && activeTab === 'my-courses') {
            setMyCoursesCount(cards.length);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

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
        const list = data.data || [];
        setCourses(list);
        setPages(data.pagination?.pages || 1);
        setMyCoursesCount(data.pagination?.total ?? list.length);
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
      setMyCoursesCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert('Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sorted courses
  const sortedCourses = useMemo(() => {
    const list = [...courses];
    if (sortBy === 'recent') {
      return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    if (sortBy === 'xp') {
      return list.sort((a, b) => (b.totalObtainableXp || 0) - (a.totalObtainableXp || 0));
    }
    // 'popular'
    return list.sort((a, b) => (b.registeredUsersCount || 0) - (a.registeredUsersCount || 0));
  }, [courses, sortBy]);

  const progressByCourseId = useMemo(() => {
    const map = new Map<string, UserProgress>();
    resumptionCards.forEach((p) => {
      const cId = typeof p.course === 'object' ? (p.course as Course)?._id : (p.course as string);
      if (cId) map.set(cId, p);
    });
    return map;
  }, [resumptionCards]);

  const gridItems = useMemo(() => {
    type Item =
      | { type: 'course'; course: Course }
      | { type: 'banner'; key: string; banner: (typeof COURSE_PROMOS)[number] };
    const items: Item[] = [];
    let promo = 0;
    sortedCourses.forEach((course, i) => {
      items.push({ type: 'course', course });
      const atInterval = (i + 1) % bannerInterval === 0;
      const notLast = i < sortedCourses.length - 1;
      if (atInterval && notLast) {
        items.push({
          type: 'banner',
          key: `promo-${i}-${COURSE_PROMOS[promo % COURSE_PROMOS.length].kind}`,
          banner: COURSE_PROMOS[promo % COURSE_PROMOS.length],
        });
        promo += 1;
      }
    });
    return items;
  }, [sortedCourses, bannerInterval]);

  const enrolledDisplayTracks = useMemo(() => {
    if (resumptionCards.length > 0) {
      return resumptionCards.slice(0, 3).map((p, idx) => {
        const course = typeof p.course === 'object' ? (p.course as Course) : null;
        const lastTopic = typeof p.lastTopic === 'object' ? (p.lastTopic as Topic) : null;
        const lastChapter = typeof p.lastChapter === 'object' ? (p.lastChapter as Chapter) : null;
        const subtitle = lastTopic?.title
          ? `Lesson: ${lastTopic.title}`
          : lastChapter?.title
          ? `Chapter: ${lastChapter.title}`
          : 'Lesson in progress';

        return {
          id: p._id || `enrolled-${idx}`,
          title: course?.title || 'Enrolled Course Track',
          subtitle,
          banner:
            course?.banner ||
            DEFAULT_ENROLLED_TRACKS[idx % DEFAULT_ENROLLED_TRACKS.length].banner,
          pct: p.percentCompleted ?? 35,
          href: course?._id ? `/dashboard/courses/${course._id}` : '/dashboard/courses',
        };
      });
    }
    return DEFAULT_ENROLLED_TRACKS;
  }, [resumptionCards]);

  return (
    <div className="max-w-7xl w-full mx-auto space-y-8">
      {/* Header & Tabs Section (Directly matching code.html) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200/60">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Courses</h1>
          <p className="text-stone-500 text-sm mt-1">Pick a track and start building.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Catalog vs Yours vs Community Tab Toggle */}
          <div className="inline-flex p-1 bg-stone-200/70 rounded-full border border-stone-300/60 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                setPage(1);
              }}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 font-semibold'
              }`}
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-courses');
                setPage(1);
              }}
              className={`px-6 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'my-courses'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Yours</span>
              <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                {myCoursesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('community-ai');
                setPage(1);
              }}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'community-ai'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Community AI
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/ai/course-architect')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition"
          >
            <Plus className="size-3.5" />
            <span>Generate Course</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar in Course View */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Course Search Input with icon */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
            placeholder="Search courses by topic, skill, or keyword..."
            type="text"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs shrink-0 transition-colors ${
              category === 'all'
                ? 'bg-stone-900 text-white font-bold shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold'
            }`}
          >
            All Courses ({courses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(category === cat ? 'all' : cat);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs shrink-0 transition-colors ${
                category === cat
                  ? 'bg-stone-900 text-white font-bold shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner / Enrolled Spotlight (shown on catalog when page 1 and no search query) */}
      {activeTab === 'catalog' && !search && page === 1 && (
        <div className="w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://pub-080732c6fb61453c92062218797bf9df.r2.dev/banner.webp"
            alt="Web Development for Beginners: HTML, CSS & JavaScript from Scratch"
            className="w-full h-auto object-cover rounded-2xl block"
          />
        </div>
      )}

      {/* Courses Catalog Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-stone-900">
              {activeTab === 'catalog'
                ? 'Explore Course Tracks'
                : activeTab === 'my-courses'
                ? 'Your Created Courses'
                : 'Community AI Tracks'}
            </h3>
            <span className="text-xs font-bold text-stone-500 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
              Showing {sortedCourses.length} Tracks
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span>Level:</span>
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Added</option>
                <option value="xp">Highest XP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Rendering */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-12 text-stone-300" />}
            title={
              activeTab === 'my-courses'
                ? 'No generated courses yet'
                : 'No courses found'
            }
            description={
              activeTab === 'my-courses'
                ? 'Use the AI Course Architect to create full interactive courses from your notes, documents, or prompts.'
                : 'Try adjusting your search query or category filters.'
            }
            action={
              activeTab === 'my-courses' ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/dashboard/ai/course-architect')}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm text-xs font-bold"
                >
                  <Sparkles className="size-4 mr-1.5" />
                  Generate your first course
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridItems.map((item) => {
              if (item.type === 'banner') {
                return <></>;
              }
              const course = item.course;
              const visibility = course.visibility || (course.isPublished ? 'public' : 'private');
              const userProg = progressByCourseId.get(course._id);
              const pct = userProg?.percentCompleted ?? 0;
              const chapterTitle =
                (typeof userProg?.lastChapter === 'object' ? userProg.lastChapter?.title : undefined) ||
                (typeof userProg?.lastTopic === 'object' ? userProg.lastTopic?.title : undefined) ||
                'Chapter 1: Getting Started';

              return (
                <CourseCard
                  key={course._id}
                  id={course._id}
                  image={course.banner}
                  title={course.title}
                  category={course.category || (course.isAiGenerated ? 'Artificial Intelligence' : undefined)}
                  description={
                    course.description ||
                    (activeTab === 'my-courses'
                      ? 'Interactive course generated with SabiLearn Course Architect.'
                      : undefined)
                  }
                  topicCount={course.topicCount}
                  lessonCount={course.lessonCount}
                  difficulty={course.difficulty}
                  totalObtainableXp={course.totalObtainableXp}
                  free={course.isFree}
                  price={course.price}
                  progress={pct}
                  chapterTitle={chapterTitle}
                  ctaLabel={activeTab === 'my-courses' ? 'Open course' : 'Continue Lesson'}
                  actions={
                    activeTab === 'my-courses' ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={visibility}
                          onChange={(e) =>
                            handleUpdateVisibility(
                              course._id,
                              e.target.value as 'public' | 'unlisted' | 'private',
                            )
                          }
                          className="cursor-pointer rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700 outline-none hover:border-orange-500"
                        >
                          <option value="private">Private</option>
                          <option value="unlisted">Unlisted</option>
                          <option value="public">Public</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(course)}
                          title="Copy share link"
                          className="rounded-md p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                        >
                          {copiedId === course._id ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Share2 className="size-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCourseId(course._id)}
                          title="Delete course"
                          className="rounded-md p-1 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Enrolled Tracks Quick Tray ("Yours" preview section matching code.html) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-stone-900">Your Enrolled Courses</h3>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 font-bold text-xs rounded-full">
                {enrolledDisplayTracks.length} Active Tracks
              </span>
            </div>
            <p className="text-stone-500 text-xs mt-1">Jump right back into lessons where you last paused.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('my-courses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"
          >
            <span>View All Enrolled</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {enrolledDisplayTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => router.push(track.href)}
              className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={track.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs"
                src={track.banner}
              />
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-stone-900 truncate">{track.title}</h5>
                <p className="text-[11px] text-stone-500 mt-0.5 truncate">{track.subtitle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${track.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-stone-600">{track.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`size-9 rounded-xl text-xs font-bold transition ${
                p === page
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
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
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Are you sure you want to delete this generated course? This will permanently remove its chapters, topics, lessons, and quiz questions.
        </p>
      </Dialog>
    </div>
  );
}
