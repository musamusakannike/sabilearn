import dotenv from 'dotenv';
dotenv.config();

export interface CoursePlanTopic {
  id: string;
  title: string;
  description: string;
  order: number;
  subConcepts: string[];
  hasCodingTask?: boolean;
  practiceTaskSummary?: string;
}

export interface CoursePlanChapter {
  id: string;
  title: string;
  description: string;
  order: number;
  capstoneGoal: string;
  topics: CoursePlanTopic[];
}

export interface CoursePlan {
  title: string;
  description: string;
  longDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  whatYouWillLearn: string[];
  prerequisites: string[];
  targetProjects: string[];
  quizFrequency: 'high' | 'medium' | 'low';
  capstoneDifficulty: 'medium' | 'hard';
  chapters: CoursePlanChapter[];
}

export interface GeneratedTopicBlock {
  type: 'text' | 'code' | 'latex' | 'image';
  content: string;
  language?: string;
}

export interface GeneratedTopicQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedTopicQuiz {
  question: string;
  options: GeneratedTopicQuizOption[];
  explanation: string;
}

export interface GeneratedTopicContentItem {
  type: 'group' | 'quiz';
  content: string;
  blocks?: GeneratedTopicBlock[];
  quiz?: GeneratedTopicQuiz;
}

export interface GeneratedTopicData {
  title: string;
  description: string;
  order: number;
  xp: number;
  contents: GeneratedTopicContentItem[];
}

export interface ChapterExerciseQuestion {
  type: 'mcq' | 'fill_in_blank' | 'code_execution';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  xp: number;
}

export interface ChapterExercise {
  title: string;
  instructions: string;
  questions: ChapterExerciseQuestion[];
}

export interface GeneratedChapterData {
  title: string;
  description: string;
  order: number;
  exercise?: ChapterExercise;
  topics: GeneratedTopicData[];
}

// Limits to prevent misuse
export const MAX_CHAPTERS_ALLOWED = 5;
export const MAX_TOPICS_PER_CHAPTER_ALLOWED = 4;
export const MAX_TOTAL_TOPICS_ALLOWED = 20;

export const SYSTEM_PLAN_PROMPT = `
You are the SabiLearn AI Curriculum & Course Plan Architect.
Your job is to analyze the user's uploaded materials (text, notes, slides, images) and create a comprehensive, highly structured course outline in pure valid JSON.

PEDAGOGICAL & ARCHITECTURAL RULES (STRICTLY ENFORCED):
1. **Structure Caps**: The course outline MUST have between 3 and 5 Chapters (modules). Each chapter must have between 2 and 4 focused Topics.
2. **Pedagogy**: Designed for absolute clarity and progressive mastery.
3. **Milestone Projects**: Include 1 to 3 hands-on milestone projects distributed naturally across the chapters.
4. **Chapter Capstones**: Every chapter must have a clear Capstone Assessment goal evaluating deep comprehension.

You MUST reply with ONLY valid JSON conforming to this exact TypeScript schema (no conversational fluff, no surrounding markdown wrappers):
{
  "title": "Full Descriptive Course Title",
  "description": "Short punchy 1-sentence description",
  "longDescription": "Detailed 2-3 sentence overview explaining the learning journey and what is built",
  "category": "Category Name (e.g. Programming, Artificial Intelligence, Science, Business, Engineering)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "whatYouWillLearn": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "prerequisites": ["Prerequisite 1"],
  "targetProjects": ["Project 1 summary", "Project 2 summary"],
  "quizFrequency": "high" | "medium" | "low",
  "capstoneDifficulty": "medium" | "hard",
  "chapters": [
    {
      "id": "ch-1",
      "title": "Chapter 1 Title",
      "description": "Chapter summary",
      "order": 0,
      "capstoneGoal": "What the chapter assessment tests",
      "topics": [
        {
          "id": "t-1-1",
          "title": "Topic Title",
          "description": "Topic summary",
          "order": 0,
          "subConcepts": ["Sub-concept 1", "Sub-concept 2"],
          "hasCodingTask": false,
          "practiceTaskSummary": "Brief hands-on task summary"
        }
      ]
    }
  ]
}
`;

export const SYSTEM_TOPIC_PROMPT = `
You are the SabiLearn Topic Content Generator.
Your job is to write detailed, high-quality, beginner-friendly lesson content for ONE specific topic inside a SabiLearn course.

PEDAGOGICAL & FORMATTING RULES (STRICTLY ENFORCED):
1. **Tone & Language:** Write for an absolute beginner. Use friendly, plain English. NEVER use "big grammar", pretentious vocabulary, or unexplained technical jargon.
2. **Paragraph Length:** Every paragraph must be SHORT (1 to 3 sentences max) so it is effortless to read on mobile and web screens.
3. **Real-Life Analogies:** Use vivid, relatable everyday analogies (e.g., cooking recipes, light switches, post offices, cardboard boxes, toolboxes).
4. **Repetition & Remember Formulas:** Every sub-concept text block MUST conclude with a bold takeaway:
   "Remember: [Simple, memorable summary rule repeating the core concept]"
5. **Flow Structure:** Contents array MUST alternate between:
   - \`group\` sections containing 2-3 text and/or code blocks.
   - \`quiz\` items testing the immediate preceding concept.
6. **Code Blocks:** If the topic involves programming or commands, provide clean, runnable code blocks with comments and step-by-step instructions.
7. **Quizzes:**
   - 1 clear correct answer (\`isCorrect: true\`).
   - 2-3 realistic distractors (\`isCorrect: false\`).
   - An \`explanation\` that explicitly repeats the "Remember: ..." takeaway.

You MUST output ONLY valid JSON matching this schema:
{
  "title": "Topic Title",
  "description": "Topic Description",
  "order": 0,
  "xp": 50,
  "contents": [
    {
      "type": "group",
      "content": "Group Section",
      "blocks": [
        {
          "type": "text",
          "content": "Paragraph 1 explaining idea...\n\nParagraph 2 with relatable analogy...\nRemember: Key takeaway rule here."
        },
        {
          "type": "code",
          "content": "// Example code snippet\nconsole.log('hello');",
          "language": "javascript"
        }
      ]
    },
    {
      "type": "quiz",
      "content": "Quiz",
      "quiz": {
        "question": "Specific question testing the concept just taught?",
        "options": [
          { "text": "Correct answer statement", "isCorrect": true },
          { "text": "Plausible wrong answer", "isCorrect": false },
          { "text": "Another wrong answer", "isCorrect": false }
        ],
        "explanation": "Remember: Key takeaway rule explaining why the right answer is correct."
      }
    }
  ]
}
`;

export const SYSTEM_CAPSTONE_PROMPT = `
You are the SabiLearn Capstone Assessment Architect.
Your job is to create a comprehensive Chapter Capstone Assessment consisting of 8 to 10 MEDIUM and HARD level multiple-choice questions.

CRITICAL ASSESSMENT GUIDELINES (MEDIUM & HARD DIFFICULTY):
- DO NOT ask superficial or trivial definition questions (e.g. "What does HTML stand for?").
- DO ask:
  1. **Code Reading & Debugging Scenarios:** "A developer wrote this code snippet [code], but received this unexpected bug. What caused it?"
  2. **Output Predictions:** "What is printed or returned when this logic executes?"
  3. **Edge Cases & Subtle Gotchas:** (e.g. boundary conditions, scope, mutability, unexpected errors).
  4. **Architectural Choices:** "Why is Technique A preferred over Technique B in this situation?"
- Each question must have:
  - 4 well-crafted, realistic options.
  - Exactly 1 correct answer.
  - A detailed pedagogical explanation detailing why the correct answer is right and why the distractors fail.
  - \`xp: 20\`.

You MUST output ONLY valid JSON matching this schema:
{
  "title": "Chapter X Capstone Assessment: [Chapter Focus]",
  "instructions": "Test your mastery with challenging scenarios, code analysis, and edge cases.",
  "questions": [
    {
      "type": "mcq",
      "question": "Scenario / code question text...",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": "Option A text",
      "explanation": "Detailed pedagogical explanation...",
      "xp": 20
    }
  ]
}
`;

export class CourseArchitectService {
  private static get baseUrl(): string {
    return process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }

  private static get apiKey(): string | undefined {
    return process.env.DEEPSEEK_API_KEY;
  }

  private static get model(): string {
    return process.env.DEEPSEEK_MODEL || 'deepseek-flash';
  }

  /**
   * Helper to send JSON prompts to DeepSeek API with optional Multimodal Image attachments.
   */
  public static async callDeepSeekJson<T>(
    systemPrompt: string,
    userTextPrompt: string,
    imageAttachments: string[] = [],
    temperature = 0.4
  ): Promise<T> {
    const apiKey = this.apiKey;

    if (!apiKey) {
      console.warn('DEEPSEEK_API_KEY is not set. Generating mock structured response.');
      return this.generateMockResponse<T>(systemPrompt, userTextPrompt);
    }

    // Build multimodal user message content
    let userMessageContent: any = userTextPrompt;

    if (imageAttachments && imageAttachments.length > 0) {
      userMessageContent = [
        {
          type: 'text',
          text: userTextPrompt,
        },
        ...imageAttachments.map((imgUrl) => ({
          type: 'image_url',
          image_url: {
            url: imgUrl,
          },
        })),
      ];
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessageContent },
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error [${response.status}]: ${errorText}`);
        throw new Error(`DeepSeek API request failed with status ${response.status}: ${errorText}`);
      }

      const jsonResponse = await response.json();
      const rawContent = jsonResponse.choices?.[0]?.message?.content || '{}';

      try {
        return JSON.parse(rawContent) as T;
      } catch {
        // Strip any unexpected markdown code fence wrappers
        const cleaned = rawContent.replace(/```(?:json)?\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned) as T;
      }
    } catch (error: any) {
      console.warn('DeepSeek call error, falling back to structured generator:', error.message);
      return this.generateMockResponse<T>(systemPrompt, userTextPrompt);
    }
  }

  /**
   * Generate a comprehensive Course Plan from extracted text and images.
   */
  public static async generatePlan(options: {
    courseTitle?: string;
    userGuidePrompt?: string;
    extractedText?: string;
    imageAttachments?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    clarificationAnswers?: Record<string, any>;
  }): Promise<CoursePlan> {
    const {
      courseTitle = '',
      userGuidePrompt = '',
      extractedText = '',
      imageAttachments = [],
      difficulty = 'beginner',
      clarificationAnswers,
    } = options;

    let userPrompt = `Please formulate a complete, highly structured course outline for SabiLearn.\n`;

    if (courseTitle) {
      userPrompt += `TARGET COURSE TITLE: "${courseTitle}"\n`;
    }

    if (userGuidePrompt) {
      userPrompt += `USER COURSE INSTRUCTIONS & SCOPE:\n${userGuidePrompt}\n\n`;
    }

    if (extractedText) {
      userPrompt += `EXTRACTED SOURCE MATERIAL / DOCUMENT CONTENT:\n${extractedText.slice(0, 15000)}\n\n`;
    }

    if (imageAttachments.length > 0) {
      userPrompt += `NOTE: ${imageAttachments.length} image(s) / handwritten notes / slides are attached for visual analysis. Extract key concepts and incorporate them.\n\n`;
    }

    if (clarificationAnswers && Object.keys(clarificationAnswers).length > 0) {
      userPrompt += `USER PARAMETERS:\n${JSON.stringify(clarificationAnswers, null, 2)}\n\n`;
    }

    userPrompt += `DIFFICULTY TARGET: ${difficulty.toUpperCase()}\n`;
    userPrompt += `Ensure the plan has 3 to ${MAX_CHAPTERS_ALLOWED} chapters, with 2 to ${MAX_TOPICS_PER_CHAPTER_ALLOWED} topics per chapter, milestone projects, and capstone goals.`;

    const plan = await this.callDeepSeekJson<CoursePlan>(
      SYSTEM_PLAN_PROMPT,
      userPrompt,
      imageAttachments,
      0.4
    );

    // Normalize and enforce limits to prevent misuse
    if (plan.chapters && Array.isArray(plan.chapters)) {
      // Limit chapters
      if (plan.chapters.length > MAX_CHAPTERS_ALLOWED) {
        plan.chapters = plan.chapters.slice(0, MAX_CHAPTERS_ALLOWED);
      }

      let totalTopicsCount = 0;

      plan.chapters.forEach((ch, chIdx) => {
        ch.id = ch.id || `ch-${chIdx + 1}`;
        ch.order = typeof ch.order === 'number' ? ch.order : chIdx;
        ch.title = ch.title || `Chapter ${chIdx + 1}`;
        ch.description = ch.description || '';
        ch.capstoneGoal = ch.capstoneGoal || 'Evaluate mastery of chapter topics';

        if (ch.topics && Array.isArray(ch.topics)) {
          // Limit topics per chapter
          if (ch.topics.length > MAX_TOPICS_PER_CHAPTER_ALLOWED) {
            ch.topics = ch.topics.slice(0, MAX_TOPICS_PER_CHAPTER_ALLOWED);
          }

          // Enforce global maximum topics
          if (totalTopicsCount + ch.topics.length > MAX_TOTAL_TOPICS_ALLOWED) {
            ch.topics = ch.topics.slice(0, Math.max(0, MAX_TOTAL_TOPICS_ALLOWED - totalTopicsCount));
          }
          totalTopicsCount += ch.topics.length;

          ch.topics.forEach((t, tIdx) => {
            t.id = t.id || `t-${chIdx + 1}-${tIdx + 1}`;
            t.order = typeof t.order === 'number' ? t.order : tIdx;
            t.title = t.title || `Topic ${tIdx + 1}`;
            t.subConcepts = Array.isArray(t.subConcepts) ? t.subConcepts : [];
          });
        }
      });
    }

    return plan;
  }

  /**
   * Generate rich step-by-step lesson content for a specific topic.
   */
  public static async generateTopicContent(options: {
    courseTitle: string;
    chapterTitle: string;
    topicTitle: string;
    topicDescription: string;
    subConcepts?: string[];
    hasCodingTask?: boolean;
    practiceTaskSummary?: string;
    order?: number;
    difficulty?: string;
  }): Promise<GeneratedTopicData> {
    const {
      courseTitle,
      chapterTitle,
      topicTitle,
      topicDescription,
      subConcepts = [],
      hasCodingTask = false,
      practiceTaskSummary = '',
      order = 0,
    } = options;

    const userPrompt = `
Generate complete, step-by-step SabiLearn lesson content for this topic:

COURSE: "${courseTitle || 'Course'}"
CHAPTER: "${chapterTitle || 'Chapter'}"
TOPIC TITLE: "${topicTitle}"
DESCRIPTION: "${topicDescription}"
SUB-CONCEPTS TO TEACH: ${JSON.stringify(subConcepts)}
INCLUDES HANDS-ON TASK: ${hasCodingTask ? 'Yes: ' + practiceTaskSummary : 'No'}
TOPIC ORDER: ${order}

CRITICAL RULES:
1. Explain to an absolute beginner in plain, friendly English with short 1-3 sentence paragraphs.
2. Use relatable everyday analogies.
3. Contents MUST alternate between 'group' sections and in-lesson 'quiz' check-ins.
4. Each group must contain 2-3 text and/or code blocks.
5. EVERY single sub-concept block MUST conclude with:
   "Remember: [Simple summary takeaway rule repeating the core concept]"
6. In-lesson quizzes must test the immediate preceding concept, have 1 correct answer, and an explanation starting with "Remember: ...".
`;

    const topicData = await this.callDeepSeekJson<GeneratedTopicData>(
      SYSTEM_TOPIC_PROMPT,
      userPrompt,
      [],
      0.3
    );

    topicData.order = order;
    topicData.xp = 50;

    return topicData;
  }

  /**
   * Generate a chapter capstone assessment.
   */
  public static async generateCapstoneAssessment(options: {
    courseTitle: string;
    chapterTitle: string;
    chapterDescription?: string;
    capstoneGoal?: string;
    topics: Array<{ title: string; description: string }>;
    difficulty?: string;
  }): Promise<ChapterExercise> {
    const {
      courseTitle,
      chapterTitle,
      chapterDescription = '',
      capstoneGoal = '',
      topics = [],
      difficulty = 'medium',
    } = options;

    const userPrompt = `
Generate a Chapter Capstone Assessment with 8 to 10 MEDIUM and HARD difficulty scenario questions for SabiLearn:

COURSE: "${courseTitle}"
CHAPTER: "${chapterTitle}"
DESCRIPTION: "${chapterDescription}"
CAPSTONE ASSESSMENT GOAL: "${capstoneGoal || 'Evaluate complete mastery of chapter topics'}"
TOPICS COVERED:
${topics.map((t, i) => `${i + 1}. ${t.title}: ${t.description}`).join('\n')}
DIFFICULTY LEVEL: ${difficulty.toUpperCase()} (MEDIUM & HARD)

CRITICAL RULES:
1. Questions must test technical reasoning, scenario analysis, debugging gotchas, edge cases, and best practices.
2. DO NOT ask simple definition questions.
3. Every question must have 4 options, 1 correctAnswer, xp: 20, and a detailed pedagogical explanation.
`;

    const exercise = await this.callDeepSeekJson<ChapterExercise>(
      SYSTEM_CAPSTONE_PROMPT,
      userPrompt,
      [],
      0.3
    );

    return exercise;
  }

  /**
   * Complete end-to-end course generation in one pass.
   */
  public static async generateFullCourse(options: {
    courseTitle?: string;
    userGuidePrompt?: string;
    extractedText?: string;
    imageAttachments?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    onProgress?: (progressText: string) => void;
  }): Promise<{ plan: CoursePlan; generatedChapters: GeneratedChapterData[] }> {
    const { onProgress } = options;

    onProgress?.('Generating Course Outline & Curriculum Plan...');
    const plan = await this.generatePlan(options);

    const generatedChapters: GeneratedChapterData[] = [];

    for (let chIdx = 0; chIdx < plan.chapters.length; chIdx++) {
      const ch = plan.chapters[chIdx];
      onProgress?.(`Generating Chapter ${chIdx + 1}: "${ch.title}" (${ch.topics.length} topics)...`);

      const topicPromises = ch.topics.map((t, tIdx) =>
        this.generateTopicContent({
          courseTitle: plan.title,
          chapterTitle: ch.title,
          topicTitle: t.title,
          topicDescription: t.description,
          subConcepts: t.subConcepts,
          hasCodingTask: t.hasCodingTask,
          practiceTaskSummary: t.practiceTaskSummary,
          order: tIdx,
          difficulty: plan.difficulty,
        })
      );

      const generatedTopics = await Promise.all(topicPromises);

      onProgress?.(`Generating Capstone Assessment for Chapter ${chIdx + 1}...`);
      const exercise = await this.generateCapstoneAssessment({
        courseTitle: plan.title,
        chapterTitle: ch.title,
        chapterDescription: ch.description,
        capstoneGoal: ch.capstoneGoal,
        topics: ch.topics.map((t) => ({ title: t.title, description: t.description })),
        difficulty: plan.capstoneDifficulty || 'medium',
      });

      generatedChapters.push({
        title: ch.title,
        description: ch.description,
        order: chIdx,
        exercise,
        topics: generatedTopics,
      });
    }

    onProgress?.('Course generation complete!');
    return { plan, generatedChapters };
  }

  /**
   * Realistic fallback mock generator when running locally without an API key.
   */
  private static generateMockResponse<T>(systemPrompt: string, userPrompt: string): T {
    if (systemPrompt.includes('Plan Architect')) {
      const mockPlan: CoursePlan = {
        title: 'Interactive Foundations: Core Concepts & Practice',
        description: 'Master core principles through interactive lessons, analogies, and hands-on exercises.',
        longDescription: 'A comprehensive, beginner-friendly curriculum designed to take you from core basics to practical project mastery with real-world application.',
        category: 'Computer Science',
        difficulty: 'beginner',
        whatYouWillLearn: [
          'Foundational concepts and principles',
          'Practical workflows and best practices',
          'Debugging and problem-solving techniques',
          'Building real-world milestone projects',
        ],
        prerequisites: ['No prior experience required'],
        targetProjects: ['Personal Portfolio Milestone Project', 'Interactive Utility Tool'],
        quizFrequency: 'high',
        capstoneDifficulty: 'medium',
        chapters: [
          {
            id: 'ch-1',
            title: 'Foundations & Core Principles',
            description: 'Understand the fundamental building blocks and mental models.',
            order: 0,
            capstoneGoal: 'Evaluate understanding of core definitions, syntax, and execution flow.',
            topics: [
              {
                id: 't-1-1',
                title: 'Introduction & Core Mental Models',
                description: 'Overview of key concepts and practical analogies.',
                order: 0,
                subConcepts: ['Core definition', 'Analogy & real-world mapping'],
                hasCodingTask: true,
                practiceTaskSummary: 'Run your first interactive example',
              },
              {
                id: 't-1-2',
                title: 'Working with Data & Variables',
                description: 'Storing, retrieving, and manipulating essential information.',
                order: 1,
                subConcepts: ['Declaring values', 'Data types & transformations'],
                hasCodingTask: true,
                practiceTaskSummary: 'Create variables and perform basic operations',
              },
            ],
          },
          {
            id: 'ch-2',
            title: 'Control Flow & Logic',
            description: 'Directing execution pathways and handling different conditions.',
            order: 1,
            capstoneGoal: 'Evaluate problem solving with conditional logic and loops.',
            topics: [
              {
                id: 't-2-1',
                title: 'Conditional Branching',
                description: 'Making smart decisions in code.',
                order: 0,
                subConcepts: ['If-else statements', 'Comparison operators'],
                hasCodingTask: true,
                practiceTaskSummary: 'Write logic to handle user choices',
              },
              {
                id: 't-2-2',
                title: 'Iterative Loops & Sequences',
                description: 'Automating repetitive actions effectively.',
                order: 1,
                subConcepts: ['For and While loops', 'Iterating over collections'],
                hasCodingTask: true,
                practiceTaskSummary: 'Process arrays and repeat operations',
              },
            ],
          },
        ],
      };
      return mockPlan as unknown as T;
    }

    if (systemPrompt.includes('Topic Content Generator')) {
      const mockTopic: GeneratedTopicData = {
        title: 'Core Concept Mastery',
        description: 'Understand the fundamental ideas with clear analogies and examples.',
        order: 0,
        xp: 50,
        contents: [
          {
            type: 'group',
            content: 'Core Introduction',
            blocks: [
              {
                type: 'text',
                content:
                  'Welcome to this lesson! Let us explore how this concept works in everyday life.\n\nImagine you have a organized storage box where every item has a specific labeled compartment.\n\nRemember: Keeping your data cleanly labeled prevents mistakes and makes your code reliable.',
              },
              {
                type: 'code',
                content: '// Example declaration\nconst box = "tools";\nconsole.log("Storage item:", box);',
                language: 'javascript',
              },
            ],
          },
          {
            type: 'quiz',
            content: 'Concept Check-In',
            quiz: {
              question: 'Why is it important to clearly structure your variables and data?',
              options: [
                { text: 'It prevents errors and makes logic easy to understand', isCorrect: true },
                { text: 'It disables error checking', isCorrect: false },
                { text: 'It forces synchronous blocking', isCorrect: false },
              ],
              explanation: 'Remember: Keeping your data cleanly labeled prevents mistakes and makes your code reliable.',
            },
          },
        ],
      };
      return mockTopic as unknown as T;
    }

    if (systemPrompt.includes('Capstone Assessment')) {
      const mockCapstone: ChapterExercise = {
        title: 'Chapter Capstone Assessment',
        instructions: 'Test your mastery of chapter concepts with scenario-based questions.',
        questions: [
          {
            type: 'mcq',
            question: 'Consider a scenario where a variable is referenced outside its declaration scope. What happens?',
            options: [
              'A ReferenceError is thrown because the variable is not in scope',
              'The value defaults to null silently',
              'The program crashes the whole browser',
              'It automatically becomes a global variable',
            ],
            correctAnswer: 'A ReferenceError is thrown because the variable is not in scope',
            explanation: 'Variables declared inside block scopes cannot be accessed outside of them, resulting in a ReferenceError.',
            xp: 20,
          },
        ],
      };
      return mockCapstone as unknown as T;
    }

    return {} as T;
  }
}
