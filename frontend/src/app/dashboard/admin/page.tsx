'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  CreditCard,
  HelpCircle,
  Activity as ActivityIcon,
  Layers,
  Sparkles,
  Smartphone,
  Globe,
  TrendingUp,
  Zap,
  Flame,
  Award,
  Code2,
  Bot,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from '@/lib/api';
import AdminGuard from '@/components/auth/AdminGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatKobo } from '@/lib/money';

const PLATFORM_COLORS: Record<string, string> = {
  web: '#3B82F6',
  ios: '#1E293B',
  android: '#10B981',
  unknown: '#94A3B8',
};

const BILLING_COLORS: Record<string, string> = {
  recurring: '#F59E0B',
  manual: '#EC4899',
  iap: '#8B5CF6',
  admin_grant: '#10B981',
};

const TIMEFRAMES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

function AdminOverview() {
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [data, setData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, perfRes, actRes] = await Promise.all([
          adminApi.analytics(timeframe),
          adminApi.coursePerformance(),
          adminApi.recentActivity(),
        ]);
        setData(analyticsRes.data.data);
        setCourses(perfRes.data.data || []);
        setRecentActivity(actRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [timeframe]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overview = data?.overview || {};
  const charts = data?.charts || {};
  const platformDist = data?.platformDistribution || [];
  const subBreakdown = data?.subscriptionBreakdown || {};
  const learningDist = data?.learningDistribution || {};
  const aiPlayground = data?.aiAndPlayground || {};

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Page Header with Timeframe Picker */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <AdminPageHeader
          title="Admin overview"
          description="Live platform analytics, user engagement &amp; revenue — 100% database driven"
        />

        <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-1 shadow-xs">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                timeframe === tf.value
                  ? 'bg-amber-500 text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Group 1: Executive KPI Summary Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Users"
          value={overview.totalUsers ?? 0}
          icon={<Users className="size-5" />}
        />
        <StatCard
          label="Active (24h DAU)"
          value={overview.dau ?? 0}
          icon={<ActivityIcon className="size-5" />}
        />
        <StatCard
          label="Pro Subscribers"
          value={overview.activeSubscribers ?? 0}
          icon={<Sparkles className="size-5 text-amber-500" />}
        />
        <StatCard
          label="Enrolled Learners"
          value={overview.enrolledLearnersDistinct ?? 0}
          icon={<BookOpen className="size-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatKobo(overview.totalRevenueKobo ?? 0)}
          icon={<CreditCard className="size-5" />}
        />
        <StatCard
          label="Study Sessions"
          value={overview.totalStudySessions ?? 0}
          icon={<Flame className="size-5 text-orange-500" />}
        />
      </div>

      {/* Secondary Highlights Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase">Conversion Rate</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{overview.conversionRate || 0}%</p>
          <p className="text-[11px] text-stone-400">Pro vs total registered learners</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase">30-day Active (MAU)</p>
          <p className="mt-1 text-2xl font-black text-stone-900">{overview.mau || 0}</p>
          <p className="text-[11px] text-stone-400">Weekly active (WAU): {overview.wau || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase">Total Study Time</p>
          <p className="mt-1 text-2xl font-black text-purple-600">
            {overview.totalStudyDurationMinutes ? `${Math.round(overview.totalStudyDurationMinutes / 60)} hrs` : '0 hrs'}
          </p>
          <p className="text-[11px] text-stone-400">{(overview.totalXpEarned || 0).toLocaleString()} XP earned</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase">Course Completions</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{overview.completedCoursesCount || 0}</p>
          <p className="text-[11px] text-stone-400">{overview.courseEnrollmentCount || 0} active enrollments</p>
        </Card>
      </div>

      {/* Group 2: User Growth & Registrations Chart */}
      {charts.userGrowth?.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">User Growth &amp; Registrations</h2>
              <p className="text-xs text-stone-500">Daily new learner sign-ups over selected period</p>
            </div>
            <span className="text-xs font-bold text-amber-600">
              +{overview.newUsersPeriod || 0} new in this timeframe
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={charts.userGrowth}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E1D8',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="registrations" name="New Users" stroke="#F59E0B" strokeWidth={2.5} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Group 3: Platform / OS Distribution & Revenue Over Time */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Operating System / Platform Breakdown */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Operating System / Platform Distribution</h2>
              <p className="text-xs text-stone-500">Learners by last active device client</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="size-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformDist}
                    dataKey="total"
                    nameKey="platform"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {platformDist.map((entry: any) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E1D8',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              {platformDist.map((p: any) => {
                const color = PLATFORM_COLORS[p.platform] || '#94A3B8';
                return (
                  <div key={p.platform} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-semibold capitalize text-stone-800">{p.platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{p.total}</span>
                      <span className="text-stone-400">({p.percentage}%)</span>
                      <span className="text-[10px] text-stone-400">· {p.active30d} active 30d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Subscriptions by Billing Type & Store */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Pro Subscriptions Breakdown</h2>
              <p className="text-xs text-stone-500">Active Pro members: {overview.activeSubscribers || 0}</p>
            </div>
            <Link href="/dashboard/admin/users?status=pro" className="text-xs font-bold text-amber-600 hover:underline">
              View all Pro
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {/* By Billing Type */}
            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-stone-500 uppercase">By Billing Channel</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {subBreakdown.byBillingType?.map((b: any) => (
                  <div key={b.billingType} className="rounded-lg border border-stone-200 bg-stone-50/60 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase">
                      {b.billingType === 'admin_grant' ? 'Admin Grant' : b.billingType}
                    </p>
                    <p className="text-base font-black text-stone-900">{b.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* By Store Origin */}
            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-stone-500 uppercase">By App Store / Channel</p>
              <div className="grid grid-cols-3 gap-2">
                {subBreakdown.byStore?.map((s: any) => (
                  <div key={s.store} className="rounded-lg border border-stone-200 bg-stone-50/60 p-2 text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase">{s.store}</p>
                    <p className="text-sm font-bold text-stone-900">{s.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Group 4: Study Engagement Sessions & Daily Activity */}
      {charts.studyActivity?.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Study Sessions &amp; Learning Reps</h2>
              <p className="text-xs text-stone-500">Flashcards, MCQs, Exercises &amp; Quizzes answered daily</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.studyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E1D8',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="flashcard" name="Flashcards" stackId="a" fill="#F59E0B" />
              <Bar dataKey="mcq" name="MCQs" stackId="a" fill="#8B5CF6" />
              <Bar dataKey="exercise" name="Exercises" stackId="a" fill="#3B82F6" />
              <Bar dataKey="quiz" name="Quizzes" stackId="a" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Group 5: Course Enrollment Funnel Table */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Course Enrollment &amp; Completion Funnel</h2>
            <p className="text-xs text-stone-500">
              Users who completed $\ge 1$ lesson are counted as enrolled
            </p>
          </div>
          <Link href="/dashboard/admin/courses" className="text-xs font-bold text-amber-600 hover:underline">
            Manage courses
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <th className="py-2.5 font-bold">Course Title</th>
                <th className="py-2.5 font-bold">Track</th>
                <th className="py-2.5 font-bold text-center">Started</th>
                <th className="py-2.5 font-bold text-center">Enrolled ($\ge$1 Lesson)</th>
                <th className="py-2.5 font-bold text-center">Completed</th>
                <th className="py-2.5 font-bold text-center">Avg Progress</th>
                <th className="py-2.5 font-bold text-center">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {courses.slice(0, 10).map((c: any) => (
                <tr key={c.courseId} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 font-semibold text-stone-900">
                    <Link href={`/dashboard/admin/courses/${c.courseId}`} className="hover:text-amber-600">
                      {c.title}
                    </Link>
                    <span className="block text-[11px] font-normal text-stone-400">{c.category}</span>
                  </td>
                  <td className="py-3">
                    <Badge tone={c.track === 'academic' ? 'violet' : 'gold'}>{c.track || 'tech'}</Badge>
                  </td>
                  <td className="py-3 text-center text-stone-600">{c.startedCount}</td>
                  <td className="py-3 text-center font-bold text-amber-700">{c.enrollment}</td>
                  <td className="py-3 text-center font-bold text-emerald-700">{c.completedCount}</td>
                  <td className="py-3 text-center font-semibold text-stone-700">{c.avgProgress}%</td>
                  <td className="py-3 text-center font-semibold text-purple-700">{c.avgScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Group 6: AI & Code Playground Adoption */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Tool Usage */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">AI Tool Usage Breakdown</h2>
              <p className="text-xs text-stone-500">Real generative AI queries across learning tools</p>
            </div>
            <Bot className="size-5 text-purple-500" />
          </div>

          <div className="space-y-2 pt-2">
            {aiPlayground.aiUsageByType?.map((item: any) => (
              <div key={item.type} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/60 p-2.5 text-xs">
                <span className="font-semibold capitalize text-stone-800">{item.type.replace('_', ' ')}</span>
                <span className="font-bold text-purple-700">{item.count} queries</span>
              </div>
            ))}
            {(!aiPlayground.aiUsageByType || aiPlayground.aiUsageByType.length === 0) && (
              <p className="py-4 text-center text-xs text-stone-400">No AI generations logged yet.</p>
            )}
          </div>
        </Card>

        {/* Code Playground Projects */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Code Playground Projects</h2>
              <p className="text-xs text-stone-500">Web &amp; Python sandboxes saved by learners</p>
            </div>
            <Code2 className="size-5 text-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {aiPlayground.playgroundByKind?.map((p: any) => (
              <div key={p.kind} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-center">
                <p className="text-xs font-bold text-stone-500 uppercase">{p.kind} Projects</p>
                <p className="mt-1 text-2xl font-black text-amber-600">{p.count}</p>
              </div>
            ))}
            {(!aiPlayground.playgroundByKind || aiPlayground.playgroundByKind.length === 0) && (
              <p className="col-span-2 py-4 text-center text-xs text-stone-400">No playground projects saved yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminOverview />
    </AdminGuard>
  );
}
