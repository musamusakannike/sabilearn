import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { Image } from 'expo-image';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { leaderboardApi } from '@/lib/api';
import { LeaderboardUser } from '@/lib/types';
import { useAuthStore } from '@/store/auth.store';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { fontFamilies, spacing } from '@/theme';
import { ACCENT, INK, MUTED, FAINT } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

type Timeframe = '24h' | '3d' | '1w' | '1m';

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '24h', label: '24 Hours' },
  { id: '3d', label: '3 Days' },
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
];

const RULE = 'rgba(20, 20, 26, 0.08)';

interface LeaderboardPageContentProps {
  timeframe: Timeframe;
  label: string;
  currentUser: any;
  insets: EdgeInsets;
}

function LeaderboardPageContent({
  timeframe,
  label,
  currentUser,
  insets,
}: LeaderboardPageContentProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh && !hasFetched.current) {
      setLoading(true);
    }
    try {
      const res = await leaderboardApi.get(timeframe);
      if (res.data?.success) {
        setLeaderboard(res.data.data || []);
      }
    } catch {
      // silently fail — offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
      hasFetched.current = true;
    }
  }, [timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    haptics.light();
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const currentUserRankIndex = useMemo(() => {
    if (!currentUser?._id) return -1;
    return leaderboard.findIndex((item) => item._id === currentUser._id);
  }, [leaderboard, currentUser]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + spacing['4xl'] },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ACCENT}
          colors={[ACCENT]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <ResponsiveContainer maxWidth={900} paddingHorizontal={0} style={{ width: '100%' }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No XP earned yet"
              description={`Be the first to complete a lesson and lead the ${label.toLowerCase()} ranking.`}
            />
          </View>
        ) : (
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Rank</Text>
              <Text style={[styles.listHeaderText, styles.listHeaderName]}>Learner</Text>
              <Text style={[styles.listHeaderText, styles.listHeaderXp]}>XP</Text>
            </View>

            {leaderboard.map((user, idx) => {
              const rank = idx + 1;
              const isCurrent = currentUser?._id === user._id;

              return (
                <Pressable
                  key={user._id || idx}
                  onPress={() => haptics.light()}
                  style={({ pressed }) => [
                    styles.row,
                    isCurrent && styles.rowCurrent,
                    idx === leaderboard.length - 1 && styles.rowLast,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={[styles.rank, rank === 1 && styles.rankFirst]}>
                    {String(rank).padStart(2, '0')}
                  </Text>

                  <View style={styles.avatarWrap}>
                    {user.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.nameBlock}>
                    <Text style={styles.name} numberOfLines={1}>
                      {user.name}
                      {isCurrent && <Text style={styles.youInline}>  you</Text>}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {user.currentStreak
                        ? `${user.currentStreak}-day streak`
                        : user.level || 'Learner'}
                    </Text>
                  </View>

                  <Text style={styles.xp}>{user.periodXp.toLocaleString()}</Text>
                </Pressable>
              );
            })}

            {currentUser && currentUserRankIndex === -1 && (
              <Text style={styles.unrankedNote}>
                You haven't earned XP this period yet... complete a lesson to enter the ranking.
              </Text>
            )}
          </View>
        )}
      </ResponsiveContainer>
    </ScrollView>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const handleTabPress = useCallback((index: number) => {
    haptics.selection();
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />

      <ResponsiveContainer maxWidth={900} paddingHorizontal={0} style={{ width: '100%' }}>
        <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
          <ScreenHeader
            title="Leaderboard"
            subtitle="Top learners earning XP and climbing ranks."
          />

          {/* Timeframe tabs — plain text, underline on active */}
          <View style={styles.timeframeRow}>
            {TIMEFRAMES.map((tf, index) => {
              const isActive = activeIndex === index;
              return (
                <Pressable
                  key={tf.id}
                  onPress={() => handleTabPress(index)}
                  style={styles.timeframeTab}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.timeframeText,
                      isActive && styles.timeframeTextActive,
                    ]}
                  >
                    {tf.label}
                  </Text>
                  {isActive && <View style={styles.timeframeUnderline} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ResponsiveContainer>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {TIMEFRAMES.map((tf) => (
          <View key={tf.id} collapsable={false} style={styles.page}>
            <LeaderboardPageContent
              timeframe={tf.id}
              label={tf.label}
              currentUser={currentUser}
              insets={insets}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
  },

  // Timeframe tabs
  timeframeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RULE,
    marginBottom: spacing.xs,
  },
  timeframeTab: {
    paddingBottom: 10,
  },
  timeframeText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
  },
  timeframeTextActive: {
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  timeframeUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: INK,
  },

  // List
  list: {
    marginTop: spacing.xs,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RULE,
  },
  listHeaderText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: FAINT,
    width: 32,
  },
  listHeaderName: {
    flex: 1,
    width: undefined,
    marginLeft: spacing.md + 44,
  },
  listHeaderXp: {
    width: undefined,
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RULE,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowCurrent: {
    borderLeftWidth: 2,
    borderLeftColor: ACCENT,
    paddingLeft: spacing.sm - 2,
    marginLeft: -spacing.sm,
  },
  rowPressed: {
    opacity: 0.6,
  },

  rank: {
    width: 32,
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  rankFirst: {
    color: INK,
    fontFamily: fontFamilies.sansBold,
  },

  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(20, 20, 26, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: MUTED,
  },

  nameBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontFamily: fontFamilies.sansMedium,
    color: INK,
  },
  youInline: {
    fontSize: 12,
    fontFamily: fontFamilies.sans,
    color: ACCENT,
  },
  meta: {
    fontSize: 12,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    marginTop: 2,
  },

  xp: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    fontVariant: ['tabular-nums'],
  },

  unrankedNote: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
