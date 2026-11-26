import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconCheck, IconClock } from '@tabler/icons-react';
import { Button, Card, ProgressBar } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding.store';

const INTERESTS = [
  { id: 'ai', title: 'AI & Machine Learning', desc: 'Build smart tools & prompt workflows' },
  { id: 'websites', title: 'Web Development', desc: 'HTML, CSS, JavaScript & full-stack apps' },
  { id: 'mobile', title: 'Mobile & Software', desc: 'Apps, Python, and backend APIs' },
  { id: 'games', title: 'CS & University Courses', desc: 'Ace engineering & science exams' },
];

const STARTER_COURSES = [
  { id: 'python', title: 'Python Programming for Beginners', tag: 'Bundled Offline' },
  { id: 'web_dev', title: 'Web Development: HTML, CSS & JS', tag: 'Bundled Offline' },
  { id: 'prompt_engineering', title: 'Prompt Engineering', tag: 'Popular' },
  { id: 'django', title: 'Backend & APIs', tag: 'Track' },
];

const DAILY_GOALS = [
  { minutes: 5, title: '5 min / day', subtitle: 'Casual — keep the streak alive' },
  { minutes: 10, title: '10 min / day', subtitle: 'Steady — recommended for busy schedules', recommended: true },
  { minutes: 20, title: '20 min / day', subtitle: 'Focused — fast exam & career prep' },
];

export function OnboardingWizard() {
  const {
    interest,
    starterCourse,
    dailyGoalMinutes,
    reminderTime,
    setInterest,
    setStarterCourse,
    setDailyGoalMinutes,
    setReminderTime,
    completeOnboarding,
  } = useOnboardingStore();

  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const finish = async (dest: '/login' | '/register') => {
    await completeOnboarding();
    navigate(dest, { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-app)]">
      <Card variant="featured" className="w-full max-w-[600px] p-7">
        {step > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              aria-label="Previous step"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] cursor-pointer"
            >
              <IconArrowLeft size={18} />
            </button>
            <ProgressBar value={(step / 4) * 100} height={6} />
            <span className="text-[12px] font-semibold text-[var(--text-tertiary)] shrink-0">
              {step} / 4
            </span>
          </div>
        )}

        {step === 0 && (
          <div className="text-center py-2">
            <img
              src="/assets/onboarding/mascot_hero_classroom.webp"
              alt="SabiLearn Classroom"
              className="w-56 h-44 object-contain mx-auto mb-5 select-none"
            />
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
              Study smarter on desktop
            </h1>
            <p className="text-[14.5px] text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
              Interactive lessons, offline bundled courses, built-in Python & Web playground, and a
              docked AI Tutor — built to be fast and light.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => setStep(1)} icon={<IconArrowRight size={17} />}>
                Get Started
              </Button>
              <Button size="lg" variant="secondary" onClick={() => void finish('/login')}>
                I already have an account
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
              What are you most excited to learn?
            </h2>
            <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1 mb-5">
              We will personalize your starting recommendations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERESTS.map((item) => {
                const selected = interest === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInterest(item.id)}
                    className={[
                      'text-left p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer',
                      selected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-sunken)]',
                    ].join(' ')}
                  >
                    <div className="font-bold text-[14.5px] text-[var(--text-primary)]">
                      {item.title}
                    </div>
                    <div className="text-[12.5px] text-[var(--text-tertiary)] mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
              Pick a starter course
            </h2>
            <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1 mb-5">
              Two complete beginner courses are already bundled for instant offline study.
            </p>
            <div className="space-y-2.5">
              {STARTER_COURSES.map((c) => {
                const selected = starterCourse === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setStarterCourse(c.id)}
                    className={[
                      'w-full flex items-center justify-between p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer text-left',
                      selected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-sunken)]',
                    ].join(' ')}
                  >
                    <span className="font-semibold text-[14.5px] text-[var(--text-primary)]">
                      {c.title}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
                      {c.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
              Set your daily study goal
            </h2>
            <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1 mb-5">
              Consistency beats cramming. You can adjust this anytime in Settings.
            </p>
            <div className="space-y-2.5">
              {DAILY_GOALS.map((g) => {
                const selected = dailyGoalMinutes === g.minutes;
                return (
                  <button
                    key={g.minutes}
                    type="button"
                    onClick={() => setDailyGoalMinutes(g.minutes)}
                    className={[
                      'w-full flex items-center justify-between p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer text-left',
                      selected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-sunken)]',
                    ].join(' ')}
                  >
                    <div>
                      <div className="font-bold text-[14.5px] text-[var(--text-primary)]">
                        {g.title}
                      </div>
                      <div className="text-[12.5px] text-[var(--text-tertiary)]">{g.subtitle}</div>
                    </div>
                    {g.recommended && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)]">
                        Recommended
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
              Daily study reminder time
            </h2>
            <p className="text-[13.5px] text-[var(--text-tertiary)] mt-1 mb-5">
              We will show a gentle desktop notification at your chosen time.
            </p>
            <div className="flex items-center justify-center gap-3 py-6 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] border border-[var(--border-default)]">
              <IconClock size={22} className="text-[var(--brand-primary)]" />
              <select
                aria-label="Reminder hour"
                value={reminderTime.hour}
                onChange={(e) => setReminderTime({ ...reminderTime, hour: Number(e.target.value) })}
                className="h-10 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-card)] border border-[var(--border-default)] font-semibold"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="font-bold">:</span>
              <select
                aria-label="Reminder minute"
                value={reminderTime.minute}
                onChange={(e) =>
                  setReminderTime({ ...reminderTime, minute: Number(e.target.value) })
                }
                className="h-10 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-card)] border border-[var(--border-default)] font-semibold"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                aria-label="AM or PM"
                value={reminderTime.period}
                onChange={(e) =>
                  setReminderTime({ ...reminderTime, period: e.target.value as 'AM' | 'PM' })
                }
                className="h-10 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-card)] border border-[var(--border-default)] font-semibold"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        )}

        {step > 0 && (
          <div className="mt-7 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => void finish('/login')}>
              Skip to Sign In
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} icon={<IconArrowRight size={16} />}>
                Continue
              </Button>
            ) : (
              <Button onClick={() => void finish('/register')} icon={<IconCheck size={16} />}>
                Finish & Create Account
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
