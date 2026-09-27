import { DocumentChunk, DocumentSection } from './documentProcessor.service';

export interface ChapterExerciseQuestion {
  type: "mcq" | "fill_in_blank" | "code_execution";
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

export interface GeneratedTopicBlock {
  type: "text" | "latex" | "code" | "youtube" | "image";
  content: string;
  language?: string;
}

export interface GeneratedTopicItem {
  type: "group" | "quiz";
  content?: string;
  blocks?: GeneratedTopicBlock[];
  quiz?: {
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
  };
}

export interface GeneratedTopicData {
  id?: string;
  title: string;
  description: string;
  order: number;
  subConcepts: string[];
  hasCodingTask?: boolean;
  practiceTaskSummary?: string;
  sectionId?: string;
  sourceChunkIndices?: number[];
  contents?: GeneratedTopicItem[];
  xp?: number;
}

export interface GeneratedChapterData {
  id?: string;
  title: string;
  description: string;
  order: number;
  capstoneGoal?: string;
  sourceSectionId?: string;
  chunkIndices?: number[];
  exercise?: ChapterExercise;
  topics: GeneratedTopicData[];
}

export interface CoursePlan {
  title: string;
  description: string;
  longDescription: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  whatYouWillLearn: string[];
  prerequisites: string[];
  targetProjects: string[];
  quizFrequency: "high" | "medium" | "low";
  capstoneDifficulty: "medium" | "hard";
  chapters: GeneratedChapterData[];
}

export interface CoursePlanWithMetadata extends CoursePlan {
  documentIndex: DocumentSection[];
  chunks: DocumentChunk[];
}

// Limits to prevent misuse
export const MAX_CHAPTERS_ALLOWED = 5;
export const MAX_TOPICS_PER_CHAPTER_ALLOWED = 4;
export const MAX_TOTAL_TOPICS_ALLOWED = 20;

export const SYSTEM_DOCUMENT_INDEX_PROMPT = `
You are the SabiLearn Document Structure Architect.
Your task is to analyze ALL chunks of the uploaded document and produce an Annotated Document Index.
You must organize all chunks into 3 to 5 coherent, sequential, pedagogical Sections that cover 100% of the material.

CRITICAL COVERAGE RULES (STRICTLY ENFORCED):
1. FULL COVERAGE GUARANTEE: Every single chunk index (from 0 to N-1) MUST be included in exactly one section's chunkIndices array. No chunk may be dropped, omitted, or skipped.
2. Group adjacent or conceptually related chunks together into cohesive sections.
3. For each section, provide:
   - "sectionId": "sec-1", "sec-2", etc.
   - "title": Clear, descriptive module title reflecting the actual content of those chunks.
   - "summary": 2-3 sentences explaining what is taught across these chunks.
   - "keyConcepts": 3-5 specific terminology, theorems, definitions, methods, or tools found in these chunks.
   - "chunkIndices": Array of integer chunk indices belonging to this section.

You MUST reply with ONLY valid JSON conforming to this schema:
{
  "sections": [
    {
      "sectionId": "sec-1",
      "title": "Module Title",
      "summary": "Summary of concepts...",
      "keyConcepts": ["Concept 1", "Concept 2"],
      "chunkIndices": [0, 1]
    }
  ]
}
`;

export const SYSTEM_PLAN_PROMPT = `
You are the SabiLearn AI Curriculum & Course Plan Architect.
Your job is to analyze the user's uploaded materials (text, notes, slides, images) and create a comprehensive, highly structured course outline in pure valid JSON.

PEDAGOGICAL & ARCHITECTURAL RULES (STRICTLY ENFORCED):
1. **Structure Caps**: The course outline MUST have between 3 and 5 Chapters (modules). Each chapter must have between 2 and 4 focused Topics.
2. **Full Document Coverage & Annotated Index Mapping**:
   When an ANNOTATED DOCUMENT INDEX is provided, your chapters MUST map directly to the sections in the index.
   - Chapter 1 MUST correspond to Section 1, Chapter 2 to Section 2, Chapter 3 to Section 3, and so on.
   - You MUST teach all key concepts listed in that section's keyConcepts.
   - Set "sourceSectionId" (e.g. "sec-1") and "chunkIndices" on each chapter object.
   - ZERO SECTIONS MAY BE DROPPED OR SKIPPED.
3. **Match the source discipline.** Read the uploaded notes before choosing a shape:
   - Programming, software, data, or commands: hands-on coding topics, \`hasCodingTask: true\` only on topics that actually practice code.
   - Mathematics, physics, chemistry, statistics, engineering, or economics: concept → definition → worked symbolic example. \`hasCodingTask\` stays false unless the notes are about computing. \`practiceTaskSummary\` is a worked problem or derivation, not a coding task.
   - Humanities, law, business, medicine, or other prose subjects: argument, cases, and applied examples. Do not invent programming projects or code tasks.
4. **Pedagogy**: Progressive mastery. Short topics. One idea per topic.
5. **Applied work**: Include 1 to 3 milestone applications that fit the subject (a small program, a problem set, a lab-style calculation, a case write-up, or a source analysis). Do not force software projects onto non-coding courses.
6. **Chapter Capstones**: Every chapter must have a clear Capstone Assessment goal evaluating deep comprehension of THAT subject's skills (debugging for code, symbolic reasoning for quantitative subjects, argument and application for prose subjects).

You MUST reply with ONLY valid JSON conforming to this exact TypeScript schema:
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
      "sourceSectionId": "sec-1",
      "chunkIndices": [0, 1],
      "capstoneGoal": "What the chapter assessment tests",
      "topics": [
        {
          "id": "t-1-1",
          "title": "Topic Title",
          "description": "Topic summary",
          "order": 0,
          "subConcepts": ["Sub-concept 1", "Sub-concept 2"],
          "hasCodingTask": false,
          "practiceTaskSummary": "Worked example, problem, or coding task — whichever fits this subject"
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
1. **Tone & Language:** Write for an absolute beginner. Use friendly, plain English. NEVER use "big grammar", pretentious vocabulary, or unexplained technical jargon. Define a new term the first time it appears.
2. **Paragraph Length:** Every paragraph must be SHORT (1 to 3 sentences max) so it is effortless to read on mobile and web screens.
3. **Real-Life Analogies:** Use vivid, relatable everyday analogies when they clarify the idea. Skip forced analogies in formal proofs or definitions.
4. **Repetition & Remember Formulas:** Every sub-concept text block MUST conclude with a bold takeaway:
   "Remember: [Simple, memorable summary rule repeating the core concept]"
5. **Flow Structure:** Contents array MUST alternate between:
   - \`group\` sections containing 2-4 blocks.
   - \`quiz\` items testing the immediate preceding concept.
6. **Choose block types for the subject. Do not default to code.**
   - Programming, shell, SQL, or markup: \`code\` blocks with a correct \`language\` (javascript, python, sql, html, css, bash, java, cpp, json). Short, commented, runnable snippets. Explain each snippet in a \`text\` block before or after it.
   - Mathematics, physics, chemistry, statistics, engineering, or economics: \`latex\` blocks for every formula, derivation step, chemical equation, or symbolic worked example. Prose stays in \`text\` blocks. LaTeX content is the expression only (no surrounding $$ or markdown fences). Example content: "E = mc^2" or "\\frac{d}{dx} x^n = n x^{n-1}". Use \`code\` only when the topic is actually about a program.
   - Humanities, law, business, or medicine: mostly \`text\`. A \`latex\` block only for a symbol or short formula that the notes actually use. No code blocks.
7. **Inline math in prose or quizzes:** wrap short symbols in single dollars, for example "the slope is $m = \\frac{\\Delta y}{\\Delta x}$". Put long displays in their own \`latex\` block, not inside a paragraph.
8. **Quizzes:**
   - 1 clear correct answer (\`isCorrect: true\`).
   - 2-3 realistic distractors (\`isCorrect: false\`).
   - An \`explanation\` that explicitly repeats the "Remember: ..." takeaway.
   - For quantitative topics, the question or an option may include inline \`$...$\` LaTeX. Do not ask the student to debug code unless the topic is about code.

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
          "type": "latex",
          "content": "a^2 + b^2 = c^2"
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
- DO NOT ask superficial or trivial definition questions (e.g. "What does HTML stand for?" or "State Newton's second law").
- Match the question style to the subject:
  1. **Programming:** code reading, debugging, output prediction, edge cases, and why one approach beats another. Put snippets in the question as plain fenced-free text the student can read.
  2. **Quantitative (math, physics, chemistry, statistics, engineering, economics):** multi-step reasoning, unit checks, choose the correct next line of a derivation, interpret a result, or spot an invalid step. Write formulas with inline \`$...$\` or display \`$$...$$\` LaTeX inside the question, options, correctAnswer, and explanation strings. The JSON itself must stay valid (escape backslashes).
  3. **Prose subjects (humanities, law, business, medicine):** apply a concept to a short case, compare two interpretations, or identify the strongest evidence. No code and no decorative formulas.
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
      "question": "Scenario, derivation, or case question. Quantitative formulas use $...$ LaTeX.",
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
    return process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  }

  private static get apiKey(): string | undefined {
    return process.env.DEEPSEEK_API_KEY;
  }

  private static get model(): string {
    return process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  }

  /**
   * Helper to send JSON prompts to DeepSeek API with optional Multimodal Image attachments.
   */
  public static async callDeepSeekJson<T>(
    systemPrompt: string,
    userTextPrompt: string,
    imageAttachments: string[] = [],
    temperature = 0.4,
  ): Promise<T> {
    const apiKey = this.apiKey;

    if (!apiKey) {
      console.warn(
        "DEEPSEEK_API_KEY is not set. Generating mock structured response.",
      );
      return this.generateMockResponse<T>(systemPrompt, userTextPrompt);
    }

    let userMessageContent: any = userTextPrompt;

    if (imageAttachments && imageAttachments.length > 0) {
      userMessageContent = [
        {
          type: "text",
          text: userTextPrompt,
        },
        ...imageAttachments.map((imgUrl) => ({
          type: "image_url",
          image_url: {
            url: imgUrl,
          },
        })),
      ];
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessageContent },
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error [${response.status}]: ${errorText}`);
        throw new Error(
          `DeepSeek API request failed with status ${response.status}: ${errorText}`,
        );
      }

      const jsonResponse = await response.json();
      const rawContent = jsonResponse.choices?.[0]?.message?.content || "{}";

      try {
        return JSON.parse(rawContent) as T;
      } catch {
        const cleaned = rawContent
          .replace(/```(?:json)?\n?|\n?```/g, "")
          .trim();
        return JSON.parse(cleaned) as T;
      }
    } catch (error: any) {
      console.warn(
        "DeepSeek call error, falling back to structured generator:",
        error.message,
      );
      return this.generateMockResponse<T>(systemPrompt, userTextPrompt);
    }
  }

  /**
   * Phase 1 (Macro): Full Document Structure & Section Indexing.
   * Generates an Annotated Document Index grouping 100% of chunks into 3 to 5 logical sections.
   */
  public static async buildAnnotatedDocumentIndex(
    chunks: DocumentChunk[],
    subjectHint = "",
  ): Promise<DocumentSection[]> {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    if (chunks.length === 1) {
      return [
        {
          sectionId: "sec-1",
          title: subjectHint || chunks[0].title || "Core Foundations",
          summary: chunks[0].content.slice(0, 300),
          keyConcepts: ["Overview", "Core Principles"],
          chunkIndices: [0],
        },
      ];
    }

    const chunkSummaries = chunks
      .map(
        (c) =>
          `[Chunk ${c.index}] Title: "${c.title}" (~${c.wordCount} words)\nExcerpt: ${c.content.slice(0, 280).replace(/\s+/g, " ")}...`,
      )
      .join("\n\n");

    const prompt = `
Uploaded document contains ${chunks.length} chunks covering the topic: "${subjectHint || "Academic Study"}".
Analyze all ${chunks.length} chunks below and group them into 3 to 5 coherent, sequential course modules.
CRITICAL: Every chunk index from 0 to ${chunks.length - 1} must be present in chunkIndices. Zero chunks may be skipped.

DOCUMENT CHUNKS OVERVIEW:
${chunkSummaries}
`;

    try {
      const response = await this.callDeepSeekJson<{ sections: DocumentSection[] }>(
        SYSTEM_DOCUMENT_INDEX_PROMPT,
        prompt,
        [],
        0.2,
      );

      let sections = Array.isArray(response?.sections) ? response.sections : [];

      // Fallback partitioning if LLM returned malformed sections
      if (sections.length === 0) {
        sections = this.fallbackPartitionChunks(chunks, subjectHint);
      }

      // Enforce 100% Chunk Coverage Guarantee: check if any chunk was omitted
      const assignedIndices = new Set<number>();
      sections.forEach((sec, idx) => {
        sec.sectionId = sec.sectionId || `sec-${idx + 1}`;
        sec.chunkIndices = Array.isArray(sec.chunkIndices) ? sec.chunkIndices : [];
        sec.chunkIndices.forEach((i) => assignedIndices.add(i));
      });

      // Add any missing chunk indices to the nearest section
      for (let i = 0; i < chunks.length; i++) {
        if (!assignedIndices.has(i)) {
          const targetSection = sections[sections.length - 1];
          targetSection.chunkIndices.push(i);
          assignedIndices.add(i);
        }
      }

      return sections;
    } catch (err: any) {
      console.warn("Annotated index generation error, using fallback partitioning:", err.message);
      return this.fallbackPartitionChunks(chunks, subjectHint);
    }
  }

  /**
   * Deterministic fallback: partitions all chunks evenly into 3-5 sections covering 100% of material.
   */
  private static fallbackPartitionChunks(chunks: DocumentChunk[], subjectHint: string): DocumentSection[] {
    const totalChunks = chunks.length;
    const numSections = Math.min(5, Math.max(3, Math.ceil(totalChunks / 2)));
    const sections: DocumentSection[] = [];
    const chunkSize = Math.ceil(totalChunks / numSections);

    for (let s = 0; s < numSections; s++) {
      const startIdx = s * chunkSize;
      const endIdx = Math.min(totalChunks, startIdx + chunkSize);
      const sectionChunkIndices: number[] = [];
      for (let c = startIdx; c < endIdx; c++) {
        sectionChunkIndices.push(c);
      }

      if (sectionChunkIndices.length > 0) {
        const firstChunk = chunks[sectionChunkIndices[0]];
        sections.push({
          sectionId: `sec-${s + 1}`,
          title: firstChunk?.title || `Module ${s + 1}: ${subjectHint || "Study Block"}`,
          summary: `Covers material from document chunks ${sectionChunkIndices.map((i) => i + 1).join(", ")}.`,
          keyConcepts: ["Fundamental Concepts", "Applications"],
          chunkIndices: sectionChunkIndices,
        });
      }
    }

    return sections;
  }

  /**
   * Phase 1 (Macro): Generate a comprehensive Course Plan from extracted text, chunks, and images.
   * Ensures 100% document coverage by mapping chapters to the Annotated Document Index.
   */
  public static async generatePlan(options: {
    courseTitle?: string;
    userGuidePrompt?: string;
    extractedText?: string;
    imageAttachments?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    clarificationAnswers?: Record<string, any>;
    chunks?: DocumentChunk[];
  }): Promise<CoursePlanWithMetadata> {
    const {
      courseTitle = "",
      userGuidePrompt = "",
      extractedText = "",
      imageAttachments = [],
      difficulty = "beginner",
      clarificationAnswers,
      chunks = [],
    } = options;

    // Step 1: Build Phase 1 Annotated Document Index covering 100% of chunks
    const documentIndex = await this.buildAnnotatedDocumentIndex(
      chunks,
      courseTitle || userGuidePrompt,
    );

    let userPrompt = `Please formulate a complete, highly structured course outline for SabiLearn.\n`;

    if (courseTitle) {
      userPrompt += `TARGET COURSE TITLE: "${courseTitle}"\n`;
    }

    if (userGuidePrompt) {
      userPrompt += `USER COURSE INSTRUCTIONS & SCOPE:\n${userGuidePrompt}\n\n`;
    }

    if (documentIndex.length > 0) {
      userPrompt += `ANNOTATED DOCUMENT INDEX (COVERS 100% OF UPLOADED MATERIAL ACROSS ALL ${chunks.length} CHUNKS):\n`;
      userPrompt += `${JSON.stringify(documentIndex, null, 2)}\n\n`;
      userPrompt += `MANDATORY FULL-COVERAGE CHAPTER MAPPING RULE:\n`;
      userPrompt += `- The course chapters MUST align with the ${documentIndex.length} sections in the Annotated Document Index.\n`;
      userPrompt += `- Chapter 1 maps to Section 1 ("${documentIndex[0]?.title}"), Chapter 2 maps to Section 2, and so on.\n`;
      userPrompt += `- In each chapter output, set "sourceSectionId" (e.g. "sec-1") and "chunkIndices".\n`;
      userPrompt += `- Ensure EVERY keyConcept from each section is explicitly taught in that chapter's topics.\n\n`;
    } else if (extractedText) {
      userPrompt += `EXTRACTED SOURCE MATERIAL / DOCUMENT CONTENT:\n${extractedText.slice(0, 15000)}\n\n`;
    }

    if (imageAttachments.length > 0) {
      userPrompt += `NOTE: ${imageAttachments.length} normalized image(s) / handwritten notes / slides are attached for visual analysis. Extract key concepts and incorporate them.\n\n`;
    }

    if (clarificationAnswers && Object.keys(clarificationAnswers).length > 0) {
      userPrompt += `USER PARAMETERS:\n${JSON.stringify(clarificationAnswers, null, 2)}\n\n`;
    }

    userPrompt += `DIFFICULTY TARGET: ${difficulty.toUpperCase()}\n`;
    userPrompt += `Ensure the plan has between 3 and ${MAX_CHAPTERS_ALLOWED} chapters, with 2 to ${MAX_TOPICS_PER_CHAPTER_ALLOWED} topics per chapter, milestone projects, and capstone goals.`;

    const plan = await this.callDeepSeekJson<CoursePlan>(
      SYSTEM_PLAN_PROMPT,
      userPrompt,
      imageAttachments,
      0.4,
    );

    // Normalize chapters and assign section bindings
    if (plan.chapters && Array.isArray(plan.chapters)) {
      if (plan.chapters.length > MAX_CHAPTERS_ALLOWED) {
        plan.chapters = plan.chapters.slice(0, MAX_CHAPTERS_ALLOWED);
      }

      let totalTopicsCount = 0;

      plan.chapters.forEach((ch, chIdx) => {
        ch.id = ch.id || `ch-${chIdx + 1}`;
        ch.order = typeof ch.order === "number" ? ch.order : chIdx;
        ch.title = ch.title || `Chapter ${chIdx + 1}`;
        ch.description = ch.description || "";
        ch.capstoneGoal = ch.capstoneGoal || "Evaluate mastery of chapter topics";

        // Bind source section and chunks if available
        const matchingSection = documentIndex[chIdx];
        if (matchingSection) {
          ch.sourceSectionId = ch.sourceSectionId || matchingSection.sectionId;
          ch.chunkIndices = ch.chunkIndices || matchingSection.chunkIndices;
        }

        if (ch.topics && Array.isArray(ch.topics)) {
          if (ch.topics.length > MAX_TOPICS_PER_CHAPTER_ALLOWED) {
            ch.topics = ch.topics.slice(0, MAX_TOPICS_PER_CHAPTER_ALLOWED);
          }

          if (totalTopicsCount + ch.topics.length > MAX_TOTAL_TOPICS_ALLOWED) {
            ch.topics = ch.topics.slice(
              0,
              Math.max(0, MAX_TOTAL_TOPICS_ALLOWED - totalTopicsCount),
            );
          }
          totalTopicsCount += ch.topics.length;

          ch.topics.forEach((t, tIdx) => {
            t.id = t.id || `t-${chIdx + 1}-${tIdx + 1}`;
            t.order = typeof t.order === "number" ? t.order : tIdx;
            t.title = t.title || `Topic ${tIdx + 1}`;
            t.subConcepts = Array.isArray(t.subConcepts) ? t.subConcepts : [];
            t.sectionId = t.sectionId || ch.sourceSectionId;
            t.sourceChunkIndices = t.sourceChunkIndices || ch.chunkIndices;
          });
        }
      });
    }

    return {
      ...plan,
      documentIndex,
      chunks,
    };
  }

  /**
   * Phase 2 (Micro): Targeted Context Injection.
   * Retrieves specific chunks tied to this topic's chapter/sub-concepts rather than blind truncation.
   */
  public static getRelevantTopicContext(options: {
    chapterTitle: string;
    topicTitle: string;
    subConcepts?: string[];
    sourceContext?: string;
    chunks?: DocumentChunk[];
    documentIndex?: DocumentSection[];
    sectionId?: string;
    sourceChunkIndices?: number[];
    chapterIndex?: number;
  }): string {
    const {
      chapterTitle,
      topicTitle,
      subConcepts = [],
      sourceContext = "",
      chunks = [],
      documentIndex = [],
      sectionId,
      sourceChunkIndices,
      chapterIndex,
    } = options;

    // Strategy 1: Targeted retrieval from structured Chunks & Document Index
    if (chunks && chunks.length > 0) {
      let targetChunkIndices: number[] = [];

      if (Array.isArray(sourceChunkIndices) && sourceChunkIndices.length > 0) {
        targetChunkIndices = [...sourceChunkIndices];
      } else if (sectionId && documentIndex && documentIndex.length > 0) {
        const matchingSection = documentIndex.find((s) => s.sectionId === sectionId);
        if (matchingSection && matchingSection.chunkIndices?.length > 0) {
          targetChunkIndices = [...matchingSection.chunkIndices];
        }
      } else if (chapterIndex !== undefined && documentIndex && documentIndex.length > chapterIndex) {
        targetChunkIndices = [...(documentIndex[chapterIndex]?.chunkIndices || [])];
      } else {
        // Fallback: search keywords across chunks
        const queryTerms = [chapterTitle, topicTitle, ...subConcepts]
          .join(" ")
          .toLowerCase()
          .split(/\W+/)
          .filter((t) => t.length > 3);

        const scoredChunks = chunks.map((chunk) => {
          const lower = chunk.content.toLowerCase();
          let score = 0;
          for (const term of queryTerms) {
            if (lower.includes(term)) score += 1;
          }
          return { index: chunk.index, score };
        });

        scoredChunks.sort((a, b) => b.score - a.score);
        targetChunkIndices = scoredChunks.filter((s) => s.score > 0).slice(0, 3).map((s) => s.index);
        if (targetChunkIndices.length === 0 && chunks.length > 0) {
          const fallbackIdx = Math.min(chunks.length - 1, chapterIndex || 0);
          targetChunkIndices = [fallbackIdx];
        }
      }

      const selectedChunks = chunks.filter((c) => targetChunkIndices.includes(c.index));
      if (selectedChunks.length > 0) {
        const assembledText = selectedChunks
          .map((c) => `--- SECTION CONTEXT: ${c.title} (Chunk ${c.index + 1} of ${chunks.length}) ---\n${c.content}`)
          .join("\n\n");
        return assembledText.slice(0, 18000);
      }
    }

    // Strategy 2: Fallback for unstructured raw sourceContext (legacy courses)
    if (sourceContext && sourceContext.trim().length > 0) {
      const sections = sourceContext.split(/(?=\n--- CONTENT FROM DOCUMENT|\n#{1,3}\s|\nChapter\s+\d+)/i);
      if (sections.length > 1 && chapterIndex !== undefined) {
        const proportionalIdx = Math.min(
          sections.length - 1,
          Math.floor((chapterIndex / Math.max(1, (options.chapterIndex || 1) + 2)) * sections.length),
        );
        const matched = sections[proportionalIdx];
        if (matched && matched.trim().length > 100) {
          return matched.slice(0, 15000);
        }
      }
      return sourceContext.slice(0, 15000);
    }

    return "";
  }

  /** Pull display-math out of prose into real latex blocks, and strip delimiters on latex blocks. */
  private static normalizeBlocks(blocks: GeneratedTopicBlock[] | undefined): GeneratedTopicBlock[] {
    const out: GeneratedTopicBlock[] = [];
    for (const block of blocks || []) {
      if (!block || typeof block.content !== "string") continue;
      if (block.type === "latex") {
        const content = block.content
          .trim()
          .replace(/^\$\$([\s\S]*)\$\$$/, "$1")
          .replace(/^\\\[([\s\S]*)\\\]$/, "$1")
          .replace(/```(?:latex)?/g, "")
          .trim();
        if (content) out.push({ type: "latex", content });
        continue;
      }
      if (block.type === "code") {
        out.push({
          type: "code",
          content: block.content.replace(/^```[\w-]*\n?/, "").replace(/```$/, "").trim(),
          language: (block.language || "text").toLowerCase(),
        });
        continue;
      }
      if (block.type !== "text" || !/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]/.test(block.content)) {
        out.push(block);
        continue;
      }
      const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g;
      let last = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(block.content))) {
        const before = block.content.slice(last, match.index).trim();
        if (before) out.push({ type: "text", content: before });
        const tex = (match[1] ?? match[2] ?? "").trim();
        if (tex) out.push({ type: "latex", content: tex });
        last = match.index + match[0].length;
      }
      const after = block.content.slice(last).trim();
      if (after) out.push({ type: "text", content: after });
    }
    return out;
  }

  /**
   * Generate rich step-by-step lesson content for a specific topic with Targeted Context Injection.
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
    category?: string;
    sourceContext?: string;
    chunks?: DocumentChunk[];
    documentIndex?: DocumentSection[];
    sectionId?: string;
    sourceChunkIndices?: number[];
    chapterIndex?: number;
    topicIndex?: number;
  }): Promise<GeneratedTopicData> {
    const {
      courseTitle,
      chapterTitle,
      topicTitle,
      topicDescription,
      subConcepts = [],
      hasCodingTask = false,
      practiceTaskSummary = "",
      order = 0,
      difficulty = "beginner",
      category = "",
    } = options;

    // Phase 2 Micro: Extract the exact, targeted source context for this topic
    const targetedSourceContext = this.getRelevantTopicContext(options);

    const sourceSection =
      targetedSourceContext && targetedSourceContext.trim().length > 0
        ? `
SOURCE MATERIAL / REFERENCE NOTES (Targeted context specifically grounded in this chapter's source chunks):
"""
${targetedSourceContext}
"""

CRITICAL GROUNDING INSTRUCTION:
- Draw specific explanations, definitions, formulas, examples, terminology, and key takeaways directly from the provided source material above.
- Do not fabricate alternative terms or methods if the source material establishes specific ones.
`
        : "";

    const userPrompt = `
Generate complete, step-by-step SabiLearn lesson content for this topic:

COURSE: "${courseTitle || "Course"}"
CHAPTER: "${chapterTitle || "Chapter"}"
TOPIC TITLE: "${topicTitle}"
DESCRIPTION: "${topicDescription}"
SUB-CONCEPTS TO TEACH: ${JSON.stringify(subConcepts)}
INCLUDES HANDS-ON TASK: ${hasCodingTask ? "Yes: " + practiceTaskSummary : "No"}
TOPIC ORDER: ${order}
DIFFICULTY: ${difficulty}
CATEGORY: ${category || "Infer from the course and topic titles"}
${sourceSection}
CRITICAL RULES:
1. Explain to an absolute beginner in plain, friendly English with short 1-3 sentence paragraphs.
2. Ground all explanations and examples in the uploaded source material / reference notes if provided.
3. Use a relatable analogy only when it truly helps.
4. Contents MUST alternate between 'group' sections and in-lesson 'quiz' check-ins.
5. Each group contains 2-4 blocks. Use text for prose, latex for formulas (expression only, no $$ wrappers), and code only for programming topics (include language).
6. Academic topics (math, science, engineering, statistics, economics) MUST include latex blocks for the key formula and for one worked step. Do not replace formulas with ASCII art.
7. EVERY single sub-concept text block MUST conclude with:
   "Remember: [Simple summary takeaway rule repeating the core concept]"
8. In-lesson quizzes must test the immediate preceding concept, have 1 correct answer, and an explanation starting with "Remember: ...". Quantitative questions may use inline $...$ LaTeX.
`;

    const topicData = await this.callDeepSeekJson<GeneratedTopicData>(
      SYSTEM_TOPIC_PROMPT,
      userPrompt,
      [],
      0.3,
    );

    topicData.order = order;
    topicData.xp = 50;
    topicData.sectionId = options.sectionId;
    topicData.sourceChunkIndices = options.sourceChunkIndices;

    if (Array.isArray(topicData.contents)) {
      topicData.contents = topicData.contents.map((item) => {
        if (item?.type === "group" && Array.isArray(item.blocks)) {
          return { ...item, blocks: this.normalizeBlocks(item.blocks) };
        }
        return item;
      });
    }

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
    category?: string;
    sourceContext?: string;
  }): Promise<ChapterExercise> {
    const {
      courseTitle,
      chapterTitle,
      chapterDescription = "",
      capstoneGoal = "",
      topics = [],
      difficulty = "medium",
      category = "",
      sourceContext = "",
    } = options;

    const sourceSection =
      sourceContext && sourceContext.trim().length > 0
        ? `
SOURCE MATERIAL / REFERENCE NOTES:
"""
${sourceContext.slice(0, 15000)}
"""
`
        : "";

    const userPrompt = `
Generate a Chapter Capstone Assessment with 8 to 10 MEDIUM and HARD difficulty scenario questions for SabiLearn:

COURSE: "${courseTitle}"
CHAPTER: "${chapterTitle}"
DESCRIPTION: "${chapterDescription}"
CAPSTONE ASSESSMENT GOAL: "${capstoneGoal || "Evaluate complete mastery of chapter topics"}"
TOPICS COVERED:
${topics.map((t, i) => `${i + 1}. ${t.title}: ${t.description}`).join("\n")}
DIFFICULTY LEVEL: ${difficulty.toUpperCase()} (MEDIUM & HARD)
CATEGORY: ${category || "Infer from the course title"}
${sourceSection}
CRITICAL RULES:
1. Match the subject. Programming: debugging, output, and edge cases. Quantitative subjects: derivations and formula choices written with $...$ or $$...$$ LaTeX inside the strings. Prose subjects: cases and arguments. Do not write code questions for a non-coding chapter.
2. Ground questions and scenarios in the source material context if provided.
3. DO NOT ask simple definition questions.
4. Every question must have 4 options, 1 correctAnswer, xp: 20, and a detailed pedagogical explanation. If a formula appears in the question, the explanation should show the key step in LaTeX too.
`;

    const exercise = await this.callDeepSeekJson<ChapterExercise>(
      SYSTEM_CAPSTONE_PROMPT,
      userPrompt,
      [],
      0.3,
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
    difficulty?: "beginner" | "intermediate" | "advanced";
    chunks?: DocumentChunk[];
    onProgress?: (progressText: string) => void;
  }): Promise<{ plan: CoursePlanWithMetadata; generatedChapters: GeneratedChapterData[] }> {
    const { onProgress } = options;

    onProgress?.("Generating Course Outline & Curriculum Plan...");
    const planResult = await this.generatePlan(options);

    const chapterPromises = planResult.chapters.map(async (ch, chIdx) => {
      onProgress?.(
        `Generating Chapter ${chIdx + 1}: "${ch.title}" (${ch.topics.length} topics)...`,
      );

      const topicPromises = ch.topics.map((t, tIdx) =>
        this.generateTopicContent({
          courseTitle: planResult.title,
          chapterTitle: ch.title,
          topicTitle: t.title,
          topicDescription: t.description,
          subConcepts: t.subConcepts,
          hasCodingTask: t.hasCodingTask,
          practiceTaskSummary: t.practiceTaskSummary,
          order: tIdx,
          difficulty: planResult.difficulty,
          category: planResult.category,
          sourceContext: options.extractedText,
          chunks: planResult.chunks,
          documentIndex: planResult.documentIndex,
          sectionId: ch.sourceSectionId,
          sourceChunkIndices: ch.chunkIndices,
          chapterIndex: chIdx,
          topicIndex: tIdx,
        }),
      );

      const capstonePromise = this.generateCapstoneAssessment({
        courseTitle: planResult.title,
        chapterTitle: ch.title,
        chapterDescription: ch.description,
        capstoneGoal: ch.capstoneGoal,
        topics: ch.topics,
        difficulty: planResult.capstoneDifficulty || "medium",
        category: planResult.category,
        sourceContext: options.extractedText,
      });

      const [generatedTopics, capstoneExercise] = await Promise.all([
        Promise.all(topicPromises),
        capstonePromise,
      ]);

      return {
        ...ch,
        exercise: capstoneExercise,
        topics: generatedTopics,
      };
    });

    const generatedChapters = await Promise.all(chapterPromises);

    return {
      plan: planResult,
      generatedChapters,
    };
  }

  /**
   * Deterministic mock generator for environments without DEEPSEEK_API_KEY.
   */
  private static generateMockResponse<T>(
    systemPrompt: string,
    userTextPrompt: string,
  ): T {
    if (systemPrompt.includes("Document Structure Architect")) {
      const mockSections = {
        sections: [
          {
            sectionId: "sec-1",
            title: "Foundations & Mental Models",
            summary: "Core principles and introductory terminology.",
            keyConcepts: ["Definitions", "Architecture", "Syntax"],
            chunkIndices: [0],
          },
          {
            sectionId: "sec-2",
            title: "Practical Workflows & Implementation",
            summary: "Hands-on execution and fundamental techniques.",
            keyConcepts: ["Variables", "Operations", "Functions"],
            chunkIndices: [1],
          },
        ],
      };
      return mockSections as unknown as T;
    }

    if (systemPrompt.includes("Curriculum & Course Plan")) {
      const mockPlan: CoursePlan = {
        title: userTextPrompt.includes("Git")
          ? "Practical Git & GitHub Fundamentals"
          : "Complete Mastery Course",
        description: "A fast, beginner-friendly curriculum.",
        longDescription:
          "Master core principles with relatable everyday analogies and practical quizzes.",
        category: "Programming",
        difficulty: "beginner",
        whatYouWillLearn: [
          "Core mental models",
          "Working with data",
          "Conditional logic",
          "Real-world application",
        ],
        prerequisites: ["Curiosity to learn"],
        targetProjects: ["Hands-on Capstone Demonstration"],
        quizFrequency: "high",
        capstoneDifficulty: "medium",
        chapters: [
          {
            id: "ch-1",
            title: "Foundations & Mental Models",
            description: "Build a rock-solid mental framework.",
            order: 0,
            sourceSectionId: "sec-1",
            chunkIndices: [0],
            capstoneGoal: "Evaluate core concepts and terminology.",
            topics: [
              {
                id: "t-1-1",
                title: "Introduction & Core Mental Models",
                description:
                  "Overview of key concepts and practical analogies.",
                order: 0,
                subConcepts: [
                  "Core definition",
                  "Analogy & real-world mapping",
                ],
                hasCodingTask: true,
                practiceTaskSummary: "Run your first interactive example",
              },
              {
                id: "t-1-2",
                title: "Working with Data & Variables",
                description:
                  "Storing, retrieving, and manipulating essential information.",
                order: 1,
                subConcepts: [
                  "Declaring values",
                  "Data types & transformations",
                ],
                hasCodingTask: true,
                practiceTaskSummary:
                  "Create variables and perform basic operations",
              },
            ],
          },
          {
            id: "ch-2",
            title: "Control Flow & Logic",
            description:
              "Directing execution pathways and handling different conditions.",
            order: 1,
            sourceSectionId: "sec-2",
            chunkIndices: [1],
            capstoneGoal:
              "Evaluate problem solving with conditional logic and loops.",
            topics: [
              {
                id: "t-2-1",
                title: "Conditional Branching",
                description: "Making smart decisions in code.",
                order: 0,
                subConcepts: ["If-else statements", "Comparison operators"],
                hasCodingTask: true,
                practiceTaskSummary: "Write logic to handle user choices",
              },
              {
                id: "t-2-2",
                title: "Iterative Loops & Sequences",
                description: "Automating repetitive actions effectively.",
                order: 1,
                subConcepts: [
                  "For and While loops",
                  "Iterating over collections",
                ],
                hasCodingTask: true,
                practiceTaskSummary: "Process arrays and repeat operations",
              },
            ],
          },
        ],
      };
      return mockPlan as unknown as T;
    }

    if (systemPrompt.includes("Topic Content Generator")) {
      const mockTopic: GeneratedTopicData = {
        title: "Core Concept Mastery",
        description:
          "Understand the fundamental ideas with clear analogies and examples.",
        order: 0,
        subConcepts: ["Core definition", "Working with storage"],
        xp: 50,
        contents: [
          {
            type: "group",
            content: "Core Introduction",
            blocks: [
              {
                type: "text",
                content:
                  "Welcome to this lesson! Let us explore how this concept works in everyday life.\n\nImagine you have an organized storage box where every item has a specific labeled compartment.\n\nRemember: Keeping your data cleanly labeled prevents mistakes and makes your code reliable.",
              },
              {
                type: "code",
                content:
                  '// Example declaration\nconst box = "tools";\nconsole.log("Storage item:", box);',
                language: "javascript",
              },
            ],
          },
          {
            type: "quiz",
            content: "Concept Check-In",
            quiz: {
              question:
                "Why is it important to clearly structure your variables and data?",
              options: [
                {
                  text: "It prevents errors and makes logic easy to understand",
                  isCorrect: true,
                },
                { text: "It disables error checking", isCorrect: false },
                { text: "It forces synchronous blocking", isCorrect: false },
              ],
              explanation:
                "Remember: Keeping your data cleanly labeled prevents mistakes and makes your code reliable.",
            },
          },
        ],
      };
      return mockTopic as unknown as T;
    }

    if (systemPrompt.includes("Capstone Assessment")) {
      const mockCapstone: ChapterExercise = {
        title: "Chapter Capstone Assessment",
        instructions:
          "Test your mastery of chapter concepts with scenario-based questions.",
        questions: [
          {
            type: "mcq",
            question:
              "Consider a scenario where a variable is referenced outside its declaration scope. What happens?",
            options: [
              "A ReferenceError is thrown because the variable is not in scope",
              "The value defaults to null silently",
              "The program crashes the whole browser",
              "It automatically becomes a global variable",
            ],
            correctAnswer:
              "A ReferenceError is thrown because the variable is not in scope",
            explanation:
              "Variables declared inside block scopes cannot be accessed outside of them, resulting in a ReferenceError.",
            xp: 20,
          },
        ],
      };
      return mockCapstone as unknown as T;
    }

    return {} as T;
  }
}
