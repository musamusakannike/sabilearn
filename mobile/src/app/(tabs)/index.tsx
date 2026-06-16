import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Send,
  Plus,
  BookOpen,
  HelpCircle,
  Video,
  FileText,
  X,
  SquarePen,
  MessageSquare,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { api } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { typography, spacing, fontSize, radius } from '@/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  type?: 'text' | 'course-created' | 'quiz-created' | 'video-created';
  meta?: { id?: string; title?: string };
}

const SUGGESTIONS = [
  'Help me understand photosynthesis',
  'What is machine learning?',
  'Summarize the French Revolution',
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MessageBubble({ message }: { message: Message }) {
  const { c } = useTheme();
  const router = useRouter();
  const isUser = message.role === 'user';

  const handleCtaPress = () => {
    haptics.medium();
    if (message.type === 'course-created' && message.meta?.id) {
      router.push(`/course/${message.meta.id}`);
    } else if (message.type === 'quiz-created' && message.meta?.id) {
      router.push(`/quiz/${message.meta.id}`);
    } else if (message.type === 'video-created') {
      router.push('/videos');
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      {!isUser && (
        <View style={[styles.assistantAvatar, { backgroundColor: c.accentMuted }]}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={{ width: 14, height: 14, tintColor: c.accent }}
            resizeMode="contain"
          />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: c.accent }]
            : [styles.assistantBubble, { backgroundColor: c.bgSecondary, borderColor: c.borderSubtle }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: isUser ? '#0C0C0E' : c.textPrimary,
              fontFamily: typography.body.regular,
            },
          ]}
        >
          {message.content}
        </Text>

        {/* Action Button for Created Items */}
        {!isUser && message.type && message.type !== 'text' && (
          <Pressable
            onPress={handleCtaPress}
            style={({ pressed }) => [
              styles.bubbleButton,
              {
                backgroundColor: pressed ? c.accentHover : c.accent,
              },
            ]}
          >
            <Text style={[styles.bubbleButtonText, { color: '#0C0C0E' }]}>
              {message.type === 'course-created'
                ? 'Open Course →'
                : message.type === 'quiz-created'
                ? 'Take Quiz →'
                : 'Watch Video →'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { c } = useTheme();
  const toast = useToast();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'ask' | 'course' | 'quiz' | 'video'>('ask');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const activeIndex = useSharedValue(0);
  const sendScale = useSharedValue(1);

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const singleSegmentWidth = segmentWidth > 0 ? segmentWidth / 4 : 0;

  const sliderStyle = useAnimatedStyle(() => {
    return {
      left: singleSegmentWidth > 0 ? activeIndex.value * singleSegmentWidth + 4 : 0,
      width: singleSegmentWidth > 0 ? singleSegmentWidth - 8 : 0,
    };
  });

  const addMessage = (role: Message['role'], content: string) => {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return msg;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    addMessage('user', question);
    setLoading(true);
    haptics.medium();

    const mode = activeMode;

    try {
      if (mode === 'course') {
        addMessage('system', 'Creating course...');
        const res = await api.post('/api/ai/course', { topic: question });
        setMessages((prev) => prev.filter((m) => m.role !== 'system'));

        if (res.data?.course || res.data?.courseId) {
          const course = res.data.course;
          const courseId = course?._id || res.data.courseId;
          const courseTitle = course?.title || question;

          const msg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: 'assistant',
            content: `✅ **Course created:** "${courseTitle}"\n\nYour personalized course has been generated successfully. Tap below to start learning.`,
            createdAt: new Date(),
            type: 'course-created',
            meta: { id: courseId, title: courseTitle },
          };
          setMessages((prev) => [...prev, msg]);
        } else {
          addMessage('assistant', 'Failed to create course. Please try again.');
        }
      } else if (mode === 'quiz') {
        addMessage('system', 'Generating quiz...');
        const res = await api.post('/api/ai/quiz', { topic: question, numQuestions: 5 });
        setMessages((prev) => prev.filter((m) => m.role !== 'system'));

        if (res.data?.quiz || res.data?.quizId) {
          const quiz = res.data.quiz;
          const quizId = quiz?._id || res.data.quizId;
          const quizTitle = quiz?.title || question;

          const msg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: 'assistant',
            content: `✅ **Quiz created:** "${quizTitle}"\n\nYour practice quiz with 5 questions is ready. Tap below to test your knowledge.`,
            createdAt: new Date(),
            type: 'quiz-created',
            meta: { id: quizId, title: quizTitle },
          };
          setMessages((prev) => [...prev, msg]);
        } else {
          addMessage('assistant', 'Failed to create quiz. Please try again.');
        }
      } else if (mode === 'video') {
        addMessage('system', 'Generating explanatory video...');
        const res = await api.post('/api/ai/video', { topic: question, styleTheme: 'emerald', numScenes: 5 });
        setMessages((prev) => prev.filter((m) => m.role !== 'system'));

        if (res.data?.video || res.data?.videoId) {
          const video = res.data.video;
          const videoId = video?._id || res.data.videoId;
          const videoTitle = video?.title || question;

          const msg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: 'assistant',
            content: `✅ **Video created:** "${videoTitle}"\n\nYour explanatory video presentation has been generated. Tap below to check it out.`,
            createdAt: new Date(),
            type: 'video-created',
            meta: { id: videoId, title: videoTitle },
          };
          setMessages((prev) => [...prev, msg]);
        } else {
          addMessage('assistant', 'Failed to create video. Please try again.');
        }
      } else {
        // Ask AI (default)
        const res = await api.post('/api/ai/question', { question });
        if (res.data?.answer) {
          addMessage('assistant', res.data.answer);
        } else {
          addMessage('assistant', 'Failed to get a response.');
        }
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.role !== 'system'));
      const msg = err.response?.data?.error || 'Failed to get a response';
      if (err.response?.data?.code === 'LIMIT_REACHED') {
        toast.warning('Daily limit reached', 'Upgrade to Premium for unlimited generations');
      } else {
        toast.error('Error', msg);
      }
      addMessage('system', `⚠️ ${msg}`);
    } finally {
      setLoading(false);
      setActiveMode('ask');
      activeIndex.value = withSpring(0);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const isEmpty = messages.length === 0;

  const handleNewChat = () => {
    if (messages.length === 0) return;
    Alert.alert(
      'New Chat',
      'Are you sure you want to start a new chat session? This will clear your current messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            setMessages([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <View>
          {!isEmpty && (
            <Pressable
              onPress={handleNewChat}
              style={({ pressed }) => [
                styles.newChatBtn,
                {
                  backgroundColor: pressed ? c.bgHover : c.bgSecondary,
                  borderColor: c.border,
                },
              ]}
            >
              <SquarePen size={18} color={c.textSecondary} strokeWidth={2} />
            </Pressable>
          )}
        </View>
        <Avatar name={user?.name} size={36} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isEmpty && styles.scrollContentEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: c.textPrimary, fontFamily: typography.display.bold }]}>
              Ask me anything
            </Text>
            <Text style={[styles.emptySubtitle, { color: c.textMuted, fontFamily: typography.body.regular }]}>
              I'm your personalized AI tutor. Ask a question, or pick a suggestion below.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => { haptics.light(); setInput(s); }}
                  style={[styles.chip, { backgroundColor: c.bgSecondary, borderColor: c.border }]}
                >
                  <Text style={[styles.chipText, { color: c.textSecondary, fontFamily: typography.body.medium }]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.messageList}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <Animated.View entering={FadeInDown.duration(300)} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                <View style={[styles.assistantAvatar, { backgroundColor: c.accentMuted }]}>
                  <Image
                    source={require('@/assets/images/splash-icon.png')}
                    style={{ width: 14, height: 14, tintColor: c.accent }}
                    resizeMode="contain"
                  />
                </View>
                <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: c.bgSecondary, borderColor: c.borderSubtle }]}>
                  <ActivityIndicator size="small" color={c.accent} />
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={{ backgroundColor: c.bgPrimary, borderTopWidth: 1, borderTopColor: c.borderSubtle, paddingTop: spacing.sm, paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.xs }}>
          {/* Segment Bar */}
          <View
            onLayout={(e) => {
              setSegmentWidth(e.nativeEvent.layout.width);
            }}
            style={[styles.segmentContainer, { backgroundColor: c.bgSecondary, borderColor: c.border }]}
          >
            {/* Sliding backdrop */}
            {singleSegmentWidth > 0 && (
              <Animated.View
                style={[
                  styles.slider,
                  {
                    backgroundColor: c.accentMuted,
                    borderColor: `${c.accent}22`,
                  },
                  sliderStyle,
                ]}
              />
            )}

            {[
              { id: 'ask' as const, label: 'Ask AI', icon: MessageSquare },
              { id: 'course' as const, label: 'Course', icon: BookOpen },
              { id: 'quiz' as const, label: 'Quiz', icon: HelpCircle },
              { id: 'video' as const, label: 'Video', icon: Video },
            ].map((modeItem, idx) => {
              const IconComp = modeItem.icon;
              const isModeActive = activeMode === modeItem.id;
              return (
                <Pressable
                  key={modeItem.id}
                  onPress={() => {
                    haptics.light();
                    setActiveMode(modeItem.id);
                    activeIndex.value = withSpring(idx, { damping: 18 });
                  }}
                  style={styles.segmentBtn}
                >
                  <IconComp size={13} color={isModeActive ? c.accent : c.textSecondary} strokeWidth={2} />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color: isModeActive ? c.accent : c.textSecondary,
                        fontFamily: isModeActive ? typography.body.bold : typography.body.medium,
                      },
                    ]}
                  >
                    {modeItem.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/documents'); }}
              style={[styles.addBtn, { backgroundColor: c.bgSecondary, borderColor: c.border }]}
            >
              <FileText size={18} color={c.textSecondary} strokeWidth={2} />
            </Pressable>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={
                activeMode === 'course'
                  ? 'Enter a topic for your course...'
                  : activeMode === 'quiz'
                  ? 'Enter a topic for your quiz...'
                  : activeMode === 'video'
                  ? 'Enter a topic for your video...'
                  : 'Ask anything...'
              }
              placeholderTextColor={c.textMuted}
              multiline
              style={[
                styles.textInput,
                {
                  backgroundColor: c.bgSecondary,
                  borderColor: c.border,
                  color: c.textPrimary,
                  fontFamily: typography.body.regular,
                },
              ]}
              onSubmitEditing={handleSend}
            />

            <AnimatedPressable
              onPress={handleSend}
              onPressIn={() => { sendScale.value = withSpring(0.9); }}
              onPressOut={() => { sendScale.value = withSpring(1); }}
              disabled={!input.trim() || loading}
              style={[
                sendAnimStyle,
                styles.sendBtn,
                { backgroundColor: input.trim() ? c.accent : c.bgTertiary },
              ]}
            >
              <Send size={18} color={input.trim() ? '#0C0C0E' : c.textMuted} strokeWidth={2} />
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardStickyView>
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
  },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: fontSize['2xs'],
    marginTop: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  scrollContentEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 9 },
  messageList: { gap: spacing.lg },
  bubbleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  bubbleButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bubbleButtonText: {
    fontSize: fontSize.xs,
    fontFamily: typography.body.bold,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    position: 'relative',
    height: 38,
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.sm,
    zIndex: 10,
  },
  segmentBtnText: {
    fontSize: fontSize['2xs'] + 1,
  },
  slider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.sm,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
