import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

export const PAYSTACK_PUBLIC_KEY =
  (typeof extra.paystackPublicKey === 'string' && extra.paystackPublicKey) || '';

export const SUBSCRIPTION_AMOUNT_KOBO =
  typeof extra.subscriptionAmountKobo === 'number' ? extra.subscriptionAmountKobo : 300000;

export const PAYSTACK_CHANNELS: Array<
  'bank' | 'card' | 'qr' | 'ussd' | 'mobile_money' | 'bank_transfer'
> = ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money', 'qr'];

export function isPaystackConfigured(): boolean {
  return Boolean(PAYSTACK_PUBLIC_KEY) && !PAYSTACK_PUBLIC_KEY.includes('REPLACE');
}

/** Paystack Inline (react-native-paystack-webview) expects Naira, not kobo. */
export function koboToNaira(kobo: number): number {
  return Math.round(kobo) / 100;
}

export function formatKobo(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}
