import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
const envPath = path.resolve(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("No .env.local file found");
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
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

async function verify() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const email = "musamusakannike@gmail.com";
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    console.error(`User ${email} not found.`);
    await client.close();
    process.exit(1);
  }

  console.log(`Checking quizzes for user: ${user.name} (${user._id.toString()})`);
  
  for (let i = 1; i <= 6; i++) {
    const title = `GET202 INDIANBIX SECTION ${i}`;
    const quiz = await db.collection("quizzes").findOne({
      userId: user._id.toString(),
      title: title
    });

    if (quiz) {
      console.log(`\n[FOUND] Quiz: "${quiz.title}"`);
      console.log(`  - Total Questions: ${quiz.questions.length}`);
      console.log(`  - Created At: ${quiz.createdAt}`);
      console.log(`  - Topic: ${quiz.topic}`);
      if (quiz.questions.length > 0) {
        const sample = quiz.questions[0];
        console.log(`  - Sample Question #1: "${sample.question}"`);
        console.log(`    - Options: [${sample.options.join(", ")}]`);
        console.log(`    - Correct Answer: "${sample.answer}"`);
        console.log(`    - Explanation: "${sample.explanation}"`);
      }
    } else {
      console.log(`\n[MISSING] Quiz: "${title}"`);
    }
  }

  await client.close();
}

verify().catch(console.error);
