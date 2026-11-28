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
        { id: 'a', text: 'Engineering is the foundation of technology, and technology is the outcome of successful engineering activities.' },
        { id: 'b', text: 'Technology is the foundation of science, while engineering only manages finished products.' },
        { id: 'c', text: 'Engineering and technology are completely independent disciplines with no overlap.' },
        { id: 'd', text: 'Technology precedes science and replaces engineering design.' },
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
        { id: 'a', text: 'Natural resources and capital equipment' },
        { id: 'b', text: 'Human wants (desires/luxuries) and needs (necessities for survival)' },
        { id: 'c', text: 'Government fiscal and monetary policies' },
        { id: 'd', text: 'Final disposal costs of an engineering asset' },
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
        { id: 'a', text: 'Pricing strategy of a single bakery in Ilorin' },
        { id: 'b', text: 'Hiring decisions of one civil engineering consultancy' },
        { id: 'c', text: 'Impact of fiscal policy, nationwide inflation, unemployment, and global trading patterns' },
        { id: 'd', text: 'A student choosing between buying a textbook or a calculator' },
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
        { id: 'a', text: 'Fiscal policy is controlled by the Central Bank; monetary policy is controlled by private firms.' },
        { id: 'b', text: 'Fiscal policy covers government taxation, spending, and budgeting; monetary policy covers Central Bank actions influencing money supply and credit.' },
        { id: 'c', text: 'Fiscal policy regulates exchange rates only; monetary policy regulates company income tax.' },
        { id: 'd', text: 'Both terms mean exactly the same thing in engineering economics.' },
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
        { id: 'a', text: 'Competitive goods' },
        { id: 'b', text: 'Complementary goods' },
        { id: 'c', text: 'Comparative goods' },
        { id: 'd', text: 'Inferior goods' },
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
        { id: 'a', text: 'Comparative goods or services' },
        { id: 'b', text: 'Complementary goods or services' },
        { id: 'c', text: 'Consumer goods or services' },
        { id: 'd', text: 'Fiduciary goods' },
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
        { id: 'a', text: 'Utility is the price in Naira; value is the weight of the product.' },
        { id: 'b', text: 'Utility is the power of a good or service to satisfy human needs/wants; value is the measure or appraisal of that utility.' },
        { id: 'c', text: 'Value is the power to satisfy wants; utility is the market tax applied to it.' },
        { id: 'd', text: 'Utility applies only to services, while value applies only to physical goods.' },
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
        { id: 'a', text: 'Sunk cost' },
        { id: 'b', text: 'Opportunity cost (alternative forgone)' },
        { id: 'c', text: 'Salvage value' },
        { id: 'd', text: 'Depreciation rate' },
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
        { id: 'a', text: 'The higher the price, the higher the quantity demanded.' },
        { id: 'b', text: 'The higher the price, the lower the quantity demanded, and vice versa (all else equal).' },
        { id: 'c', text: 'Price has no effect on the quantity consumers are willing and able to buy.' },
        { id: 'd', text: 'Demand only changes when government alters tax rates.' },
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
        { id: 'a', text: 'Demand exceeds supply, causing continuous price inflation.' },
        { id: 'b', text: 'Supply exceeds demand, forcing producers to shut down.' },
        { id: 'c', text: 'Demand equals supply, the price is stable, and there is no internal pressure for price to change.' },
        { id: 'd', text: 'Price drops to zero because goods become free.' },
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
        { id: 'b', text: 'Supply becomes completely vertical.' },
        { id: 'c', text: 'Consumers stop buying goods when prices fall.' },
        { id: 'd', text: 'Government fixes the price below equilibrium.' },
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
        { id: 'c', text: 'Veblen effect' },
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
        { id: 'a', text: 'Giffen goods' },
        { id: 'b', text: 'Veblen (prestige) goods' },
        { id: 'c', text: 'Complementary goods' },
        { id: 'd', text: 'Producer goods' },
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
        { id: 'c', text: 'Giffen effect' },
        { id: 'd', text: 'Marginal utility' },
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
        { id: 'd', text: 'Utility, Value, Price, and Profit' },
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
        { id: 'a', text: 'Graduate Engineers are semi-skilled; COREN Registered Engineers are skilled.' },
        { id: 'b', text: 'Graduate Engineers are skilled labour; COREN Registered Engineers are professional labour.' },
        { id: 'c', text: 'Both are classified as unskilled labour until they own a firm.' },
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
        { id: 'a', text: 'Only hard skills matter in engineering workplaces.' },
        { id: 'b', text: 'Soft skills replace the need for technical engineering knowledge.' },
        { id: 'c', text: 'Hard skills get you hired or help start an enterprise, while soft skills keep you relevant, earn recommendations, and sustain career growth.' },
        { id: 'd', text: 'Soft skills are acquired strictly through university laboratory courses.' },
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
        { id: 'b', text: 'Compliance, Caution, Routine, Isolation, and Subsidy' },
        { id: 'c', text: 'Taxation, Inflation, Depreciation, Depletion, and Amortization' },
        { id: 'd', text: 'Simplicity, Convenience, Certainty, Equity, and Stability' },
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
        { id: 'a', text: 'The study of mechanical stress in structures without regard to cost.' },
        { id: 'b', text: 'The application of economic principles, theories, and concepts to engineering activities to evaluate alternatives and make intelligent decisions.' },
        { id: 'c', text: 'The drafting of national tax legislation by civil servants.' },
        { id: 'd', text: 'The exclusive study of stock market trading by banks.' },
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
