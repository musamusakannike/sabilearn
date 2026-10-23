export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: 'What is SabiLearn and how does it work?',
    answer:
      'SabiLearn is an all-in-one Nigerian EdTech platform built to make learning practical skills simple and engaging. We provide structured course modules, hands-on interactive exercises, checkpoint quizzes, streak tracking, and AI-powered study tools to ensure you master new concepts for life.',
  },
  {
    question: 'Is SabiLearn free to get started?',
    answer:
      'Yes! You can start learning immediately on the Free Plan. It includes access to foundational courses, interactive practice quizzes, and daily AI assistant tokens. Premium courses and unlimited AI features are available as single one-time payments or all-access passes.',
  },
  {
    question: 'What payment methods do you accept in Nigeria?',
    answer:
      'We accept all major Nigerian payment methods including Debit Cards (Verve, Mastercard, Visa), Direct Bank Transfer, and USSD. All prices are listed clearly in Nigerian Naira (₦) with no hidden international conversion charges.',
  },
  {
    question: 'How do the AI study tools assist my learning?',
    answer:
      'Our AI study tools let you automate lecture summaries, generate custom multiple-choice quizzes from your study notes, create revision flashcards in seconds, and ask complex study questions to get instant, step-by-step explanations.',
  },
  {
    question: 'Do I get a certificate when I complete a course?',
    answer:
      'Yes. Every learner who completes all topics and passes the chapter assessments in a course receives a verified digital certificate of completion that you can share with employers or add to your LinkedIn profile and CV.',
  },
];
