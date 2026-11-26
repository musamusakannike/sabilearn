import { useEffect, useState } from 'react';
import { IconFlame, IconRefresh, IconTrophy } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, Skeleton, Tabs } from '@/components/ui';
import { leaderboardApi } from '@/lib/api';
import { LeaderboardUser } from '@/lib/types';
import { useAuthStore } from '@/stores/auth.store';

type Timeframe = '24h' | '3d' | '1w' | '1m';

export function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const [rows, setRows] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (tf: Timeframe) => {
    setLoading(true);
    try {
      const res = await leaderboardApi.get(tf);
      setRows(res.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(timeframe);
  }, [timeframe]);

  const currentUserId = user?._id || user?.id;
  const myIndex = rows.findIndex((r) => r._id === currentUserId);
  const myRow = myIndex >= 0 ? rows[myIndex] : null;

  return (
    <div className="max-w-[880px] mx-auto p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Leaderboard</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Earn XP by completing lessons, assessments, and daily study sessions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Tabs<Timeframe>
            value={timeframe}
            onChange={setTimeframe}
            options={[
              { value: '24h', label: '24h' },
              { value: '3d', label: '3 Days' },
              { value: '1w', label: '1 Week' },
              { value: '1m', label: '1 Month' },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={15} />}
            onClick={() => void load(timeframe)}
          />
        </div>
      </div>

      {/* Pinned Current User Row */}
      {myRow && (
        <Card className="p-3.5 bg-[var(--brand-primary-soft)]/50 border-[var(--brand-primary)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] font-bold text-[13px] flex items-center justify-center">
              #{myIndex + 1}
            </span>
            <div>
              <div className="font-bold text-[14.5px]">
                {myRow.name} <Badge variant="gold" className="ml-1">You</Badge>
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">
                {myRow.currentStreak || 0}d streak · {myRow.totalXp.toLocaleString()} total XP
              </div>
            </div>
          </div>
          <div className="font-mono font-bold text-[16px]">
            {myRow.periodXp.toLocaleString()} XP
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<IconTrophy size={26} />}
          title="No rankings for this timeframe"
          description="Complete a lesson to claim the #1 spot!"
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-sunken)]/60 text-[11.5px] uppercase tracking-wider text-[var(--text-tertiary)]">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4 w-28">Streak</th>
                <th className="py-3 px-4 w-32 text-right">Period XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[14px]">
              {rows.map((r, idx) => {
                const isMe = r._id === currentUserId;
                return (
                  <tr
                    key={r._id}
                    className={
                      isMe ? 'bg-[var(--brand-primary-soft)]/35 font-semibold' : 'hover:bg-[var(--surface-sunken)]/40'
                    }
                  >
                    <td className="py-3 px-4 font-mono font-bold">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt={r.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] text-[12px] font-bold flex items-center justify-center">
                            {(r.name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span>{r.name}</span>
                        {isMe && <Badge variant="gold">You</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1">
                        <IconFlame size={14} className="text-[var(--brand-primary)]" />
                        {r.currentStreak || 0}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {r.periodXp.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
