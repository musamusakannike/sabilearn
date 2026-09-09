import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

export const REVENUECAT_IOS_KEY =
  (typeof extra.revenueCatIosApiKey === 'string' && extra.revenueCatIosApiKey) || '';
export const REVENUECAT_ANDROID_KEY =
  (typeof extra.revenueCatAndroidApiKey === 'string' && extra.revenueCatAndroidApiKey) || '';

export const IAP_ENTITLEMENT = 'premium';

let configured = false;

export function getRevenueCatApiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
}

export async function configurePurchases(): Promise<boolean> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey || apiKey.startsWith('appl_REPLACE') || apiKey.startsWith('goog_REPLACE')) {
    return false;
  }
  if (configured) return true;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

export async function identifyPurchasesUser(userId: string | undefined): Promise<void> {
  const ok = await configurePurchases();
  if (!ok || !userId) return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('[IAP] logIn failed', err);
  }
}

export async function resetPurchasesUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Anonymous user or already logged out.
  }
}
