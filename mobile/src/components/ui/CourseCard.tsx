import { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { IconBook2, IconArrowRight, IconSparkles } from "@tabler/icons-react-native";
import { fontFamilies, fontSizes, spacing } from "@/theme";
import { ACCENT, FAINT, INK, MUTED, TINT_GLASS } from "@/theme/brand";
import { Course } from "@/lib/types";
import GlassSurface from "./GlassSurface";

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
}

export default function CourseCard({ course, onPress }: CourseCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(course.banner) && !imgError;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <GlassSurface style={styles.card} isInteractive tintColor={TINT_GLASS}>
        <View style={styles.bannerContainer}>
          {showImage ? (
            <Image
              source={{ uri: course.banner }}
              style={styles.banner}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.banner, styles.bannerFallback]}>
              <IconBook2 size={36} color={FAINT} />
            </View>
          )}
          {course.isAiGenerated ? (
            <View style={styles.badgeOverlay}>
              <View style={styles.aiBadge}>
                <IconSparkles size={12} color="#5B4FE8" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {course.title}
          </Text>
          {course.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {course.description}
            </Text>
          ) : null}
          <View style={styles.footerRow}>
            <Text style={styles.category}>{course.category}</Text>
            <View style={styles.continueLink}>
              <Text style={styles.continueLinkText}>
                {course.isFree ? "Free" : "Premium"}
              </Text>
              <IconArrowRight size={14} color={ACCENT} />
            </View>
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 20,
  },
  bannerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(14,14,26,0.04)",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,14,26,0.04)",
  },
  badgeOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(231,227,251,0.95)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
    color: "#5B4FE8",
    letterSpacing: 0.4,
  },
  body: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    color: MUTED,
    lineHeight: fontSizes.sm * 1.45,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  category: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sansMedium,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  continueLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  continueLinkText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
