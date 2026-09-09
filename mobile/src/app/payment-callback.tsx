import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconCircleCheck, IconCircleX, IconClock } from '@tabler/icons-react-native';
import { paymentApi } from '@/lib/api';
import { VerifyResponse } from '@/lib/types';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassSurface from '@/components/ui/GlassSurface';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fontFamilies, spacing } from '@/theme';
import { INK, MUTED, TINT_GLASS } from '@/theme/brand';

export default function PaymentCallbackScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const reference = params.reference || params.trxref;
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reference) {
      setIsLoading(false);
      setError('Missing payment reference.');
      return;
    }
    (async () => {
      try {
        const res = await paymentApi.verify(reference);
        setResult(res.data?.data ?? null);
      } catch (e) {
        const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
        setError(message || 'Could not confirm payment status.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [reference]);

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <View style={[styles.inner, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing.lg }]}>
        <ScreenHeader title="Checkout" subtitle="Payment confirmation." showBack onBack={() => router.replace('/(tabs)/courses')} />
        <GlassSurface style={styles.card} tintColor={TINT_GLASS}>
          {isLoading ? (
            <>
              <LoadingSpinner fill={false} />
              <Text style={styles.body}>Confirming your payment…</Text>
            </>
          ) : error || !result ? (
            <>
              <IconCircleX size={40} color="#E5484D" />
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.body}>{error}</Text>
            </>
          ) : result.status === 'success' ? (
            <>
              <IconCircleCheck size={40} color="#1F9D55" />
              <Text style={styles.title}>Payment successful</Text>
              <Text style={styles.body}>
                {result.type === 'subscription'
                  ? 'You now have all-access. It may take a few seconds to reflect everywhere.'
                  : 'This course is now unlocked.'}
              </Text>
            </>
          ) : result.status === 'pending' ? (
            <>
              <IconClock size={40} color="#D97706" />
              <Text style={styles.title}>Payment pending</Text>
              <Text style={styles.body}>We're still waiting for confirmation. Check back in a moment.</Text>
            </>
          ) : (
            <>
              <IconCircleX size={40} color="#E5484D" />
              <Text style={styles.title}>Payment failed</Text>
              <Text style={styles.body}>Your payment wasn't completed. No charge should have been made.</Text>
            </>
          )}
          <Button fullWidth variant={result?.status === 'success' ? 'primary' : 'secondary'} onPress={() => router.replace('/(tabs)/courses')}>
            Back to courses
          </Button>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, paddingHorizontal: spacing.lg },
  card: {
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  title: { fontSize: 18, fontFamily: fontFamilies.sansBold, color: INK, textAlign: 'center' },
  body: { fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: spacing.sm },
});
