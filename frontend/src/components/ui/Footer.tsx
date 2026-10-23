import React from 'react';
import Link from 'next/link';

const cols = [
  { title: 'Learn', links: [{ l: 'Courses', href: '/dashboard/courses' }, { l: 'Blog', href: '/blog' }, { l: 'AI tools', href: '/dashboard' }] },
  { title: 'Company', links: [{ l: 'About', href: '/' }, { l: 'Contact', href: '/' }] },
  { title: 'Legal', links: [{ l: 'Terms', href: '/terms' }, { l: 'Privacy', href: '/privacy' }, { l: 'Delete Account', href: '/delete-account' }] },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--ink-900)] px-6 pt-14 pb-8 font-[var(--font-body)] text-white sm:px-8">
      <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap justify-between gap-8">
        <div>
          <div className="text-lg font-[var(--font-display)] font-bold">
            Sabi<span className="text-[var(--brand-gold)]">Learn</span>
          </div>
          <p className="mt-2.5 max-w-[220px] text-sm leading-[var(--leading-relaxed)] text-[var(--ink-300)]">
            Learn a skill. Sabi it for life.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex flex-col gap-2.5">
            <span className="text-sm font-bold text-white">{c.title}</span>
            {c.links.map((l) => (
              <Link key={l.l} href={l.href} className="text-sm text-[var(--ink-300)] no-underline transition-colors hover:text-white">
                {l.l}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-[var(--ink-300)]">
        &copy; 2026 SabiLearn. Made in Nigeria. Built by{' '}
        <a href="https://www.codiac.online" target="_blank" rel="noopener" className="text-[var(--ink-300)] underline underline-offset-2 hover:text-white">
          Codiac
        </a>
        .
      </div>
    </footer>
  );
}
