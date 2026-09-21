import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconCheck, IconX } from '@tabler/icons-react-native';
import { MCQ } from '@/lib/types';
import { useProgressStore } from '@/store/progress.store';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import { useTheme, fontFamilies, fontSizes, radii, spacing, shadows } from '@/theme';
import * as haptics from '@/lib/haptics';
import RichMathText from '@/components/ui/RichMathText';

interface McqDeckProps {
  courseId: string;
  topicId?: string;
  mcqs: MCQ[];
  isLoading: boolean;
}

export default function McqDeck({ courseId, topicId, mcqs, isLoading }: McqDeckProps) {
  const { colors } = useTheme();
  const { submitMcqSession } = useProgressStore();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    startedAt.current = Date.now();
  }, [mcqs.length]);

  const finishSession = (finalCorrect: number) => {
    setFinished(true);
    const duration = Math.round((Date.now() - startedAt.current) / 1000);
    const score = mcqs.length > 0 ? Math.round((finalCorrect / mcqs.length) * 100) : 0;
    submitMcqSession({
      course: courseId,
      topic: topicId,
      mcqAnswered: mcqs.length,
      mcqCorrect: finalCorrect,
      duration,
      score,
    });
  };

  const selectOption = (optionIndex: number) => {
    if (selected !== null) return;
    const isCorrect = !!mcqs[index].options[optionIndex]?.isCorrect;
    haptics[isCorrect ? 'success' : 'error']();
    setSelected(optionIndex);
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setCorrect(nextCorrect);
  };

  const next = () => {
    if (index + 1 >= mcqs.length) {
      finishSession(correct);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    startedAt.current = Date.now();
  };

  if (isLoading) return <LoadingSpinner fill={false} />;
  if (mcqs.length === 0) {
    return <EmptyState title="No practice questions yet" description="Check back once questions are added to this topic." />;
  }

  if (finished) {
    const score = mcqs.length > 0 ? Math.round((correct / mcqs.length) * 100) : 0;
    return (
      <View style={styles.finishedWrap}>
        <Text style={[styles.finishedTitle, { color: colors.textPrimary }]}>{score}% score</Text>
        <Text style={[styles.finishedSubtitle, { color: colors.textSecondary }]}>{correct} of {mcqs.length} correct</Text>
        <Button onPress={restart}>Try again</Button>
      </View>
    );
  }

  const question = mcqs[index];
  const progressPct = (index / mcqs.length) * 100;

  return (
    <View style={styles.container}>
      <ProgressBar value={progressPct} />
      <Text style={[styles.counter, { color: colors.textTertiary }]}>{index + 1} / {mcqs.length}</Text>

      <RichMathText text={question.question} style={[styles.question, { color: colors.textPrimary }]} color={colors.textPrimary} fontSize={fontSizes.lg} />

      <View style={{ gap: spacing.sm }}>
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const showCorrect = selected !== null && option.isCorrect;
          const showWrong = isSelected && !option.isCorrect;
          const bg = showCorrect ? colors.successBg : showWrong ? colors.dangerBg : colors.surfaceCard;
          const borderColor = showCorrect ? colors.success : showWrong ? colors.danger : colors.borderDefault;

          return (
            <Pressable
              key={i}
              onPress={() => selectOption(i)}
              style={[styles.option, { backgroundColor: bg, borderColor }]}
            >
              <View style={{ flex: 1 }}>
                <RichMathText text={option.text} style={[styles.optionText, { color: colors.textPrimary }]} color={colors.textPrimary} fontSize={fontSizes.sm} />
              </View>
              {showCorrect && <IconCheck size={16} color={colors.success} />}
              {showWrong && <IconX size={16} color={colors.danger} />}
            </Pressable>
          );
        })}
      </View>

      {selected !== null && question.explanation ? (
        <View style={[styles.explanationBox, { backgroundColor: colors.surfaceSunken }]}>
          <RichMathText text={question.explanation} style={[styles.explanationText, { color: colors.textSecondary }]} color={colors.textSecondary} fontSize={fontSizes.sm} />
        </View>
      ) : null}

      {selected !== null && (
        <Button fullWidth onPress={next}>{index + 1 >= mcqs.length ? 'Finish' : 'Next question'}</Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.base },
  counter: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, alignSelf: 'center' },
  question: { fontSize: fontSizes.lg, fontFamily: fontFamilies.sansSemiBold, lineHeight: fontSizes.lg * 1.4 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radii.md, padding: spacing.base },
  optionText: { flex: 1, fontSize: fontSizes.base, fontFamily: fontFamilies.sans },
  explanationBox: { borderRadius: radii.md, padding: spacing.base },
  explanationText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sans, lineHeight: fontSizes.sm * 1.5 },
  finishedWrap: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing['3xl'] },
  finishedTitle: { fontSize: fontSizes.xl, fontFamily: fontFamilies.displaySemiBold },
  finishedSubtitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sans },
});
