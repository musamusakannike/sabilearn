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
import {
  IconX,
  IconArrowUp,
  IconRotate,
  IconChevronDown,
  IconBook,
  IconMessageDots,
  IconHelp,
} from '@tabler/icons-react-native';
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
}: InLessonAiTutorProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      {/* AI Tutor Dropdown Header Button */}
      <Pressable
        onPress={() => {
          haptics.selection();
          setIsDropdownOpen((prev) => !prev);
        }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.headerCounterBtn,
          { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
        ]}
        accessibilityLabel="AI Tutor Options"
      >
        <IconChevronDown
          size={18}
          color={colors.textPrimary}
          style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {/* Header Dropdown Menu Popover Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View
            style={[
              styles.dropdownCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle },
              shadows.lg,
            ]}
          >
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.dropdownTitleRow}>
                <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>
                  AI Tutor Assistant
                </Text>
              </View>
              <Text style={[styles.dropdownSub, { color: colors.textTertiary }]}>
                Ask about this step
              </Text>
            </View>

            <View style={styles.dropdownMenuOptions}>
              <Pressable
                onPress={() => {
                  setIsDropdownOpen(false);
                  requestExplanation('eli5');
                }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
                ]}
              >
                <View style={styles.dropdownItemLeft}>
                  <IconBook size={18} color="#FF8A00" />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                    Explain Simply
                  </Text>
                </View>
                <View style={styles.eli5Badge}>
                  <Text style={styles.eli5BadgeText}>ELI5</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsDropdownOpen(false);
                  requestExplanation('analogy');
                }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
                ]}
              >
                <View style={styles.dropdownItemLeft}>
                  <IconMessageDots size={18} color="#0084FE" />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                    Relatable Analogy
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsDropdownOpen(false);
                  haptics.selection();
                  setIsOpen(true);
                  if (!fullBuffer) {
                    requestExplanation('eli5');
                  }
                }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
                ]}
              >
                <View style={styles.dropdownItemLeft}>
                  <IconHelp size={18} color="#16A34A" />
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                    Ask Custom Question
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

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
  headerCounterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  counterText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '800',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingRight: 16,
  },
  dropdownCard: {
    width: 230,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  dropdownHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownTitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '800',
  },
  dropdownSub: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    marginTop: 2,
  },
  dropdownMenuOptions: {
    gap: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
    fontWeight: '600',
  },
  eli5Badge: {
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  eli5BadgeText: {
    color: '#FF8A00',
    fontSize: 9,
    fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
    fontWeight: '800',
  },
  goldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8A00',
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
