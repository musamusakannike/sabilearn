import dotenv from "dotenv";
dotenv.config();

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  onChunk?: (chunk: string) => void;
}

export interface QuizQuestionGenerated {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation: string;
}

export interface FlashcardGenerated {
  front: string;
  back: string;
}

export class DeepSeekService {
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
   * Main method to invoke DeepSeek Chat Completion with streaming capability.
   * If DEEPSEEK_API_KEY is missing, simulates realistic dummy streaming responses.
   */
  public static async streamChatCompletion(
    messages: DeepSeekMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const apiKey = this.apiKey;

    // Fallback to simulated dummy response if no API key is provided
    if (!apiKey) {
      return this.simulateDummyStream(messages, onChunk);
    }

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
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error [${response.status}]: ${errorText}`);
        throw new Error(
          `DeepSeek API request failed with status ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body returned from DeepSeek API stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.slice(6);
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content || "";
              if (deltaContent) {
                fullText += deltaContent;
                onChunk(deltaContent);
              }
            } catch (err) {
              // Ignore partial JSON parse errors on stream chunk boundary
            }
          }
        }
      }

      // Handle any trailing buffer
      if (
        buffer.trim() &&
        buffer.trim() !== "data: [DONE]" &&
        buffer.startsWith("data: ")
      ) {
        try {
          const parsed = JSON.parse(buffer.slice(6));
          const deltaContent = parsed.choices?.[0]?.delta?.content || "";
          if (deltaContent) {
            fullText += deltaContent;
            onChunk(deltaContent);
          }
        } catch (_) {}
      }

      return fullText;
    } catch (error: any) {
      console.warn(
        "Falling back to dummy AI streaming due to DeepSeek API error:",
        error.message,
      );
      return this.simulateDummyStream(messages, onChunk);
    }
  }

  /**
   * Helper to simulate real-time streaming when no key is set or API fails.
   */
  private static async simulateDummyStream(
    messages: DeepSeekMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const lastUserMessage =
      messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
    const systemPrompt =
      messages.find((m) => m.role === "system")?.content || "";

    let fullResponse = "";

    if (systemPrompt.includes("SUMMARIZER")) {
      fullResponse = `**Summary:**\n- Key Concept: ${lastUserMessage.slice(0, 50)}...\n- Highlighting core principles, key terms, and active recall points for effective study.\n- Remember to review flashcards and test yourself with quiz practice for maximum retention.`;
    } else if (systemPrompt.includes("QUIZ_GENERATOR")) {
      fullResponse = JSON.stringify(
        [
          {
            question: `What is the core principle of ${lastUserMessage.slice(0, 30)}?`,
            options: [
              {
                text: "Fundamental building block and standard execution context",
                isCorrect: true,
              },
              { text: "Secondary legacy fallback option", isCorrect: false },
              { text: "Unused dynamic property identifier", isCorrect: false },
              { text: "Global static override scope", isCorrect: false },
            ],
            explanation:
              "This option represents the core definition according to standard documentation.",
          },
          {
            question: `Which scenario best demonstrates practical usage of ${lastUserMessage.slice(0, 30)}?`,
            options: [
              {
                text: "Encapsulating private state and preventing scope leaks",
                isCorrect: true,
              },
              { text: "Forcing synchronous thread blocking", isCorrect: false },
              {
                text: "Bypassing strict type validation checks",
                isCorrect: false,
              },
              {
                text: "Direct hardware memory address allocation",
                isCorrect: false,
              },
            ],
            explanation:
              "Encapsulation and scope isolation are primary design objectives.",
          },
        ],
        null,
        2,
      );
    } else if (systemPrompt.includes("FLASHCARD_GENERATOR")) {
      fullResponse = JSON.stringify(
        [
          {
            front: `What is ${lastUserMessage.slice(0, 30)}?`,
            back: "A central concept in this domain that encapsulates key functionality and structure.",
          },
          {
            front: `Why is ${lastUserMessage.slice(0, 30)} important?`,
            back: "It allows modularity, efficient performance, and reliable state management.",
          },
        ],
        null,
        2,
      );
    } else if (systemPrompt.includes("TUTOR_ELI5")) {
      fullResponse = `### In Simple Terms (ELI5)\n\nImagine you have a magic box that remembers whatever you put inside it, even after you close the lid.\n\n- **The Big Idea**: That's essentially what is happening here! Instead of getting lost in technical definitions, think of this concept as a way to keep things organized and reachable whenever needed.\n- **Why it matters**: It prevents mistakes and keeps your work clean.\n- **Quick takeaway**: Master the core rule first, and the rest becomes straightforward.`;
    } else if (systemPrompt.includes("TUTOR_ANALOGY")) {
      fullResponse = `### Real-World Analogy\n\nThink of this like **ordering food at a restaurant kitchen**:\n\n1. **The Order Ticket**: When you place an order, the waiter writes it down and pins it up.\n2. **The Chef's Workflow**: The chef doesn't need to know who ordered it or why; they just execute the recipe step-by-step according to that ticket.\n3. **The Connection**: In the same way, this concept separates the request from the execution so each part does its specific job smoothly without chaos.\n\n*Takeaway*: Keep each step isolated, just like a well-run kitchen!`;
    } else if (systemPrompt.includes("TUTOR_CUSTOM")) {
      fullResponse = `### In-Lesson AI Tutor\n\nHere is what you need to know about that:\n\n1. **Context**: Based on this step of the lesson, the key detail is understanding how the components interact.\n2. **Direct Answer**: Focus on the inputs and the expected outcome.\n3. **Practical Tip**: When in doubt, break down complex parts into smaller 1-minute steps.`;
    } else if (systemPrompt.includes("QA_AI")) {
      fullResponse = `### Explanation for: "${lastUserMessage}"\n\nGreat question! In modern concepts, **${lastUserMessage.slice(0, 30)}** works by establishing clear boundaries and rules.\n\n1. **Core Concept**: It defines how data or operations flow.\n2. **Best Practice**: Always structure your logic cleanly and write tests to verify behavior.`;
    } else {
      fullResponse = `Here is AI assistance for your query:\n\nRegarding "${lastUserMessage}", it is important to focus on fundamental principles, consistent practice, and active revision.`;
    }

    // Stream out words in small chunks
    const chunks = fullResponse.split(/(?<=\s)/);
    for (const chunk of chunks) {
      onChunk(chunk);
      await new Promise((res) => setTimeout(res, 25));
    }

    return fullResponse;
  }

  /**
   * Summarize notes or text snippet.
   */
  public static async summarize(
    text: string,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content:
          "You are SUMMARIZER, an expert AI tutor on SabiLearn. Provide a clear, concise, and structured bullet-point summary of the user input text.",
      },
      {
        role: "user",
        content: text,
      },
    ];

    return this.streamChatCompletion(messages, onChunk || (() => {}));
  }

  /**
   * Generate multiple-choice quiz questions for a general topic or prompt.
   */
  public static async generateQuiz(
    topic: string,
    count: number = 3,
    onChunk?: (chunk: string) => void,
  ): Promise<QuizQuestionGenerated[]> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: `You are QUIZ_GENERATOR AI tutor on SabiLearn. Generate ${count} multiple-choice questions for the requested topic.
Output strictly valid JSON in the following schema format without any markdown formatting wrappers if possible, or inside a clean \`\`\`json code block:
[
  {
    "question": "Question text here?",
    "options": [
      { "text": "Option A", "isCorrect": true },
      { "text": "Option B", "isCorrect": false },
      { "text": "Option C", "isCorrect": false },
      { "text": "Option D", "isCorrect": false }
    ],
    "explanation": "Brief explanation of correct answer."
  }
]`,
      },
      {
        role: "user",
        content: `Generate ${count} quiz questions about: ${topic}`,
      },
    ];

    const rawResult = await this.streamChatCompletion(
      messages,
      onChunk || (() => {}),
    );
    return this.parseQuizResponse(rawResult);
  }

  /**
   * Generate quiz questions specifically for a course or topic context.
   */
  public static async generateQuizForContext(
    contextType: "course" | "topic",
    title: string,
    descriptionOrContent: string,
    count: number = 3,
    difficulty: string = "medium",
    onChunk?: (chunk: string) => void,
  ): Promise<QuizQuestionGenerated[]> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: `You are QUIZ_GENERATOR AI tutor on SabiLearn. Generate ${count} ${difficulty}-difficulty multiple choice quiz questions based on the provided ${contextType} context.
Output strictly valid JSON in this schema format:
[
  {
    "question": "Question text?",
    "options": [
      { "text": "Option 1", "isCorrect": true },
      { "text": "Option 2", "isCorrect": false },
      { "text": "Option 3", "isCorrect": false },
      { "text": "Option 4", "isCorrect": false }
    ],
    "explanation": "Why this answer is correct."
  }
]`,
      },
      {
        role: "user",
        content: `${contextType.toUpperCase()} TITLE: ${title}\nCONTEXT / CONTENT:\n${descriptionOrContent}`,
      },
    ];

    const rawResult = await this.streamChatCompletion(
      messages,
      onChunk || (() => {}),
    );
    return this.parseQuizResponse(rawResult);
  }

  /**
   * Generate flashcards for a topic.
   */
  public static async generateFlashcards(
    topic: string,
    count: number = 3,
    onChunk?: (chunk: string) => void,
  ): Promise<FlashcardGenerated[]> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: `You are FLASHCARD_GENERATOR AI tutor on SabiLearn. Generate ${count} flashcards for study.
Output strictly valid JSON in the format:
[
  {
    "front": "Question or term on front of card",
    "back": "Detailed answer or definition on back of card"
  }
]`,
      },
      {
        role: "user",
        content: `Generate ${count} flashcards for topic: ${topic}`,
      },
    ];

    const rawResult = await this.streamChatCompletion(
      messages,
      onChunk || (() => {}),
    );
    return this.parseFlashcardResponse(rawResult);
  }

  /**
   * Answer study Q&A questions.
   */
  public static async askQA(
    question: string,
    context?: string,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content:
          "You are QA_AI, an encouraging, clear, and expert tutor on SabiLearn. Answer the user study question thoroughly with explanations and examples.",
      },
      {
        role: "user",
        content: context
          ? `Context:\n${context}\n\nQuestion: ${question}`
          : question,
      },
    ];

    return this.streamChatCompletion(messages, onChunk || (() => {}));
  }

  /**
   * In-Lesson Contextual AI Tutor: Explain simply (ELI5), relatable analogy, or custom question.
   */
  public static async explainLessonStep(
    options: {
      mode: "eli5" | "analogy" | "custom";
      topicTitle?: string;
      stepTitle?: string;
      stepContent: string;
      question?: string;
    },
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const { mode, topicTitle, stepTitle, stepContent, question } = options;

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "eli5") {
      systemPrompt = `You are TUTOR_ELI5 on SabiLearn, an empathetic and gifted educator.
Your task is to provide an "Explain Simply (ELI5)" breakdown of the given lesson content.
Guidelines:
- Explain the core concept in plain, simple English without confusing technical jargon.
- Use a friendly, encouraging tone.
- Format with clean, structured Markdown (use headings like ### Key Idea, bullet points for steps, bold for important terms).
- Keep it concise (2-4 short paragraphs or bulleted takeaways) so it is fast and delightful to read during a lesson.
- DO NOT use sparkles emojis or filler phrases like "Sure! I can explain that!". Jump straight into the clear explanation.`;

      userPrompt = `LESSON TOPIC: ${topicTitle || "General Lesson"}
STEP TITLE: ${stepTitle || "Current Step"}
CONTENT TO EXPLAIN:
${stepContent}`;
    } else if (mode === "analogy") {
      systemPrompt = `You are TUTOR_ANALOGY on SabiLearn, an expert at making abstract or difficult concepts crystal clear using real-world analogies.
Your task is to explain the given lesson concept through an imaginative, relatable, and memorable everyday analogy (e.g., cooking, traffic lights, backpacks, smartphones, sports, or bank accounts).
Guidelines:
- Start directly with the analogy.
- Clearly connect the elements of the analogy back to the real concept (e.g., "The chef is like the function, the order ticket is like the arguments...").
- Format using clean Markdown with clear headings and bulleted mappings.
- Conclude with a 1-sentence "Mental Hook" takeaway.
- DO NOT use sparkles emojis or conversational fluff.`;

      userPrompt = `LESSON TOPIC: ${topicTitle || "General Lesson"}
STEP TITLE: ${stepTitle || "Current Step"}
CONTENT TO ANALOGIZE:
${stepContent}`;
    } else {
      systemPrompt = `You are TUTOR_CUSTOM on SabiLearn, an encouraging, sharp, and concise in-lesson AI tutor.
Your task is to answer the student's question specifically in the context of the current lesson step.
Guidelines:
- Answer directly and accurately.
- Relate your explanation directly to the step content provided.
- Use clean, structured Markdown with code blocks if applicable.
- DO NOT use sparkles emojis. Keep the answer direct and actionable.`;

      userPrompt = `LESSON TOPIC: ${topicTitle || "General Lesson"}
STEP TITLE: ${stepTitle || "Current Step"}
LESSON CONTEXT:
${stepContent}

STUDENT QUESTION:
${question || "Can you clarify how this works?"}`;
    }

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    return this.streamChatCompletion(messages, onChunk || (() => {}));
  }

  private static parseQuizResponse(raw: string): QuizQuestionGenerated[] {
    try {
      const cleanJson = raw
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn(
        "Failed to parse quiz response JSON from AI, fallback returning raw text format",
      );
    }
    return [
      {
        question: `Generated question for topic`,
        options: [
          { text: "Sample Option A", isCorrect: true },
          { text: "Sample Option B", isCorrect: false },
        ],
        explanation: raw,
      },
    ];
  }

  private static parseFlashcardResponse(raw: string): FlashcardGenerated[] {
    try {
      const cleanJson = raw
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Failed to parse flashcard response JSON from AI");
    }
    return [
      {
        front: "Study Front",
        back: raw,
      },
    ];
  }
}
