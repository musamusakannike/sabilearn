import mongoose, { Schema, Document } from 'mongoose';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';
/**
 * 'recurring' = Paystack Plan, card-only, auto-debits monthly (web).
 * 'manual' = one-off Paystack charge (web).
 * 'iap' = Apple/Google via RevenueCat (mobile).
 * 'admin_grant' = granted directly by admin for a fixed duration.
 */
export type SubscriptionBillingType = 'recurring' | 'manual' | 'iap' | 'admin_grant';
export type SubscriptionStore = 'app_store' | 'play_store' | 'web' | 'admin';

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
  grantedBy?: mongoose.Types.ObjectId | null;
  grantNote?: string;
  grantedDays?: number;
  grantedAt?: Date;
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
      enum: ['recurring', 'manual', 'iap', 'admin_grant'],
      default: 'manual',
    },
    rcAppUserId: {
      type: String,
      index: true,
    },
    store: {
      type: String,
      enum: ['app_store', 'play_store', 'web', 'admin'],
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
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    grantNote: {
      type: String,
      default: '',
    },
    grantedDays: {
      type: Number,
      default: null,
    },
    grantedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
