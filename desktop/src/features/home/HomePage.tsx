import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconBrain,
  IconCards,
  IconCode,
  IconFileText,
  IconFlame,
  IconMessageQuestion,
  IconPlayerPlay,
  IconSparkles,
  IconTargetArrow,
} from '@tabler/icons-react';
import { Badge, Button, Card, CourseCardSkeleton, EmptyState, ProgressBar } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useProgressStore } from '@/stores/progress.store';
import { courseApi } from '@/lib/api';
import { cachePopularCourses, getCachedPopularCourses } from '@/lib/offlineSync';
import { getBundledCourseList } from '@/lib/offlineCourses';
import { Course } from '@/lib/types';
import { formatKobo } from '@/lib/money';

export interface HomePageProps {
  onOpenAiTool: (kind: 'summarizer' | 'flashcards' | 'qa') => void;
}

export function HomePage({ onOpenAiTool }: HomePageProps) {
  const user = useAuthStore((s) => s.user);
  const { dashboard, stats, fetchDashboard, fetchStats } = useProgressStore();
  const navigate = useNavigate();

  const [popular, setPopular] = useState<Course[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    void fetchDashboard();
    void fetchStats();
    let cancelled = false;
    (async () => {
      const cached = await getCachedPopularCourses();
      if (!cancelled && cached.length > 0) {
        setPopular(cached);
        setLoadingPopular(false);
      }
      try {
        const res = await courseApi.popular();
        const list: Course[] = res.data || [];
        if (!cancelled) {
          setPopular(list.length > 0 ? list : getBundledCourseList());
          setLoadingPopular(false);
          if (list.length > 0) void cachePopularCourses(list);
        }
      } catch {
        if (!cancelled) {
          if (cached.length === 0) setPopular(getBundledCourseList());
          setLoadingPopular(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard, fetchStats]);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Learner';
  const streak = dashboard?.streak ?? stats?.streak ?? user?.currentStreak ?? 0;
  const totalXp = dashboard?.totalXp ?? stats?.totalXp ?? user?.totalXp ?? 0;
  const accuracy = dashboard?.quickStats?.avgAccuracy ?? stats?.avgAccuracy ?? 0;
  const dailyPct = stats?.dailyGoal?.progress ?? 0;
  const dailyMin = stats?.dailyGoal?.studiedMinutes ?? 0;
  const dailyTarget = stats?.dailyGoal?.minutes ?? user?.settings?.dailyGoalMinutes ?? 15;

  const resumeItems = dashboard?.continueStudying || [];
  const heroResume = resumeItems[0];
  const heroCourse =
    heroResume && typeof heroResume.course === 'object' ? (heroResume.course as Course) : null;
  const heroTopicId =
    heroResume && typeof heroResume.lastTopic === 'object'
      ? heroResume.lastTopic?._id
      : heroResume?.lastTopic;

  const aiTools = [
    {
      title: 'Course Architect',
      desc: 'Generate a full course from PDFs, slides or a prompt',
      icon: <IconSparkles size={18} />,
      onClick: () => navigate('/generate-course'),
      accent: 'ai' as const,
    },
    {
      title: 'AI Quiz Hub',
      desc: 'Practice MCQs generated from lecture notes',
      icon: <IconBrain size={18} />,
      onClick: () => navigate('/ai-quiz'),
      accent: 'ai' as const,
    },
    {
      title: 'Note Summarizer',
      desc: 'Distill long readings into crisp bullet points',
      icon: <IconFileText size={18} />,
      onClick: () => onOpenAiTool('summarizer'),
      accent: 'default' as const,
    },
    {
      title: 'Flashcard Builder',
      desc: 'Create rapid study cards on any topic',
      icon: <IconCards size={18} />,
      onClick: () => onOpenAiTool('flashcards'),
      accent: 'default' as const,
    },
    {
      title: 'AI Q&A Tutor',
      desc: 'Ask any concept question and get step-by-step help',
      icon: <IconMessageQuestion size={18} />,
      onClick: () => onOpenAiTool('qa'),
      accent: 'default' as const,
    },
  ];

  return (
    <div className="max-w-[1180px] mx-auto px-6 py-6 space-y-7">
      {/* Top Greeting + Daily Goal Ring & Stats Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {firstName}
          </h1>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-0.5">
            Pick up where you left off or practice in the Code Playground.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center">
              <IconFlame size={18} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">{streak} days</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Streak</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-ai-soft)] text-[var(--brand-ai)] flex items-center justify-center">
              <IconBolt size={18} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight font-mono">
                {totalXp.toLocaleString()}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Total XP</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center">
              <IconTargetArrow size={18} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">
                {dailyMin}/{dailyTarget}m ({Math.round(dailyPct)}%)
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)]">
                Daily goal · {Math.round(accuracy)}% acc
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Row: Continue Studying + Code Playground Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card variant="featured" className="lg:col-span-2 flex flex-col justify-between">
          {heroCourse ? (
            <>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="gold">Continue Studying</Badge>
                  <span className="text-[12.5px] font-semibold text-[var(--text-tertiary)]">
                    {Math.round(heroResume.percentCompleted || 0)}% complete
                  </span>
                </div>
                <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
                  {heroCourse.title}
                </h2>
                <p className="text-[13.5px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {heroCourse.description}
                </p>
                <div className="mt-4">
                  <ProgressBar value={heroResume.percentCompleted || 0} height={8} />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Button
                  icon={<IconPlayerPlay size={16} />}
                  onClick={() =>
                    heroTopicId
                      ? navigate(`/course/${heroCourse._id}/topic/${heroTopicId}/learn`)
                      : navigate(`/course/${heroCourse._id}`)
                  }
                >
                  Resume Lesson
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/course/${heroCourse._id}`)}>
                  View Curriculum
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-5">
              <img
                src="/assets/onboarding/tutor-mascot.webp"
                alt="SabiLearn Tutor"
                className="w-20 h-20 object-contain shrink-0 select-none"
              />
              <div>
                <Badge variant="gold">Start Learning</Badge>
                <h2 className="text-[19px] font-bold mt-2">Ready for your first lesson?</h2>
                <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
                  Python and Web Development are bundled right inside this app for instant offline
                  study.
                </p>
                <div className="mt-3.5">
                  <Button onClick={() => navigate('/courses')} icon={<IconBook size={16} />}>
                    Browse Courses
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-between bg-[var(--surface-card)]">
          <div>
            <Badge variant="ai">Built-in IDE</Badge>
            <h2 className="text-[18px] font-bold mt-2.5">Code Playground</h2>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1 leading-relaxed">
              Write HTML, CSS, JavaScript with live preview, or run Python locally via Pyodide —
              synced across devices.
            </p>
          </div>
          <div className="mt-5">
            <Button
              variant="secondary"
              fullWidth
              icon={<IconCode size={16} />}
              onClick={() => navigate('/playground')}
            >
              Open Playground
            </Button>
          </div>
        </Card>
      </div>

      {/* AI Study Tools — tidy 5-column responsive grid (no stretched 5th card) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[var(--text-primary)]">AI Study Tools</h2>
          <Badge variant="ai">Powered by SabiLearn AI</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {aiTools.map((tool) => (
            <button
              key={tool.title}
              type="button"
              onClick={tool.onClick}
              className="text-left p-4 rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--brand-ai)] hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer flex flex-col gap-2"
            >
              <div
                className={[
                  'w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center',
                  tool.accent === 'ai'
                    ? 'bg-[var(--brand-ai)] text-white'
                    : 'bg-[var(--brand-ai-soft)] text-[var(--brand-ai)]',
                ].join(' ')}
              >
                {tool.icon}
              </div>
              <div className="font-bold text-[14px] text-[var(--text-primary)]">{tool.title}</div>
              <div className="text-[12px] text-[var(--text-tertiary)] leading-snug">{tool.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Popular Courses</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/courses')}
            icon={<IconArrowRight size={15} />}
          >
            View all
          </Button>
        </div>

        {loadingPopular ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : popular.length === 0 ? (
          <EmptyState
            mascot
            title="No courses loaded yet"
            description="Check your connection or browse the bundled offline courses."
            action={<Button onClick={() => navigate('/courses')}>Open Catalog</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popular.slice(0, 6).map((course) => (
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
