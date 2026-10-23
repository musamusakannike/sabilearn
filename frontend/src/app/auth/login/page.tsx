'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import AuthLayout from '@/components/auth/AuthLayout';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import { getRedirectFromLocation, useRedirectParam, withRedirect } from '@/lib/redirect';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuthStore();
  const redirectTarget = useRedirectParam();

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push(getRedirectFromLocation()), 800);
    } else {
      setError(result.error || 'Google login failed.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please fill in all fields.');
    if (!agreeTerms) return setError('You must agree to the Terms and Privacy Policy.');
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push(getRedirectFromLocation()), 800);
    } else {
      setError(result.error || 'Login failed.');
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout panelTitle="Learn a skill. Sabi it for life." panelSubtitle="Short study sessions, built for consistency.">
      <h1 className="text-4xl font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)]">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Log in to keep your streak alive.</p>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-[var(--radius-full)] border border-[var(--line)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--ink-900)] hover:border-[var(--line-strong)] disabled:opacity-60"
      >
        <Image src="/google.png" alt="Google logo" width={20} height={20} className="size-5 shrink-0" />
        <span>Continue with Google</span>
      </button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs font-semibold tracking-wide text-[var(--ink-300)]">OR</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      {success ? (
        <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center shadow-[var(--shadow-sm)]">
          <CheckCircle2 className="mx-auto size-12 text-[var(--success)]" />
          <h3 className="mt-4 text-lg font-bold text-[var(--ink-900)]">Login successful</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Redirecting you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-100)] p-3 text-xs text-[var(--danger)]">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input label="Email address" type="email" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-[38px] right-3.5 text-[var(--ink-300)] hover:text-[var(--ink-900)]">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <div className="-mt-2 flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-[var(--brand-gold-600)] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Checkbox
            checked={agreeTerms}
            onChange={setAgreeTerms}
            label={
              <span className="text-xs leading-relaxed text-[var(--text-muted)]">
                By continuing you agree to the <Link href="/terms" className="text-[var(--brand-gold-600)] hover:underline">terms of service</Link> and{' '}
                <Link href="/privacy" className="text-[var(--brand-gold-600)] hover:underline">privacy policy</Link>
              </span>
            }
          />

          <Button type="submit" disabled={isLoading} fullWidth size="lg">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Log in'}
          </Button>

          <div className="pt-2 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link href={withRedirect('/auth/register', redirectTarget)} className="font-semibold text-[var(--brand-gold-600)] hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
