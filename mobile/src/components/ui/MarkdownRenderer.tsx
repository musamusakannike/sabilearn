import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export default function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () => ({
      body: {
        color: colors.textPrimary,
        fontFamily: fontFamilies.sans,
        fontSize: fontSizes.md,
        lineHeight: fontSizes.md * 1.55,
      },
      heading1: {
        color: colors.textPrimary,
        fontFamily: fontFamilies.displaySemiBold,
        fontSize: fontSizes.xl,
        fontWeight: '800' as const,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      heading2: {
        color: colors.textPrimary,
        fontFamily: fontFamilies.displaySemiBold,
        fontSize: fontSizes.lg,
        fontWeight: '700' as const,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      heading3: {
        color: colors.textPrimary,
        fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
        fontSize: fontSizes.base,
        fontWeight: '700' as const,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: spacing.sm,
      },
      strong: {
        fontWeight: '800' as const,
        fontFamily: fontFamilies.sansBold || fontFamilies.sansSemiBold,
        color: colors.textPrimary,
      },
      em: {
        fontStyle: 'italic' as const,
      },
      bullet_list: {
        marginBottom: spacing.sm,
      },
      ordered_list: {
        marginBottom: spacing.sm,
      },
      list_item: {
        flexDirection: 'row' as const,
        justifyContent: 'flex-start' as const,
        alignItems: 'flex-start' as const,
        marginBottom: 4,
      },
      code_inline: {
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceSunken,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radii.sm,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: fontSizes.xs,
        color: '#0084FE',
      },
      code_block: {
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceSunken,
        padding: spacing.md,
        borderRadius: radii.md,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: fontSizes.xs,
        lineHeight: fontSizes.xs * 1.5,
        color: colors.textPrimary,
        marginVertical: spacing.sm,
      },
      fence: {
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceSunken,
        padding: spacing.md,
        borderRadius: radii.md,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: fontSizes.xs,
        lineHeight: fontSizes.xs * 1.5,
        color: colors.textPrimary,
        marginVertical: spacing.sm,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: '#FF8A00',
        backgroundColor: colors.surfaceSunken,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginVertical: spacing.xs,
        borderRadius: radii.sm,
      },
      link: {
        color: '#0084FE',
        textDecorationLine: 'underline' as const,
      },
      hr: {
        backgroundColor: colors.borderSubtle,
        height: 1,
        marginVertical: spacing.md,
      },
    }),
    [colors]
  );

  return (
    <View style={localStyles.wrap}>
      <Markdown style={styles}>
        {content}
      </Markdown>
      {isStreaming && (
        <View style={localStyles.streamingIndicator}>
          <View style={localStyles.cursorDot} />
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cursorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF8A00',
  },
});
