import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconMail } from '@tabler/icons-react';
import { Button, Card, Input } from '@/components/ui';
import { authApi } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
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
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
        >
          <IconArrowLeft size={16} /> Back to Sign In
        </Link>

        <Card variant="featured" className="p-6">
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Reset password</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1 mb-5">
            Enter the email linked to your SabiLearn account and we will send reset instructions.
          </p>

          {sent ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--success-bg)] text-[var(--success)] p-4 flex items-start gap-3">
              <IconCheck size={18} className="shrink-0 mt-0.5" />
              <div className="text-[13.5px]">
                <p className="font-semibold">Reset link dispatched</p>
                <p className="mt-1 opacity-90">
                  Check your inbox at <strong>{email}</strong> for password reset instructions.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger)] px-3 py-2 text-[13px]"
                >
                  <IconAlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                autoFocus
                placeholder="you@university.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<IconMail size={16} />}
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
