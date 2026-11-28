import { PublicQuizTopic } from '@/types/public-quiz';

export const topic1DescriptiveStats: PublicQuizTopic = {
  id: 'descriptive-statistics',
  title: 'Descriptive Statistics & Dispersion',
  shortTitle: 'Descriptive Stats',
  description:
    'Ungrouped and grouped mean, median, mode, population vs. sample variance, standard deviation, coefficient of variation, quartiles, IQR, and outlier fences.',
  icon: 'Calculator',
  accent: 'gold',
  questions: [
    {
      id: 'g305-t1-q1',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Ten steel rods have tensile strengths (MPa): $410, 425, 418, 432, 425, 440, 415, 425, 428, 422$. What are the mean $\\bar{x}$ and median?',
      options: [
        { id: 'a', text: '$\\bar{x} = 424\\text{ MPa}$, $\\text{median} = 425\\text{ MPa}$' },
        { id: 'b', text: '$\\bar{x} = 425\\text{ MPa}$, $\\text{median} = 424\\text{ MPa}$' },
        { id: 'c', text: '$\\bar{x} = 422\\text{ MPa}$, $\\text{median} = 425\\text{ MPa}$' },
        { id: 'd', text: '$\\bar{x} = 424\\text{ MPa}$, $\\text{median} = 423.5\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Sum $\\sum x = 4240$, so $\\bar{x} = \\dfrac{4240}{10} = 424\\text{ MPa}$. Sorted: $410, 415, 418, 422, 425, 425, 425, 428, 432, 440$. Average of 5th and 6th values: $\\dfrac{425+425}{2} = 425\\text{ MPa}$.',
    },
    {
      id: 'g305-t1-q2',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For the same 10 steel rods ($\\bar{x} = 424\\text{ MPa}$, $\\sum |x - \\bar{x}| = 62$), what are the **Range** and **Mean Deviation** about the mean?',
      options: [
        { id: 'a', text: '$\\text{Range} = 30\\text{ MPa}$, $\\text{MD} = 6.2\\text{ MPa}$' },
        { id: 'b', text: '$\\text{Range} = 30\\text{ MPa}$, $\\text{MD} = 6.89\\text{ MPa}$' },
        { id: 'c', text: '$\\text{Range} = 28\\text{ MPa}$, $\\text{MD} = 6.2\\text{ MPa}$' },
        { id: 'd', text: '$\\text{Range} = 32\\text{ MPa}$, $\\text{MD} = 5.8\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\text{Range} = X_{\\max} - X_{\\min} = 440 - 410 = 30\\text{ MPa}$. $\\text{MD} = \\dfrac{\\sum|x - \\bar{x}|}{n} = \\dfrac{62}{10} = 6.2\\text{ MPa}$.',
    },
    {
      id: 'g305-t1-q3',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For the 10 steel rods, $\\sum(x - \\bar{x})^2 = 656\\text{ MPa}^2$. Treating the rods as a **sample** from a larger batch, what are the sample variance $s^2$ and sample standard deviation $s$?',
      options: [
        { id: 'a', text: '$s^2 = 65.60\\text{ MPa}^2$, $s = 8.10\\text{ MPa}$' },
        { id: 'b', text: '$s^2 = 72.89\\text{ MPa}^2$, $s = 8.54\\text{ MPa}$' },
        { id: 'c', text: '$s^2 = 59.64\\text{ MPa}^2$, $s = 7.72\\text{ MPa}$' },
        { id: 'd', text: '$s^2 = 82.00\\text{ MPa}^2$, $s = 9.06\\text{ MPa}$' },
      ],
      correctAnswer: 'b',
      explanation:
        'For a sample, divide by $n - 1 = 9$: $$s^2 = \\frac{656}{10 - 1} = \\frac{656}{9} \\approx 72.89\\text{ MPa}^2, \\quad s = \\sqrt{72.89} \\approx 8.54\\text{ MPa}$$',
    },
    {
      id: 'g305-t1-q4',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Using the median-of-halves method on the sorted steel rod data $410, 415, 418, 422, 425, 425, 425, 428, 432, 440$, what are $Q_1$, $Q_3$, and the interquartile range ($\\text{IQR}$)?',
      options: [
        { id: 'a', text: '$Q_1 = 418$, $Q_3 = 428$, $\\text{IQR} = 10\\text{ MPa}$' },
        { id: 'b', text: '$Q_1 = 415$, $Q_3 = 432$, $\\text{IQR} = 17\\text{ MPa}$' },
        { id: 'c', text: '$Q_1 = 422$, $Q_3 = 428$, $\\text{IQR} = 6\\text{ MPa}$' },
        { id: 'd', text: '$Q_1 = 418$, $Q_3 = 432$, $\\text{IQR} = 14\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'Lower half: $410, 415, 418, 422, 425 \\implies Q_1 = 418$. Upper half: $425, 425, 428, 432, 440 \\implies Q_3 = 428$. $\\text{IQR} = Q_3 - Q_1 = 428 - 418 = 10\\text{ MPa}$.',
    },
    {
      id: 'g305-t1-q5',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For 50 concrete cubes grouped into classes of width $h = 5\\text{ MPa}$, $\\sum f = 50$ and $\\sum fx = 1700$. What is the estimated grouped mean compressive strength?',
      options: [
        { id: 'a', text: '$32.0\\text{ MPa}$' },
        { id: 'b', text: '$34.0\\text{ MPa}$' },
        { id: 'c', text: '$35.5\\text{ MPa}$' },
        { id: 'd', text: '$33.4\\text{ MPa}$' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\bar{x} = \\frac{\\sum fx}{\\sum f} = \\frac{1700}{50} = 34.0\\text{ MPa}$$',
    },
    {
      id: 'g305-t1-q6',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'In the 50-cube concrete table, the median class is $30\\text{–}34$ (lower boundary $L = 29.5$, width $h = 5$, class frequency $f_m = 15$, cumulative frequency before it $C = 12$). What is the estimated grouped median?',
      options: [
        { id: 'a', text: '$33.83\\text{ MPa}$' },
        { id: 'b', text: '$33.39\\text{ MPa}$' },
        { id: 'c', text: '$34.17\\text{ MPa}$' },
        { id: 'd', text: '$32.50\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        'With $N/2 = 25$: $$\\text{Median} = L + \\left(\\frac{N/2 - C}{f_m}\\right)h = 29.5 + \\left(\\frac{25 - 12}{15}\\right)5 = 29.5 + 4.333 = 33.83\\text{ MPa}$$',
    },
    {
      id: 'g305-t1-q7',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For the same 50 concrete cubes, the modal class is $30\\text{–}34$ ($L = 29.5$, $h = 5$, $f_1 = 15$, preceding $f_0 = 8$, following $f_2 = 13$). What is the estimated grouped mode?',
      options: [
        { id: 'a', text: '$33.83\\text{ MPa}$' },
        { id: 'b', text: '$33.39\\text{ MPa}$' },
        { id: 'c', text: '$32.89\\text{ MPa}$' },
        { id: 'd', text: '$34.50\\text{ MPa}$' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$\\text{Mode} = L + \\left(\\frac{f_1 - f_0}{2f_1 - f_0 - f_2}\\right)h = 29.5 + \\left(\\frac{15 - 8}{30 - 8 - 13}\\right)5 = 29.5 + \\frac{7}{9}(5) = 33.39\\text{ MPa}$$',
    },
    {
      id: 'g305-t1-q8',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For the grouped concrete cube data ($N = 50$, $\\sum fx = 1700$, $\\bar{x} = 34$, $\\sum fx^2 = 59,900$), what is the estimated **population standard deviation** $\\sigma$?',
      options: [
        { id: 'a', text: '$6.48\\text{ MPa}$' },
        { id: 'b', text: '$6.55\\text{ MPa}$' },
        { id: 'c', text: '$7.21\\text{ MPa}$' },
        { id: 'd', text: '$5.84\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$$\\sigma = \\sqrt{\\frac{\\sum fx^2}{N} - \\bar{x}^2} = \\sqrt{\\frac{59,900}{50} - 34^2} = \\sqrt{1198 - 1156} = \\sqrt{42} \\approx 6.48\\text{ MPa}$$',
    },
    {
      id: 'g305-t1-q9',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Five resistor readings ($\\Omega$) are $98, 102, 100, 101, 99$. What are the sample standard deviation $s$ and coefficient of variation $\\text{CV}$?',
      options: [
        { id: 'a', text: '$s = 1.58\\,\\Omega$, $\\text{CV} = 1.58\\%$' },
        { id: 'b', text: '$s = 1.41\\,\\Omega$, $\\text{CV} = 1.41\\%$' },
        { id: 'c', text: '$s = 2.50\\,\\Omega$, $\\text{CV} = 2.50\\%$' },
        { id: 'd', text: '$s = 1.73\\,\\Omega$, $\\text{CV} = 1.73\\%$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\bar{x} = 100\\,\\Omega$. Squared deviations: $(-2)^2 + 2^2 + 0^2 + 1^2 + (-1)^2 = 10$. $$s^2 = \\frac{10}{5 - 1} = 2.5 \\implies s = \\sqrt{2.5} \\approx 1.58\\,\\Omega, \\quad \\text{CV} = \\frac{1.58}{100} \\times 100\\% = 1.58\\%$$',
    },
    {
      id: 'g305-t1-q10',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Defective bulbs across 20 boxes have counts: $x = 0\\,(f=3)$, $x = 1\\,(f=8)$, $x = 2\\,(f=6)$, $x = 3\\,(f=2)$, $x = 4\\,(f=1)$. What are the mean, median, and mode?',
      options: [
        { id: 'a', text: '$\\text{Mean} = 1.5$, $\\text{Median} = 1$, $\\text{Mode} = 1$' },
        { id: 'b', text: '$\\text{Mean} = 1.5$, $\\text{Median} = 2$, $\\text{Mode} = 1$' },
        { id: 'c', text: '$\\text{Mean} = 2.0$, $\\text{Median} = 1$, $\\text{Mode} = 2$' },
        { id: 'd', text: '$\\text{Mean} = 1.4$, $\\text{Median} = 1.5$, $\\text{Mode} = 1$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\sum fx = 0(3)+1(8)+2(6)+3(2)+4(1) = 30$, so $\\bar{x} = 30/20 = 1.5$. Cumulative frequency reaches $11$ at $x=1$, so both 10th and 11th values are $1$ (median $= 1$). Highest frequency is $8$ at $x = 1$ (mode $= 1$).',
    },
    {
      id: 'g305-t1-q11',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Repair times (hours) for 7 pump failures are $12, 14, 15, 15, 16, 18, 95$. What are the mean and median, and which better represents a typical repair?',
      options: [
        { id: 'a', text: '$\\bar{x} = 26.43\\text{ h}$, $\\text{median} = 15\\text{ h}$; median is better' },
        { id: 'b', text: '$\\bar{x} = 26.43\\text{ h}$, $\\text{median} = 15\\text{ h}$; mean is better' },
        { id: 'c', text: '$\\bar{x} = 15.00\\text{ h}$, $\\text{median} = 16\\text{ h}$; mean is better' },
        { id: 'd', text: '$\\bar{x} = 24.20\\text{ h}$, $\\text{median} = 15\\text{ h}$; median is better' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\bar{x} = \\dfrac{185}{7} = 26.43\\text{ h}$. The 4th sorted value is $15\\text{ h}$. Because $95\\text{ h}$ is an extreme outlier pulling the mean upward, the **median** better describes a typical repair.',
    },
    {
      id: 'g305-t1-q12',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Machine A fills packs with $\\bar{x} = 500\\text{ g}, s = 2\\text{ g}$; Machine B fills with $\\bar{x} = 500\\text{ g}, s = 6\\text{ g}$. What are their Coefficients of Variation ($\\text{CV}$)?',
      options: [
        { id: 'a', text: '$\\text{CV}_A = 0.4\\%$, $\\text{CV}_B = 1.2\\%$; Machine A is more consistent' },
        { id: 'b', text: '$\\text{CV}_A = 0.4\\%$, $\\text{CV}_B = 1.2\\%$; Machine B is more consistent' },
        { id: 'c', text: '$\\text{CV}_A = 2.0\\%$, $\\text{CV}_B = 6.0\\%$; Machine A is more consistent' },
        { id: 'd', text: '$\\text{CV}_A = 4.0\\%$, $\\text{CV}_B = 12.0\\%$; Machine A is more consistent' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\text{CV}_A = \\dfrac{2}{500}\\times 100\\% = 0.4\\%$; $\\text{CV}_B = \\dfrac{6}{500}\\times 100\\% = 1.2\\%$. Smaller CV means less relative variation, so **Machine A** is more consistent.',
    },
    {
      id: 'g305-t1-q13',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'For the sorted dataset $8, 10, 12, 13, 15, 16, 18, 40$, using the **median-of-halves** method, what are the lower and upper outlier fences, and is $40$ an outlier?',
      options: [
        { id: 'a', text: '$\\text{Lower} = 2$, $\\text{Upper} = 26$; yes, $40$ is an outlier' },
        { id: 'b', text: '$\\text{Lower} = 5$, $\\text{Upper} = 23$; yes, $40$ is an outlier' },
        { id: 'c', text: '$\\text{Lower} = 2$, $\\text{Upper} = 42$; no, $40$ is not an outlier' },
        { id: 'd', text: '$\\text{Lower} = 0$, $\\text{Upper} = 36$; yes, $40$ is an outlier' },
      ],
      correctAnswer: 'a',
      explanation:
        '$Q_1 = (10+12)/2 = 11$, $Q_3 = (16+18)/2 = 17$, $\\text{IQR} = 6$. Lower fence $= 11 - 1.5(6) = 2$; Upper fence $= 17 + 1.5(6) = 26$. Since $40 > 26$, $40$ is an outlier.',
    },
    {
      id: 'g305-t1-q14',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Given $Q_1 = 40$ and $Q_3 = 52$ for a set of beam deflection measurements, any observation flagged as a boxplot outlier must fall:',
      options: [
        { id: 'a', text: 'Below $22$ or above $70$' },
        { id: 'b', text: 'Below $28$ or above $64$' },
        { id: 'c', text: 'Below $18$ or above $74$' },
        { id: 'd', text: 'Below $24$ or above $68$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\text{IQR} = 52 - 40 = 12$. Lower fence $= 40 - 1.5(12) = 22$; Upper fence $= 52 + 1.5(12) = 70$.',
    },
    {
      id: 'g305-t1-q15',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'The strengths (MPa) of 8 specimens are $32, 35, 31, 36, 34, 33, 35, 34$. What are the sample mean $\\bar{x}$ and sample standard deviation $s$?',
      options: [
        { id: 'a', text: '$\\bar{x} = 33.75\\text{ MPa}$, $s = 1.67\\text{ MPa}$' },
        { id: 'b', text: '$\\bar{x} = 33.75\\text{ MPa}$, $s = 1.56\\text{ MPa}$' },
        { id: 'c', text: '$\\bar{x} = 34.00\\text{ MPa}$, $s = 1.67\\text{ MPa}$' },
        { id: 'd', text: '$\\bar{x} = 33.50\\text{ MPa}$, $s = 1.85\\text{ MPa}$' },
      ],
      correctAnswer: 'a',
      explanation:
        '$\\sum x = 270 \\implies \\bar{x} = 270/8 = 33.75\\text{ MPa}$. $\\sum(x - \\bar{x})^2 = 19.5$, so $s^2 = 19.5/7 = 2.7857$ and $s = \\sqrt{2.7857} \\approx 1.67\\text{ MPa}$.',
    },
    {
      id: 'g305-t1-q16',
      topicId: 'descriptive-statistics',
      difficulty: 'calculation',
      question:
        'Using Sturges’ guide $k \\approx 1 + 3.3\\log_{10} n$, approximately how many classes should be chosen for a grouped frequency table of $n = 100$ measurements?',
      options: [
        { id: 'a', text: '$5$ classes' },
        { id: 'b', text: '$8$ classes' },
        { id: 'c', text: '$11$ classes' },
        { id: 'd', text: '$14$ classes' },
      ],
      correctAnswer: 'b',
      explanation:
        '$$k \\approx 1 + 3.3\\log_{10}(100) = 1 + 3.3(2) = 7.6 \\approx 8\\text{ classes}$$',
    },
    {
      id: 'g305-t1-q17',
      topicId: 'descriptive-statistics',
      difficulty: 'conceptual',
      question:
        'Why do we divide by $n - 1$ instead of $n$ when calculating **sample variance** $s^2$?',
      options: [
        { id: 'a', text: 'Because $n - 1$ always makes the standard deviation smaller than $\\sigma$.' },
        { id: 'b', text: 'To correct downward bias from using $\\bar{x}$ instead of $\\mu$.' },
        { id: 'c', text: 'Because sample data always contain at least one extreme outlier value.' },
        { id: 'd', text: 'To convert the variance units from squared units back to linear units.' },
      ],
      correctAnswer: 'b',
      explanation:
        'Deviations around the sample mean $\\bar{x}$ are slightly smaller than around the true population mean $\\mu$; dividing by $n - 1$ (Bessel’s correction) removes this bias.',
    },
    {
      id: 'g305-t1-q18',
      topicId: 'descriptive-statistics',
      difficulty: 'conceptual',
      question:
        'Picking every $k$-th item coming off a factory conveyor belt for quality inspection is an example of:',
      options: [
        { id: 'a', text: 'Stratified sampling' },
        { id: 'b', text: 'Systematic sampling' },
        { id: 'c', text: 'Cluster sampling' },
        { id: 'd', text: 'Simple random sampling' },
      ],
      correctAnswer: 'b',
      explanation:
        '**Systematic sampling** selects every $k$-th item in order. **Stratified** splits into strata (e.g., shifts/machines) and samples each; **Cluster** samples whole groups (e.g., entire pallets).',
    },
    {
      id: 'g305-t1-q19',
      topicId: 'descriptive-statistics',
      difficulty: 'conceptual',
      question:
        'Which graphical display plots **cumulative frequency** against upper class boundaries and is used to read medians and percentiles?',
      options: [
        { id: 'a', text: 'Histogram' },
        { id: 'b', text: 'Ogive' },
        { id: 'c', text: 'Bar chart' },
        { id: 'd', text: 'Scatter plot' },
      ],
      correctAnswer: 'b',
      explanation:
        'An **ogive** (cumulative frequency curve) allows graphical estimation of medians, quartiles, and percentiles.',
    },
    {
      id: 'g305-t1-q20',
      topicId: 'descriptive-statistics',
      difficulty: 'conceptual',
      question:
        'How is a **Parameter** distinguished from a **Statistic**?',
      options: [
        { id: 'a', text: 'A parameter describes a population ($\\mu, \\sigma$); a statistic describes a sample ($\\bar{x}, s$).' },
        { id: 'b', text: 'A parameter is computed from a small sample; a statistic is computed from the entire population.' },
        { id: 'c', text: 'Parameters apply only to categorical variables; statistics apply only to continuous variables.' },
        { id: 'd', text: 'A parameter is always an integer count, whereas a statistic is always a percentage.' },
      ],
      correctAnswer: 'a',
      explanation:
        'A **parameter** describes a population ($\\mu, \\sigma$), while a **statistic** is computed from a sample ($\\bar{x}, s$) to estimate that parameter.',
    },
  ],
};
