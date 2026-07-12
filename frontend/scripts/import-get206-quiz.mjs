import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables from .env.local
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

if (!uri) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function main() {
  // 2. Read questions.json from workspace root
  const questionsPath = path.resolve(__dirname, "../../questions.json");
  console.log(`Reading questions from ${questionsPath}...`);
  if (!fs.existsSync(questionsPath)) {
    console.error(`Error: questions.json not found at ${questionsPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(questionsPath, "utf8");
  const rawQuestions = JSON.parse(fileContent);
  console.log(`Loaded ${rawQuestions.length} raw questions.`);

  // 3. Connect to MongoDB
  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // 4. Find user by email
  const email = "musamusakannike@gmail.com";
  console.log(`Finding user with email: ${email}`);
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    console.error(`User with email ${email} not found.`);
    await client.close();
    process.exit(1);
  }
  console.log(`Found user: ${user.name} (ID: ${user._id.toString()})`);

  // 5. Construct and validate quiz document
  const quizDoc = {
    userId: user._id.toString(),
    title: "GET206: Thermodynamics Practice Test",
    topic: "Thermodynamics",
    questions: rawQuestions.map((q, index) => {
      // Basic validation of fields
      if (!q.question || !q.answer || !Array.isArray(q.options)) {
        console.warn(`Warning: Question at index ${index} is missing required fields.`, q);
      }
      return {
        question: q.question,
        type: q.type || "multiple-choice",
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || ""
      };
    }),
    attempts: [],
    createdAt: new Date(),
    isPublic: false
  };

  // 6. Insert quiz document
  console.log("Inserting quiz into database...");
  const result = await db.collection("quizzes").insertOne(quizDoc);
  console.log(`Successfully created quiz!`);
  console.log(`Quiz ID: ${result.insertedId.toString()}`);
  console.log(`Total questions imported: ${quizDoc.questions.length}`);

  await client.close();
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
