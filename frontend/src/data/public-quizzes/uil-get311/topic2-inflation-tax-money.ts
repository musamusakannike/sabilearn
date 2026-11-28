import { PublicQuizTopic } from '@/types/public-quiz';

export const topic2InflationTaxMoney: PublicQuizTopic = {
  id: 'inflation-taxation-money-insurance',
  title: 'Inflation, Taxation, Money & Insurance',
  shortTitle: 'Inflation, Tax & Money',
  description:
    'Inflation types & CPI, Nigerian taxation system (PITA, CIT, VAT, WHT, PAYE, exemptions), money types/functions/motives, insurance policies, and financial instruments.',
  icon: 'Landmark',
  accent: 'violet',
  questions: [
    {
      id: 't2-q1',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'In layman’s terms, what does **Inflation** do to the purchasing power of money?',
      options: [
        { id: 'a', text: 'It increases purchasing power so the same sum of money buys more goods than before.' },
        { id: 'b', text: 'It reduces purchasing power so the same money buys fewer goods.' },
        { id: 'c', text: 'It keeps purchasing power constant while automatically lowering all bank interest rates.' },
        { id: 'd', text: 'It only alters the prices of imported luxury goods while leaving local staples unchanged.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Inflation** is the general increase in the price level of goods and services over time, which **reduces the purchasing power of money**.',
    },
    {
      id: 't2-q2',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which index is commonly used to estimate the rate of inflation by measuring the percentage change in prices of goods and services over time?',
      options: [
        { id: 'a', text: 'Gross Domestic Product (GDP)' },
        { id: 'b', text: 'Consumer Price Index (CPI)' },
        { id: 'c', text: 'Internal Rate of Return (IRR)' },
        { id: 'd', text: 'Benefit-Cost Ratio (BCR)' },
      ],
      correctAnswer: 'b',
      explanation:
        'The **Consumer Price Index (CPI)** tracks the percentage change in the price level of a basket of goods and services over time to estimate inflation.',
    },
    {
      id: 't2-q3',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'calculation',
      question:
        'If the Consumer Price Index (CPI) rises from $125$ in Year 1 to $150$ in Year 2, what is the annual inflation rate?',
      options: [
        { id: 'a', text: '$16.67\\%$' },
        { id: 'b', text: '$20.00\\%$' },
        { id: 'c', text: '$25.00\\%$' },
        { id: 'd', text: '$12.50\\%$' },
      ],
      correctAnswer: 'b',
      explanation:
        'Using the CPI inflation formula: $$\\text{Inflation Rate} = \\frac{\\text{CPI}_2 - \\text{CPI}_1}{\\text{CPI}_1} \\times 100\\% = \\frac{150 - 125}{125} \\times 100\\% = \\frac{25}{125} \\times 100\\% = 20\\%$$',
    },
    {
      id: 't2-q4',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'When rising raw material, energy, and labour expenses force manufacturers to raise selling prices, this is classified as:',
      options: [
        { id: 'a', text: 'Demand-pull inflation' },
        { id: 'b', text: 'Cost-push inflation' },
        { id: 'c', text: 'Hyperinflation' },
        { id: 'd', text: 'Monetary deflation' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Cost-push inflation** arises from increases in the cost of production (inputs, wages, energy), whereas **demand-pull inflation** arises from excess demand.',
    },
    {
      id: 't2-q5',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'An extremely high and rapid rate of inflation (often exceeding $100\\%$) that can trigger economic meltdown or recession is called:',
      options: [
        { id: 'a', text: 'Creeping inflation' },
        { id: 'b', text: 'Cost-push inflation' },
        { id: 'c', text: 'Hyperinflation' },
        { id: 'd', text: 'Mild stagflation' },
      ],
      correctAnswer: 'c',
      explanation:
        '**Hyperinflation** is an extremely rapid inflation rate (which can exceed $100\\%$) capable of triggering severe economic crisis or recession.',
    },
    {
      id: 't2-q6',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Based on Nigeria’s Personal Income Tax Act (PITA) and updated regulations cited in the GET 311 notes, what is the legal age for a person to pay tax in Nigeria?',
      options: [
        { id: 'a', text: '16 years and above' },
        { id: 'b', text: '18 years and above' },
        { id: 'c', text: '21 years and above' },
        { id: 'd', text: '25 years and above' },
      ],
      correctAnswer: 'b',
      explanation:
        'Under the Personal Income Tax Act (PITA) and updated regulations in Nigeria, the legal age for paying tax is **18 years and above**.',
    },
    {
      id: 't2-q7',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'According to the UIL-GET 311 notes on Nigerian tax exemptions (2026), which small business qualifies for full company tax exemption?',
      options: [
        { id: 'a', text: 'Turnover $\\le \\text{₦}100\\text{M}$ and total assets $\\le \\text{₦}250\\text{M}$' },
        { id: 'b', text: 'Gross annual turnover $\\le \\text{₦}500\\text{ million}$ regardless of total asset value' },
        { id: 'c', text: 'Any private company employing fewer than 500 full-time staff in Nigeria' },
        { id: 'd', text: 'Foreign-owned engineering firms operating with a fixed base in Nigeria' },
      ],
      correctAnswer: 'a',
      explanation:
        'The notes state that small businesses with a **gross annual turnover of ₦100 million or less** and **total assets not exceeding ₦250 million** are fully exempt.',
    },
    {
      id: 't2-q8',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which individual income thresholds are listed under **Tax Exemption Situations** in the GET 311 notes?',
      options: [
        { id: 'a', text: 'Minimum wage ($\\le \\text{₦}70,000$/mo) and low income ($\\le \\text{₦}100,000$/mo)' },
        { id: 'b', text: 'Only workers earning $\\le \\text{₦}18,000$/month under old federal wage rules' },
        { id: 'c', text: 'All private sector employees regardless of monthly salary or annual bonuses' },
        { id: 'd', text: 'All residents earning up to $\\text{₦}500,000$/month from business or employment' },
      ],
      correctAnswer: 'a',
      explanation:
        'Workers earning the national minimum wage of **₦70,000 or less per month** and low-income earners with monthly income not exceeding **₦100,000** are listed as exempt.',
    },
    {
      id: 't2-q9',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which group was proposed for Personal Income Tax (PIT) exemption in the 2025 tax reform bill approved by the Nigerian House of Representatives?',
      options: [
        { id: 'a', text: 'Commercial bank directors and executives' },
        { id: 'b', text: 'Military personnel (Army, Navy, Air Force)' },
        { id: 'c', text: 'Multinational oil and gas refinery contractors' },
        { id: 'd', text: 'Private commercial real estate developers' },
      ],
      correctAnswer: 'b',
      explanation:
        'In 2025, the Nigerian House of Representatives approved a reform proposal to exempt **military personnel (Army, Navy, and Air Force)** from Personal Income Tax (PIT).',
    },
    {
      id: 't2-q10',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'What is the key difference between a **Direct Tax** and an **Indirect Tax**?',
      options: [
        { id: 'a', text: 'Direct tax burden stays on the payer (PIT, CIT); indirect tax burden is shifted to buyers (VAT).' },
        { id: 'b', text: 'Direct taxes are voluntary contributions paid by firms; indirect taxes are mandatory levies collected exclusively from salaried workers.' },
        { id: 'c', text: 'Direct taxes are levied solely on imported goods at ports; indirect taxes are charged on corporate profits and personal real estate.' },
        { id: 'd', text: 'Indirect taxes are always progressive across income brackets, while direct taxes are always regressive on low-income households.' },
      ],
      correctAnswer: 'a',
      explanation:
        'In a **Direct Tax** (income, corporate, wealth tax), the payer bears the burden directly. In an **Indirect Tax** (VAT, sales tax, customs/excise duties), the burden is shifted to the final consumer.',
    },
    {
      id: 't2-q11',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'According to the lecture notes, what are the standard **Company Income Tax (CIT)** and **Value Added Tax (VAT)** rates in Nigeria?',
      options: [
        { id: 'a', text: 'CIT = $20\\%$, VAT = $5.0\\%$' },
        { id: 'b', text: 'CIT = $30\\%$, VAT = $7.5\\%$' },
        { id: 'c', text: 'CIT = $15\\%$, VAT = $10.0\\%$' },
        { id: 'd', text: 'CIT = $35\\%$, VAT = $7.5\\%$' },
      ],
      correctAnswer: 'b',
      explanation:
        'The GET 311 notes specify **Company Income Tax (CIT) = 30%** on company profits and **Value Added Tax (VAT) = 7.5%** on goods and services in Nigeria.',
    },
    {
      id: 't2-q12',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'calculation',
      question:
        'An engineering contractor is awarded a consultancy contract of $\\text{₦}2,000,000$. If $10\\%$ Withholding Tax (WHT) is deducted at source, how much is remitted to the tax authority and how much is paid directly to the contractor?',
      options: [
        { id: 'a', text: '₦200,000 remitted; ₦1,800,000 paid to contractor' },
        { id: 'b', text: '₦100,000 remitted; ₦1,900,000 paid to contractor' },
        { id: 'c', text: '₦200,000 added; ₦2,200,000 paid to contractor' },
        { id: 'd', text: '₦150,000 remitted; ₦1,850,000 paid to contractor' },
      ],
      correctAnswer: 'a',
      explanation:
        'Withholding Tax (WHT) is an **advance payment** deducted at source: $$\\text{WHT} = 10\\% \\times \\text{₦}2,000,000 = \\text{₦}200,000$$ $$\\text{Net paid to contractor} = \\text{₦}2,000,000 - \\text{₦}200,000 = \\text{₦}1,800,000$$',
    },
    {
      id: 't2-q13',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'calculation',
      question:
        'An engineering firm buys testing equipment with a pre-tax price of $\\text{₦}800,000$ in Nigeria. Including $7.5\\%$ VAT, what is the total invoice amount?',
      options: [
        { id: 'a', text: '₦840,000' },
        { id: 'b', text: '₦860,000' },
        { id: 'c', text: '₦875,000' },
        { id: 'd', text: '₦880,000' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\text{VAT} = 0.075 \\times \\text{₦}800,000 = \\text{₦}60,000$$ $$\\text{Total Invoice} = \\text{₦}800,000 + \\text{₦}60,000 = \\text{₦}860,000$$',
    },
    {
      id: 't2-q14',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which statement about **Withholding Tax (WHT)** and **PAYE (Pay As You Earn)** is TRUE?',
      options: [
        { id: 'a', text: 'WHT is an extra penalty tax charged separately on top of a contractor’s full annual income tax liability.' },
        { id: 'b', text: 'WHT is an advance tax deducted at source; PAYE spreads annual PIT monthly.' },
        { id: 'c', text: 'PAYE applies exclusively to imported industrial machinery and goods cleared at Nigerian seaports.' },
        { id: 'd', text: 'WHT must always be collected and remitted by the contractor rather than by the payer of the contract.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**WHT** is not an additional tax — it is an advance payment deducted and remitted by the payer to prevent tax evasion. **PAYE** is a form of WHT that spreads annual Personal Income Tax into manageable monthly deductions.',
    },
    {
      id: 't2-q15',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'A tax system that takes a **higher percentage of income from low-income earners** than from high-income earners (such as consumption tax/VAT) is called:',
      options: [
        { id: 'a', text: 'Progressive tax' },
        { id: 'b', text: 'Regressive tax' },
        { id: 'c', text: 'Proportional tax' },
        { id: 'd', text: 'Capital gains tax' },
      ],
      correctAnswer: 'b',
      explanation:
        'In a **regressive tax** system (e.g., consumption tax), low-income earners spend a larger share of their income on the taxed items. **Progressive** increases rate with income; **Proportional** applies a flat rate to all.',
    },
    {
      id: 't2-q16',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which characteristic of a **Good Tax System** states that the cost of collecting a tax must NOT exceed the revenue generated by the tax?',
      options: [
        { id: 'a', text: 'Simplicity' },
        { id: 'b', text: 'Convenience' },
        { id: 'c', text: 'Productive' },
        { id: 'd', text: 'Flexibility' },
      ],
      correctAnswer: 'c',
      explanation:
        'A **Productive** tax system brings sufficient revenue to the government such that collection costs remain lower than the revenue collected.',
    },
    {
      id: 't2-q17',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Taxes levied on profits realized from the sale of capital assets such as stocks, bonds, or properties are called:',
      options: [
        { id: 'a', text: 'Legal Stamp Duties' },
        { id: 'b', text: 'Capital Gains Tax' },
        { id: 'c', text: 'Local Excise Duties' },
        { id: 'd', text: 'Corporate Education Tax' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Capital Gains Tax** is charged on profits from selling assets (stocks, bonds, properties). **Stamp Duties** apply to legal documents, and **Excise Duties** apply to locally produced goods.',
    },
    {
      id: 't2-q18',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Paper currency backed by government decree whose face value exceeds its material content and whose volume is regulated by government is called:',
      options: [
        { id: 'a', text: 'Commodity money' },
        { id: 'b', text: 'Fiat money' },
        { id: 'c', text: 'Fiduciary money' },
        { id: 'd', text: 'Representative money' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Fiat money** (the commonest type, e.g., paper notes) is government-backed, not tied to a physical commodity, and has a face value greater than its paper material.',
    },
    {
      id: 't2-q19',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Gold and diamonds — whose monetary value comes directly from the intrinsic material they are made of — are examples of:',
      options: [
        { id: 'a', text: 'Fiat money' },
        { id: 'b', text: 'Commodity money' },
        { id: 'c', text: 'Digital money' },
        { id: 'd', text: 'Commercial bank money' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Commodity money** derives its value directly from the physical commodity it is made of (e.g., gold, diamond).',
    },
    {
      id: 't2-q20',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Cheques and bank drafts that derive their value from a promise or trust of payment and can be converted into fiat money are classified as:',
      options: [
        { id: 'a', text: 'Fiduciary money' },
        { id: 'b', text: 'Commodity money' },
        { id: 'c', text: 'Cryptocurrency' },
        { id: 'd', text: 'Physical cash' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Fiduciary money** (e.g., cheques, bank drafts) takes its value from trust/promise of payment and can be converted into fiat money.',
    },
    {
      id: 't2-q21',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which characteristic of physical money means a ₦1,000 note can be replaced or interchanged with lower Naira denominations of equivalent total value?',
      options: [
        { id: 'a', text: 'Durability' },
        { id: 'b', text: 'Fungibility' },
        { id: 'c', text: 'Portability' },
        { id: 'd', text: 'Recognizability' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Fungibility** means a unit of money is replaceable or interchangeable with another identical unit or equivalent value (e.g., ₦1,000 replaced by two ₦500 notes).',
    },
    {
      id: 't2-q22',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Which of the following is NOT one of the three classical **Functions of Money**?',
      options: [
        { id: 'a', text: 'Store of value' },
        { id: 'b', text: 'Unit of account' },
        { id: 'c', text: 'Medium of exchange' },
        { id: 'd', text: 'Asset depreciation' },
      ],
      correctAnswer: 'd',
      explanation:
        'The three functions of money are: **Store of value**, **Unit of account**, and **Medium of exchange**.',
    },
    {
      id: 't2-q23',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Holding money as a safety net for unexpected emergencies (to avoid selling assets cheaply in a rush) represents which motive for holding money?',
      options: [
        { id: 'a', text: 'Transactional motive' },
        { id: 'b', text: 'Precautionary motive' },
        { id: 'c', text: 'Speculative motive' },
        { id: 'd', text: 'Fiscal reserve motive' },
      ],
      correctAnswer: 'b',
      explanation:
        'The **Precautionary motive** is holding money for unexpected expenses. **Transactional** is for daily payments; **Speculative** is to profit from anticipated asset price changes / short-term ROI opportunities.',
    },
    {
      id: 't2-q24',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'In an **Insurance Policy**, who are the First Party, Second Party, and Third Party respectively?',
      options: [
        { id: 'a', text: 'Insurer (company), Insured (subscriber), and Government regulator' },
        { id: 'b', text: 'Insured (subscriber), Insurer (company), and Third Party (outside claimant)' },
        { id: 'c', text: 'Insurance broker, Commercial bank lender, and Policy subscriber' },
        { id: 'd', text: 'External claimant, Legal counsel representing court, and Insurance company' },
      ],
      correctAnswer: 'b',
      explanation:
        'From the GET 311 class notes: **First Party = The Insured** (subscriber), **Second Party = The Insurer** (insurance company), and **Third Party** = an outsider entitled to file a claim against the insurer.',
    },
    {
      id: 't2-q25',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'In insurance terminology, what is a **Deductible**?',
      options: [
        { id: 'a', text: 'The regular monthly or annual fee paid by the subscriber to keep the contract active' },
        { id: 'b', text: 'The out-of-pocket share paid by the insured toward covered expenses' },
        { id: 'c', text: 'A formal legal claim or lawsuit filed against an insurer to demand loss settlement' },
        { id: 'd', text: 'The commission fee paid by an insurance firm to an intermediary managing its expenses' },
      ],
      correctAnswer: 'b',
      explanation:
        'A **Deductible** is the out-of-pocket amount the insured must pay toward a covered loss. **Premium** is the regular payment for the contract; **Claim** is the demand/suit for settlement; **Capitation** is the amount paid to an intermediary.',
    },
    {
      id: 't2-q26',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'What is **Capitation** in insurance as defined in the GET 311 class notes?',
      options: [
        { id: 'a', text: 'A moral obligation on the insured to act with reasonable caution to avoid preventable losses' },
        { id: 'b', text: 'Amount an insurer pays an intermediary to settle expenses from premiums' },
        { id: 'c', text: 'The maximum cumulative payout ceiling allowed on a life or business insurance contract' },
        { id: 'd', text: 'The mandatory withholding tax deducted by government from insurance claim settlements' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Capitation** is the amount an insurance company pays to an intermediary to settle expenses on its behalf from the total premium. A moral obligation to act with reasonable caution to avoid loss is **Duty of Care**.',
    },
    {
      id: 't2-q27',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'How do **Stock** and **Shares** differ according to the GET 311 notes?',
      options: [
        { id: 'a', text: 'Stock is ownership in a company; Shares are the units of ownership.' },
        { id: 'b', text: 'Stock is a repayable government loan instrument; Shares are non-repayable business grants.' },
        { id: 'c', text: 'Shares are short-term discounted securities; Stock is always tax-exempt municipal debt.' },
        { id: 'd', text: 'Stock represents physical warehouse inventory only; Shares represent commercial bank cheques.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Stock** represents ownership in a company, while **Shares** are the specific units of ownership in that company.',
    },
    {
      id: 't2-q28',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'How do **Loans** differ from **Grants**?',
      options: [
        { id: 'a', text: 'Loans are non-repayable government awards; Grants must be repaid periodically with compound interest.' },
        { id: 'b', text: 'Loans are repaid with interest; Grants require no repayment or interest.' },
        { id: 'c', text: 'Both loans and grants carry mandatory annual interest charges set by the Central Bank.' },
        { id: 'd', text: 'Grants are issued exclusively by commercial banks, whereas loans come only from charities.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Loans** are borrowed funds intended to be paid back with interest, whereas **Grants** are financial support provided by governments or organizations with **no repayment and no interest**.',
    },
    {
      id: 't2-q29',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'conceptual',
      question:
        'Short-term government securities issued to raise money from the public, **sold at a discount** and redeemed at their **full face value on maturity**, are called:',
      options: [
        { id: 'a', text: 'Corporate Shares' },
        { id: 'b', text: 'Treasury Bills' },
        { id: 'c', text: 'Research Grants' },
        { id: 'd', text: 'Policy Deductibles' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Treasury Bills** are short-term government securities sold at a discount and redeemed at full face value at maturity. **Bonds** are borrowing instruments paying periodic interest and returning principal at maturity.',
    },
    {
      id: 't2-q30',
      topicId: 'inflation-taxation-money-insurance',
      difficulty: 'calculation',
      question:
        'A manufacturing company in Nigeria records a taxable annual profit of $\\text{₦}45,000,000$ (with turnover above ₦100M). At the standard $30\\%$ Company Income Tax (CIT) rate, what is its CIT liability and after-tax profit?',
      options: [
        { id: 'a', text: 'CIT = ₦13,500,000; After-tax profit = ₦31,500,000' },
        { id: 'b', text: 'CIT = ₦15,000,000; After-tax profit = ₦30,000,000' },
        { id: 'c', text: 'CIT = ₦3,375,000; After-tax profit = ₦41,625,000' },
        { id: 'd', text: 'CIT = ₦12,500,000; After-tax profit = ₦32,500,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{CIT} = 0.30 \\times \\text{₦}45,000,000 = \\text{₦}13,500,000$$ $$\\text{After-Tax Profit} = \\text{₦}45,000,000 - \\text{₦}13,500,000 = \\text{₦}31,500,000$$',
    },
  ],
};
