import React from "react";
import { CheckCircle, XCircle, SkipForward, Circle } from "lucide-react";

interface Question {
  question: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  options?: string[];
  answer: string;
  explanation: string;
}

interface QuizOverviewProps {
  questions: Question[];
  userAnswers: Record<number, string>;
  currentQuestionIndex: number;
  maxReachedIndex: number;
  onQuestionClick: (index: number) => void;
}

export default function QuizOverview({
  questions,
  userAnswers,
  currentQuestionIndex,
  maxReachedIndex,
  onQuestionClick,
}: QuizOverviewProps) {
  const getItemClass = (index: number) => {
    const classes = ["overview-item"];
    const answer = userAnswers[index];
    const hasAnswer = answer !== undefined && answer !== "";

    if (hasAnswer) {
      const isCorrect =
        answer.toLowerCase().trim() ===
        questions[index].answer.toLowerCase().trim();
      classes.push(isCorrect ? "correct" : "wrong");
    } else {
      if (index === currentQuestionIndex) {
        // Current question (unanswered yet)
      } else if (index <= maxReachedIndex) {
        // Visited but unanswered = skipped
        classes.push("skipped");
      } else {
        classes.push("unattempted");
      }
    }

    if (index === currentQuestionIndex) {
      classes.push("current");
    }

    return classes.join(" ");
  };

  const answeredCount = Object.keys(userAnswers).filter(
    (key) => userAnswers[parseInt(key)] !== undefined && userAnswers[parseInt(key)] !== "",
  ).length;

  const correctCount = Object.keys(userAnswers).reduce((acc, key) => {
    const idx = parseInt(key);
    const ans = userAnswers[idx];
    if (ans === undefined || ans === "") return acc;
    const isCorrect =
      ans.toLowerCase().trim() ===
      questions[idx].answer.toLowerCase().trim();
    return isCorrect ? acc + 1 : acc;
  }, 0);

  const wrongCount = answeredCount - correctCount;

  const skippedCount = questions.reduce((acc, _, idx) => {
    if (
      idx <= maxReachedIndex &&
      (userAnswers[idx] === undefined || userAnswers[idx] === "") &&
      idx !== currentQuestionIndex
    ) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const remainingCount = Math.max(
    0,
    questions.length -
      (correctCount + wrongCount + skippedCount) -
      (userAnswers[currentQuestionIndex] !== undefined && userAnswers[currentQuestionIndex] !== "" ? 1 : 0),
  );

  return (
    <aside className="quiz-overview-sidebar">
      <div className="overview-card">
        <h3 className="overview-title">
          Question {currentQuestionIndex + 1} / {questions.length}
        </h3>

        <div className="overview-grid">
          {questions.map((_, index) => (
            <button
              key={index}
              className={getItemClass(index)}
              onClick={() => onQuestionClick(index)}
              disabled={index > maxReachedIndex}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="overview-stats">
          <div className="stat-row">
            <span className="stat-label">
              <CheckCircle size={16} className="text-green-500" /> Correct
            </span>
            <span className="stat-value">{correctCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">
              <XCircle size={16} className="text-red-500" /> Wrong
            </span>
            <span className="stat-value">{wrongCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">
              <SkipForward size={16} className="text-yellow-500" /> Skipped
            </span>
            <span className="stat-value">{skippedCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">
              <Circle size={16} className="text-zinc-500" /> Remaining
            </span>
            <span className="stat-value">{remainingCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
