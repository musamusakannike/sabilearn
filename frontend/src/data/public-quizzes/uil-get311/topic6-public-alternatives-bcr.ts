import { PublicQuizTopic } from '@/types/public-quiz';

export const topic6PublicAlternativesBcr: PublicQuizTopic = {
  id: 'public-alternatives-bcr',
  title: 'Public Alternatives, Benefit-Cost Ratio & Exam Mix',
  shortTitle: 'Public Projects & BCR',
  description:
    'Evaluation of public projects via Benefit-Cost (BC) Ratio, gradient fuel-savings bridge problem, hydroelectric river basin problem, and integrated GET 311 exam calculations.',
  icon: 'TrendingUp',
  accent: 'gold',
  questions: [
    {
      id: 't6-q1',
      topicId: 'public-alternatives-bcr',
      difficulty: 'conceptual',
      question:
        'What is the **main objective** of any **public alternative** (government/public-sector project) according to the UIL-GET 311 slides?',
      options: [
        { id: 'a', text: 'To maximize private corporate dividends.' },
        { id: 'b', text: 'To provide goods or services to the public at the minimum cost, undertaken only when equivalent benefits are at least equal to equivalent costs.' },
        { id: 'c', text: 'To eliminate all operating and maintenance expenses.' },
        { id: 'd', text: 'To avoid using time-value-of-money conversions.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Public alternatives aim to provide goods/services to the public at minimum cost, and are justified when **equivalent benefits $\\ge$ equivalent costs** ($BC \\ge 1$).',
    },
    {
      id: 't6-q2',
      topicId: 'public-alternatives-bcr',
      difficulty: 'conceptual',
      question:
        'Which expressions correctly represent the **Benefit-Cost (BC) Ratio** on Present Worth, Future Worth, and Annual Equivalent bases?',
      options: [
        { id: 'a', text: '$BC = \\dfrac{B_P}{P + C_P} = \\dfrac{B_F}{P_F + C_F} = \\dfrac{B_A}{P_A + C}$' },
        { id: 'b', text: '$BC = \\dfrac{P + C_P}{B_P}$' },
        { id: 'c', text: '$BC = B_P - (P + C_P)$' },
        { id: 'd', text: '$BC = \\dfrac{P}{B_A}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'All benefits and costs must be converted to a **common time base**: Present Worth $\\dfrac{B_P}{P + C_P}$, Future Worth $\\dfrac{B_F}{P_F + C_F}$, or Annual Worth $\\dfrac{B_A}{P_A + C}$.',
    },
    {
      id: 't6-q3',
      topicId: 'public-alternatives-bcr',
      difficulty: 'conceptual',
      question:
        'What is the decision criterion for accepting a single public project using the **Benefit-Cost (BC) Ratio**?',
      options: [
        { id: 'a', text: 'Accept if $BC \\ge 1$; cancel/reject if $BC < 1$.' },
        { id: 'b', text: 'Accept if $BC < 1$.' },
        { id: 'c', text: 'Accept only if $BC = 0$.' },
        { id: 'd', text: 'Accept if $BC > 10$.' },
      ],
      correctAnswer: 'a',
      explanation:
        'If **$BC \\ge 1$**, equivalent public benefits are at least equal to equivalent costs, so the project is justified.',
    },
    {
      id: 't6-q4',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'From the Bridge Construction worked example: initial investment $P = 4,000,000$, annual O&M cost $= 150,000$, life $n = 15\\text{ years}$, $i = 12\\%$, and $(P/A, 12\\%, 15) = 6.8109$. What is the **Total Present Worth of Costs** $(P + C_P)$?',
      options: [
        { id: 'a', text: '$5,021,635$' },
        { id: 'b', text: '$4,150,000$' },
        { id: 'c', text: '$6,250,000$' },
        { id: 'd', text: '$5,782,556$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$P + C_P = 4,000,000 + 150,000(P/A, 12\\%, 15) = 4,000,000 + 150,000(6.8109) = 4,000,000 + 1,021,635 = 5,021,635$$',
    },
    {
      id: 't6-q5',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'In the same Bridge example, Year 1 fuel savings are $A_1 = 600,000$ increasing by a uniform gradient $G = 50,000$ each year for $15\\text{ years}$ at $12\\%$. Given $(A/G, 12\\%, 15) = 4.9803$, what is the **Annual Equivalent Fuel Savings** $A$?',
      options: [
        { id: 'a', text: '$849,015$' },
        { id: 'b', text: '$650,000$' },
        { id: 'c', text: '$940,545$' },
        { id: 'd', text: '$750,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Using the arithmetic gradient conversion $A = A_1 + G(A/G, i, n)$: $$A = 600,000 + 50,000(4.9803) = 600,000 + 249,015 = 849,015$$',
    },
    {
      id: 't6-q6',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'Finishing the Bridge Construction example: Annual equivalent fuel savings $A = 849,015$, $(P/A, 12\\%, 15) = 6.8109$, and Total Present Worth of Costs $P + C_P = 5,021,635$. What are $B_P$, the **BC Ratio**, and the decision?',
      options: [
        { id: 'a', text: '$B_P = 5,782,556$, $BC = 1.1515$; project is justified ($BC > 1$).' },
        { id: 'b', text: '$B_P = 4,500,000$, $BC = 0.896$; reject project.' },
        { id: 'c', text: '$B_P = 5,782,556$, $BC = 0.868$; reject project.' },
        { id: 'd', text: '$B_P = 6,810,900$, $BC = 1.356$; project is justified.' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$B_P = 849,015 \\times 6.8109 = 5,782,556$$ $$BC = \\frac{B_P}{P + C_P} = \\frac{5,782,556}{5,021,635} = 1.1515$$ Since $BC = 1.1515 > 1$, constructing the bridge is **justified**.',
    },
    {
      id: 't6-q7',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'From the Hydroelectric River Basin worked example: annual flood control $= 3,000,000$, irrigation $= 5,000,000$, recreation $= 2,000,000$, life $= 50\\text{ years}$, $i = 12\\%$, and $(P/A, 12\\%, 50) = 8.3045$. What is the **Present Worth of Benefits ($B_P$)**?',
      options: [
        { id: 'a', text: '$83,045,000$' },
        { id: 'b', text: '$10,000,000$' },
        { id: 'c', text: '$55,086,500$' },
        { id: 'd', text: '$96,000,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Total annual benefits $= 3,000,000 + 5,000,000 + 2,000,000 = 10,000,000$. $$B_P = 10,000,000 \\times (P/A, 12\\%, 50) = 10,000,000 \\times 8.3045 = 83,045,000$$',
    },
    {
      id: 't6-q8',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'In the same Hydroelectric project: Initial cost $= 80,000,000$, annual O&M $= 3,000,000$, annual power sales (offsetting cost) $= 6,000,000$, $(P/A, 12\\%, 50) = 8.3045$. What is the **Present Worth of Net Costs** and the resulting **BC Ratio** (given $B_P = 83,045,000$)?',
      options: [
        { id: 'a', text: 'Net PW of Costs $= 55,086,500$; $BC = 1.508$ (Implement project).' },
        { id: 'b', text: 'Net PW of Costs $= 104,913,500$; $BC = 0.792$ (Reject project).' },
        { id: 'c', text: 'Net PW of Costs $= 80,000,000$; $BC = 1.038$ (Implement project).' },
        { id: 'd', text: 'Net PW of Costs $= 65,000,000$; $BC = 1.278$ (Implement project).' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{PW of Costs} = 80,000,000 + 3,000,000(8.3045) - 6,000,000(8.3045) = 80,000,000 - 24,913,500 = 55,086,500$$ $$BC = \\frac{83,045,000}{55,086,500} = 1.508 > 1$$ Thus the state government **should implement** the hydroelectric project.',
    },
    {
      id: 't6-q9',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'A municipal solar street-lighting project has equivalent annual public benefits of $\\text{₦}18,000,000$, annualized initial investment $P_A = \\text{₦}11,500,000$, and annual maintenance cost $C = \\text{₦}3,500,000$. What is its **BC Ratio**?',
      options: [
        { id: 'a', text: '$1.20$ (Justified)' },
        { id: 'b', text: '$0.83$ (Not justified)' },
        { id: 'c', text: '$1.57$ (Justified)' },
        { id: 'd', text: '$1.00$ (Indifferent)' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$BC = \\frac{B_A}{P_A + C} = \\frac{18,000,000}{11,500,000 + 3,500,000} = \\frac{18,000,000}{15,000,000} = 1.20$$ Since $1.20 \\ge 1$, the project is **justified**.',
    },
    {
      id: 't6-q10',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'A public drainage upgrade requires a present cost of $\\text{₦}50,000,000$ and present worth of O&M of $\\text{₦}12,500,000$. If the present worth of flood-damage savings is $\\text{₦}56,250,000$, what is the **BC Ratio** and decision?',
      options: [
        { id: 'a', text: '$BC = 0.90$; Cancel/reject the project ($BC < 1$).' },
        { id: 'b', text: '$BC = 1.125$; Undertake the project.' },
        { id: 'c', text: '$BC = 1.11$; Undertake the project.' },
        { id: 'd', text: '$BC = 0.80$; Cancel the project.' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$BC = \\frac{B_P}{P + C_P} = \\frac{56,250,000}{50,000,000 + 12,500,000} = \\frac{56,250,000}{62,500,000} = 0.90$$ Because $BC < 1$, the project should be **cancelled/rejected**.',
    },
    {
      id: 't6-q11',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'A pump costs $\\text{₦}300,000$, has salvage value $\\text{₦}30,000$, and useful life $9\\text{ years}$. Under the **Straight-Line Method**, what is the accumulated depreciation after $6\\text{ years}$?',
      options: [
        { id: 'a', text: '₦180,000' },
        { id: 'b', text: '₦200,000' },
        { id: 'c', text: '₦120,000' },
        { id: 'd', text: '₦270,000' },
      ],
      correctAnswer: 'a',
      explanation:
        'Annual depreciation $D = \\dfrac{300,000 - 30,000}{9} = \\text{₦}30,000/\\text{yr}$. Accumulated depreciation over $6\\text{ years} = 6 \\times 30,000 = \\text{₦}180,000$.',
    },
    {
      id: 't6-q12',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'Using the **SOYD Method** on a welding robot with $P = \\text{₦}1,100,000$, $F = \\text{₦}100,000$, and $n = 4\\text{ years}$, what is the depreciation in Year 1 ($D_1$) and Year 4 ($D_4$)?',
      options: [
        { id: 'a', text: '$D_1 = \\text{₦}400,000$, $D_4 = \\text{₦}100,000$' },
        { id: 'b', text: '$D_1 = \\text{₦}250,000$, $D_4 = \\text{₦}250,000$' },
        { id: 'c', text: '$D_1 = \\text{₦}440,000$, $D_4 = \\text{₦}110,000$' },
        { id: 'd', text: '$D_1 = \\text{₦}300,000$, $D_4 = \\text{₦}100,000$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$S = \\dfrac{4(5)}{2} = 10$, $P - F = \\text{₦}1,000,000$. $$D_1 = \\frac{4}{10}(1,000,000) = \\text{₦}400,000, \\quad D_4 = \\frac{1}{10}(1,000,000) = \\text{₦}100,000$$',
    },
    {
      id: 't6-q13',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'An equipment with first cost $\\text{₦}800,000$ is depreciated via **Declining Balance** at $K = 0.25$. What is its book value at the end of Year 3 ($B_3$)?',
      options: [
        { id: 'a', text: '₦337,500' },
        { id: 'b', text: '₦450,000' },
        { id: 'c', text: '₦200,000' },
        { id: 'd', text: '₦253,125' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$B_3 = (1 - K)^3 P = (1 - 0.25)^3 (800,000) = (0.75)^3 (800,000) = 0.421875 \\times 800,000 = \\text{₦}337,500$$',
    },
    {
      id: 't6-q14',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'An engineer invests $\\text{₦}200,000$ in a bond paying $12\\%$ **simple interest** per annum for $4\\text{ years}$. What is the total maturity value?',
      options: [
        { id: 'a', text: '₦296,000' },
        { id: 'b', text: '₦314,704' },
        { id: 'c', text: '₦248,000' },
        { id: 'd', text: '₦280,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$I = \\frac{PRT}{100} = \\frac{200,000 \\times 12 \\times 4}{100} = \\text{₦}96,000$$ $$A = P + I = \\text{₦}200,000 + \\text{₦}96,000 = \\text{₦}296,000$$',
    },
    {
      id: 't6-q15',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'What is the future value of $\\text{₦}100,000$ invested at $8\\%$ compounded annually for $3\\text{ years}$?',
      options: [
        { id: 'a', text: '₦124,000.00' },
        { id: 'b', text: '₦125,971.20' },
        { id: 'c', text: '₦126,500.00' },
        { id: 'd', text: '₦116,640.00' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$F_3 = 100,000(1.08)^3 = 100,000 \\times 1.259712 = \\text{₦}125,971.20$$',
    },
    {
      id: 't6-q16',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'A company’s annual net revenue from a new compressor is $\\text{₦}25,000$ for $4\\text{ years}$. At $i = 10\\%$, using $(P/A, 10\\%, 4) = 3.1699$, what is the maximum purchase price the company should pay today to break even ($NPV = 0$, zero salvage)?',
      options: [
        { id: 'a', text: '₦79,247.50' },
        { id: 'b', text: '₦100,000.00' },
        { id: 'c', text: '₦68,301.00' },
        { id: 'd', text: '₦85,000.00' },
      ],
      correctAnswer: 'a',
      explanation:
        'For $NPV = 0$: $$P_{\\max} = A(P/A, 10\\%, 4) = 25,000 \\times 3.1699 = \\text{₦}79,247.50$$',
    },
    {
      id: 't6-q17',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'A contractor submits an invoice of $\\text{₦}5,000,000$ for civil engineering works. If $5\\%$ Withholding Tax (WHT) is deducted at source, how much cash does the contractor receive directly?',
      options: [
        { id: 'a', text: '₦4,750,000' },
        { id: 'b', text: '₦4,500,000' },
        { id: 'c', text: '₦4,625,000' },
        { id: 'd', text: '₦5,250,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{WHT} = 0.05 \\times \\text{₦}5,000,000 = \\text{₦}250,000$$ $$\\text{Net payment} = \\text{₦}5,000,000 - \\text{₦}250,000 = \\text{₦}4,750,000$$',
    },
    {
      id: 't6-q18',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'Two pumps are evaluated over 10 years by **Life Cycle Costing (LCC)**. Pump X: Purchase $\\text{₦}50,000$, Energy $\\text{₦}140,000$, Maintenance $\\text{₦}45,000$, Downtime $\\text{₦}25,000$, Disposal $\\text{₦}5,000$. Pump Y: Purchase $\\text{₦}75,000$, Energy $\\text{₦}105,000$, Maintenance $\\text{₦}20,000$, Downtime $\\text{₦}10,000$, Disposal $\\text{₦}5,000$. How much does selecting the better pump save over 10 years?',
      options: [
        { id: 'a', text: 'Pump Y saves ₦50,000 ($LCC_Y = \\text{₦}215,000$ vs $LCC_X = \\text{₦}265,000$).' },
        { id: 'b', text: 'Pump X saves ₦25,000 because its purchase price is lower.' },
        { id: 'c', text: 'Pump Y saves ₦35,000.' },
        { id: 'd', text: 'Both pumps have identical LCC.' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$LCC_X = 50,000 + 140,000 + 45,000 + 25,000 + 5,000 = \\text{₦}265,000$$ $$LCC_Y = 75,000 + 105,000 + 20,000 + 10,000 + 5,000 = \\text{₦}215,000$$ Selecting **Pump Y** saves $\\text{₦}265,000 - \\text{₦}215,000 = \\text{₦}50,000$.',
    },
    {
      id: 't6-q19',
      topicId: 'public-alternatives-bcr',
      difficulty: 'conceptual',
      question:
        'In the Hydroelectric River Basin BC analysis, how were **annual power sales** treated in the BC ratio equation?',
      options: [
        { id: 'a', text: 'Added directly to the initial capital cost.' },
        { id: 'b', text: 'Subtracted from the Present Worth of Costs (acting as a cost-offsetting revenue).' },
        { id: 'c', text: 'Ignored completely as a sunk cost.' },
        { id: 'd', text: 'Multiplied by the depreciation rate.' },
      ],
      correctAnswer: 'b',
      explanation:
        'In the slide solution, Present Worth of Costs $= \\text{Initial Cost} + \\text{PW of O\\&M} - \\text{PW of Power Sales}$, reducing net public cost in the denominator.',
    },
    {
      id: 't6-q20',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'If the **Consumer Price Index (CPI)** increases from $200$ to $236$ in one year, what is the inflation rate, and what happens to the purchasing power of ₦100,000?',
      options: [
        { id: 'a', text: 'Inflation $= 18\\%$; purchasing power decreases.' },
        { id: 'b', text: 'Inflation $= 15.25\\%$; purchasing power increases.' },
        { id: 'c', text: 'Inflation $= 36\\%$; purchasing power stays constant.' },
        { id: 'd', text: 'Inflation $= 18\\%$; purchasing power increases.' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\text{Inflation Rate} = \\frac{236 - 200}{200} \\times 100\\% = 18\\%$$ Positive inflation always **decreases** the purchasing power of a fixed sum of money.',
    },
    {
      id: 't6-q21',
      topicId: 'public-alternatives-bcr',
      difficulty: 'calculation',
      question:
        'An earth-moving machine costs $\\text{₦}15,000,000$, has salvage value $\\text{₦}1,000,000$, and a lifetime capacity of $70,000\\text{ cubic metres}$. In Year 2 it moves $8,500\\text{ cubic metres}$. What is its Year 2 depreciation using the **Service Output Method**?',
      options: [
        { id: 'a', text: '₦1,700,000' },
        { id: 'b', text: '₦1,821,429' },
        { id: 'c', text: '₦1,500,000' },
        { id: 'd', text: '₦2,000,000' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$D_2 = \\frac{15,000,000 - 1,000,000}{70,000} \\times 8,500 = 200 \\times 8,500 = \\text{₦}1,700,000$$',
    },
    {
      id: 't6-q22',
      topicId: 'public-alternatives-bcr',
      difficulty: 'conceptual',
      question:
        'Which combination correctly matches **economic concepts** to their **GET 311 definitions**?',
      options: [
        { id: 'a', text: 'Sunk cost = past cost ignored at $t=0$; Salvage value = end-of-life net resale value; Opportunity cost = value of next best alternative forgone.' },
        { id: 'b', text: 'Sunk cost = future maintenance; Salvage value = purchase price; Opportunity cost = VAT.' },
        { id: 'c', text: 'Sunk cost = annual revenue; Salvage value = sunk cost; Opportunity cost = interest rate.' },
        { id: 'd', text: 'Sunk cost = depreciation; Salvage value = tax; Opportunity cost = inflation.' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Sunk cost** is an unrecoverable past expense ignored in cash flow analysis; **Salvage value** is the net end-of-life value; **Opportunity cost** is the value of the next best alternative forgone.',
    },
  ],
};
