import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconAlertTriangle, IconBrandGoogle, IconEye, IconEyeOff, IconLock, IconMail } from '@tabler/icons-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { isGoogleDesktopAuthEnabled } from '@/lib/googleAuth';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const googleEnabled = isGoogleDesktopAuthEnabled();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const res = await login(email, password);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const res = await loginWithGoogle();
    if (res.success) {
      navigate('/', { replace: true });
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-app)]"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && error) setError(null);
      }}
    >
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/assets/onboarding/tutor-mascot.webp"
            alt="SabiLearn Tutor"
            className="w-20 h-20 object-contain mb-3 select-none"
          />
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back to SabiLearn
          </h1>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-1">
            Sign in to continue your courses, streaks, and AI study tools.
          </p>
        </div>

        <Card variant="featured" className="p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger)] px-3.5 py-2.5 text-[13px]"
            >
              <IconAlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              ref={emailRef}
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<IconMail size={16} />}
            />

            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<IconLock size={16} />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                >
                  {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              }
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[12.5px] font-semibold text-[var(--text-link)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              Sign In
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
                <div className="h-px flex-1 bg-[var(--border-default)]" />
                <span>or</span>
                <div className="h-px flex-1 bg-[var(--border-default)]" />
              </div>
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={handleGoogle}
                disabled={isLoading}
                icon={<IconBrandGoogle size={18} />}
              >
                Continue with Google
              </Button>
            </>
          )}
        </Card>

        <p className="text-center text-[13.5px] text-[var(--text-tertiary)] mt-5">
          New to SabiLearn?{' '}
          <Link to="/register" className="font-semibold text-[var(--text-link)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
