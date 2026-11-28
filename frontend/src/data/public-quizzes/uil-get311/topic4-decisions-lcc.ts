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
        { id: 'a', text: 'What to produce?' },
        { id: 'b', text: 'How to produce?' },
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
        { id: 'a', text: 'EIA focuses on the biophysical environment (water, air, land, animals); SIA focuses on the human and social consequences of a planned project.' },
        { id: 'b', text: 'EIA applies only to software projects; SIA applies only to bridges.' },
        { id: 'c', text: 'SIA measures only corporate taxes; EIA measures only interest rates.' },
        { id: 'd', text: 'They cannot be combined into a single study.' },
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
        { id: 'a', text: 'Documentation' },
        { id: 'b', text: 'Problem Identification (detecting the gap between actual and desired situations)' },
        { id: 'c', text: 'Implementation' },
        { id: 'd', text: 'Review and control' },
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
        { id: 'a', text: 'A goal is the broad, long-term desired outcome; objectives break it down into measurable, short-term targets.' },
        { id: 'b', text: 'Goals are always numerical, while objectives are vague.' },
        { id: 'c', text: 'Objectives are decided after implementation.' },
        { id: 'd', text: 'There is no distinction between goals and objectives.' },
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
        { id: 'a', text: 'It eliminates the need for data analysis.' },
        { id: 'b', text: 'It aids traceability for quality control, serves as a guide for future similar decisions, supports regulatory compliance, and protects against liability.' },
        { id: 'c', text: 'It increases the depreciation rate of machines.' },
        { id: 'd', text: 'It replaces technical standards and SOPs.' },
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
        { id: 'a', text: 'Ignoring legal codes to minimize cost' },
        { id: 'b', text: 'Adherence to constraints (legal codes, environmental regulations, budget limits, timelines, design standards, SOPs)' },
        { id: 'c', text: 'Relying solely on guesswork without quantitative data' },
        { id: 'd', text: 'Avoiding all trade-offs' },
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
        { id: 'a', text: 'Annual Worth, Future Worth, Present Worth, IRR, Payback Period, Benefit-Cost Ratio, and Break-Even Analysis' },
        { id: 'b', text: 'FIFO, LIFO, Weighted Average, and Barter' },
        { id: 'c', text: 'Demand-pull, Cost-push, Hyperinflation, and CPI' },
        { id: 'd', text: 'Direct tax, Indirect tax, PAYE, and VAT' },
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
        { id: 'c', text: 'Only when initial capital equals zero' },
        { id: 'd', text: 'When sunk costs exceed salvage value' },
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
        { id: 'a', text: '$-\\text{₦}1,176.60$ (Reject project)' },
        { id: 'b', text: '$+\\text{₦}1,176.60$ (Accept project)' },
        { id: 'c', text: '$-\\text{₦}2,676.60$ (Reject project)' },
        { id: 'd', text: '$+\\text{₦}2,000.00$ (Accept project)' },
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
        { id: 'a', text: '$NAW_B = -\\text{₦}15,057.00$; select Machine B (less negative NAW / lower annual cost).' },
        { id: 'b', text: '$NAW_B = -\\text{₦}15,057.00$; select Machine A.' },
        { id: 'c', text: '$NAW_B = -\\text{₦}19,200.00$; select Machine A.' },
        { id: 'd', text: '$NAW_B = +\\text{₦}15,057.00$; select Machine B.' },
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
        { id: 'a', text: 'Because it only requires comparing one life cycle of each alternative without needing a Least Common Multiple (LCM) study period.' },
        { id: 'b', text: 'Because it ignores interest rates completely.' },
        { id: 'c', text: 'Because it automatically includes sunk costs.' },
        { id: 'd', text: 'Because it sets salvage value to zero.' },
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
        { id: 'a', text: '$+\\text{₦}3,563.60$ (Acceptable since $NPV > 0$)' },
        { id: 'b', text: '$-\\text{₦}3,563.60$ (Reject)' },
        { id: 'c', text: '$+\\text{₦}80,000.00$ (Acceptable)' },
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
        { id: 'a', text: 'The interest rate at which $NPV = 0$; accept if $IRR \\ge \\text{MARR}$.' },
        { id: 'b', text: 'The interest rate at which $NPV$ is maximized; accept if $IRR < \\text{MARR}$.' },
        { id: 'c', text: 'The ratio of salvage value to first cost; accept if $IRR > 1$.' },
        { id: 'd', text: 'The inflation rate minus tax rate; accept if positive.' },
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
        { id: 'a', text: '$4\\text{ years}$' },
        { id: 'b', text: '$5\\text{ years}$' },
        { id: 'c', text: '$6\\text{ years}$' },
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
        { id: 'a', text: 'LCC is mostly used in engineering and asset management focusing on physical asset lifecycle phases (acquire, operate, maintain, dispose); TCO is common in procurement/finance and may include broader costs like supplier management, training overhead, and risk premiums.' },
        { id: 'b', text: 'LCC ignores operating and maintenance costs, whereas TCO only measures purchase price.' },
        { id: 'c', text: 'TCO applies only to government bridges, while LCC applies only to software.' },
        { id: 'd', text: 'LCC is forbidden under ISO standards.' },
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
        { id: 'a', text: 'ISO 9001' },
        { id: 'b', text: 'ISO 55000 series' },
        { id: 'c', text: 'ISO 14001' },
        { id: 'd', text: 'IEEE 802.11' },
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
        { id: 'a', text: 'Acquisition, Operation, Maintenance, and Disposal (plus Downtime cost as a 5th category)' },
        { id: 'b', text: 'Taxation, Inflation, Depreciation, and Insurance' },
        { id: 'c', text: 'Land, Labour, Capital, and Entrepreneurship' },
        { id: 'd', text: 'Design, Marketing, Advertising, and Sales' },
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
        { id: 'c', text: 'Acquisition: $50\\%$; Maintenance: $50\\%$' },
        { id: 'd', text: 'Acquisition: $0\\%$; Maintenance: $5\\%$' },
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
        { id: 'a', text: 'Historical purchase price' },
        { id: 'b', text: 'Maintenance approach (e.g., adopting preventive/predictive maintenance)' },
        { id: 'c', text: 'National inflation rate' },
        { id: 'd', text: 'Past sunk costs' },
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
        { id: 'a', text: 'Whenever the asset reaches half of its physical life.' },
        { id: 'b', text: 'When the projected LCC of continued operation exceeds the LCC of replacement from the same point forward.' },
        { id: 'c', text: 'Whenever the replacement purchase price is higher than the original price.' },
        { id: 'd', text: 'Only when the asset suffers catastrophic failure.' },
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
        { id: 'a', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}105,000$; select Machine B (saves ₦41,000).' },
        { id: 'b', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}105,000$; select Machine A (cheaper purchase price).' },
        { id: 'c', text: '$LCC_A = \\text{₦}124,000$, $LCC_B = \\text{₦}98,000$; select Machine B.' },
        { id: 'd', text: '$LCC_A = \\text{₦}146,000$, $LCC_B = \\text{₦}115,000$; select Machine B.' },
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
        { id: 'a', text: '$12.3\\%$ (approx. $12\\%$)' },
        { id: 'b', text: '$26.7\\%$' },
        { id: 'c', text: '$42.5\\%$' },
        { id: 'd', text: '$5.0\\%$' },
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
        { id: 'a', text: 'It doubles the disposal cost.' },
        { id: 'b', text: 'It offsets (reduces) the decommissioning and disposal cost.' },
        { id: 'c', text: 'It has no effect on LCC.' },
        { id: 'd', text: 'It is added to the acquisition cost.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Disposal costs include decommissioning labour, environmental compliance, and site remediation, and are **offset (reduced) by salvage value** if positive.',
    },
  ],
};
