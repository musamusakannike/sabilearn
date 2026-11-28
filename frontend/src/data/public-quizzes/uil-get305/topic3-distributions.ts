import { PublicQuizTopic } from '@/types/public-quiz';

export const topic3Distributions: PublicQuizTopic = {
  id: 'probability-distributions',
  title: 'Probability Distributions (Binomial, Poisson, Normal)',
  shortTitle: 'Distributions',
  description:
    'Discrete and continuous distributions: Binomial QC, Poisson rates & approximation, Hypergeometric finite lots, Normal Z-scores, specification limits, and percentiles.',
  icon: 'TrendingUp',
  accent: 'emerald',
  questions: [
    {
      id: 'g305-t3-q1',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Each microchip is independently defective with $p = 0.1$. In a batch of $n = 10$ chips, what is $P(\\text{exactly } 2 \\text{ defective})$?',
      options: [
        { id: 'a', text: '$0.1937$' },
        { id: 'b', text: '$0.3874$' },
        { id: 'c', text: '$0.3487$' },
        { id: 'd', text: '$0.2639$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using Binomial $P(X=2) = \\binom{10}{2}(0.1)^2(0.9)^8 = 45 \\times 0.01 \\times 0.430467 = 0.1937$.',
    },
    {
      id: 'g305-t3-q2',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the same microchip batch ($n = 10, p = 0.1$), what is $P(\\text{at most } 1 \\text{ defective})$?',
      options: [
        { id: 'a', text: '$0.3487$' },
        { id: 'b', text: '$0.3874$' },
        { id: 'c', text: '$0.7361$' },
        { id: 'd', text: '$0.9298$' },
      ],
      correctAnswer: 'c',
      explanation:
        '$P(X \\le 1) = P(0) + P(1) = (0.9)^{10} + 10(0.1)(0.9)^9 = 0.3487 + 0.3874 = 0.7361$.',
    },
    {
      id: 'g305-t3-q3',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the microchip batch ($n = 10, p = 0.1$), what are the Binomial mean $\\mu$ and standard deviation $\\sigma$ of the number of defectives?',
      options: [
        { id: 'a', text: '$\\mu = 1.0$, $\\sigma = 0.9487$' },
        { id: 'b', text: '$\\mu = 1.0$, $\\sigma = 0.9000$' },
        { id: 'c', text: '$\\mu = 9.0$, $\\sigma = 0.9487$' },
        { id: 'd', text: '$\\mu = 1.0$, $\\sigma = 1.0000$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\mu = np = 10(0.1) = 1.0$; $\\sigma = \\sqrt{npq} = \\sqrt{10(0.1)(0.9)} = \\sqrt{0.9} \\approx 0.9487$.',
    },
    {
      id: 'g305-t3-q4',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A component passes a stress test with $p = 0.7$. If $n = 8$ independent components are tested, what is $P(\\text{at least } 7 \\text{ pass})$?',
      options: [
        { id: 'a', text: '$0.1977$' },
        { id: 'b', text: '$0.2553$' },
        { id: 'c', text: '$0.0576$' },
        { id: 'd', text: '$0.4482$' },
      ],
      correctAnswer: 'b',
      explanation:
        '$P(X=7) = 8(0.7)^7(0.3)^1 = 0.19765$; $P(X=8) = (0.7)^8 = 0.05765$. $$P(X \\ge 7) = 0.19765 + 0.05765 = 0.2553$$',
    },
    {
      id: 'g305-t3-q5',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A fair coin is tossed $6$ times. What are $P(\\text{exactly } 4 \\text{ heads})$ and $P(\\text{at least } 5 \\text{ heads})$?',
      options: [
        { id: 'a', text: '$0.2344$ and $0.1094$' },
        { id: 'b', text: '$0.3125$ and $0.1094$' },
        { id: 'c', text: '$0.2344$ and $0.0938$' },
        { id: 'd', text: '$0.1563$ and $0.1250$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$P(4) = \\dfrac{\\binom{6}{4}}{64} = \\dfrac{15}{64} = 0.2344$. $P(X \\ge 5) = \\dfrac{\\binom{6}{5} + \\binom{6}{6}}{64} = \\dfrac{6 + 1}{64} = \\dfrac{7}{64} = 0.1094$.',
    },
    {
      id: 'g305-t3-q6',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A machine breaks down randomly at an average rate of $\\lambda = 3$ per month ($e^{-3} = 0.04979$). What are $P(0)$ and $P(\\text{exactly } 2)$ breakdowns in a month?',
      options: [
        { id: 'a', text: '$P(0) = 0.0498$, $P(2) = 0.2240$' },
        { id: 'b', text: '$P(0) = 0.1494$, $P(2) = 0.2240$' },
        { id: 'c', text: '$P(0) = 0.0498$, $P(2) = 0.1494$' },
        { id: 'd', text: '$P(0) = 0.0498$, $P(2) = 0.4481$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$P(0) = e^{-3} = 0.0498$; $P(2) = \\dfrac{e^{-3} \\cdot 3^2}{2!} = 0.04979 \\times 4.5 = 0.2240$.',
    },
    {
      id: 'g305-t3-q7',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the same machine ($\\lambda = 3$/month, $P(0)=0.0498$, $P(1)=0.1494$, $P(2)=0.2240$, $P(3)=0.2240$), what is $P(4 \\text{ or more breakdowns})$?',
      options: [
        { id: 'a', text: '$0.3528$' },
        { id: 'b', text: '$0.6472$' },
        { id: 'c', text: '$0.4232$' },
        { id: 'd', text: '$0.2240$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$P(X \\le 3) = 0.0498 + 0.1494 + 0.2240 + 0.2240 = 0.6472$. $$P(X \\ge 4) = 1 - 0.6472 = 0.3528$$',
    },
    {
      id: 'g305-t3-q8',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A fibre has a flaw with $p = 0.01$ in each of $n = 200$ independent sections. Using the **Poisson approximation** ($e^{-2} = 0.13534$), what is $P(\\text{at most } 1 \\text{ flaw})$?',
      options: [
        { id: 'a', text: '$0.1353$' },
        { id: 'b', text: '$0.2707$' },
        { id: 'c', text: '$0.4060$' },
        { id: 'd', text: '$0.5940$' },
      ],
      correctAnswer: 'c',
      explanation:
        '$\\lambda = np = 200(0.01) = 2$. $P(0) = e^{-2} = 0.13534$, $P(1) = 2e^{-2} = 0.27067$. $$P(X \\le 1) = 0.13534 + 0.27067 = 0.4060$$',
    },
    {
      id: 'g305-t3-q9',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Flaws occur along a cable at an average of $0.5$ per metre. Using Poisson ($e^{-1.5} = 0.2231$), what is $P(\\text{at least } 1 \\text{ flaw in a } 3\\text{ m length})$?',
      options: [
        { id: 'a', text: '$0.2231$' },
        { id: 'b', text: '$0.7769$' },
        { id: 'c', text: '$0.6065$' },
        { id: 'd', text: '$0.3935$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Scale the rate: $\\lambda = 0.5 \\times 3 = 1.5$. $P(0) = e^{-1.5} = 0.2231$. $$P(X \\ge 1) = 1 - P(0) = 1 - 0.2231 = 0.7769$$',
    },
    {
      id: 'g305-t3-q10',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Calls arrive at a telephone exchange at an average of $4$ per minute ($e^{-4} = 0.01832$, $e^{-2} = 0.1353$). What are $P(\\text{exactly } 2 \\text{ calls in } 1\\text{ min})$ and $P(\\text{no calls in } 30\\text{ s})$?',
      options: [
        { id: 'a', text: '$0.1465$ and $0.1353$' },
        { id: 'b', text: '$0.2931$ and $0.1353$' },
        { id: 'c', text: '$0.1465$ and $0.0183$' },
        { id: 'd', text: '$0.1954$ and $0.2707$' },
      ],
      correctAnswer: 'a',
      explanation:
        'For 1 min ($\\lambda = 4$): $P(2) = \\dfrac{e^{-4}(4^2)}{2!} = 8(0.01832) = 0.1465$. For 30 s ($\\lambda = 2$): $P(0) = e^{-2} = 0.1353$.',
    },
    {
      id: 'g305-t3-q11',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A lot of $N = 20$ transistors contains $K = 5$ defectives. An inspector draws $n = 4$ **without replacement** ($^{20}C_4 = 4845$, $^{15}C_3 = 455$). What is $P(\\text{exactly } 1 \\text{ defective})$?',
      options: [
        { id: 'a', text: '$0.4696$' },
        { id: 'b', text: '$0.2817$' },
        { id: 'c', text: '$0.4219$' },
        { id: 'd', text: '$0.3164$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Hypergeometric: $$P(X = 1) = \\frac{\\binom{5}{1}\\binom{15}{3}}{\\binom{20}{4}} = \\frac{5 \\times 455}{4845} = \\frac{2275}{4845} = 0.4696$$',
    },
    {
      id: 'g305-t3-q12',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the same lot of $20$ transistors ($5$ defective, $4$ drawn without replacement, $^{15}C_4 = 1365$, $^{20}C_4 = 4845$), what is $P(\\text{none defective})$?',
      options: [
        { id: 'a', text: '$0.2817$' },
        { id: 'b', text: '$0.3164$' },
        { id: 'c', text: '$0.4696$' },
        { id: 'd', text: '$0.2500$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$P(X = 0) = \\frac{\\binom{5}{0}\\binom{15}{4}}{\\binom{20}{4}} = \\frac{1365}{4845} = 0.2817$$',
    },
    {
      id: 'g305-t3-q13',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'A box contains $12$ fuses, $3$ of which are faulty. Two fuses are drawn **without replacement**. What is the probability that **both** are faulty?',
      options: [
        { id: 'a', text: '$0.0455$' },
        { id: 'b', text: '$0.0625$' },
        { id: 'c', text: '$0.0909$' },
        { id: 'd', text: '$0.1667$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$P(\\text{both faulty}) = \\frac{3}{12} \\times \\frac{2}{11} = \\frac{6}{132} = \\frac{1}{22} \\approx 0.0455$$',
    },
    {
      id: 'g305-t3-q14',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Shaft diameters follow $N(50\\text{ mm}, 0.2^2)$. The specification is $49.6\\text{ mm}$ to $50.4\\text{ mm}$. Given $\\Phi(2) = 0.9772$, what fractions conform and are rejected?',
      options: [
        { id: 'a', text: '$95.44\\%$ conform, $4.56\\%$ rejected' },
        { id: 'b', text: '$97.72\\%$ conform, $2.28\\%$ rejected' },
        { id: 'c', text: '$93.32\\%$ conform, $6.68\\%$ rejected' },
        { id: 'd', text: '$68.26\\%$ conform, $31.74\\%$ rejected' },
      ],
      correctAnswer: 'a',
      explanation:
        '$z_1 = (49.6 - 50)/0.2 = -2$, $z_2 = (50.4 - 50)/0.2 = +2$. $P(-2 < Z < 2) = 0.9772 - (1 - 0.9772) = 0.9544$ ($95.44\\%$ conform; $4.56\\%$ rejected).',
    },
    {
      id: 'g305-t3-q15',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Bulb lifetimes follow $N(1000\\text{ h}, 100^2)$. Given $\\Phi(1.5) = 0.9332$, what is $P(\\text{life} > 1150\\text{ h})$?',
      options: [
        { id: 'a', text: '$0.0668$ ($6.68\\%$)' },
        { id: 'b', text: '$0.9332$ ($93.32\\%$)' },
        { id: 'c', text: '$0.1587$ ($15.87\\%$)' },
        { id: 'd', text: '$0.0228$ ($2.28\\%$)' },
      ],
      correctAnswer: 'a',
      explanation:
        '$z = \\dfrac{1150 - 1000}{100} = 1.5$. $$P(Z > 1.5) = 1 - \\Phi(1.5) = 1 - 0.9332 = 0.0668 = 6.68\\%$$',
    },
    {
      id: 'g305-t3-q16',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the same bulbs $N(1000\\text{ h}, 100^2)$ with $\\Phi(1.28) \\approx 0.90$, what lifetime is **exceeded by $90\\%$** of all bulbs?',
      options: [
        { id: 'a', text: '$872\\text{ h}$' },
        { id: 'b', text: '$1128\\text{ h}$' },
        { id: 'c', text: '$835.5\\text{ h}$' },
        { id: 'd', text: '$900\\text{ h}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Exceeded by $90\\%$ means the 10th percentile ($z = -1.28$): $$x = \\mu + z\\sigma = 1000 + (-1.28)(100) = 872\\text{ h}$$',
    },
    {
      id: 'g305-t3-q17',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'Resistors follow $N(100\\,\\Omega, 2^2)$. Given $\\Phi(1.5) = 0.9332$, what is $P(97\\,\\Omega < X < 103\\,\\Omega)$?',
      options: [
        { id: 'a', text: '$0.8664$' },
        { id: 'b', text: '$0.9332$' },
        { id: 'c', text: '$0.6826$' },
        { id: 'd', text: '$0.9544$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$z_1 = (97 - 100)/2 = -1.5$, $z_2 = (103 - 100)/2 = +1.5$. $$P(-1.5 < Z < 1.5) = 0.9332 - (1 - 0.9332) = 0.9332 - 0.0668 = 0.8664$$',
    },
    {
      id: 'g305-t3-q18',
      topicId: 'probability-distributions',
      difficulty: 'calculation',
      question:
        'For the same resistors $N(100\\,\\Omega, 2^2)$ with $\\Phi(1.645) = 0.9500$, what resistance value is **exceeded by only $5\\%$** of resistors?',
      options: [
        { id: 'a', text: '$103.29\\,\\Omega$' },
        { id: 'b', text: '$103.92\\,\\Omega$' },
        { id: 'c', text: '$96.71\\,\\Omega$' },
        { id: 'd', text: '$102.56\\,\\Omega$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Top $5\\%$ corresponds to the 95th percentile ($z = +1.645$): $$x = \\mu + z\\sigma = 100 + 1.645(2) = 103.29\\,\\Omega$$',
    },
    {
      id: 'g305-t3-q19',
      topicId: 'probability-distributions',
      difficulty: 'conceptual',
      question:
        'When sampling **without replacement** from a small finite lot containing $K$ defectives out of $N$ items, which distribution is exact?',
      options: [
        { id: 'a', text: 'Binomial distribution' },
        { id: 'b', text: 'Poisson distribution' },
        { id: 'c', text: 'Hypergeometric distribution' },
        { id: 'd', text: 'Standard Normal distribution' },
      ],
      correctAnswer: 'c',
      explanation:
        'The **Hypergeometric distribution** accounts for changing probabilities when sampling without replacement from a finite lot (Binomial is only an approximation when $n/N < 0.05$).',
    },
    {
      id: 'g305-t3-q20',
      topicId: 'probability-distributions',
      difficulty: 'conceptual',
      question:
        'For a **Poisson distribution** with parameter $\\lambda$, what is the relationship between its mean and variance?',
      options: [
        { id: 'a', text: 'Mean $= \\lambda$ and Variance $= \\lambda$' },
        { id: 'b', text: 'Mean $= \\lambda$ and Variance $= \\lambda^2$' },
        { id: 'c', text: 'Mean $= \\lambda$ and Variance $= \\sqrt{\\lambda}$' },
        { id: 'd', text: 'Mean $= n\\lambda$ and Variance $= n\\lambda(1 - \\lambda)$' },
      ],
      correctAnswer: 'a',
      explanation:
        'A defining property of the Poisson distribution is that **mean $=$ variance $= \\lambda$**.',
    },
    {
      id: 'g305-t3-q21',
      topicId: 'probability-distributions',
      difficulty: 'conceptual',
      question:
        'According to the **empirical rule** for a Normal distribution, approximately what percentages of values lie within $\\pm 1\\sigma$, $\\pm 2\\sigma$, and $\\pm 3\\sigma$ of the mean?',
      options: [
        { id: 'a', text: '$68\\%$, $95\\%$, and $99.7\\%$' },
        { id: 'b', text: '$50\\%$, $90\\%$, and $99.0\\%$' },
        { id: 'c', text: '$65\\%$, $90\\%$, and $95.0\\%$' },
        { id: 'd', text: '$75\\%$, $95\\%$, and $99.9\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        'The 68–95–99.7 empirical rule states that roughly $68\\%$ lie within $\\pm 1\\sigma$, $95\\%$ within $\\pm 2\\sigma$, and $99.7\\%$ within $\\pm 3\\sigma$.',
    },
    {
      id: 'g305-t3-q22',
      topicId: 'probability-distributions',
      difficulty: 'conceptual',
      question:
        'Under what condition can the **Normal distribution** (with $\\pm 0.5$ continuity correction) approximate a **Binomial** distribution?',
      options: [
        { id: 'a', text: '$np \\ge 5$ and $n(1 - p) \\ge 5$' },
        { id: 'b', text: '$n \\ge 50$ and $p \\le 0.01$' },
        { id: 'c', text: '$n/N < 0.05$ and $K \\ge 1$' },
        { id: 'd', text: '$np < 5$ and $p > 0.5$' },
      ],
      correctAnswer: 'a',
      explanation:
        'When **$np \\ge 5$ and $n(1 - p) \\ge 5$**, $X \\approx N(np, np(1-p))$ with a $\\pm 0.5$ continuity correction.',
    },
  ],
};
