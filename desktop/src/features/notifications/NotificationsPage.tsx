import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBell, IconCheck, IconChecks, IconRefresh } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { notificationApi } from '@/lib/api';
import { NotificationItem } from '@/lib/types';
import { openExternalUrl } from '@/platform';
import { useUiStore } from '@/stores/ui.store';

function mapActionUrl(url?: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/dashboard/courses/')) {
    return url.replace('/dashboard/courses/', '/course/').replace('/topics/', '/topic/');
  }
  if (url.startsWith('/dashboard/leaderboard')) return '/leaderboard';
  if (url.startsWith('/dashboard/playground')) return url.replace('/dashboard', '');
  if (url.startsWith('/dashboard/subscribe')) return '/subscribe';
  return null;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const setUnread = useUiStore((s) => s.setUnreadNotifications);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list();
      const list: NotificationItem[] = res.data || [];
      setItems(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } catch {
      // ignore offline
    } finally {
      setLoading(false);
    }
  }, [setUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      setUnread(items.filter((n) => !n.isRead && n._id !== item._id).length);
      void notificationApi.markRead(item._id).catch(() => {});
    }
    const target = mapActionUrl(item.actionUrl);
    if (!target) return;
    if (/^https?:\/\//i.test(target)) {
      await openExternalUrl(target);
    } else {
      navigate(target);
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    await notificationApi.markAllRead().catch(() => {});
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-[760px] mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Alerts & Notifications</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IconChecks size={15} />}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconBell size={24} />}
          title="No alerts yet"
          description="Streak reminders, course updates, and announcements will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <Card
              key={item._id}
              interactive
              onClick={() => void markRead(item)}
              className={[
                'p-4 flex items-start justify-between gap-4',
                !item.isRead ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/25' : '',
              ].join(' ')}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] shrink-0" />
                  )}
                  <span className="font-bold text-[14.5px]">{item.title}</span>
                  <Badge variant={item.type === 'success' ? 'success' : item.type === 'warning' ? 'warning' : 'default'}>
                    {item.type}
                  </Badge>
                </div>
                <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
                  {item.message}
                </p>
                <div className="text-[11.5px] text-[var(--text-tertiary)]">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
              {item.isRead && <IconCheck size={16} className="text-[var(--text-tertiary)] shrink-0 mt-1" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
