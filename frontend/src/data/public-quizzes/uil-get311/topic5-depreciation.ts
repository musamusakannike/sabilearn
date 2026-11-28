import { PublicQuizTopic } from '@/types/public-quiz';

export const topic5Depreciation: PublicQuizTopic = {
  id: 'depreciation-methods',
  title: 'Depreciation Concepts & Calculation Methods',
  shortTitle: 'Depreciation',
  description:
    'Causes & types of depreciation, depletion, book/market/salvage/scrap value, and all 5 methods: Straight-Line, Declining Balance (DDB), SOYD, Sinking Fund, and Service Output.',
  icon: 'TrendingDown',
  accent: 'violet',
  questions: [
    {
      id: 't5-q1',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'How is **Depreciation** defined in the UIL-GET 311 Depreciation slides?',
      options: [
        { id: 'a', text: 'A cash payment made annually to the Central Bank.' },
        { id: 'b', text: 'The decrease in the value of a physical property or asset with the passage of time due to causes such as wear and tear and obsolescence.' },
        { id: 'c', text: 'An increase in market value of land over time.' },
        { id: 'd', text: 'The interest earned on a bank deposit.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Depreciation** is the decrease in value of a physical property or asset over time due to lessened ability to produce future cash flows (wear & tear, obsolescence, etc.).',
    },
    {
      id: 't5-q2',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Why is depreciation described as a **non-cash cost** that provides a tax benefit?',
      options: [
        { id: 'a', text: 'Because no cash changes hands each year during depreciation, yet depreciation deductions reduce taxable income and therefore reduce income tax paid.' },
        { id: 'b', text: 'Because businesses never pay for depreciated assets.' },
        { id: 'c', text: 'Because depreciation is paid using foreign currency.' },
        { id: 'd', text: 'Because government refunds 100% of the asset’s purchase price in Year 1.' },
      ],
      correctAnswer: 'a',
      explanation:
        'You pay for the asset up front; annual depreciation charges are **non-cash book expenses** that reduce taxable income and thus lower the business’s income tax burden.',
    },
    {
      id: 't5-q3',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Which of the following is NOT one of the three main **Purposes of Depreciation** listed in the slides?',
      options: [
        { id: 'a', text: 'Permits realistic evaluation of profit earned by a company' },
        { id: 'b', text: 'Provides income tax benefit on profit earned' },
        { id: 'c', text: 'Sets aside a fund regularly to provide recovery of invested capital' },
        { id: 'd', text: 'Eliminates the need for equipment maintenance' },
      ],
      correctAnswer: 'd',
      explanation:
        'Depreciation enables realistic profit evaluation, income tax reduction, and capital recovery — it does **not** eliminate physical maintenance needs.',
    },
    {
      id: 't5-q4',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'How is **Physical Depreciation** distinguished from **Functional Depreciation**?',
      options: [
        { id: 'a', text: 'Physical depreciation stems from physical changes (wear & tear, corrosion, accident, age deterioration); functional depreciation stems from obsolescence, demand shifts, inadequate capacity, or regulatory changes.' },
        { id: 'b', text: 'Functional depreciation is easier to evaluate than physical depreciation.' },
        { id: 'c', text: 'Physical depreciation applies only to land; functional applies only to cash.' },
        { id: 'd', text: 'Functional depreciation is caused exclusively by rust and corrosion.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Physical depreciation** reduces serviceability through physical wear, corrosion, accidents, or age. **Functional depreciation** arises from obsolescence, demand changes, population shifts, public authority rules, or insufficient capacity. Note: physical losses are easier to evaluate than functional losses.',
    },
    {
      id: 't5-q5',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Which external cause of depreciation must be **ignored** when calculating depreciation if it is only temporary?',
      options: [
        { id: 'a', text: 'Temporary shrinkage in market value (only permanent fall in market value is considered)' },
        { id: 'b', text: 'Obsolescence due to new inventions' },
        { id: 'c', text: 'Expiry of leasehold property or patents' },
        { id: 'd', text: 'Damage from fire or flood' },
      ],
      correctAnswer: 'a',
      explanation:
        'As the slides emphasize, **only a permanent fall in market value** is accounted for in depreciation; temporary market value shrinkage should be ignored.',
    },
    {
      id: 't5-q6',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Capacity loss due to the actual consumption of wasting natural resources (such as mines, timber stands, quarries, minerals, and crude oil) is measured as:',
      options: [
        { id: 'a', text: 'Obsolescence' },
        { id: 'b', text: 'Depletion' },
        { id: 'c', text: 'Scrap value' },
        { id: 'd', text: 'Replacement value' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Depletion** applies to natural wasting assets (timber, minerals, crude oil) and is computed as: $$\\text{Depletion Cost} = \\text{Initial Cost} \\times \\frac{\\text{Amount of Material Used}}{\\text{Original Amount Purchased}}$$',
    },
    {
      id: 't5-q7',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'A mining company purchases a mineral deposit for $\\text{₦}120,000,000$ containing an estimated $600,000\\text{ tonnes}$ of ore. If $75,000\\text{ tonnes}$ are extracted in Year 1, what is the **Depletion Cost** for Year 1?',
      options: [
        { id: 'a', text: '₦12,000,000' },
        { id: 'b', text: '₦15,000,000' },
        { id: 'c', text: '₦18,000,000' },
        { id: 'd', text: '₦20,000,000' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\text{Depletion Cost} = \\text{₦}120,000,000 \\times \\frac{75,000}{600,000} = \\text{₦}120,000,000 \\times 0.125 = \\text{₦}15,000,000$$',
    },
    {
      id: 't5-q8',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Which of the following real-property assets is **NOT depreciable**?',
      options: [
        { id: 'a', text: 'Office buildings' },
        { id: 'b', text: 'Warehouses' },
        { id: 'c', text: 'Land itself' },
        { id: 'd', text: 'Manufacturing structures' },
      ],
      correctAnswer: 'c',
      explanation:
        'While buildings, warehouses, and structures are depreciable real property, **Land itself is considered real property and is NOT depreciable**.',
    },
    {
      id: 't5-q9',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'How is **Salvage Value** distinguished from **Scrap (Junk) Value**?',
      options: [
        { id: 'a', text: 'Salvage value is the net amount obtainable when the property can still be sold as a useful unit; scrap/junk value is the profit when it cannot be used as a unit and must be dismantled and sold as junk/raw material.' },
        { id: 'b', text: 'Scrap value is always larger than first cost.' },
        { id: 'c', text: 'Salvage value can never be negative, whereas scrap value is always negative.' },
        { id: 'd', text: 'They are completely unrelated to end-of-life disposal.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Salvage value** is the net amount obtainable from selling used property (potentially capable of further service, and can even be negative if dismantling costs exceed resale); **Scrap/Junk value** applies when the asset is dismantled and sold as junk/raw material.',
    },
    {
      id: 't5-q10',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'What is **Book Value** (also called **Unamortized Cost**)?',
      options: [
        { id: 'a', text: 'The open-market resale price of an asset in good condition.' },
        { id: 'b', text: 'The difference between the original cost of a property and all depreciation charges made to date.' },
        { id: 'c', text: 'The cost to buy a brand-new replacement machine today.' },
        { id: 'd', text: 'The scrap metal weight multiplied by market price.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Book Value ($B_t$)** (unamortized cost) equals original first cost minus cumulative depreciation to date — representing the asset’s worth on accounting records. **Market value** is the open-market selling price; **Replacement value** is the cost to replace it with an equally capable asset.',
    },
    {
      id: 't5-q11',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'Which list gives the **five Methods of Depreciation** covered in the UIL-GET 311 Depreciation slides?',
      options: [
        { id: 'a', text: 'Straight-Line, Declining Balance, Sum-of-the-Years’-Digits, Sinking-Fund, and Service Output' },
        { id: 'b', text: 'NPV, IRR, Payback, Break-Even, and BCR' },
        { id: 'c', text: 'Simple Interest, Compound Interest, Continuous Interest, Annuity, and Gradient' },
        { id: 'd', text: 'Direct, Indirect, Progressive, Regressive, and Proportional' },
      ],
      correctAnswer: 'a',
      explanation:
        'The 5 methods taught in the slides are: **Straight-Line (SL)**, **Declining Balance (DB / DDB)**, **Sum-of-the-Years’-Digits (SOYD)**, **Sinking-Fund**, and **Service Output**.',
    },
    {
      id: 't5-q12',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'In the **Straight-Line Method** of depreciation, what are the formulas for annual depreciation $D_t$ and book value $B_t$ at the end of year $t$?',
      options: [
        { id: 'a', text: '$D_t = \\dfrac{P - F}{n}$ and $B_t = P - t\\left(\\dfrac{P - F}{n}\\right)$' },
        { id: 'b', text: '$D_t = K(1 - K)^{t-1}P$ and $B_t = (1 - K)^t P$' },
        { id: 'c', text: '$D_t = \\dfrac{P + F}{n}$ and $B_t = P + tD_t$' },
        { id: 'd', text: '$D_t = \\dfrac{P - F}{X}x$ and $B_t = P - F$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Under Straight-Line depreciation, a constant amount $D_t = \\dfrac{P - F}{n}$ is charged every year, so after $t$ years $B_t = P - t\\left(\\dfrac{P - F}{n}\\right)$.',
    },
    {
      id: 't5-q13',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'An equipment has first cost $P = 100,000$, estimated life $n = 8\\text{ years}$, and salvage value $F = 20,000$. Using the **Straight-Line Method**, what are the annual depreciation $D_5$ and book value $B_5$ at the end of Year 5?',
      options: [
        { id: 'a', text: '$D_5 = 10,000$, $B_5 = 50,000$' },
        { id: 'b', text: '$D_5 = 12,500$, $B_5 = 37,500$' },
        { id: 'c', text: '$D_5 = 10,000$, $B_5 = 40,000$' },
        { id: 'd', text: '$D_5 = 8,000$, $B_5 = 60,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        'From the worked slide example: $$D_t = \\frac{P - F}{n} = \\frac{100,000 - 20,000}{8} = 10,000\\text{ (constant every year)}$$ $$B_5 = 100,000 - 5(10,000) = 50,000$$',
    },
    {
      id: 't5-q14',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'A CNC lathe is bought for $\\text{₦}2,400,000$ with an expected life of $10\\text{ years}$ and salvage value $\\text{₦}400,000$. Using the **Straight-Line Method**, what is its book value at the end of Year 7?',
      options: [
        { id: 'a', text: '₦1,000,000' },
        { id: 'b', text: '₦1,400,000' },
        { id: 'c', text: '₦800,000' },
        { id: 'd', text: '₦1,200,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$D_t = \\frac{2,400,000 - 400,000}{10} = \\text{₦}200,000/\\text{yr}$$ $$B_7 = 2,400,000 - 7(200,000) = \\text{₦}1,000,000$$',
    },
    {
      id: 't5-q15',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'What is a **major limitation** of the **Declining Balance Method** of depreciation?',
      options: [
        { id: 'a', text: 'It charges equal depreciation every year.' },
        { id: 'b', text: 'The book value at the end of the asset’s life may not exactly equal the estimated salvage value.' },
        { id: 'c', text: 'It cannot be used for machinery.' },
        { id: 'd', text: 'It requires knowing the total kilometres or units produced.' },
      ],
      correctAnswer: 'b',
      explanation:
        'In the Declining Balance Method, a fixed fraction $K$ of the prior book value is depreciated each year ($B_t = (1-K)^t P$), so **$B_n$ may not exactly equal the salvage value $F$**.',
    },
    {
      id: 't5-q16',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'When the Declining Balance rate $K$ is set to its maximum tax-allowed rate of $K = \\dfrac{2}{n}$, what is the method called?',
      options: [
        { id: 'a', text: 'Double Declining Balance (DDB) method' },
        { id: 'b', text: 'Sum-of-the-Years’-Digits method' },
        { id: 'c', text: 'Sinking-Fund method' },
        { id: 'd', text: 'Straight-Line method' },
      ],
      correctAnswer: 'a',
      explanation:
        'Setting $K = \\dfrac{2}{n}$ (twice the straight-line rate $1/n$) yields the **Double Declining Balance (DDB)** method.',
    },
    {
      id: 't5-q17',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'An asset has first cost $P = 100,000$, life $n = 8\\text{ years}$, and $K = 0.2$. Using the **Declining Balance Method**, what are the depreciation $D_1$ and book value $B_1$ at the end of Year 1, and $D_2$, $B_2$ at the end of Year 2?',
      options: [
        { id: 'a', text: '$D_1 = 20,000, B_1 = 80,000$; $D_2 = 16,000, B_2 = 64,000$' },
        { id: 'b', text: '$D_1 = 20,000, B_1 = 80,000$; $D_2 = 20,000, B_2 = 60,000$' },
        { id: 'c', text: '$D_1 = 16,000, B_1 = 84,000$; $D_2 = 12,800, B_2 = 71,200$' },
        { id: 'd', text: '$D_1 = 25,000, B_1 = 75,000$; $D_2 = 18,750, B_2 = 56,250$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Year 1: $D_1 = 0.2 \\times 100,000 = 20,000$, $B_1 = 100,000 - 20,000 = 80,000$. Year 2: $D_2 = 0.2 \\times 80,000 = 16,000$, $B_2 = 80,000 - 16,000 = 64,000$.',
    },
    {
      id: 't5-q18',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'For the same asset ($P = 100,000$, $n = 8\\text{ years}$, $K = 0.2$), compute the **Declining Balance** depreciation $D_5$ and book value $B_5$ for **Year 5**.',
      options: [
        { id: 'a', text: '$D_5 = 8,192$, $B_5 = 32,768$' },
        { id: 'b', text: '$D_5 = 10,240$, $B_5 = 40,960$' },
        { id: 'c', text: '$D_5 = 6,553.60$, $B_5 = 26,214.40$' },
        { id: 'd', text: '$D_5 = 8,888.89$, $B_5 = 33,333.33$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using the direct formulas: $$D_5 = K(1 - K)^{5-1}P = 0.2(0.8)^4(100,000) = 0.2(0.4096)(100,000) = 8,192$$ $$B_5 = (1 - K)^5 P = (0.8)^5(100,000) = 32,768$$',
    },
    {
      id: 't5-q19',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'Using the **Double Declining Balance (DDB)** method on an asset with first cost $P = \\text{₦}500,000$ and recovery period $n = 5\\text{ years}$, what is the depreciation rate $K$ and Year 2 depreciation $D_2$?',
      options: [
        { id: 'a', text: '$K = 0.40$, $D_2 = \\text{₦}120,000$' },
        { id: 'b', text: '$K = 0.20$, $D_2 = \\text{₦}80,000$' },
        { id: 'c', text: '$K = 0.40$, $D_2 = \\text{₦}200,000$' },
        { id: 'd', text: '$K = 0.25$, $D_2 = \\text{₦}93,750$' },
      ],
      correctAnswer: 'a',
      explanation:
        'For DDB, $K = \\dfrac{2}{n} = \\dfrac{2}{5} = 0.40$. Year 1: $D_1 = 0.4(500,000) = \\text{₦}200,000$, $B_1 = \\text{₦}300,000$. Year 2: $D_2 = 0.4(300,000) = \\text{₦}120,000$.',
    },
    {
      id: 't5-q20',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'In the **Sum-of-the-Years’-Digits (SOYD)** method for an asset with useful life $n = 8\\text{ years}$, what is the sum of the years’ digits $S$ and the depreciation fraction for Year 1?',
      options: [
        { id: 'a', text: '$S = 36$, Year 1 rate $= \\dfrac{8}{36}$' },
        { id: 'b', text: '$S = 36$, Year 1 rate $= \\dfrac{1}{36}$' },
        { id: 'c', text: '$S = 28$, Year 1 rate $= \\dfrac{8}{28}$' },
        { id: 'd', text: '$S = 64$, Year 1 rate $= \\dfrac{8}{64}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$S = \\frac{n(n+1)}{2} = \\frac{8 \\times 9}{2} = 36$$ In SOYD, Year 1 gets the highest rate: $\\dfrac{n - 1 + 1}{S} = \\dfrac{8}{36}$.',
    },
    {
      id: 't5-q21',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'Using the **SOYD method** for $P = 100,000$, $F = 20,000$, $n = 8\\text{ years}$, what are the depreciation $D_5$ and book value $B_5$ for the **5th year**?',
      options: [
        { id: 'a', text: '$D_5 = 8,888.89$, $B_5 = 33,333.33$' },
        { id: 'b', text: '$D_5 = 11,111.11$, $B_5 = 42,222.22$' },
        { id: 'c', text: '$D_5 = 17,777.78$, $B_5 = 82,222.22$' },
        { id: 'd', text: '$D_5 = 10,000.00$, $B_5 = 50,000.00$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$D_5 = \\frac{n - t + 1}{n(n+1)/2}(P - F) = \\frac{8 - 5 + 1}{36}(80,000) = \\frac{4}{36}(80,000) = 8,888.89$$ $$B_5 = (P - F)\\left(\\frac{n-t}{n}\\right)\\left(\\frac{n-t+1}{n+1}\\right) + F = 80,000\\left(\\frac{3}{8}\\right)\\left(\\frac{4}{9}\\right) + 20,000 = 13,333.33 + 20,000 = 33,333.33$$',
    },
    {
      id: 't5-q22',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'A delivery van has first cost $\\text{₦}6,500,000$, salvage value $\\text{₦}500,000$, and useful life $n = 5\\text{ years}$. Using the **SOYD method**, what is the depreciation in Year 2 ($D_2$)?',
      options: [
        { id: 'a', text: '₦2,000,000' },
        { id: 'b', text: '₦1,600,000' },
        { id: 'c', text: '₦1,200,000' },
        { id: 'd', text: '₦800,000' },
      ],
      correctAnswer: 'b',
      explanation:
        '$S = \\dfrac{5(6)}{2} = 15$, $P - F = \\text{₦}6,000,000$. For Year 2: $$D_2 = \\frac{5 - 2 + 1}{15}(6,000,000) = \\frac{4}{15}(6,000,000) = \\text{₦}1,600,000$$',
    },
    {
      id: 't5-q23',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'How does the **book value decrease** over time under the **Sinking-Fund Method** compared to the **SOYD / Declining Balance** methods?',
      options: [
        { id: 'a', text: 'Under Sinking-Fund, book value decreases at an INCREASING rate (annual net depreciation grows with time); under SOYD/DB, book value decreases at a DECREASING rate.' },
        { id: 'b', text: 'Under Sinking-Fund, book value decreases at a constant linear rate.' },
        { id: 'c', text: 'Under Sinking-Fund, annual depreciation is highest in Year 1 and drops every year.' },
        { id: 'd', text: 'Both Sinking-Fund and SOYD produce identical annual depreciation.' },
      ],
      correctAnswer: 'a',
      explanation:
        'In the **Sinking-Fund Method**, each fixed deposit $A = (P-F)(A/F, i, n)$ earns compound interest, so total annual depreciation $D_t = (P-F)(A/F, i, n)(F/P, i, t-1)$ **increases** over time, making book value decrease at an **increasing rate**.',
    },
    {
      id: 't5-q24',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'Using the **Sinking-Fund Method** for $P = 100,000$, $F = 20,000$, $n = 8\\text{ years}$, $i = 12\\%$ with $(A/F, 12\\%, 8) = 0.0813$, what is the fixed annual sinking-fund deposit $A$?',
      options: [
        { id: 'a', text: '$6,504$' },
        { id: 'b', text: '$8,130$' },
        { id: 'c', text: '$10,000$' },
        { id: 'd', text: '$9,600$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$A = (P - F)(A/F, 12\\%, 8) = (100,000 - 20,000) \\times 0.0813 = 80,000 \\times 0.0813 = 6,504$$',
    },
    {
      id: 't5-q25',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'Continuing the Sinking-Fund example ($P = 100,000$, $F = 20,000$, $n = 8$, $i = 12\\%$, $(A/F, 12\\%, 8) = 0.0813$, $(F/P, 12\\%, 4) = 1.574$), what is the net depreciation in Year 5 ($D_5$)?',
      options: [
        { id: 'a', text: '$10,237.30$' },
        { id: 'b', text: '$6,504.00$' },
        { id: 'c', text: '$12,837.74$' },
        { id: 'd', text: '$8,158.62$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using $D_t = (P - F)(A/F, i, n)(F/P, i, t - 1)$ for $t = 5$: $$D_5 = 80,000 \\times 0.0813 \\times 1.574 = 6,504 \\times 1.574 = 10,237.30$$',
    },
    {
      id: 't5-q26',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'For the same Sinking-Fund example ($P = 100,000$, $F = 20,000$, $(A/F, 12\\%, 8) = 0.0813$, $(F/A, 12\\%, 7) = 10.089$), what is the book value at the end of Year 7 ($B_7$)?',
      options: [
        { id: 'a', text: '$34,381.14$' },
        { id: 'b', text: '$47,218.81$' },
        { id: 'c', text: '$20,000.00$' },
        { id: 'd', text: '$58,681.08$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using $B_t = P - (P - F)(A/F, i, n)(F/A, i, t)$ for $t = 7$: $$B_7 = 100,000 - (80,000)(0.0813)(10.089) = 100,000 - 65,618.86 = 34,381.14$$',
    },
    {
      id: 't5-q27',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'When is the **Service Output Method** of depreciation preferred over time-based methods?',
      options: [
        { id: 'a', text: 'When asset wear is driven by actual usage or service rendered (e.g., km of road laid, hours run, units produced) rather than calendar time.' },
        { id: 'b', text: 'When the asset is land.' },
        { id: 'c', text: 'When interest rates exceed 20%.' },
        { id: 'd', text: 'When salvage value equals first cost.' },
      ],
      correctAnswer: 'a',
      explanation:
        'The **Service Output Method** computes depreciation per unit of service rendered: $$D = \\frac{P - F}{X}(x)$$ where $X$ is lifetime capacity and $x$ is service rendered in the period.',
    },
    {
      id: 't5-q28',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'From the worked slide example: a road-laying machine has first cost $P = 8,000,000$, salvage value $F = 50,000$, and lifetime capacity $X = 75,000\\text{ km}$. If it lays $x = 2,000\\text{ km}$ in Year 3, what is its Year 3 depreciation?',
      options: [
        { id: 'a', text: '$212,000$' },
        { id: 'b', text: '$213,333$' },
        { id: 'c', text: '$160,000$' },
        { id: 'd', text: '$106,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$D_3 = \\frac{P - F}{X} \\times x = \\frac{8,000,000 - 50,000}{75,000} \\times 2,000 = \\frac{7,950,000}{75,000} \\times 2,000 = 106 \\times 2,000 = 212,000$$',
    },
    {
      id: 't5-q29',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'A diesel generator costs $\\text{₦}4,500,000$, has salvage value $\\text{₦}500,000$, and has a rated lifetime of $20,000\\text{ operating hours}$. If it operates for $3,500\\text{ hours}$ in Year 1, what is its **Service Output** depreciation for Year 1?',
      options: [
        { id: 'a', text: '₦700,000' },
        { id: 'b', text: '₦787,500' },
        { id: 'c', text: '₦650,000' },
        { id: 'd', text: '₦500,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{Rate per hour} = \\frac{4,500,000 - 500,000}{20,000} = \\text{₦}200/\\text{hr}$$ $$D_1 = 200 \\times 3,500 = \\text{₦}700,000$$',
    },
    {
      id: 't5-q30',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'What is the difference between **Service Life** and **Depreciable Life (Recovery Period)**?',
      options: [
        { id: 'a', text: 'Service life (economic/useful life) is the period during which using the property is economically feasible; depreciable life (recovery period) is the number of years over which the asset is depreciated by the chosen method, and the two may differ.' },
        { id: 'b', text: 'Service life is always 10 years, while recovery period is always 5 years.' },
        { id: 'c', text: 'Depreciable life ignores the depreciation method completely.' },
        { id: 'd', text: 'They are always legally required to be identical.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Service (useful/economic) life** reflects economic feasibility (accounting for physical & functional depreciation), whereas **Depreciable life (recovery period)** is set by the depreciation method/tax rules and may differ from useful life.',
    },
    {
      id: 't5-q31',
      topicId: 'depreciation-methods',
      difficulty: 'conceptual',
      question:
        'In depreciation terminology, what is included in the **First Cost ($P$)** of an asset?',
      options: [
        { id: 'a', text: 'Only the factory list price before shipping.' },
        { id: 'b', text: 'Purchase price plus delivery, installation, commissioning fees, and other depreciable direct costs incurred to prepare the asset for use.' },
        { id: 'c', text: 'Only annual fuel and operator wages.' },
        { id: 'd', text: 'The resale price at the end of Year 10.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**First Cost ($P$)** is the delivered and installed cost — including purchase price, delivery/freight, installation, commissioning, and direct preparation costs.',
    },
    {
      id: 't5-q32',
      topicId: 'depreciation-methods',
      difficulty: 'calculation',
      question:
        'For an equipment with $P = 100,000$, $F = 20,000$, $n = 8\\text{ years}$, which method gives the **highest Year 1 depreciation** among Straight-Line, Declining Balance ($K = 0.2$), and SOYD?',
      options: [
        { id: 'a', text: 'Straight-Line ($10,000$)' },
        { id: 'b', text: 'Declining Balance with $K = 0.2$ ($20,000$)' },
        { id: 'c', text: 'SOYD ($17,777.78$)' },
        { id: 'd', text: 'All three give the exact same Year 1 depreciation.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Comparing Year 1 depreciation: Straight-Line $= 10,000$; SOYD $= \\frac{8}{36}(80,000) = 17,777.78$; Declining Balance ($K=0.2$) $= 0.2(100,000) = \\mathbf{20,000}$ (highest).',
    },
  ],
};
