const RC_BASE = 'https://api.revenuecat.com/v1';
export const PREMIUM_ENTITLEMENT = 'premium';

const secretKey = () => {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) throw new Error('REVENUECAT_SECRET_API_KEY is not configured.');
  return key;
};

export type RcEntitlement = {
  expires_date: string | null;
  product_identifier?: string;
  purchase_date?: string;
};

export type RcSubscriber = {
  original_app_user_id?: string;
  entitlements?: Record<string, RcEntitlement>;
};

export async function getSubscriber(appUserId: string): Promise<RcSubscriber> {
  const response = await fetch(`${RC_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
  });
  const data = (await response.json()) as { subscriber?: RcSubscriber; message?: string };
  if (!response.ok) {
    throw new Error(data.message || `RevenueCat subscriber lookup failed (${response.status}).`);
  }
  return data.subscriber ?? {};
}

export function isPremiumActive(subscriber: RcSubscriber): { active: boolean; expiresAt?: Date } {
  const ent = subscriber.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!ent) return { active: false };
  if (!ent.expires_date) return { active: true };
  const expiresAt = new Date(ent.expires_date);
  return { active: expiresAt.getTime() > Date.now(), expiresAt };
}

export function verifyRevenueCatWebhookAuth(header: string | string[] | undefined): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) return false;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return false;
  const token = value.startsWith('Bearer ') ? value.slice(7) : value;
  return token === expected;
}

export function mapStore(store?: string): 'app_store' | 'play_store' | 'web' | undefined {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'app_store';
  if (store === 'PLAY_STORE') return 'play_store';
  if (store === 'STRIPE' || store === 'PROMOTIONAL') return 'web';
  return undefined;
}
