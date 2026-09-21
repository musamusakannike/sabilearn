import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { fontFamilies } from '@/theme';
import { ACCENT, INK, MUTED } from '@/theme/brand';
import GlassSurface, { GlassCluster } from '@/components/ui/GlassSurface';
import * as haptics from '@/lib/haptics';

interface NativeSegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function NativeSegmentedControl({
  values,
  selectedIndex,
  onChange,
}: NativeSegmentedControlProps) {
  if (Platform.OS === 'ios') {
    return (
      <SegmentedControl
        values={values}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          haptics.light();
          onChange(event.nativeEvent.selectedSegmentIndex);
        }}
        appearance="light"
        tintColor="#FFFFFF"
        style={styles.native}
      />
    );
  }

  return (
    <GlassCluster spacing={8} style={styles.row}>
      {values.map((label, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable
            key={label}
            onPress={() => {
              haptics.light();
              onChange(index);
            }}
            style={({ pressed }) => [styles.itemWrap, pressed && styles.pressed]}
          >
            <GlassSurface
              style={styles.item}
              tintColor={selected ? 'rgba(255,138,30,0.28)' : 'rgba(255,255,255,0.38)'}
              isInteractive
              fallbackStyle={selected ? styles.itemSelectedFallback : undefined}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            </GlassSurface>
          </Pressable>
        );
      })}
    </GlassCluster>
  );
}

const styles = StyleSheet.create({
  native: {
    height: 36,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  itemWrap: {
    flex: 1,
  },
  item: {
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemSelectedFallback: {
    backgroundColor: '#FFF7EE',
    borderColor: ACCENT,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: MUTED,
  },
  labelSelected: {
    fontFamily: fontFamilies.sansBold,
    color: INK,
  },
  pressed: {
    opacity: 0.9,
  },
});
