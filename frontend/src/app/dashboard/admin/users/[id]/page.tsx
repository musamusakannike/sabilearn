'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Smartphone,
  Globe,
  Award,
  Zap,
  Flame,
  Calendar,
  CreditCard,
  Bot,
  Code2,
  Mail,
  Shield,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, userApi } from '@/lib/api';
import AdminGuard from '@/components/auth/AdminGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import UpgradeUserModal from '@/components/admin/UpgradeUserModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatKobo } from '@/lib/money';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await adminApi.userDetail(userId);
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-stone-600">User not found or deleted.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/dashboard/admin/users')}>
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
      </div>
    );
  }

  const { user, subscription, isProActive, enrolledCourses, startedOnlyCourses, summary, recentSessions, transactions, aiHistory, playgroundProjects, aiCoursesCreated } = data;

  const renderPlatformBadge = (platform?: string) => {
    if (platform === 'ios') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
          <Smartphone className="size-3 text-stone-900" /> iOS
        </span>
      );
    }
    if (platform === 'android') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
          <Smartphone className="size-3 text-emerald-600" /> Android
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
        <Globe className="size-3 text-blue-600" /> Web
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/users')}>
          <ArrowLeft className="size-4" /> Back to all users
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setUpgradeModalOpen(true)}>
            <Sparkles className="size-3.5" />
            {isProActive ? 'Extend / Manage Pro' : 'Upgrade to Pro'}
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xl font-black text-amber-800 shadow-sm">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-900">{user.name}</h1>
                <Badge tone={user.role === 'admin' ? 'violet' : 'neutral'}>{user.role}</Badge>
                {isProActive ? (
                  <Badge tone="gold">SabiLearn Pro</Badge>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                    Free Learner
                  </span>
                )}
                {renderPlatformBadge(user.lastPlatform)}
              </div>
              <p className="mt-1 text-sm text-stone-500">{user.email}</p>
              {user.bio && <p className="mt-2 text-xs italic text-stone-600">“{user.bio}”</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> Last active {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'N/A'}
                </span>
                <span className="capitalize">
                  Track: <strong className="font-semibold text-stone-700">{user.activeTrack || 'tech'}</strong>
                </span>
                <span className="capitalize">
                  Level: <strong className="font-semibold text-stone-700">{user.level || 'beginner'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info Banner */}
        <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">Subscription Status</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full ${isProActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                <p className="text-sm font-bold text-stone-900">
                  {isProActive ? 'Active Pro Tier' : 'Free Learner Tier'}
                  {subscription && (
                    <span className="ml-2 text-xs font-normal text-stone-500">
                      ({subscription.billingType === 'admin_grant' ? 'Admin Grant' : subscription.billingType} via {subscription.store || 'web'})
                    </span>
                  )}
                </p>
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="mt-0.5 text-xs text-stone-600">
                  {isProActive ? 'Period ends:' : 'Expired on:'}{' '}
                  <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
                  {subscription.grantedBy && (
                    <span className="ml-2 text-[11px] text-stone-400">
                      Granted by {subscription.grantedBy.name || subscription.grantedBy.email}
                    </span>
                  )}
                </p>
              )}
              {subscription?.grantNote && (
                <p className="mt-1 text-xs italic text-amber-800">
                  Note: &quot;{subscription.grantNote}&quot;
                </p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setUpgradeModalOpen(true)}>
              <Sparkles className="size-3.5" />
              {isProActive ? 'Extend / Edit Pro' : 'Grant Pro Access'}
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Total XP</p>
          <p className="mt-1 text-lg font-black text-amber-600">{(user.totalXp || 0).toLocaleString()}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Streak</p>
          <p className="mt-1 text-lg font-black text-orange-600">
            {user.currentStreak || 0}d <span className="text-xs font-normal text-stone-400">({user.longestStreak || 0}d max)</span>
          </p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Enrolled Courses</p>
          <p className="mt-1 text-lg font-black text-stone-900">{summary.enrolledCoursesCount}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Completed</p>
          <p className="mt-1 text-lg font-black text-emerald-600">{summary.completedCoursesCount}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">Study Time</p>
          <p className="mt-1 text-lg font-black text-stone-900">{summary.totalStudyDurationMinutes}m</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase">MCQ Accuracy</p>
          <p className="mt-1 text-lg font-black text-purple-600">{summary.avgMcqScore}%</p>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        tabs={[
          { value: 'courses', label: `Enrolled Courses (${enrolledCourses.length})` },
          { value: 'sessions', label: `Study Activity (${recentSessions.length})` },
          { value: 'ai', label: `AI & Playground (${summary.aiGenerationsCount + summary.playgroundProjectsCount})` },
          { value: 'transactions', label: `Transactions (${transactions.length})` },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Enrolled Courses (Completed >= 1 lesson) */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-stone-700 uppercase">
              Active Enrollments (Completed $\ge$ 1 Lesson)
            </h2>
            <span className="text-xs text-stone-500">{enrolledCourses.length} courses</span>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card className="p-8 text-center text-sm text-stone-500">
              This user has not completed any lessons in a course yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((c: any) => (
                <Card key={c.progressId} className="p-4 transition hover:shadow-xs">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${c.slug || c.courseId}`}
                          target="_blank"
                          className="truncate text-base font-bold text-stone-900 hover:text-amber-600"
                        >
                          {c.title}
                        </Link>
                        {c.isCompleted && (
                          <Badge tone="success">Completed</Badge>
                        )}
                        <Badge tone={c.track === 'academic' ? 'violet' : 'gold'}>
                          {c.track || 'tech'}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-stone-500">
                        Category: <strong>{c.category}</strong> · Difficulty: <strong className="capitalize">{c.difficulty}</strong>
                        {c.lastTopicTitle && (
                          <span> · Last lesson: <em>&quot;{c.lastTopicTitle}&quot;</em></span>
                        )}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 w-48 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${c.percentCompleted}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-stone-700">{c.percentCompleted}%</span>
                        <span className="text-xs text-stone-400">
                          ({c.completedTopicsCount} topics done, {c.passedExercisesCount} exercises passed)
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-stone-500">
                      <p>Last studied:</p>
                      <p className="font-semibold text-stone-700">
                        {c.lastStudiedAt ? new Date(c.lastStudiedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Started only courses (0 lessons done) */}
          {startedOnlyCourses.length > 0 && (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="mb-3 text-xs font-bold tracking-wider text-stone-500 uppercase">
                Opened / Started (0 Lessons Completed Yet) ({startedOnlyCourses.length})
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {startedOnlyCourses.map((c: any) => (
                  <Card key={c.progressId} className="p-3 bg-stone-50/60">
                    <p className="truncate text-sm font-semibold text-stone-800">{c.title}</p>
                    <p className="text-xs text-stone-400">
                      Opened {c.firstTopicOpenedAt ? new Date(c.firstTopicOpenedAt).toLocaleDateString() : 'recently'} · 0 topics completed
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Study Activity */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-stone-700 uppercase">Recent Study Sessions</h2>
            <span className="text-xs text-stone-500">Showing last 25 sessions</span>
          </div>

          {recentSessions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-stone-500">No study sessions recorded yet.</Card>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s: any) => (
                <Card key={s._id} className="p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        s.type === 'flashcard' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {s.type === 'flashcard' ? <Layers className="size-4" /> : <HelpCircle className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {s.course?.title || 'Unknown Course'}
                          {s.topic?.title && <span className="font-normal text-stone-500"> — {s.topic.title}</span>}
                        </p>
                        <p className="text-xs text-stone-400">
                          {s.type === 'flashcard' ? (
                            `${s.flashcardsStudied || 0} flashcards studied`
                          ) : (
                            `${s.mcqAnswered || 0} MCQs answered (${s.mcqCorrect || 0} correct, score: ${s.score || 0}%)`
                          )}
                          {s.duration ? ` · ${Math.round(s.duration / 60)} min` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-stone-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: AI & Playground */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Created Courses */}
          <div>
            <h2 className="mb-3 text-sm font-bold tracking-wider text-stone-700 uppercase">
              AI Course Architect Courses ({aiCoursesCreated.length})
            </h2>
            {aiCoursesCreated.length === 0 ? (
              <Card className="p-5 text-center text-xs text-stone-500">No AI courses created.</Card>
            ) : (
              <div className="space-y-2">
                {aiCoursesCreated.map((course: any) => (
                  <Card key={course._id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-stone-900">{course.title}</p>
                      <p className="text-xs text-stone-400">
                        Visibility: {course.visibility} · Created {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={course.isPublished ? 'success' : 'neutral'}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Playground Projects */}
          <div>
            <h2 className="mb-3 text-sm font-bold tracking-wider text-stone-700 uppercase">
              Code Playground Projects ({playgroundProjects.length})
            </h2>
            {playgroundProjects.length === 0 ? (
              <Card className="p-5 text-center text-xs text-stone-500">No playground projects saved.</Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {playgroundProjects.map((proj: any) => (
                  <Card key={proj._id} className="p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-stone-900">{proj.name}</p>
                      <Badge tone={proj.kind === 'python' ? 'violet' : 'gold'}>{proj.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-400">
                      Updated {new Date(proj.updatedAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* AI Generation History */}
          <div>
            <h2 className="mb-3 text-sm font-bold tracking-wider text-stone-700 uppercase">
              Recent AI Tool Prompts &amp; Generations ({aiHistory.length})
            </h2>
            {aiHistory.length === 0 ? (
              <Card className="p-5 text-center text-xs text-stone-500">No AI tool queries recorded.</Card>
            ) : (
              <div className="space-y-2">
                {aiHistory.map((ai: any) => (
                  <Card key={ai._id} className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone="violet">{ai.type}</Badge>
                          <p className="text-sm font-semibold text-stone-900">{ai.title}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-stone-500">{ai.prompt}</p>
                      </div>
                      <span className="shrink-0 text-xs text-stone-400">{new Date(ai.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-stone-700 uppercase">Billing &amp; Payment History</h2>
            <span className="text-xs text-stone-500">{transactions.length} records</span>
          </div>

          {transactions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-stone-500">No payments recorded for this user.</Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <Card key={tx._id} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone={tx.status === 'success' ? 'success' : tx.status === 'pending' ? 'gold' : 'danger'}>
                          {tx.status}
                        </Badge>
                        <span className="text-sm font-bold text-stone-900">
                          {tx.type === 'subscription' ? 'Pro Subscription' : (tx.course?.title || 'Course Purchase')}
                        </span>
                        {tx.billingType && (
                          <span className="text-xs text-stone-400">({tx.billingType})</span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-stone-400">Ref: {tx.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">{formatKobo(tx.amount)}</p>
                      <p className="text-xs text-stone-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade / Extend Modal */}
      <UpgradeUserModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        user={{
          _id: user._id,
          name: user.name,
          email: user.email,
          isPro: isProActive,
          subscription,
        }}
        onSuccess={fetchDetails}
      />
    </div>
  );
}
