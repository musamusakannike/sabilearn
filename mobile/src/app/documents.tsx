import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list/react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  FileText,
  Upload,
  Trash2,
  Clock,
  FileImage,
  File,
  Info,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { typography, spacing, fontSize, radius } from '@/constants/theme';

interface Doc {
  _id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  ocrStatus?: 'processing' | 'completed' | 'failed';
  publicUrl?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocIcon({ mimeType }: { mimeType: string }) {
  const { c } = useTheme();
  const isImage = mimeType.startsWith('image/');
  const IconComp = isImage ? FileImage : File;
  const color = isImage ? '#60A5FA' : c.accent;
  return (
    <View style={[styles.docIcon, { backgroundColor: `${color}22` }]}>
      <IconComp size={18} color={color} strokeWidth={1.5} />
    </View>
  );
}

function DocCard({ doc, index }: { doc: Doc; index: number }) {
  const router = useRouter();
  const { c } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/documents?id=${doc._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete document?',
      `"${doc.fileName}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { haptics.heavy(); deleteMutation.mutate(); },
        },
      ]
    );
  };

  const handleCardPress = () => {
    haptics.light();
    router.push(`/document/${doc._id}`);
  };

  const isProcessing = doc.ocrStatus === 'processing';
  const isFailed = doc.ocrStatus === 'failed';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
      <Pressable onPress={handleCardPress}>
        <View style={[styles.card, { backgroundColor: c.bgSecondary, borderColor: c.borderSubtle }]}>
          <DocIcon mimeType={doc.mimeType} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardName, { color: c.textPrimary, fontFamily: typography.body.semiBold }]}
                numberOfLines={2}
              >
                {doc.fileName}
              </Text>
              {isProcessing && (
                <View style={[styles.badge, { backgroundColor: `${c.accent}22`, borderColor: `${c.accent}33` }]}>
                  <Text style={[styles.badgeText, { color: c.accent, fontFamily: typography.body.semiBold }]}>
                    Reading...
                  </Text>
                </View>
              )}
              {isFailed && (
                <View style={[styles.badge, { backgroundColor: '#EF444422', borderColor: '#EF444433' }]}>
                  <Text style={[styles.badgeText, { color: '#EF4444', fontFamily: typography.body.semiBold }]}>
                    Failed
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardMeta}>
              <Text style={[styles.metaText, { color: c.textMuted, fontFamily: typography.body.regular }]}>
                {formatBytes(doc.sizeBytes)}
              </Text>
              <Text style={[styles.dot, { color: c.border }]}>·</Text>
              <Clock size={11} color={c.textMuted} strokeWidth={1.5} />
              <Text style={[styles.metaText, { color: c.textMuted, fontFamily: typography.body.regular }]}>
                {new Date(doc.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleDelete} hitSlop={8} onPressIn={(e) => e.stopPropagation()}>
            <Trash2 size={16} color={c.danger} strokeWidth={1.5} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { c } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/api/documents');
      return (res.data?.documents ?? []) as Doc[];
    },
    refetchInterval: (query) => {
      // Poll every 5 seconds if any document is processing
      const docs = query.state.data ?? [];
      const hasProcessing = docs.some((doc: Doc) => doc.ocrStatus === 'processing');
      return hasProcessing ? 5000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (asset: DocumentPicker.DocumentPickerAsset) => {
      // 1. Get presigned upload URL from API
      const presignRes = await api.post('/api/documents/presign', {
        fileName: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        sizeBytes: asset.size ?? 0,
      });

      const { uploadUrl, publicUrl, r2Key } = presignRes.data;

      // 2. Fetch the local URI as a blob (React Native native fetch supports file/content URIs)
      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();

      // 3. Upload raw file bytes directly to Cloudflare R2 via PUT
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': asset.mimeType ?? 'application/octet-stream',
        },
      });

      if (!putResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // 4. Register the uploaded file metadata in the backend
      return api.post('/api/documents/upload', {
        fileName: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        sizeBytes: asset.size ?? 0,
        r2Key,
        publicUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded');
    },
    onError: (err) => {
      console.error('[Upload Mutation Error]', err);
      toast.error('Upload failed');
    },
  });

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/*', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    // File size check — hard limit: 20 MB
    const MAX_BYTES = 20 * 1024 * 1024;
    if (asset.size && asset.size > MAX_BYTES) {
      haptics.error();
      toast.error('File too large', `Maximum upload size is 20 MB. Your file is ${formatBytes(asset.size)}.`);
      return;
    }

    // Page count check — hard limit: 50 pages (PDF only)
    if (asset.mimeType === 'application/pdf') {
      try {
        const fileRes = await fetch(asset.uri);
        const text = await fileRes.text();
        // Count unique /Page dictionary entries; each real page has a /Type /Page entry
        const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
        const pageCount = pageMatches ? pageMatches.length : 0;
        if (pageCount > 50) {
          haptics.error();
          toast.error('Too many pages', `Maximum is 50 pages. This PDF has ${pageCount} pages.`);
          return;
        }
      } catch {
        // If we can't read the file at all, let the server validate
      }
    }

    haptics.medium();
    uploadMutation.mutate(asset);
  };

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
          Documents
        </Text>
        <Button
          onPress={handlePick}
          loading={uploadMutation.isPending}
          style={styles.uploadBtn}
        >
          <Upload size={16} color="#0C0C0E" strokeWidth={2.5} />
        </Button>
      </View>

      {/* Upload limits hint */}
      <View style={[styles.limitBanner, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}25` }]}>
        <Info size={12} color={c.accent} strokeWidth={2} />
        <Text style={[styles.limitText, { color: c.textMuted, fontFamily: typography.body.regular }]}>
          Max{' '}
          <Text style={{ color: c.accent, fontFamily: typography.body.semiBold }}>20 MB</Text>
          {' '}· up to{' '}
          <Text style={{ color: c.accent, fontFamily: typography.body.semiBold }}>50 pages</Text>
          {' '}· PDF, DOCX, TXT, images
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <LegendList
          data={data ?? []}
          keyExtractor={(item: Doc) => item._id}
          estimatedItemSize={80}
          recycleItems
          contentInset={{ top: spacing.sm, bottom: spacing.lg }}
          renderItem={({ item, index }: LegendListRenderItemProps<Doc>) => <DocCard doc={item} index={index} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <EmptyState
                icon={<FileText size={24} color={c.accent} strokeWidth={1.5} />}
                title="No documents"
                message="Upload PDFs, DOCX, or text files as AI context. Max 20 MB · 50 pages."
                actionLabel="Upload document"
                onAction={handlePick}
              />
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: radius.full,
  },
  list: { padding: spacing.lg },
  skeletons: { padding: spacing.lg, gap: spacing.md },
  empty: { paddingTop: spacing['6xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSize['2xs'],
    lineHeight: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: { fontSize: fontSize['2xs'] },
  dot: { fontSize: fontSize.xs },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  limitText: {
    fontSize: fontSize['2xs'],
    lineHeight: 16,
  },
});
