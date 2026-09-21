import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  IconBook,
  IconCheck,
  IconFile,
  IconPhoto,
  IconSparkles,
  IconUpload,
  IconX,
} from '@tabler/icons-react-native';
import { courseArchitectApi } from '@/lib/api';
import {
  CourseArchitectQuota,
  GeneratedCourseResult,
} from '@/lib/types';
import { useAppReview } from '@/hooks/useAppReview';
import Button from '@/components/ui/Button';
import GlassSurface from '@/components/ui/GlassSurface';
import NativeSegmentedControl from '@/components/ui/NativeSegmentedControl';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import OfflineBanner from '@/components/common/OfflineBanner';
import { fontFamilies, fontSizes, spacing } from '@/theme';
import { AI, FAINT, INK, MUTED, TINT_AI, TINT_GLASS } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const KEEP_AWAKE_TAG = 'course-generate';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VISIBILITIES = ['private', 'unlisted', 'public'] as const;

const STAGES = [
  'Reading your materials…',
  'Outlining chapters…',
  'Writing lessons…',
  'Building quizzes…',
  'Saving your course…',
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
  const status = err?.response?.status as number | undefined;
  const message =
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.';
  return { status, message };
}

export default function GenerateCourseScreen() {
  const insets = useSafeAreaInsets();
  const { inReview } = useAppReview();

  const [quota, setQuota] = useState<CourseArchitectQuota | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [visibilityIndex, setVisibilityIndex] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<GeneratedCourseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (inReview) {
      router.replace('/(tabs)/courses');
    }
  }, [inReview]);

  const loadQuota = useCallback(async () => {
    try {
      const res = await courseArchitectApi.quota();
      if (res.data?.success) setQuota(res.data.data);
    } catch {
      // offline / unauthenticated
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initial quota fetch */
    void loadQuota();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadQuota]);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, []);

  const addAttachments = (items: Attachment[]) => {
    const tooBig = items.find((item) => (item.size ?? 0) > MAX_FILE_BYTES);
    if (tooBig) {
      Alert.alert('File too large', `${tooBig.name} is over 15MB. Pick a smaller file.`);
      return;
    }
    setAttachments((prev) => [...prev, ...items]);
    haptics.light();
  };

  const pickDocuments = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (picked.canceled) return;
      addAttachments(
        picked.assets.map((asset) => ({
          id: `${asset.uri}-${asset.name}`,
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
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Photo library access is required to attach lecture slides.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (picked.canceled) return;
      addAttachments(
        picked.assets.map((asset) => {
          const name = asset.fileName || `photo_${Date.now()}.jpg`;
          return {
            id: asset.uri,
            uri: asset.uri,
            name,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
            kind: 'image' as const,
          };
        })
      );
    } catch {
      Alert.alert('Could not open photos', 'Try again, or attach a PDF instead.');
    }
  };

  const removeAttachment = (id: string) => {
    haptics.light();
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const canGenerate = prompt.trim().length > 0 || attachments.length > 0;

  const startStageLoop = () => {
    setStageIndex(0);
    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 8000);
  };

  const stopStageLoop = () => {
    if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    haptics.medium();
    setError(null);
    setGenerating(true);
    startStageLoop();
    try {
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } catch {
      // keep-awake is optional
    }

    try {
      const form = new FormData();
      if (title.trim()) form.append('courseTitle', title.trim());
      if (prompt.trim()) form.append('userGuidePrompt', prompt.trim());
      form.append('difficulty', DIFFICULTIES[difficultyIndex]);
      form.append('visibility', VISIBILITIES[visibilityIndex]);

      attachments.forEach((file, index) => {
        form.append(`file_${index}`, {
          uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          name: file.name,
          type: file.mimeType,
        } as any);
      });

      const res = await courseArchitectApi.generateFull(form);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Generation failed');
      }
      haptics.success();
      setResult(res.data.data as GeneratedCourseResult);
      void loadQuota();
    } catch (err: any) {
      haptics.error();
      const { status, message } = axiosMessage(err);
      if (status === 403) {
        Alert.alert('Subscription required', message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Subscribe', onPress: () => router.push('/subscribe' as any) },
        ]);
        setError(message);
      } else if (status === 401) {
        setError('Sign in to generate a course.');
      } else {
        setError(message);
      }
    } finally {
      stopStageLoop();
      setGenerating(false);
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setTitle('');
    setPrompt('');
    setAttachments([]);
    setDifficultyIndex(0);
    setVisibilityIndex(0);
  };

  if (result) {
    return (
      <View collapsable={false} style={styles.container}>
        <ScreenBackdrop />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing['4xl'] },
          ]}
        >
          <ScreenHeader showBack title="Course ready" subtitle="Your generated course is saved and you are enrolled." />
          <GlassSurface style={styles.successCard} tintColor="rgba(16,185,129,0.16)" isInteractive>
            <View style={styles.successIcon}>
              <IconCheck size={28} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>{result.title}</Text>
            <Text style={styles.successMeta}>
              {result.stats.chapters} chapters · {result.stats.topics} topics
            </Text>
          </GlassSurface>
          <Button
            fullWidth
            variant="ai"
            onPress={() => router.push(`/course/${result.courseId}` as any)}
          >
            Open course
          </Button>
          <View style={{ height: spacing.md }} />
          <Button fullWidth variant="secondary" onPress={resetForm}>
            Generate another
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <OfflineBanner />
        <ScreenHeader
          showBack
          title="Generate course"
          subtitle="Turn notes or a prompt into a full SabiLearn course."
        />

        {quota ? (
          <GlassSurface style={styles.quotaChip} tintColor={TINT_AI}>
            <IconSparkles size={16} color={AI} />
            <Text style={styles.quotaText}>
              {quota.remaining} of {quota.dailyLimit} generations left today
            </Text>
          </GlassSurface>
        ) : null}

        <Text style={styles.sectionLabel}>What should we teach?</Text>
        <GlassSurface style={styles.field} tintColor={TINT_GLASS}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="e.g. A beginner course on Git for my SWEP class, based on these notes…"
            placeholderTextColor={FAINT}
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
            editable={!generating}
          />
        </GlassSurface>

        <Text style={styles.sectionLabel}>Optional title</Text>
        <GlassSurface style={styles.field} tintColor={TINT_GLASS}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Leave blank and we’ll name it"
            placeholderTextColor={FAINT}
            style={styles.input}
            editable={!generating}
          />
        </GlassSurface>

        <Text style={styles.sectionLabel}>Source files</Text>
        <View style={styles.attachRow}>
          <Pressable
            disabled={generating}
            onPress={pickDocuments}
            style={({ pressed }) => [styles.attachWrap, pressed && styles.pressed]}
          >
            <GlassSurface style={styles.attachCard} tintColor={TINT_GLASS} isInteractive>
              <IconUpload size={20} color={INK} />
              <Text style={styles.attachLabel}>PDF or DOCX</Text>
            </GlassSurface>
          </Pressable>
          <Pressable
            disabled={generating}
            onPress={pickImages}
            style={({ pressed }) => [styles.attachWrap, pressed && styles.pressed]}
          >
            <GlassSurface style={styles.attachCard} tintColor={TINT_GLASS} isInteractive>
              <IconPhoto size={20} color={INK} />
              <Text style={styles.attachLabel}>Photos</Text>
            </GlassSurface>
          </Pressable>
        </View>

        {attachments.map((file) => (
          <GlassSurface key={file.id} style={styles.fileChip} tintColor={TINT_GLASS}>
            {file.kind === 'image' ? <IconPhoto size={16} color={AI} /> : <IconFile size={16} color={AI} />}
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Pressable onPress={() => removeAttachment(file.id)} hitSlop={8} disabled={generating}>
              <IconX size={16} color={MUTED} />
            </Pressable>
          </GlassSurface>
        ))}

        <Text style={styles.sectionLabel}>Difficulty</Text>
        <NativeSegmentedControl
          values={['Beginner', 'Intermediate', 'Advanced']}
          selectedIndex={difficultyIndex}
          onChange={setDifficultyIndex}
        />

        <Text style={styles.sectionLabel}>Visibility</Text>
        <NativeSegmentedControl
          values={['Private', 'Unlisted', 'Public']}
          selectedIndex={visibilityIndex}
          onChange={setVisibilityIndex}
        />
        <Text style={styles.hint}>
          Private is only for you. Unlisted is link-only. Public can appear in the community catalog.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {generating ? (
          <GlassSurface style={styles.generating} tintColor={TINT_AI}>
            <ActivityIndicator color={AI} />
            <View style={{ flex: 1 }}>
              <Text style={styles.generatingTitle}>Building your course</Text>
              <Text style={styles.generatingStage}>{STAGES[stageIndex]}</Text>
              <Text style={styles.hint}>Keep the app open. This can take a few minutes.</Text>
            </View>
          </GlassSurface>
        ) : (
          <Button
            fullWidth
            variant="ai"
            disabled={!canGenerate}
            icon={<IconBook size={18} color="#FFFFFF" />}
            onPress={handleGenerate}
          >
            Generate course
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  quotaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  quotaText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: AI,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: 0.2,
    marginTop: spacing.xs,
  },
  field: {
    borderRadius: 18,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
  input: {
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamilies.sans,
    color: INK,
  },
  multiline: {
    minHeight: 120,
    lineHeight: 22,
  },
  attachRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  attachWrap: { flex: 1 },
  attachCard: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  attachLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: INK,
  },
  hint: {
    fontSize: 12,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    lineHeight: 18,
  },
  error: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansMedium,
    color: '#E5484D',
  },
  generating: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: 20,
    padding: spacing.base,
    overflow: 'hidden',
  },
  generatingTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  generatingStage: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: AI,
    marginTop: 4,
    marginBottom: 6,
  },
  successCard: {
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successMeta: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
  },
  pressed: { opacity: 0.9 },
});
