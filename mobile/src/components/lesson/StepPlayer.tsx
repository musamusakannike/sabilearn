import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { IconX, IconDots, IconConfetti, IconChevronLeft, IconCheck } from '@tabler/icons-react-native';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { Topic } from '@/lib/types';
import { useProgressStore } from '@/store/progress.store';
import { progressApi } from '@/lib/api';
import * as haptics from '@/lib/haptics';
import InfoStepBlock from './InfoStepBlock';
import QuizStep from './QuizStep';
import ExerciseRunner from './ExerciseRunner';
import InLessonAiTutor from './InLessonAiTutor';

export default function StepPlayer({
  topic,
  onClose,
}: {
  topic: Topic;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const steps = topic.contents || [];
  const [index, setIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY > lastScrollY.current && currentY > 40) {
      setIsScrollingDown(true);
    } else {
      setIsScrollingDown(false);
    }
    lastScrollY.current = currentY;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrollingDown(false);
    }, 400);
  };

  const { saveContentPosition, fetchTopicProgress } = useProgressStore();
  const total = steps.length;

  // Scroll to top whenever step index changes (e.g. next/prev content)
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  // Resume where the learner last left off
  useEffect(() => {
    let cancelled = false;
    fetchTopicProgress(topic._id).then((progress) => {
      if (!cancelled && progress && progress.lastContentIndex > 0 && progress.lastContentIndex < total) {
        setIndex(progress.lastContentIndex);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic._id]);

  // Save learner's position
  useEffect(() => {
    if (finished) return;
    saveContentPosition({ course: topic.course, topic: topic._id, contentIndex: index });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, topic._id, finished]);

  const step = steps[index];
  const isLastStep = index === total - 1;
  const isQuizStep = step?.type === 'quiz';
  const canAdvance = !isQuizStep || quizAnswered;

  const markTopicComplete = async () => {
    if (hasCompleted) return;
    try {
      setIsCompleting(true);
      await progressApi.completeTopic({
        courseId: topic.course,
        topicId: topic._id,
      });
      setHasCompleted(true);
      haptics.success();
    } catch (e) {
      console.error('Failed to complete topic on server:', e);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = async () => {
    haptics.light();
    if (isLastStep) {
      setFinished(true);
      await markTopicComplete();
      return;
    }
    setQuizAnswered(false);
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handlePrev = () => {
    if (index > 0) {
      haptics.light();
      setQuizAnswered(true);
      setIndex((i) => i - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const handleMenuPress = () => {
    haptics.light();
    const options = [
      { text: 'Report an issue', onPress: () => Alert.alert('Thank you', 'Your feedback has been recorded.') },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert(topic.title, 'Lesson options', options);
  };

  if (total === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View style={styles.emptyState}>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamilies.sans, fontSize: fontSizes.base }}>
            This topic has no lesson steps yet.
          </Text>
          <Pressable onPress={onClose} style={styles.orangeContinueBtn}>
            <Text style={styles.orangeContinueText}>Go back to course</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Celebration Finished Screen
  if (finished) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <IconX size={26} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.congratsWrap}>
          <View style={[styles.congratsIcon, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
            <IconConfetti size={48} color="#16A34A" />
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{topic.xp || 50} XP</Text>
          </View>

          <Text style={[styles.congratsTitle, { color: colors.textPrimary }]}>Lesson Complete!</Text>
          <Text style={[styles.congratsSub, { color: colors.textSecondary }]}>
            You&apos;ve successfully finished &ldquo;{topic.title}&rdquo;.
          </Text>

          <View style={[styles.completedPill, { backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
            <IconCheck size={16} color="#16A34A" />
            <Text style={styles.completedPillText}>Progress saved</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.orangeContinueBtn}>
            <Text style={styles.orangeContinueText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isTakeaway =
    step?.title?.trim().toLowerCase() === 'takeaway' ||
    (step?.type === 'text' && step.content.length < 120 && isLastStep && !step.title);

  const displayTitle = step?.title || topic.title;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <IconX size={26} color={colors.textPrimary} />
        </Pressable>

        {/* Segmented Pill Progress Bar */}
        <View style={styles.segmentedProgressRow}>
          {steps.map((_, i) => {
            const isActive = i === index;
            const isCompleted = i < index;
            return (
              <View
                key={i}
                style={[
                  styles.pillSegment,
                  isActive
                    ? styles.pillSegmentActive
                    : isCompleted
                    ? styles.pillSegmentCompleted
                    : [styles.pillSegmentInactive, { backgroundColor: colors.surfaceSunken || '#E2E8F0' }],
                ]}
              />
            );
          })}
        </View>

        {/* Hearts / Live counter (AI Tutor Dropdown) */}
        {step && (
          <InLessonAiTutor
            topicTitle={topic.title}
            stepTitle={displayTitle}
            stepContent={
              step.type === 'quiz' && step.quiz
                ? `Quiz Question: ${step.quiz.question}\nOptions: ${step.quiz.options?.map((o, i) => `${i + 1}. ${o.text}`).join(', ') || ''}\nExplanation: ${step.quiz.explanation || ''}`
                : step.type === 'exercise' && step.exercise
                  ? `Exercise: ${step.title || 'Practice'}\nInstructions: ${step.exercise.instructions || ''}\nStarter Code:\n${step.exercise.starterCode || ''}`
                  : step.type === 'group' && step.blocks
                    ? step.blocks.map((b) => b.content || '').join('\n\n')
                    : step.content || topic.description || ''
            }
          />
        )}
      </View>

      {/* Main Content Scroll Area */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Step Title Row with '...' button */}
        <View style={styles.titleRow}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{displayTitle}</Text>
          {/* <Pressable onPress={handleMenuPress} hitSlop={12} style={styles.dotsBtn}>
            <IconDots size={24} color={colors.textPrimary} />
          </Pressable> */}
        </View>

        {/* Content Body */}
        {isTakeaway ? (
          <View style={styles.takeawayWrap}>
            <Text style={[styles.takeawayText, { color: colors.textPrimary }]}>{step.content}</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {step.type === 'quiz' && step.quiz ? (
              <QuizStep
                key={step._id || `step-${index}`}
                quiz={step.quiz}
                onAnswered={() => setQuizAnswered(true)}
              />
            ) : step.type === 'exercise' && step.exercise ? (
              <ExerciseRunner
                key={step._id || `step-${index}`}
                exercise={step.exercise}
              />
            ) : (
              <InfoStepBlock
                key={step._id || `step-${index}`}
                content={step}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.footer, { borderTopColor: colors.borderSubtle }]}>
        {index > 0 && (
          <Pressable
            onPress={handlePrev}
            style={[styles.backBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceCard }]}
          >
            <IconChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
        )}

        <Pressable
          onPress={handleNext}
          disabled={!canAdvance || isCompleting}
          style={[
            styles.orangeContinueBtn,
            { opacity: !canAdvance || isCompleting ? 0.4 : 1 },
          ]}
        >
          <Text style={styles.orangeContinueText}>{isLastStep ? 'Finish' : 'Continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  closeBtn: {
    padding: 4,
  },
  segmentedProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    marginHorizontal: spacing.sm,
  },
  pillSegment: {
    height: 10,
    borderRadius: radii.full,
  },
  pillSegmentActive: {
    flex: 2.5,
    backgroundColor: '#22C55E',
  },
  pillSegmentCompleted: {
    flex: 1,
    backgroundColor: '#22C55E',
  },
  pillSegmentInactive: {
    flex: 1,
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },

  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: 26,
    fontFamily: fontFamilies.displaySemiBold,
    fontWeight: '800',
    flex: 1,
    lineHeight: 32,
  },
  dotsBtn: {
    padding: 4,
  },
  takeawayWrap: {
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  takeawayText: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.sansSemiBold,
    textAlign: 'center',
    lineHeight: fontSizes.xl * 1.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeContinueBtn: {
    flex: 1,
    backgroundColor: '#FF8A00',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  orangeContinueText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontSize: fontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  congratsWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  congratsIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  xpBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.base,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  xpBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '800',
  },
  congratsTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fontFamilies.displaySemiBold,
    fontWeight: '800',
  },
  congratsSub: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: fontSizes.base * 1.5,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  completedPillText: {
    color: '#16A34A',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
  },
});
