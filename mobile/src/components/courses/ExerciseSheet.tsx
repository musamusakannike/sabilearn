import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  IconX,
  IconCircleCheck,
  IconCircleX,
  IconPlayerPlay,
  IconBolt,
  IconAward,
  IconArrowRight,
  IconRotateClockwise,
} from '@tabler/icons-react-native';
import { Exercise, Question } from '@/lib/types';
import { progressApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import { useTheme, fontFamilies, fontSizes, radii, spacing, shadows } from '@/theme';
import * as haptics from '@/lib/haptics';
import { useProgressStore } from '@/store/progress.store';

interface ExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  courseId: string;
  topicId?: string;
  chapterId?: string;
  onSuccessPassed: () => void;
}

export default function ExerciseSheet({
  open,
  onClose,
  exercise,
  courseId,
  topicId,
  chapterId,
  onSuccessPassed,
}: ExerciseSheetProps) {
  const { colors } = useTheme();
  const fetchDashboard = useProgressStore((state) => state.fetchDashboard);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (open) {
      startedAt.current = Date.now();
    }
  }, [open, exercise]);

  if (!open || !exercise || !exercise.questions || exercise.questions.length === 0) {
    return null;
  }

  const questions = exercise.questions;
  const s = makeStyles(colors);

  const handleInputChange = (index: number, val: string) => {
    setUserAnswers((prev) => ({ ...prev, [index]: val }));
  };

  const handleRunCode = (index: number, q: Question) => {
    haptics.light();
    const code = userAnswers[index] || q.starterCode || '';
    const expected = (q.expectedOutput || '').trim();

    try {
      let output = '';
      if (q.language === 'javascript' || !q.language) {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: unknown[]) =>
            logs.push(
              args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
            ),
          error: (...args: unknown[]) => logs.push('ERROR: ' + args.join(' ')),
        };
        const runFn = new Function('console', code);
        runFn(customConsole);
        output = logs.join('\n') || 'Execution completed with no logs.';
      } else {
        output = expected || 'Execution completed cleanly.';
      }

      setCodeOutputs((prev) => ({ ...prev, [index]: output }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCodeOutputs((prev) => ({ ...prev, [index]: `Error: ${message}` }));
    }
  };

  const handleSubmit = async () => {
    try {
      haptics.medium();
      setSubmitting(true);

      const answersPayload = questions.map((q, idx) => {
        const userVal = (userAnswers[idx] || '').trim().toLowerCase();
        let isCorrect = false;

        if (q.type === 'mcq') {
          isCorrect = userVal === (q.correctAnswer || '').trim().toLowerCase();
        } else if (q.type === 'fill_in_blank') {
          isCorrect = userVal === (q.correctAnswer || '').trim().toLowerCase();
        } else if (q.type === 'code_execution') {
          const output = (codeOutputs[idx] || '').trim().toLowerCase();
          const expected = (q.expectedOutput || q.correctAnswer || '').trim().toLowerCase();
          isCorrect = (!!expected && output.includes(expected)) || (!!expected && userVal.includes(expected));
        }

        return {
          questionId: q._id || `q_${idx}`,
          questionXp: q.xp || 20,
          isCorrect,
        };
      });

      const duration = Math.round((Date.now() - startedAt.current) / 1000);

      const res = await progressApi.submitExercise({
        courseId,
        topicId,
        chapterId,
        answers: answersPayload,
        duration,
      });

      if (res.data?.success) {
        const data = res.data;
        void fetchDashboard();
        setResultScore(data.scorePercent ?? 0);
        setIsPassed(!!data.isPassed);
        setEarnedXp(data.earnedXp ?? 0);
        setSubmitted(true);

        if (data.isPassed) {
          haptics.success();
          onSuccessPassed();
        } else {
          haptics.warning();
        }
      }
    } catch (error) {
      console.error('Failed to submit exercise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    haptics.light();
    setSubmitted(false);
    setUserAnswers({});
    setCodeOutputs({});
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{exercise.title || 'Topic Exercise'}</Text>
              <Text style={s.subHeader}>
                {exercise.instructions || 'Answer all questions to unlock the next topic.'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                haptics.light();
                onClose();
              }}
              style={s.closeBtn}
              hitSlop={12}
              accessibilityLabel="Close exercise"
            >
              <IconX size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={s.scrollContent}>
            {submitted ? (
              /* Results Screen */
              <View style={s.resultsWrap}>
                <View
                  style={[
                    s.resultIconCircle,
                    isPassed ? s.iconCirclePass : s.iconCircleFail,
                  ]}
                >
                  {isPassed ? (
                    <IconAward size={40} color={colors.success} />
                  ) : (
                    <IconCircleX size={40} color={colors.danger} />
                  )}
                </View>

                <Text style={s.resultTitle}>
                  {isPassed ? 'Exercise Passed!' : 'Needs Improvement'}
                </Text>
                <Text style={s.resultDesc}>
                  {isPassed
                    ? 'Great job! You achieved a passing score and unlocked the next topic.'
                    : 'You scored below 50%. Review the lesson content and try again.'}
                </Text>

                <View style={s.scoreBox}>
                  <View style={s.scoreItem}>
                    <Text style={s.scoreLabel}>SCORE</Text>
                    <Text style={s.scoreValue}>{resultScore}%</Text>
                  </View>

                  <View style={s.scoreDivider} />

                  <View style={s.scoreItem}>
                    <Text style={s.scoreLabel}>XP EARNED</Text>
                    <View style={s.xpRow}>
                      <IconBolt size={18} color="#F59E0B" />
                      <Text style={s.scoreXpText}>+{earnedXp} XP</Text>
                    </View>
                  </View>
                </View>

                <View style={s.resultActions}>
                  {!isPassed && (
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<IconRotateClockwise size={18} color={colors.textPrimary} />}
                      onPress={handleReset}
                      style={{ flex: 1 }}
                    >
                      Retake
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    icon={<IconArrowRight size={18} color={colors.brandOnPrimary} />}
                    onPress={() => {
                      haptics.medium();
                      onClose();
                    }}
                    style={{ flex: 1 }}
                  >
                    Continue
                  </Button>
                </View>
              </View>
            ) : (
              /* Questions List */
              questions.map((q, idx) => (
                <View key={q._id || idx} style={s.questionCard}>
                  <View style={s.questionHeader}>
                    <View style={s.questionNumberBadge}>
                      <Text style={s.questionNumberText}>Question {idx + 1}</Text>
                    </View>
                    <View style={s.xpBadge}>
                      <IconBolt size={12} color="#F59E0B" />
                      <Text style={s.xpBadgeText}>+{q.xp || 20} XP</Text>
                    </View>
                  </View>

                  <Text style={s.questionPrompt}>{q.question}</Text>

                  {/* MCQ options */}
                  {q.type === 'mcq' && q.options && (
                    <View style={s.optionsList}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAnswers[idx] === opt;
                        return (
                          <Pressable
                            key={oIdx}
                            onPress={() => {
                              haptics.selection();
                              handleInputChange(idx, opt);
                            }}
                            style={[
                              s.optionRow,
                              isSelected && s.optionRowSelected,
                            ]}
                          >
                            <View
                              style={[
                                s.radioCircle,
                                isSelected && s.radioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={s.radioDot} />}
                            </View>
                            <Text
                              style={[
                                s.optionText,
                                isSelected && s.optionTextSelected,
                              ]}
                            >
                              {opt}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* Fill in blank */}
                  {q.type === 'fill_in_blank' && (
                    <View style={{ marginTop: spacing.xs }}>
                      <TextInput
                        placeholder="Type your answer here..."
                        placeholderTextColor={colors.textTertiary}
                        value={userAnswers[idx] || ''}
                        onChangeText={(text) => handleInputChange(idx, text)}
                        style={s.textInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}

                  {/* Code execution */}
                  {q.type === 'code_execution' && (
                    <View style={s.codeWrap}>
                      <TextInput
                        multiline
                        numberOfLines={5}
                        placeholder={q.starterCode || '// Write your code here...'}
                        placeholderTextColor="#94A3B8"
                        value={
                          userAnswers[idx] !== undefined
                            ? userAnswers[idx]
                            : q.starterCode || ''
                        }
                        onChangeText={(text) => handleInputChange(idx, text)}
                        style={s.codeInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      <View style={s.codeActions}>
                        <Pressable
                          onPress={() => handleRunCode(idx, q)}
                          style={s.runCodeBtn}
                        >
                          <IconPlayerPlay size={14} color="#FBBF24" />
                          <Text style={s.runCodeBtnText}>Run Code</Text>
                        </Pressable>
                      </View>

                      {codeOutputs[idx] !== undefined && (
                        <View style={s.outputBox}>
                          <Text style={s.outputLabel}>OUTPUT:</Text>
                          <Text style={s.outputText}>{codeOutputs[idx] || 'No output'}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {!submitted && (
            <View style={s.footer}>
              <Button
                variant="ghost"
                size="md"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={submitting}
                onPress={handleSubmit}
              >
                Submit Exercise
              </Button>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bgApp,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      backgroundColor: c.surfaceCard,
    },
    title: {
      fontSize: fontSizes.lg,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
    },
    subHeader: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sans,
      color: c.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: c.surfaceSunken,
      marginLeft: spacing.md,
    },
    scrollContent: {
      padding: spacing.xl,
      gap: spacing.base,
      paddingBottom: spacing['3xl'],
    },
    questionCard: {
      backgroundColor: c.surfaceCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.base,
      gap: spacing.sm,
      ...shadows.xs,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    questionNumberBadge: {
      backgroundColor: c.brandPrimarySoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    questionNumberText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.brandPrimaryHover,
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: '#FDE68A',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    xpBadgeText: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
      color: '#D97706',
    },
    questionPrompt: {
      fontSize: fontSizes.base,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
      marginTop: spacing.xs / 2,
      lineHeight: fontSizes.base * 1.4,
    },
    optionsList: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceCard,
    },
    optionRowSelected: {
      borderColor: c.brandPrimary,
      backgroundColor: c.brandPrimarySoft,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: c.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: c.brandPrimaryHover,
    },
    radioDot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: c.brandPrimaryHover,
    },
    optionText: {
      flex: 1,
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sans,
      color: c.textPrimary,
    },
    optionTextSelected: {
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textPrimary,
    },
    textInput: {
      backgroundColor: c.surfaceSunken,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: radii.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sans,
      color: c.textPrimary,
    },
    codeWrap: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    codeInput: {
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSizes.xs,
      padding: spacing.base,
      borderRadius: radii.md,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    codeActions: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    runCodeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#1E293B',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
    },
    runCodeBtnText: {
      color: '#F8FAFC',
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansSemiBold,
    },
    outputBox: {
      backgroundColor: '#020617',
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: '#1E293B',
      padding: spacing.sm,
      gap: 4,
    },
    outputLabel: {
      color: '#64748B',
      fontSize: 10,
      fontFamily: fontFamilies.sansSemiBold,
      letterSpacing: 0.5,
    },
    outputText: {
      color: '#34D399',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSizes.xs,
    },
    resultsWrap: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.base,
    },
    resultIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    iconCirclePass: {
      backgroundColor: c.successBg,
    },
    iconCircleFail: {
      backgroundColor: c.dangerBg,
    },
    resultTitle: {
      fontSize: fontSizes.xl,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
    },
    resultDesc: {
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sans,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.base,
      lineHeight: fontSizes.sm * 1.5,
    },
    scoreBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceSunken,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
      gap: spacing.xl,
      marginVertical: spacing.sm,
    },
    scoreItem: {
      alignItems: 'center',
    },
    scoreDivider: {
      width: 1,
      height: 36,
      backgroundColor: c.borderDefault,
    },
    scoreLabel: {
      fontSize: 10,
      fontFamily: fontFamilies.sansSemiBold,
      color: c.textTertiary,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    scoreValue: {
      fontSize: fontSizes.xl,
      fontFamily: fontFamilies.displaySemiBold,
      color: c.textPrimary,
    },
    scoreXpText: {
      fontSize: fontSizes.lg,
      fontFamily: fontFamilies.sansSemiBold,
      color: '#D97706',
    },
    xpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    resultActions: {
      flexDirection: 'row',
      gap: spacing.base,
      width: '100%',
      marginTop: spacing.base,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.base,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      backgroundColor: c.surfaceCard,
      gap: spacing.sm,
    },
  });
}
