'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import AuthLayout from '@/components/auth/AuthLayout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import { getRedirectFromLocation, useRedirectParam, withRedirect } from '@/lib/redirect';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { register, loginWithGoogle } = useAuthStore();
  const redirectTarget = useRedirectParam();

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push(getRedirectFromLocation()), 800);
    } else {
      setError(result.error || 'Google sign-up failed.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !email || !password || !level) return setError('Please fill in all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (!agreeTerms) return setError('You must agree to the terms to proceed.');
    setIsLoading(true);
    const result = await register({ firstName, lastName, email, password, level });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push(getRedirectFromLocation()), 800);
    } else {
      setError(result.error || 'Account creation failed.');
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout panelTitle="Start your prep in minutes" panelSubtitle="Free to start — no card required.">
      <h1 className="text-4xl font-[var(--font-display)] font-bold tracking-[var(--tracking-tight)] text-[var(--ink-900)]">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Free to start — no card required.</p>

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
          <h3 className="mt-4 text-lg font-bold text-[var(--ink-900)]">Account created</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Redirecting you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-100)] p-3 text-xs text-[var(--danger)]">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" required disabled={isLoading} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            <Input label="Last name" required disabled={isLoading} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
          </div>

          <Input label="Email address" type="email" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-[38px] right-3.5 text-[var(--ink-300)] hover:text-[var(--ink-900)]">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <Select
            label="Level"
            required
            disabled={isLoading}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Select your level"
            options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]}
          />

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
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Sign up'}
          </Button>

          <div className="pt-2 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href={withRedirect('/auth/login', redirectTarget)} className="font-semibold text-[var(--brand-gold-600)] hover:underline">
              Log in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
