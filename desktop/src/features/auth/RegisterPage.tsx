import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconAlertTriangle, IconEye, IconEyeOff, IconLock, IconMail, IconUser } from '@tabler/icons-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in all fields (password must be at least 6 characters).');
      return;
    }
    const res = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      level,
    });
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-app)] overflow-y-auto"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && error) setError(null);
      }}
    >
      <div className="w-full max-w-[460px]">
        <div className="flex flex-col items-center text-center mb-5">
          <img
            src="/assets/onboarding/tutor-mascot.webp"
            alt="SabiLearn Tutor"
            className="w-16 h-16 object-contain mb-2 select-none"
          />
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            Create your SabiLearn account
          </h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1">
            Learn tech skills and university courses faster — even offline.
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                autoFocus
                placeholder="Ada"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<IconUser size={15} />}
              />
              <Input
                label="Last name"
                placeholder="Okafor"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<IconMail size={15} />}
            />

            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<IconLock size={15} />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                >
                  {showPw ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              }
            />

            <div>
              <span className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Current experience level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    className={[
                      'py-2 px-3 rounded-[var(--radius-sm)] border text-[13px] font-semibold capitalize transition-colors cursor-pointer',
                      level === lv
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]',
                    ].join(' ')}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              Create Account
            </Button>
          </form>
        </Card>

        <p className="text-center text-[13.5px] text-[var(--text-tertiary)] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--text-link)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
