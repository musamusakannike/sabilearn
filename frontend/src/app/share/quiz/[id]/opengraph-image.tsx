import { ImageResponse } from "next/og";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let quizTitle = "Practice Quiz";
  let quizTopic = "";
  let questionCount = 0;

  try {
    if (id && ObjectId.isValid(id)) {
      const { db } = await connectToDatabase();
      const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(id) });
      if (quiz) {
        quizTitle = quiz.title || "Practice Quiz";
        quizTopic = quiz.topic || "";
        questionCount = quiz.questions?.length || 0;
      }
    }
  } catch (error) {
    console.error("Failed to fetch quiz for OG image:", error);
  }

  // Load Outfit font for premium typography
  let fontData: ArrayBuffer | null = null;
  try {
    const fontResponse = await fetch(
      new URL("../../../../../public/fonts/Outfit-Bold.ttf", import.meta.url)
    );
    if (fontResponse.ok) {
      fontData = await fontResponse.arrayBuffer();
    }
  } catch (error) {
    console.warn("Failed to load custom Outfit font for dynamic OG Image, falling back to system fonts.", error);
  }

  const options: {
    width: number;
    height: number;
    fonts?: Array<{
      name: string;
      data: ArrayBuffer;
      weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      style: "normal" | "italic";
    }>;
  } = {
    ...size,
  };

  if (fontData) {
    options.fonts = [
      {
        name: "Outfit",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ];
  }

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full bg-[#0C0C0E] text-[#F5F2ED] items-center justify-center relative overflow-hidden px-16"
        style={{
          fontFamily: fontData ? "Outfit" : "system-ui, sans-serif",
        }}
      >
        {/* Ambient Radial Gradient Orb */}
        <div
          tw="absolute w-[800px] h-[800px] rounded-full opacity-60"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(232, 168, 56, 0.15) 0%, rgba(232, 168, 56, 0.01) 60%, transparent 80%)",
          }}
        />

        {/* Brand Header */}
        <div tw="flex items-center gap-3 mb-8">
          <div tw="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            {/* Elegant brain/synapse shape using simplified CSS border curves */}
            <div tw="w-5 h-5 rounded-full border-2 border-[#E8A838] border-t-transparent flex items-center justify-center">
              <div tw="w-2.5 h-2.5 rounded-full bg-[#E8A838]" />
            </div>
          </div>
          <span tw="text-2xl font-bold tracking-tight text-white">Sabi Learn</span>
        </div>

        {/* Quiz Tag */}
        <div tw="flex items-center px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E8A838] text-sm font-bold tracking-wider uppercase mb-6">
          Practice Quiz
        </div>

        {/* Quiz Title */}
        <div tw="flex flex-col items-center text-center max-w-[1000px] px-4">
          <h1
            tw="text-6xl font-black tracking-tight leading-tight text-center mt-0 mb-6"
            style={{
              background: "linear-gradient(to right, #E8A838, #F0BD5C)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {quizTitle}
          </h1>
        </div>

        {/* Dynamic Subtitle */}
        {quizTopic ? (
          <p tw="text-xl text-[#A8A29E] text-center max-w-2xl leading-relaxed m-0 mb-8">
            Topic: {quizTopic} {questionCount ? `• ${questionCount} Questions` : ""}
          </p>
        ) : (
          <p tw="text-xl text-[#A8A29E] text-center max-w-2xl leading-relaxed m-0 mb-8">
            AI-powered personalized learning. Generate courses, explanatory videos, and practice quizzes tailored entirely to how you sabi book best.
          </p>
        )}

        {/* Mock CTA Button */}
        <div tw="flex items-center gap-2 px-8 py-4 rounded-full bg-[#E8A838] text-[#0C0C0E] text-lg font-bold shadow-lg">
          Take practice quiz
          <span tw="ml-2 font-normal text-black/70">→</span>
        </div>
      </div>
    ),
    options
  );
}
