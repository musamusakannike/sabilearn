import { Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { IconLock } from '@tabler/icons-react-native';
import { Course, PaymentStatus } from '@/lib/types';
import { useIapPurchase } from '@/hooks/useIapPurchase';
import GlassSurface from '@/components/ui/GlassSurface';
import Button from '@/components/ui/Button';
import { fontFamilies, spacing } from '@/theme';
import { INK, MUTED, TINT_ORANGE } from '@/theme/brand';

interface CoursePaywallProps {
  course: Course;
  paymentStatus: PaymentStatus | null;
  onUnlocked: () => void;
}

export default function CoursePaywall({ course, paymentStatus, onUnlocked }: CoursePaywallProps) {
  const { priceString, busy, purchase } = useIapPurchase();
  const subActive = paymentStatus?.subscription?.status === 'active';

  const onSubscribe = async () => {
    const ok = await purchase();
    if (ok) onUnlocked();
  };

  return (
    <GlassSurface style={styles.card} tintColor={TINT_ORANGE}>
      <View style={styles.row}>
        <IconLock size={18} color={INK} />
        <Text style={styles.title}>Premium course</Text>
      </View>
      <Text style={styles.body}>
        {course.title} is included in SabiLearn Premium. Subscribe with the App Store or Google Play to unlock every premium course.
      </Text>
      {!subActive && (
        <Button fullWidth loading={busy} onPress={() => void onSubscribe()}>
          Subscribe{priceString ? ` · ${priceString}` : ''}
        </Button>
      )}
      <Button fullWidth variant="secondary" onPress={() => router.push('/subscribe')}>
        View all-access
      </Button>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.base, gap: spacing.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 16, fontFamily: fontFamilies.sansBold, color: INK },
  body: { fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, lineHeight: 20 },
});
