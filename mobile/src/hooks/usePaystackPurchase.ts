import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { usePaystack } from 'react-native-paystack-webview';
import { useAuthStore } from '@/store/auth.store';
import { paymentApi } from '@/lib/api';
import { formatKobo, isPaystackConfigured, koboToNaira, SUBSCRIPTION_AMOUNT_KOBO } from '@/lib/paystack';
import * as haptics from '@/lib/haptics';

function apiErrorMessage(err: unknown, fallback: string): string {
  const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
  return errorObj?.response?.data?.message || errorObj?.message || fallback;
}

export function usePaystackPurchase() {
  const user = useAuthStore((s) => s.user);
  const { popup } = usePaystack();
  const [busy, setBusy] = useState(false);

  const priceString = formatKobo(SUBSCRIPTION_AMOUNT_KOBO);

  const complete = useCallback(async (reference: string): Promise<boolean> => {
    const res = await paymentApi.verify(reference);
    const status = res.data?.data?.status;
    if (status === 'success') {
      haptics.success();
      return true;
    }
    if (status === 'pending') {
      Alert.alert('Payment pending', 'We are still confirming this payment. Check back in a moment.');
      return false;
    }
    Alert.alert('Payment failed', 'The charge was not completed. You were not billed.');
    return false;
  }, []);

  const checkout = useCallback(
    async (opts: { email: string; amountKobo: number; reference: string }): Promise<boolean> => {
      return new Promise((resolve) => {
        popup.checkout({
          email: opts.email,
          amount: koboToNaira(opts.amountKobo),
          reference: opts.reference,
          metadata: {
            platform: 'android',
            source: 'mobile',
          },
          onSuccess: () => {
            void complete(opts.reference).then(resolve);
          },
          onCancel: () => resolve(false),
          onError: (err) => {
            haptics.error();
            Alert.alert('Payment error', err?.message || 'Could not open Paystack checkout.');
            resolve(false);
          },
        });
      });
    },
    [complete, popup]
  );

  const purchaseSubscription = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      Alert.alert('Sign in required', 'Sign in to subscribe.');
      return false;
    }
    if (!isPaystackConfigured()) {
      Alert.alert('Payments unavailable', 'Paystack is not configured for this build.');
      return false;
    }
    setBusy(true);
    try {
      const res = await paymentApi.initializeManualSubscription({ clientCheckout: true });
      const { reference, amount } = res.data.data;
      return await checkout({
        email: user.email,
        amountKobo: amount ?? SUBSCRIPTION_AMOUNT_KOBO,
        reference,
      });
    } catch (err) {
      haptics.error();
      Alert.alert('Could not start payment', apiErrorMessage(err, 'Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  }, [checkout, user?.email]);

  const purchaseCourse = useCallback(
    async (courseId: string, amountKobo: number): Promise<boolean> => {
      if (!user?.email) {
        Alert.alert('Sign in required', 'Sign in to buy this course.');
        return false;
      }
      if (!isPaystackConfigured()) {
        Alert.alert('Payments unavailable', 'Paystack is not configured for this build.');
        return false;
      }
      setBusy(true);
      try {
        const res = await paymentApi.initializeCoursePurchase(courseId, { clientCheckout: true });
        const { reference, amount } = res.data.data;
        return await checkout({
          email: user.email,
          amountKobo: amount ?? amountKobo,
          reference,
        });
      } catch (err) {
        haptics.error();
        Alert.alert('Could not start payment', apiErrorMessage(err, 'Please try again.'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [checkout, user?.email]
  );

  return {
    busy,
    priceString,
    purchaseSubscription,
    purchaseCourse,
  };
}
