import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAuthStore } from '@/store/auth.store';
import { paymentApi } from '@/lib/api';
import { appUserId, configurePurchases, IAP_ENTITLEMENT, identifyPurchasesUser } from '@/lib/iap';
import * as haptics from '@/lib/haptics';

function apiErrorMessage(err: unknown, fallback: string): string {
  const errorObj = err as { response?: { data?: { message?: string } }; message?: string; userCancelled?: boolean };
  if (errorObj?.userCancelled) return '';
  return errorObj?.response?.data?.message || errorObj?.message || fallback;
}

export function useIapPurchase() {
  const user = useAuthStore((s) => s.user);
  const uid = appUserId(user);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [priceString, setPriceString] = useState<string | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);

  const loadOffering = useCallback(async () => {
    setLoadingOffer(true);
    try {
      const ok = await configurePurchases();
      setConfigured(ok);
      if (!ok) {
        setPkg(null);
        setPriceString(null);
        return;
      }
      if (uid) await identifyPurchasesUser(uid);
      const offerings = await Purchases.getOfferings();
      const monthly =
        offerings.current?.monthly ??
        offerings.current?.availablePackages.find((p) => p.packageType === 'MONTHLY') ??
        offerings.current?.availablePackages[0] ??
        null;
      setPkg(monthly);
      setPriceString(monthly?.product.priceString ?? null);
    } catch (err) {
      console.warn('[IAP] offerings failed', err);
      setPkg(null);
    } finally {
      setLoadingOffer(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadOffering();
  }, [loadOffering]);

  const syncServer = useCallback(async () => {
    const res = await paymentApi.syncIap();
    return res.data?.data;
  }, []);

  const purchase = useCallback(async (): Promise<boolean> => {
    if (!uid) {
      Alert.alert('Sign in required', 'Sign in to subscribe.');
      return false;
    }
    if (!pkg) {
      Alert.alert(
        'Store not ready',
        Platform.OS === 'android'
          ? 'Google Play products are not available yet. Install this build from Internal testing and check that premium_monthly is active.'
          : 'App Store products are not available yet. Finish Paid Apps + tax in App Store Connect and use a sandbox Apple ID.'
      );
      return false;
    }
    setBusy(true);
    try {
      await identifyPurchasesUser(uid);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitled = typeof customerInfo.entitlements.active[IAP_ENTITLEMENT] !== 'undefined';
      if (entitled) {
        await syncServer();
        haptics.success();
        return true;
      }
      Alert.alert('Purchase incomplete', 'The store did not grant Premium. Try Restore purchases.');
      return false;
    } catch (err) {
      const cancelled = (err as { userCancelled?: boolean })?.userCancelled;
      if (cancelled) return false;
      haptics.error();
      Alert.alert('Could not complete purchase', apiErrorMessage(err, 'Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  }, [pkg, syncServer, uid]);

  const restore = useCallback(async (): Promise<boolean> => {
    if (!uid) {
      Alert.alert('Sign in required', 'Sign in to restore purchases.');
      return false;
    }
    setBusy(true);
    try {
      await identifyPurchasesUser(uid);
      const info = await Purchases.restorePurchases();
      const entitled = typeof info.entitlements.active[IAP_ENTITLEMENT] !== 'undefined';
      await syncServer();
      if (entitled) {
        haptics.success();
        return true;
      }
      Alert.alert('No purchases found', 'We could not find an active subscription for this store account.');
      return false;
    } catch (err) {
      haptics.error();
      Alert.alert('Restore failed', apiErrorMessage(err, 'Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  }, [syncServer, uid]);

  return {
    pkg,
    priceString,
    loadingOffer,
    busy,
    configured,
    purchase,
    restore,
    reload: loadOffering,
  };
}
