import { PublicQuizTopic } from '@/types/public-quiz';

export const topic5BigDataCloud: PublicQuizTopic = {
  id: 'big-data-cloud-computing',
  title: 'Big Data Analytics & Cloud Computing',
  shortTitle: 'Big Data & Cloud',
  description:
    'The 5 Vs of Big Data, structured vs. unstructured data, the 4 types of analytics, cloud essential characteristics, IaaS/PaaS/SaaS, deployment models, data lakes, and digital twins.',
  icon: 'BookOpen',
  accent: 'violet',
  questions: [
    {
      id: 'g305-t5-q1',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'Wearable ECG sensor readings are corrupted by motion artefacts and drifting baselines. Which of the **5 Vs of Big Data** is directly affected?',
      options: [
        { id: 'a', text: 'Volume' },
        { id: 'b', text: 'Velocity' },
        { id: 'c', text: 'Veracity' },
        { id: 'd', text: 'Variety' },
      ],
      correctAnswer: 'c',
      explanation:
        '**Veracity** refers to data quality and trustworthiness (handling noise, artefacts, missing values, and sensor drift).',
    },
    {
      id: 'g305-t5-q2',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'Continuous live streaming of ECG waveforms or high-frequency bearing vibration signals exemplifies which Big Data V?',
      options: [
        { id: 'a', text: 'Velocity' },
        { id: 'b', text: 'Veracity' },
        { id: 'c', text: 'Value' },
        { id: 'd', text: 'Variety' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Velocity** is the high speed at which data are generated, streamed, and processed.',
    },
    {
      id: 'g305-t5-q3',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'How are **structured**, **semi-structured**, and **unstructured** engineering data exemplified in the GET 305 notes?',
      options: [
        { id: 'a', text: 'Spreadsheet tables, server log files, and inspection images/video respectively' },
        { id: 'b', text: 'Inspection video, spreadsheet tables, and raw binary sensor logs respectively' },
        { id: 'c', text: 'Only numeric sensor readings can ever be stored in cloud data lakes' },
        { id: 'd', text: 'Structured and unstructured data follow the exact same fixed relational schema' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Structured** = neat tables (temperature spreadsheets); **Semi-structured** = partial organization without fixed tables (log files); **Unstructured** = no predefined format (images, video, free text).',
    },
    {
      id: 'g305-t5-q4',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'A weekly dashboard report summarizes last month’s average pump vibration and temperature levels ("What happened?"). Which type of analytics is this?',
      options: [
        { id: 'a', text: 'Descriptive analytics' },
        { id: 'b', text: 'Diagnostic analytics' },
        { id: 'c', text: 'Predictive analytics' },
        { id: 'd', text: 'Prescriptive analytics' },
      ],
      correctAnswer: 'a',
      explanation:
        '**Descriptive analytics** answers *"What happened?"* using summaries, averages, charts, and dashboards.',
    },
    {
      id: 'g305-t5-q5',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'Using correlation, regression, and root-cause drill-down to investigate **why** a chemical batch failed ("Why did it happen?") is classified as:',
      options: [
        { id: 'a', text: 'Descriptive analytics' },
        { id: 'b', text: 'Diagnostic analytics' },
        { id: 'c', text: 'Predictive analytics' },
        { id: 'd', text: 'Prescriptive analytics' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Diagnostic analytics** answers *"Why did it happen?"* using drill-down, correlation, regression, and root-cause analysis.',
    },
    {
      id: 'g305-t5-q6',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'Estimating the remaining useful life of a bearing before failure is **Predictive** analytics; automatically recommending when to schedule maintenance ("What should be done?") is:',
      options: [
        { id: 'a', text: 'Descriptive analytics' },
        { id: 'b', text: 'Diagnostic analytics' },
        { id: 'c', text: 'Prescriptive analytics' },
        { id: 'd', text: 'Exploratory analytics' },
      ],
      correctAnswer: 'c',
      explanation:
        '**Prescriptive analytics** answers *"What should be done?"* via optimization, simulation, and actionable recommendations.',
    },
    {
      id: 'g305-t5-q7',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'A plant wants ready-to-use monitoring dashboard software for its operators over the web without managing servers or writing code. Which cloud service model fits?',
      options: [
        { id: 'a', text: 'IaaS (Infrastructure as a Service)' },
        { id: 'b', text: 'PaaS (Platform as a Service)' },
        { id: 'c', text: 'SaaS (Software as a Service)' },
        { id: 'd', text: 'On-premises bare metal' },
      ],
      correctAnswer: 'c',
      explanation:
        '**SaaS** delivers ready-to-use applications (like clinical or plant dashboards). **PaaS** provides dev/ML platforms; **IaaS** provides raw virtual machines and storage.',
    },
    {
      id: 'g305-t5-q8',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'In the biomedical ECG cloud architecture, which service model provides the machine-learning tools for building and deploying the arrhythmia classification model?',
      options: [
        { id: 'a', text: 'IaaS (virtual machines and raw storage)' },
        { id: 'b', text: 'PaaS (development and ML tools)' },
        { id: 'c', text: 'SaaS (end-user clinical dashboard)' },
        { id: 'd', text: 'Community cloud networking only' },
      ],
      correctAnswer: 'b',
      explanation:
        '**PaaS** supplies the platform and ML tools to build and deploy models (like arrhythmia classification), sitting between IaaS (storage/VMs) and SaaS (dashboards).',
    },
    {
      id: 'g305-t5-q9',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'Which cloud characteristic allows an engineering team to temporarily scale up servers while training a predictive-maintenance model and scale back down afterward?',
      options: [
        { id: 'a', text: 'Broad network access' },
        { id: 'b', text: 'Rapid elasticity' },
        { id: 'c', text: 'Measured service' },
        { id: 'd', text: 'On-demand self-service' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Rapid elasticity** lets computing resources scale up or down quickly as demand spikes or drops, while **measured service** bills only for actual usage.',
    },
    {
      id: 'g305-t5-q10',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'A cloud environment shared exclusively by a group of universities or hospitals with common compliance needs is called a:',
      options: [
        { id: 'a', text: 'Public cloud' },
        { id: 'b', text: 'Private cloud' },
        { id: 'c', text: 'Community cloud' },
        { id: 'd', text: 'Hybrid cloud' },
      ],
      correctAnswer: 'c',
      explanation:
        'A **Community cloud** is shared by several organizations with common needs (e.g., universities or hospitals). **Hybrid** combines two or more deployment models.',
    },
    {
      id: 'g305-t5-q11',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'What is a **Digital Twin** in cloud-enabled civil and mechanical engineering?',
      options: [
        { id: 'a', text: 'A backup physical pump installed in parallel with the primary pump' },
        { id: 'b', text: 'A virtual computer model of a physical asset kept updated with live sensor data' },
        { id: 'c', text: 'Two identical relational tables stored in separate private data centres' },
        { id: 'd', text: 'A pair of redundant wireless routers streaming bridge strain readings' },
      ],
      correctAnswer: 'b',
      explanation:
        'A **digital twin** is a virtual model of a physical asset (bridge, turbine, pump) continuously updated with live sensor data for simulation and predictive maintenance.',
    },
    {
      id: 'g305-t5-q12',
      topicId: 'big-data-cloud-computing',
      difficulty: 'conceptual',
      question:
        'What is a **Cloud Data Lake** as used in bridge and plant sensor monitoring?',
      options: [
        { id: 'a', text: 'A central store keeping large amounts of raw data in its original format' },
        { id: 'b', text: 'A small spreadsheet limited to cleaned summary averages and charts' },
        { id: 'c', text: 'A cooling reservoir built beside on-premises university server rooms' },
        { id: 'd', text: 'A billing dashboard that meters hourly virtual-machine usage' },
      ],
      correctAnswer: 'a',
      explanation:
        'A **data lake** is a central cloud repository that stores massive volumes of raw structured, semi-structured, and unstructured sensor data in its original format.',
    },
  ],
};
