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
import { useAppReview } from "@/hooks/useAppReview";
import { cacheCourses, getCachedCourses } from "@/lib/offlineSync";
import CourseCard from "@/components/ui/CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import GlassSurface from "@/components/ui/GlassSurface";
import NativeSegmentedControl from "@/components/ui/NativeSegmentedControl";
import Button from "@/components/ui/Button";
import ScreenBackdrop from "@/components/common/ScreenBackdrop";
import ScreenHeader from "@/components/common/ScreenHeader";
import { fontFamilies, spacing } from "@/theme";
import { ACCENT, FAINT, INK, MUTED, TINT_GLASS } from "@/theme/brand";
import * as haptics from "@/lib/haptics";

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { inReview } = useAppReview();
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [segment, setSegment] = useState(0);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await courseApi.list();
      const data: Course[] = res.data.data;
      setCourses(data);
      await cacheCourses(data);
    } catch {
      const cached = await getCachedCourses();
      setCourses(cached);
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
    await Promise.all([loadCatalog(), inReview ? Promise.resolve() : loadMine()]);
    setIsLoading(false);
  }, [inReview, loadCatalog, loadMine]);

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

  const source = segment === 1 && !inReview ? mine : courses;
  const filtered = source.filter((c) => {
    if (inReview && !c.isFree) return false;
    return c.title.toLowerCase().includes(query.toLowerCase());
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />
      <FlatList
        data={filtered}
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
            {!inReview ? (
              <NativeSegmentedControl
                values={["Catalog", "Yours"]}
                selectedIndex={segment}
                onChange={setSegment}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => {
              haptics.light();
              router.push(`/course/${item._id}` as any);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          segment === 1 && !inReview ? (
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
});
