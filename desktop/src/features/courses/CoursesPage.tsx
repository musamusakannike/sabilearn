import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBook,
  IconCloudCheck,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { Badge, Button, Card, CourseCardSkeleton, EmptyState, Input, Kbd } from '@/components/ui';
import { courseApi, courseArchitectApi } from '@/lib/api';
import { cacheCourses, getCachedCourses, getDownloadedCourseIds } from '@/lib/offlineSync';
import { getBundledCourseList, isBundledCourse } from '@/lib/offlineCourses';
import { Course } from '@/lib/types';
import { formatKobo } from '@/lib/money';

export function CoursesPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState<'catalog' | 'yours'>('catalog');
  const [track, setTrack] = useState<'all' | 'tech' | 'academic'>('all');
  const [difficulty, setDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [pricing, setPricing] = useState<'all' | 'free' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.key === '/' && !inInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cached, dl] = await Promise.all([getCachedCourses(), getDownloadedCourseIds()]);
      if (!cancelled) {
        setDownloadedIds(dl);
        if (cached.length > 0) {
          setCatalogCourses(cached);
          setLoading(false);
        }
      }
      try {
        const [catRes, myRes] = await Promise.all([
          courseApi.list({ limit: 100 }),
          courseArchitectApi.myCourses({ limit: 50 }).catch(() => ({ data: [] })),
        ]);
        const list: Course[] = catRes.data || [];
        const mine: Course[] = myRes.data || [];
        if (!cancelled) {
          const finalCatalog = list.length > 0 ? list : getBundledCourseList();
          setCatalogCourses(finalCatalog);
          setMyCourses(mine);
          setLoading(false);
          if (list.length > 0) void cacheCourses(list);
        }
      } catch {
        if (!cancelled) {
          if (cached.length === 0) setCatalogCourses(getBundledCourseList());
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const base = source === 'catalog' ? catalogCourses : myCourses;
    const q = search.trim().toLowerCase();
    return base.filter((c) => {
      if (track !== 'all' && (c.track || 'tech') !== track) return false;
      if (difficulty !== 'all' && c.difficulty !== difficulty) return false;
      if (pricing === 'free' && !c.isFree) return false;
      if (pricing === 'paid' && c.isFree) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.academicMeta?.courseCode || '').toLowerCase().includes(q) ||
        (c.academicMeta?.department || '').toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [source, catalogCourses, myCourses, track, difficulty, pricing, search]);

  return (
    <div className="flex h-full min-h-0">
      {/* Left Filter Rail */}
      <aside className="w-[228px] shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-card)]/60 p-4 overflow-y-auto space-y-5">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Source
          </h2>
          <div className="space-y-1">
            {[
              { id: 'catalog', label: 'Course Catalog' },
              { id: 'yours', label: 'Your AI Courses' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSource(item.id as 'catalog' | 'yours')}
                className={[
                  'w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-colors',
                  source === item.id
                    ? 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Track
          </h2>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All Tracks' },
              { id: 'tech', label: 'Tech Skills' },
              { id: 'academic', label: 'Academic Hub' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id as typeof track)}
                className={[
                  'w-full text-left px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-colors',
                  track === item.id
                    ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]/60',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Difficulty
          </h2>
          <div className="space-y-1">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={[
                  'w-full text-left px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] capitalize font-medium cursor-pointer transition-colors',
                  difficulty === d
                    ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]/60',
                ].join(' ')}
              >
                {d === 'all' ? 'Any Level' : d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Access
          </h2>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'free', label: 'Free Only' },
              { id: 'paid', label: 'Premium' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPricing(p.id as typeof pricing)}
                className={[
                  'w-full text-left px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-colors',
                  pricing === p.id
                    ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]/60',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Catalog Area */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        <div className="max-w-[1040px] mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-[var(--text-primary)]">
                {source === 'catalog' ? 'Courses' : 'Your AI Courses'}
              </h1>
              <p className="text-[13px] text-[var(--text-tertiary)]">
                {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} available
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-[260px]">
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter courses..."
                  leftIcon={<IconSearch size={15} />}
                  rightSlot={
                    search ? (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <IconX size={14} />
                      </button>
                    ) : (
                      <Kbd>/</Kbd>
                    )
                  }
                />
              </div>

              <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-[6px] cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  <IconLayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-1.5 rounded-[6px] cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  <IconList size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CourseCardSkeleton />
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              mascot
              title={source === 'yours' ? 'No AI courses generated yet' : 'No courses match your filters'}
              description={
                source === 'yours'
                  ? 'Upload lecture slides or enter any topic to build a custom course with Course Architect.'
                  : 'Try clearing your search or switching tracks.'
              }
              action={
                source === 'yours' ? (
                  <Button
                    variant="ai"
                    icon={<IconSparkles size={16} />}
                    onClick={() => navigate('/generate-course')}
                  >
                    Generate a Course
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setTrack('all');
                      setDifficulty('all');
                      setPricing('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                )
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((course) => {
                const offlineReady = isBundledCourse(course._id) || downloadedIds.includes(course._id);
                return (
                  <Card
                    key={course._id}
                    padded={false}
                    interactive
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="overflow-hidden flex flex-col"
                  >
                    <div className="h-36 bg-[var(--surface-sunken)] relative overflow-hidden">
                      {course.banner ? (
                        <img
                          src={course.banner}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                          <IconBook size={32} />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        {offlineReady && (
                          <Badge variant="success">
                            <IconCloudCheck size={12} /> Offline
                          </Badge>
                        )}
                        {course.isAiGenerated && <Badge variant="ai">AI</Badge>}
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <Badge variant={course.isFree ? 'success' : 'gold'}>
                          {course.isFree ? 'Free' : formatKobo(course.price)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge variant={course.difficulty}>{course.difficulty}</Badge>
                        {course.academicMeta?.courseCode && (
                          <Badge variant="default">{course.academicMeta.courseCode}</Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-[15px] text-[var(--text-primary)] line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[12.5px] text-[var(--text-tertiary)] mt-1 line-clamp-2 flex-1">
                        {course.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((course) => {
                const offlineReady = isBundledCourse(course._id) || downloadedIds.includes(course._id);
                return (
                  <Card
                    key={course._id}
                    interactive
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[15px] truncate">{course.title}</h3>
                        <Badge variant={course.difficulty}>{course.difficulty}</Badge>
                        {offlineReady && <Badge variant="success">Offline</Badge>}
                      </div>
                      <p className="text-[13px] text-[var(--text-tertiary)] line-clamp-1">
                        {course.description}
                      </p>
                    </div>
                    <Badge variant={course.isFree ? 'success' : 'gold'}>
                      {course.isFree ? 'Free' : formatKobo(course.price)}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
