import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { topicApi } from '@/lib/api';
import { Topic } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StepPlayer from '@/components/lesson/StepPlayer';
import { fontFamilies, spacing } from '@/theme';
import { INK, MUTED } from '@/theme/brand';

export default function TopicLearnScreen() {
  const { id, topicId } = useLocalSearchParams<{ id: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!topicId) return;
    try {
      const res = await topicApi.get(topicId);
      setTopic(res.data.data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingTitle}>Preparing your lesson…</Text>
        <Text style={styles.loadingSubtitle}>
          Formatting interactive steps and practice check-ins
        </Text>
      </View>
    );
  }
  if (!topic) return <EmptyState title="Topic not found" />;

  const handleClose = () => {
    router.replace(`/course/${id}` as any);
  };

  return (
    <StepPlayer
      topic={topic}
      onClose={handleClose}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    textAlign: 'center',
  },
});
