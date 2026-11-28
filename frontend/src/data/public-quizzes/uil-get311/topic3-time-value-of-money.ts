import { PublicQuizTopic } from '@/types/public-quiz';

export const topic3TimeValueOfMoney: PublicQuizTopic = {
  id: 'time-value-of-money',
  title: 'Time Value of Money & Interest Calculations',
  shortTitle: 'Time Value of Money',
  description:
    'Simple & compound interest, cash flow diagrams, sunk costs, all 6 interest factor formulas (F/P, P/F, P/A, A/P, F/A, A/F), and worked class examples.',
  icon: 'Calculator',
  accent: 'emerald',
  questions: [
    {
      id: 't3-q1',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'On a standard **Cash Flow Diagram**, how are revenues (cash inflows) and disbursements (cash outflows) represented?',
      options: [
        { id: 'a', text: 'Revenues with downward arrows on the negative axis; disbursements with upward arrows on the positive axis.' },
        { id: 'b', text: 'Revenues with upward arrows; disbursements with downward arrows.' },
        { id: 'c', text: 'Both revenues and disbursements with horizontal arrows scaled to the interest rate.' },
        { id: 'd', text: 'Revenues with dashed circles above the line; disbursements with solid squares below the line.' },
      ],
      correctAnswer: 'b',
      explanation:
        'In a cash flow diagram, **revenues (cash inflows)** are drawn as **upward arrows** (positive axis), while **disbursements (cash outflows)** are drawn as **downward arrows** (negative axis).',
    },
    {
      id: 't3-q2',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'How should **Sunk Costs** (expenses incurred before time $t = 0$) be treated in an engineering cash flow analysis?',
      options: [
        { id: 'a', text: 'Added directly to the initial capital outlay at time $t = 0$ on the diagram.' },
        { id: 'b', text: 'Ignored (value $= 0$) since past costs cannot be changed.' },
        { id: 'c', text: 'Subtracted from the estimated salvage value at the end of the project life.' },
        { id: 'd', text: 'Compounded forward at the MARR to the end of the project horizon.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Sunk costs** are past expenses incurred before $t = 0$. They are **not considered** in cash flow analysis (value $= 0$) because they cannot be changed by future decisions.',
    },
    {
      id: 't3-q3',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'How does the growth curve of **Compound Interest** compare to that of **Simple Interest** over time?',
      options: [
        { id: 'a', text: 'Simple interest increases exponentially while compound interest increases linearly.' },
        { id: 'b', text: 'Compound interest grows exponentially; simple interest grows linearly.' },
        { id: 'c', text: 'Both curves increase linearly at the exact same constant slope over all periods.' },
        { id: 'd', text: 'Compound interest decreases exponentially while simple interest remains constant.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Simple interest earns interest only on the original principal (**linear** growth), whereas compound interest earns interest on both principal and accumulated interest (**exponential** growth).',
    },
    {
      id: 't3-q4',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'Estimate the **simple interest** and total amount to pay back on a principal of $\\text{₦}50,000$ at $10\\%$ per annum for $3\\text{ years}$.',
      options: [
        { id: 'a', text: '$I = \\text{₦}15,000$, $A = \\text{₦}65,000$' },
        { id: 'b', text: '$I = \\text{₦}16,550$, $A = \\text{₦}66,550$' },
        { id: 'c', text: '$I = \\text{₦}7,500$, $A = \\text{₦}57,500$' },
        { id: 'd', text: '$I = \\text{₦}10,000$, $A = \\text{₦}60,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using the simple interest formula from class: $$I = \\frac{PRT}{100} = \\frac{50,000 \\times 10 \\times 3}{100} = \\text{₦}15,000$$ $$A = P + I = \\text{₦}50,000 + \\text{₦}15,000 = \\text{₦}65,000$$',
    },
    {
      id: 't3-q5',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'What is the **simple interest** on $\\text{₦}50,000$ at a $5\\%$ annual rate for $3\\text{ years}$?',
      options: [
        { id: 'a', text: '₦5,000' },
        { id: 'b', text: '₦7,500' },
        { id: 'c', text: '₦10,000' },
        { id: 'd', text: '₦15,000' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$I = \\frac{PRT}{100} = \\frac{50,000 \\times 5 \\times 3}{100} = \\text{₦}7,500$$',
    },
    {
      id: 't3-q6',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'Using **compound interest** at $10\\%$ per annum, what is the future amount $F_3$ of $\\text{₦}50,000$ at the end of $3\\text{ years}$?',
      options: [
        { id: 'a', text: '₦65,000' },
        { id: 'b', text: '₦66,550' },
        { id: 'c', text: '₦60,500' },
        { id: 'd', text: '₦68,000' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using $F_n = P(1+i)^n$: $$F_3 = 50,000(1 + 0.10)^3 = 50,000 \\times 1.331 = \\text{₦}66,550$$ (Year 1: ₦55,000; Year 2: ₦60,500; Year 3: ₦66,550).',
    },
    {
      id: 't3-q7',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'How many years $n$ are required for $\\text{₦}50,000$ to appreciate to $\\text{₦}66,550$ at an interest rate of $10\\%$ compounded annually?',
      options: [
        { id: 'a', text: '$2\\text{ years}$' },
        { id: 'b', text: '$3\\text{ years}$' },
        { id: 'c', text: '$4\\text{ years}$' },
        { id: 'd', text: '$5\\text{ years}$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Solving $F_n = P(1+i)^n$ for $n$: $$n = \\frac{\\log(F_n / P)}{\\log(1 + i)} = \\frac{\\log(66,550 / 50,000)}{\\log(1.10)} = \\frac{\\log(1.331)}{\\log(1.10)} = 3\\text{ years}$$',
    },
    {
      id: 't3-q8',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'Estimate the annual compound interest rate $i$ that will make $\\text{₦}50,000$ appreciate to $\\text{₦}66,550$ at the end of $3\\text{ years}$.',
      options: [
        { id: 'a', text: '$8\\%$' },
        { id: 'b', text: '$10\\%$' },
        { id: 'c', text: '$11\\%$' },
        { id: 'd', text: '$12\\%$' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\frac{66,550}{50,000} = (1 + i)^3 \\implies 1.331 = (1 + i)^3 \\implies (1.1)^3 = (1 + i)^3 \\implies 1 + i = 1.1 \\implies i = 0.10 = 10\\%$$',
    },
    {
      id: 't3-q9',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'What are the three methods of computing Compound Interest listed in the GET 311 handwritten class notes?',
      options: [
        { id: 'a', text: 'Straight-line, Declining balance, and Sinking-fund methods' },
        { id: 'b', text: 'Conventional, Single payment, and Standard table methods' },
        { id: 'c', text: 'Net Present Value, Internal Rate of Return, and Payback period' },
        { id: 'd', text: 'Direct taxation, Indirect taxation, and Proportional discounting' },
      ],
      correctAnswer: 'b',
      explanation:
        'The class notes list three compound interest approaches: **Conventional method** (year-by-year), **Single payment method** ($F_n = P(1+i)^n$), and **Standard table values** ($F = P(F/P, i\\%, n)$).',
    },
    {
      id: 't3-q10',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'Which formula represents the **Capital Recovery Factor** (Given $P$, Find $A$)?',
      options: [
        { id: 'a', text: '$A = P\\left[\\dfrac{i(1+i)^n}{(1+i)^n - 1}\\right]$' },
        { id: 'b', text: '$A = P\\left[\\dfrac{(1+i)^n - 1}{i(1+i)^n}\\right]$' },
        { id: 'c', text: '$A = F\\left[\\dfrac{i(1+i)^n}{(1+i)^n + 1}\\right]$' },
        { id: 'd', text: '$A = P\\left[\\dfrac{(1+i)^n + 1}{i(1+i)^n}\\right]$' },
      ],
      correctAnswer: 'a',
      explanation:
        'The **Capital Recovery Factor** $(A/P, i, n) = \\dfrac{i(1+i)^n}{(1+i)^n - 1}$ converts a present sum $P$ into an equivalent uniform annual series $A$ needed to recover capital.',
    },
    {
      id: 't3-q11',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'Which formula gives the **Present Worth $P$** of a uniform annual series $A$ (Given $A$, Find $P$)?',
      options: [
        { id: 'a', text: '$P = A\\left[\\dfrac{(1+i)^n - 1}{i}\\right]$' },
        { id: 'b', text: '$P = A\\left[\\dfrac{(1+i)^n - 1}{i(1+i)^n}\\right]$' },
        { id: 'c', text: '$P = A\\left[\\dfrac{i(1+i)^n}{(1+i)^n - 1}\\right]$' },
        { id: 'd', text: '$P = A\\left[\\dfrac{(1+i)^n + 1}{i(1+i)^n}\\right]$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Given an annuity $A$, the Uniform Series Present Worth factor is $(P/A, i, n) = \\dfrac{(1+i)^n - 1}{i(1+i)^n}$.',
    },
    {
      id: 't3-q12',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'Which formula gives the **Sinking Fund Factor** (Given $F$, Find $A$)?',
      options: [
        { id: 'a', text: '$A = F\\left[\\dfrac{i}{(1+i)^n - 1}\\right]$' },
        { id: 'b', text: '$A = F\\left[\\dfrac{(1+i)^n - 1}{i}\\right]$' },
        { id: 'c', text: '$A = F\\left[\\dfrac{i(1+i)^n}{(1+i)^n - 1}\\right]$' },
        { id: 'd', text: '$A = F\\left[\\dfrac{(1+i)^n - 1}{i(1+i)^n}\\right]$' },
      ],
      correctAnswer: 'a',
      explanation:
        'To accumulate a target future sum $F$ over $n$ periods at rate $i$, the uniform periodic deposit is $A = F(A/F, i, n) = F\\left[\\dfrac{i}{(1+i)^n - 1}\\right]$.',
    },
    {
      id: 't3-q13',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'Which formula gives the **Uniform Series Compound Amount Factor** (Given $A$, Find $F$)?',
      options: [
        { id: 'a', text: '$F = A\\left[\\dfrac{(1+i)^n - 1}{i}\\right]$' },
        { id: 'b', text: '$F = A\\left[\\dfrac{i(1+i)^n}{(1+i)^n - 1}\\right]$' },
        { id: 'c', text: '$F = A\\left[\\dfrac{(1+i)^n - 1}{i(1+i)^n}\\right]$' },
        { id: 'd', text: '$F = A\\left[\\dfrac{i}{(1+i)^n - 1}\\right]$' },
      ],
      correctAnswer: 'a',
      explanation:
        'The future worth of equal annual payments $A$ is $F = A(F/A, i, n) = A\\left[\\dfrac{(1+i)^n - 1}{i}\\right]$.',
    },
    {
      id: 't3-q14',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'A factory manager earned $\\text{₦}20,000$ in 2004 at an annual interest rate of $15\\%$. In 2024 ($20\\text{ years}$ later), a newly hired manager earns $\\text{₦}200,000$. What is the equivalent future value of the first manager’s salary in 2024?',
      options: [
        { id: 'a', text: '₦200,000' },
        { id: 'b', text: '₦327,330' },
        { id: 'c', text: '₦127,330' },
        { id: 'd', text: '₦280,450' },
      ],
      correctAnswer: 'b',
      explanation:
        'With $P = \\text{₦}20,000$, $i = 0.15$, $n = 2024 - 2004 = 20$: $$F_{20} = 20,000(1 + 0.15)^{20} = 20,000 \\times 16.3665 \\approx \\text{₦}327,330$$',
    },
    {
      id: 't3-q15',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'In the factory manager problem above ($F_{20} \\approx \\text{₦}327,330$ vs. second manager’s $\\text{₦}200,000$), what is the salary differential in 2024 and who had the better salary?',
      options: [
        { id: 'a', text: '₦127,330; first manager had the better salary' },
        { id: 'b', text: '₦180,000; second manager had the better salary' },
        { id: 'c', text: '₦0; both salaries are economically identical' },
        { id: 'd', text: '₦127,330; second manager had the better salary' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{Differential} = \\text{₦}327,330 - \\text{₦}200,000 = \\text{₦}127,330$$ Because $\\text{₦}327,330 > \\text{₦}200,000$, the **first manager** had the better salary in real time-value terms.',
    },
    {
      id: 't3-q16',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'A youth corps member invested his monthly allowance of $\\text{₦}33,000$ in shares at $10\\%$ interest per annum. What is the worth of this investment at the end of $5\\text{ years}$?',
      options: [
        { id: 'a', text: '₦49,500.00' },
        { id: 'b', text: '₦53,146.83' },
        { id: 'c', text: '₦58,461.51' },
        { id: 'd', text: '₦46,200.00' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$F_5 = P(1+i)^n = 33,000(1 + 0.10)^5 = 33,000 \\times 1.61051 = \\text{₦}53,146.83$$',
    },
    {
      id: 't3-q17',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'What is the **present value** of an annuity of $\\text{₦}5,000$ per year for $6\\text{ years}$ at an interest rate of $15\\%$ per annum?',
      options: [
        { id: 'a', text: '₦18,922.41' },
        { id: 'b', text: '₦30,000.00' },
        { id: 'c', text: '₦21,540.00' },
        { id: 'd', text: '₦15,200.50' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using $P = A\\left[\\dfrac{(1+i)^n - 1}{i(1+i)^n}\\right]$ with $A = 5,000$, $i = 0.15$, $n = 6$: $$P = 5,000\\left[\\frac{(1.15)^6 - 1}{0.15(1.15)^6}\\right] = 5,000 \\times 3.78448 = \\text{₦}18,922.41$$ (Using 4-decimal table factor $3.7845$ gives $\\text{₦}18,922.50$).',
    },
    {
      id: 't3-q18',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'The yearly payments of a project for Years 1 to 5 are $\\text{₦}1,000$, $\\text{₦}1,500$, $\\text{₦}2,000$, $\\text{₦}2,000$, and $\\text{₦}3,000$ respectively. At $i = 8\\%$, what is the **Present Worth** $P$?',
      options: [
        { id: 'a', text: '₦9,500.00' },
        { id: 'b', text: '₦7,311.41' },
        { id: 'c', text: '₦6,420.15' },
        { id: 'd', text: '₦8,125.00' },
      ],
      correctAnswer: 'b',
      explanation:
        'Discounting each payment via $P = \\sum \\dfrac{F_t}{(1+0.08)^t}$: $$P = \\frac{1000}{1.08} + \\frac{1500}{1.08^2} + \\frac{2000}{1.08^3} + \\frac{2000}{1.08^4} + \\frac{3000}{1.08^5} = 925.93 + 1286.01 + 1587.66 + 1470.06 + 2041.75 = \\text{₦}7,311.41$$',
    },
    {
      id: 't3-q19',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'Continuing the project above ($P = \\text{₦}7,311.41$, $n = 5\\text{ years}$, $i = 8\\%$), what is the **equivalent Annual Worth** $A$?',
      options: [
        { id: 'a', text: '₦1,462.28' },
        { id: 'b', text: '₦1,831.19' },
        { id: 'c', text: '₦1,900.00' },
        { id: 'd', text: '₦2,110.45' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using the Capital Recovery Factor $(A/P, 8\\%, 5)$: $$A = 7,311.41 \\left[\\frac{0.08(1.08)^5}{(1.08)^5 - 1}\\right] = 7,311.41 \\times 0.250456 = \\text{₦}1,831.19$$',
    },
    {
      id: 't3-q20',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'A cottage manufacturing firm expects future expenses of $\\text{₦}12,000$ (Yr 2), $\\text{₦}6,000$ (Yr 3), $\\text{₦}20,000$ (Yr 5), and $\\text{₦}13,000$ (Yr 8). At $i = 8\\%$, what is the **Present Worth** $P$ of these expenses?',
      options: [
        { id: 'a', text: '₦51,000.00' },
        { id: 'b', text: '₦35,686.22' },
        { id: 'c', text: '₦29,410.50' },
        { id: 'd', text: '₦41,200.00' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$P = \\frac{12,000}{1.08^2} + \\frac{6,000}{1.08^3} + \\frac{20,000}{1.08^5} + \\frac{13,000}{1.08^8} = 10,288.07 + 4,762.99 + 13,611.66 + 7,023.50 = \\text{₦}35,686.22$$',
    },
    {
      id: 't3-q21',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'For the cottage manufacturing firm above ($P = \\text{₦}35,686.22$, $n = 8\\text{ years}$, $i = 8\\%$, table factor $(A/P, 8\\%, 8) = 0.1740$), what uniform annual reserve $A$ is needed to offset the expenses?',
      options: [
        { id: 'a', text: '₦4,460.78' },
        { id: 'b', text: '₦6,209.40' },
        { id: 'c', text: '₦7,137.24' },
        { id: 'd', text: '₦5,352.93' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$A = P(A/P, 8\\%, 8) = 35,686.22 \\times 0.1740 = \\text{₦}6,209.40$$',
    },
    {
      id: 't3-q22',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'How much must you deposit **today** at $12\\%$ compounded annually to have $\\text{₦}250,000$ in $4\\text{ years}$?',
      options: [
        { id: 'a', text: '₦158,879.52' },
        { id: 'b', text: '₦178,571.43' },
        { id: 'c', text: '₦142,000.00' },
        { id: 'd', text: '₦196,450.00' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using $P = \\dfrac{F}{(1+i)^n}$: $$P = \\frac{250,000}{(1.12)^4} = \\frac{250,000}{1.573519} = \\text{₦}158,879.52$$',
    },
    {
      id: 't3-q23',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'An engineer deposits $\\text{₦}10,000$ at the end of every year for $5\\text{ years}$ into a fund earning $10\\%$ compounded annually. What is the future value $F$ at the end of Year 5?',
      options: [
        { id: 'a', text: '₦50,000.00' },
        { id: 'b', text: '₦61,051.00' },
        { id: 'c', text: '₦55,000.00' },
        { id: 'd', text: '₦67,156.10' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using $F = A\\left[\\dfrac{(1+i)^n - 1}{i}\\right]$: $$F = 10,000\\left[\\frac{(1.10)^5 - 1}{0.10}\\right] = 10,000 \\times 6.1051 = \\text{₦}61,051.00$$',
    },
    {
      id: 't3-q24',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'A plant manager wants to accumulate $\\text{₦}1,000,000$ in $5\\text{ years}$ to replace a generator. At $10\\%$ annual compound interest, what equal end-of-year deposit $A$ is required?',
      options: [
        { id: 'a', text: '₦200,000.00' },
        { id: 'b', text: '₦163,797.48' },
        { id: 'c', text: '₦180,974.80' },
        { id: 'd', text: '₦150,000.00' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using the Sinking Fund formula $A = F\\left[\\dfrac{i}{(1+i)^n - 1}\\right]$: $$A = 1,000,000\\left[\\frac{0.10}{(1.10)^5 - 1}\\right] = \\frac{100,000}{0.61051} = \\text{₦}163,797.48$$',
    },
    {
      id: 't3-q25',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'If $\\text{₦}100,000$ is invested at $10\\%$ interest for $2\\text{ years}$, what is the difference between **compound interest** and **simple interest** earned?',
      options: [
        { id: 'a', text: '₦500' },
        { id: 'b', text: '₦1,000' },
        { id: 'c', text: '₦2,000' },
        { id: 'd', text: '₦10,000' },
      ],
      correctAnswer: 'b',
      explanation:
        'Simple interest: $I_s = \\dfrac{100,000 \\times 10 \\times 2}{100} = \\text{₦}20,000$. Compound interest: $I_c = 100,000(1.10)^2 - 100,000 = \\text{₦}21,000$. Difference $= \\text{₦}21,000 - \\text{₦}20,000 = \\text{₦}1,000$.',
    },
    {
      id: 't3-q26',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'In Nigeria, which institution sets the benchmark interest rate for financial institutions?',
      options: [
        { id: 'a', text: 'Federal Inland Revenue Service (FIRS)' },
        { id: 'b', text: 'Central Bank of Nigeria (CBN)' },
        { id: 'c', text: 'Nigerian Society of Engineers (NSE)' },
        { id: 'd', text: 'Federal Ministry of Works & Housing' },
      ],
      correctAnswer: 'b',
      explanation:
        'As noted in GET 311, the benchmark interest rate is determined by the government through the **Central Bank** (CBN in Nigeria).',
    },
    {
      id: 't3-q27',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'What does the standard interest factor notation $(F/P, i\\%, n)$ mean?',
      options: [
        { id: 'a', text: 'Find Present Worth $P$ given Future Worth $F$ at interest rate $i\\%$ for $n$ periods' },
        { id: 'b', text: 'Find Future Worth $F$ given Present Worth $P$' },
        { id: 'c', text: 'Divide Future Worth $F$ by Annual Worth $A$ across $n$ compounding years' },
        { id: 'd', text: 'Find the unknown interest rate $i\\%$ given Present Worth $P$ and period $n$' },
      ],
      correctAnswer: 'b',
      explanation:
        'In standard notation $(X/Y, i\\%, n)$, the numerator $X$ is what you want to **find** and the denominator $Y$ is what is **given**. Thus $(F/P, i\\%, n) = (1+i)^n$ finds $F$ given $P$.',
    },
    {
      id: 't3-q28',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'Using the Rule of Compound Interest, approximately how many years does it take for an investment to **double** at $10\\%$ compounded annually?',
      options: [
        { id: 'a', text: '$5.00\\text{ years}$' },
        { id: 'b', text: '$7.27\\text{ years}$' },
        { id: 'c', text: '$10.00\\text{ years}$' },
        { id: 'd', text: '$6.15\\text{ years}$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Setting $F = 2P$: $$n = \\frac{\\log(2)}{\\log(1.10)} = \\frac{0.30103}{0.04139} \\approx 7.27\\text{ years}$$',
    },
    {
      id: 't3-q29',
      topicId: 'time-value-of-money',
      difficulty: 'calculation',
      question:
        'An engineer borrows $\\text{₦}120,000$ to buy a CNC spindle at $12\\%$ annual compound interest, to be repaid in $4$ equal annual installments. What is each annual payment $A$?',
      options: [
        { id: 'a', text: '₦30,000.00' },
        { id: 'b', text: '₦39,508.13' },
        { id: 'c', text: '₦35,400.00' },
        { id: 'd', text: '₦44,400.00' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using the Capital Recovery formula: $$A = 120,000 \\left[\\frac{0.12(1.12)^4}{(1.12)^4 - 1}\\right] = 120,000 \\times 0.329234 = \\text{₦}39,508.13$$',
    },
    {
      id: 't3-q30',
      topicId: 'time-value-of-money',
      difficulty: 'conceptual',
      question:
        'Which of the following is NOT listed as a factor affecting the **purchasing power of money** in the GET 311 lecture notes?',
      options: [
        { id: 'a', text: 'General price inflation' },
        { id: 'b', text: 'Government fiscal policies' },
        { id: 'c', text: 'Foreign currency exchange rate' },
        { id: 'd', text: 'Physical coin weight' },
      ],
      correctAnswer: 'd',
      explanation:
        'The notes explicitly state that **inflation, government policies, price changes, and currency exchange rates** affect the purchasing power of money.',
    },
  ],
};
