'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqs } from '@/lib/faqs';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="border-t border-[var(--line)] bg-[var(--surface-page)] px-6 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-4 text-3xl font-[var(--font-display)] font-bold tracking-tight text-[#0E0E1A] sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
            Everything you need to know about SabiLearn
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#555568] sm:text-lg">
            Have questions about courses, AI tools, or pricing? Here are answers to our most common questions.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-4 sm:mt-16">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const headingId = `faq-heading-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border-2 border-[#0E0E1A] bg-white transition-shadow duration-200 hover:shadow-sm"
              >
                <button
                  type="button"
                  id={headingId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50/60 sm:p-7"
                >
                  <span className="text-lg font-[var(--font-display)] font-bold text-[#0E0E1A] sm:text-xl">
                    {faq.question}
                  </span>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-[#0E0E1A] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#F8BE43]' : 'bg-white'
                    }`}
                  >
                    <ChevronDown className="size-4 stroke-[2.5] text-[#0E0E1A]" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className="border-t border-[#0E0E1A]/10 px-6 pb-6 pt-4 text-base leading-relaxed text-[#555568] sm:px-7 sm:pb-7"
                  >
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
