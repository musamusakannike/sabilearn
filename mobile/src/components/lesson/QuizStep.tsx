import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { IconCircleCheck, IconCircleX, IconHelpCircle } from '@tabler/icons-react-native';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { TopicQuiz } from '@/lib/types';
import * as haptics from '@/lib/haptics';
import RichMathText from '@/components/ui/RichMathText';

function shuffleOptions<T>(options: T[]): T[] {
  if (!options || options.length === 0) return [];
  const array = [...options];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function QuizStep({ quiz, onAnswered }: { quiz: TopicQuiz; onAnswered: (correct: boolean) => void }) {
  const { colors } = useTheme();
  const [shuffledOptions] = useState(() => shuffleOptions(quiz.options));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    haptics.medium();
    onAnswered(!!shuffledOptions[selected]?.isCorrect);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <RichMathText text={quiz.question} style={[styles.question, { color: colors.textPrimary }]} color={colors.textPrimary} fontSize={fontSizes.lg} />
      </View>

      <View style={{ gap: spacing.md }}>
        {shuffledOptions.map((opt, i) => {
          const isSelected = selected === i;
          const showState = checked && (isSelected || opt.isCorrect);

          let borderColor = colors.borderSubtle;
          let bgColor = colors.surfaceCard || colors.surface;

          if (isSelected && !checked) {
            borderColor = '#0084FE';
            bgColor = colors.brandPrimarySoft || colors.surface;
          } else if (showState && opt.isCorrect) {
            borderColor = colors.success;
            bgColor = 'rgba(34, 197, 94, 0.1)';
          } else if (showState && isSelected && !opt.isCorrect) {
            borderColor = colors.danger;
            bgColor = 'rgba(239, 68, 68, 0.1)';
          }

          return (
            <Pressable
              key={i}
              onPress={() => {
                if (!checked) {
                  haptics.selection();
                  setSelected(i);
                }
              }}
              disabled={checked}
              style={[
                styles.option,
                {
                  borderColor,
                  backgroundColor: bgColor,
                  borderWidth: isSelected || showState ? 2 : 1.5,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <RichMathText text={opt.text} style={[styles.optionText, { color: colors.textPrimary }]} color={colors.textPrimary} fontSize={fontSizes.md} />
              </View>
              {showState && opt.isCorrect && <IconCircleCheck size={20} color={colors.success} />}
              {showState && isSelected && !opt.isCorrect && <IconCircleX size={20} color={colors.danger} />}
            </Pressable>
          );
        })}
      </View>

      {!checked ? (
        <Pressable
          onPress={handleCheck}
          disabled={selected === null}
          style={[
            styles.checkBtn,
            {
              backgroundColor: '#FF8A00',
              opacity: selected === null ? 0.4 : 1,
            },
          ]}
        >
          <Text style={styles.checkBtnText}>Check Answer</Text>
        </Pressable>
      ) : (
        !!quiz.explanation && (
          <View style={[styles.explanation, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.explanationTitle, { color: colors.textTertiary }]}>EXPLANATION</Text>
            <RichMathText
              text={quiz.explanation}
              style={{ color: colors.textPrimary, fontFamily: fontFamilies.sans, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 }}
              color={colors.textPrimary}
              fontSize={fontSizes.sm}
            />
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#B45309',
  },
  question: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.displaySemiBold,
    lineHeight: fontSizes.xl * 1.3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionText: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sansMedium,
    flex: 1,
  },
  checkBtn: {
    paddingVertical: spacing.base,
    borderRadius: radii.xl,
    alignItems: 'center',
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  checkBtnText: {
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  explanation: {
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 4,
  },
  explanationTitle: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    letterSpacing: 0.8,
  },
});
