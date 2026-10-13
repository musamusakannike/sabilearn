import quiz2025Data from '@/data/swep_2025_quiz.json';
import quiz2018Data from '@/data/swep_2018_quiz.json';

export const GUEST_MAX_QUESTIONS = 10;
export const SWEP_ENROLLMENT_KEY = 'swepEnrollment';
export const SWEP_FAB_DISMISSED_KEY = 'swepFabDismissed';
export const SWEP_SHEET_SESSION_KEY = 'swepSheetSessionDismissed';
export const SWEP_ENROLLMENT_EVENT = 'swep-enrollment-changed';

export type SwepEnrollment = 'yes' | 'no';
export type SwepYear = '2018' | '2025';

export interface SwepOption {
  text: string;
  isCorrect: boolean;
}

export interface SwepQuestion {
  id: number;
  questionNumber: number;
  unitNumber: number;
  unitName: string;
  type: string;
  question: string;
  formattedOptions: SwepOption[];
  explanation: string;
  xp: number;
}

export interface SwepUnit {
  unitNumber: number;
  unitName: string;
  questionRange: string;
  questionCount: number;
}

export interface SwepQuizData {
  title: string;
  preparedBy: string;
  course: string;
  totalQuestions: number;
  totalUnits: number;
  units: SwepUnit[];
  questions: SwepQuestion[];
}

export interface SwepEditionInfo {
  id: SwepYear;
  title: string;
  shortLabel: string;
  session: string;
  badge: string;
  description: string;
  highlights: string[];
  totalQuestions: number;
  totalUnits: number;
  preparedBy: string;
}

export const swep2018Quiz = quiz2018Data as SwepQuizData;
export const swep2025Quiz = quiz2025Data as SwepQuizData;

export const swepQuizzes: Record<SwepYear, SwepQuizData> = {
  '2018': swep2018Quiz,
  '2025': swep2025Quiz,
};

// Default quiz for backward compatibility
export const swepQuiz = swep2018Quiz;

export const SWEP_EDITIONS: SwepEditionInfo[] = [
  {
    id: '2018',
    title: 'SWEP 2018 Official Past Questions',
    shortLabel: '2018 Past Questions',
    session: '2017/2018 Examination Paper',
    badge: '321 Questions · 8 Units',
    description:
      'Extracted directly from the official Unilorin SWEP 2018 examination papers across all 8 workshop units: Foundry, Chemical, PCB, Automobile & Diesel, Machining & Welding, Electrical, Equipment Maintenance, and Biomedical.',
    highlights: [
      'Chemical Process (30 Qs)',
      'Foundry & Casting (28 Qs)',
      'Plumbing & Concrete (57 Qs)',
      'Automobile & Tractor (67 Qs)',
      'Machining & Welding (71 Qs)',
      'Electrical Power & Electronics (40 Qs)',
      'Equipment Maintenance (15 Qs)',
      'Biomedical Technology (13 Qs)',
    ],
    totalQuestions: swep2018Quiz.totalQuestions,
    totalUnits: swep2018Quiz.totalUnits,
    preparedBy: swep2018Quiz.preparedBy,
  },
  {
    id: '2025',
    title: 'SWEP 2025/2026 Practice Questions',
    shortLabel: '2025/2026 Practice Set',
    session: 'Modern Workshop Curriculum',
    badge: '180 Questions · 9 Units',
    description:
      'Curated question bank reflecting the modern engineering workshop curriculum with full answer rationales and study explanations.',
    highlights: [
      '9 Modern Workshop Units',
      '20 Questions per Unit',
      'Food Processing & Aeroponics',
      'Woodwork & Upholstery',
      'Comprehensive Explanations',
    ],
    totalQuestions: swep2025Quiz.totalQuestions,
    totalUnits: swep2025Quiz.totalUnits,
    preparedBy: swep2025Quiz.preparedBy,
  },
];

export const TOTAL_SWEP_QUESTIONS = swep2018Quiz.totalQuestions + swep2025Quiz.totalQuestions;

export const COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

export function parseYearParam(value: string | null): SwepYear {
  if (value === '2025' || value === '2026') return '2025';
  if (value === '2018') return '2018';
  return '2018';
}

export function getSwepQuiz(year: SwepYear = '2018'): SwepQuizData {
  return swepQuizzes[year] || swepQuizzes['2018'];
}

export function filterQuestions(unitNumber: number | 'all', year: SwepYear = '2018'): SwepQuestion[] {
  const quiz = getSwepQuiz(year);
  if (unitNumber === 'all') return [...quiz.questions];
  return quiz.questions.filter((q) => q.unitNumber === unitNumber);
}

export function buildSession(
  unitNumber: number | 'all',
  count: number,
  random: boolean,
  year: SwepYear = '2018',
): SwepQuestion[] {
  const pool = filterQuestions(unitNumber, year);
  const ordered = random
    ? [...pool].sort(() => Math.random() - 0.5)
    : [...pool].sort((a, b) => a.questionNumber - b.questionNumber);
  if (count <= 0) return ordered;
  return ordered.slice(0, Math.min(count, ordered.length));
}

export function parseUnitParam(value: string | null, year: SwepYear = '2018'): number | 'all' {
  if (!value || value === 'all') return 'all';
  const n = Number(value);
  const quiz = getSwepQuiz(year);
  if (!Number.isInteger(n) || !quiz.units.some((u) => u.unitNumber === n)) return 'all';
  return n;
}

export function unitLabel(unitNumber: number | 'all', year: SwepYear = '2018'): string {
  if (unitNumber === 'all') return 'All units';
  const quiz = getSwepQuiz(year);
  const unit = quiz.units.find((u) => u.unitNumber === unitNumber);
  return unit ? `Unit ${unit.unitNumber} · ${unit.unitName}` : 'All units';
}

export function swepPracticeHref(
  base: '/swep' | '/dashboard/swep',
  opts: { year?: SwepYear; unit: number | 'all'; count: number; random: boolean },
): string {
  const params = new URLSearchParams();
  if (opts.year) params.set('year', opts.year);
  params.set('unit', opts.unit === 'all' ? 'all' : String(opts.unit));
  params.set('count', String(opts.count));
  params.set('random', opts.random ? '1' : '0');
  return `${base}/practice?${params.toString()}`;
}
