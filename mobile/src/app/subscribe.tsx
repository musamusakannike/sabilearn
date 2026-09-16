import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconCheck, IconSparkles } from '@tabler/icons-react-native';
import { paymentApi } from '@/lib/api';
import { PaymentStatus } from '@/lib/types';
import { useIapPurchase } from '@/hooks/useIapPurchase';
import { usePaystackPurchase } from '@/hooks/usePaystackPurchase';
import { useAppReview } from '@/hooks/useAppReview';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassSurface from '@/components/ui/GlassSurface';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fontFamilies, spacing } from '@/theme';
import { ACCENT, INK, MUTED, TINT_GLASS, TINT_ORANGE } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

const IOS_PERKS = [
  'Every premium course, current and future',
  'Billed through Apple — cancel anytime in your store account',
];

const ANDROID_PERKS = [
  'Every premium course, current and future',
  'Pay with card, bank transfer or USSD via Paystack',
];

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const { inReview } = useAppReview();
  const iap = useIapPurchase();
  const paystack = usePaystackPurchase();
  const isAndroid = Platform.OS === 'android';
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await paymentApi.me();
      setStatus(res.data?.data ?? null);
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (inReview) {
      router.replace('/(tabs)/profile');
      return;
    }
    void load();
  }, [inReview, load]);

  const onRefresh = useCallback(async () => {
    haptics.light();
    setRefreshing(true);
    await Promise.all([load(), isAndroid ? Promise.resolve() : iap.reload()]);
    setRefreshing(false);
  }, [load, iap, isAndroid]);

  const onPurchase = async () => {
    const ok = isAndroid ? await paystack.purchaseSubscription() : await iap.purchase();
    if (ok) {
      Alert.alert('You are Premium', 'All premium courses are unlocked.');
      await load();
    }
  };

  const onRestore = async () => {
    const ok = await iap.restore();
    if (ok) {
      Alert.alert('Restored', 'Your subscription is active on this account.');
      await load();
    }
  };

  const openManage = () => {
    void Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  if (inReview) return null;
  if (isLoading) return <LoadingSpinner />;

  const sub = status?.subscription;
  const isActive = sub?.status === 'active';
  const isIap = sub?.billingType === 'iap';
  const isWebBilled = sub?.billingType === 'manual' || sub?.billingType === 'recurring';
  const busy = isAndroid ? paystack.busy : iap.busy;
  const priceString = isAndroid ? paystack.priceString : iap.priceString;
  const loadingOffer = isAndroid ? false : iap.loadingOffer;
  const perks = isAndroid ? ANDROID_PERKS : IOS_PERKS;

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing['4xl'] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="All-access"
          subtitle={
            isAndroid
              ? 'Unlock every premium course with Paystack.'
              : 'Unlock every premium course with an App Store subscription.'
          }
          showBack
        />

        {isActive && (
          <GlassSurface style={styles.card} tintColor={TINT_ORANGE}>
            <Badge variant="success">Active</Badge>
            <Text style={styles.body}>
              You have all-access.
              {sub?.currentPeriodEnd ? (
                <>
                  {' '}
                  {isWebBilled || isAndroid ? 'Access ends' : 'Renews'} on {new Date(sub.currentPeriodEnd).toLocaleDateString()}.
                </>
              ) : null}
            </Text>
            {isWebBilled && !isAndroid ? (
              <Text style={styles.hint}>
                This plan was started on the website. Renew there, or subscribe in the app with Apple when it ends.
              </Text>
            ) : null}
            {isIap && !isAndroid ? (
              <Button fullWidth variant="secondary" onPress={openManage}>
                Manage subscription
              </Button>
            ) : null}
          </GlassSurface>
        )}

        {(!isActive || isWebBilled) && (
          <GlassSurface style={styles.card} tintColor={TINT_GLASS}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{loadingOffer ? '…' : priceString || 'Premium'}</Text>
              {priceString ? <Text style={styles.per}>/month</Text> : null}
            </View>
            {sub?.status === 'expired' && (
              <Text style={styles.warn}>Your subscription expired — subscribe again to restore access.</Text>
            )}
            {sub?.status === 'past_due' && (
              <Text style={styles.warn}>There is a billing issue — update your payment method and try again.</Text>
            )}

            {perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <IconCheck size={16} color="#1F9D55" />
                <Text style={styles.perk}>{perk}</Text>
              </View>
            ))}
            <View style={styles.perkRow}>
              <IconSparkles size={16} color="#1F9D55" />
              <Text style={styles.perk}>
                {isAndroid
                  ? 'Payment is processed by Paystack. Access lasts 30 days per payment.'
                  : 'Payment is processed by Apple. You can cancel anytime.'}
              </Text>
            </View>

            <Button fullWidth loading={busy} disabled={loadingOffer} onPress={() => void onPurchase()}>
              Subscribe{priceString ? ` · ${priceString}` : ''}
            </Button>
            {!isAndroid && (
              <Button fullWidth variant="secondary" loading={busy} onPress={() => void onRestore()}>
                Restore purchases
              </Button>
            )}
            <Text style={styles.hint}>
              {isAndroid
                ? 'This is a one-month all-access pass. It does not auto-renew. Individual courses can also be bought in the app.'
                : 'Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Individual courses can still be bought on sabilearn.online.'}
            </Text>
          </GlassSurface>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'], gap: spacing.md },
  card: { borderRadius: 20, padding: spacing.base, gap: spacing.sm, overflow: 'hidden' },
  body: { fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, lineHeight: 20 },
  hint: { fontSize: 12, fontFamily: fontFamilies.sans, color: MUTED, textAlign: 'center', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  price: { fontSize: 32, fontFamily: fontFamilies.sansBold, color: INK, letterSpacing: -0.6 },
  per: { fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, marginBottom: 6 },
  warn: { fontSize: 12, fontFamily: fontFamilies.sansMedium, color: '#E5484D', textAlign: 'center' },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  perk: { flex: 1, fontSize: 14, fontFamily: fontFamilies.sans, color: MUTED, lineHeight: 20 },
});
