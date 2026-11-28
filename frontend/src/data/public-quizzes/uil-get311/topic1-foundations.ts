import { PublicQuizTopic } from '@/types/public-quiz';

export const topic1Foundations: PublicQuizTopic = {
  id: 'foundations-demand-supply',
  title: 'Foundations, Demand, Supply & Production',
  shortTitle: 'Foundations & Demand',
  description:
    'Core definitions of Engineering, Science, Technology, Economics, goods & services, demand/supply laws, abnormal demand, factors of production, and engineering skills.',
  icon: 'Scale',
  accent: 'gold',
  questions: [
    {
      id: 't1-q1',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'According to the UIL-GET 311 lecture notes, how is the relationship between engineering and technology best described?',
      options: [
        { id: 'a', text: 'Engineering is the foundation of technology, and technology is its outcome.' },
        { id: 'b', text: 'Technology is the foundation of science, while engineering only manages finished goods and logistics.' },
        { id: 'c', text: 'Engineering and technology are independent fields that never build upon each other in practice.' },
        { id: 'd', text: 'Technology precedes both science and engineering and replaces engineering design in industry.' },
      ],
      correctAnswer: 'a',
      explanation:
        'Technology applies scientific knowledge and builds on existing engineering solutions; therefore, **engineering is the foundation of technology** and technology is the outcome of successful engineering activities.',
    },
    {
      id: 't1-q2',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'In economics, the classic definition describes it as a social science studying human behaviour as a relationship between "ends" and "scarce means" which have alternative uses. What do "ends" refer to?',
      options: [
        { id: 'a', text: 'Natural resources, industrial raw materials, and capital machinery used in production' },
        { id: 'b', text: 'Human wants (desires) and needs (survival necessities)' },
        { id: 'c', text: 'Government fiscal spending, central bank monetary tools, and national budgets' },
        { id: 'd', text: 'Final decommissioning and disposal costs incurred at the end of an asset life' },
      ],
      correctAnswer: 'b',
      explanation:
        'In the definition of economics, **ends** represent human wants (desires/luxuries one can survive without) and needs (necessities for survival), while **scarce means** are limited resources.',
    },
    {
      id: 't1-q3',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which branch of economics focuses on the economic behaviour of individuals, households, and individual companies, including wage setting and demand in a single market?',
      options: [
        { id: 'a', text: 'Macroeconomics' },
        { id: 'b', text: 'Microeconomics' },
        { id: 'c', text: 'Development economics' },
        { id: 'd', text: 'Monetary economics' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Microeconomics** operates on a smaller, specific scale — examining consumers, households, individual markets, and hiring/wage decisions of individual firms.',
    },
    {
      id: 't1-q4',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which of the following falls squarely within the scope of **Macroeconomics**?',
      options: [
        { id: 'a', text: 'Pricing strategy and daily bread output of a single neighborhood bakery in Ilorin' },
        { id: 'b', text: 'Hiring decisions and monthly salary negotiation of one private civil engineering firm' },
        { id: 'c', text: 'Fiscal policy, nationwide inflation, unemployment, and global trade' },
        { id: 'd', text: 'A 300-level engineering student deciding between buying a textbook or a scientific calculator' },
      ],
      correctAnswer: 'c',
      explanation:
        '**Macroeconomics** takes a wide national, regional, or global view — covering fiscal policy, nationwide economic growth, inflation, unemployment, and globalisation.',
    },
    {
      id: 't1-q5',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'How does **Fiscal Policy** differ from **Monetary Policy**?',
      options: [
        { id: 'a', text: 'Fiscal policy is directed by the Central Bank to control money supply; monetary policy is set by private commercial banks to fix loan rates.' },
        { id: 'b', text: 'Fiscal policy covers government tax, spending, and budgets; monetary policy covers Central Bank control of money and credit.' },
        { id: 'c', text: 'Fiscal policy regulates foreign exchange rates and import tariffs only; monetary policy sets corporate income tax and personal tax brackets.' },
        { id: 'd', text: 'Both policies are administered simultaneously by the Ministry of Finance and serve the exact same regulatory function in an economy.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Fiscal policy** refers to government decisions on taxation, spending, and budgeting. **Monetary policy** refers to Central Bank activities aimed at influencing the quantity of money and credit in the economy.',
    },
    {
      id: 't1-q6',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Items such as consumable foods, ready-made clothes, medications, and houses that satisfy human needs directly are classified as:',
      options: [
        { id: 'a', text: 'Producer goods' },
        { id: 'b', text: 'Consumer goods' },
        { id: 'c', text: 'Comparative goods' },
        { id: 'd', text: 'Giffen goods' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Consumer goods or services** satisfy human needs directly, whereas **producer goods** (machinery, raw materials, tools) satisfy needs indirectly by aiding the production of other goods.',
    },
    {
      id: 't1-q7',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Hiring an external specialist to train your firm’s engineering staff on a required technical skill is an example of a:',
      options: [
        { id: 'a', text: 'Consumer service' },
        { id: 'b', text: 'Producer service' },
        { id: 'c', text: 'Veblen service' },
        { id: 'd', text: 'Competitive good' },
      ],
      correctAnswer: 'b',
      explanation:
        'External training hired to build internal production capability satisfies end-user needs indirectly as part of producing other goods/services — making it a **producer service**.',
    },
    {
      id: 't1-q8',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'When making building blocks, purchasing sand automatically requires purchasing cement. Sand and cement are therefore:',
      options: [
        { id: 'a', text: 'Competitive goods (substitutes)' },
        { id: 'b', text: 'Complementary goods' },
        { id: 'c', text: 'Comparative advantage goods' },
        { id: 'd', text: 'Inferior Giffen goods' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Complementary goods or services** are mutually inclusive: an increase in demand for one automatically increases demand for the other (e.g., sand and cement for blocks).',
    },
    {
      id: 't1-q9',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Unilorin bottled water and KWASU bottled water (or Peak milk and Three Crowns milk) serve the same purpose so one can be substituted for the other. They are called:',
      options: [
        { id: 'a', text: 'Complementary goods' },
        { id: 'b', text: 'Producer goods' },
        { id: 'c', text: 'Competitive goods' },
        { id: 'd', text: 'Veblen goods' },
      ],
      correctAnswer: 'c',
      explanation:
        '**Competitive goods or services** serve the same purpose, meaning one can be dropped in favour of a similar alternative.',
    },
    {
      id: 't1-q10',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Specialized goods or services that an individual, firm, or country can produce at a relatively lower opportunity cost are known as:',
      options: [
        { id: 'a', text: 'Comparative goods' },
        { id: 'b', text: 'Complementary goods or services' },
        { id: 'c', text: 'Direct consumer goods or services' },
        { id: 'd', text: 'Fiduciary exchange goods' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Comparative goods or services** are specialized outputs an entity can produce or render at a relatively lower opportunity cost.',
    },
    {
      id: 't1-q11',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'How are **Utility** and **Value** distinguished in Engineering Economics?',
      options: [
        { id: 'a', text: 'Utility is the monetary price in Naira on the open market; value is the physical durability and weight of the manufactured product.' },
        { id: 'b', text: 'Utility is the power to satisfy human needs; value is the appraisal of that utility.' },
        { id: 'c', text: 'Value is the power of a product to satisfy human wants; utility is the government tax and markup applied during distribution.' },
        { id: 'd', text: 'Utility applies exclusively to intangible services, whereas value applies only to physical capital equipment and real estate.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Utility** is the power of a good or service to satisfy human needs or wants, while **Value** is the appraisal or measure of the worth of that utility.',
    },
    {
      id: 't1-q12',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Because human needs and wants are unlimited while resources are scarce, individuals use a **scale of preference** and make choices based on:',
      options: [
        { id: 'a', text: 'Unrecoverable sunk cost from past budgets' },
        { id: 'b', text: 'Opportunity cost' },
        { id: 'c', text: 'Estimated end-of-life salvage value' },
        { id: 'd', text: 'Annual straight-line depreciation rate' },
      ],
      correctAnswer: 'b',
      explanation:
        'The **Concept of Choice** relies on ranking priorities via a scale of preference and evaluating the **opportunity cost** — the value of the next best alternative forgone.',
    },
    {
      id: 't1-q13',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which statement accurately expresses the **conventional Law of Demand**?',
      options: [
        { id: 'a', text: 'The higher the market price of a commodity, the higher the quantity consumers are willing to buy.' },
        { id: 'b', text: 'Higher price leads to lower quantity demanded, and vice versa.' },
        { id: 'c', text: 'Market price changes have no measurable effect on the quantity consumers are willing and able to buy.' },
        { id: 'd', text: 'Quantity demanded changes only when the government alters personal income tax or VAT rates.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Under the normal Law of Demand, price and quantity demanded move inversely: **higher price leads to lower demand**, and lower price leads to higher demand.',
    },
    {
      id: 't1-q14',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'What occurs at **Market Equilibrium** on a Demand and Supply curve?',
      options: [
        { id: 'a', text: 'Consumer demand permanently exceeds producer supply, causing continuous cost-push price inflation across markets.' },
        { id: 'b', text: 'Producer supply exceeds consumer demand, forcing engineering firms to shut down and liquidate machinery.' },
        { id: 'c', text: 'Demand equals supply and price remains stable without internal pressure to change.' },
        { id: 'd', text: 'Market price falls to zero because goods become abundant enough to satisfy all human wants freely.' },
      ],
      correctAnswer: 'c',
      explanation:
        'At **market equilibrium**, quantity demanded equals quantity supplied; price is stable and only external factors can shift demand or supply.',
    },
    {
      id: 't1-q15',
      topicId: 'foundations-demand-supply',
      difficulty: 'calculation',
      question:
        'Suppose the demand function for an engineering component is $Q_d = 500 - 4P$ and the supply function is $Q_s = 100 + 6P$ (where $P$ is price in ₦). What is the equilibrium price $P^*$ and equilibrium quantity $Q^*$?',
      options: [
        { id: 'a', text: '$P^* = \\text{₦}40$, $Q^* = 340$' },
        { id: 'b', text: '$P^* = \\text{₦}50$, $Q^* = 300$' },
        { id: 'c', text: '$P^* = \\text{₦}60$, $Q^* = 260$' },
        { id: 'd', text: '$P^* = \\text{₦}40$, $Q^* = 400$' },
      ],
      correctAnswer: 'a',
      explanation:
        'At equilibrium, $Q_d = Q_s$: $$500 - 4P = 100 + 6P \\implies 400 = 10P \\implies P^* = \\text{₦}40$$ Substituting back: $Q^* = 500 - 4(40) = 500 - 160 = 340$ units.',
    },
    {
      id: 't1-q16',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'An **Abnormal Demand Curve** violates the conventional law of demand because:',
      options: [
        { id: 'a', text: 'Higher prices lead to higher quantity demanded.' },
        { id: 'b', text: 'Producer supply becomes completely vertical regardless of cost.' },
        { id: 'c', text: 'Consumers stop purchasing essential goods whenever prices fall.' },
        { id: 'd', text: 'Government regulators fix the retail price permanently below equilibrium.' },
      ],
      correctAnswer: 'a',
      explanation:
        'An **abnormal demand curve** slopes upward (violating the conventional law of demand), meaning **higher prices attract higher demand**.',
    },
    {
      id: 't1-q17',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Panic buying of fuel or food items even at rising prices because consumers expect severe shortages soon is an example of which cause of abnormal demand?',
      options: [
        { id: 'a', text: 'Quality perception' },
        { id: 'b', text: 'Anticipatory scarcity' },
        { id: 'c', text: 'Veblen prestige effect' },
        { id: 'd', text: 'Ignorance of true cost' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Anticipatory scarcity** (panic buying) drives consumers to buy more despite high prices to avoid even higher prices when scarcity hits.',
    },
    {
      id: 't1-q18',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Luxury jewelry, latest-year branded gadgets, and estates in exclusive districts that wealthy buyers demand more of as prices rise to showcase status are called:',
      options: [
        { id: 'a', text: 'Giffen inferior goods' },
        { id: 'b', text: 'Veblen goods' },
        { id: 'c', text: 'Complementary goods' },
        { id: 'd', text: 'Capital producer goods' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Veblen (prestige) goods** showcase high social status; higher prices increase their desirability among affluent consumers.',
    },
    {
      id: 't1-q19',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Essential staple items for low-income earners (such as garri or basic remote housing) that lack cheaper substitutes and continue to be bought even as prices climb are called:',
      options: [
        { id: 'a', text: 'Veblen goods' },
        { id: 'b', text: 'Giffen goods' },
        { id: 'c', text: 'Luxury goods' },
        { id: 'd', text: 'Competitive goods' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Giffen goods** are extremely inferior yet essential goods for low-income households with no cheaper substitutes; rising prices force households to keep buying them.',
    },
    {
      id: 't1-q20',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'When two identical-quality products exist — one made locally in Nigeria at a lower price and one imported from the UK at a higher price — consumers preferring the costlier UK one illustrates which cause of abnormal demand?',
      options: [
        { id: 'a', text: 'Quality perception' },
        { id: 'b', text: 'Anticipatory scarcity' },
        { id: 'c', text: 'Giffen staple effect' },
        { id: 'd', text: 'Diminishing marginal utility' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Quality perception** occurs when consumers equate a higher price (or foreign origin) with superior quality, leading to higher demand at higher prices.',
    },
    {
      id: 't1-q21',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which of the following correctly lists the four classical **Factors of Production**?',
      options: [
        { id: 'a', text: 'Land, Labour, Capital, and Entrepreneurship' },
        { id: 'b', text: 'Money, Machines, Markets, and Management' },
        { id: 'c', text: 'Demand, Supply, Inflation, and Taxation' },
        { id: 'd', text: 'Utility, Value, Equilibrium Price, and Profit' },
      ],
      correctAnswer: 'a',
      explanation:
        'The four factors of production are **Land** (natural resources), **Labour** (human effort), **Capital** (monetary and non-monetary production assets), and **Entrepreneurship**.',
    },
    {
      id: 't1-q22',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'In the UIL-GET 311 classification of labour, mechanics, electricians, plumbers, bricklayers, and drivers fall under:',
      options: [
        { id: 'a', text: 'Unskilled labour' },
        { id: 'b', text: 'Semi-skilled labour' },
        { id: 'c', text: 'Skilled labour' },
        { id: 'd', text: 'Professional labour' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Semi-skilled labour** requires some training or practical experience (often informal/non-intensive), such as mechanics, electricians, plumbers, bricklayers, tailors, and drivers.',
    },
    {
      id: 't1-q23',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'According to the lecture notes, how do **Graduate Engineers** compare to **COREN Registered Engineers** in the labour hierarchy?',
      options: [
        { id: 'a', text: 'Graduate Engineers are semi-skilled labour; COREN Registered Engineers are skilled labour.' },
        { id: 'b', text: 'Graduate Engineers are skilled labour; COREN Registered Engineers are professional labour.' },
        { id: 'c', text: 'Both groups remain classified as unskilled labour until they establish their own consultancy.' },
        { id: 'd', text: 'Graduate Engineers are professional labour; COREN Registered Engineers are entrepreneurs.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Graduates of accredited university programmes (graduate engineers, lawyers, doctors) are **skilled labour**, whereas licensed/chartered practitioners (e.g., **COREN Registered Engineers**, Chartered Accountants, Barristers) are **professional labour**.',
    },
    {
      id: 't1-q24',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which statement best summarizes the lecture note’s takeaway on **Hard Skills vs. Soft Skills** for engineers?',
      options: [
        { id: 'a', text: 'Only technical hard skills determine hiring, promotion, and long-term survival in engineering workplaces.' },
        { id: 'b', text: 'Strong soft skills completely replace the need for formal technical engineering training and calculations.' },
        { id: 'c', text: 'Hard skills get you hired; soft skills keep you relevant and advance your career.' },
        { id: 'd', text: 'Soft skills are acquired exclusively through accredited university laboratory practicals and exams.' },
      ],
      correctAnswer: 'c',
      explanation:
        'Engineers need **both hard and soft skills**: hard skills open doors and enable technical execution, while soft skills (teamwork, time management, emotional intelligence, communication, ethics) keep you relevant and advance your career.',
    },
    {
      id: 't1-q25',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which of the following is NOT one of the **5 Ms** of production activities highlighted in the notes?',
      options: [
        { id: 'a', text: 'Man' },
        { id: 'b', text: 'Machines' },
        { id: 'c', text: 'Methods' },
        { id: 'd', text: 'Monopolies' },
      ],
      correctAnswer: 'd',
      explanation:
        'The **5 Ms** of production are **Man, Money, Materials, Machines, and Methods**.',
    },
    {
      id: 't1-q26',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'Which set lists the five key characteristics of entrepreneurs outlined in the GET 311 notes?',
      options: [
        { id: 'a', text: 'Innovation, Risk-taking, Problem-solving, Resilience, and Vision' },
        { id: 'b', text: 'Strict Compliance, Caution, Routine, Isolation, and Government Subsidy' },
        { id: 'c', text: 'Taxation, Inflation, Depreciation, Depletion, and Capital Amortization' },
        { id: 'd', text: 'Simplicity, Convenience, Certainty, Equity, and Fiscal Stability' },
      ],
      correctAnswer: 'a',
      explanation:
        'Entrepreneurs are characterized by **Innovation, Risk-taking (well-calculated risk), Problem-solving, Resilience, and Vision**.',
    },
    {
      id: 't1-q27',
      topicId: 'foundations-demand-supply',
      difficulty: 'conceptual',
      question:
        'What is **Engineering Economics**?',
      options: [
        { id: 'a', text: 'The analysis of mechanical stress and structural failure in materials without considering project cost.' },
        { id: 'b', text: 'Applying economic principles to evaluate engineering alternatives for decision-making.' },
        { id: 'c', text: 'The drafting of national fiscal tax legislation and monetary policy by government civil servants.' },
        { id: 'd', text: 'The exclusive study of stock market trading, treasury bills, and commercial banking operations.' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Engineering Economics** applies economic principles, theories, and quantitative indices to evaluate engineering alternatives for intelligent decision-making.',
    },
    {
      id: 't1-q28',
      topicId: 'foundations-demand-supply',
      difficulty: 'calculation',
      question:
        'A workshop has ₦400,000 to invest in either Project X (expected net profit ₦95,000) or Project Y (expected net profit ₦78,000), but not both. If the workshop chooses Project X, what is the **opportunity cost** of this decision?',
      options: [
        { id: 'a', text: '₦17,000' },
        { id: 'b', text: '₦78,000' },
        { id: 'c', text: '₦95,000' },
        { id: 'd', text: '₦400,000' },
      ],
      correctAnswer: 'b',
      explanation:
        'Opportunity cost is the value of the **next best alternative forgone**. By selecting Project X, the workshop gives up Project Y’s expected net profit of **₦78,000**.',
    },
  ],
};
