import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, HelpCircle, CheckCircle, XCircle, Trophy } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { typography, spacing, fontSize, radius } from '@/constants/theme';

interface Question {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-the-blank';
  options?: string[];
  answer: string;
  explanation: string;
}

interface Quiz {
  _id: string;
  topic: string;
  title?: string;
  questions: Question[];
  createdAt: string;
}

type FeedbackMode = 'traditional' | 'immediate';

export default function QuizDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { c } = useTheme();
  const toast = useToast();

  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode | null>('immediate');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const res = await api.get(`/api/ai/quiz?id=${id}`);
      return res.data?.quiz;
    },
    enabled: !!id,
  });

  const questions = quiz?.questions ?? [];
  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent = !!answers[currentIndex];

  const handleSelect = (optVal: string) => {
    if (feedbackMode === 'immediate' && hasAnsweredCurrent) return;

    setSelected(optVal);
    setAnswers((prev) => ({ ...prev, [currentIndex]: optVal }));

    const isCorrect = optVal.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();
    if (isCorrect) {
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const handleFillBlankSubmit = () => {
    if (feedbackMode === 'immediate' && hasAnsweredCurrent) return;
    if (!fillBlankInput.trim()) return;

    const val = fillBlankInput.trim();
    setAnswers((prev) => ({ ...prev, [currentIndex]: val }));

    const isCorrect = val.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();
    if (isCorrect) {
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const handleNext = () => {
    // Save fill-in-the-blank text if not already saved
    if (currentQ?.type === 'fill-in-the-blank' && !answers[currentIndex] && fillBlankInput.trim()) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: fillBlankInput.trim() }));
    }

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextAns = answers[nextIdx] ?? '';
      setSelected(nextAns || null);
      setFillBlankInput(nextAns);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    // Save fill-in-the-blank text if typed
    if (currentQ?.type === 'fill-in-the-blank' && fillBlankInput.trim()) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: fillBlankInput.trim() }));
    }

    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevAns = answers[prevIdx] ?? '';
      setSelected(prevAns || null);
      setFillBlankInput(prevAns);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers({});
    setFillBlankInput('');
    setShowResult(false);
    setShowModeSelector(false);
    setFeedbackMode('immediate');
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach((q, i) => {
      const ans = answers[i];
      if (ans && ans.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        correct++;
      }
    });

    setSubmitting(true);
    try {
      await api.put('/api/ai/quiz', {
        quizId: id,
        score: correct,
        total: questions.length,
      });
    } catch (err) {
      console.warn('Failed to save quiz attempt:', err);
    } finally {
      setSubmitting(false);
      setShowResult(true);
    }
  };

  const correctCount = Object.entries(answers).filter(([idx, ans]) => {
    const q = questions[parseInt(idx, 10)];
    return q && ans.toLowerCase().trim() === q.answer.toLowerCase().trim();
  }).length;

  const scorePercent = questions.length > 0
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const scoreColor =
    scorePercent >= 80 ? c.success :
    scorePercent >= 50 ? c.warning :
    c.danger;

  if (showModeSelector) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bgPrimary }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
          <Pressable
            onPress={() => { haptics.light(); router.back(); }}
            style={[styles.backBtn, { backgroundColor: c.bgSecondary }]}
          >
            <ChevronLeft size={20} color={c.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.textPrimary, fontFamily: typography.display.semiBold }]}>
            {quiz?.title ?? quiz?.topic ?? 'Quiz'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : !quiz || questions.length === 0 ? (
          <View style={styles.loadingState}>
            <Text style={[{ color: c.textMuted, fontFamily: typography.body.regular, fontSize: fontSize.sm }]}>
              No questions found.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.modeSelectorContent} showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <Trophy size={48} color={c.accent} strokeWidth={1.5} />
              <Text style={[styles.modeSelectorTitleText, { color: c.textPrimary, fontFamily: typography.display.bold, marginTop: spacing.md }]}>
                Choose Quiz Mode
              </Text>
              <Text style={[styles.modeSelectorSubtitle, { color: c.textSecondary, fontFamily: typography.body.regular, marginTop: spacing.xs }]}>
                {questions.length} questions • Select how you want to learn
              </Text>
            </View>

            <View style={styles.modeCardsContainer}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setFeedbackMode('traditional');
                  setShowModeSelector(false);
                }}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: c.bgSecondary,
                    borderColor: c.border,
                    opacity: pressed ? 0.9 : 1,
                  }
                ]}
              >
                <View style={[styles.modeIconContainer, { backgroundColor: `${c.accent}15` }]}>
                  <HelpCircle size={24} color={c.accent} />
                </View>
                <Text style={[styles.modeCardTitle, { color: c.textPrimary, fontFamily: typography.display.bold }]}>
                  Review at the End
                </Text>
                <Text style={[styles.modeCardDesc, { color: c.textSecondary, fontFamily: typography.body.regular }]}>
                  Answer all questions first, then see your score and review all corrections together.
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.light();
                  setFeedbackMode('immediate');
                  setShowModeSelector(false);
                }}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: c.bgSecondary,
                    borderColor: c.border,
                    opacity: pressed ? 0.9 : 1,
                  }
                ]}
              >
                <View style={[styles.modeIconContainer, { backgroundColor: `${c.success}15` }]}>
                  <CheckCircle size={24} color={c.success} />
                </View>
                <Text style={[styles.modeCardTitle, { color: c.textPrimary, fontFamily: typography.display.bold }]}>
                  Instant Feedback
                </Text>
                <Text style={[styles.modeCardDesc, { color: c.textSecondary, fontFamily: typography.body.regular }]}>
                  See if you're right immediately with color highlights and explanations after each answer.
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  if (showResult) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bgPrimary }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
          <Pressable
            onPress={() => { haptics.light(); router.back(); }}
            style={[styles.backBtn, { backgroundColor: c.bgSecondary }]}
          >
            <ChevronLeft size={20} color={c.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.textPrimary, fontFamily: typography.display.semiBold }]}>
            Results
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultHero}>
            <View style={[styles.trophyWrap, { backgroundColor: `${scoreColor}22` }]}>
              <Trophy size={36} color={scoreColor} strokeWidth={1.5} />
            </View>
            <Text style={[styles.resultScore, { color: scoreColor, fontFamily: typography.display.extraBold }]}>
              {scorePercent}%
            </Text>
            <Text style={[styles.resultLabel, { color: c.textPrimary, fontFamily: typography.display.bold }]}>
              {scorePercent >= 80 ? 'Excellent work!' : scorePercent >= 50 ? 'Good effort!' : 'Keep practicing!'}
            </Text>
            <Text style={[styles.resultSub, { color: c.textMuted, fontFamily: typography.body.regular }]}>
              {correctCount} of {questions.length} correct
            </Text>
          </Animated.View>

          {/* Per-question review */}
          <View style={styles.reviewList}>
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const correct = userAns && userAns.toLowerCase().trim() === q.answer.toLowerCase().trim();
              return (
                <Animated.View
                  key={idx}
                  entering={FadeInDown.delay(idx * 40).duration(300)}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: c.bgSecondary,
                      borderColor: correct ? `${c.success}44` : `${c.danger}44`,
                    },
                  ]}
                >
                  <View style={styles.reviewRow}>
                    {correct
                      ? <CheckCircle size={16} color={c.success} strokeWidth={2} />
                      : <XCircle size={16} color={c.danger} strokeWidth={2} />
                    }
                    <Text
                      style={[styles.reviewQ, { color: c.textPrimary, fontFamily: typography.body.medium }]}
                      numberOfLines={3}
                    >
                      {q.question}
                    </Text>
                  </View>
                  {!correct && userAns ? (
                    <Text style={[styles.reviewAns, { color: c.danger, fontFamily: typography.body.regular }]}>
                      Your answer: {userAns}
                    </Text>
                  ) : null}
                  <Text style={[styles.reviewAns, { color: c.success, fontFamily: typography.body.regular }]}>
                    Correct: {q.answer}
                  </Text>
                  {q.explanation ? (
                    <Text style={[styles.reviewAns, { color: c.textSecondary, fontFamily: typography.body.regular, marginTop: 4, marginLeft: 24 }]}>
                      {q.explanation}
                    </Text>
                  ) : null}
                </Animated.View>
              );
            })}
          </View>

          <Button onPress={handleRestart} fullWidth>
            Retake Quiz
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const options = currentQ?.options ?? (currentQ?.type === 'true-false' ? ['True', 'False'] : []);
  const isMultipleOrTF = currentQ?.type === 'multiple-choice' || currentQ?.type === 'true-false';
  const isAnswered = !!answers[currentIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <Pressable
          onPress={() => { haptics.light(); router.back(); }}
          style={[styles.backBtn, { backgroundColor: c.bgSecondary }]}
        >
          <ChevronLeft size={20} color={c.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={[styles.headerTitleText, { color: c.textPrimary, fontFamily: typography.display.semiBold }]}
            numberOfLines={1}
          >
            {quiz?.title ?? quiz?.topic ?? 'Quiz'}
          </Text>
          <Text style={{ fontSize: fontSize['2xs'], color: c.accent, fontFamily: typography.body.medium, marginTop: 2 }}>
            {feedbackMode === 'immediate' ? 'Instant Feedback' : 'Review at End'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: c.bgTertiary }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: c.accent,
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: c.textMuted, fontFamily: typography.body.regular }]}>
              {currentIndex + 1}/{questions.length}
            </Text>
          </View>

          {/* Question */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.questionCard, { backgroundColor: c.bgSecondary, borderColor: c.borderSubtle }]}
          >
            <View style={[styles.questionIcon, { backgroundColor: c.accentMuted }]}>
              <HelpCircle size={16} color={c.accent} strokeWidth={2} />
            </View>
            <Text
              style={[styles.questionText, { color: c.textPrimary, fontFamily: typography.display.semiBold }]}
            >
              {currentQ?.question}
            </Text>
          </Animated.View>

          {/* Options (Multiple Choice / True-False) */}
          {isMultipleOrTF && (
            <View style={styles.options}>
              {options.map((opt, optIndex) => {
                const label = String.fromCharCode(65 + optIndex);
                const isSelected = selected === opt || answers[currentIndex] === opt;
                const isCorrectAnswer = currentQ.answer === opt;

                let borderColor: string = c.border;
                let bg: string = c.bgSecondary;
                let textColor: string = c.textPrimary;
                let labelBg: string = `${c.border}33`;
                let labelColor: string = c.textSecondary;

                if (feedbackMode === 'immediate' && isAnswered) {
                  if (isCorrectAnswer) {
                    borderColor = c.success;
                    bg = `${c.success}18`;
                    textColor = c.success;
                    labelBg = `${c.success}33`;
                    labelColor = c.success;
                  } else if (isSelected && !isCorrectAnswer) {
                    borderColor = c.danger;
                    bg = `${c.danger}18`;
                    textColor = c.danger;
                    labelBg = `${c.danger}33`;
                    labelColor = c.danger;
                  }
                } else {
                  if (isSelected) {
                    borderColor = c.accent;
                    bg = c.accentMuted;
                    textColor = c.accent;
                    labelBg = `${c.accent}33`;
                    labelColor = c.accent;
                  }
                }

                return (
                  <Pressable
                    key={opt}
                    onPress={() => handleSelect(opt)}
                    disabled={feedbackMode === 'immediate' && isAnswered}
                    style={({ pressed }) => [
                      styles.optionBtn,
                      {
                        backgroundColor: bg,
                        borderColor,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.optionLabel, { backgroundColor: labelBg }]}>
                      <Text style={[styles.optionLabelText, { color: labelColor, fontFamily: typography.display.bold }]}>
                        {label}
                      </Text>
                    </View>
                    <Text
                      style={[styles.optionText, { color: textColor, fontFamily: typography.body.medium }]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Fill-in-the-blank Option */}
          {currentQ?.type === 'fill-in-the-blank' && (
            <View style={styles.fillBlankContainer}>
              <View style={styles.fillBlankRow}>
                <TextInput
                  value={feedbackMode === 'immediate' && isAnswered ? answers[currentIndex] : fillBlankInput}
                  onChangeText={setFillBlankInput}
                  editable={!(feedbackMode === 'immediate' && isAnswered)}
                  placeholder="Type your answer..."
                  placeholderTextColor={c.textMuted}
                  style={[
                    styles.fillInput,
                    {
                      color: c.textPrimary,
                      backgroundColor: c.bgSecondary,
                      borderColor: feedbackMode === 'immediate' && isAnswered
                        ? (answers[currentIndex]?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? c.success : c.danger)
                        : c.border,
                      fontFamily: typography.body.medium,
                    }
                  ]}
                />
                {feedbackMode === 'immediate' && !isAnswered && (
                  <Button
                    onPress={handleFillBlankSubmit}
                    disabled={!fillBlankInput.trim()}
                    style={styles.checkBtn}
                  >
                    Check
                  </Button>
                )}
              </View>

              {/* Immediate feedback explanation / correctness */}
              {feedbackMode === 'immediate' && isAnswered && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={[
                    styles.explanation,
                    {
                      backgroundColor: c.bgElevated,
                      borderColor: answers[currentIndex]?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? c.success : c.danger,
                      marginTop: spacing.md,
                    }
                  ]}
                >
                  <View style={styles.feedbackCorrectRow}>
                    {answers[currentIndex]?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? (
                      <>
                        <CheckCircle size={18} color={c.success} />
                        <Text style={[styles.expLabel, { color: c.success, fontFamily: typography.body.bold, marginLeft: spacing.xs }]}>Correct!</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} color={c.danger} />
                        <Text style={[styles.expLabel, { color: c.danger, fontFamily: typography.body.bold, marginLeft: spacing.xs }]}>Incorrect</Text>
                      </>
                    )}
                  </View>
                  {answers[currentIndex]?.toLowerCase().trim() !== currentQ.answer.toLowerCase().trim() && (
                    <Text style={[styles.expText, { color: c.textPrimary, fontFamily: typography.body.medium, marginTop: spacing.xs }]}>
                      Correct answer: <Text style={{ color: c.success }}>{currentQ.answer}</Text>
                    </Text>
                  )}
                  <Text style={[styles.expText, { color: c.textSecondary, fontFamily: typography.body.regular, marginTop: spacing.sm }]}>
                    {currentQ.explanation}
                  </Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* Explanation (Immediate Mode, Multiple choice/T-F) */}
          {feedbackMode === 'immediate' && isAnswered && currentQ.explanation && isMultipleOrTF && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[styles.explanation, { backgroundColor: c.bgElevated, borderColor: c.border }]}
            >
              <Text style={[styles.expLabel, { color: c.accent, fontFamily: typography.body.bold }]}>
                Explanation
              </Text>
              <Text style={[styles.expText, { color: c.textSecondary, fontFamily: typography.body.regular }]}>
                {currentQ.explanation}
              </Text>
            </Animated.View>
          )}

          {/* Navigation */}
          <View style={styles.navRow}>
            <Button
              onPress={handlePrev}
              variant="secondary"
              disabled={currentIndex === 0 || (feedbackMode === 'immediate' && isAnswered)}
              style={{ flex: 1 }}
            >
              Previous
            </Button>
            
            {feedbackMode === 'immediate' ? (
              <Button
                onPress={handleNext}
                disabled={!isAnswered}
                style={{ flex: 1 }}
              >
                {currentIndex === questions.length - 1 ? 'Finish' : 'Continue'}
              </Button>
            ) : (
              <Button
                onPress={handleNext}
                disabled={currentQ?.type === 'fill-in-the-blank' ? !fillBlankInput.trim() : !answers[currentIndex]}
                loading={submitting}
                style={{ flex: 1 }}
              >
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.md,
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitleText: {
    fontSize: fontSize.md,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: { fontSize: fontSize.xs, flexShrink: 0 },
  questionCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  questionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: fontSize.md,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  options: { gap: spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabelText: { fontSize: fontSize.sm },
  optionText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  explanation: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  expLabel: { fontSize: fontSize.xs, letterSpacing: 0.5 },
  expText: { fontSize: fontSize.sm, lineHeight: 20 },
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultScroll: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  resultHero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['2xl'],
  },
  trophyWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultScore: {
    fontSize: 48,
    letterSpacing: -2,
  },
  resultLabel: {
    fontSize: fontSize.xl,
    letterSpacing: -0.5,
  },
  resultSub: { fontSize: fontSize.sm },
  reviewList: { gap: spacing.sm },
  reviewCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  reviewQ: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  reviewAns: {
    fontSize: fontSize.xs,
    marginLeft: 24,
  },
  modeSelectorContent: {
    padding: spacing.lg,
    paddingTop: spacing['3xl'],
    gap: spacing.lg,
  },
  modeSelectorTitleText: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modeSelectorSubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  modeCardsContainer: {
    gap: spacing.lg,
  },
  modeCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modeCardTitle: {
    fontSize: fontSize.md,
    letterSpacing: -0.2,
  },
  modeCardDesc: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  fillBlankContainer: {
    gap: spacing.md,
  },
  fillBlankRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  fillInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
  },
  checkBtn: {
    height: 48,
    minHeight: 48,
    borderRadius: radius.full,
  },
  feedbackCorrectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

