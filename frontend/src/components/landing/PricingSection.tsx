'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type BillingPeriod = 'monthly' | 'yearly';

interface PricingPlan {
  name: string;
  subtitle: string;
  monthlyPrice: string;
  monthlyPeriod: string;
  yearlyPrice: string;
  yearlyPeriod: string;
  yearlyNote?: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isPopular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: 'Free Plan',
    subtitle: 'No credit card required',
    monthlyPrice: '₦0',
    monthlyPeriod: '/month',
    yearlyPrice: '₦0',
    yearlyPeriod: '/forever',
    features: [
      'Access to free foundational courses',
      'Interactive exercises & quizzes',
      'Daily AI study assistant tokens',
      'Streak tracking & XP leaderboard',
    ],
    ctaText: 'Start Learning',
    ctaHref: '/auth/register',
  },
  {
    name: 'Single Course',
    subtitle: 'One-time lifetime ownership',
    monthlyPrice: '₦2,500',
    monthlyPeriod: '/course',
    yearlyPrice: '₦2,500',
    yearlyPeriod: '/course',
    yearlyNote: 'One-time payment',
    features: [
      'Lifetime access to chosen course',
      'All topics, exercises & capstones',
      'Verified certificate of completion',
      'No subscription or recurring charges',
    ],
    ctaText: 'Browse Courses',
    ctaHref: '/courses',
  },
  {
    name: 'All-Access Pass',
    subtitle: 'Card, Bank Transfer or USSD',
    monthlyPrice: '₦3,000',
    monthlyPeriod: '/month',
    yearlyPrice: '₦2,500',
    yearlyPeriod: '/month',
    yearlyNote: 'Billed ₦30,000 annually',
    features: [
      'Unlimited access to all courses',
      'Unlimited AI Summaries, Quizzes & Q&A',
      'Verified certificates for all courses',
      'Priority AI speed & offline study mode',
    ],
    ctaText: 'Purchase Now',
    ctaHref: '/dashboard/subscribe',
    isPopular: true,
  },
  {
    name: 'Annual Pass',
    subtitle: 'Best value for dedicated learners',
    monthlyPrice: '₦30,000',
    monthlyPeriod: '/year',
    yearlyPrice: '₦30,000',
    yearlyPeriod: '/year',
    yearlyNote: 'Save ₦6,000 (2 Months Free)',
    features: [
      'Includes 2 months free discount',
      'All present & upcoming courses',
      'Early access to new course drops',
      'Exclusive community masterclasses',
    ],
    ctaText: 'Purchase Now',
    ctaHref: '/dashboard/subscribe',
  },
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section id="pricing" className="border-t border-[var(--line)] bg-white px-6 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Top Header & Monthly/Yearly Toggle */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h2 className="text-3xl font-[var(--font-display)] font-bold tracking-tight text-[#0E0E1A] sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
              Get exclusive <br />
              pricing plans based <br />
              on your requirement
            </h2>
          </div>

          {/* Toggle Switch */}
          <div className="inline-flex rounded-xl border-2 border-[#0E0E1A] bg-white p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`cursor-pointer rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#F8BE43] text-[#0E0E1A] shadow-sm'
                  : 'text-[#0E0E1A] hover:bg-slate-100'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`cursor-pointer rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-[#F8BE43] text-[#0E0E1A] shadow-sm'
                  : 'text-[#0E0E1A] hover:bg-slate-100'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* 2x2 Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const period = billingPeriod === 'monthly' ? plan.monthlyPeriod : plan.yearlyPeriod;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl border-2 border-[#0E0E1A] bg-white p-6 transition-shadow duration-200 hover:shadow-md sm:p-8 ${
                  plan.isPopular ? 'ring-1 ring-[#0E0E1A]' : ''
                }`}
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
                  {/* Left Column: Title, Subtitle, Features */}
                  <div className="flex flex-col sm:col-span-7">
                    <h3 className="text-xl font-[var(--font-display)] font-bold text-[#0E0E1A] sm:text-2xl">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#555568]">{plan.subtitle}</p>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-[#0E0E1A]">
                          <svg
                            className="size-4 shrink-0 fill-current text-[#0E0E1A]"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Price & CTA Button */}
                  <div className="flex flex-col justify-between pt-4 sm:col-span-5 sm:items-end sm:pt-0">
                    <div className="sm:text-right">
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <span className="text-3xl font-[var(--font-display)] font-extrabold text-[#0E0E1A] sm:text-4xl">
                          {price}
                        </span>
                        <span className="text-sm font-semibold text-[#0E0E1A]">{period}</span>
                      </div>
                      {billingPeriod === 'yearly' && plan.yearlyNote && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600 sm:text-right">
                          {plan.yearlyNote}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 w-full sm:mt-8 sm:w-auto">
                      <Link
                        href={plan.ctaHref}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#0E0E1A] px-6 py-3 text-sm font-bold transition-all duration-200 active:translate-y-0.5 sm:w-auto ${
                          plan.isPopular
                            ? 'bg-[#F8BE43] text-[#0E0E1A] shadow-sm hover:bg-[#f2b330]'
                            : 'bg-white text-[#0E0E1A] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="size-4 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
