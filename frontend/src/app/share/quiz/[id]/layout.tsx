import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    if (id && ObjectId.isValid(id)) {
      const { db } = await connectToDatabase();
      const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(id) });
      if (quiz) {
        const title = `${quiz.title} — Practice Quiz | Sabi Learn`;
        const description = quiz.topic 
          ? `Test your knowledge on "${quiz.topic}" with the "${quiz.title}" practice quiz on Sabi Learn.`
          : `Test your knowledge with the "${quiz.title}" practice quiz on Sabi Learn.`;
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sabilearn.online";
        const shareUrl = `${appUrl}/share/quiz/${id}`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            type: "website",
            url: shareUrl,
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
          },
        };
      }
    }
  } catch (e) {
    console.error("Failed to generate metadata for shared quiz:", e);
  }
  return {
    title: "Practice Quiz | Sabi Learn",
    description: "Take this practice quiz on Sabi Learn.",
  };
}

export default function SharedQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
