import { Pressable, ScrollView, Text, StyleSheet, View } from 'react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { INK, MUTED } from '@/theme/brand';
import { fileLabel } from '@/lib/playgroundTemplates';

interface Props {
  files: string[];
  active: string;
  onChange: (file: string) => void;
}

export default function FileTabs({ files, active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {files.map((file) => {
        const selected = file === active;
        return (
          <Pressable
            key={file}
            onPress={() => onChange(file)}
            style={[styles.tab, selected && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelOn]}>{fileLabel(file)}</Text>
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
  tab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.sm },
  tabOn: { backgroundColor: '#FFFFFF' },
  label: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.sm, color: MUTED },
  labelOn: { color: INK },
});
