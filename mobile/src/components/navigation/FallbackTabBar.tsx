import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconHome, IconBook, IconTrophy, IconUser } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes } from '@/theme';
import * as haptics from '@/lib/haptics';
import { useResponsive } from '@/hooks/useResponsive';


const ACCENT = '#FF8A1E';
const MUTED = '#8E8E9F';
const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;

const SPRING = { damping: 20, stiffness: 260, mass: 0.7, overshootClamping: false } as const;

const TAB_ICONS = {
  index: IconHome,
  courses: IconBook,
  leaderboard: IconTrophy,
  profile: IconUser,
} as const;

export type FallbackTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; href?: string | null; tabBarAccessibilityLabel?: string } }>;
  navigation: { emit: (e: object) => { defaultPrevented: boolean }; navigate: (name: string) => void };
};

export default function FallbackTabBar({ state, descriptors, navigation }: FallbackTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const visible = useMemo(
    () => state.routes.filter((route) => descriptors[route.key]?.options?.href !== null),
    [state.routes, descriptors],
  );

  const focusedKey = state.routes[state.index]?.key;
  const focusedVisibleIndex = Math.max(0, visible.findIndex((route) => route.key === focusedKey));

  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = visible.length > 0 && barWidth > 0 ? barWidth / visible.length : 0;
  const indicatorX = useSharedValue(0);
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const target = focusedVisibleIndex * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    if (!hasPositioned.current) {
      indicatorX.value = target;
      hasPositioned.current = true;
      return;
    }
    indicatorX.value = withSpring(target, SPRING);
  }, [focusedVisibleIndex, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View
        style={[styles.row, isTablet && styles.rowTablet]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
        )}
        {visible.map((route) => {
          const isFocused = route.key === focusedKey;
          const options = descriptors[route.key]?.options;
          const label = options?.title ?? route.name;
          const Icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? IconHome;
          const color = isFocused ? ACCENT : MUTED;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              onPress={() => {
                haptics.selection();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
            >
              <View style={styles.iconSlot}>
                <Icon size={22} color={color} />
              </View>
              <Text
                style={[
                  styles.label,
                  { color, fontFamily: isFocused ? fontFamilies.sansBold : fontFamilies.sansMedium },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8EE',
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  rowTablet: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: 16,
    backgroundColor: 'rgba(255,138,30,0.16)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 4,
  },
  iconSlot: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.xs,
    paddingHorizontal: 2,
  },
});
