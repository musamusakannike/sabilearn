import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/us/app/sabilearn/id6800027018';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.codiac.sabilearn';

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.365 1.43c0 1.14-.46 2.22-1.2 3.01-.8.86-2.1 1.52-3.17 1.43-.14-1.1.41-2.25 1.15-3 .82-.85 2.2-1.48 3.22-1.44zM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.78-4.04-3.35C.01 16.1-.28 10.9 1.43 8.24c1.21-1.89 3.12-3 4.92-3 1.83 0 2.98 1.01 4.5 1.01 1.47 0 2.36-1.01 4.49-1.01 1.6 0 3.3.87 4.51 2.38-3.96 2.17-3.32 7.83.65 9.48z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#00D7FE" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1L13.5 12v-.2L3.7 1.7l-.1.1z" />
      <path fill="#FFCE00" d="M16.8 15.3 13.5 12v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1-.0z" />
      <path fill="#FF3A44" d="m16.9 15.2-3.4-3.4L3.6 21.7c.4.4 1 .4 1.7.1l11.6-6.6" />
      <path fill="#00F076" d="M16.9 8.5 5.3 1.9c-.7-.4-1.3-.3-1.7.1l9.9 9.8 3.4-3.3z" />
    </svg>
  );
}

function StoreButton({
  href,
  icon,
  topLabel,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  topLabel: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${topLabel} ${label}`}
      className="group inline-flex items-center gap-3 rounded-lg border-2 border-[#0E0E1A] bg-[#0E0E1A] px-4 py-2.5 text-white shadow-sm transition-all duration-200 hover:bg-[#1c1c2e] hover:shadow active:translate-y-0.5"
    >
      {icon}
      <span className="flex flex-col items-start leading-none">
        <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">
          {topLabel}
        </span>
        <span className="mt-1 font-[var(--font-display)] text-base font-bold tracking-tight">
          {label}
        </span>
      </span>
    </a>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-8 pb-16 sm:px-8 lg:pt-14 lg:pb-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Heading & CTA */}
        <div className="flex flex-col items-start lg:col-span-6 xl:col-span-5">
          <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-[-0.03em] text-[#0E0E1A] leading-[1.08] sm:text-5xl lg:text-[62px]">
            Tools to make your learning journey amazing now.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-[#555568] sm:text-lg">
            SabiLearn is a comprehensive learning platform that teaches practical skills, tests your knowledge with interactive quizzes, and accelerates study with AI in a simple click.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border-2 border-[#0E0E1A] bg-[#F8BE43] px-7 py-3.5 font-[var(--font-display)] text-base font-bold text-[#0E0E1A] shadow-sm transition-all duration-200 hover:bg-[#f2b330] hover:shadow active:translate-y-0.5"
            >
              <span>Start Learning</span>
              <ArrowRight className="size-5 stroke-[2.5]" />
            </Link>
          </div>

          {/* App download options */}
          <div className="mt-8">
            <p className="text-sm font-medium text-[#555568]">
              Or take SabiLearn with you:
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StoreButton
                href={APP_STORE_URL}
                topLabel="Download on the"
                label="App Store"
                icon={<AppleIcon className="size-7 shrink-0" />}
              />
              <StoreButton
                href={PLAY_STORE_URL}
                topLabel="Get it on"
                label="Google Play"
                icon={<PlayIcon className="size-6 shrink-0" />}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic */}
        <div className="relative flex items-center justify-center lg:col-span-6 xl:col-span-7">
          <div className="relative w-full max-w-[680px]">
            <Image
              src="/images/hero.webp"
              alt="SabiLearn dashboard with courses, student learning badge and progress tracking"
              width={780}
              height={580}
              priority
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 680px"
              className="h-auto w-full object-contain drop-shadow-sm select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}