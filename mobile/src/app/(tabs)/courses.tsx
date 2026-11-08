import { useEffect, useState, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconSearch, IconBook, IconSparkles } from "@tabler/icons-react-native";
import { courseApi, courseArchitectApi } from "@/lib/api";
import { Course } from "@/lib/types";
import { cacheCourses, getCachedCourses } from "@/lib/offlineSync";
import { getBundledCourseList } from "@/lib/offlineCourses";
import CourseCard from "@/components/ui/CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import GlassSurface from "@/components/ui/GlassSurface";
import NativeSegmentedControl from "@/components/ui/NativeSegmentedControl";
import Button from "@/components/ui/Button";
import ScreenBackdrop from "@/components/common/ScreenBackdrop";
import ScreenHeader from "@/components/common/ScreenHeader";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { useResponsive } from "@/hooks/useResponsive";
import { fontFamilies, spacing } from "@/theme";
import { ACCENT, FAINT, INK, MUTED, TINT_GLASS } from "@/theme/brand";
import * as haptics from "@/lib/haptics";

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [segment, setSegment] = useState(0);
  const [trackSegment, setTrackSegment] = useState(0);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalog = useCallback(async () => {
    const bundled = getBundledCourseList();
    try {
      const res = await courseApi.list();
      const data: Course[] = res.data.data;
      // Merge bundled courses if not present
      const map = new Map<string, Course>();
      data.forEach((c) => map.set(c._id, c));
      bundled.forEach((bc) => {
        if (!map.has(bc._id)) map.set(bc._id, bc);
      });
      const merged = Array.from(map.values());
      setCourses(merged);
      await cacheCourses(merged);
    } catch {
      const cached = await getCachedCourses();
      const map = new Map<string, Course>();
      cached.forEach((c) => map.set(c._id, c));
      bundled.forEach((bc) => {
        if (!map.has(bc._id)) map.set(bc._id, bc);
      });
      setCourses(Array.from(map.values()));
    }
  }, []);

  const loadMine = useCallback(async () => {
    try {
      const res = await courseArchitectApi.myCourses({ limit: 50 });
      setMine(res.data?.data || []);
    } catch {
      // keep previous mine list if offline
    }
  }, []);

  const loadCourses = useCallback(async () => {
    await Promise.all([loadCatalog(), loadMine()]);
    setIsLoading(false);
  }, [loadCatalog, loadMine]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initial catalog fetch */
    void loadCourses();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadCourses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await loadCourses();
    setRefreshing(false);
  }, [loadCourses]);

  const source = segment === 1 ? mine : courses;
  const filtered = source.filter((c) => {
    if (trackSegment === 1 && (c.track || "tech") !== "tech") return false;
    if (trackSegment === 2 && c.track !== "academic") return false;
    const q = query.trim().toLowerCase();
    const compactQ = q.replace(/\s+/g, "");
    const code = c.academicMeta?.courseCode?.toLowerCase() || "";
    const compactCode = code.replace(/\s+/g, "");
    const matchesCode = code.includes(q) || (compactQ ? compactCode.includes(compactQ) : false);
    const matchesTags = (c.tags || []).some(
      (t) => t.toLowerCase().includes(q) || (compactQ && t.toLowerCase().replace(/\s+/g, "").includes(compactQ))
    );

    return (
      c.title.toLowerCase().includes(q) ||
      matchesCode ||
      matchesTags ||
      (c.academicMeta?.department && c.academicMeta.department.toLowerCase().includes(q))
    );
  });

  const { isTablet, isDesktop } = useResponsive();
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  if (isLoading) return <LoadingSpinner />;

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />
      <ResponsiveContainer maxWidth={1200} paddingHorizontal={0} style={{ flex: 1, width: "100%" }}>
        <FlatList
          key={`courses-${numColumns}`}
          data={filtered}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.list, { paddingTop: insets.top + 8 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <ScreenHeader
                title="Courses"
                subtitle="Pick a track and start building."
              />
              <GlassSurface
                style={styles.searchBar}
                tintColor={TINT_GLASS}
                glassEffectStyle="clear"
              >
                <IconSearch size={18} color={MUTED} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search courses"
                  placeholderTextColor={FAINT}
                  style={styles.searchInput}
                />
              </GlassSurface>
              <NativeSegmentedControl
                values={["All Tracks", "Tech Skills", "Academic Hub"]}
                selectedIndex={trackSegment}
                onChange={(idx) => {
                  haptics.selection();
                  setTrackSegment(idx);
                }}
              />
              <View style={{ marginTop: spacing.xs }}>
                <NativeSegmentedControl
                  values={["Catalog", "Yours"]}
                  selectedIndex={segment}
                  onChange={setSegment}
                />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.cardItem, numColumns > 1 && styles.cardItemGrid]}>
              <CourseCard
                course={item}
                onPress={() => {
                  haptics.light();
                  router.push(`/course/${item._id}` as any);
                }}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            segment === 1 ? (
              <EmptyState
                icon={<IconSparkles size={44} color={FAINT} />}
                title="No generated courses yet"
                description="Turn notes or a prompt into a full course."
                action={
                  <Button
                    variant="ai"
                    onPress={() => {
                      haptics.light();
                      router.push("/generate-course" as any);
                    }}
                  >
                    Generate course
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<IconBook size={44} color={FAINT} />}
                title="No courses found"
                description="Try a different search, or check back later."
              />
            )
          }
          ListFooterComponent={<View style={{ height: spacing["4xl"] }} />}
        />
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBlock: { marginBottom: spacing.lg, gap: spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 18,
    paddingHorizontal: spacing.base,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamilies.sans,
    color: INK,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing["4xl"] },
  columnWrapper: {
    gap: spacing.md,
  },
  cardItem: {
    width: "100%",
  },
  cardItemGrid: {
    flex: 1,
  },
});
