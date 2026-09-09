import mongoose, { Schema, Document } from 'mongoose';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';
/**
 * 'recurring' = Paystack Plan, card-only, auto-debits monthly (web).
 * 'manual' = one-off Paystack charge (web).
 * 'iap' = Apple/Google via RevenueCat (mobile).
 */
export type SubscriptionBillingType = 'recurring' | 'manual' | 'iap';
export type SubscriptionStore = 'app_store' | 'play_store' | 'web';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  billingType: SubscriptionBillingType;
  paystackCustomerCode?: string;
  paystackSubscriptionCode?: string;
  paystackEmailToken?: string;
  planCode?: string;
  rcAppUserId?: string;
  store?: SubscriptionStore;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    billingType: {
      type: String,
      enum: ['recurring', 'manual', 'iap'],
      default: 'manual',
    },
    rcAppUserId: {
      type: String,
      index: true,
    },
    store: {
      type: String,
      enum: ['app_store', 'play_store', 'web'],
    },
    paystackCustomerCode: {
      type: String,
    },
    paystackSubscriptionCode: {
      type: String,
    },
    paystackEmailToken: {
      type: String,
    },
    planCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'none'],
      default: 'none',
      index: true,
    },
    currentPeriodEnd: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
