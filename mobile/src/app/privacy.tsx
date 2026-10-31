import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconExternalLink } from '@tabler/icons-react-native';
import * as WebBrowser from 'expo-web-browser';
import { fontFamilies, spacing } from '@/theme';
import { INK, MUTED, TINT_GLASS } from '@/theme/brand';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassIconButton from '@/components/common/GlassIconButton';
import GlassSurface from '@/components/ui/GlassSurface';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const handleOpenWeb = () => {
    WebBrowser.openBrowserAsync('https://sabilearn.online/privacy');
  };

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <ResponsiveContainer maxWidth={760} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Privacy"
          subtitle="How we collect and protect your data."
          showBack
          right={
            <GlassIconButton onPress={handleOpenWeb} accessibilityLabel="Open full policy">
              <IconExternalLink size={18} color={INK} />
            </GlassIconButton>
          }
        />
        <Text style={styles.lastUpdated}>Last updated: August 2026</Text>
        <GlassSurface style={styles.card} tintColor={TINT_GLASS}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            SabiLearn collects personal information necessary to provide our educational services, including your name, email address, profile preferences, and learning progress metrics.
          </Text>
          <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            Your data is used to personalize flashcard reviews, track course progress, deliver notifications, improve AI tutor recommendations, and sync learning states across your devices.
          </Text>
          <Text style={styles.sectionTitle}>3. Data Security & Storage</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard encryption protocols (TLS/SSL) to protect your account credentials and transmission of study metrics. We do not sell your personal information to third parties.
          </Text>
          <Text style={styles.sectionTitle}>4. Your Rights & Account Deletion</Text>
          <Text style={styles.paragraph}>
            You have full control over your personal data. You can export or delete your profile and account history at any time directly through the app settings or by contacting privacy@sabilearn.online.
          </Text>
        </GlassSurface>
      </ScrollView>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  lastUpdated: { fontSize: 12, fontFamily: fontFamilies.sans, color: MUTED, marginBottom: spacing.md },
  card: { borderRadius: 20, padding: spacing.lg, overflow: 'hidden', gap: spacing.md },
  sectionTitle: { fontSize: 17, fontFamily: fontFamilies.sansBold, color: INK, letterSpacing: -0.2 },
  paragraph: { fontSize: 15, fontFamily: fontFamilies.sans, color: MUTED, lineHeight: 22 },
});
