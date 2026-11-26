import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconBolt,
  IconCheck,
  IconCreditCard,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react';
import { Badge, Button, Card, Modal, Skeleton } from '@/components/ui';
import { courseApi, paymentApi } from '@/lib/api';
import { cachePaymentStatus } from '@/lib/offlineSync';
import { Course, PaymentStatus } from '@/lib/types';
import { formatKobo } from '@/lib/money';
import { openExternalUrl } from '@/platform';
import { useUiStore } from '@/stores/ui.store';

export function SubscribePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.toast);

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Waiting-for-payment modal state
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, courseRes] = await Promise.all([
        paymentApi.me(),
        courseId ? courseApi.get(courseId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      if (payRes.data) {
        setStatus(payRes.data);
        void cachePaymentStatus(payRes.data);
      }
      if (courseRes.data) setCourse(courseRes.data);
    } catch {
      // ignore offline
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [load]);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const verifyReference = useCallback(
    async (reference: string, silent = false) => {
      if (!silent) setVerifying(true);
      try {
        const res = await paymentApi.verify(reference);
        const txStatus = res.data?.status;
        if (txStatus === 'success') {
          stopPolling();
          setPendingRef(null);
          setPendingUrl(null);
          await load();
          toast({ title: 'Payment confirmed!', description: 'Your access is now active.', variant: 'success' });
          if (courseId) navigate(`/course/${courseId}`);
        } else if (txStatus === 'failed') {
          stopPolling();
          toast({ title: 'Payment failed', description: 'Please try again.', variant: 'danger' });
        } else if (!silent) {
          toast({ title: 'Still waiting for confirmation', description: 'Complete payment in your browser, then check again.' });
        }
      } catch (err) {
        if (!silent) {
          toast({
            title: 'Verification error',
            description: err instanceof Error ? err.message : 'Unable to verify payment.',
            variant: 'danger',
          });
        }
      } finally {
        if (!silent) setVerifying(false);
      }
    },
    [courseId, load, navigate, toast]
  );

  const startCheckout = async (mode: 'recurring' | 'manual' | 'course') => {
    setBusy(true);
    try {
      const res =
        mode === 'course' && courseId
          ? await paymentApi.initializeCoursePurchase(courseId)
          : mode === 'manual'
            ? await paymentApi.initializeManualSubscription()
            : await paymentApi.initializeSubscription();

      const authUrl: string | undefined = res.data?.authorizationUrl;
      const reference: string | undefined = res.data?.reference;
      if (!authUrl || !reference) {
        throw new Error('Checkout initialization did not return a payment link.');
      }

      setPendingRef(reference);
      setPendingUrl(authUrl);
      await openExternalUrl(authUrl);

      stopPolling();
      pollTimerRef.current = setInterval(() => {
        void verifyReference(reference, true);
      }, 4500);
    } catch (err) {
      toast({
        title: 'Could not start checkout',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  const isActive = status?.subscription?.status === 'active';

  return (
    <div className="max-w-[820px] mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold">All-Access Subscription</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Pay securely via Paystack in your browser. Access unlocks automatically once confirmed.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} onClick={() => void load()}>
          Refresh Status
        </Button>
      </div>

      {isActive && (
        <Card className="bg-[var(--success-bg)]/50 border-[var(--success)] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="success">Active All-Access</Badge>
            <div className="font-bold text-[16px]">You have full access to SabiLearn</div>
            {status?.subscription?.currentPeriodEnd && (
              <div className="text-[13px] text-[var(--text-secondary)]">
                Current period ends{' '}
                {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
          <IconBolt size={28} className="text-[var(--success)] shrink-0" />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="featured" className="flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <Badge variant="gold">Recommended</Badge>
            <div>
              <h2 className="text-[20px] font-bold">All-Access Monthly</h2>
              <div className="text-[28px] font-bold mt-1">
                ₦3,000 <span className="text-[14px] font-normal text-[var(--text-tertiary)]">/ month</span>
              </div>
            </div>
            <ul className="space-y-2 text-[13.5px] text-[var(--text-secondary)]">
              {[
                'Unlock every Tech & Academic course',
                'Up to 5 AI Course Architect & Quiz-from-PDF generations/day',
                'Unlimited In-Lesson AI Tutor & Code Playground cloud sync',
                'Offline course downloads',
              ].map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <IconCheck size={15} className="text-[var(--success)] shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              fullWidth
              size="lg"
              loading={busy}
              icon={<IconCreditCard size={17} />}
              onClick={() => void startCheckout('recurring')}
            >
              Subscribe with Card (Auto-Renew)
            </Button>
            <Button
              fullWidth
              variant="secondary"
              disabled={busy}
              onClick={() => void startCheckout('manual')}
            >
              Pay via Bank Transfer / USSD (1 Month)
            </Button>
          </div>
        </Card>

        {course && !course.isFree && (
          <Card className="flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <Badge variant="default">Single Course</Badge>
              <div>
                <h2 className="text-[18px] font-bold">{course.title}</h2>
                <div className="text-[26px] font-bold mt-1">{formatKobo(course.price)}</div>
              </div>
              <p className="text-[13.5px] text-[var(--text-secondary)]">
                One-time payment for lifetime access to this specific course, including all chapters,
                lessons, and capstone assessments.
              </p>
            </div>
            <Button
              fullWidth
              variant="secondary"
              size="lg"
              loading={busy}
              onClick={() => void startCheckout('course')}
            >
              Buy Course ({formatKobo(course.price)})
            </Button>
          </Card>
        )}
      </div>

      {/* Waiting for Payment Modal */}
      <Modal
        open={!!pendingRef}
        onClose={() => {
          stopPolling();
          setPendingRef(null);
          setPendingUrl(null);
        }}
        title="Complete Payment in Browser"
        description="We opened Paystack checkout in your default browser. This window checks automatically every few seconds."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                stopPolling();
                setPendingRef(null);
                setPendingUrl(null);
              }}
            >
              Cancel
            </Button>
            {pendingUrl && (
              <Button
                variant="secondary"
                icon={<IconExternalLink size={15} />}
                onClick={() => void openExternalUrl(pendingUrl)}
              >
                Re-open Checkout
              </Button>
            )}
            <Button
              loading={verifying}
              onClick={() => pendingRef && void verifyReference(pendingRef, false)}
            >
              I've Paid — Verify Now
            </Button>
          </>
        }
      >
        <div className="py-3 space-y-2 text-[13.5px] text-[var(--text-secondary)]">
          <p>
            Transaction reference:{' '}
            <code className="px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] font-mono">
              {pendingRef}
            </code>
          </p>
          <p className="text-[12.5px] text-[var(--text-tertiary)]">
            Once Paystack confirms your payment, you will be redirected back automatically (or click
            "I've Paid — Verify Now").
          </p>
        </div>
      </Modal>
    </div>
  );
}
