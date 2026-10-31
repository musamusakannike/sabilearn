import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconBell, IconCircleCheck } from '@tabler/icons-react-native';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/lib/types';
import { isWebUrl, mapActionUrlToMobileRoute, openWebUrl, setBadgeCount } from '@/lib/notifications';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import GlassSurface from '@/components/ui/GlassSurface';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { fontFamilies, spacing } from '@/theme';
import { ACCENT, FAINT, INK, MUTED, TINT_GLASS, TINT_ORANGE } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.list();
      const data: Notification[] = res.data.data;
      setItems(data);
      await setBadgeCount(data.filter((n) => !n.isRead).length);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = async (n: Notification) => {
    haptics.light();
    if (!n.isRead) {
      try {
        await notificationApi.markRead(n._id);
        setItems((prev) => {
          const updated = prev.map((i) => (i._id === n._id ? { ...i, isRead: true } : i));
          setBadgeCount(updated.filter((i) => !i.isRead).length);
          return updated;
        });
      } catch {
        // non-fatal
      }
    }
    if (n.actionUrl) {
      if (isWebUrl(n.actionUrl)) {
        void openWebUrl(n.actionUrl);
      } else {
        router.push(mapActionUrlToMobileRoute(n.actionUrl) as any);
      }
    }
  };

  const markAllRead = async () => {
    haptics.light();
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
      setBadgeCount(0);
    } catch {
      // non-fatal
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.list, { paddingTop: insets.top + 8 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />}
          ListHeaderComponent={
            <ScreenHeader
              title="Alerts"
              showBack
              right={
                items.some((i) => !i.isRead) ? (
                  <Pressable onPress={markAllRead} hitSlop={8} accessibilityLabel="Mark all as read" accessibilityRole="button">
                    <Text style={styles.markAll}>Mark all read</Text>
                  </Pressable>
                ) : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)} style={({ pressed }) => [pressed && styles.pressed]}>
              <GlassSurface style={styles.card} isInteractive tintColor={item.isRead ? TINT_GLASS : TINT_ORANGE}>
                <View style={styles.row}>
                  {!item.isRead ? <View style={styles.dot} /> : <IconCircleCheck size={16} color={FAINT} style={{ marginTop: 2 }} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              </GlassSurface>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState icon={<IconBell size={44} color={FAINT} />} title="No notifications yet" description="We'll let you know when there's something new." />
          }
        />
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  markAll: { fontSize: 15, fontFamily: fontFamilies.sansBold, color: INK },
  card: { borderRadius: 18, padding: spacing.base, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: ACCENT },
  notifTitle: { fontSize: 16, fontFamily: fontFamilies.sansBold, color: INK, marginBottom: 2, letterSpacing: -0.2 },
  notifMessage: { fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, lineHeight: 20 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
