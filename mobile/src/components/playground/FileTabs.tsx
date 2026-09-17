import { Pressable, ScrollView, Text, StyleSheet, View } from 'react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { INK, MUTED } from '@/theme/brand';
import { fileLabel } from '@/lib/playgroundTemplates';

interface Props {
  files: string[];
  active: string;
  onChange: (file: string) => void;
  compact?: boolean;
}

export default function FileTabs({ files, active, onChange, compact }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, compact && styles.rowCompact]}>
      {files.map((file) => {
        const selected = file === active;
        return (
          <Pressable
            key={file}
            onPress={() => onChange(file)}
            style={[styles.tab, compact && styles.tabCompact, selected && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, compact && styles.labelCompact, selected && styles.labelOn]}>{fileLabel(file)}</Text>
          </Pressable>
        );
      })}
      <View style={{ width: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    backgroundColor: '#ECE8DF',
    padding: 4,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  rowCompact: {
    padding: 2,
    gap: 2,
  },
  tab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.sm },
  tabCompact: { paddingVertical: 4, paddingHorizontal: 8 },
  tabOn: { backgroundColor: '#FFFFFF' },
  label: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.sm, color: MUTED },
  labelCompact: { fontSize: fontSizes.xs },
  labelOn: { color: INK },
});
