import { PublicQuizTopic } from '@/types/public-quiz';

export const topic4RegressionCorrelation: PublicQuizTopic = {
  id: 'regression-correlation',
  title: 'Simple Linear Regression & Correlation',
  shortTitle: 'Regression & Correlation',
  description:
    'Least-squares slope & intercept estimation, fitted equations, predictions, SST/SSR/SSE decomposition, R², correlation r, residual analysis, and extrapolation limits.',
  icon: 'FileSpreadsheet',
  accent: 'orange',
  questions: [
    {
      id: 'g305-t4-q1',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'For an agronomist’s 6 tomato plots, $\\bar{x} = 325\\text{ mm}$, $\\bar{y} = 27.0\\text{ t/ha}$, $S_{xx} = 43,750$, and $S_{xy} = 1,815.0$. What are the least-squares slope $\\hat{\\beta}_1$ and intercept $\\hat{\\beta}_0$?',
      options: [
        { id: 'a', text: '$\\hat{\\beta}_1 = 0.0415$, $\\hat{\\beta}_0 = 13.52$' },
        { id: 'b', text: '$\\hat{\\beta}_1 = 0.0831$, $\\hat{\\beta}_0 = 13.52$' },
        { id: 'c', text: '$\\hat{\\beta}_1 = 0.0415$, $\\hat{\\beta}_0 = 40.48$' },
        { id: 'd', text: '$\\hat{\\beta}_1 = 24.10$, $\\hat{\\beta}_0 = 13.52$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{\\beta}_1 = \\frac{S_{xy}}{S_{xx}} = \\frac{1815.0}{43750} = 0.0415, \\quad \\hat{\\beta}_0 = \\bar{y} - \\hat{\\beta}_1\\bar{x} = 27.0 - 0.0415(325) = 13.52$$',
    },
    {
      id: 'g305-t4-q2',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'Using the fitted tomato yield equation $\\hat{y} = 13.52 + 0.0415x$ (data range $200\\text{–}450\\text{ mm}$), what is the predicted yield at $x = 375\\text{ mm}$?',
      options: [
        { id: 'a', text: '$29.08\\text{ t/ha}$' },
        { id: 'b', text: '$27.00\\text{ t/ha}$' },
        { id: 'c', text: '$31.12\\text{ t/ha}$' },
        { id: 'd', text: '$25.96\\text{ t/ha}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{y} = 13.52 + 0.0415(375) = 13.52 + 15.5625 \\approx 29.08\\text{ t/ha}$$',
    },
    {
      id: 'g305-t4-q3',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'For the worked tomato regression, $SST = 87.10$ and $SSE = 11.80$. What are $SSR$, the coefficient of determination $R^2$, and the correlation $r$ (given positive slope)?',
      options: [
        { id: 'a', text: '$SSR = 75.30$, $R^2 = 0.864$, $r = 0.930$' },
        { id: 'b', text: '$SSR = 75.30$, $R^2 = 0.136$, $r = 0.369$' },
        { id: 'c', text: '$SSR = 98.90$, $R^2 = 0.864$, $r = 0.930$' },
        { id: 'd', text: '$SSR = 75.30$, $R^2 = 0.864$, $r = -0.930$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$SSR = SST - SSE = 87.10 - 11.80 = 75.30$. $R^2 = \\dfrac{75.30}{87.10} = 0.8645 \\approx 0.864$. Since $\\hat{\\beta}_1 > 0$, $r = +\\sqrt{0.8645} \\approx 0.930$.',
    },
    {
      id: 'g305-t4-q4',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'For a dataset with $S_{xx} = 50$, $S_{xy} = 120$, $\\bar{x} = 4$, and $\\bar{y} = 30$, what is the fitted simple linear regression equation?',
      options: [
        { id: 'a', text: '$\\hat{y} = 20.4 + 2.4x$' },
        { id: 'b', text: '$\\hat{y} = 39.6 + 2.4x$' },
        { id: 'c', text: '$\\hat{y} = 28.3 + 0.42x$' },
        { id: 'd', text: '$\\hat{y} = 20.4 - 2.4x$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{\\beta}_1 = \\frac{120}{50} = 2.4, \\quad \\hat{\\beta}_0 = 30 - 2.4(4) = 30 - 9.6 = 20.4 \\implies \\hat{y} = 20.4 + 2.4x$$',
    },
    {
      id: 'g305-t4-q5',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'A food engineer fits shelf life (days) against storage temperature ($^\\circ\\text{C}$) as $\\hat{y} = 18.2 - 0.95x$. What is the predicted shelf life at $x = 4\\,^\\circ\\text{C}$?',
      options: [
        { id: 'a', text: '$14.40\\text{ days}$' },
        { id: 'b', text: '$13.45\\text{ days}$' },
        { id: 'c', text: '$22.00\\text{ days}$' },
        { id: 'd', text: '$15.35\\text{ days}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{y} = 18.2 - 0.95(4) = 18.2 - 3.8 = 14.40\\text{ days}$$',
    },
    {
      id: 'g305-t4-q6',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'In the shelf-life regression ($\\hat{y} = 18.2 - 0.95x$), $R^2 = 0.83$. What is the sample correlation coefficient $r$?',
      options: [
        { id: 'a', text: '$r = -0.911$' },
        { id: 'b', text: '$r = +0.911$' },
        { id: 'c', text: '$r = -0.689$' },
        { id: 'd', text: '$r = +0.830$' },
      ],
      correctAnswer: 'a',
      explanation:
        'In simple linear regression, $r = \\pm\\sqrt{R^2}$ with the **same sign as the slope** $\\hat{\\beta}_1 = -0.95 < 0$: $$r = -\\sqrt{0.83} \\approx -0.911$$',
    },
    {
      id: 'g305-t4-q7',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'A chemical reactor model relates product yield ($\\%$) to catalyst concentration ($\\text{wt}\\%$) by $\\hat{y} = 74.28 + 14.95x$. What is the predicted yield at $x = 1.0\\text{ wt}\\%$?',
      options: [
        { id: 'a', text: '$89.23\\%$' },
        { id: 'b', text: '$88.75\\%$' },
        { id: 'c', text: '$59.33\\%$' },
        { id: 'd', text: '$91.42\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{y} = 74.28 + 14.95(1.0) = 89.23\\%$$',
    },
    {
      id: 'g305-t4-q8',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'A metallurgy model relates steel Vickers hardness ($\\text{HV}$) to carbon content ($\\text{wt}\\%$) by $\\hat{y} = 120 + 250x$. What is the predicted hardness at $x = 0.4\\text{ wt}\\%$?',
      options: [
        { id: 'a', text: '$220\\text{ HV}$' },
        { id: 'b', text: '$170\\text{ HV}$' },
        { id: 'c', text: '$245\\text{ HV}$' },
        { id: 'd', text: '$370\\text{ HV}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\hat{y} = 120 + 250(0.4) = 120 + 100 = 220\\text{ HV}$$',
    },
    {
      id: 'g305-t4-q9',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'If $R^2 = 0.64$ and the fitted slope is **positive**, what is the correlation coefficient $r$?',
      options: [
        { id: 'a', text: '$+0.80$' },
        { id: 'b', text: '$-0.80$' },
        { id: 'c', text: '$+0.41$' },
        { id: 'd', text: '$+0.32$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Because the slope is positive, $r = +\\sqrt{R^2} = +\\sqrt{0.64} = +0.80$.',
    },
    {
      id: 'g305-t4-q10',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'At $x = 300\\text{ mm}$ in the tomato study, observed yield is $y = 27.4\\text{ t/ha}$ and fitted yield is $\\hat{y} = 25.96\\text{ t/ha}$. What is the **residual** $e_i$?',
      options: [
        { id: 'a', text: '$+1.44\\text{ t/ha}$' },
        { id: 'b', text: '$-1.44\\text{ t/ha}$' },
        { id: 'c', text: '$+2.07\\text{ t/ha}$' },
        { id: 'd', text: '$+0.95\\text{ t/ha}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'A residual is defined as observed minus fitted: $$e_i = y_i - \\hat{y}_i = 27.4 - 25.96 = +1.44\\text{ t/ha}$$',
    },
    {
      id: 'g305-t4-q11',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'Given $S_{xx} = 100$, $S_{yy} = 256$, and $S_{xy} = -128$, what is the sample correlation coefficient $r$?',
      options: [
        { id: 'a', text: '$-0.80$' },
        { id: 'b', text: '$+0.80$' },
        { id: 'c', text: '$-0.64$' },
        { id: 'd', text: '$-0.50$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$r = \\frac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}} = \\frac{-128}{\\sqrt{100 \\times 256}} = \\frac{-128}{160} = -0.80$$',
    },
    {
      id: 'g305-t4-q12',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'Using the agricultural model $\\hat{y} = 12.5 + 0.045x$ ($R^2 = 0.78$), what is the predicted marketable tomato yield at $x = 400\\text{ mm}$, and what percentage of yield variability is left **unexplained**?',
      options: [
        { id: 'a', text: '$30.5\\text{ t/ha}$; $22\\%$ unexplained' },
        { id: 'b', text: '$30.5\\text{ t/ha}$; $78\\%$ unexplained' },
        { id: 'c', text: '$18.0\\text{ t/ha}$; $22\\%$ unexplained' },
        { id: 'd', text: '$32.5\\text{ t/ha}$; $12\\%$ unexplained' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\hat{y} = 12.5 + 0.045(400) = 12.5 + 18.0 = 30.5\\text{ t/ha}$. Since $R^2 = 78\\%$ is explained, $100\\% - 78\\% = 22\\%$ is unexplained.',
    },
    {
      id: 'g305-t4-q13',
      topicId: 'regression-correlation',
      difficulty: 'calculation',
      question:
        'A fitted model is $\\hat{y} = 5 + 2x$. What is the predicted value of $y$ when $x = 10$, and what point $(\\bar{x}, \\bar{y})$ must every least-squares regression line pass through?',
      options: [
        { id: 'a', text: '$\\hat{y} = 25$; always passes through $(\\bar{x}, \\bar{y})$' },
        { id: 'b', text: '$\\hat{y} = 25$; always passes through $(0, 0)$' },
        { id: 'c', text: '$\\hat{y} = 52$; always passes through $(\\bar{x}, \\bar{y})$' },
        { id: 'd', text: '$\\hat{y} = 17$; always passes through $(1, 1)$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\hat{y} = 5 + 2(10) = 25$. Because $\\hat{\\beta}_0 = \\bar{y} - \\hat{\\beta}_1\\bar{x}$, the fitted line **always** passes through the data centroid $(\\bar{x}, \\bar{y})$.',
    },
    {
      id: 'g305-t4-q14',
      topicId: 'regression-correlation',
      difficulty: 'conceptual',
      question:
        'A plot of residuals against fitted values shows a clear **funnel shape** (spread widens as $\\hat{y}$ grows). Which linear regression assumption is violated?',
      options: [
        { id: 'a', text: 'Constant error variance (homoscedasticity)' },
        { id: 'b', text: 'Linearity of the mean response' },
        { id: 'c', text: 'Independence of time-ordered observations' },
        { id: 'd', text: 'Zero sample mean of the predictor $x$' },
      ],
      correctAnswer: 'a',
      explanation:
        'A **funnel shape** in residuals vs. fitted values signals non-constant variance (violation of **homoscedasticity**). A curved pattern signals non-linearity.',
    },
    {
      id: 'g305-t4-q15',
      topicId: 'regression-correlation',
      difficulty: 'conceptual',
      question:
        'Why does plugging $x = 20\\,^\\circ\\text{C}$ into the shelf-life model $\\hat{y} = 18.2 - 0.95x$ give the physically impossible result $-0.8\\text{ days}$?',
      options: [
        { id: 'a', text: 'It is extrapolation outside the studied data range.' },
        { id: 'b', text: 'The least-squares slope formula was inverted during fitting.' },
        { id: 'c', text: 'A negative correlation coefficient always invalidates regression.' },
        { id: 'd', text: 'Residuals were not squared when computing $SSE$.' },
      ],
      correctAnswer: 'a',
      explanation:
        'Regression equations are only valid inside the tested range of $x$. Predicting far outside that range (**extrapolation**) can yield physically impossible values.',
    },
    {
      id: 'g305-t4-q16',
      topicId: 'regression-correlation',
      difficulty: 'conceptual',
      question:
        'If $r \\approx 0$ between two engineering variables $x$ and $y$, what is the correct conclusion?',
      options: [
        { id: 'a', text: 'There is little or no linear relationship, though a curved one may exist.' },
        { id: 'b', text: 'There is guaranteed to be no mathematical relationship of any kind.' },
        { id: 'c', text: 'Variable $x$ causes variable $y$ to remain constant across all trials.' },
        { id: 'd', text: 'The sum of squared residuals $SSE$ must equal zero.' },
      ],
      correctAnswer: 'a',
      explanation:
        '$r$ measures **linear** association only; $r \\approx 0$ means little or no straight-line relationship, while a strong non-linear (curved) relationship may still exist.',
    },
  ],
};
