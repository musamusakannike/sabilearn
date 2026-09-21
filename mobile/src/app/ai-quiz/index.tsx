import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  IconArrowLeft,
  IconBrain,
  IconSparkles,
  IconPlayerPlay,
  IconTrash,
  IconRefresh,
  IconHelpCircle,
  IconCalendar,
  IconUpload,
  IconPhoto,
  IconFile,
  IconX,
} from '@tabler/icons-react-native';
import { aiApi, courseArchitectApi } from '@/lib/api';
import { AiHistoryItem, CourseArchitectQuota } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlassSurface from '@/components/ui/GlassSurface';
import OfflineBanner from '@/components/common/OfflineBanner';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { AI, FAINT, INK, MUTED, TINT_AI, TINT_GLASS } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const STAGES = [
  'Reading your materials',
  'Drafting questions',
  'Checking answers',
  'Saving your quiz',
];

type AttachKind = 'file' | 'image';

interface Attachment {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  kind: AttachKind;
}

function axiosMessage(err: any): { status?: number; message: string } {
  return {
    status: err?.response?.status,
    message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.',
  };
}

export default function MobileAIQuizHubScreen() {
  const { colors } = useTheme();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(5);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [historyItems, setHistoryItems] = useState<AiHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const s = makeStyles(colors);
  const canGenerate = topic.trim().length > 0 || attachments.length > 0;

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await aiApi.history({ type: 'quiz', limit: 20 });
      if (res.data?.success) {
        setHistoryItems(res.data.data || []);
      }
    } catch {
      // network
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  const loadQuota = useCallback(async () => {
    try {
      const res = await courseArchitectApi.quota();
      if (res.data?.success) setQuota(res.data.data);
    } catch {
      // offline
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
    void loadQuota();
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, [fetchHistory, loadQuota]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    void fetchHistory();
    void loadQuota();
  }, [fetchHistory, loadQuota]);

  const addPicked = (items: Attachment[]) => {
    const tooBig = items.find((item) => (item.size ?? 0) > MAX_FILE_BYTES);
    if (tooBig) {
      Alert.alert('File too large', `${tooBig.name} is over 15MB. Pick a smaller file.`);
      return;
    }
    setAttachments((prev) => [...prev, ...items]);
    setError(null);
  };

  const pickDocuments = async () => {
    if (generating) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      addPicked(
        result.assets.map((asset) => ({
          id: `${asset.name}-${asset.size}-${Date.now()}`,
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size,
          kind: asset.mimeType?.startsWith('image/') ? 'image' : 'file',
        }))
      );
    } catch {
      Alert.alert('Could not open files', 'Try again, or pick a photo instead.');
    }
  };

  const pickImages = async () => {
    if (generating) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos', 'Allow photo access to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      addPicked(
        result.assets.map((asset) => ({
          id: `${asset.assetId || asset.uri}-${Date.now()}`,
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
          kind: 'image' as const,
        }))
      );
    } catch {
      Alert.alert('Could not open photos', 'Try again, or attach a PDF instead.');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;

    if (quota && !quota.isSubscribed) {
      Alert.alert(
        'Subscription required',
        'Quiz generation is included with SabiLearn. Subscribe to unlock it.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Subscribe', onPress: () => router.push('/subscribe' as any) },
        ]
      );
      return;
    }

    if (quota && quota.isSubscribed && quota.remaining <= 0) {
      Alert.alert(
        'Daily limit reached',
        'You have reached your daily limit of 5 AI generations. Please try again tomorrow.'
      );
      return;
    }

    haptics.medium();
    setError(null);
    setGenerating(true);
    setStageIndex(0);
    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 1500);

    try {
      const form = new FormData();
      if (topic.trim()) form.append('topic', topic.trim());
      form.append('count', String(count));
      attachments.forEach((file, index) => {
        form.append(`file_${index}`, {
          uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          name: file.name,
          type: file.mimeType,
        } as any);
      });

      const res = await aiApi.generateQuizFromMaterials(form);
      if (res.data?.success && res.data?.data?.historyId) {
        haptics.success();
        setTopic('');
        setAttachments([]);
        void loadQuota();
        router.push(`/ai-quiz/${res.data.data.historyId}` as any);
        return;
      }
      setError('Failed to generate quiz. Please try again.');
    } catch (err: any) {
      haptics.error();
      const { status, message } = axiosMessage(err);
      if (status === 403) {
        Alert.alert('Subscription required', message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Subscribe', onPress: () => router.push('/subscribe' as any) },
        ]);
      } else if (status === 429) {
        Alert.alert('Daily limit reached', message);
        void loadQuota();
      }
      setError(message);
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setGenerating(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    haptics.medium();
    Alert.alert('Delete quiz', 'Are you sure you want to delete this quiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await aiApi.deleteHistory(id);
            setHistoryItems((prev) => prev.filter((item) => item._id !== id));
            haptics.success();
          } catch {
            Alert.alert('Error', 'Failed to delete quiz.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenBackdrop />
      <OfflineBanner />

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
          <Text style={s.pageTitle}>Generate quiz</Text>
          <Text style={s.pageSubtitle}>Prompt, notes, or photos. Same daily limit as courses.</Text>
        </View>
        <Pressable onPress={onRefresh} style={s.refreshBtn}>
          <IconRefresh size={18} color={colors.brandPrimaryHover} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B4FE8" />}
      >
        {quota ? (
          !quota.isSubscribed ? (
            <GlassSurface style={s.paywall} tintColor={TINT_AI}>
              <Text style={s.paywallTitle}>Subscription required</Text>
              <Text style={s.paywallBody}>Quiz generation from notes is included with SabiLearn.</Text>
              <Button fullWidth variant="ai" size="sm" onPress={() => router.push('/subscribe' as any)}>
                Subscribe to unlock
              </Button>
            </GlassSurface>
          ) : quota.remaining <= 0 ? (
            <GlassSurface style={s.limitCard} tintColor="rgba(245, 158, 11, 0.12)">
              <Text style={s.limitText}>
                Daily limit reached ({quota.dailyLimit} of {quota.dailyLimit} generations used today). Resets tomorrow.
              </Text>
            </GlassSurface>
          ) : (
            <GlassSurface style={s.quotaChip} tintColor={TINT_AI}>
              <IconSparkles size={16} color={AI} />
              <Text style={s.quotaText}>
                {quota.remaining} of {quota.dailyLimit} generations left today
              </Text>
            </GlassSurface>
          )
        ) : null}

        <Text style={s.sectionLabel}>What should the quiz cover?</Text>
        <GlassSurface style={s.field} tintColor={TINT_GLASS}>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="Optional if you attach notes."
            placeholderTextColor={FAINT}
            style={s.input}
            multiline
            editable={!generating}
          />
        </GlassSurface>

        <Text style={s.sectionLabel}>Questions</Text>
        <View style={s.pillsRow}>
          {[3, 5, 10].map((num) => (
            <Pressable
              key={num}
              onPress={() => {
                haptics.selection();
                setCount(num);
              }}
              disabled={generating}
              style={[s.countPill, count === num && s.countPillActive]}
            >
              <Text style={[s.countPillText, count === num && s.countPillTextActive]}>{num}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionLabel}>Source files</Text>
        <View style={s.attachRow}>
          <Pressable disabled={generating} onPress={pickDocuments} style={s.attachWrap}>
            <GlassSurface style={s.attachCard} tintColor={TINT_GLASS} isInteractive>
              <IconUpload size={20} color={INK} />
              <Text style={s.attachLabel}>PDF or DOCX</Text>
            </GlassSurface>
          </Pressable>
          <Pressable disabled={generating} onPress={pickImages} style={s.attachWrap}>
            <GlassSurface style={s.attachCard} tintColor={TINT_GLASS} isInteractive>
              <IconPhoto size={20} color={INK} />
              <Text style={s.attachLabel}>Photos</Text>
            </GlassSurface>
          </Pressable>
        </View>
        <Text style={s.hint}>Up to 15MB total, 15 images, and 20 PDF pages.</Text>

        {attachments.map((file) => (
          <GlassSurface key={file.id} style={s.fileChip} tintColor={TINT_GLASS}>
            {file.kind === 'image' ? <IconPhoto size={16} color={AI} /> : <IconFile size={16} color={AI} />}
            <Text style={s.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Pressable
              hitSlop={8}
              disabled={generating}
              onPress={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}
            >
              <IconX size={16} color={MUTED} />
            </Pressable>
          </GlassSurface>
        ))}

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {generating ? (
          <GlassSurface style={s.generating} tintColor={TINT_AI}>
            <ActivityIndicator color={AI} />
            <View style={{ flex: 1 }}>
              <Text style={s.generatingTitle}>Building your quiz</Text>
              <Text style={s.generatingStage}>{STAGES[stageIndex]}</Text>
              <Text style={s.hint}>Questions are written from your prompt and files.</Text>
            </View>
          </GlassSurface>
        ) : quota && !quota.isSubscribed ? (
          <Button fullWidth variant="ai" onPress={() => router.push('/subscribe' as any)}>
            Subscribe to generate a quiz
          </Button>
        ) : quota && quota.isSubscribed && quota.remaining <= 0 ? (
          <Button fullWidth variant="secondary" disabled onPress={() => {}}>
            Daily limit reached
          </Button>
        ) : (
          <Button fullWidth variant="ai" disabled={!canGenerate} onPress={handleGenerate}>
            Generate quiz
          </Button>
        )}

        <View style={s.historySection}>
          <View style={s.historyHeaderRow}>
            <Text style={s.historySectionTitle}>Quiz history</Text>
            <Badge>{historyItems.length}</Badge>
          </View>

          {loadingHistory && !refreshing ? (
            <LoadingSpinner />
          ) : historyItems.length === 0 ? (
            <EmptyState
              icon={<IconBrain size={40} color={colors.textTertiary} />}
              title="No quizzes yet"
              description="Add a topic or attach notes to create your first quiz."
            />
          ) : (
            <View style={s.historyList}>
              {historyItems.map((item) => {
                const questionCount = Array.isArray(item.result) ? item.result.length : item.metadata?.count || 0;
                const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <Card
                    key={item._id}
                    onPress={() => {
                      haptics.light();
                      router.push(`/ai-quiz/${item._id}` as any);
                    }}
                  >
                    <View style={s.cardTopRow}>
                      <View style={s.topicBadge}>
                        <Text style={s.topicBadgeText} numberOfLines={1}>
                          {item.prompt || 'Notes'}
                        </Text>
                      </View>
                      <Pressable onPress={() => handleDeleteHistory(item._id)} hitSlop={10} style={s.trashBtn}>
                        <IconTrash size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                    <Text style={s.quizTitle} numberOfLines={2}>
                      {item.title || `Quiz: ${item.prompt}`}
                    </Text>
                    <View style={s.metaRow}>
                      <View style={s.metaItem}>
                        <IconHelpCircle size={14} color={colors.textTertiary} />
                        <Text style={s.metaText}>{questionCount} questions</Text>
                      </View>
                      <View style={s.metaItem}>
                        <IconCalendar size={14} color={colors.textTertiary} />
                        <Text style={s.metaText}>{formattedDate}</Text>
                      </View>
                    </View>
                    <View style={s.cardBottom}>
                      <Text style={s.takeQuizLabel}>Take quiz</Text>
                      <IconPlayerPlay size={14} color={colors.brandPrimaryHover} />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
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
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#E8E8EE',
    },
    refreshBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#E8E8EE',
    },
    pageTitle: { fontSize: fontSizes.lg, fontFamily: fontFamilies.displaySemiBold, color: c.textPrimary },
    pageSubtitle: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: c.textSecondary },
    scroll: { flex: 1 },
    content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['4xl'] },
    sectionLabel: {
      fontSize: fontSizes.xs,
      fontFamily: fontFamilies.sansBold,
      color: INK,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.sm,
    },
    field: { borderRadius: 16, overflow: 'hidden' },
    input: {
      minHeight: 88,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      fontSize: fontSizes.sm,
      fontFamily: fontFamilies.sans,
      color: INK,
      textAlignVertical: 'top',
    },
    pillsRow: { flexDirection: 'row', gap: spacing.sm },
    countPill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: '#F4F4F8',
    },
    countPillActive: { backgroundColor: '#5B4FE8' },
    countPillText: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansMedium, color: INK },
    countPillTextActive: { color: '#FFFFFF' },
    attachRow: { flexDirection: 'row', gap: spacing.sm },
    attachWrap: { flex: 1 },
    attachCard: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      paddingVertical: spacing.lg,
      overflow: 'hidden',
    },
    attachLabel: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansBold, color: INK },
    hint: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: MUTED },
    fileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      overflow: 'hidden',
    },
    fileName: { flex: 1, fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: INK },
    quotaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    quotaText: { fontSize: 13, fontFamily: fontFamilies.sansMedium, color: AI },
    paywall: { borderRadius: 16, padding: spacing.base, gap: spacing.sm, overflow: 'hidden' },
    paywallTitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansBold, color: INK },
    paywallBody: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: MUTED },
    limitCard: { borderRadius: 14, padding: spacing.md, overflow: 'hidden' },
    limitText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: '#92400E' },
    generating: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      borderRadius: 16,
      padding: spacing.base,
      overflow: 'hidden',
    },
    generatingTitle: { fontSize: fontSizes.sm, fontFamily: fontFamilies.sansBold, color: INK },
    generatingStage: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansSemiBold, color: AI, marginTop: 2 },
    errorText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: c.danger },
    historySection: { gap: spacing.md, marginTop: spacing.lg },
    historyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    historySectionTitle: { fontSize: fontSizes.lg, fontFamily: fontFamilies.sansSemiBold, color: c.textPrimary },
    historyList: { gap: spacing.md },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    topicBadge: {
      backgroundColor: 'rgba(91,79,232,0.12)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: radii.full,
      maxWidth: '80%',
    },
    topicBadgeText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansMedium, color: '#5B4FE8' },
    trashBtn: { padding: spacing.xs },
    quizTitle: { fontSize: fontSizes.base, fontFamily: fontFamilies.sansSemiBold, color: c.textPrimary, marginBottom: spacing.sm },
    metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    metaText: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sans, color: c.textSecondary },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
    },
    takeQuizLabel: { fontSize: fontSizes.xs, fontFamily: fontFamilies.sansSemiBold, color: c.brandPrimaryHover },
  });
}
