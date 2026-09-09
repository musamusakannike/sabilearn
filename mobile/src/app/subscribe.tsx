import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconCheck, IconSparkles } from '@tabler/icons-react-native';
import { paymentApi } from '@/lib/api';
import { PaymentStatus } from '@/lib/types';
import { useIapPurchase } from '@/hooks/useIapPurchase';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassSurface from '@/components/ui/GlassSurface';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fontFamilies, spacing } from '@/theme';
import { ACCENT, INK, MUTED, TINT_GLASS, TINT_ORANGE } from '@/theme/brand';
import * as haptics from '@/lib/haptics';

const PERKS = [
  'Every premium course, current and future',
  'Billed through Apple or Google — cancel anytime in your store account',
];

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const { priceString, busy, loadingOffer, purchase, restore, reload } = useIapPurchase();
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
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    haptics.light();
    setRefreshing(true);
    await Promise.all([load(), reload()]);
    setRefreshing(false);
  }, [load, reload]);

  const onPurchase = async () => {
    const ok = await purchase();
    if (ok) {
      Alert.alert('You are Premium', 'All premium courses are unlocked.');
      await load();
    }
  };

  const onRestore = async () => {
    const ok = await restore();
    if (ok) {
      Alert.alert('Restored', 'Your subscription is active on this account.');
      await load();
    }
  };

  const openManage = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    void Linking.openURL(url);
  };

  if (isLoading) return <LoadingSpinner />;

  const sub = status?.subscription;
  const isActive = sub?.status === 'active';
  const isIap = sub?.billingType === 'iap';
  const isWebBilled = sub?.billingType === 'manual' || sub?.billingType === 'recurring';

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + spacing['4xl'] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="All-access" subtitle="Unlock every premium course with an App Store or Google Play subscription." showBack />

        {isActive && (
          <GlassSurface style={styles.card} tintColor={TINT_ORANGE}>
            <Badge variant="success">Active</Badge>
            <Text style={styles.body}>
              You have all-access.
              {sub?.currentPeriodEnd ? (
                <>
                  {' '}
                  {isWebBilled ? 'Access ends' : 'Renews'} on {new Date(sub.currentPeriodEnd).toLocaleDateString()}.
                </>
              ) : null}
            </Text>
            {isWebBilled ? (
              <Text style={styles.hint}>
                This plan was started on the website. Renew there, or subscribe in the app with Apple/Google when it ends.
              </Text>
            ) : null}
            {isIap ? (
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
              <Text style={styles.warn}>There is a billing issue — update payment in your store account.</Text>
            )}

            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <IconCheck size={16} color="#1F9D55" />
                <Text style={styles.perk}>{perk}</Text>
              </View>
            ))}
            <View style={styles.perkRow}>
              <IconSparkles size={16} color="#1F9D55" />
              <Text style={styles.perk}>Payment is processed by Apple or Google. You can cancel anytime.</Text>
            </View>

            <Button fullWidth loading={busy} disabled={loadingOffer} onPress={() => void onPurchase()}>
              Subscribe{priceString ? ` · ${priceString}` : ''}
            </Button>
            <Button fullWidth variant="secondary" loading={busy} onPress={() => void onRestore()}>
              Restore purchases
            </Button>
            <Text style={styles.hint}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Individual courses can still be bought on sabilearn.online.
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
