'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, AlertCircle, ShieldAlert, Send } from 'lucide-react';
import { toast } from 'sonner';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { adminApi } from '@/lib/api';

interface UpgradeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    _id: string;
    name: string;
    email: string;
    isPro?: boolean;
    subscription?: {
      status?: string;
      currentPeriodEnd?: string;
    } | null;
  } | null;
  onSuccess?: () => void;
}

const PRESET_DURATIONS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days (1 mo)', days: 30 },
  { label: '90 days (3 mo)', days: 90 },
  { label: '180 days (6 mo)', days: 180 },
  { label: '365 days (1 yr)', days: 365 },
];

export default function UpgradeUserModal({ isOpen, onClose, user, onSuccess }: UpgradeUserModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  if (!user) return null;

  const effectiveDays = isCustom ? parseInt(customDays, 10) || 0 : selectedDays;

  // Calculate live preview of expiration date
  const now = new Date();
  const existingEnd = user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd) : null;
  const baseDate = existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now;
  const previewExpiry = new Date(baseDate.getTime() + (effectiveDays > 0 ? effectiveDays : 0) * 24 * 60 * 60 * 1000);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveDays <= 0) {
      toast.error('Please choose or enter a valid number of days.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.upgradeUser(user._id, {
        durationDays: effectiveDays,
        note: note.trim() || undefined,
        sendEmail,
      });

      if (res.data.success) {
        toast.success(`Upgraded ${user.name} for ${effectiveDays} days!`);
        if (sendEmail && res.data.data?.emailError) {
          toast.warning(`Note: Email delivery failed: ${res.data.data.emailError}`);
        } else if (sendEmail) {
          toast.success('Congratulatory confirmation email dispatched.');
        }
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upgrade user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm(`Revoke Pro access for "${user.name}" immediately?`)) return;

    setIsRevoking(true);
    try {
      await adminApi.revokeSubscription(user._id);
      toast.success('Subscription revoked.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke subscription');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Grant / Extend Pro Access">
      <form onSubmit={handleUpgrade} className="space-y-5">
        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-stone-900">{user.name}</p>
              {user.isPro ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  Pro Active
                </span>
              ) : (
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600 uppercase">
                  Free Learner
                </span>
              )}
            </div>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
            {existingEnd && existingEnd.getTime() > now.getTime() && (
              <p className="mt-0.5 text-[11px] font-medium text-emerald-700">
                Current period expires: {existingEnd.toLocaleDateString()} (will extend from this date)
              </p>
            )}
          </div>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-stone-700 uppercase">
            Grant Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_DURATIONS.map((preset) => {
              const active = !isCustom && selectedDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedDays(preset.days);
                  }}
                  className={`cursor-pointer rounded-lg border py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isCustom
                  ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              Custom days
            </button>
            {isCustom && (
              <div className="flex flex-1 items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 outline-none focus:border-amber-600"
                  autoFocus
                />
                <span className="text-xs font-medium text-stone-500">days</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Expiration Preview */}
        {effectiveDays > 0 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
            <Calendar className="size-4 shrink-0 text-amber-700" />
            <span>
              Pro access will be active until{' '}
              <strong className="font-bold underline decoration-amber-400">
                {previewExpiry.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>
            </span>
          </div>
        )}

        {/* Optional Note */}
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-stone-700 uppercase">
            Admin Note / Reason (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Scholarship award / Community contributor bonus"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-amber-600"
          />
          <p className="mt-1 text-[11px] text-stone-400">
            This note will be included inside the congratulatory confirmation email.
          </p>
        </div>

        {/* Send Email Checkbox */}
        <label className="flex cursor-pointer items-start gap-2.5 select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-0.5 size-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs leading-snug font-medium text-stone-700">
            Send congratulatory upgrade email &amp; in-app/push notification to user
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
          {user.isPro ? (
            <button
              type="button"
              disabled={isRevoking || isSubmitting}
              onClick={handleRevoke}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <ShieldAlert className="size-3.5" />
              Revoke Pro
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting || effectiveDays <= 0}>
              <Sparkles className="size-3.5" />
              {isSubmitting ? 'Upgrading…' : `Grant Pro (${effectiveDays}d)`}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
