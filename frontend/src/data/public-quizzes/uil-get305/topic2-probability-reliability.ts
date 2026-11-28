import { PublicQuizTopic } from '@/types/public-quiz';

export const topic2ProbabilityReliability: PublicQuizTopic = {
  id: 'probability-reliability',
  title: 'Probability, Counting, Bayes & Reliability',
  shortTitle: 'Probability & Reliability',
  description:
    'Addition/multiplication rules, conditional probability, permutations & combinations, Bayes’ theorem for fault diagnostics, and series/parallel/mixed system reliability.',
  icon: 'ShieldCheck',
  accent: 'violet',
  questions: [
    {
      id: 'g305-t2-q1',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'A bridge can fail by fatigue ($P(A) = 0.3$) or corrosion ($P(B) = 0.2$), with $P(A \\cap B) = 0.1$. What are $P(\\text{at least one cause})$ and $P(\\text{neither})$?',
      options: [
        { id: 'a', text: '$0.40$ and $0.60$' },
        { id: 'b', text: '$0.50$ and $0.50$' },
        { id: 'c', text: '$0.60$ and $0.40$' },
        { id: 'd', text: '$0.30$ and $0.70$' },
      ],
      correctAnswer: 'a',
      explanation:
        'By the general addition rule: $$P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.3 + 0.2 - 0.1 = 0.40$$ $$P(\\text{neither}) = 1 - P(A \\cup B) = 1 - 0.40 = 0.60$$',
    },
    {
      id: 'g305-t2-q2',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'A water supply system has a controller ($R_C = 0.95$) in **series** with two identical pumps in **parallel**, each with reliability $0.90$. What is the overall system reliability $R_S$?',
      options: [
        { id: 'a', text: '$0.8550$' },
        { id: 'b', text: '$0.9405$' },
        { id: 'c', text: '$0.9900$' },
        { id: 'd', text: '$0.7695$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Parallel pump unit: $R_P = 1 - (1 - 0.90)(1 - 0.90) = 1 - 0.01 = 0.99$. In series with controller: $$R_S = R_C \\times R_P = 0.95 \\times 0.99 = 0.9405 = 94.05\\%$$',
    },
    {
      id: 'g305-t2-q3',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'In the pumping system above ($R_C = 0.95$, $R_{\\text{pump}} = 0.90$), by how many percentage points does adding the second parallel pump improve reliability over a single pump?',
      options: [
        { id: 'a', text: '$4.50$ percentage points' },
        { id: 'b', text: '$8.55$ percentage points' },
        { id: 'c', text: '$9.00$ percentage points' },
        { id: 'd', text: '$13.50$ percentage points' },
      ],
      correctAnswer: 'b',
      explanation:
        'Single pump in series: $R_{\\text{single}} = 0.95 \\times 0.90 = 0.8550 = 85.50\\%$. Improvement $= 94.05\\% - 85.50\\% = 8.55\\text{ percentage points}$.',
    },
    {
      id: 'g305-t2-q4',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Machine A produces $60\\%$ of output ($2\\%$ defect rate) and Machine B produces $40\\%$ ($5\\%$ defect rate). What is the overall probability $P(D)$ that a randomly chosen part is defective?',
      options: [
        { id: 'a', text: '$0.032$ ($3.2\\%$)' },
        { id: 'b', text: '$0.035$ ($3.5\\%$)' },
        { id: 'c', text: '$0.070$ ($7.0\\%$)' },
        { id: 'd', text: '$0.028$ ($2.8\\%$)' },
      ],
      correctAnswer: 'a',
      explanation:
        'By the Law of Total Probability: $$P(D) = P(D|A)P(A) + P(D|B)P(B) = (0.02)(0.60) + (0.05)(0.40) = 0.012 + 0.020 = 0.032$$',
    },
    {
      id: 'g305-t2-q5',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'For the factory above ($P(A) = 0.60$, $P(D|A) = 0.02$, $P(B) = 0.40$, $P(D|B) = 0.05$), a part is found defective. Using **Bayes’ theorem**, what is $P(A|D)$?',
      options: [
        { id: 'a', text: '$0.375$ ($37.5\\%$)' },
        { id: 'b', text: '$0.625$ ($62.5\\%$)' },
        { id: 'c', text: '$0.600$ ($60.0\\%$)' },
        { id: 'd', text: '$0.286$ ($28.6\\%$)' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$P(A|D) = \\frac{P(D|A)P(A)}{P(D)} = \\frac{0.02 \\times 0.60}{0.032} = \\frac{0.012}{0.032} = 0.375 = 37.5\\%$$',
    },
    {
      id: 'g305-t2-q6',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'An inspector picks $5$ resistors from a box of $12$ containing $4$ faulty resistors. How many total selections $^{12}C_5$ are possible, and what is $P(\\text{none faulty})$?',
      options: [
        { id: 'a', text: '$792$ ways; $P = 0.0707$' },
        { id: 'b', text: '$792$ ways; $P = 0.1414$' },
        { id: 'c', text: '$950$ ways; $P = 0.0589$' },
        { id: 'd', text: '$495$ ways; $P = 0.1131$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Total selections: $^{12}C_5 = \\dfrac{12!}{5!7!} = 792$. All 5 from the 8 good resistors: $^8C_5 = 56$. $$P(\\text{none faulty}) = \\frac{56}{792} = \\frac{7}{99} \\approx 0.0707$$',
    },
    {
      id: 'g305-t2-q7',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'A fault-detection test: $1\\%$ of machines are faulty. The test flags $98\\%$ of faulty machines and $3\\%$ of healthy machines. Given a machine is flagged, what is $P(\\text{faulty}|\\text{flagged})$?',
      options: [
        { id: 'a', text: '$24.81\\%$' },
        { id: 'b', text: '$98.00\\%$' },
        { id: 'c', text: '$33.33\\%$' },
        { id: 'd', text: '$19.60\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$P(\\text{flagged}) = (0.98)(0.01) + (0.03)(0.99) = 0.0098 + 0.0297 = 0.0395$. $$P(\\text{faulty}|\\text{flagged}) = \\frac{0.0098}{0.0395} \\approx 0.2481 = 24.81\\%$$',
    },
    {
      id: 'g305-t2-q8',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Three independent pumps, each with reliability $0.8$, operate in **parallel**. What is the system reliability?',
      options: [
        { id: 'a', text: '$0.512$' },
        { id: 'b', text: '$0.992$' },
        { id: 'c', text: '$0.960$' },
        { id: 'd', text: '$0.800$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Each pump fails with probability $1 - 0.8 = 0.2$. All 3 fail with probability $(0.2)^3 = 0.008$. $$R = 1 - 0.008 = 0.992 = 99.2\\%$$',
    },
    {
      id: 'g305-t2-q9',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Two fair dice are thrown. What is the conditional probability that the **sum is $8$**, given that **at least one die shows a $5$**?',
      options: [
        { id: 'a', text: '$\\dfrac{2}{11} \\approx 0.1818$' },
        { id: 'b', text: '$\\dfrac{2}{12} \\approx 0.1667$' },
        { id: 'c', text: '$\\dfrac{5}{36} \\approx 0.1389$' },
        { id: 'd', text: '$\\dfrac{3}{11} \\approx 0.2727$' },
      ],
      correctAnswer: 'a',
      explanation:
        'There are $11$ outcomes with at least one $5$ (avoiding double-counting $(5,5)$). Exactly $2$ of them sum to $8$: $(5,3)$ and $(3,5)$. Thus $P = \\dfrac{2}{11} \\approx 0.1818$.',
    },
    {
      id: 'g305-t2-q10',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Two parallel branches feed a load. Branch 1 has two series components ($0.9$ and $0.9$). Branch 2 has two series components ($0.8$ and $0.95$). What is the overall system reliability?',
      options: [
        { id: 'a', text: '$0.9544$' },
        { id: 'b', text: '$0.6156$' },
        { id: 'c', text: '$0.9120$' },
        { id: 'd', text: '$0.9855$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Branch 1: $R_1 = 0.9 \\times 0.9 = 0.81$ (fails $0.19$). Branch 2: $R_2 = 0.8 \\times 0.95 = 0.76$ (fails $0.24$). Both fail: $0.19 \\times 0.24 = 0.0456$. $$R = 1 - 0.0456 = 0.9544$$',
    },
    {
      id: 'g305-t2-q11',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Three independent components with reliabilities $0.98$, $0.95$, and $0.97$ are connected in **series**. What is the system reliability?',
      options: [
        { id: 'a', text: '$0.9031$' },
        { id: 'b', text: '$0.9999$' },
        { id: 'c', text: '$0.9667$' },
        { id: 'd', text: '$0.9310$' },
      ],
      correctAnswer: 'a',
      explanation:
        'In series, all must work: $$R = 0.98 \\times 0.95 \\times 0.97 = 0.90307 \\approx 0.9031$$',
    },
    {
      id: 'g305-t2-q12',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'The same three independent components ($0.98$, $0.95$, $0.97$) are reconnected in **parallel**. What is the new system reliability?',
      options: [
        { id: 'a', text: '$0.99997$' },
        { id: 'b', text: '$0.99970$' },
        { id: 'c', text: '$0.99700$' },
        { id: 'd', text: '$0.90310$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$R = 1 - (1 - 0.98)(1 - 0.95)(1 - 0.97) = 1 - (0.02)(0.05)(0.03) = 1 - 0.00003 = 0.99997$$',
    },
    {
      id: 'g305-t2-q13',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'Three machines $M_1, M_2, M_3$ produce $50\\%, 30\\%, 20\\%$ of output with defect rates $1\\%, 2\\%, 3\\%$ respectively. What is the overall defect rate $P(D)$ and $P(M_3|D)$?',
      options: [
        { id: 'a', text: '$P(D) = 0.017$, $P(M_3|D) = 0.353$' },
        { id: 'b', text: '$P(D) = 0.020$, $P(M_3|D) = 0.300$' },
        { id: 'c', text: '$P(D) = 0.017$, $P(M_3|D) = 0.294$' },
        { id: 'd', text: '$P(D) = 0.060$, $P(M_3|D) = 0.500$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$P(D) = 0.50(0.01) + 0.30(0.02) + 0.20(0.03) = 0.005 + 0.006 + 0.006 = 0.017$. $$P(M_3|D) = \\frac{0.006}{0.017} \\approx 0.3529 \\approx 0.353$$',
    },
    {
      id: 'g305-t2-q14',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'In how many ways can $4$ engineers be selected from $9$ for an unordered committee ($^9C_4$), and in how many ways can they be assigned to $4$ distinct leadership roles ($^9P_4$)?',
      options: [
        { id: 'a', text: '$^9C_4 = 126$; $^9P_4 = 3024$' },
        { id: 'b', text: '$^9C_4 = 252$; $^9P_4 = 3024$' },
        { id: 'c', text: '$^9C_4 = 126$; $^9P_4 = 1512$' },
        { id: 'd', text: '$^9C_4 = 84$; $^9P_4 = 2016$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$^9C_4 = \\dfrac{9!}{4!5!} = 126$ (order ignored). $^9P_4 = \\dfrac{9!}{5!} = 9 \\times 8 \\times 7 \\times 6 = 3024$ (order matters).',
    },
    {
      id: 'g305-t2-q15',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'If two events $A$ and $B$ are **independent** with $P(A) = 0.4$ and $P(B) = 0.5$, what is $P(A \\cup B)$?',
      options: [
        { id: 'a', text: '$0.90$' },
        { id: 'b', text: '$0.70$' },
        { id: 'c', text: '$0.20$' },
        { id: 'd', text: '$0.80$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Since $A$ and $B$ are independent, $P(A \\cap B) = P(A)P(B) = 0.4 \\times 0.5 = 0.20$. $$P(A \\cup B) = 0.4 + 0.5 - 0.20 = 0.70$$',
    },
    {
      id: 'g305-t2-q16',
      topicId: 'probability-reliability',
      difficulty: 'calculation',
      question:
        'A component testing sequence has $4$ independent stages with $3, 5, 2,$ and $4$ configuration choices respectively. By the multiplication principle, how many total test configurations exist?',
      options: [
        { id: 'a', text: '$14$' },
        { id: 'b', text: '$120$' },
        { id: 'c', text: '$60$' },
        { id: 'd', text: '$240$' },
      ],
      correctAnswer: 'b',
      explanation:
        'By the multiplication principle: $3 \\times 5 \\times 2 \\times 4 = 120$ total configurations.',
    },
    {
      id: 'g305-t2-q17',
      topicId: 'probability-reliability',
      difficulty: 'conceptual',
      question:
        'Which statement correctly relates **mutually exclusive** and **independent** events when both have positive probabilities?',
      options: [
        { id: 'a', text: 'Two mutually exclusive events with positive probabilities are never independent.' },
        { id: 'b', text: 'Mutually exclusive events are always independent because they share no outcomes.' },
        { id: 'c', text: 'Independence requires $P(A \\cap B) = 0$ whenever $P(A) > 0$ and $P(B) > 0$.' },
        { id: 'd', text: 'Mutually exclusive and independent are interchangeable terms in reliability analysis.' },
      ],
      correctAnswer: 'a',
      explanation:
        'For mutually exclusive events, $P(A \\cap B) = 0$; for independent events with positive probabilities, $P(A \\cap B) = P(A)P(B) > 0$. Thus they can **never** both hold.',
    },
    {
      id: 'g305-t2-q18',
      topicId: 'probability-reliability',
      difficulty: 'conceptual',
      question:
        'How does adding components in **series** versus in **parallel** affect overall engineering system reliability?',
      options: [
        { id: 'a', text: 'Parallel design raises reliability; series design lowers it.' },
        { id: 'b', text: 'Series design raises reliability; parallel design lowers it.' },
        { id: 'c', text: 'Both series and parallel additions always increase reliability equally.' },
        { id: 'd', text: 'System reliability depends only on the strongest single component.' },
      ],
      correctAnswer: 'a',
      explanation:
        'Multiplying reliabilities ($<1$) in **series** lowers overall reliability, while adding redundant paths in **parallel** raises it.',
    },
    {
      id: 'g305-t2-q19',
      topicId: 'probability-reliability',
      difficulty: 'conceptual',
      question:
        'Which formula represents **Bayes’ theorem** for reversing a conditional probability?',
      options: [
        { id: 'a', text: '$P(B_i|A) = \\dfrac{P(B_i)P(A|B_i)}{P(A)}$' },
        { id: 'b', text: '$P(B_i|A) = \\dfrac{P(A)P(A|B_i)}{P(B_i)}$' },
        { id: 'c', text: '$P(B_i|A) = P(B_i) + P(A) - P(A \\cap B_i)$' },
        { id: 'd', text: '$P(B_i|A) = P(B_i) \\cdot P(A)$' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Bayes’ theorem**: $P(B_i|A) = \\dfrac{P(B_i) \\cdot P(A|B_i)}{P(A)}$, where $P(A) = \\sum P(B_j)P(A|B_j)$.',
    },
    {
      id: 'g305-t2-q20',
      topicId: 'probability-reliability',
      difficulty: 'conceptual',
      question:
        'Which probability value is **physically impossible** according to the basic axioms of probability?',
      options: [
        { id: 'a', text: '$P(A) = 0$' },
        { id: 'b', text: '$P(A) = 1$' },
        { id: 'c', text: '$P(A) = 1.4$' },
        { id: 'd', text: '$P(A) = 0.001$' },
      ],
      correctAnswer: 'c',
      explanation:
        'By the axioms of probability, $0 \\le P(A) \\le 1$. Any probability above $1$ (such as $1.4$) or below $0$ indicates a calculation error.',
    },
  ],
};
