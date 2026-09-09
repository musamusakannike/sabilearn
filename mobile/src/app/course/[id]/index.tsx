import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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
} from '@tabler/icons-react-native';
import { courseApi, chapterApi, progressApi, paymentApi } from '@/lib/api';
import { Course, Chapter, Topic, PaymentStatus, Exercise } from '@/lib/types';
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
import * as haptics from '@/lib/haptics';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
    try {
      const [courseRes, chaptersRes, paymentRes] = await Promise.all([
        courseApi.get(id),
        chapterApi.byCourse(id),
        paymentApi.me().catch(() => ({ data: { data: null } })),
      ]);

      setCourse(courseRes.data.data);
      const fetchedChapters: Chapter[] = chaptersRes.data.data || [];
      setChapters(fetchedChapters);
      setPaymentStatus(paymentRes.data.data);

      // Default expand chapter 1
      if (fetchedChapters.length > 0) {
        setOpenChapters((prev) => ({ ...prev, [fetchedChapters[0]._id]: true }));
      }
    } catch (e) {
      console.error('Failed to load course details:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return (
    <View collapsable={false} style={s.container}>
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        <View style={s.navRow}>
          <GlassIconButton onPress={() => router.back()} accessibilityLabel="Back to courses">
            <IconArrowLeft size={22} color={INK} />
          </GlassIconButton>
          <GlassIconButton onPress={handleShare} accessibilityLabel="Share course">
            <IconShare size={18} color={INK} />
          </GlassIconButton>
        </View>

        <GlassSurface style={s.heroCard} tintColor={TINT_GLASS}>
          {course.banner ? (
            <Image source={{ uri: course.banner }} style={s.banner} resizeMode="cover" />
          ) : null}

          {/* Badges */}
          <View style={s.badgeRow}>
            <Badge>{course.category}</Badge>
            <Badge variant={course.difficulty}>{course.difficulty}</Badge>
            {!course.isFree && (
              <Badge variant={hasAccess ? 'success' : 'default'}>
                {hasAccess ? 'Unlocked' : 'Premium'}
              </Badge>
            )}
          </View>

          {/* Title */}
          <Text style={s.title}>{course.title}</Text>
          {!course.isFree ? (
            <Text style={s.priceLine}>
              {hasAccess ? 'Included in your access' : 'Included with Premium'}
            </Text>
          ) : (
            <Text style={s.priceLine}>Free</Text>
          )}

          {/* Authors */}
          {authors.length > 0 && (
            <View style={s.authorsRow}>
              <View style={s.avatarGroup}>
                {authors.slice(0, expandedAuthors ? authors.length : 3).map((author, aIdx) => (
                  <View key={aIdx} style={[s.authorAvatarCircle, { backgroundColor: colors.brandPrimarySoft }]}>
                    {author.avatar ? (
                      <Image source={{ uri: author.avatar }} style={s.authorAvatarImg} />
                    ) : (
                      <Text style={s.authorAvatarInitial}>
                        {author.name.charAt(0).toUpperCase()}
                      </Text>
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
                        <Text
                          onPress={() => setExpandedAuthors(!expandedAuthors)}
                          style={s.moreAuthors}
                        >
                          {' '}+{authors.length - 1} more
                        </Text>
                      )}
                    </>
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Stats Row */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <View style={s.statIconRow}>
                <IconBook size={14} color={colors.brandPrimaryHover} />
                <Text style={s.statLabel}>Lessons</Text>
              </View>
              <Text style={s.statValue}>{course.lessonCount || 0}</Text>
            </View>

            <View style={s.statBox}>
              <View style={s.statIconRow}>
                <IconUsers size={14} color={colors.brandPrimaryHover} />
                <Text style={s.statLabel}>Learners</Text>
              </View>
              <Text style={s.statValue}>{course.registeredUsersCount || 0}</Text>
            </View>

            <View style={s.statBox}>
              <View style={s.statIconRow}>
                <IconBolt size={14} color="#F59E0B" />
                <Text style={s.statLabel}>Total XP</Text>
              </View>
              <Text style={[s.statValue, { color: '#D97706' }]}>
                +{course.totalObtainableXp || 0}
              </Text>
            </View>
          </View>
        </GlassSurface>

        {!hasAccess && !course.isFree && (
          <CoursePaywall course={course} paymentStatus={paymentStatus} onUnlocked={() => void loadData()} />
        )}

        {/* 3 Collapsible Accordions */}
        <View style={s.accordionGroup}>
          {/* What you'll learn */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <View style={s.accordionCard}>
              <Pressable
                onPress={() => toggleAccordion('learn')}
                style={s.accordionHeader}
              >
                <Text style={s.accordionTitle}>What you&apos;ll learn</Text>
                {accordionState.learn ? (
                  <IconChevronUp size={18} color={colors.textTertiary} />
                ) : (
                  <IconChevronDown size={18} color={colors.textTertiary} />
                )}
              </Pressable>
              {accordionState.learn && (
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
              )}
            </View>
          )}

          {/* Prerequisites */}
          <View style={s.accordionCard}>
            <Pressable
              onPress={() => toggleAccordion('prerequisites')}
              style={s.accordionHeader}
            >
              <Text style={s.accordionTitle}>Prerequisites</Text>
              {accordionState.prerequisites ? (
                <IconChevronUp size={18} color={colors.textTertiary} />
              ) : (
                <IconChevronDown size={18} color={colors.textTertiary} />
              )}
            </Pressable>
            {accordionState.prerequisites && (
              <View style={s.accordionBody}>
                {course.prerequisites && course.prerequisites.length > 0 ? (
                  course.prerequisites.map((prereq, idx) => (
                    <View key={idx} style={s.bulletRow}>
                      <View style={s.dot} />
                      <Text style={s.bulletText}>{prereq}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.emptyPrereq}>
                    No prior prerequisites required. Perfect for beginners!
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={s.accordionCard}>
            <Pressable
              onPress={() => toggleAccordion('description')}
              style={s.accordionHeader}
            >
              <Text style={s.accordionTitle}>Description</Text>
              {accordionState.description ? (
                <IconChevronUp size={18} color={colors.textTertiary} />
              ) : (
                <IconChevronDown size={18} color={colors.textTertiary} />
              )}
            </Pressable>
            {accordionState.description && (
              <View style={s.accordionBody}>
                <Text style={s.descText}>
                  {course.longDescription || course.description}
                </Text>
              </View>
            )}
          </View>
        </View>

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

                return (
                  <View
                    key={chapter._id}
                    style={[
                      s.chapterCard,
                      isLocked && s.chapterLocked,
                    ]}
                  >
                    {/* Chapter Header */}
                    <View style={s.chapterTop}>
                      <View style={{ flex: 1 }}>
                        <View style={s.chapterBadgeRow}>
                          <Text style={s.chapterOverline}>Chapter {cIdx + 1}</Text>
                          <Badge
                            variant={isCompleted ? 'success' : isLocked ? 'default' : 'intermediate'}
                          >
                            {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'In Progress'}
                          </Badge>
                        </View>
                        <Text style={s.chapterTitle}>{chapter.title}</Text>
                        {chapter.description ? (
                          <Text style={s.chapterDesc} numberOfLines={1}>
                            {chapter.description}
                          </Text>
                        ) : null}

                        {isInProgress && (
                          <View style={{ marginTop: spacing.xs }}>
                            <ProgressBar value={chapter.progressPercent || 0} />
                          </View>
                        )}
                      </View>

                      {/* Dropdown toggle */}
                      <Pressable
                        onPress={() => toggleChapterDropdown(chapter._id)}
                        style={s.chevronBtn}
                        hitSlop={10}
                      >
                        {isOpen ? (
                          <IconChevronUp size={20} color={colors.textSecondary} />
                        ) : (
                          <IconChevronDown size={20} color={colors.textSecondary} />
                        )}
                      </Pressable>
                    </View>

                    {/* Chapter Action Button */}
                    <View style={s.chapterActionRow}>
                      {isLocked ? (
                        <View style={s.lockedBtn}>
                          <IconLock size={14} color={colors.textTertiary} />
                          <Text style={s.lockedBtnText}>Locked</Text>
                        </View>
                      ) : isCompleted ? (
                        <Pressable
                          onPress={() => {
                            if (chapter.topics && chapter.topics.length > 0) {
                              handleOpenTopic(chapter, chapter.topics[0]);
                            }
                          }}
                          style={s.retakeBtn}
                        >
                          <IconPlayerPlay size={14} color={colors.brandPrimaryHover} />
                          <Text style={s.retakeBtnText}>Retake Chapter</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            const firstUnlocked = (chapter.topics || []).find((t) => t.isUnlocked);
                            if (firstUnlocked) {
                              handleOpenTopic(chapter, firstUnlocked);
                            }
                          }}
                          style={s.continueBtn}
                        >
                          <IconPlayerPlay size={14} color={colors.brandOnPrimary} />
                          <Text style={s.continueBtnText}>Continue Chapter</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Topics Dropdown List */}
                    {isOpen && chapter.topics && chapter.topics.length > 0 && (
                      <View style={s.topicsContainer}>
                        {chapter.topics.map((topic, tIdx) => {
                          const tUnlocked = !!topic.isUnlocked;
                          const tCompleted = !!topic.isCompleted;

                          return (
                            <Pressable
                              key={topic._id}
                              disabled={!tUnlocked}
                              onPress={() => handleOpenTopic(chapter, topic)}
                              style={[
                                s.topicItem,
                                !tUnlocked && s.topicItemLocked,
                              ]}
                            >
                              <View style={s.topicLeft}>
                                <View
                                  style={[
                                    s.topicNumCircle,
                                    tCompleted
                                      ? s.topicNumCompleted
                                      : tUnlocked
                                      ? s.topicNumUnlocked
                                      : s.topicNumLocked,
                                  ]}
                                >
                                  {tCompleted ? (
                                    <IconCheck size={12} color="#059669" />
                                  ) : (
                                    <Text
                                      style={[
                                        s.topicNumText,
                                        tUnlocked && { color: colors.brandPrimaryHover },
                                      ]}
                                    >
                                      {tIdx + 1}
                                    </Text>
                                  )}
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      s.topicItemTitle,
                                      !tUnlocked && { color: colors.textTertiary },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {topic.title}
                                  </Text>
                                  {topic.description ? (
                                    <Text style={s.topicItemDesc} numberOfLines={1}>
                                      {topic.description}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>

                              <View style={s.topicRight}>
                                <View style={s.topicXpBadge}>
                                  <IconBolt size={10} color="#F59E0B" />
                                  <Text style={s.topicXpText}>+{topic.xp || 50} XP</Text>
                                </View>

                                {!tUnlocked ? (
                                  <IconLock size={14} color={colors.textTertiary} />
                                ) : tCompleted ? (
                                  <IconCircleCheck size={16} color={colors.success} />
                                ) : (
                                  <Text style={s.startText}>Start →</Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}

                        {/* Chapter Capstone Assessment */}
                        {chapter.exercise && chapter.exercise.questions && chapter.exercise.questions.length > 0 && (
                          <Pressable
                            disabled={isLocked || !hasAccess}
                            onPress={() => {
                              haptics.light();
                              router.push({
                                pathname: '/course/[id]/chapter/[chapterId]/assessment',
                                params: { id, chapterId: chapter._id },
                              } as any);
                            }}
                            style={[
                              s.topicItem,
                              {
                                borderColor: '#FDE68A',
                                backgroundColor: 'rgba(254, 243, 199, 0.45)',
                              },
                              (isLocked || !hasAccess) && s.topicItemLocked,
                            ]}
                          >
                            <View style={s.topicLeft}>
                              <View
                                style={[
                                  s.topicNumCircle,
                                  { backgroundColor: '#FEF3C7' },
                                ]}
                              >
                                <IconAward size={16} color="#D97706" />
                              </View>

                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text
                                    style={[
                                      s.topicItemTitle,
                                      { fontWeight: '700' },
                                      (isLocked || !hasAccess) && { color: colors.textTertiary },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {chapter.exercise.title || 'Chapter Capstone Assessment'}
                                  </Text>
                                </View>
                                <Text style={s.topicItemDesc} numberOfLines={1}>
                                  {chapter.exercise.questions.length} questions • Test your chapter mastery
                                </Text>
                              </View>
                            </View>

                            <View style={s.topicRight}>
                              <View style={s.topicXpBadge}>
                                <IconBolt size={10} color="#F59E0B" />
                                <Text style={s.topicXpText}>
                                  +{chapter.exercise.questions.reduce((sum, q) => sum + (q.xp || 20), 0)} XP
                                </Text>
                              </View>

                              {isLocked || !hasAccess ? (
                                <IconLock size={14} color={colors.textTertiary} />
                              ) : (
                                <Text style={[s.startText, { color: '#B45309' }]}>Take Assessment →</Text>
                              )}
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
      </ScrollView>
    </View>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PAGE },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    backText: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sansMedium,
      color: c.textSecondary,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.surfaceSunken,
      paddingHorizontal: spacing.base,
      paddingVertical: 6,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    shareText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
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
      borderTopWidth: 1,
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
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
    },
    statBox: {
      flex: 1,
      backgroundColor: c.surfaceSunken,
      borderRadius: radii.md,
      padding: spacing.sm,
      alignItems: 'center',
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

    // Accordions
    accordionGroup: {
      gap: spacing.xs,
    },
    accordionCard: {
      backgroundColor: 'rgba(255,255,255,0.72)',
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: '#E8E8EE',
      overflow: 'hidden',
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    accordionTitle: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    accordionBody: {
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      padding: spacing.base,
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

    // Structure
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
      backgroundColor: 'rgba(255,255,255,0.72)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: '#E8E8EE',
      padding: spacing.base,
      gap: spacing.sm,
    },
    chapterLocked: {
      opacity: 0.7,
    },
    chapterTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    chapterBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    chapterOverline: {
      fontSize: 10,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.brandPrimaryHover,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chapterTitle: {
      fontSize: fontSizes.base,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    chapterDesc: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textTertiary,
      marginTop: 2,
    },
    chevronBtn: {
      padding: spacing.xs,
      borderRadius: radii.full,
    },
    chapterActionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.xs / 2,
    },
    continueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.brandPrimary,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
      borderRadius: radii.md,
    },
    continueBtnText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.brandOnPrimary,
    },
    retakeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.surfaceSunken,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
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
      backgroundColor: c.surfaceSunken,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.md,
    },
    lockedBtnText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansMedium,
      color: c.textTertiary,
    },

    // Topics list
    topicsContainer: {
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surfaceSunken,
      borderRadius: radii.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    topicItemLocked: {
      opacity: 0.6,
    },
    topicLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      marginRight: spacing.sm,
    },
    topicNumCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicNumUnlocked: {
      backgroundColor: c.brandPrimarySoft,
    },
    topicNumCompleted: {
      backgroundColor: '#D1FAE5',
    },
    topicNumLocked: {
      backgroundColor: c.borderDefault,
    },
    topicNumText: {
      fontSize: 10,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textTertiary,
    },
    topicItemTitle: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    topicItemDesc: {
      fontSize: 10,
      fontFamily: fontFamilies.sans,
      color: c.textTertiary,
    },
    topicRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    topicXpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: '#FDE68A',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radii.full,
    },
    topicXpText: {
      fontSize: 9,
      fontFamily: fontFamilies.sansSemiBold,
      color: '#D97706',
    },
    startText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.brandPrimaryHover,
    },
  });
}
