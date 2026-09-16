'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Sliders,
  Radio,
  Clock,
  UserCheck,
  ShieldCheck,
  Check,
} from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { appReviewApi } from '@/lib/api';
import { AppReviewConfig, SupportedOS } from '@/lib/types';
import { toast } from 'sonner';

const PRESET_HIDDEN_COMPONENTS = [
  { id: 'subscription_paywall', label: 'Subscription / Paywall Prompts', desc: 'Hides direct payment walls and premium pricing banners' },
  { id: 'paid_courses', label: 'Paid / Premium Courses', desc: 'Hides non-free courses from listings while in review' },
  { id: 'code_playground', label: 'Code Playground', desc: 'Hides the homepage code playground' },
  { id: 'external_payment', label: 'External Payment Gateways', desc: 'Replaces external checkout with standard access or sandbox flows' },
  { id: 'external_links', label: 'External Web Links & Socials', desc: 'Prevents navigation to third-party domains outside app store policy' },
  { id: 'delete_account_prompt', label: 'Account Deletion Banner', desc: 'Displays prominent account deletion compliance notice' },
  { id: 'beta_ai_tools', label: 'Experimental AI Labs', desc: 'Disables unreviewed AI generation features' },
];

export default function AppReviewAdminPage() {
  const [configs, setConfigs] = useState<Record<SupportedOS, AppReviewConfig>>({
    ios: {
      os: 'ios',
      inReview: false,
      reviewVersion: '',
      minVersion: '',
      notes: '',
      hiddenComponents: ['subscription_paywall', 'external_payment'],
      customFlags: {},
    },
    android: {
      os: 'android',
      inReview: false,
      reviewVersion: '',
      minVersion: '',
      notes: '',
      hiddenComponents: ['subscription_paywall', 'paid_courses', 'code_playground', 'external_payment'],
      customFlags: {},
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<SupportedOS, boolean>>({ ios: false, android: false });
  const [simulatedOS, setSimulatedOS] = useState<SupportedOS>('ios');

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await appReviewApi.getAll();
      const list: AppReviewConfig[] = res.data?.data || [];
      const map: Record<SupportedOS, AppReviewConfig> = { ...configs };

      list.forEach((item) => {
        if (item.os === 'ios' || item.os === 'android') {
          map[item.os] = {
            ...item,
            hiddenComponents: Array.isArray(item.hiddenComponents) ? item.hiddenComponents : [],
            customFlags: item.customFlags || {},
          };
        }
      });

      setConfigs(map);
    } catch (e: any) {
      console.error('Failed to load app review configs:', e);
      toast.error(e.response?.data?.message || 'Failed to load app review settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggleReview = (os: SupportedOS) => {
    setConfigs((prev) => ({
      ...prev,
      [os]: {
        ...prev[os],
        inReview: !prev[os].inReview,
      },
    }));
  };

  const handleChangeField = (os: SupportedOS, field: keyof AppReviewConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [os]: {
        ...prev[os],
        [field]: value,
      },
    }));
  };

  const handleToggleComponentTag = (os: SupportedOS, componentId: string) => {
    setConfigs((prev) => {
      const currentList = prev[os].hiddenComponents || [];
      const updated = currentList.includes(componentId)
        ? currentList.filter((c) => c !== componentId)
        : [...currentList, componentId];

      return {
        ...prev,
        [os]: {
          ...prev[os],
          hiddenComponents: updated,
        },
      };
    });
  };

  const handleSaveOS = async (os: SupportedOS) => {
    try {
      setIsSaving((prev) => ({ ...prev, [os]: true }));
      const payload = configs[os];
      const res = await appReviewApi.update(os, {
        inReview: payload.inReview,
        reviewVersion: payload.reviewVersion,
        minVersion: payload.minVersion,
        notes: payload.notes,
        hiddenComponents: payload.hiddenComponents,
        customFlags: payload.customFlags,
      });

      if (res.data?.data) {
        setConfigs((prev) => ({
          ...prev,
          [os]: res.data.data,
        }));
      }

      toast.success(`${os.toUpperCase()} review mode configuration saved!`);
    } catch (e: any) {
      console.error('Failed to save config:', e);
      toast.error(e.response?.data?.message || `Failed to save ${os.toUpperCase()} settings.`);
    } finally {
      setIsSaving((prev) => ({ ...prev, [os]: false }));
    }
  };

  const handleBulkAction = async (inReviewState: boolean) => {
    try {
      setIsLoading(true);
      await appReviewApi.bulkUpdate({
        ios: { inReview: inReviewState },
        android: { inReview: inReviewState },
      });
      await fetchConfigs();
      toast.success(
        inReviewState
          ? 'Review mode ACTIVATED for all platforms (iOS & Android).'
          : 'All platforms set to LIVE PRODUCTION mode.'
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update review mode.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeSimConfig = configs[simulatedOS];
  const isSimInReview = activeSimConfig?.inReview;

  return (
    <AdminGuard>
      <div className="mx-auto max-w-6xl space-y-8 pb-16">
        <AdminPageHeader
          title="Mobile App Review Management"
          description="Control Operating System review modes (iOS App Store & Google Play Store) to conditionally show or hide components in the mobile app."
        />

        {/* Global Quick Action Bar */}
        <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-[var(--surface-card)] to-[var(--surface-sunken)] p-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--brand-gold-600)]" />
              <h2 className="text-base font-semibold text-[var(--ink-900)]">Quick Multi-Platform Presets</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-500)]">
              Switch review status across all operating systems before submitting or after store approval.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkAction(true)}
              className="border-amber-400/40 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
            >
              <Lock className="mr-1.5 size-4" />
              Activate All Review Modes
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleBulkAction(false)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Unlock className="mr-1.5 size-4" />
              Set All Live (Production)
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchConfigs} aria-label="Refresh statuses">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </Card>

        {/* OS Settings Cards Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* iOS Card */}
          <OSConfigCard
            os="ios"
            title="Apple iOS App Store"
            subtitle="Controls review compliance behavior on iPhones and iPads"
            badgeTone="violet"
            config={configs.ios}
            isSaving={isSaving.ios}
            onToggleReview={() => handleToggleReview('ios')}
            onChangeField={(field, val) => handleChangeField('ios', field, val)}
            onToggleComponentTag={(tag) => handleToggleComponentTag('ios', tag)}
            onSave={() => handleSaveOS('ios')}
          />

          {/* Android Card */}
          <OSConfigCard
            os="android"
            title="Google Play Store (Android)"
            subtitle="Controls review compliance behavior on Android devices"
            badgeTone="success"
            config={configs.android}
            isSaving={isSaving.android}
            onToggleReview={() => handleToggleReview('android')}
            onChangeField={(field, val) => handleChangeField('android', field, val)}
            onToggleComponentTag={(tag) => handleToggleComponentTag('android', tag)}
            onSave={() => handleSaveOS('android')}
          />
        </div>

        {/* Interactive Mobile App Component Simulation Sandbox */}
        <Card className="overflow-hidden border border-[var(--line)] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="size-5 text-[var(--brand-gold-600)]" />
                <h2 className="text-lg font-semibold text-[var(--ink-900)]">
                  Live Mobile App Component Simulator
                </h2>
              </div>
              <p className="mt-1 text-xs text-[var(--ink-500)]">
                Inspect how mobile UI components adapt right now based on the active status of the selected OS.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-sunken)] p-1.5">
              <button
                type="button"
                onClick={() => setSimulatedOS('ios')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  simulatedOS === 'ios'
                    ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-sm'
                    : 'text-[var(--ink-400)] hover:text-[var(--ink-900)]'
                }`}
              >
                <span>🍎 iOS</span>
                {configs.ios.inReview ? (
                  <span className="size-2 rounded-full bg-amber-500" />
                ) : (
                  <span className="size-2 rounded-full bg-emerald-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setSimulatedOS('android')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  simulatedOS === 'android'
                    ? 'bg-[var(--surface-card)] text-[var(--ink-900)] shadow-sm'
                    : 'text-[var(--ink-400)] hover:text-[var(--ink-900)]'
                }`}
              >
                <span>🤖 Android</span>
                {configs.android.inReview ? (
                  <span className="size-2 rounded-full bg-amber-500" />
                ) : (
                  <span className="size-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Simulation Status Card */}
            <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-400)]">
                  Active Simulated OS
                </span>
                <Badge tone={simulatedOS === 'ios' ? 'violet' : 'success'}>
                  {simulatedOS.toUpperCase()}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-[var(--ink-400)]">Current Review State:</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {isSimInReview ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      <span className="size-2 animate-pulse rounded-full bg-amber-500" />
                      IN REVIEW MODE (Active)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      PRODUCTION LIVE (Inactive)
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-500)]">
                <p className="font-medium text-[var(--ink-900)]">Review Version Filter:</p>
                <p className="mt-0.5 text-[var(--ink-400)]">
                  {activeSimConfig?.reviewVersion ? `Build v${activeSimConfig.reviewVersion}` : 'All mobile app builds'}
                </p>
              </div>

              <div className="border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-500)]">
                <p className="font-medium text-[var(--ink-900)]">Hidden Component Tags ({activeSimConfig?.hiddenComponents?.length || 0}):</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeSimConfig?.hiddenComponents && activeSimConfig.hiddenComponents.length > 0 ? (
                    activeSimConfig.hiddenComponents.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-300"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--ink-300)]">None excluded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile View Preview Sample */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-700)]">
                  Live Mobile UI Component Rendering:
                </span>
                <span className="text-[11px] text-[var(--ink-400)]">
                  Updates immediately when you toggle review mode
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Subscription / Course Paywall Component */}
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 transition-all">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--ink-900)]">
                        Course Purchase & Subscription Component
                      </span>
                      <span className="font-mono text-[10px] text-[var(--ink-300)]">
                        (tag: subscription_paywall)
                      </span>
                    </div>
                    {isSimInReview ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <EyeOff className="size-3.5" /> Review Alternative Shown
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Eye className="size-3.5" /> Standard Live Paywall Shown
                      </span>
                    )}
                  </div>

                  {isSimInReview ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-amber-800 dark:text-amber-300">
                            🎓 Standard Educational Access
                          </p>
                          <p className="mt-0.5 text-[var(--ink-500)]">
                            All chapters and interactive flashcards unlocked for platform evaluation.
                          </p>
                        </div>
                        <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700">
                          Start Chapter 1
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--brand-gold-300)] bg-[var(--brand-gold-50)] p-4 text-xs dark:bg-amber-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">
                            ⚡ SabiLearn Premium Subscription — ₦5,000 / month
                          </p>
                          <p className="mt-0.5 text-[var(--ink-500)]">
                            Unlock unlimited AI quiz generator, offline access & certified certificates.
                          </p>
                        </div>
                        <button className="rounded-lg bg-[var(--brand-gold-600)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90">
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. External Payment & Direct Links */}
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 transition-all">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--ink-900)]">
                        External Checkout & Web Gateway
                      </span>
                      <span className="font-mono text-[10px] text-[var(--ink-300)]">
                        (tag: external_payment)
                      </span>
                    </div>
                    {isSimInReview ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <EyeOff className="size-3.5" /> Direct Checkout Bypassed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Eye className="size-3.5" /> Paystack / Card Gateway Active
                      </span>
                    )}
                  </div>

                  {isSimInReview ? (
                    <div className="rounded-xl bg-[var(--surface-sunken)] p-3 text-xs text-[var(--ink-500)]">
                      <p className="font-medium text-[var(--ink-700)]">
                        ✓ In-App Native Verification Mode
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink-400)]">
                        External payment redirect disabled per {simulatedOS.toUpperCase()} App Store Guidelines 3.1.1.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl bg-[var(--surface-sunken)] p-3 text-xs">
                      <span className="text-[var(--ink-700)]">💳 Pay with Debit Card / Bank Transfer</span>
                      <span className="text-xs font-semibold text-[var(--brand-gold-600)]">Paystack Gateway →</span>
                    </div>
                  )}
                </div>

                {/* 3. Account Privacy & Settings Guard */}
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 transition-all">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--ink-900)]">
                        Legal & Account Deletion Compliance
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="size-3.5" /> Store Compliant
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface-sunken)] p-3 text-xs text-[var(--ink-600)]">
                    <span>Account Deletion, Terms of Service & Privacy Policy</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Always Visible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminGuard>
  );
}

interface OSConfigCardProps {
  os: SupportedOS;
  title: string;
  subtitle: string;
  badgeTone: 'violet' | 'success';
  config: AppReviewConfig;
  isSaving: boolean;
  onToggleReview: () => void;
  onChangeField: (field: keyof AppReviewConfig, value: any) => void;
  onToggleComponentTag: (tag: string) => void;
  onSave: () => void;
}

function OSConfigCard({
  os,
  title,
  subtitle,
  badgeTone,
  config,
  isSaving,
  onToggleReview,
  onChangeField,
  onToggleComponentTag,
  onSave,
}: OSConfigCardProps) {
  const isInReview = !!config.inReview;

  return (
    <Card className="relative flex flex-col justify-between border border-[var(--line)] p-6 shadow-[var(--shadow-sm)]">
      <div>
        {/* Header with Title & Platform Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-2xl ${
                os === 'ios' ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              <Smartphone className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink-900)]">{title}</h3>
              <p className="text-xs text-[var(--ink-400)]">{subtitle}</p>
            </div>
          </div>
          <Badge tone={badgeTone}>{os.toUpperCase()}</Badge>
        </div>

        {/* Big Switch Banner */}
        <div
          className={`mt-6 flex items-center justify-between rounded-2xl border p-4 transition-all ${
            isInReview
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--ink-900)]">
                {isInReview ? 'App Review Mode: ACTIVE' : 'App Review Mode: INACTIVE'}
              </span>
              <span
                className={`inline-block size-2 rounded-full ${
                  isInReview ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
            <p className="text-xs text-[var(--ink-500)]">
              {isInReview
                ? 'Reviewer-safe components are showing in the mobile app.'
                : 'Full production features & live payment systems are active.'}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isInReview}
            onClick={onToggleReview}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isInReview ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isInReview ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Configuration Fields */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-700)]">
                Target Review Version (Optional)
              </label>
              <input
                type="text"
                value={config.reviewVersion || ''}
                onChange={(e) => onChangeField('reviewVersion', e.target.value)}
                placeholder="e.g. 1.0.0 or leave empty for all"
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--ink-900)] focus:border-[var(--brand-gold-600)] focus:outline-none"
              />
              <span className="text-[10px] text-[var(--ink-400)]">
                Leave blank to activate review mode for all versions.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-700)]">
                Min Version Constraint (Optional)
              </label>
              <input
                type="text"
                value={config.minVersion || ''}
                onChange={(e) => onChangeField('minVersion', e.target.value)}
                placeholder="e.g. 1.0.0"
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--ink-900)] focus:border-[var(--brand-gold-600)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-700)]">
              Admin Notes / Submission Context
            </label>
            <input
              type="text"
              value={config.notes || ''}
              onChange={(e) => onChangeField('notes', e.target.value)}
              placeholder="e.g. App Store review for submission v1.0.2 with Apple IAP guidelines"
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--ink-900)] focus:border-[var(--brand-gold-600)] focus:outline-none"
            />
          </div>

          {/* Preset Hidden Components Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-[var(--ink-700)]">
              Components Hidden During Review:
            </label>
            <div className="space-y-1.5">
              {PRESET_HIDDEN_COMPONENTS.map((item) => {
                const isSelected = (config.hiddenComponents || []).includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleComponentTag(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? 'border-amber-500/40 bg-amber-500/10 text-[var(--ink-900)]'
                        : 'border-[var(--line)] bg-[var(--surface-card)] text-[var(--ink-500)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-[10px] text-[var(--ink-400)]">{item.desc}</p>
                    </div>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-[var(--line)] bg-[var(--surface-card)]'
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Audit info & Save Button */}
      <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <div className="text-[11px] text-[var(--ink-400)]">
          {config.updatedAt ? (
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>Updated {new Date(config.updatedAt).toLocaleDateString()}</span>
            </div>
          ) : (
            <span>Not yet updated</span>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? <LoadingSpinner size="sm" /> : <Save className="size-4" />}
          <span>Save {os.toUpperCase()} Config</span>
        </Button>
      </div>
    </Card>
  );
}
