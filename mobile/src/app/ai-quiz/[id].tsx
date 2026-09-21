import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  IconArrowLeft,
  IconBrain,
  IconCheck,
  IconX,
  IconRotateClockwise,
  IconChevronRight,
  IconChevronLeft,
  IconAward,
} from '@tabler/icons-react-native';
import { aiApi, progressApi } from '@/lib/api';
import RichMathText from '@/components/ui/RichMathText';
import { AiHistoryItem, AiQuizQuestion } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OfflineBanner from '@/components/common/OfflineBanner';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';
import * as haptics from '@/lib/haptics';

export default function MobileAIQuizAttemptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [quizItem, setQuizItem] = useState<AiHistoryItem | null>(null);
  const [questions, setQuestions] = useState<AiQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stepper state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const startedAt = useRef(Date.now());

  const s = makeStyles(colors);

  const fetchQuiz = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await aiApi.getHistoryById(id);
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setQuizItem(item);
        startedAt.current = Date.now();

        let parsedQuestions: AiQuizQuestion[] = [];
        if (Array.isArray(item.result)) {
          parsedQuestions = item.result;
        } else if (typeof item.result === 'string') {
          try {
            const clean = item.result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            parsedQuestions = JSON.parse(clean);
          } catch {
            parsedQuestions = [];
          }
        }

        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
        } else {
          setError('No questions found in this quiz.');
        }
      } else {
        setError('Quiz not found.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    haptics.selection();
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      haptics.light();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      haptics.light();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selectedOptIdx = selectedAnswers[idx];
      if (selectedOptIdx !== undefined && q.options[selectedOptIdx]?.isCorrect) {
        correctCount++;
      }
    });
    return {
      correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
    };
  };

  const handleSubmit = () => {
    haptics.success();
    setIsSubmitted(true);

    const score = calculateScore();
    const duration = Math.round((Date.now() - startedAt.current) / 1000);
    const courseId = quizItem?.metadata?.courseId || quizItem?._id;

    if (courseId && score.total > 0) {
      progressApi.submitMcqSession({
        course: courseId,
        mcqAnswered: score.total,
        mcqCorrect: score.correctCount,
        duration,
        score: score.percentage,
      }).catch(() => {});
    }
  };

  const handleRetake = () => {
    haptics.light();
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    startedAt.current = Date.now();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !quizItem || questions.length === 0) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <IconArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={s.pageTitle}>Quiz Error</Text>
        </View>
        <View style={s.errorWrap}>
          <Text style={s.errorMsg}>{error || 'Could not load quiz.'}</Text>
          <Pressable onPress={() => router.back()} style={s.retryBtn}>
            <Text style={s.retryBtnText}>Back to Quiz Hub</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const scoreInfo = calculateScore();
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === questions.length;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <OfflineBanner />

      {/* Top Header */}
      <View style={s.topBar}>
        <Pressable
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={s.backBtn}
        >
          <IconArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle} numberOfLines={1}>
            {quizItem.title || 'AI Quiz'}
          </Text>
          <Text style={s.pageSubtitle}>Topic: {quizItem.prompt || 'Custom'}</Text>
        </View>
      </View>

      {!isSubmitted ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={s.scroll} contentContainerStyle={s.content}>
            {/* Progress Header */}
            <View style={s.progressCard}>
              <View style={s.progressMetaRow}>
                <Text style={s.stepText}>
                  Question {currentIndex + 1} of {questions.length}
                </Text>
                <Text style={s.stepText}>
                  {answeredCount}/{questions.length} Answered
                </Text>
              </View>
              <ProgressBar value={progressPercent} />
            </View>

            {/* Question Box */}
            <Card>
              <Text style={s.qOverline}>Question {currentIndex + 1}</Text>
              <RichMathText text={currentQuestion.question} style={s.qTitle} color={colors.textPrimary} fontSize={fontSizes.lg} />

              {/* Options */}
              <View style={s.optionsList}>
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === oIdx;
                  const label = String.fromCharCode(65 + oIdx);

                  return (
                    <Pressable
                      key={oIdx}
                      onPress={() => handleSelectOption(currentIndex, oIdx)}
                      style={[s.optionCard, isSelected && s.optionCardSelected]}
                    >
                      <View style={[s.optionBadge, isSelected && s.optionBadgeSelected]}>
                        <Text style={[s.optionBadgeText, isSelected && s.optionBadgeTextSelected]}>
                          {label}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <RichMathText text={opt.text} style={[s.optionText, isSelected && s.optionTextSelected]} color={colors.textPrimary} fontSize={fontSizes.sm} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </ScrollView>

          {/* Stepper Footer */}
          <View style={s.footerBar}>
            <Pressable
              onPress={handlePrev}
              disabled={currentIndex === 0}
              style={[s.navBtn, currentIndex === 0 && s.navBtnDisabled]}
            >
              <IconChevronLeft size={18} color={currentIndex === 0 ? colors.textTertiary : colors.textPrimary} />
              <Text style={[s.navBtnText, currentIndex === 0 && s.navBtnTextDisabled]}>Prev</Text>
            </Pressable>

            {currentIndex < questions.length - 1 ? (
              <Pressable onPress={handleNext} style={s.primaryBtn}>
                <Text style={s.primaryBtnText}>Next</Text>
                <IconChevronRight size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSubmit}
                disabled={!isAllAnswered}
                style={[s.primaryBtn, !isAllAnswered && s.primaryBtnDisabled]}
              >
                <Text style={s.primaryBtnText}>Submit Quiz</Text>
                <IconCheck size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        /* Results & Explanations Review View */
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {/* Summary Card */}
          <View style={s.resultsCard}>
            <View style={s.awardIconWrap}>
              <IconAward size={32} color="#F2A900" />
            </View>
            <Text style={s.resultsTitle}>Quiz Finished!</Text>
            <Text style={s.resultsScoreText}>
              Your score: <Text style={s.boldText}>{scoreInfo.correctCount}</Text> /{' '}
              <Text style={s.boldText}>{scoreInfo.total}</Text> ({scoreInfo.percentage}%)
            </Text>

            <View style={s.resultsBtnRow}>
              <Pressable onPress={handleRetake} style={s.retakeBtn}>
                <IconRotateClockwise size={16} color={colors.textPrimary} />
                <Text style={s.retakeBtnText}>Retake Quiz</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={s.doneBtn}>
                <Text style={s.doneBtnText}>Back to Quiz Hub</Text>
              </Pressable>
            </View>
          </View>

          {/* Detailed Explanations */}
          <Text style={s.explanationsHeading}>Answer Breakdown & Explanations</Text>

          {questions.map((q, qIdx) => {
            const selectedOptIdx = selectedAnswers[qIdx];
            const correctOptIdx = q.options.findIndex((o) => o.isCorrect);
            const isCorrect = selectedOptIdx === correctOptIdx;

            return (
              <Card key={qIdx}>
                <View style={s.reviewTopRow}>
                  <Text style={s.reviewQNum}>Question {qIdx + 1}</Text>
                  {isCorrect ? (
                    <Badge variant="beginner">Correct</Badge>
                  ) : (
                    <Badge variant="advanced">Incorrect</Badge>
                  )}
                </View>

                <Text style={s.reviewQText}>{q.question}</Text>

                <View style={s.reviewOptionsList}>
                  {q.options.map((opt, oIdx) => {
                    const isOptionSelected = selectedOptIdx === oIdx;
                    const isOptionCorrect = opt.isCorrect;

                    let cardStyle: any = s.reviewOptCard;
                    if (isOptionCorrect) cardStyle = [s.reviewOptCard, s.reviewOptCorrect];
                    else if (isOptionSelected && !isOptionCorrect) cardStyle = [s.reviewOptCard, s.reviewOptIncorrect];

                    return (
                      <View key={oIdx} style={cardStyle}>
                        <Text style={s.reviewOptText}>{String.fromCharCode(65 + oIdx)}. {opt.text}</Text>
                        {isOptionCorrect && <IconCheck size={16} color={colors.success} />}
                        {isOptionSelected && !isOptionCorrect && <IconX size={16} color={colors.danger} />}
                      </View>
                    );
                  })}
                </View>

                {q.explanation && (
                  <View style={s.explanationBox}>
                    <Text style={s.explanationHeading}>💡 Explanation:</Text>
                    <Text style={s.explanationText}>{q.explanation}</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgApp },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    pageTitle: { fontSize: fontSizes.base, fontFamily: fontFamilies.displaySemiBold, color: c.textPrimary },
    pageSubtitle: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: c.textSecondary },
    scroll: { flex: 1 },
    content: { padding: spacing.xl, gap: spacing.lg },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    errorMsg: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sans, color: c.danger, textAlign: 'center' },
    retryBtn: {
      backgroundColor: c.brandPrimary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
    },
    retryBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansSemiBold, color: '#FFFFFF' },
    progressCard: { gap: spacing.xs, backgroundColor: c.surface, padding: spacing.md, borderRadius: radii.lg },
    progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stepText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: c.textSecondary },
    qOverline: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansSemiBold, color: '#5B4FE8', textTransform: 'uppercase', marginBottom: spacing.xs },
    qTitle: { fontSize: fontSizes.lg, fontFamily: fontFamilies.sansSemiBold, color: c.textPrimary, marginBottom: spacing.lg, lineHeight: 26 },
    optionsList: { gap: spacing.md },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.base,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      gap: spacing.md,
    },
    optionCardSelected: {
      backgroundColor: 'rgba(91,79,232,0.1)',
      borderColor: '#5B4FE8',
    },
    optionBadge: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: c.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBadgeSelected: { backgroundColor: '#5B4FE8' },
    optionBadgeText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansBold, color: c.textPrimary },
    optionBadgeTextSelected: { color: '#FFFFFF' },
    optionText: { flex: 1, fontSize: fontSizes.sm, fontFamily: fontFamilies.sans, color: c.textPrimary },
    optionTextSelected: { fontFamily: fontFamilies.sansSemiBold, color: '#5B4FE8' },
    footerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansMedium, color: c.textPrimary },
    navBtnTextDisabled: { color: c.textTertiary },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: '#5B4FE8',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansSemiBold, color: '#FFFFFF' },
    resultsCard: {
      backgroundColor: c.surface,
      borderRadius: radii['2xl'],
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    awardIconWrap: {
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: 'rgba(242,169,0,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultsTitle: { fontSize: fontSizes.xl, fontFamily: fontFamilies.displayBold, color: c.textPrimary },
    resultsScoreText: { fontSize: fontSizes.base, fontFamily: fontFamilies.sans, color: c.textSecondary },
    boldText: { fontFamily: fontFamilies.sansBold, color: c.textPrimary },
    resultsBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
    retakeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      backgroundColor: c.bgApp,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    retakeBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansMedium, color: c.textPrimary },
    doneBtn: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      backgroundColor: '#5B4FE8',
    },
    doneBtnText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansSemiBold, color: '#FFFFFF' },
    explanationsHeading: { fontSize: fontSizes.lg, fontFamily: fontFamilies.sansSemiBold, color: c.textPrimary, marginTop: spacing.md },
    reviewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    reviewQNum: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: c.textSecondary },
    reviewQText: { fontSize: fontSizes.base, fontFamily: fontFamilies.sansSemiBold, color: c.textPrimary, marginBottom: spacing.md },
    reviewOptionsList: { gap: spacing.xs, marginBottom: spacing.md },
    reviewOptCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.bgApp,
    },
    reviewOptCorrect: { backgroundColor: 'rgba(31,157,85,0.1)', borderColor: c.success },
    reviewOptIncorrect: { backgroundColor: 'rgba(229,72,77,0.1)', borderColor: c.danger },
    reviewOptText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sans, color: c.textPrimary, flex: 1 },
    explanationBox: {
      backgroundColor: 'rgba(91,79,232,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(91,79,232,0.2)',
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    explanationHeading: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansBold, color: '#5B4FE8' },
    explanationText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: c.textPrimary, lineHeight: 18 },
  });
}
