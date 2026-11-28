import { PublicQuizTopic } from '@/types/public-quiz';

export const topic4DecisionsLcc: PublicQuizTopic = {
  id: 'engineering-decisions-lcc',
  title: 'Engineering Decisions, Alternatives & LCC',
  shortTitle: 'Decisions & LCC',
  description:
    'Economic & engineering decision-making steps, EIA/SIA/ESIA, NPV/NAW/IRR/PBP alternatives analysis, Life Cycle Costing (LCC) vs TCO, and worked machine selection problems.',
  icon: 'FileSpreadsheet',
  accent: 'orange',
  questions: [
    {
      id: 't4-q1',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Which of the following is NOT one of the three fundamental questions answered when making economic decisions?',
      options: [
        { id: 'a', text: 'What goods to produce?' },
        { id: 'b', text: 'How to produce them?' },
        { id: 'c', text: 'For whom to produce?' },
        { id: 'd', text: 'When to depreciate?' },
      ],
      correctAnswer: 'd',
      explanation:
        'The three fundamental economic questions are: **What to produce?**, **How to produce?**, and **For whom to produce?**',
    },
    {
      id: 't4-q2',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Comparing the **incremental benefits** of an engineering choice against its **incremental costs** is known as:',
      options: [
        { id: 'a', text: 'Marginal Analysis' },
        { id: 'b', text: 'Sunk Cost Analysis' },
        { id: 'c', text: 'Salvage Valuation' },
        { id: 'd', text: 'Depletion Accounting' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Marginal Analysis** evaluates whether the additional (incremental) benefit of a choice outweighs its additional (incremental) cost.',
    },
    {
      id: 't4-q3',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'How do **EIA** (Environmental Impact Assessment) and **SIA** (Social Impact Assessment) differ in focus?',
      options: [
        { id: 'a', text: 'EIA focuses on the biophysical environment; SIA focuses on human and social impacts.' },
        { id: 'b', text: 'EIA applies exclusively to digital and software engineering projects; SIA applies only to bridges and dams.' },
        { id: 'c', text: 'SIA measures corporate income tax liabilities and royalties; EIA measures central bank interest rates.' },
        { id: 'd', text: 'EIA and SIA are mutually exclusive regulatory studies that can never be combined into an ESIA.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**EIA** focuses on the **biophysical environment** (water, air, land, wildlife), while **SIA** focuses on **human and social dimensions**. Together they form **ESIA** (Environmental and Social Impact Assessment).',
    },
    {
      id: 't4-q4',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'In the 7-step **Engineering Decision-Making Process**, what is the very first step?',
      options: [
        { id: 'a', text: 'Documentation and record keeping for regulatory traceability' },
        { id: 'b', text: 'Problem Identification' },
        { id: 'c', text: 'Implementation of the selected engineering alternative' },
        { id: 'd', text: 'Review, performance monitoring, and corrective control' },
      ],
      correctAnswer: 'b',
      explanation:
        'The 7 steps are: (1) **Problem Identification**, (2) Goal/Objective definition, (3) Data collection & analysis, (4) Evaluation of alternatives, (5) Implementation, (6) Documentation, (7) Review and control.',
    },
    {
      id: 't4-q5',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'In Step 2 of Engineering Decision-Making, how does a **Goal** differ from an **Objective**?',
      options: [
        { id: 'a', text: 'A goal is the broad long-term outcome; objectives are measurable short-term targets.' },
        { id: 'b', text: 'Goals are always expressed as strict numerical formulas, while objectives remain intentionally vague.' },
        { id: 'c', text: 'Objectives are only defined after full implementation to evaluate whether the project broke even.' },
        { id: 'd', text: 'There is no practical distinction between goals and objectives in systematic engineering planning.' },
      ],
      correctAnswer: 'a',
      explanation:
        'A **Goal** is the broad, long-term desired outcome, whereas **Objectives** break the problem down into measurable, short-term terms.',
    },
    {
      id: 't4-q6',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Why is **Documentation** (Step 6 of engineering decision-making) essential in engineering practice?',
      options: [
        { id: 'a', text: 'It completely eliminates the need for quantitative data collection, modelling, and simulation.' },
        { id: 'b', text: 'It aids traceability, quality control, future reference, and liability protection.' },
        { id: 'c', text: 'It legally increases the annual depreciation rate allowed on factory production equipment.' },
        { id: 'd', text: 'It replaces national engineering design codes, safety limits, and standard operating procedures.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Proper **documentation** preserves traceability for quality control, regulatory agencies, future reference, and legal protection against liability.',
    },
    {
      id: 't4-q7',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Which of the following is one of the four **Basic Characteristics of Engineering Decisions**?',
      options: [
        { id: 'a', text: 'Bypassing legal codes and safety rules to minimize upfront project cost' },
        { id: 'b', text: 'Adherence to constraints (codes, regulations, budgets, SOPs)' },
        { id: 'c', text: 'Relying purely on managerial intuition rather than quantitative calculations' },
        { id: 'd', text: 'Eliminating all engineering trade-offs before allocating limited resources' },
      ],
      correctAnswer: 'b',
      explanation:
        'The four basic characteristics of engineering decisions are: **Trade-off balancing**, **Resource allocation**, **Adherence to constraints**, and **Consequence and risk**.',
    },
    {
      id: 't4-q8',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Which list contains standard **Basic Methods used to Analyze Economic Alternatives** taught in GET 311?',
      options: [
        { id: 'a', text: 'AW, FW, PW, IRR, Payback Period, BCR, and Break-Even' },
        { id: 'b', text: 'FIFO, LIFO, Weighted Average Costing, and Direct Barter Valuation' },
        { id: 'c', text: 'Demand-pull, Cost-push, Hyperinflation, CPI, and Fiscal Policy' },
        { id: 'd', text: 'Direct tax, Indirect tax, PAYE, Withholding Tax, and Value Added Tax' },
      ],
      correctAnswer: 'a',
      explanation:
        'The 7 basic methods to evaluate economic alternatives are: **Annual Value (Worth), Future Value, Present Value, Internal Rate of Return (IRR), Payback Period (PBP), Benefit-Cost Ratio (BCR), and Break-Even Analysis**.',
    },
    {
      id: 't4-q9',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'In **Net Annual Worth (NAW)** analysis, where $NAW = \\sum \\text{Cash Inflow} - \\sum \\text{Cash Outflow}$, when is a standalone project economically profitable?',
      options: [
        { id: 'a', text: 'When $NAW > 0$' },
        { id: 'b', text: 'When $NAW < 0$' },
        { id: 'c', text: 'When initial capital $= 0$' },
        { id: 'd', text: 'When sunk costs $>$ salvage' },
      ],
      correctAnswer: 'a',
      explanation:
        'A standalone project is **profitable when $NAW > 0$** (inflows exceed outflows in annual equivalent terms) and **not profitable when $NAW < 0$**.',
    },
    {
      id: 't4-q10',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'A machine operation project has initial capital $\\text{₦}10,000$, annual income $\\text{₦}5,000$, annual expenditure $\\text{₦}3,000$, sunk cost $\\text{₦}1,500$, lifespan $5\\text{ years}$, salvage value $20\\%$ of initial capital, and $i = 10\\%$. Using $(P/A, 10\\%, 5) = 3.7908$ and $(P/F, 10\\%, 5) = 0.6209$, what is the exact **Present Worth (PW)**?',
      options: [
        { id: 'a', text: '$-\\text{₦}1,176.60$ (Reject)' },
        { id: 'b', text: '$+\\text{₦}1,176.60$ (Accept)' },
        { id: 'c', text: '$-\\text{₦}2,676.60$ (Reject)' },
        { id: 'd', text: '$+\\text{₦}2,000.00$ (Accept)' },
      ],
      correctAnswer: 'a',
      explanation:
        'Sunk cost ($\\text{₦}1,500$) is ignored. Net annual income $A = 5,000 - 3,000 = \\text{₦}2,000$. Salvage value $F = 20\\% \\times 10,000 = \\text{₦}2,000$. $$PW = 2,000(3.7908) + 2,000(0.6209) - 10,000 = 7,581.60 + 1,241.80 - 10,000 = -\\text{₦}1,176.60$$ Since $PW < 0$, the project should be **rejected**.',
    },
    {
      id: 't4-q11',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'Two brick-making machines are compared at $i = 8\\%$ using **Net Annual Worth (NAW)** (cost-only comparison, no revenue listed). Machine A: $P = \\text{₦}26,000$, $n = 6\\text{ yrs}$, $SV = \\text{₦}2,000$, maint $= \\text{₦}800$/yr, labour $= \\text{₦}11,000$/yr, sunk $= \\text{₦}1,200$. Given $(A/P, 8\\%, 6) = 0.2163$ and $(A/F, 8\\%, 6) = 0.1363$, what is $NAW_A$?',
      options: [
        { id: 'a', text: '$-\\text{₦}17,151.20$' },
        { id: 'b', text: '$-\\text{₦}18,351.20$' },
        { id: 'c', text: '$-\\text{₦}15,057.00$' },
        { id: 'd', text: '$-\\text{₦}11,800.00$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Ignore sunk cost ($\\text{₦}1,200$). $$\\sum CI = 2,000(0.1363) = \\text{₦}272.60$$ $$\\sum CO = 26,000(0.2163) + 800 + 11,000 = 5,623.80 + 11,800 = \\text{₦}17,423.80$$ $$NAW_A = 272.60 - 17,423.80 = -\\text{₦}17,151.20$$',
    },
    {
      id: 't4-q12',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'For the same brick-making comparison at $i = 8\\%$, Machine B has $P = \\text{₦}36,000$, $n = 10\\text{ yrs}$, $SV = \\text{₦}3,000$, maint $= \\text{₦}300$/yr, labour $= \\text{₦}7,000$/yr, annual exp $= \\text{₦}2,600$/yr, sunk $= \\text{₦}900$. Given $(A/P, 8\\%, 10) = 0.1490$ and $(A/F, 8\\%, 10) = 0.0690$, what is $NAW_B$ and which machine should be selected?',
      options: [
        { id: 'a', text: '$-\\text{₦}15,057.00$; select Machine B' },
        { id: 'b', text: '$-\\text{₦}15,057.00$; select Machine A' },
        { id: 'c', text: '$-\\text{₦}19,200.00$; select Machine A' },
        { id: 'd', text: '$+\\text{₦}15,057.00$; select Machine B' },
      ],
      correctAnswer: 'a',
      explanation:
        'Ignore sunk cost ($\\text{₦}900$). $$\\sum CI = 3,000(0.0690) = \\text{₦}207.00$$ $$\\sum CO = 36,000(0.1490) + 300 + 7,000 + 2,600 = 5,364 + 9,900 = \\text{₦}15,264.00$$ $$NAW_B = 207 - 15,264 = -\\text{₦}15,057.00$$ Since $-\\text{₦}15,057.00 > -\\text{₦}17,151.20$, **Machine B** is economically better.',
    },
    {
      id: 't4-q13',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Why is the **Annual Worth (AW / NAW)** method especially convenient when comparing mutually exclusive machines with **unequal service lives** (e.g., 6 years vs. 10 years)?',
      options: [
        { id: 'a', text: 'It compares one life cycle per asset without needing an LCM horizon.' },
        { id: 'b', text: 'It completely ignores compound interest rates when evaluating multi-year projects.' },
        { id: 'c', text: 'It automatically incorporates past sunk costs into the capital recovery calculation.' },
        { id: 'd', text: 'It forces the salvage value of every competing machine to equal zero at retirement.' },
      ],
      correctAnswer: 'a',
      explanation:
        'Annual Worth converts each alternative’s cash flows to an equivalent uniform annual amount over its own service life, avoiding the need to repeat cycles to an LCM horizon (assuming repeatability).',
    },
    {
      id: 't4-q14',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'A dough mixer for making snacks costs $\\text{₦}100,000$, generates annual income of $\\text{₦}40,000$, incurs annual disbursements of $\\text{₦}22,000$, has salvage value $\\text{₦}20,000$, lifespan $10\\text{ years}$, and MARR $= 13\\%$. Using $(P/A, 13\\%, 10) = 5.4262$ and $(P/F, 13\\%, 10) = 0.2946$, what is the **Net Present Value (NPV)**?',
      options: [
        { id: 'a', text: '$+\\text{₦}3,563.60$ (Accept)' },
        { id: 'b', text: '$-\\text{₦}3,563.60$ (Reject)' },
        { id: 'c', text: '$+\\text{₦}8,000.00$ (Accept)' },
        { id: 'd', text: '$-\\text{₦}2,327.60$ (Reject)' },
      ],
      correctAnswer: 'a',
      explanation:
        'Net annual cash inflow $A = 40,000 - 22,000 = \\text{₦}18,000$. $$NPV = 18,000(5.4262) + 20,000(0.2946) - 100,000 = 97,671.60 + 5,892.00 - 100,000 = +\\text{₦}3,563.60$$ Since $NPV > 0$, the dough mixer is **economically viable** (and its IRR exceeds the $13\\%$ MARR).',
    },
    {
      id: 't4-q15',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'What is the **Internal Rate of Return (IRR)** of a project, and when is a single proposal accepted under IRR analysis?',
      options: [
        { id: 'a', text: 'Rate where $NPV = 0$; accept if $IRR \\ge \\text{MARR}$.' },
        { id: 'b', text: 'Rate where $NPV$ is maximized; accept if $IRR < \\text{MARR}$.' },
        { id: 'c', text: 'Ratio of salvage value to first cost; accept if $IRR > 1$.' },
        { id: 'd', text: 'Inflation rate minus corporate tax rate; accept if positive.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**IRR** is the discount rate $i^*$ that makes the project’s Net Present Value equal to zero ($NPV = 0$). A project is justified when **$IRR \\ge \\text{MARR}$** (Minimum Acceptable Rate of Return).',
    },
    {
      id: 't4-q16',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'An engineering machine requires an initial investment of $\\text{₦}450,000$ and produces uniform net annual savings of $\\text{₦}90,000$. What is its simple **Payback Period (PBP)**?',
      options: [
        { id: 'a', text: '$4.0\\text{ years}$' },
        { id: 'b', text: '$5.0\\text{ years}$' },
        { id: 'c', text: '$6.0\\text{ years}$' },
        { id: 'd', text: '$4.5\\text{ years}$' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\text{Simple Payback Period} = \\frac{\\text{Initial Investment}}{\\text{Annual Net Cash Inflow}} = \\frac{\\text{₦}450,000}{\\text{₦}90,000/\\text{yr}} = 5\\text{ years}$$',
    },
    {
      id: 't4-q17',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'A workshop has annual fixed costs of $\\text{₦}600,000$, variable cost per unit of $\\text{₦}2,500$, and selling price per unit of $\\text{₦}4,000$. What is the **Break-Even Quantity** $Q_{BE}$?',
      options: [
        { id: 'a', text: '$150\\text{ units}$' },
        { id: 'b', text: '$240\\text{ units}$' },
        { id: 'c', text: '$400\\text{ units}$' },
        { id: 'd', text: '$600\\text{ units}$' },
      ],
      correctAnswer: 'c',
      explanation:
        'At break-even, Total Revenue = Total Cost: $$Q_{BE} = \\frac{\\text{Fixed Cost}}{\\text{Selling Price} - \\text{Variable Cost}} = \\frac{600,000}{4,000 - 2,500} = \\frac{600,000}{1,500} = 400\\text{ units}$$',
    },
    {
      id: 't4-q18',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'How does **Life Cycle Costing (LCC)** differ from **Total Cost of Ownership (TCO)** according to the UIL-GET 311 lecture notes?',
      options: [
        { id: 'a', text: 'LCC tracks physical asset lifecycle phases; TCO adds broader procurement/overhead costs.' },
        { id: 'b', text: 'LCC ignores all operating and maintenance expenses, whereas TCO measures only initial factory purchase price.' },
        { id: 'c', text: 'TCO applies strictly to public bridges and dams, while LCC is restricted solely to enterprise software licenses.' },
        { id: 'd', text: 'LCC is prohibited under international asset management standards, whereas TCO is legally mandated for all plants.' },
      ],
      correctAnswer: 'a',
      explanation:
        'While often used interchangeably, **LCC** focuses on a physical asset’s defined lifecycle phases (acquire, operate, maintain, dispose), whereas **TCO** is broader in procurement/finance (supplier management, system integration, risk premiums).',
    },
    {
      id: 't4-q19',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Which international asset management standard series references **Life Cycle Costing (LCC)** as a key optimization technique?',
      options: [
        { id: 'a', text: 'ISO 9001 series' },
        { id: 'b', text: 'ISO 55000 series' },
        { id: 'c', text: 'ISO 14001 series' },
        { id: 'd', text: 'IEEE 802.11 series' },
      ],
      correctAnswer: 'b',
      explanation:
        'The lecture notes specifically highlight the **ISO 55000 series** standards for referencing LCC as a key asset lifecycle management technique.',
    },
    {
      id: 't4-q20',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'What are the **four primary cost categories** of Life Cycle Costing (LCC) (with an optional fifth category for production assets)?',
      options: [
        { id: 'a', text: 'Acquisition, Operation, Maintenance, Disposal (+ Downtime)' },
        { id: 'b', text: 'Taxation, Inflation, Depreciation, Depletion (+ Insurance)' },
        { id: 'c', text: 'Land, Labour, Capital, Entrepreneurship (+ Management)' },
        { id: 'd', text: 'Conceptual Design, Marketing, Advertising, Sales (+ Retail)' },
      ],
      correctAnswer: 'a',
      explanation:
        'LCC covers four primary cost categories — **Acquisition, Operation, Maintenance, and Disposal** — with **Downtime cost** often added as a 5th category for production equipment.',
    },
    {
      id: 't4-q21',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'According to the GET 311 LCC component table, what typical percentage of total LCC does **Acquisition cost** represent for long-lived production assets, and what about **Maintenance cost**?',
      options: [
        { id: 'a', text: 'Acquisition: $5\\text{–}15\\%$; Maintenance: $15\\text{–}40\\%$' },
        { id: 'b', text: 'Acquisition: $80\\text{–}90\\%$; Maintenance: $1\\text{–}2\\%$' },
        { id: 'c', text: 'Acquisition: $45\\text{–}55\\%$; Maintenance: $45\\text{–}55\\%$' },
        { id: 'd', text: 'Acquisition: $0\\text{–}5\\%$; Maintenance: $75\\text{–}90\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        'For long-lived production assets, **Acquisition cost** is often only **$5\\text{–}15\\%$** of total LCC, while **Maintenance cost** typically accounts for **$15\\text{–}40\\%$** (and operating/energy cost is often the largest single category for energy-intensive assets).',
    },
    {
      id: 't4-q22',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'Which single variable within the LCC framework can be directly controlled by engineering teams during asset operation to substantially lower total life cycle cost?',
      options: [
        { id: 'a', text: 'Original historical purchase price' },
        { id: 'b', text: 'Maintenance strategy' },
        { id: 'c', text: 'National consumer inflation rate' },
        { id: 'd', text: 'Unrecoverable past sunk costs' },
      ],
      correctAnswer: 'b',
      explanation:
        'The lecture notes highlight that **maintenance approach** is the single controllable variable in LCC — the same asset maintained differently (e.g., predictive maintenance) yields substantially different total LCC.',
    },
    {
      id: 't4-q23',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'In a **Repair-versus-Replace** decision using LCC, when is replacing an aging asset economically justified?',
      options: [
        { id: 'a', text: 'Whenever the asset reaches the midpoint of its rated physical service life.' },
        { id: 'b', text: 'When continued operation LCC exceeds replacement LCC.' },
        { id: 'c', text: 'Whenever the new machine’s purchase price exceeds the original purchase price.' },
        { id: 'd', text: 'Only after the aging machine experiences a complete catastrophic breakdown.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Replacement is economically justified **when the LCC of continuing to operate/repair the existing asset exceeds the LCC of replacing it** from the same point forward.',
    },
    {
      id: 't4-q24',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'In the GET 311 worked LCC example (20-year metal drilling machines): Machine A has Acquisition $\\text{₦}18,000$, Energy $\\text{₦}62,000$, Scheduled Maint $\\text{₦}24,000$, Unplanned Repairs $\\text{₦}18,000$, Downtime $\\text{₦}22,000$, Disposal $\\text{₦}2,000$. Machine B has Acquisition $\\text{₦}28,000$, Energy $\\text{₦}48,000$, Scheduled Maint $\\text{₦}14,000$, Unplanned Repairs $\\text{₦}6,000$, Downtime $\\text{₦}7,000$, Disposal $\\text{₦}2,000$. What are the total LCCs and which machine wins?',
      options: [
        { id: 'a', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}105,000$; Machine B' },
        { id: 'b', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}105,000$; Machine A' },
        { id: 'c', text: '$LCC_A = \\text{₦}124,000$, $LCC_B = \\text{₦}98,000$; Machine B' },
        { id: 'd', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}115,000$; Machine B' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$LCC_A = 18,000 + 62,000 + 24,000 + 18,000 + 22,000 + 2,000 = \\text{₦}146,000$$ $$LCC_B = 28,000 + 48,000 + 14,000 + 6,000 + 7,000 + 2,000 = \\text{₦}105,000$$ Even though Machine B costs ₦10,000 more upfront, it saves $\\text{₦}146,000 - \\text{₦}105,000 = \\text{₦}41,000$ over 20 years.',
    },
    {
      id: 't4-q25',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'calculation',
      question:
        'In the worked LCC example above ($LCC_A = \\text{₦}146,000$, Acquisition cost of A $= \\text{₦}18,000$), approximately what percentage of Machine A’s total 20-year LCC is its purchase/acquisition price?',
      options: [
        { id: 'a', text: '$12.3\\%$' },
        { id: 'b', text: '$26.7\\%$' },
        { id: 'c', text: '$42.5\\%$' },
        { id: 'd', text: '$15.8\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\frac{\\text{₦}18,000}{\\text{₦}146,000} \\times 100\\% = 12.33\\% \\approx 12\\%$$ This demonstrates why choosing equipment on purchase price alone can be very costly.',
    },
    {
      id: 't4-q26',
      topicId: 'engineering-decisions-lcc',
      difficulty: 'conceptual',
      question:
        'In LCC disposal cost estimation, how does a **positive salvage value** affect the net disposal cost?',
      options: [
        { id: 'a', text: 'It doubles the total decommissioning and remediation cost.' },
        { id: 'b', text: 'It offsets (reduces) disposal cost.' },
        { id: 'c', text: 'It has zero impact on total life cycle cost calculations.' },
        { id: 'd', text: 'It is added directly to the upfront acquisition cost.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Disposal costs include decommissioning labour, environmental compliance, and site remediation, and are **offset (reduced) by salvage value** if positive.',
    },
  ],
};
