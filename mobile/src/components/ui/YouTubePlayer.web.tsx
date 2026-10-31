import React, { useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme, radii } from '@/theme';
import LoadingSpinner from './LoadingSpinner';

interface YouTubePlayerProps {
  /** A full YouTube URL or a raw 11-char video id. */
  source: string;
  /** Aspect ratio width/height. Defaults to 16:9. */
  aspectRatio?: number;
  /** Optional height override. When provided, aspectRatio is ignored. */
  height?: number;
}

export function parseYouTubeId(source: string): string | null {
  if (!source) return null;
  const trimmed = source.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const longMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|shorts\/|live\/|v\/)|m\.youtube\.com\/watch\?(?:[^&]*&)*v=)([a-zA-Z0-9_-]{11})/,
  );
  if (longMatch) return longMatch[1];

  const fallback = trimmed.match(/([a-zA-Z0-9_-]{11})/);
  return fallback ? fallback[1] : null;
}

export default function YouTubePlayer({
  source,
  aspectRatio = 16 / 9,
  height,
}: YouTubePlayerProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const videoId = parseYouTubeId(source);
  const computedHeight = height ?? (containerWidth > 0 ? Math.round(containerWidth / aspectRatio) : 240);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  if (!videoId) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surfaceCard }]}>
        <LoadingSpinner size="small" fill={false} />
      </View>
    );
  }

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        { backgroundColor: colors.surfaceCard, borderRadius: radii.lg },
        height ? { height } : { height: computedHeight },
      ]}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: radii.lg,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fallback: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
