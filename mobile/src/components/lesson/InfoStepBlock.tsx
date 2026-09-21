import { useState } from 'react';
import { View, Text, Image, StyleSheet, Linking, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconMaximize, IconX } from '@tabler/icons-react-native';
import { useTheme, fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { TopicContent } from '@/lib/types';
import LatexRenderer from '@/components/ui/LatexRenderer';
import RichMathText from '@/components/ui/RichMathText';
import CodeRenderer from '@/components/ui/CodeRenderer';
import YouTubePlayer from '@/components/ui/YouTubePlayer';
import * as haptics from '@/lib/haptics';

function FullscreenLessonImage({ uri, title }: { uri: string; title?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <View style={styles.imageContainer}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setIsFullscreen(true);
          }}
          style={({ pressed }) => [
            styles.imagePressable,
            { opacity: pressed ? 0.92 : 1 },
          ]}
          accessibilityLabel="View image fullscreen"
        >
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.fullscreenBadge}>
            <IconMaximize size={14} color="#FFFFFF" />
            <Text style={styles.fullscreenBadgeText}>Fullscreen</Text>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={isFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.fullscreenModalWrap} edges={['top', 'bottom']}>
          {/* Top Header */}
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {title || 'Image Preview'}
            </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                setIsFullscreen(false);
              }}
              hitSlop={15}
              style={styles.fullscreenCloseBtn}
              accessibilityLabel="Close fullscreen image"
            >
              <IconX size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Pinch-to-zoom Fullscreen Scroll Area */}
          <ScrollView
            contentContainerStyle={styles.fullscreenScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent={true}
          >
            <Image
              source={{ uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function FormattedParagraph({ text, colors }: { text: string; colors: any }) {
  if (/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.test(text)) {
    return (
      <RichMathText
        text={text}
        style={[styles.paragraph, { color: colors.textPrimary }]}
        color={colors.textPrimary}
        fontSize={fontSizes.lg}
      />
    );
  }
  // Support [text](url), **bold/highlight**, and plain text
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);

  return (
    <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
      {parts.map((part, pIdx) => {
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <Text
              key={pIdx}
              onPress={() => Linking.openURL(linkMatch[2]).catch(() => {})}
              style={[styles.linkText, { color: '#0084FE' }]}
            >
              {linkMatch[1]}
            </Text>
          );
        }
        const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
        if (boldMatch) {
          return (
            <Text key={pIdx} style={[styles.boldHighlight, { color: '#0084FE' }]}>
              {boldMatch[1]}
            </Text>
          );
        }
        return <Text key={pIdx}>{part}</Text>;
      })}
    </Text>
  );
}

export default function InfoStepBlock({ content }: { content: TopicContent }) {
  const { colors } = useTheme();

  switch (content.type) {
    case 'latex':
      return <LatexRenderer expression={content.content} />;
    case 'code':
      return <CodeRenderer code={content.content} language={content.language} />;
    case 'youtube':
    case 'video':
      return <YouTubePlayer source={content.content} />;
    case 'image':
      return (
        <FullscreenLessonImage
          uri={content.content}
          title={content.title}
        />
      );
    case 'audio':
      return (
        <View style={[styles.audioBlock, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{content.content}</Text>
        </View>
      );
    case 'group':
      return (
        <View style={[styles.groupWrap]}>
          {/* {!!content.content && (
            <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>{content.content}</Text>
          )} */}
          {(content.blocks || []).map((subBlock, bIdx) => (
            <InfoStepBlock key={bIdx} content={subBlock} />
          ))}
        </View>
      );
    case 'text':
    default:
      return (
        <View style={styles.textContainer}>
          {content.content
            .split(/\n\n+/)
            .filter((p) => p.trim().length > 0)
            .map((paragraph, pIdx) => (
              <View key={pIdx} style={styles.paragraphWrap}>
                <FormattedParagraph text={paragraph} colors={colors} />
              </View>
            ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  textContainer: {
    gap: spacing.base,
  },
  paragraphWrap: {
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.sans,
    lineHeight: fontSizes.lg * 1.6,
  },
  boldHighlight: {
    fontFamily: fontFamilies.sansBold || fontFamilies.sansMedium,
    fontWeight: '700',
  },
  linkText: {
    fontFamily: fontFamilies.sansBold || fontFamilies.sansMedium,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  imagePressable: {
    width: '100%',
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: radii.xl,
  },
  fullscreenBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  fullscreenBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansSemiBold,
  },
  fullscreenModalWrap: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    zIndex: 10,
  },
  fullscreenTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansSemiBold,
    flex: 1,
    marginRight: spacing.md,
  },
  fullscreenCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  audioBlock: {
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  groupWrap: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  groupTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.displaySemiBold,
    marginBottom: spacing.xs,
  },
});
