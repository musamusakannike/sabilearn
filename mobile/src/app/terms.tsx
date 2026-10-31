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

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const handleOpenWeb = () => {
    WebBrowser.openBrowserAsync('https://sabilearn.online/terms');
  };

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <ResponsiveContainer maxWidth={760} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Terms"
          subtitle="The agreement that covers using SabiLearn."
          showBack
          right={
            <GlassIconButton onPress={handleOpenWeb} accessibilityLabel="Open full terms">
              <IconExternalLink size={18} color={INK} />
            </GlassIconButton>
          }
        />
        <Text style={styles.lastUpdated}>Last updated: August 2026</Text>
        <GlassSurface style={styles.card} tintColor={TINT_GLASS}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By creating an account or using the SabiLearn mobile app, you agree to comply with and be bound by these Terms of Service.
          </Text>
          <Text style={styles.sectionTitle}>2. User Accounts & Access</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your credentials. You agree not to share account access or misuse AI tutoring and course material.
          </Text>
          <Text style={styles.sectionTitle}>3. Content & Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All study materials, flashcards, MCQs, and software rights belong to SabiLearn. You are granted a personal, non-exclusive license to use materials for personal learning.
          </Text>
          <Text style={styles.sectionTitle}>4. Service Availability</Text>
          <Text style={styles.paragraph}>
            We continuously update learning content and system features. We reserve the right to modify or temporarily suspend aspects of the service for scheduled maintenance.
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
