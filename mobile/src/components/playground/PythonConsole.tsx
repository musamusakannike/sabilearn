import { ScrollView, Text, StyleSheet } from 'react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';

interface Props {
  stdout: string;
  stderr: string;
  placeholder?: string;
}

export default function PythonConsole({ stdout, stderr, placeholder }: Props) {
  const empty = !stdout && !stderr;
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      {empty ? (
        <Text style={styles.muted}>{placeholder || 'Output will appear here once you run your code.'}</Text>
      ) : null}
      {!!stdout && <Text style={styles.out}>{stdout}</Text>}
      {!!stderr && <Text style={styles.err}>{stderr}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0E0E1A', borderRadius: radii.md },
  content: { padding: spacing.base, gap: spacing.sm },
  out: { color: '#EDEDF5', fontFamily: fontFamilies.sans, fontSize: fontSizes.sm, lineHeight: 22 },
  err: { color: '#FF8A8F', fontFamily: fontFamilies.sans, fontSize: fontSizes.sm, lineHeight: 22 },
  muted: { color: '#8B8BA0', fontFamily: fontFamilies.sans, fontSize: fontSizes.sm },
});
