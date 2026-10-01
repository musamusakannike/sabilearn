import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { topicApi } from '@/lib/api';
import { Topic } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import StepPlayer from '@/components/lesson/StepPlayer';
import { fontFamilies, spacing } from '@/theme';
import { INK, MUTED, ACCENT } from '@/theme/brand';

const MAX_POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 4000;

export default function TopicLearnScreen() {
  const { id, topicId } = useLocalSearchParams<{ id: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [errorState, setErrorState] = useState<'not_found' | 'generation_failed' | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTopic = useCallback(async (attempt: number = 0): Promise<void> => {
    if (!topicId) return;
    try {
      const res = await topicApi.get(topicId);
      const fetchedTopic: Topic = res.data.data;

      if (!fetchedTopic) {
        setErrorState('not_found');
        setIsLoading(false);
        setIsPolling(false);
        return;
      }

      // If topic has contents, we're done — render the lesson
      if (fetchedTopic.contents && fetchedTopic.contents.length > 0) {
        setTopic(fetchedTopic);
        setIsLoading(false);
        setIsPolling(false);
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        return;
      }

      // Topic exists but has no contents yet — AI may still be generating on the server.
      // Poll again unless we've exhausted retries.
      if (attempt < MAX_POLL_ATTEMPTS) {
        setIsPolling(true);
        setIsLoading(false);
        setPollAttempt(attempt + 1);
        pollTimerRef.current = setTimeout(() => {
          fetchTopic(attempt + 1);
        }, POLL_INTERVAL_MS);
      } else {
        // Ran out of retries — show the topic anyway (StepPlayer handles empty state gracefully)
        setTopic(fetchedTopic);
        setIsPolling(false);
        setIsLoading(false);
        setErrorState('generation_failed');
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setErrorState('not_found');
        setIsLoading(false);
        setIsPolling(false);
      } else if (attempt < MAX_POLL_ATTEMPTS) {
        // Network error or server timeout — retry gracefully
        setIsPolling(true);
        setIsLoading(false);
        setPollAttempt(attempt + 1);
        pollTimerRef.current = setTimeout(() => {
          fetchTopic(attempt + 1);
        }, POLL_INTERVAL_MS);
      } else {
        setErrorState('generation_failed');
        setIsLoading(false);
        setIsPolling(false);
      }
    }
  }, [topicId]);

  useEffect(() => {
    fetchTopic(0);
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchTopic]);

  const handleClose = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    router.replace(`/course/${id}` as any);
  };

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

  // AI is actively generating content — show a friendly polling UI
  if (isPolling) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingTitle}>✨ AI is crafting your lesson…</Text>
        <Text style={styles.loadingSubtitle}>
          Your personalised content is being generated.{'\n'}This usually takes 15–30 seconds.
        </Text>
        <Text style={styles.pollAttemptText}>
          Checking for content ({pollAttempt}/{MAX_POLL_ATTEMPTS})
        </Text>
      </View>
    );
  }

  if (errorState === 'not_found') {
    return <EmptyState title="Topic not found" />;
  }

  if (!topic) return <EmptyState title="Topic not found" />;

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
    gap: spacing.sm,
  },
  loadingTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
  },
  pollAttemptText: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontFamily: fontFamilies.sans,
    color: ACCENT,
    textAlign: 'center',
  },
});
