'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Coins,
  FileSpreadsheet,
  Landmark,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PublicQuizTopic } from '@/types/public-quiz';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Landmark,
  Coins,
  ShieldCheck,
  Calculator,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  BookOpen,
};

const ACCENT_STYLES: Record<PublicQuizTopic['accent'], { iconBg: string; badge: string }> = {
  gold: {
    iconBg: 'bg-[var(--brand-gold)] text-[var(--ink-900)]',
    badge: 'bg-[var(--brand-gold-100)] text-[var(--ink-900)]',
  },
  violet: {
    iconBg: 'bg-[var(--brand-violet)] text-white',
    badge: 'bg-[var(--brand-violet-100)] text-[var(--brand-violet)]',
  },
  emerald: {
    iconBg: 'bg-[#10B981] text-white',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  orange: {
    iconBg: 'bg-[#F97316] text-white',
    badge: 'bg-orange-100 text-orange-800',
  },
};

interface TopicCardProps {
  topic: PublicQuizTopic;
  index: number;
  basePath?: string;
}

export default function TopicCard({
  topic,
  index,
  basePath = '/public-quizzes/uil-get311',
}: TopicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = ICON_MAP[topic.icon] || BookOpen;
  const styles = ACCENT_STYLES[topic.accent] || ACCENT_STYLES.gold;
  const calcCount = topic.questions.filter((q) => q.difficulty === 'calculation').length;

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          delay: Math.min(index * 0.06, 0.35),
          ease: 'power2.out',
        }
      );
    }
  }, [index]);

  return (
    <Link href={`${basePath}/${topic.id}`} className="group block h-full no-underline">
      <div
        ref={cardRef}
        className="flex h-full flex-col justify-between rounded-2xl border-2 border-[var(--ink-900)] bg-[var(--surface-card)] p-6 shadow-[0_4px_0_#0E0E1A] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_7px_0_#0E0E1A]"
      >
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[var(--ink-900)] ${styles.iconBg}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles.badge}`}>
              {topic.questions.length} Qs
            </span>
          </div>

          <h2 className="text-lg font-bold leading-snug text-[var(--ink-900)] group-hover:text-[var(--brand-violet)] transition-colors">
            {topic.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
            {topic.description}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <span className="text-xs font-semibold text-[var(--ink-500)]">
            {calcCount > 0 ? `${calcCount} calculation${calcCount === 1 ? '' : 's'} included` : 'Conceptual mastery'}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--ink-900)] transition-transform group-hover:translate-x-1">
            Start <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
