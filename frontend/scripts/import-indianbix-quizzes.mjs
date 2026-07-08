import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually load environment variables from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error(`Error: .env.local not found at ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const processEnv = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
  if (match) {
    processEnv[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
});

const uri = processEnv.MONGODB_URI;
const dbName = processEnv.MONGODB_DB || "synapse";
const deepseekApiKey = processEnv.DEEPSEEK_API_KEY;
const deepseekModel = processEnv.DEEPSEEK_MODEL || "deepseek-v4-flash";
const deepseekBaseUrl = "https://api.deepseek.com/chat/completions";

if (!uri) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

if (!deepseekApiKey) {
  console.error("DEEPSEEK_API_KEY is not defined in .env.local");
  process.exit(1);
}

// Helper to safely parse JSON response from LLM
function safeJsonParse(rawText) {
  let cleaned = rawText.trim();
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Call DeepSeek to get explanations for a batch of questions
async function generateExplanationsForBatch(batch) {
  const systemPrompt = `You are a Senior Mechanical Engineering and Metallurgy Professor.
Your job is to generate clear, concise, and educational explanations for the following quiz questions on "Engineering Materials".

For each question:
- Explain the key concept clearly.
- CRITICAL: Keep the specified 'answer' as the correct choice for the quiz.
- If the specified 'answer' is factually incorrect under standard mechanical engineering / metallurgical principles, you MUST explain the correction in the explanation (e.g. "Correction note: While the answer key indicates Option X, the correct engineering answer should be Option Y because..."). Otherwise, just explain why the specified answer is correct.

You must return a JSON object with a single key "explanations" mapping to an array of objects. Each object must have "number" (the question number) and "explanation" (the generated explanation string).
Format:
{
  "explanations": [
    {
      "number": 1,
      "explanation": "..."
    }
  ]
}`;

  const userPrompt = `Here is the batch of questions to generate explanations for:\n${JSON.stringify(batch, null, 2)}`;

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(
        deepseekBaseUrl,
        {
          model: deepseekModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 4000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekApiKey}`,
          },
          timeout: 60000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from DeepSeek API");
      }

      const parsed = safeJsonParse(content);
      if (parsed && Array.isArray(parsed.explanations)) {
        return parsed.explanations;
      }
      throw new Error("Invalid structure: explanations array missing");
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed for batch: ${error.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  throw new Error(`Failed to generate explanations after 3 attempts: ${lastError.message}`);
}

async function main() {
  const parsedPath = path.resolve(__dirname, "../../document-extractor/parsed_sections.json");
  if (!fs.existsSync(parsedPath)) {
    console.error(`Error: parsed_sections.json not found at ${parsedPath}`);
    process.exit(1);
  }

  const sectionsData = JSON.parse(fs.readFileSync(parsedPath, "utf8"));
  
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const email = "musamusakannike@gmail.com";
  console.log(`Finding user with email: ${email}`);
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    console.error(`User with email ${email} not found.`);
    await client.close();
    process.exit(1);
  }
  console.log(`Found user: ${user.name} (ID: ${user._id.toString()})`);

  const BATCH_SIZE = 10;

  for (const [secStr, questions] of Object.entries(sectionsData)) {
    const secNum = parseInt(secStr);
    const quizTitle = `GET202 INDIANBIX SECTION ${secNum}`;
    
    // Check if the quiz is already fully imported in the DB
    const existingQuiz = await db.collection("quizzes").findOne({
      userId: user._id.toString(),
      title: quizTitle
    });

    if (existingQuiz) {
      console.log(`Quiz "${quizTitle}" already exists in database. Skipping.`);
      continue;
    }

    console.log(`\n=== Processing ${quizTitle} (${questions.length} questions) ===`);

    // Cache file path to store intermediate progress
    const cachePath = path.resolve(__dirname, `../../document-extractor/section_${secNum}_cache.json`);
    let completedQuestions = [];
    if (fs.existsSync(cachePath)) {
      console.log(`Found cache at ${cachePath}. Resuming progress.`);
      completedQuestions = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    }

    const completedNumbers = new Set(completedQuestions.map((q) => q.number));

    // Let's divide pending questions into batches of BATCH_SIZE
    const batches = [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batchQuestions = questions.slice(i, i + BATCH_SIZE);
      const pendingInBatch = batchQuestions.filter((q) => !completedNumbers.has(q.number));
      if (pendingInBatch.length > 0) {
        batches.push(pendingInBatch);
      }
    }

    if (batches.length > 0) {
      console.log(`Generating explanations for ${batches.length} batches...`);
      for (let i = 0; i < batches.length; i++) {
        const currentBatch = batches[i];
        console.log(`Batch ${i + 1}/${batches.length}: generating explanations for questions ${currentBatch.map(q => q.number).join(", ")}`);
        
        // Prepare data sent to LLM to keep request payloads small and relevant
        const apiPayload = currentBatch.map((q) => ({
          number: q.number,
          question: q.question,
          options: q.options_list,
          answer: q.answer
        }));

        const explanationsList = await generateExplanationsForBatch(apiPayload);
        const explanationMap = new Map(explanationsList.map((e) => [e.number, e.explanation]));

        // Merge explanations back into the questions
        for (const q of currentBatch) {
          const explanation = explanationMap.get(q.number) || "No explanation provided.";
          const mergedQuestion = {
            question: q.question,
            type: "multiple-choice",
            options: q.options_list,
            answer: q.answer,
            explanation: explanation,
            number: q.number // to track order/number
          };
          completedQuestions.push(mergedQuestion);
        }

        // Sort completed questions by question number
        completedQuestions.sort((a, b) => a.number - b.number);

        // Update local cache
        fs.writeFileSync(cachePath, JSON.stringify(completedQuestions, null, 2), "utf8");
        console.log(`Batch ${i + 1} completed. Cache updated.`);
        
        // Sleep briefly to be nice to API rate limits
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Now all questions for this section are completed
    // Format final questions array (without the temporary "number" field)
    const finalQuestions = completedQuestions.map((q) => ({
      question: q.question,
      type: "multiple-choice",
      options: q.options,
      answer: q.answer,
      explanation: q.explanation
    }));

    const quizDoc = {
      userId: user._id.toString(),
      title: quizTitle,
      topic: "Engineering Materials",
      questions: finalQuestions,
      attempts: [],
      createdAt: new Date(),
      isPublic: false
    };

    console.log(`Inserting ${quizTitle} into database...`);
    const result = await db.collection("quizzes").insertOne(quizDoc);
    console.log(`Successfully created quiz! ID: ${result.insertedId.toString()}`);

    // Remove the cache file
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  }

  console.log("\nAll quizzes successfully processed!");
  await client.close();
}

main().catch((error) => {
  console.error("Process failed:", error);
  process.exit(1);
});
