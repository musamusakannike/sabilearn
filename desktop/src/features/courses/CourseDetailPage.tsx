import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconArrowLeft,
  IconAward,
  IconBook,
  IconCards,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCloudDownload,
  IconCode,
  IconListCheck,
  IconLock,
  IconPlayerPlay,
  IconShare,
} from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { chapterApi, courseApi, paymentApi } from '@/lib/api';
import {
  cacheCourseChapters,
  cacheCourseDetail,
  cachePaymentStatus,
  getCachedPaymentStatus,
  getDownloadedCourseIds,
  getLocalCourseProgress,
  isOnline,
} from '@/lib/offlineSync';
import {
  checkOfflineCourseAccess,
  computeChaptersWithStatus,
  downloadCourseForOffline,
  getOfflineChapters,
  getOfflineCourseDetail,
  getOfflineTopics,
  isBundledCourse,
} from '@/lib/offlineCourses';
import { Chapter, Course, PaymentStatus } from '@/lib/types';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { clipboard } from '@/platform';
import { formatKobo } from '@/lib/money';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const toast = useUiStore((s) => s.toast);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadLabel, setDownloadLabel] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const dlIds = await getDownloadedCourseIds();
    setDownloaded(isBundledCourse(id) || dlIds.includes(id));

    const loadOffline = async () => {
      const [c, chs, topics, pay] = await Promise.all([
        getOfflineCourseDetail(id),
        getOfflineChapters(id),
        getOfflineTopics(id),
        getCachedPaymentStatus(),
      ]);
      if (!c) {
        setCourse(null);
        setLoading(false);
        return;
      }
      const access = checkOfflineCourseAccess(c, user, pay);
      const local = await getLocalCourseProgress(id, user?._id || user?.id);
      const computed = computeChaptersWithStatus(chs, topics, local, access);
      setCourse(c);
      setChapters(computed);
      setPaymentStatus(pay);
      const firstOpen = computed.find((ch) => ch.status !== 'completed') || computed[0];
      if (firstOpen) setExpanded({ [firstOpen._id]: true });
      setLoading(false);
    };

    try {
      if (!(await isOnline())) {
        await loadOffline();
        return;
      }
      const [cRes, chRes, payRes] = await Promise.all([
        courseApi.get(id),
        chapterApi.byCourse(id),
        paymentApi.me().catch(() => ({ data: null })),
      ]);
      const c: Course = cRes.data;
      const chs: Chapter[] = chRes.data || [];
      const pay: PaymentStatus | null = payRes.data || null;
      setCourse(c);
      setChapters(chs);
      setPaymentStatus(pay);
      const firstOpen = chs.find((ch) => ch.status !== 'completed') || chs[0];
      if (firstOpen) setExpanded({ [firstOpen._id]: true });
      void cacheCourseDetail(id, c);
      void cacheCourseChapters(id, chs);
      if (pay) void cachePaymentStatus(pay);
      setLoading(false);
    } catch {
      await loadOffline();
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = async () => {
    if (!id || downloading) return;
    setDownloading(true);
    try {
      await downloadCourseForOffline(id, (_pct, label) => setDownloadLabel(label));
      setDownloaded(true);
      toast({ title: 'Course saved for offline study', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Offline download failed',
        description: err instanceof Error ? err.message : 'Check your connection and retry.',
        variant: 'danger',
      });
    } finally {
      setDownloading(false);
      setDownloadLabel('');
    }
  };

  const handleShare = async () => {
    if (!course) return;
    const url = `https://sabilearn.online/courses/${course.shareSlug || course._id}`;
    await clipboard.writeText(url);
    toast({ title: 'Course link copied to clipboard', description: url, variant: 'success' });
  };

  if (loading) {
    return (
      <div className="max-w-[1120px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="lg:col-span-7 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto p-10">
        <EmptyState
          mascot
          title="Course not found"
          description="This course isn't cached locally and couldn't be loaded from the server."
          action={<Button onClick={() => navigate('/courses')}>Back to Courses</Button>}
        />
      </div>
    );
  }

  const hasAccess = checkOfflineCourseAccess(course, user, paymentStatus);
  const allTopics = chapters.flatMap((ch) => ch.topics || []);
  const completedCount = allTopics.filter((t) => t.isCompleted).length;
  const overallPercent =
    allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;
  const nextTopic =
    allTopics.find((t) => t.inProgress && t.isUnlocked) ||
    allTopics.find((t) => !t.isCompleted && t.isUnlocked) ||
    allTopics[0];

  return (
    <div className="max-w-[1160px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<IconArrowLeft size={16} />}
          onClick={() => navigate('/courses')}
        >
          Back to Courses
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconCloudDownload size={15} />}
            loading={downloading}
            onClick={handleDownload}
          >
            {downloading ? downloadLabel || 'Downloading...' : downloaded ? 'Saved Offline' : 'Download Offline'}
          </Button>
          <Button variant="secondary" size="sm" icon={<IconShare size={15} />} onClick={handleShare}>
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Overview & Actions */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <Card padded={false} className="overflow-hidden">
            <div className="h-44 bg-[var(--surface-sunken)] relative">
              {course.banner ? (
                <img src={course.banner} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                  <IconBook size={40} />
                </div>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={course.difficulty}>{course.difficulty}</Badge>
                <Badge variant={course.isFree ? 'success' : 'gold'}>
                  {course.isFree ? 'Free' : formatKobo(course.price)}
                </Badge>
                {course.category && <Badge variant="default">{course.category}</Badge>}
              </div>

              <div>
                <h1 className="text-[21px] font-bold text-[var(--text-primary)] leading-snug">
                  {course.title}
                </h1>
                <p className="text-[13.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                  <span className="text-[var(--text-secondary)]">Course progress</span>
                  <span className="text-[var(--text-primary)]">
                    {completedCount}/{allTopics.length} lessons ({overallPercent}%)
                  </span>
                </div>
                <ProgressBar value={overallPercent} height={8} />
              </div>

              {hasAccess ? (
                <div className="space-y-2.5 pt-1">
                  {nextTopic && (
                    <Button
                      fullWidth
                      size="lg"
                      icon={<IconPlayerPlay size={17} />}
                      onClick={() => navigate(`/course/${course._id}/topic/${nextTopic._id}/learn`)}
                    >
                      {completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                    </Button>
                  )}

                  {/* Exposed Study Entry (Flashcards + MCQs) */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<IconCards size={15} />}
                      onClick={() => navigate(`/course/${course._id}/flashcards`)}
                    >
                      Flashcards
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<IconListCheck size={15} />}
                      onClick={() => navigate(`/course/${course._id}/mcq`)}
                    >
                      Practice MCQs
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--brand-primary-soft)]/50 border border-[var(--brand-primary)] space-y-2.5">
                  <div className="font-bold text-[14px]">Unlock this premium course</div>
                  <p className="text-[12.5px] text-[var(--text-secondary)]">
                    Get all-access to every course and AI tool, or unlock just this course for{' '}
                    <strong>{formatKobo(course.price)}</strong>.
                  </p>
                  <Button
                    fullWidth
                    onClick={() => navigate(`/subscribe?courseId=${course._id}`)}
                  >
                    Unlock with Paystack
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {course.whatYouWillLearn?.length > 0 && (
            <Card>
              <h2 className="text-[14px] font-bold mb-2.5">What you will learn</h2>
              <ul className="space-y-2">
                {course.whatYouWillLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                    <IconCheck size={15} className="text-[var(--success)] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Right Column: Expandable Chapter & Topic Tree */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Course Curriculum</h2>

          {chapters.map((chapter, idx) => {
            const isOpen = !!expanded[chapter._id];
            const hasCapstone = (chapter.exercise?.questions?.length || 0) > 0;
            return (
              <Card key={chapter._id} padded={false} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [chapter._id]: !isOpen }))}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[var(--surface-sunken)]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] text-[12px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[14.5px] text-[var(--text-primary)] truncate">
                        {chapter.title}
                      </div>
                      <div className="text-[12px] text-[var(--text-tertiary)]">
                        {(chapter.topics || []).length} lessons · {chapter.progressPercent || 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {chapter.status === 'completed' && <Badge variant="success">Completed</Badge>}
                    {chapter.status === 'locked' && <Badge variant="default">Locked</Badge>}
                    {isOpen ? <IconChevronDown size={17} /> : <IconChevronRight size={17} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                    {(chapter.topics || []).map((topic) => {
                      const unlocked = topic.isUnlocked !== false && hasAccess;
                      return (
                        <div
                          key={topic._id}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--surface-sunken)]/35 transition-colors"
                        >
                          <button
                            type="button"
                            disabled={!unlocked}
                            onClick={() => navigate(`/course/${course._id}/topic/${topic._id}/learn`)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                          >
                            <span
                              className={[
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                                topic.isCompleted
                                  ? 'bg-[var(--success-bg)] text-[var(--success)]'
                                  : unlocked
                                    ? 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)]'
                                    : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]',
                              ].join(' ')}
                            >
                              {topic.isCompleted ? (
                                <IconCheck size={14} />
                              ) : !unlocked ? (
                                <IconLock size={14} />
                              ) : topic.hasCodingTask ? (
                                <IconCode size={14} />
                              ) : (
                                <IconPlayerPlay size={14} />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13.5px] font-medium text-[var(--text-primary)] truncate">
                                {topic.title}
                              </div>
                              <div className="text-[11.5px] text-[var(--text-tertiary)]">
                                +{topic.xp || 50} XP
                              </div>
                            </div>
                          </button>

                          {unlocked && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title="Topic Flashcards"
                                onClick={() =>
                                  navigate(`/course/${course._id}/topic/${topic._id}/flashcards`)
                                }
                                className="px-2 py-1 rounded-[var(--radius-sm)] text-[11.5px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                              >
                                Cards
                              </button>
                              <button
                                type="button"
                                title="Topic MCQs"
                                onClick={() =>
                                  navigate(`/course/${course._id}/topic/${topic._id}/mcq`)
                                }
                                className="px-2 py-1 rounded-[var(--radius-sm)] text-[11.5px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                              >
                                MCQ
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {hasCapstone && (
                      <button
                        type="button"
                        disabled={!hasAccess || chapter.status === 'locked'}
                        onClick={() =>
                          navigate(`/course/${course._id}/chapter/${chapter._id}/assessment`)
                        }
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[var(--brand-ai-soft)]/45 hover:bg-[var(--brand-ai-soft)]/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[var(--brand-ai)] text-white flex items-center justify-center">
                            <IconAward size={15} />
                          </span>
                          <div>
                            <div className="text-[13.5px] font-bold text-[var(--text-primary)]">
                              Chapter Capstone Assessment
                            </div>
                            <div className="text-[11.5px] text-[var(--text-tertiary)]">
                              {chapter.exercise?.questions?.length} questions · Pass ≥ 50%
                            </div>
                          </div>
                        </div>
                        <Badge variant={chapter.isAssessmentPassed ? 'success' : 'ai'}>
                          {chapter.isAssessmentPassed ? 'Passed' : 'Capstone'}
                        </Badge>
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
