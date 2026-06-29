import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "synapse";

if (!uri) {
  console.error("MONGODB_URI is not defined in the environment.");
  process.exit(1);
}

async function main() {
  // Read questions.json
  const questionsPath = path.resolve(__dirname, "../../questions.json");
  console.log(`Reading questions from ${questionsPath}...`);
  
  if (!fs.existsSync(questionsPath)) {
    console.error(`Error: File not found at ${questionsPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(questionsPath, "utf8");
  const questions = JSON.parse(fileContent);
  console.log(`Loaded ${questions.length} questions.`);

  // Connect to DB
  console.log(`Connecting to MongoDB at: ${uri.replace(/:([^:@]+)@/, ":****@")}`);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Find user by email
  const email = "musamusakannike@gmail.com";
  console.log(`Finding user with email: ${email}`);
  const user = await db.collection("users").findOne({ email });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    await client.close();
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (ID: ${user._id.toString()})`);

  // Create new quiz document
  const quizDoc = {
    userId: user._id.toString(),
    title: "Workshop Practice Fundamentals",
    topic: "Workshop Practice Fundamentals",
    questions: questions,
    attempts: [],
    createdAt: new Date(),
    isPublic: false
  };

  // Insert quiz
  console.log("Inserting quiz into database...");
  const result = await db.collection("quizzes").insertOne(quizDoc);
  console.log(`Successfully created quiz!`);
  console.log(`Quiz ID: ${result.insertedId.toString()}`);
  console.log(`Total questions imported: ${questions.length}`);

  await client.close();
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
