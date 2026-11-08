import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  IconArrowLeft,
  IconShare,
  IconBook,
  IconUsers,
  IconBolt,
  IconCheck,
  IconLock,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPlay,
  IconCircleCheck,
  IconAward,
  IconCode,
} from '@tabler/icons-react-native';
import { courseApi, chapterApi, progressApi, paymentApi } from '@/lib/api';
import { Course, Chapter, Topic, PaymentStatus, Exercise } from '@/lib/types';
import {
  cacheCourseChapters,
  cacheCourseDetail,
  cachePaymentStatus,
  getCachedPaymentStatus,
  getLocalCourseProgress,
  isOnline,
} from '@/lib/offlineSync';
import {
  checkOfflineCourseAccess,
  computeChaptersWithStatus,
  getOfflineChapters,
  getOfflineCourseDetail,
  getOfflineTopics,
  isBundledCourse,
} from '@/lib/offlineCourses';
import { useAuthStore } from '@/store/auth.store';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import ExerciseSheet from '@/components/courses/ExerciseSheet';
import { fontFamilies, fontSizes, radii, spacing, shadows } from '@/theme';
import { ACCENT, INK, PAGE, TINT_GLASS } from '@/theme/brand';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import GlassSurface from '@/components/ui/GlassSurface';
import GlassIconButton from '@/components/common/GlassIconButton';
import CoursePaywall from '@/components/payments/CoursePaywall';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import * as haptics from '@/lib/haptics';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const colors = {
    textPrimary: INK,
    textSecondary: '#6B6B80',
    textTertiary: '#8E8E9F',
    brandPrimaryHover: ACCENT,
    brandOnPrimary: INK,
    brandPrimarySoft: 'rgba(255,138,30,0.16)',
    success: '#1F9D55',
    surfaceSunken: '#F4F4F6',
    borderSubtle: '#E8E8EE',
    bgApp: PAGE,
    surfaceCard: PAGE,
    brandPrimary: ACCENT,
  } as const;

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Accordion toggle states
  const [accordionState, setAccordionState] = useState({
    learn: false,
    prerequisites: false,
    description: false,
  });

  // Collapsed chapter dropdown states
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [expandedAuthors, setExpandedAuthors] = useState(false);
  const [activeExercise, setActiveExercise] = useState<{ exercise: Exercise; chapterId: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const user = useAuthStore.getState().user;
    try {
      const online = await isOnline();
      if (!online) {
        // Offline: resolve from offline store/bundles with server guards applied
        const offlineCourse = await getOfflineCourseDetail(id);
        const rawChapters = await getOfflineChapters(id);
        const rawTopics = await getOfflineTopics(id);
        const offlinePayment = await getCachedPaymentStatus();
        const localProgress = await getLocalCourseProgress(id, user?._id);

        setCourse(offlineCourse);
        setPaymentStatus(offlinePayment);

        const hasAccessOffline = offlineCourse
          ? checkOfflineCourseAccess(offlineCourse, user, offlinePayment)
          : false;

        const guardedChapters = computeChaptersWithStatus(
          rawChapters,
          rawTopics,
          localProgress,
          hasAccessOffline
        );
        setChapters(guardedChapters);

        if (guardedChapters.length > 0) {
          const targetChapter =
            guardedChapters.find(
              (ch) =>
                ch.status === 'inprogress' &&
                ((ch.progressPercent || 0) > 0 || (ch.topics || []).some((t) => t.isCompleted || t.inProgress))
            ) ||
            guardedChapters.find((ch) =>
              (ch.topics || []).some((t) => !t.isCompleted)
            ) ||
            guardedChapters[0];
          setOpenChapters((prev) => ({ ...prev, [targetChapter._id]: true }));
        }
        return;
      }

      // Online: fetch fresh data from server
      const [courseRes, chaptersRes, paymentRes] = await Promise.all([
        courseApi.get(id),
        chapterApi.byCourse(id),
        paymentApi.me().catch(() => ({ data: { data: null } })),
      ]);

      const freshCourse = courseRes.data.data;
      const fetchedChapters: Chapter[] = chaptersRes.data.data || [];
      const freshPayment = paymentRes.data.data;

      setCourse(freshCourse);
      setChapters(fetchedChapters);
      setPaymentStatus(freshPayment);

      // Cache fresh data for offline use
      if (freshCourse) void cacheCourseDetail(id, freshCourse);
      if (fetchedChapters.length > 0) void cacheCourseChapters(id, fetchedChapters);
      if (freshPayment) void cachePaymentStatus(freshPayment);

      if (fetchedChapters.length > 0) {
        const targetChapter =
          fetchedChapters.find(
            (ch) =>
              ch.status === 'inprogress' &&
              ((ch.progressPercent || 0) > 0 || (ch.topics || []).some((t) => t.isCompleted || t.inProgress))
          ) ||
          fetchedChapters.find((ch) =>
            (ch.topics || []).some((t) => !t.isCompleted)
          ) ||
          fetchedChapters[0];
        setOpenChapters((prev) => ({ ...prev, [targetChapter._id]: true }));
      }
    } catch (e) {
      console.warn('Network error fetching course details, falling back to offline:', e);
      // Fallback on network error
      const offlineCourse = await getOfflineCourseDetail(id);
      const rawChapters = await getOfflineChapters(id);
      const rawTopics = await getOfflineTopics(id);
      const offlinePayment = await getCachedPaymentStatus();
      const localProgress = await getLocalCourseProgress(id, user?._id);

      setCourse(offlineCourse);
      setPaymentStatus(offlinePayment);

      const hasAccessOffline = offlineCourse
        ? checkOfflineCourseAccess(offlineCourse, user, offlinePayment)
        : false;

      const guardedChapters = computeChaptersWithStatus(
        rawChapters,
        rawTopics,
        localProgress,
        hasAccessOffline
      );
      setChapters(guardedChapters);

      if (guardedChapters.length > 0) {
        const targetChapter =
          guardedChapters.find(
            (ch) =>
              ch.status === 'inprogress' &&
              ((ch.progressPercent || 0) > 0 || (ch.topics || []).some((t) => t.isCompleted || t.inProgress))
          ) ||
          guardedChapters.find((ch) =>
            (ch.topics || []).some((t) => !t.isCompleted)
          ) ||
          guardedChapters[0];
        setOpenChapters((prev) => ({ ...prev, [targetChapter._id]: true }));
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    loadData();
  }, [loadData]);

  const hasAccess =
    !course ||
    course.isFree ||
    paymentStatus?.subscription?.status === 'active' ||
    !!paymentStatus?.purchasedCourseIds?.includes(course._id);

  const toggleAccordion = (key: keyof typeof accordionState) => {
    haptics.selection();
    setAccordionState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChapterDropdown = (chapterId: string) => {
    haptics.selection();
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleShare = async () => {
    haptics.light();
    try {
      await Share.share({
        title: course?.title || 'SabiLearn Course',
        message: `Check out "${course?.title}" on SabiLearn: https://sabilearn.online/dashboard/courses/${id}`,
      });
    } catch {
      // ignore
    }
  };

  const handleRetakeChapter = (chapter: Chapter, firstTopic: Topic) => {
    haptics.light();
    const message =
      'Reviewing this chapter will open Lesson 1 for practice. Your completed progress and earned XP will not be reset.';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`Retake Chapter?\n\n${message}`)) {
        handleOpenTopic(chapter, firstTopic);
      }
      return;
    }
    Alert.alert('Retake Chapter?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retake Chapter', onPress: () => handleOpenTopic(chapter, firstTopic) },
    ]);
  };

  const handleOpenTopic = (chapter: Chapter, topic: Topic) => {
    if (!hasAccess || !topic.isUnlocked) return;
    haptics.light();

    // Save position asynchronously
    progressApi.savePosition({
      courseId: id,
      chapterId: chapter._id,
      topicId: topic._id,
      contentIndex: 0,
    }).catch(() => {});

    // Navigate directly to dedicated learn screen
    router.push({
      pathname: '/course/[id]/topic/[topicId]/learn',
      params: { id, topicId: topic._id },
    } as any);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!course) return <EmptyState title="Course not found" />;

  const authors = course.authors || [];
  const s = makeStyles(colors);

  // Flatten the three info blocks into one list so dividers between them
  // (rather than three separate boxed cards) are trivial to render.
  const accordionSections: { key: keyof typeof accordionState; title: string; body: React.ReactNode }[] = [];

  if (course.whatYouWillLearn && course.whatYouWillLearn.length > 0) {
    accordionSections.push({
      key: 'learn',
      title: "What you'll learn",
      body: (
        <View style={s.accordionBody}>
          {course.whatYouWillLearn.map((item, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={s.bulletIcon}>
                <IconCheck size={12} color={colors.brandPrimaryHover} />
              </View>
              <Text style={s.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ),
    });
  }

  accordionSections.push({
    key: 'prerequisites',
    title: 'Prerequisites',
    body: (
      <View style={s.accordionBody}>
        {course.prerequisites && course.prerequisites.length > 0 ? (
          course.prerequisites.map((prereq, idx) => (
            <View key={idx} style={s.bulletRow}>
              <View style={s.dot} />
              <Text style={s.bulletText}>{prereq}</Text>
            </View>
          ))
        ) : (
          <Text style={s.emptyPrereq}>No prior prerequisites required. Perfect for beginners!</Text>
        )}
      </View>
    ),
  });

  accordionSections.push({
    key: 'description',
    title: 'Description',
    body: (
      <View style={s.accordionBody}>
        <Text style={s.descText}>{course.longDescription || course.description}</Text>
      </View>
    ),
  });

  return (
    <View collapsable={false} style={s.container}>
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        <ResponsiveContainer maxWidth={1100} paddingHorizontal={0} style={{ width: '100%' }}>
          <View style={s.navRow}>
            <GlassIconButton onPress={() => router.back()} accessibilityLabel="Back to courses">
              <IconArrowLeft size={22} color={INK} />
            </GlassIconButton>
            <GlassIconButton onPress={handleShare} accessibilityLabel="Share course">
              <IconShare size={18} color={INK} />
            </GlassIconButton>
          </View>

          <View style={[s.contentGrid, isDesktop && s.contentGridDesktop]}>
            <View style={[s.overviewColumn, isDesktop && s.overviewColumnDesktop]}>
              {/* Hero stays a real panel — it's the cover, not a content card */}
              <GlassSurface style={s.heroCard} tintColor={TINT_GLASS}>
          {course.banner ? (
            <Image source={{ uri: course.banner }} style={s.banner} resizeMode="cover" />
          ) : null}

          <View style={s.badgeRow}>
            <Badge>{course.category}</Badge>
            <Badge variant={course.difficulty}>{course.difficulty}</Badge>
            {!course.isFree && (
              <Badge variant={hasAccess ? 'success' : 'default'}>
                {hasAccess ? 'Unlocked' : 'Premium'}
              </Badge>
            )}
          </View>

          <Text style={s.title}>{course.title}</Text>
          {!course.isFree ? (
            <Text style={s.priceLine}>{hasAccess ? 'Included in your access' : 'Included with Premium'}</Text>
          ) : (
            <Text style={s.priceLine}>Free</Text>
          )}

          {authors.length > 0 && (
            <View style={s.authorsRow}>
              <View style={s.avatarGroup}>
                {authors.slice(0, expandedAuthors ? authors.length : 3).map((author, aIdx) => (
                  <View key={aIdx} style={[s.authorAvatarCircle, { backgroundColor: colors.brandPrimarySoft }]}>
                    {author.avatar ? (
                      <Image source={{ uri: author.avatar }} style={s.authorAvatarImg} />
                    ) : (
                      <Text style={s.authorAvatarInitial}>{author.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.authorLabel}>AUTHOR(S)</Text>
                <Text style={s.authorName}>
                  {expandedAuthors ? (
                    authors.map((a) => a.name).join(', ')
                  ) : (
                    <>
                      {authors[0].name}
                      {authors.length > 1 && (
                        <Text onPress={() => setExpandedAuthors(!expandedAuthors)} style={s.moreAuthors}>
                          {' '}+{authors.length - 1} more
                        </Text>
                      )}
                    </>
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Stats row: one hairline-divided strip instead of three boxed tiles */}
          <View style={s.statsRow}>
            <View style={s.statCol}>
              <View style={s.statIconRow}>
                <IconBook size={14} color={colors.brandPrimaryHover} />
                <Text style={s.statLabel}>Lessons</Text>
              </View>
              <Text style={s.statValue}>{course.lessonCount || 0}</Text>
            </View>

            <View style={s.statDivider} />

            <View style={s.statCol}>
              <View style={s.statIconRow}>
                <IconUsers size={14} color={colors.brandPrimaryHover} />
                <Text style={s.statLabel}>Learners</Text>
              </View>
              <Text style={s.statValue}>{course.registeredUsersCount || 0}</Text>
            </View>

            <View style={s.statDivider} />

            <View style={s.statCol}>
              <View style={s.statIconRow}>
                <IconBolt size={14} color="#F59E0B" />
                <Text style={s.statLabel}>Total XP</Text>
              </View>
              <Text style={[s.statValue, { color: '#D97706' }]}>+{course.totalObtainableXp || 0}</Text>
            </View>
          </View>
        </GlassSurface>

        {!hasAccess && !course.isFree && (
          <CoursePaywall course={course} paymentStatus={paymentStatus} onUnlocked={() => void loadData()} />
        )}

        {/* Info accordions — one flat block, hairline dividers between sections, no per-item box */}
        <View style={s.accordionGroup}>
          {accordionSections.map((section, idx) => (
            <View key={section.key} style={[idx > 0 && s.accordionDivider]}>
              <Pressable onPress={() => toggleAccordion(section.key)} style={s.accordionHeader}>
                <Text style={s.accordionTitle}>{section.title}</Text>
                {accordionState[section.key] ? (
                  <IconChevronUp size={18} color={colors.textTertiary} />
                ) : (
                  <IconChevronDown size={18} color={colors.textTertiary} />
                )}
              </Pressable>
              {accordionState[section.key] && section.body}
            </View>
          ))}
        </View>
      </View>

        <View style={[s.structureColumn, isDesktop && s.structureColumnDesktop]}>
          {/* Course Structure (Chapters & Topics) */}
          <View style={s.structureSection}>
            <Text style={s.sectionTitle}>Course Structure</Text>

          {chapters.length === 0 ? (
            <EmptyState
              icon={<IconBook size={40} color={colors.textTertiary} />}
              title="No chapters published yet"
              description="Content for this course is being prepared."
            />
          ) : (
            <View style={s.chapterList}>
              {chapters.map((chapter, cIdx) => {
                const isOpen = !!openChapters[chapter._id];
                const isLocked = chapter.status === 'locked';
                const isCompleted = chapter.status === 'completed';
                const isInProgress = chapter.status === 'inprogress';
                const topics = chapter.topics || [];
                const exercise = chapter.exercise;
                const hasExercise = !!(exercise && exercise.questions && exercise.questions.length > 0);
                const progressPct = isCompleted ? 100 : (chapter.progressPercent || 0);
                const hasStarted =
                  isCompleted ||
                  progressPct > 0 ||
                  topics.some((t) => t.isCompleted || t.inProgress);
                const allTopicsCompleted = topics.length > 0 && topics.every((t) => t.isCompleted);
                const isCapstonePending =
                  !isCompleted && hasExercise && allTopicsCompleted && !chapter.isAssessmentPassed;

                return (
                  <View
                    key={chapter._id}
                    style={[
                      s.chapterCard,
                      isLocked && s.chapterLocked,
                    ]}
                  >
                    {/* Chapter Header Top Row: Number, Title, Badge, and Progress Bar */}
                    <View style={s.chapterTopRow}>
                      <View style={s.chapterTopLeft}>
                        <View style={s.chapterNumBadge}>
                          <Text style={s.chapterNumText}>{cIdx + 1}</Text>
                        </View>
                        <Text style={s.chapterTitle} numberOfLines={1}>
                          {chapter.title}
                        </Text>
                        <Badge
                          variant={
                            isCompleted
                              ? 'success'
                              : isLocked
                              ? 'default'
                              : isInProgress && hasStarted
                              ? 'intermediate'
                              : 'default'
                          }
                        >
                          {isCompleted
                            ? 'Completed'
                            : isLocked
                            ? 'Locked'
                            : isInProgress && hasStarted
                            ? 'In Progress'
                            : 'Not Started'}
                        </Badge>
                      </View>

                      {/* Progress Bar & Percentage */}
                      <View style={s.chapterProgressCol}>
                        <View style={s.chapterProgressContainer}>
                          <View style={s.progressBarTrack}>
                            <View
                              style={[
                                s.progressBarFill,
                                { width: `${progressPct}%` },
                              ]}
                            />
                          </View>
                          <Text style={s.progressPctText}>{progressPct}%</Text>
                        </View>
                        {isCapstonePending && (
                          <Text style={s.capstonePendingText}>
                            {topics.length}/{topics.length} lessons · Capstone pending
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Chapter Description */}
                    {chapter.description ? (
                      <Text style={s.chapterDesc}>
                        {chapter.description}
                      </Text>
                    ) : null}

                    {/* Divider */}
                    <View style={s.chapterDivider} />

                    {/* Action Row: Hide/Show Chapter Details & Continue Button */}
                    <View style={s.chapterActionRow}>
                      <Pressable
                        onPress={() => toggleChapterDropdown(chapter._id)}
                        style={s.toggleDropdownBtn}
                        hitSlop={8}
                      >
                        <Text style={s.toggleDropdownText}>
                          {isOpen ? 'Hide Chapter Details' : 'Show Chapter Details'}
                        </Text>
                        {isOpen ? (
                          <IconChevronUp size={16} color={colors.brandPrimaryHover} />
                        ) : (
                          <IconChevronDown size={16} color={colors.brandPrimaryHover} />
                        )}
                      </Pressable>

                      {isLocked ? (
                        <View style={s.lockedBtn}>
                          <IconLock size={14} color={colors.textTertiary} />
                          <Text style={s.lockedBtnText}>Locked</Text>
                        </View>
                      ) : isCompleted ? (
                        <Pressable
                          onPress={() => {
                            if (topics.length > 0) {
                              handleRetakeChapter(chapter, topics[0]);
                            }
                          }}
                          style={s.retakeBtn}
                        >
                          <IconPlayerPlay size={13} color={colors.textPrimary} />
                          <Text style={s.retakeBtnText}>Retake Chapter</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            const firstIncomplete = topics.find((topic) => topic.isUnlocked && !topic.isCompleted);
                            if (firstIncomplete) {
                              handleOpenTopic(chapter, firstIncomplete);
                            } else if (isCapstonePending) {
                              haptics.light();
                              router.push({
                                pathname: '/course/[id]/chapter/[chapterId]/assessment',
                                params: { id, chapterId: chapter._id },
                              } as any);
                            }
                          }}
                          style={s.continueBtn}
                        >
                          <Text style={s.continueBtnText}>
                            {isCapstonePending
                              ? 'Start Capstone'
                              : hasStarted
                              ? 'Continue Chapter'
                              : 'Start Chapter'}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Topics — clean list matching reference layout */}
                    {isOpen && (
                      <View style={s.topicsContainer}>
                        {topics.length > 0 ? (
                          topics.map((topic) => {
                            const tUnlocked = !hasAccess ? false : !!topic.isUnlocked;
                            const tCompleted = !!topic.isCompleted;
                            const hasCode =
                              topic.contents?.some((c) => c.type === 'code' || c.type === 'exercise') ||
                              !!topic.exercise ||
                              topic.title.toLowerCase().includes('command') ||
                              topic.title.toLowerCase().includes('code') ||
                              topic.title.toLowerCase().includes('shell') ||
                              topic.title.toLowerCase().includes('script') ||
                              topic.title.toLowerCase().includes('terminal');

                            return (
                              <Pressable
                                key={topic._id}
                                disabled={!tUnlocked && hasAccess}
                                onPress={() => {
                                  if (!hasAccess) {
                                    return;
                                  }
                                  if (topic.isUnlocked) {
                                    handleOpenTopic(chapter, topic);
                                  }
                                }}
                                style={[
                                  s.topicItem,
                                  !tUnlocked && s.topicItemLocked,
                                ]}
                              >
                                <View style={s.topicLeft}>
                                  <View style={s.topicIconWrap}>
                                    {hasCode ? (
                                      <IconCode size={15} color={colors.textPrimary} />
                                    ) : (
                                      <IconPlayerPlay size={13} color={colors.brandPrimaryHover} />
                                    )}
                                  </View>
                                  <Text
                                    style={[s.topicItemTitle, !tUnlocked && { color: colors.textTertiary }]}
                                    numberOfLines={1}
                                  >
                                    {topic.title}
                                  </Text>
                                </View>

                                <View style={s.topicRight}>
                                  {!hasAccess || !topic.isUnlocked ? (
                                    <View style={s.topicLockRow}>
                                      <IconLock size={12} color={colors.textTertiary} />
                                      <Text style={s.topicXpTextMuted}>{topic.xp || 50} XP</Text>
                                    </View>
                                  ) : (
                                    <View style={s.topicStatusRow}>
                                      {tCompleted && (
                                        <IconCheck size={14} color="#10B981" />
                                      )}
                                      <Text style={s.topicXpText}>{topic.xp || 50} XP</Text>
                                    </View>
                                  )}
                                </View>
                              </Pressable>
                            );
                          })
                        ) : (
                          <Text style={s.noTopicsText}>No topics available yet.</Text>
                        )}

                        {/* Chapter Capstone Assessment */}
                        {hasExercise && exercise && (
                          <Pressable
                            disabled={isLocked || !hasAccess}
                            onPress={() => {
                              if (!hasAccess) {
                                return;
                              }
                              if (isLocked) return;
                              haptics.light();
                              router.push({
                                pathname: '/course/[id]/chapter/[chapterId]/assessment',
                                params: { id, chapterId: chapter._id },
                              } as any);
                            }}
                            style={[s.topicItem, (isLocked || !hasAccess) && s.topicItemLocked]}
                          >
                            <View style={s.topicLeft}>
                              <View style={s.topicIconWrap}>
                                <IconAward size={16} color="#D97706" />
                              </View>
                              <Text
                                style={[
                                  s.topicItemTitle,
                                  (isLocked || !hasAccess) && { color: colors.textTertiary },
                                ]}
                                numberOfLines={1}
                              >
                                {exercise.title || 'Chapter Capstone Assessment'}
                              </Text>
                              <View style={s.capstoneTag}>
                                <Text style={s.capstoneTagText}>CAPSTONE</Text>
                              </View>
                            </View>

                            <View style={s.topicRight}>
                              {chapter.isAssessmentPassed && (
                                <IconCheck size={14} color="#10B981" />
                              )}
                              <Text style={s.topicXpText}>
                                {exercise.questions.reduce((sum, q) => sum + (q.xp || 20), 0)} XP
                              </Text>
                            </View>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PAGE },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
    contentGrid: {
      gap: spacing.md,
    },
    contentGridDesktop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xl,
    },
    overviewColumn: {
      gap: spacing.md,
    },
    overviewColumnDesktop: {
      width: 440,
    },
    structureColumn: {
      flex: 1,
    },
    structureColumnDesktop: {
      flex: 1,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },

    // Hero — the one panel that keeps its own radius/overflow, since it's a cover, not content
    heroCard: {
      borderRadius: 20,
      padding: spacing.base,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    banner: {
      width: '100%',
      height: 160,
      borderRadius: radii.lg,
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    title: {
      fontSize: fontSizes.xl,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
      marginTop: spacing.xs / 2,
    },
    priceLine: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sansBold,
      color: ACCENT,
    },
    authorsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
    },
    avatarGroup: {
      flexDirection: 'row',
    },
    authorAvatarCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFF',
      overflow: 'hidden',
    },
    authorAvatarImg: { width: '100%', height: '100%' },
    authorAvatarInitial: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.brandPrimaryHover,
    },
    authorLabel: {
      fontSize: 9,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textTertiary,
      letterSpacing: 0.5,
    },
    authorName: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    moreAuthors: {
      color: c.brandPrimaryHover,
      fontFamily: fontFamilies.sansSemiBold,
    },

    // Stats — flat strip, hairline dividers instead of three boxed tiles
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 26,
      backgroundColor: c.borderSubtle,
    },
    statIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      fontFamily: fontFamilies.sansMedium,
      color: c.textTertiary,
    },
    statValue: {
      fontSize: fontSizes.base,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
    },

    // Accordions — one flat block, hairline dividers between sections, no per-item box
    accordionGroup: {},
    accordionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    accordionTitle: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    accordionBody: {
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    bulletIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.brandPrimarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    bulletText: {
      flex: 1,
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textSecondary,
      lineHeight: fontSizes.xs * 1.5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.brandPrimary,
      marginTop: 6,
    },
    emptyPrereq: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textTertiary,
    },
    descText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textSecondary,
      lineHeight: fontSizes.xs * 1.6,
    },

    // Structure — clean cards matching reference layout
    structureSection: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: fontSizes.lg,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
    },
    chapterList: {
      gap: spacing.md,
    },
    chapterCard: {
      backgroundColor: c.surfaceCard,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.xs,
    },
    chapterLocked: {
      opacity: 0.65,
    },
    chapterTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    chapterTopLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
    },
    chapterNumBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterNumText: {
      fontSize: 11,
      fontFamily: fontFamilies.sansBold,
      color: c.textPrimary,
    },
    chapterTitle: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sansBold,
      color: c.textPrimary,
      flexShrink: 1,
    },
    chapterProgressCol: {
      alignItems: 'flex-end',
      gap: 2,
    },
    chapterProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    capstonePendingText: {
      fontSize: 10,
      fontFamily: fontFamilies.sansMedium,
      color: c.brandPrimaryHover,
    },
    progressBarTrack: {
      width: 56,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.surfaceSunken,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: c.brandPrimary,
    },
    progressPctText: {
      fontSize: 11,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textSecondary,
    },
    chapterDesc: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textSecondary,
      lineHeight: fontSizes.xs * 1.5,
      marginTop: 2,
    },
    chapterDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
      marginVertical: spacing.xs,
    },
    chapterActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    toggleDropdownText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansBold,
      color: c.brandPrimaryHover,
    },
    continueBtn: {
      backgroundColor: c.brandPrimary,
      paddingHorizontal: spacing.base,
      paddingVertical: 7,
      borderRadius: radii.md,
    },
    continueBtnText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansBold,
      color: c.brandOnPrimary,
    },
    retakeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.base,
      paddingVertical: 7,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceSunken,
    },
    retakeBtnText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    lockedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
    },
    lockedBtnText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansMedium,
      color: c.textTertiary,
    },
    topicsContainer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.xs,
      marginTop: spacing.xs,
      gap: 2,
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 7,
      paddingHorizontal: 4,
    },
    topicItemLocked: {
      opacity: 0.5,
    },
    topicLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      marginRight: spacing.sm,
    },
    topicIconWrap: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicItemTitle: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansBold,
      color: c.textPrimary,
      flexShrink: 1,
    },
    topicRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    topicLockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    topicStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    topicXpText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    topicXpTextMuted: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textTertiary,
    },
    noTopicsText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textTertiary,
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    capstoneTag: {
      backgroundColor: 'rgba(255,138,30,0.16)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radii.sm,
      marginLeft: 4,
    },
    capstoneTagText: {
      fontSize: 9,
      fontFamily: fontFamilies.sansBold,
      color: c.brandPrimaryHover,
    },
  });
}
