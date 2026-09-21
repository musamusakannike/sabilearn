import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  IconBook,
  IconArrowRight,
  IconSparkles,
  IconBrain,
  IconCards,
  IconBooks,
  IconMessageCircle,
  IconCode,
  IconBell,
  IconFlame,
  IconBolt,
  IconTarget,
} from '@tabler/icons-react-native';
import { useProgressStore } from '@/store/progress.store';
import { useAuthStore } from '@/store/auth.store';
import { courseApi, notificationApi } from '@/lib/api';
import { Course, Topic } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import AIToolDialog, { AIToolKind } from '@/components/ai/AIToolDialogs';
import OfflineBanner from '@/components/common/OfflineBanner';
import { NotInReview } from '@/components/common/ReviewGuard';
import { useAppReview } from '@/hooks/useAppReview';
import OnboardingSpeechBubble from '@/components/auth/OnboardingSpeechBubble';
import GlassSurface, { GlassCluster } from '@/components/ui/GlassSurface';
import HomeBackdrop from '@/components/home/HomeBackdrop';
import { fontFamilies, fontSizes, spacing } from '@/theme';
import * as haptics from '@/lib/haptics';

const ACCENT = '#FF8A1E';
const INK = '#0E0E1A';
const MUTED = '#6B6B80';
const FAINT = '#8E8E9F';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHome() {
  const insets = useSafeAreaInsets();
  const { user, fetchMe } = useAuthStore();
  const { inReview } = useAppReview();
  const { dashboard, isLoading, fetchDashboard } = useProgressStore();
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [aiTool, setAiTool] = useState<AIToolKind | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchUnreadStatus = useCallback(async () => {
    try {
      const res = await notificationApi.list();
      const items = res.data?.data || [];
      setHasUnread(items.some((n: { isRead?: boolean }) => !n.isRead));
    } catch {
      // silently fail — offline or unauthenticated
    }
  }, []);

  const fetchPopularCourses = useCallback(async () => {
    try {
      const res = await courseApi.popular();
      setPopularCourses(res.data.data);
    } catch {
      // silently fail — offline or server error
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initial dashboard fetch */
    fetchDashboard();
    void fetchMe();
    void fetchPopularCourses();
    void fetchUnreadStatus();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fetchDashboard, fetchMe, fetchPopularCourses, fetchUnreadStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([fetchDashboard(), fetchMe(), fetchPopularCourses(), fetchUnreadStatus()]);
    setRefreshing(false);
  }, [fetchDashboard, fetchMe, fetchPopularCourses, fetchUnreadStatus]);

  if (isLoading && !dashboard) {
    return <LoadingSpinner />;
  }

  const continueStudying = (dashboard?.continueStudying || []).filter((progress) => {
    if (!inReview) return true;
    const course = typeof progress.course === 'object' ? (progress.course as Course) : null;
    return !course || course.isFree;
  });
  const visiblePopular = inReview ? popularCourses.filter((c) => c.isFree) : popularCourses;
  const firstName = user?.firstName?.trim();
  const hour = new Date().getHours();
  const streak = dashboard?.streak ?? user?.currentStreak ?? 0;
  const xp = dashboard?.totalXp ?? user?.totalXp ?? 0;
  const accuracy = dashboard?.quickStats?.avgAccuracy ?? 0;

  let speech = 'What do you want to learn today?';
  if (streak > 1) speech = `A ${streak}-day streak! Ready to keep it going?`;
  else if (continueStudying.length > 0) speech = "Let's pick up where you left off.";

  const aiTools: {
    kind: AIToolKind | 'generate-course';
    title: string;
    description: string;
    icon: ReactNode;
    well: string;
    tint: string;
  }[] = [
    {
      kind: 'summarizer',
      title: 'Summarizer',
      description: 'Turn any lecture note into a short summary',
      icon: <IconSparkles size={22} color="#5B4FE8" />,
      well: 'rgba(91,79,232,0.12)',
      tint: 'rgba(91,79,232,0.14)',
    },
    {
      kind: 'quiz',
      title: 'Quiz generator',
      description: 'Generate a quick multiple-choice quiz',
      icon: <IconBrain size={22} color="#5B4FE8" />,
      well: 'rgba(91,79,232,0.12)',
      tint: 'rgba(91,79,232,0.14)',
    },
    inReview
      ? {
          kind: 'flashcards' as const,
          title: 'Flashcards',
          description: 'Build flashcards from any topic',
          icon: <IconCards size={22} color="#5B4FE8" />,
          well: 'rgba(91,79,232,0.12)',
          tint: 'rgba(91,79,232,0.14)',
        }
      : {
          kind: 'generate-course' as const,
          title: 'Generate course',
          description: 'Turn notes or a prompt into a full course',
          icon: <IconBooks size={22} color="#5B4FE8" />,
          well: 'rgba(91,79,232,0.12)',
          tint: 'rgba(91,79,232,0.14)',
        },
    {
      kind: 'qa',
      title: 'Q&A AI',
      description: 'Ask a question, get a direct answer',
      icon: <IconMessageCircle size={22} color="#5B4FE8" />,
      well: 'rgba(91,79,232,0.12)',
      tint: 'rgba(91,79,232,0.14)',
    },
  ];

  return (
    <View collapsable={false} style={styles.container}>
      <HomeBackdrop />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: spacing['4xl'] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
      >
        <OfflineBanner />

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{greetingForHour(hour)}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {firstName ? firstName : 'there'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/notifications' as any);
            }}
            accessibilityLabel="Alerts"
            accessibilityRole="button"
          >
            <GlassSurface style={styles.bellButton} glassEffectStyle="clear" isInteractive tintColor="rgba(255,255,255,0.45)">
              <IconBell size={22} color={INK} />
              {hasUnread && <View style={styles.unreadBadge} />}
            </GlassSurface>
          </Pressable>
        </View>

        <View style={styles.speechWrap}>
          <OnboardingSpeechBubble text={speech} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScrollView}
          contentContainerStyle={styles.statsScrollContent}
        >
          <GlassCluster spacing={12} style={styles.statsRow}>
            <GlassSurface style={styles.statChip} tintColor="rgba(255,138,30,0.18)" glassEffectStyle="clear">
              <View style={[styles.statIcon, { backgroundColor: 'rgba(255,138,30,0.16)' }]}>
                <IconFlame size={18} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
            </GlassSurface>
            <GlassSurface style={styles.statChip} tintColor="rgba(91,79,232,0.12)" glassEffectStyle="clear">
              <View style={[styles.statIcon, { backgroundColor: 'rgba(91,79,232,0.12)' }]}>
                <IconBolt size={18} color="#5B4FE8" />
              </View>
              <View>
                <Text style={styles.statValue}>{xp}</Text>
                <Text style={styles.statLabel}>XP earned</Text>
              </View>
            </GlassSurface>
            <GlassSurface style={styles.statChip} tintColor="rgba(16,185,129,0.14)" glassEffectStyle="clear">
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                <IconTarget size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statValue}>{Math.round(accuracy)}%</Text>
                <Text style={styles.statLabel}>avg accuracy</Text>
              </View>
            </GlassSurface>
          </GlassCluster>
        </ScrollView>

        <NotInReview>
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/playground' as any);
            }}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <GlassSurface
              style={styles.playgroundCard}
              tintColor="rgba(255,138,30,0.22)"
              isInteractive
              fallbackStyle={styles.playgroundFallback}
            >
              <View style={styles.playgroundIcon}>
                <IconCode size={22} color={INK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Code Playground</Text>
                <Text style={styles.cardSubtitle}>Write and run HTML, CSS, JavaScript and Python</Text>
              </View>
              <View style={styles.openPill}>
                <Text style={styles.openPillText}>Open</Text>
              </View>
            </GlassSurface>
          </Pressable>
        </NotInReview>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI tools</Text>
          <View style={styles.aiGrid}>
            {aiTools.map((tool) => (
              <Pressable
                key={tool.kind}
                onPress={() => {
                  haptics.light();
                  if (tool.kind === 'quiz') {
                    router.push('/ai-quiz' as any);
                  } else if (tool.kind === 'generate-course') {
                    router.push('/generate-course' as any);
                  } else {
                    setAiTool(tool.kind);
                  }
                }}
                style={({ pressed }) => [styles.aiGridItem, pressed && styles.pressed]}
              >
                <GlassSurface style={styles.aiCard} tintColor={tool.tint} isInteractive>
                  <View style={[styles.aiIconWell, { backgroundColor: tool.well }]}>{tool.icon}</View>
                  <Text numberOfLines={1} style={styles.aiTitle}>
                    {tool.title}
                  </Text>
                  <Text style={styles.aiDescription} numberOfLines={2}>
                    {tool.description}
                  </Text>
                </GlassSurface>
              </Pressable>
            ))}
          </View>
        </View>
        
        {continueStudying.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue studying</Text>
            <View style={styles.cardList}>
              {continueStudying.slice(0, 4).map((progress) => {
                const course = typeof progress.course === 'object' ? (progress.course as Course) : null;
                const topic = typeof progress.topic === 'object' ? (progress.topic as Topic) : null;
                const flashcardTotal = progress.flashcardsTotal ?? 0;
                const flashcardStudied = progress.flashcardsStudied ?? 0;
                const flashcardProgress = flashcardTotal > 0 ? (flashcardStudied / flashcardTotal) * 100 : 0;
                return (
                  <Pressable
                    key={progress._id}
                    onPress={() => {
                      haptics.light();
                      if (topic && course) router.push(`/course/${course._id}/topic/${topic._id}` as any);
                      else if (course) router.push(`/course/${course._id}` as any);
                    }}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <GlassSurface style={styles.studyCard} isInteractive tintColor="rgba(255,255,255,0.38)">
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          {course && (
                            <Text style={styles.cardOverline} numberOfLines={1}>
                              {course.title}
                            </Text>
                          )}
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {topic?.title || course?.title || 'Course'}
                          </Text>
                        </View>
                        {course && <Badge variant={course.difficulty}>{course.difficulty}</Badge>}
                      </View>
                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabelText}>Flashcard progress</Text>
                          <Text style={styles.progressLabelText}>{Math.round(flashcardProgress)}%</Text>
                        </View>
                        <ProgressBar value={flashcardProgress} color={ACCENT} trackColor="rgba(14,14,26,0.08)" />
                      </View>
                      <View style={styles.continueLink}>
                        <Text style={styles.continueLinkText}>Continue</Text>
                        <IconArrowRight size={16} color={ACCENT} />
                      </View>
                    </GlassSurface>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleFlush}>Popular courses</Text>
            <Pressable onPress={() => { haptics.light(); router.push('/(tabs)/courses'); }}>
              <Text style={styles.viewAllLink}>View all</Text>
            </Pressable>
          </View>
          {visiblePopular.length === 0 ? (
            <EmptyState
              icon={<IconBook size={44} color={FAINT} />}
              title="No courses available yet"
              description="Check back later for study content."
            />
          ) : (
            <View style={styles.cardList}>
              {visiblePopular.map((course) => (
                <Pressable
                  key={course._id}
                  onPress={() => {
                    haptics.light();
                    router.push(`/course/${course._id}` as any);
                  }}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <GlassSurface style={styles.courseCard} isInteractive tintColor="rgba(255,255,255,0.38)">
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {course.title}
                        </Text>
                        <Text style={styles.progressLabelText}>{course.category}</Text>
                      </View>
                      <Badge>{course.topicCount || 0} topics</Badge>
                    </View>
                    <Text style={styles.topicDesc} numberOfLines={2}>
                      {course.description}
                    </Text>
                    <View style={styles.continueLink}>
                      <Text style={styles.continueLinkText}>View course</Text>
                      <IconArrowRight size={14} color={ACCENT} />
                    </View>
                  </GlassSurface>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <AIToolDialog kind={aiTool} onClose={() => setAiTool(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  speechWrap: {
    marginHorizontal: -spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  kicker: {
    fontSize: 15,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
    marginBottom: 2,
  },
  title: {
    fontSize: 34,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    overflow: 'hidden',
  },
  unreadBadge: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E5484D',
  },
  statsScrollView: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  statsScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChip: {
    minWidth: 140,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
  },
  playgroundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  playgroundFallback: {
    backgroundColor: '#FFF7EE',
    borderColor: '#FFD4A8',
  },
  playgroundIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPill: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  openPillText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  sectionTitleFlush: {
    fontSize: 20,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardList: {
    gap: spacing.md,
  },
  studyCard: {
    borderRadius: 20,
    padding: spacing.base,
    overflow: 'hidden',
  },
  courseCard: {
    borderRadius: 20,
    padding: spacing.base,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardOverline: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansMedium,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    marginTop: 2,
  },
  progressSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: MUTED,
  },
  continueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  continueLinkText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  aiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  aiGridItem: {
    width: '47%',
    flexGrow: 1,
  },
  aiCard: {
    minHeight: 148,
    borderRadius: 20,
    padding: spacing.base,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  aiIconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  aiTitle: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    lineHeight: 18,
  },
  viewAllLink: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  topicDesc: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
