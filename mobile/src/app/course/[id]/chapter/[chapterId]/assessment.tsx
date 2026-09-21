import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  IconX,
  IconCircleCheck,
  IconCircleX,
  IconBolt,
  IconAward,
  IconArrowRight,
  IconRotateClockwise,
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react-native';
import { chapterApi, progressApi } from '@/lib/api';
import { Chapter, Exercise, Question } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import { fontFamilies, fontSizes, radii, spacing, shadows } from '@/theme';
import { ACCENT, INK, PAGE } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

interface ShuffledQuestion extends Question {
  shuffledOptions?: string[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ChapterAssessmentScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId: string }>();

  const colors = {
    textPrimary: INK,
    textSecondary: '#6B6B80',
    textTertiary: '#8E8E9F',
    brandPrimaryHover: ACCENT,
    brandOnPrimary: INK,
    brandPrimarySoft: 'rgba(255,138,30,0.16)',
    success: '#1F9D55',
    error: '#DC2626',
    surfaceSunken: '#F4F4F6',
    borderSubtle: '#E8E8EE',
    bgApp: PAGE,
    surfaceCard: '#FFFFFF',
    brandPrimary: ACCENT,
  };

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [alreadyRewarded, setAlreadyRewarded] = useState<boolean>(false);
  const startedAt = useRef<number>(Date.now());

  // Load Chapter and Exercise from API
  useEffect(() => {
    (async () => {
      try {
        if (!id || !chapterId) return;
        const [chaptersRes, assessmentRes] = await Promise.all([
          chapterApi.byCourse(id),
          chapterApi.getAssessment(chapterId).catch(() => null),
        ]);
        const chapters: Chapter[] = chaptersRes.data.data || [];
        const found = chapters.find((c) => c._id === chapterId);
        const exerciseData = assessmentRes?.data?.data;
        const ex = exerciseData?.questions && exerciseData.questions.length > 0 ? exerciseData : found?.exercise;
        if (found) {
          setChapter(found);
          if (ex && ex.questions && ex.questions.length > 0) {
            setExercise(ex);
            initRandomizedQuestions(ex);
          }
        }
      } catch (e) {
        console.error('Failed to load assessment in mobile:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, chapterId]);

  const initRandomizedQuestions = (ex: Exercise) => {
    if (!ex.questions) return;
    const randomized = ex.questions.map((q) => {
      if (q.type === 'mcq' && q.options && q.options.length > 0) {
        return {
          ...q,
          shuffledOptions: shuffleArray(q.options),
        };
      }
      return { ...q };
    });
    setQuestions(randomized);
    setCurrentIndex(0);
    setUserAnswers({});
    setCheckedSteps({});
    setFinished(false);
    startedAt.current = Date.now();
  };

  const handleClose = () => {
    haptics.light();
    router.back();
  };

  const total = questions.length;
  const currentQ = questions[currentIndex];
  const isCurrentChecked = !!checkedSteps[currentIndex];
  const currentUserAns = userAnswers[currentIndex] || '';

  const isCurrentCorrect = currentQ
    ? currentUserAns.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()
    : false;

  const handleSelectOption = (option: string) => {
    if (isCurrentChecked) return;
    haptics.selection();
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleTextChange = (val: string) => {
    if (isCurrentChecked) return;
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: val }));
  };

  const handleCheckAnswer = () => {
    if (!currentUserAns.trim()) return;
    if (isCurrentCorrect) {
      haptics.success();
    } else {
      haptics.error();
    }
    setCheckedSteps((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = async () => {
    haptics.light();
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await handleSubmitAssessment();
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      setIsSubmitting(true);
      haptics.medium();

      const answersPayload = questions.map((q, idx) => {
        const uVal = (userAnswers[idx] || '').trim().toLowerCase();
        const isCorrect = uVal === q.correctAnswer.trim().toLowerCase();
        return {
          questionId: q._id || `q_${idx}`,
          questionXp: q.xp || 20,
          isCorrect,
        };
      });

      const duration = Math.round((Date.now() - startedAt.current) / 1000);

      const res = await progressApi.submitExercise({
        courseId: id,
        chapterId,
        answers: answersPayload,
        duration,
      });

      if (res.data) {
        const data = res.data;
        setResultScore(data.scorePercent ?? 0);
        setIsPassed(!!data.isPassed);
        setEarnedXp(data.earnedXp ?? 0);
        setAlreadyRewarded(!!data.alreadyRewarded);
        setFinished(true);

        if (data.isPassed) {
          haptics.success();
        }
      }
    } catch (e) {
      console.error('Failed to submit assessment in mobile:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = makeStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyWrap}>
          <LoadingSpinner size="large" />
          <Text style={{ marginTop: 16, fontSize: 16, fontFamily: fontFamilies.sansBold, color: INK, textAlign: 'center' }}>
            Preparing capstone assessment…
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, fontFamily: fontFamilies.sans, color: '#6B6B80', textAlign: 'center' }}>
            Generating challenge questions based on chapter topics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise || total === 0) {
    return (
      <SafeAreaView style={s.container}>
        <ScreenBackdrop />
        <View style={s.emptyWrap}>
          <EmptyState
            icon={<IconAward size={48} color={colors.textTertiary} />}
            title="Assessment not found"
            description="No questions are published for this chapter."
          />
          <Pressable onPress={handleClose} style={s.continueBtn}>
            <Text style={s.continueBtnText}>Back to Course</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RESULTS / SUMMARY SCREEN
  // ==========================================
  if (finished) {
    const totalXpObtainable = questions.reduce((sum, q) => sum + (q.xp || 20), 0);
    const correctCount = questions.filter(
      (q, idx) => (userAnswers[idx] || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
    ).length;

    return (
      <SafeAreaView style={s.container}>
        <ScreenBackdrop />
        {/* Top bar */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View style={s.trophyIconWrap}>
              <IconAward size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle} numberOfLines={1}>
                Assessment Results
              </Text>
              <Text style={s.headerSub} numberOfLines={1}>
                {chapter?.title || exercise.title}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleClose} hitSlop={10} style={s.closeBtn}>
            <IconX size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.resultsScroll}>
          {/* Main Score Hero Card */}
          <View style={s.resultsHeroCard}>
            <View style={[s.bigResultIcon, isPassed ? s.bigIconPassed : s.bigIconFailed]}>
              {isPassed ? <IconSparkles size={40} color="#16A34A" /> : <IconAward size={40} color="#D97706" />}
            </View>

            <View style={[s.statusPill, isPassed ? s.statusPillPassed : s.statusPillFailed]}>
              <Text style={[s.statusPillText, isPassed ? s.statusTextPassed : s.statusTextFailed]}>
                {isPassed ? 'Assessment Passed! 🏆' : 'Keep Practicing'}
              </Text>
            </View>

            <Text style={s.scoreBigText}>{resultScore}%</Text>
            <Text style={s.scoreSubText}>
              {correctCount} of {total} questions correct
            </Text>

            {/* XP Badge / Notice */}
            <View style={s.xpNoticeBox}>
              {alreadyRewarded ? (
                <View style={s.xpRow}>
                  <IconBolt size={16} color="#D97706" />
                  <Text style={s.xpNoticeText}>Rewards already collected. (Practice Mode)</Text>
                </View>
              ) : earnedXp > 0 ? (
                <View style={s.xpRow}>
                  <IconBolt size={18} color="#D97706" />
                  <Text style={s.xpEarnedText}>+{earnedXp} XP Added to Profile!</Text>
                </View>
              ) : (
                <View style={s.xpRow}>
                  <IconAward size={16} color="#D97706" />
                  <Text style={s.xpNoticeText}>Score 50%+ to earn up to +{totalXpObtainable} XP.</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={s.resultsActionCol}>
              <Pressable onPress={handleClose} style={s.continueBtn}>
                <Text style={s.continueBtnText}>Back to Course</Text>
              </Pressable>

              <Pressable
                onPress={() => exercise && initRandomizedQuestions(exercise)}
                style={s.retakeOutlineBtn}
              >
                <IconRotateClockwise size={16} color={colors.textPrimary} />
                <Text style={s.retakeOutlineText}>Retake Assessment</Text>
              </Pressable>
            </View>
          </View>

          {/* Detailed Question Review */}
          <Text style={s.reviewHeading}>Question Breakdown</Text>
          {questions.map((q, idx) => {
            const uAns = userAnswers[idx] || '';
            const isCorrect = uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

            return (
              <View key={idx} style={[s.reviewCard, isCorrect ? s.reviewCardCorrect : s.reviewCardWrong]}>
                <View style={s.reviewHeaderRow}>
                  <View style={s.reviewNumWrap}>
                    <View style={[s.miniCheckCircle, isCorrect ? s.miniCircleCorrect : s.miniCircleWrong]}>
                      <Text style={s.miniCheckText}>{isCorrect ? '✓' : '✗'}</Text>
                    </View>
                    <Text style={s.reviewNumText}>Question {idx + 1}</Text>
                  </View>
                  <Text style={s.reviewTypeText}>
                    {q.type === 'fill_in_blank' ? 'Fill in Blank' : 'MCQ'}
                  </Text>
                </View>

                <Text style={s.reviewQuestionText}>{q.question}</Text>

                <View style={s.reviewAnswersWrap}>
                  <View style={s.reviewAnswerRow}>
                    <Text style={s.reviewAnswerLabel}>Your answer: </Text>
                    <Text style={[s.reviewAnswerVal, isCorrect ? s.valCorrect : s.valWrong]}>
                      {uAns || '(No Answer)'}
                    </Text>
                  </View>

                  {!isCorrect && (
                    <View style={s.reviewAnswerRow}>
                      <Text style={s.reviewAnswerLabel}>Correct answer: </Text>
                      <Text style={[s.reviewAnswerVal, s.valCorrect]}>{q.correctAnswer}</Text>
                    </View>
                  )}
                </View>

                {q.explanation ? (
                  <View style={s.reviewExplanationBox}>
                    <Text style={s.reviewExplanationText}>
                      <Text style={{ fontWeight: '700' }}>Why: </Text>
                      {q.explanation}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // STEP-BY-STEP QUESTION PLAYER
  // ==========================================
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
  const optionsToRender = currentQ.shuffledOptions || currentQ.options || [];

  return (
    <SafeAreaView style={s.container}>
      <ScreenBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Pressable onPress={handleClose} hitSlop={10} style={s.closeBtn}>
              <IconX size={22} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle} numberOfLines={1}>
                {exercise.title || 'Chapter Assessment'}
              </Text>
              <Text style={s.headerSub}>
                Question {currentIndex + 1} of {total}
              </Text>
            </View>
          </View>

          <View style={s.xpBadge}>
            <IconBolt size={12} color="#D97706" />
            <Text style={s.xpBadgeText}>+{currentQ.xp || 20} XP</Text>
          </View>
        </View>

        {/* Top Progress Bar */}
        <View style={s.progressBarTrack}>
          <View style={[s.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Question Area */}
        <ScrollView contentContainerStyle={s.questionScroll}>
          {/* Question Tag */}
          <View style={s.tagRow}>
            <View style={s.typePill}>
              <Text style={s.typePillText}>
                {currentQ.type === 'fill_in_blank' ? 'Fill in the Blank' : 'Multiple Choice'}
              </Text>
            </View>
            <Text style={s.stepCounterText}>
              Step {currentIndex + 1} of {total}
            </Text>
          </View>

          {/* Question Prompt */}
          <Text style={s.questionHeading}>{currentQ.question}</Text>

          {/* Options / Text Input */}
          {currentQ.type === 'mcq' ? (
            <View style={s.optionsList}>
              {optionsToRender.map((option, oIdx) => {
                const isSelected = currentUserAns === option;
                const letter = String.fromCharCode(65 + oIdx);

                let optCardStyle: StyleProp<ViewStyle> = s.optionCard;
                let optBadgeStyle: StyleProp<ViewStyle> = s.optionBadge;

                if (isSelected && !isCurrentChecked) {
                  optCardStyle = [s.optionCard, s.optionCardSelected];
                  optBadgeStyle = [s.optionBadge, s.optionBadgeSelected];
                } else if (isCurrentChecked) {
                  if (option === currentQ.correctAnswer) {
                    optCardStyle = [s.optionCard, s.optionCardCorrect];
                    optBadgeStyle = [s.optionBadge, s.optionBadgeCorrect];
                  } else if (isSelected && !isCurrentCorrect) {
                    optCardStyle = [s.optionCard, s.optionCardWrong];
                    optBadgeStyle = [s.optionBadge, s.optionBadgeWrong];
                  } else {
                    optCardStyle = [s.optionCard, s.optionCardFaded];
                  }
                }

                return (
                  <Pressable
                    key={oIdx}
                    disabled={isCurrentChecked}
                    onPress={() => handleSelectOption(option)}
                    style={optCardStyle}
                  >
                    <View style={s.optionContentRow}>
                      <View style={optBadgeStyle}>
                        <Text style={s.optionBadgeText}>{letter}</Text>
                      </View>
                      <Text style={s.optionText}>{option}</Text>
                    </View>

                    {isCurrentChecked && option === currentQ.correctAnswer && (
                      <IconCircleCheck size={20} color={colors.success} />
                    )}
                    {isCurrentChecked && isSelected && !isCurrentCorrect && (
                      <IconCircleX size={20} color={colors.error} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Type your answer:</Text>
              <TextInput
                editable={!isCurrentChecked}
                value={currentUserAns}
                onChangeText={handleTextChange}
                placeholder="e.g. tokens"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                style={[
                  s.textInput,
                  isCurrentChecked &&
                    (isCurrentCorrect ? s.textInputCorrect : s.textInputWrong),
                ]}
              />
            </View>
          )}

          {/* Feedback & Explanation Box */}
          {isCurrentChecked && (
            <View style={[s.feedbackCard, isCurrentCorrect ? s.feedbackCorrect : s.feedbackWrong]}>
              <View style={s.feedbackHeader}>
                {isCurrentCorrect ? (
                  <>
                    <IconCircleCheck size={20} color="#16A34A" />
                    <Text style={s.feedbackTitleCorrect}>Correct! Excellent job!</Text>
                  </>
                ) : (
                  <>
                    <IconCircleX size={20} color="#DC2626" />
                    <Text style={s.feedbackTitleWrong}>
                      Incorrect. Correct: {currentQ.correctAnswer}
                    </Text>
                  </>
                )}
              </View>

              {currentQ.explanation ? (
                <Text style={s.feedbackExplanation}>
                  <Text style={{ fontWeight: '700' }}>Why: </Text>
                  {currentQ.explanation}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={s.bottomActionBar}>
          {!isCurrentChecked ? (
            <Pressable
              disabled={!currentUserAns.trim()}
              onPress={handleCheckAnswer}
              style={[s.continueBtn, !currentUserAns.trim() && s.btnDisabled]}
            >
              <Text style={s.continueBtnText}>Check Answer</Text>
            </Pressable>
          ) : (
            <Pressable disabled={isSubmitting} onPress={handleNext} style={s.continueBtn}>
              <Text style={s.continueBtnText}>
                {isSubmitting
                  ? 'Submitting Assessment...'
                  : currentIndex < total - 1
                  ? 'Next Question →'
                  : 'Complete Assessment →'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PAGE },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E8E8EE',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    closeBtn: {
      padding: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: '#F4F4F6',
    },
    headerTitle: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '700',
      color: INK,
    },
    headerSub: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#6B6B80',
    },
    trophyIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    xpBadgeText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '700',
      color: '#B45309',
    },
    progressBarTrack: {
      height: 4,
      backgroundColor: '#E8E8EE',
      width: '100%',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: ACCENT,
    },
    questionScroll: {
      padding: spacing.lg,
      paddingBottom: spacing['3xl'],
      gap: spacing.md,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typePill: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.sm,
    },
    typePillText: {
      fontFamily: fontFamilies.sans,
      fontSize: 10,
      fontWeight: '800',
      color: '#92400E',
      textTransform: 'uppercase',
    },
    stepCounterText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#8E8E9F',
    },
    questionHeading: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.lg,
      fontWeight: '700',
      color: INK,
      lineHeight: 26,
    },
    optionsList: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E8E8EE',
      ...shadows.sm,
    },
    optionCardSelected: {
      borderColor: ACCENT,
      backgroundColor: 'rgba(255, 138, 30, 0.08)',
      borderWidth: 2,
    },
    optionCardCorrect: {
      borderColor: '#16A34A',
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderWidth: 2,
    },
    optionCardWrong: {
      borderColor: '#DC2626',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderWidth: 2,
    },
    optionCardFaded: {
      opacity: 0.5,
    },
    optionContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      paddingRight: spacing.xs,
    },
    optionBadge: {
      width: 28,
      height: 28,
      borderRadius: radii.md,
      backgroundColor: '#F4F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBadgeSelected: {
      backgroundColor: ACCENT,
    },
    optionBadgeCorrect: {
      backgroundColor: '#16A34A',
    },
    optionBadgeWrong: {
      backgroundColor: '#DC2626',
    },
    optionBadgeText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '800',
      color: INK,
    },
    optionText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      color: INK,
      fontWeight: '500',
      flex: 1,
    },
    inputWrap: {
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    inputLabel: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '700',
      color: '#6B6B80',
      textTransform: 'uppercase',
    },
    textInput: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E8E8EE',
      borderRadius: radii.lg,
      padding: spacing.md,
      fontSize: fontSizes.base,
      fontFamily: fontFamilies.sans,
      color: INK,
    },
    textInputCorrect: {
      borderColor: '#16A34A',
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderWidth: 2,
    },
    textInputWrong: {
      borderColor: '#DC2626',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderWidth: 2,
    },
    feedbackCard: {
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.xs,
      borderWidth: 1,
    },
    feedbackCorrect: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: '#86EFAC',
    },
    feedbackWrong: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#FCA5A5',
    },
    feedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    feedbackTitleCorrect: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '800',
      color: '#166534',
    },
    feedbackTitleWrong: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '800',
      color: '#991B1B',
    },
    feedbackExplanation: {
      marginTop: spacing.xs,
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: INK,
      lineHeight: 18,
    },
    bottomActionBar: {
      padding: spacing.md,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: '#E8E8EE',
      backgroundColor: '#FFFFFF',
    },
    continueBtn: {
      backgroundColor: ACCENT,
      borderRadius: radii.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    btnDisabled: {
      backgroundColor: '#E8E8EE',
      opacity: 0.6,
    },
    continueBtnText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '800',
      color: INK,
    },

    // Results styles
    resultsScroll: {
      padding: spacing.lg,
      paddingBottom: spacing['3xl'],
      gap: spacing.lg,
    },
    resultsHeroCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: radii['2xl'],
      borderWidth: 1,
      borderColor: '#E8E8EE',
      padding: spacing.xl,
      alignItems: 'center',
      ...shadows.md,
    },
    bigResultIcon: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    bigIconPassed: { backgroundColor: '#DCFCE7' },
    bigIconFailed: { backgroundColor: '#FEF3C7' },
    statusPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radii.full,
      marginBottom: spacing.xs,
    },
    statusPillPassed: { backgroundColor: '#DCFCE7' },
    statusPillFailed: { backgroundColor: '#FEF3C7' },
    statusPillText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusTextPassed: { color: '#15803D' },
    statusTextFailed: { color: '#B45309' },
    scoreBigText: {
      fontFamily: fontFamilies.sans,
      fontSize: 40,
      fontWeight: '900',
      color: INK,
    },
    scoreSubText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#6B6B80',
    },
    xpNoticeBox: {
      backgroundColor: '#F4F4F6',
      borderRadius: radii.lg,
      padding: spacing.sm,
      paddingHorizontal: spacing.md,
      width: '100%',
      marginTop: spacing.md,
      alignItems: 'center',
    },
    xpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    xpEarnedText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '800',
      color: '#B45309',
    },
    xpNoticeText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#6B6B80',
      fontWeight: '600',
    },
    resultsActionCol: {
      width: '100%',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    retakeOutlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: '#E8E8EE',
      borderRadius: radii.xl,
      paddingVertical: spacing.md,
    },
    retakeOutlineText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '700',
      color: INK,
    },
    reviewHeading: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.base,
      fontWeight: '800',
      color: INK,
    },
    reviewCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.xs,
    },
    reviewCardCorrect: {
      borderColor: '#86EFAC',
      backgroundColor: 'rgba(34, 197, 94, 0.04)',
    },
    reviewCardWrong: {
      borderColor: '#FCA5A5',
      backgroundColor: 'rgba(239, 68, 68, 0.04)',
    },
    reviewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reviewNumWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    miniCheckCircle: {
      width: 20,
      height: 20,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniCircleCorrect: { backgroundColor: '#16A34A' },
    miniCircleWrong: { backgroundColor: '#DC2626' },
    miniCheckText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },
    reviewNumText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '700',
      color: '#6B6B80',
      textTransform: 'uppercase',
    },
    reviewTypeText: {
      fontFamily: fontFamilies.sans,
      fontSize: 10,
      color: '#8E8E9F',
    },
    reviewQuestionText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.sm,
      fontWeight: '700',
      color: INK,
    },
    reviewAnswersWrap: {
      gap: 2,
      marginTop: 4,
    },
    reviewAnswerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewAnswerLabel: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#6B6B80',
    },
    reviewAnswerVal: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      fontWeight: '700',
    },
    valCorrect: { color: '#15803D' },
    valWrong: { color: '#DC2626' },
    reviewExplanationBox: {
      backgroundColor: '#F4F4F6',
      borderRadius: radii.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    reviewExplanationText: {
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.xs,
      color: '#4B5563',
      lineHeight: 16,
    },
  });
}
