import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import Course from '../models/course.model';
import Transaction from '../models/transaction.model';
import Subscription from '../models/subscription.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { isSubscriptionActive, MANUAL_SUBSCRIPTION_DAYS } from '../utils/subscription.util';
import {
  initializeTransaction,
  verifyTransaction as verifyPaystackTransaction,
  verifyWebhookSignature,
} from '../services/paystack.service';
import {
  getSubscriber,
  isPremiumActive,
  mapStore,
  verifyRevenueCatWebhookAuth,
} from '../services/revenuecat.service';
import User from '../models/user.model';

const generateReference = (prefix: string) => `${prefix}_${crypto.randomBytes(12).toString('hex')}`;

/** Web sends its own callback route; mobile (deep link) will override via req.body.callbackUrl. */
const resolveCallbackUrl = (req: AuthenticatedRequest): string | undefined => {
  const override = req.body?.callbackUrl;
  if (typeof override === 'string' && override.length > 0) return override;
  const base = process.env.CLIENT_URL;
  return base ? `${base}/dashboard/checkout/callback` : undefined;
};

export const initializeCoursePurchase = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const user = req.user!;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    if (course.isFree) {
      res.status(400).json({ success: false, message: 'This course is free and does not require purchase.' });
      return;
    }

    const existingPurchase = await Transaction.findOne({
      user: user._id,
      course: course._id,
      type: 'course_purchase',
      status: 'success',
    });
    if (existingPurchase) {
      res.status(400).json({ success: false, message: 'You already have access to this course.' });
      return;
    }

    const reference = generateReference('course');

    const transaction = await Transaction.create({
      user: user._id,
      reference,
      type: 'course_purchase',
      course: course._id,
      amount: course.price,
      status: 'pending',
    });

    const paystackRes = await initializeTransaction({
      email: user.email,
      amount: course.price,
      reference,
      callback_url: resolveCallbackUrl(req),
      metadata: {
        userId: String(user._id),
        courseId: String(course._id),
        type: 'course_purchase',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        accessCode: paystackRes.data.access_code,
        reference: transaction.reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const initializeSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const planCode = process.env.PAYSTACK_SUBSCRIPTION_PLAN_CODE;
    const amount = Number(process.env.SUBSCRIPTION_AMOUNT_KOBO);

    if (!planCode || !amount) {
      res.status(500).json({ success: false, message: 'Subscription plan is not configured.' });
      return;
    }

    const existingSub = await Subscription.findOne({ user: user._id });
    if (isSubscriptionActive(existingSub)) {
      res.status(400).json({ success: false, message: 'You already have an active subscription.' });
      return;
    }

    const reference = generateReference('sub');

    await Transaction.create({
      user: user._id,
      reference,
      type: 'subscription',
      billingType: 'recurring',
      amount,
      status: 'pending',
    });

    const paystackRes = await initializeTransaction({
      email: user.email,
      amount,
      reference,
      plan: planCode,
      callback_url: resolveCallbackUrl(req),
      metadata: {
        userId: String(user._id),
        type: 'subscription',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        accessCode: paystackRes.data.access_code,
        reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bank transfer / USSD-friendly alternative to the card-only recurring plan above —
 * most entry-level Nigerian students don't have a debit card Paystack can authorize
 * for recurring billing. This is a plain one-off charge (no `plan`, so every channel
 * Paystack has enabled is offered) that grants MANUAL_SUBSCRIPTION_DAYS of access.
 * There's no auto-renewal: the user has to come back and pay again next month.
 */
export const initializeManualSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const amount = Number(process.env.SUBSCRIPTION_AMOUNT_KOBO);

    if (!amount) {
      res.status(500).json({ success: false, message: 'Subscription pricing is not configured.' });
      return;
    }

    const existingSub = await Subscription.findOne({ user: user._id });
    if (isSubscriptionActive(existingSub)) {
      res.status(400).json({ success: false, message: 'You already have an active subscription.' });
      return;
    }

    const reference = generateReference('submanual');

    await Transaction.create({
      user: user._id,
      reference,
      type: 'subscription',
      billingType: 'manual',
      amount,
      status: 'pending',
    });

    const paystackRes = await initializeTransaction({
      email: user.email,
      amount,
      reference,
      callback_url: resolveCallbackUrl(req),
      metadata: {
        userId: String(user._id),
        type: 'subscription',
        billingType: 'manual',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        accessCode: paystackRes.data.access_code,
        reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UX-only confirmation for the client right after checkout. The webhook remains
 * the sole source of truth for actually granting access — this just checks
 * Paystack directly so the UI isn't stuck waiting on a webhook that may be delayed.
 */
export const verifyReference = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reference = String(req.params.reference);

    const transaction = await Transaction.findOne({ reference, user: req.user!._id });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    if (transaction.status === 'pending') {
      const paystackRes = await verifyPaystackTransaction(reference);
      if (paystackRes.data.status === 'success' || paystackRes.data.status === 'failed') {
        // Reflects the latest state for the UI; the webhook independently performs the actual grant.
        transaction.status = paystackRes.data.status === 'success' ? 'success' : 'failed';
        await transaction.save();
      }
    }

    res.status(200).json({ success: true, data: { status: transaction.status, type: transaction.type } });
  } catch (error) {
    next(error);
  }
};

export const getMyPaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    const subscription = await Subscription.findOne({ user: user._id });
    const purchasedCourses = await Transaction.find({
      user: user._id,
      type: 'course_purchase',
      status: 'success',
    }).select('course');

    const isExpiredPeriod =
      !!subscription &&
      subscription.status === 'active' &&
      (subscription.billingType === 'manual' || subscription.billingType === 'iap') &&
      !isSubscriptionActive(subscription);

    res.status(200).json({
      success: true,
      data: {
        subscription: subscription
          ? {
              status: isExpiredPeriod ? 'expired' : subscription.status,
              billingType: subscription.billingType,
              currentPeriodEnd: subscription.currentPeriodEnd,
              store: subscription.store,
            }
          : { status: 'none' },
        purchasedCourseIds: purchasedCourses.map((t) => t.course),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const signatureHeader = req.headers['x-paystack-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const rawBody = req.body as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ success: false, message: 'Invalid signature.' });
    return;
  }

  // Acknowledge immediately; Paystack retries on non-2xx/timeout, and we don't
  // want a slow downstream side-effect (email, push) to cause spurious retries.
  res.status(200).json({ received: true });

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return;
  }

  try {
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      case 'subscription.create':
        await handleSubscriptionCreate(event.data);
        break;
      case 'subscription.disable':
        await handleSubscriptionDisable(event.data);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[Paystack Webhook] Failed to process event ${event.event}:`, error);
  }
};

const handleChargeSuccess = async (data: any) => {
  const reference: string = data.reference;

  const transaction = await Transaction.findOne({ reference });
  if (!transaction || transaction.status === 'success') return; // already processed (idempotency)

  transaction.status = 'success';
  transaction.paystackPayload = data;
  await transaction.save();

  if (transaction.type === 'subscription' && transaction.billingType === 'manual') {
    const existing = await Subscription.findOne({ user: transaction.user });
    // Renewing before expiry extends from the current end date rather than from
    // "now", so paying a few days early doesn't cost the user those days.
    const base = existing?.currentPeriodEnd && existing.currentPeriodEnd.getTime() > Date.now() ? existing.currentPeriodEnd : new Date();
    const currentPeriodEnd = new Date(base.getTime() + MANUAL_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

    await Subscription.findOneAndUpdate(
      { user: transaction.user },
      {
        user: transaction.user,
        billingType: 'manual',
        status: 'active',
        currentPeriodEnd,
      },
      { upsert: true }
    );
  } else if (transaction.type === 'subscription') {
    // Recurring (card, Paystack Plan) charge — subscription.create carries the
    // subscription/plan codes, this just flips access on immediately.
    await Subscription.findOneAndUpdate(
      { user: transaction.user },
      {
        user: transaction.user,
        billingType: 'recurring',
        planCode: data.plan?.plan_code || process.env.PAYSTACK_SUBSCRIPTION_PLAN_CODE,
        paystackCustomerCode: data.customer?.customer_code,
        status: 'active',
      },
      { upsert: true }
    );
  }
  // course_purchase access is derived from Transaction.status === 'success', no further write needed.
};

const handleSubscriptionCreate = async (data: any) => {
  await Subscription.findOneAndUpdate(
    { paystackCustomerCode: data.customer?.customer_code },
    {
      paystackSubscriptionCode: data.subscription_code,
      paystackEmailToken: data.email_token,
      status: data.status === 'active' ? 'active' : 'past_due',
      currentPeriodEnd: data.next_payment_date ? new Date(data.next_payment_date) : undefined,
    }
  );
};

const handleSubscriptionDisable = async (data: any) => {
  await Subscription.findOneAndUpdate(
    { paystackSubscriptionCode: data.subscription_code },
    { status: 'cancelled' }
  );
};

const handleInvoicePaymentFailed = async (data: any) => {
  await Subscription.findOneAndUpdate(
    { paystackCustomerCode: data.customer?.customer_code },
    { status: 'past_due' }
  );
};

const applyIapSubscription = async (opts: {
  userId: string;
  active: boolean;
  expiresAt?: Date;
  store?: string;
  eventType?: string;
}) => {
  const store = mapStore(opts.store);
  let status: 'active' | 'cancelled' | 'past_due' | 'none' = opts.active ? 'active' : 'none';
  if (!opts.active && (opts.eventType === 'CANCELLATION' || opts.eventType === 'EXPIRATION')) {
    status = 'cancelled';
  }
  if (opts.eventType === 'BILLING_ISSUE') {
    status = 'past_due';
  }

  await Subscription.findOneAndUpdate(
    { user: opts.userId },
    {
      user: opts.userId,
      billingType: 'iap',
      rcAppUserId: opts.userId,
      status,
      currentPeriodEnd: opts.expiresAt,
      ...(store ? { store } : {}),
    },
    { upsert: true }
  );
};

export const syncIapEntitlement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const appUserId = String(user._id);
    const subscriber = await getSubscriber(appUserId);
    const { active, expiresAt } = isPremiumActive(subscriber);
    await applyIapSubscription({ userId: appUserId, active, expiresAt });

    const subscription = await Subscription.findOne({ user: user._id });
    res.status(200).json({
      success: true,
      data: {
        status: active ? 'success' : 'failed',
        type: 'subscription',
        subscription: subscription
          ? {
              status: active ? 'active' : subscription.status,
              billingType: subscription.billingType,
              currentPeriodEnd: subscription.currentPeriodEnd,
              store: subscription.store,
            }
          : { status: 'none' },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleRevenueCatWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!verifyRevenueCatWebhookAuth(req.headers.authorization)) {
    res.status(401).json({ success: false, message: 'Invalid authorization.' });
    return;
  }

  res.status(200).json({ received: true });

  const event = (req.body as { event?: Record<string, unknown> })?.event;
  if (!event || typeof event.type !== 'string') return;

  const type = event.type;
  const appUserId = typeof event.app_user_id === 'string' ? event.app_user_id : undefined;
  if (!appUserId) return;

  const user = await User.findById(appUserId);
  if (!user) {
    console.warn(`[RevenueCat] No user for app_user_id ${appUserId}`);
    return;
  }

  try {
    const expirationMs = typeof event.expiration_at_ms === 'number' ? event.expiration_at_ms : undefined;
    const expiresAt = expirationMs ? new Date(expirationMs) : undefined;
    const store = typeof event.store === 'string' ? event.store : undefined;

    const grantTypes = new Set([
      'INITIAL_PURCHASE',
      'RENEWAL',
      'PRODUCT_CHANGE',
      'UNCANCELLATION',
      'NON_RENEWING_PURCHASE',
      'CANCELLATION',
    ]);

    if (grantTypes.has(type)) {
      const stillActive = !expiresAt || expiresAt.getTime() > Date.now();
      await applyIapSubscription({
        userId: String(user._id),
        active: stillActive,
        expiresAt,
        store,
        eventType: stillActive ? type : 'CANCELLATION',
      });
    } else if (type === 'EXPIRATION' || type === 'BILLING_ISSUE') {
      await applyIapSubscription({
        userId: String(user._id),
        active: false,
        expiresAt,
        store,
        eventType: type,
      });
    }
  } catch (error) {
    console.error(`[RevenueCat Webhook] Failed to process ${type}:`, error);
  }
};
