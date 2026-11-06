'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Trash2,
  Pencil,
  Sparkles,
  Smartphone,
  Globe,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { userApi } from '@/lib/api';
import AdminGuard from '@/components/auth/AdminGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import UpgradeUserModal from '@/components/admin/UpgradeUserModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
  lastActiveAt?: string;
  lastPlatform?: 'web' | 'ios' | 'android';
  activeTrack?: 'tech' | 'academic';
  totalXp?: number;
  currentStreak?: number;
  isPro?: boolean;
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  subscription?: {
    status?: string;
    billingType?: string;
    currentPeriodEnd?: string;
    store?: string;
  } | null;
}

function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, pro, free
  const [platformFilter, setPlatformFilter] = useState<string>('all'); // all, web, ios, android
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20, sortBy };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (platformFilter !== 'all') params.platform = platformFilter;

      const res = await userApi.list(params);
      setUsers(res.data.data || []);
      setPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, platformFilter, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
    try {
      await userApi.updateRole(userId, role);
      toast.success('Role updated');
      setEditUser((u) => (u ? { ...u, role } : u));
      fetchUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await userApi.remove(deleteTarget._id);
      toast.success('User deleted');
      fetchUsers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const renderPlatformIcon = (platform?: string) => {
    if (platform === 'ios') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700" title="Last used on iOS">
          <Smartphone className="size-3 text-stone-900" /> iOS
        </span>
      );
    }
    if (platform === 'android') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800" title="Last used on Android">
          <Smartphone className="size-3 text-emerald-600" /> Android
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800" title="Last used on Web">
        <Globe className="size-3 text-blue-600" /> Web
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader
        title="Manage users"
        description={`${total} users registered · Click any user to inspect enrolled courses & full activity`}
      />

      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-4 pl-10 text-sm text-stone-900 outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="pro">Pro Only</option>
              <option value="free">Free Only</option>
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="web">Web</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">Learners</option>
              <option value="admin">Admins</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 outline-none"
            >
              <option value="createdAt">Newest Joined</option>
              <option value="lastActiveAt">Recently Active</option>
              <option value="totalXp">Most XP</option>
              <option value="currentStreak">Longest Streak</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="size-12" />} title="No users found" description="Try adjusting your filters or search." />
      ) : (
        <div className="space-y-2.5">
          {users.map((u) => (
            <Card key={u._id} className="p-4 transition hover:border-amber-200 hover:shadow-xs">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                {/* User Info Left */}
                <Link
                  href={`/dashboard/admin/users/${u._id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3.5"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 font-bold text-amber-800 transition group-hover:scale-105">
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar} alt={u.name} className="size-full object-cover" />
                    ) : (
                      u.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-stone-900 group-hover:text-amber-600">
                        {u.name}
                      </p>
                      <Badge tone={u.role === 'admin' ? 'violet' : 'neutral'}>{u.role}</Badge>
                      {u.isPro ? (
                        <Badge tone="gold">Pro</Badge>
                      ) : (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
                          Free
                        </span>
                      )}
                      {renderPlatformIcon(u.lastPlatform)}
                    </div>
                    <p className="truncate text-xs text-stone-500">{u.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                      <span>
                        Enrolled in <strong className="text-stone-700 font-semibold">{u.enrolledCoursesCount || 0}</strong> courses
                      </span>
                      <span>·</span>
                      <span>
                        XP: <strong className="text-amber-700 font-semibold">{u.totalXp || 0}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Streak: <strong className="text-orange-700 font-semibold">{u.currentStreak || 0}d</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Active: {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Actions Right */}
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUpgradeTarget(u)}
                    title="Upgrade or extend user subscription"
                  >
                    <Sparkles className="size-3.5 text-amber-600" />
                    <span className="hidden sm:inline">{u.isPro ? 'Extend Pro' : 'Upgrade'}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditUser(u)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Link href={`/dashboard/admin/users/${u._id}`}>
                    <Button variant="ghost" size="sm" title="View Details">
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-1.5 pt-4">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-8 rounded-lg text-xs font-bold transition ${
                    p === page
                      ? 'bg-amber-500 text-stone-900 shadow-xs'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Role Modal */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} title="Manage user permissions">
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 font-bold text-amber-800">
                {editUser.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editUser.avatar} alt={editUser.name} className="size-full object-cover" />
                ) : (
                  editUser.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-stone-900">{editUser.name}</p>
                <p className="text-xs text-stone-500">{editUser.email}</p>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold tracking-wider text-stone-700 uppercase">System Role</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRoleChange(editUser._id, 'user')}
                  className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-bold transition ${
                    editUser.role === 'user'
                      ? 'bg-amber-500 text-stone-900 shadow-xs'
                      : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Learner (User)
                </button>
                <button
                  onClick={() => handleRoleChange(editUser._id, 'admin')}
                  className={`flex-1 cursor-pointer rounded-lg py-2 text-xs font-bold transition ${
                    editUser.role === 'admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setDeleteTarget(editUser);
                  setEditUser(null);
                }}
              >
                <Trash2 className="size-4 text-rose-600" /> Delete user account
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Upgrade User Modal */}
      <UpgradeUserModal
        isOpen={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        user={upgradeTarget}
        onSuccess={fetchUsers}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete user"
        message={`Deleting "${deleteTarget?.name}" will permanently remove their account, progress, and subscriptions.`}
        confirmLabel="Delete user"
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersContent />
    </AdminGuard>
  );
}
