import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconX, IconChevronUp, IconArrowUp, IconRotate } from '@tabler/icons-react-native';
import { useTheme, fontFamilies, fontSizes, radii, spacing, shadows } from '@/theme';
import * as haptics from '@/lib/haptics';
import { streamAiExplainMobile, ExplainLessonParams } from '@/lib/api';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface InLessonAiTutorProps {
  topicTitle: string;
  stepTitle?: string;
  stepContent: string;
  isScrollingDown?: boolean;
}

type ExplanationMode = 'eli5' | 'analogy' | 'custom';

export default function InLessonAiTutor({
  topicTitle,
  stepTitle,
  stepContent,
  isScrollingDown = false,
}: InLessonAiTutorProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeMode, setActiveMode] = useState<ExplanationMode>('eli5');
  const [customQuestion, setCustomQuestion] = useState('');

  // Streaming and typewriter text reveal states
  const [fullBuffer, setFullBuffer] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelStreamRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Progressive typewriter animation: reveals text character by character
  useEffect(() => {
    if (displayedText.length < fullBuffer.length) {
      const remaining = fullBuffer.length - displayedText.length;
      const step = remaining > 100 ? 5 : remaining > 40 ? 3 : 1;
      const delay = remaining > 100 ? 12 : remaining > 40 ? 16 : 22;

      const timer = setTimeout(() => {
        setDisplayedText(fullBuffer.slice(0, displayedText.length + step));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [displayedText, fullBuffer]);

  // Request streaming explanation
  const requestExplanation = useCallback(
    (mode: ExplanationMode, customQuery?: string) => {
      haptics.light();
      if (cancelStreamRef.current) {
        cancelStreamRef.current();
      }

      setActiveMode(mode);
      setError(null);
      setFullBuffer('');
      setDisplayedText('');
      setIsStreaming(true);
      setIsOpen(true);

      const params: ExplainLessonParams = {
        mode,
        topicTitle,
        stepTitle,
        stepContent,
        question: customQuery,
      };

      const cancel = streamAiExplainMobile(
        params,
        (chunk) => {
          setFullBuffer((prev) => prev + chunk);
        },
        () => {
          setIsStreaming(false);
          haptics.selection();
        },
        (err) => {
          setIsStreaming(false);
          setError(err?.message || 'Could not load explanation. Please try again.');
        }
      );

      cancelStreamRef.current = cancel;
    },
    [topicTitle, stepTitle, stepContent]
  );

  const handleCustomSubmit = () => {
    if (!customQuestion.trim() || isStreaming) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    requestExplanation('custom', q);
  };

  const handleClose = () => {
    haptics.light();
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
    }
    setIsOpen(false);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Floating Pill Widget */}
      {!isOpen && (
        <View
          pointerEvents={isScrollingDown ? 'none' : 'auto'}
          style={[
            styles.floatingContainer,
            isScrollingDown && styles.floatingHidden,
          ]}
        >
          {isDismissed ? (
            /* Minimized edge tab */
            <Pressable
              onPress={() => {
                haptics.selection();
                setIsDismissed(false);
              }}
              style={[
                styles.minimizedTab,
                { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle },
                shadows.sm,
              ]}
              accessibilityLabel="Show AI Tutor"
            >
              <View style={styles.goldDot} />
              <Text style={[styles.minimizedLabel, { color: colors.textPrimary }]}>AI Tutor</Text>
            </Pressable>
          ) : (
            /* Active Floating Action Pill */
            <View
              style={[
                styles.floatingPill,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                },
                shadows.md,
              ]}
            >
              {/* Quick Action: Explain Simply */}
              <Pressable
                onPress={() => requestExplanation('eli5')}
                style={({ pressed }) => [
                  styles.quickBtn,
                  { backgroundColor: colors.surfaceSunken, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>
                  Explain Simply
                </Text>
                <View style={styles.eli5Tag}>
                  <Text style={styles.eli5TagText}>ELI5</Text>
                </View>
              </Pressable>

              {/* Quick Action: Analogy */}
              <Pressable
                onPress={() => requestExplanation('analogy')}
                style={({ pressed }) => [
                  styles.quickBtn,
                  { backgroundColor: colors.surfaceSunken, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Analogy</Text>
              </Pressable>

              {/* Open full sheet button */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setIsOpen(true);
                  if (!fullBuffer) {
                    requestExplanation('eli5');
                  }
                }}
                style={styles.openTutorBtn}
              >
                <Text style={styles.openTutorText}>AI Tutor</Text>
                <IconChevronUp size={14} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>

              {/* Dismiss button */}
              <Pressable
                onPress={() => {
                  haptics.light();
                  setIsDismissed(true);
                }}
                hitSlop={10}
                style={styles.dismissBtn}
                accessibilityLabel="Dismiss AI Tutor"
              >
                <IconX size={14} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Tutor Modal Bottom Sheet */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdropTouchArea} onPress={handleClose} />

          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.sheetContainer,
              { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.dragHandleWrap}>
              <View style={[styles.dragHandle, { backgroundColor: colors.borderSubtle }]} />
            </View>

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.sheetHeaderInfo}>
                <View style={styles.goldDot} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                    In-Lesson AI Tutor
                  </Text>
                  <Text
                    style={[styles.sheetSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Context: {stepTitle || topicTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {displayedText && !isStreaming ? (
                  <Pressable
                    onPress={() => requestExplanation(activeMode)}
                    hitSlop={10}
                    style={styles.iconBtn}
                  >
                    <IconRotate size={18} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
                <Pressable onPress={handleClose} hitSlop={10} style={styles.iconBtn}>
                  <IconX size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Mode Selection Chips */}
            <View style={[styles.chipsRow, { borderBottomColor: colors.borderSubtle }]}>
              <Pressable
                onPress={() => requestExplanation('eli5')}
                disabled={isStreaming}
                style={[
                  styles.modeChip,
                  activeMode === 'eli5'
                    ? { backgroundColor: '#FF8A00' }
                    : { backgroundColor: colors.surfaceSunken },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    activeMode === 'eli5' ? { color: '#FFFFFF' } : { color: colors.textPrimary },
                  ]}
                >
                  Explain Simply (ELI5)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => requestExplanation('analogy')}
                disabled={isStreaming}
                style={[
                  styles.modeChip,
                  activeMode === 'analogy'
                    ? { backgroundColor: '#0084FE' }
                    : { backgroundColor: colors.surfaceSunken },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    activeMode === 'analogy' ? { color: '#FFFFFF' } : { color: colors.textPrimary },
                  ]}
                >
                  Relatable Analogy
                </Text>
              </Pressable>
            </View>

            {/* Explanation Content */}
            <ScrollView
              ref={scrollRef}
              style={styles.sheetBody}
              contentContainerStyle={styles.sheetBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : displayedText ? (
                <MarkdownRenderer content={displayedText} isStreaming={isStreaming} />
              ) : isStreaming ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FF8A00" />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    DeepSeek tutor is formulating explanation...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Select an explanation mode above.
                </Text>
              )}
            </ScrollView>

            {/* Custom Question Input */}
            <View
              style={[
                styles.inputBar,
                { backgroundColor: colors.surfaceSunken, borderTopColor: colors.borderSubtle },
              ]}
            >
              <View
                style={[
                  styles.inputInner,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle },
                ]}
              >
                <TextInput
                  value={customQuestion}
                  onChangeText={setCustomQuestion}
                  placeholder="Ask a follow-up about this step..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                  editable={!isStreaming}
                  returnKeyType="send"
                  onSubmitEditing={handleCustomSubmit}
                />
                <Pressable
                  onPress={handleCustomSubmit}
                  disabled={!customQuestion.trim() || isStreaming}
                  style={[
                    styles.sendBtn,
                    { opacity: !customQuestion.trim() || isStreaming ? 0.4 : 1 },
                  ]}
                >
                  <IconArrowUp size={16} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 86,
    right: spacing.base,
    zIndex: 25,
  },
  floatingHidden: {
    opacity: 0.25,
    transform: [{ translateY: 8 }],
  },
  minimizedTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  minimizedLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '700',
  },
  goldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8A00',
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  quickBtnText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  eli5Tag: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  eli5TagText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '800',
  },
  openTutorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  openTutorText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '700',
  },
  dismissBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderTopWidth: 1,
    maxHeight: '82%',
    minHeight: '52%',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sheetHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.displaySemiBold,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  modeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  modeChipText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '700',
  },
  sheetBody: {
    flex: 1,
  },
  sheetBodyContent: {
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.base,
  },
  errorText: {
    color: '#DC2626',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
  },
  inputBar: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 2,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: '#FF8A00',
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
