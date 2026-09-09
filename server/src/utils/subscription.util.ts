import { ISubscription } from '../models/subscription.model';

/** Manual (bank transfer/USSD-friendly) subscriptions grant this many days per successful charge. */
export const MANUAL_SUBSCRIPTION_DAYS = 30;

/**
 * Recurring Paystack is kept current by webhooks. Manual Paystack and IAP both
 * expire at `currentPeriodEnd` when that date is set.
 */
export const isSubscriptionActive = (subscription: Pick<ISubscription, 'status' | 'currentPeriodEnd'> | null | undefined): boolean => {
  if (!subscription || subscription.status !== 'active') return false;
  if (!subscription.currentPeriodEnd) return true;
  return subscription.currentPeriodEnd.getTime() > Date.now();
};
