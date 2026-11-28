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
        { id: 'a', text: 'A mandatory annual cash payment remitted to the Central Bank by manufacturing firms.' },
        { id: 'b', text: 'Decrease in a physical asset’s value over time.' },
        { id: 'c', text: 'The steady appreciation in market value of undeveloped industrial land over time.' },
        { id: 'd', text: 'The compound interest earned on a sinking-fund deposit held in a commercial bank.' },
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
        { id: 'a', text: 'No cash leaves yearly, yet deductions lower taxable income and tax paid.' },
        { id: 'b', text: 'Businesses acquire depreciated machinery on credit without ever paying the initial purchase price.' },
        { id: 'c', text: 'Depreciation charges are settled exclusively in foreign currency rather than domestic Naira cash.' },
        { id: 'd', text: 'Government tax authorities refund 100% of the asset’s purchase price in cash during Year 1.' },
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
        { id: 'a', text: 'Permits realistic evaluation of company profit' },
        { id: 'b', text: 'Provides income tax benefit on earned profit' },
        { id: 'c', text: 'Sets aside a fund for capital recovery' },
        { id: 'd', text: 'Eliminates physical equipment maintenance' },
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
        { id: 'a', text: 'Physical comes from wear, corrosion, or accidents; functional comes from obsolescence or demand shifts.' },
        { id: 'b', text: 'Functional depreciation is always easier to measure accurately than physical depreciation in practice.' },
        { id: 'c', text: 'Physical depreciation applies exclusively to undeveloped land; functional applies only to liquid cash.' },
        { id: 'd', text: 'Functional depreciation is caused purely by rust and mechanical wear, while physical comes from new patents.' },
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
        { id: 'a', text: 'Temporary fall in market value' },
        { id: 'b', text: 'Technological obsolescence from new inventions' },
        { id: 'c', text: 'Expiry of leasehold property or registered patents' },
        { id: 'd', text: 'Accidental destruction from fire, flood, or storms' },
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
        { id: 'd', text: 'Factory structures' },
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
        { id: 'a', text: 'Salvage is resale as a usable unit; scrap is dismantling for junk/raw material.' },
        { id: 'b', text: 'Scrap value is always larger than the original installed first cost of the machine.' },
        { id: 'c', text: 'Salvage value can never be negative, whereas scrap value is always a negative disposal charge.' },
        { id: 'd', text: 'Both terms refer solely to upfront installation costs and are unrelated to end-of-life value.' },
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
        { id: 'a', text: 'The current open-market resale price of an asset in good working condition.' },
        { id: 'b', text: 'Original cost minus cumulative depreciation to date.' },
        { id: 'c', text: 'The price required to purchase a brand-new equally capable replacement machine.' },
        { id: 'd', text: 'The total dismantled scrap metal weight multiplied by current market scrap price.' },
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
        { id: 'a', text: 'Straight-Line, Declining Balance, SOYD, Sinking-Fund, Service Output' },
        { id: 'b', text: 'Net Present Value, IRR, Payback Period, Break-Even, Benefit-Cost Ratio' },
        { id: 'c', text: 'Simple Interest, Compound Interest, Continuous Interest, Annuity, Gradient' },
        { id: 'd', text: 'Direct Tax, Indirect Tax, Progressive Tax, Regressive Tax, Proportional Tax' },
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
        { id: 'a', text: '$D_t = \\dfrac{P - F}{n}$ and $B_t = P - tD_t$' },
        { id: 'b', text: '$D_t = K(1 - K)^{t-1}P$ and $B_t = (1 - K)^t P$' },
        { id: 'c', text: '$D_t = \\dfrac{P + F}{n}$ and $B_t = P + t\\left(\\dfrac{P + F}{n}\\right)$' },
        { id: 'd', text: '$D_t = \\dfrac{P - F}{X}x$ and $B_t = P - \\dfrac{P - F}{X}t$' },
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
        { id: 'd', text: '$D_5 = 18,000$, $B_5 = 60,000$' },
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
        { id: 'a', text: 'It charges an identical fixed depreciation amount every single year.' },
        { id: 'b', text: 'Ending book value may not equal salvage value.' },
        { id: 'c', text: 'It is legally prohibited for manufacturing equipment and vehicles.' },
        { id: 'd', text: 'It requires metering the exact kilometres or units produced every year.' },
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
        { id: 'a', text: 'Double Declining Balance' },
        { id: 'b', text: 'Sum-of-the-Years’-Digits method' },
        { id: 'c', text: 'Compound Sinking-Fund method' },
        { id: 'd', text: 'Accelerated Straight-Line method' },
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
        { id: 'a', text: '$D_5 = 8,192.00$, $B_5 = 32,768.00$' },
        { id: 'b', text: '$D_5 = 10,240.00$, $B_5 = 40,960.00$' },
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
        { id: 'd', text: '₦1,800,000' },
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
        { id: 'a', text: 'Sinking-Fund decreases at an increasing rate; SOYD/DB at a decreasing rate.' },
        { id: 'b', text: 'Sinking-Fund decreases at a perfectly constant linear rate across every year of service.' },
        { id: 'c', text: 'Sinking-Fund charges its highest depreciation in Year 1 and declines steadily each year.' },
        { id: 'd', text: 'Both Sinking-Fund and SOYD generate identical annual depreciation schedules at all rates.' },
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
        { id: 'b', text: '$16,504.00$' },
        { id: 'c', text: '$12,837.74$' },
        { id: 'd', text: '$11,158.62$' },
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
        { id: 'a', text: 'When wear depends on actual usage or output rather than calendar time.' },
        { id: 'b', text: 'When the depreciable asset is undeveloped industrial real estate or land.' },
        { id: 'c', text: 'When benchmark Central Bank interest rates exceed $20\\%$ per annum.' },
        { id: 'd', text: 'When the estimated salvage value equals or exceeds the original first cost.' },
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
        { id: 'a', text: 'Service life is economically feasible use; depreciable life is the recovery period set by the method.' },
        { id: 'b', text: 'Service life is fixed at 10 years for all machinery, whereas recovery period is fixed at 5 years.' },
        { id: 'c', text: 'Depreciable life ignores the chosen depreciation method and depends solely on resale market prices.' },
        { id: 'd', text: 'Service life and recovery period are legally mandated to be identical for every industrial asset.' },
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
        { id: 'a', text: 'Only the base factory catalog price before freight, duties, or installation.' },
        { id: 'b', text: 'Purchase price plus delivery, installation, and commissioning costs.' },
        { id: 'c', text: 'Only recurring annual fuel, electricity, and direct operator labour wages.' },
        { id: 'd', text: 'The estimated open-market resale price expected at the end of Year 10.' },
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
        { id: 'a', text: 'Straight-Line ($10,000.00$)' },
        { id: 'b', text: 'Declining Balance ($20,000.00$)' },
        { id: 'c', text: 'Sum-of-the-Years’-Digits ($17,777.78$)' },
        { id: 'd', text: 'All three produce identical Year 1 charges' },
      ],
      correctAnswer: 'b',
      explanation:
        'Comparing Year 1 depreciation: Straight-Line $= 10,000$; SOYD $= \\frac{8}{36}(80,000) = 17,777.78$; Declining Balance ($K=0.2$) $= 0.2(100,000) = \\mathbf{20,000}$ (highest).',
    },
  ],
};
