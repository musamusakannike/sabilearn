import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { spacing } from '@/theme';
import ScreenBackdrop from './ScreenBackdrop';
import ScreenHeader from './ScreenHeader';

import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function StudyChrome({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <ResponsiveContainer maxWidth={760} paddingHorizontal={0} style={{ flex: 1, width: '100%' }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <ScreenHeader title={title} showBack onBack={() => router.back()} />
        </View>
        <View style={styles.body}>{children}</View>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: spacing.lg },
  body: { flex: 1, paddingHorizontal: spacing.lg },
});
