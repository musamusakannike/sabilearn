"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatMarkdown } from "@/lib/markdown";
import { BetaBadge } from "@/components/BetaBadge";
import { DocumentUpload, AttachedDocChip } from "@/components/documents/DocumentUpload";
import { DocumentPicker } from "@/components/documents/DocumentPicker";
import type { UploadedDoc } from "@/components/documents/DocumentUpload";
import { cn } from "@/lib/cn";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "text" | "course-created" | "quiz-created" | "video-created";
  meta?: { id?: string; title?: string };
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueId = searchParams.get("continue");
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachedDocs, setAttachedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<
    "ask" | "course" | "quiz" | "video" | null
  >(null);

  // Document picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quiz question count (matches the sidebar quizzes page options)
  const [numQuestions, setNumQuestions] = useState(5);
  const [showQuizUpsell, setShowQuizUpsell] = useState(false);
  const isPremium = (user as any)?.premium ?? false;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = !loading && (input.trim() !== "" || attachedDocs.length > 0);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // Load question if `continue` search param is active
  useEffect(() => {
    if (!continueId) {
      setCurrentQuestionId(null);
      setMessages([]);
      setAttachedDocs([]);
      return;
    }

    const loadContinuedChat = async () => {
      setLoading(true);
      try {
        // 1. Fetch the question details
        const questionRes = await fetch(`/api/ai/history?id=${continueId}`);
        const questionData = await questionRes.json();
        if (questionData.success && questionData.question) {
          const qDoc = questionData.question;
          setCurrentQuestionId(qDoc._id);

          // 2. Fetch user's documents to map meta info if any documentIds are attached
          let matchedDocs: UploadedDoc[] = [];
          if (qDoc.documentIds && qDoc.documentIds.length > 0) {
            const docsRes = await fetch("/api/documents");
            const docsData = await docsRes.json();
            if (docsData.success && docsData.documents) {
              matchedDocs = docsData.documents.filter((d: UploadedDoc) =>
                qDoc.documentIds.includes(d._id)
              );
            }
          }
          setAttachedDocs(matchedDocs);

          // 3. Build message list
          const formattedMessages: ChatMessage[] = qDoc.messages?.map((m: any) => ({
            id: m.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt || qDoc.createdAt),
          })) || [
            {
              id: `user-${qDoc._id}`,
              role: "user",
              content: qDoc.question,
              timestamp: new Date(qDoc.createdAt),
            },
            {
              id: `assistant-${qDoc._id}`,
              role: "assistant",
              content: qDoc.answer,
              timestamp: new Date(qDoc.createdAt),
            }
          ];
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("Failed to load continued chat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadContinuedChat();
  }, [continueId]);

  const addMessage = useCallback(
    (
      role: ChatMessage["role"],
      content: string,
      type?: ChatMessage["type"],
      meta?: ChatMessage["meta"]
    ) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        timestamp: new Date(),
        type,
        meta,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const handleUploadComplete = (doc: UploadedDoc) => {
    if (!attachedDocs.some((d) => d._id === doc._id)) {
      setAttachedDocs((prev) => [...prev, doc]);
    }
    setUploadError("");
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d._id !== id));
  };

  const handlePickerSelect = (docs: UploadedDoc[]) => {
    const existing = new Set(attachedDocs.map((d) => d._id));
    const merged = [
      ...attachedDocs,
      ...docs.filter((d) => !existing.has(d._id)),
    ];
    setAttachedDocs(merged);
  };

  // ── Send handler ─────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!canSubmit) return;

    const userInput = input.trim();
    const docIds = attachedDocs.map((d) => d._id);
    const docNames = attachedDocs.map((d) => d.fileName);
    const mode = activeMode || "ask";

    // Build display message
    let displayMsg = userInput;
    if (docNames.length > 0) {
      const docLabel = docNames.join(", ");
      displayMsg = userInput
        ? `${userInput}\n\n📎 ${docLabel}`
        : `📎 ${docLabel}`;
    }

    addMessage("user", displayMsg);
    setInput("");
    setAttachedDocs([]);
    setLoading(true);

    try {
      if (mode === "course") {
        // Create course
        addMessage(
          "system",
          `Creating course${userInput ? ` on "${userInput}"` : ""}...`
        );
        const res = await fetch("/api/ai/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: userInput, documentIds: docIds }),
        });
        const data = await res.json();
        if (!res.ok) {
          addMessage("assistant", data.error || "Failed to create course.");
        } else {
          const courseId = data.course?._id || data.courseId;
          const courseTitle =
            data.course?.title || userInput || "your new course";
          addMessage(
            "assistant",
            `✅ **Course created:** "${courseTitle}"\n\nYour personalized course has been generated successfully. Click below to start learning.`,
            "course-created",
            { id: courseId, title: courseTitle }
          );
        }
      } else if (mode === "quiz") {
        // Create quiz
        addMessage(
          "system",
          `Generating quiz${userInput ? ` on "${userInput}"` : ""}...`
        );
        const res = await fetch("/api/ai/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: userInput,
            documentIds: docIds,
            numQuestions,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          addMessage("assistant", data.error || "Failed to create quiz.");
        } else {
          const quizId = data.quiz?._id || data.quizId;
          const quizTitle =
            data.quiz?.title || userInput || "your new quiz";
          addMessage(
            "assistant",
            `✅ **Quiz created:** "${quizTitle}"\n\nYour quiz with ${numQuestions} questions is ready. Test your knowledge now.`,
            "quiz-created",
            { id: quizId, title: quizTitle }
          );
        }
      } else if (mode === "video") {
        // Create video
        addMessage(
          "system",
          `Generating video${userInput ? ` on "${userInput}"` : ""}...`
        );
        const res = await fetch("/api/ai/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: userInput,
            styleTheme: "emerald",
            numScenes: 5,
            documentIds: docIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          addMessage("assistant", data.error || "Failed to create video.");
        } else {
          const videoId = data.video?._id || data.videoId;
          const videoTitle =
            data.video?.title || userInput || "your new video";
          addMessage(
            "assistant",
            `✅ **Video created:** "${videoTitle}"\n\nYour explanatory video presentation has been generated. Watch it now.`,
            "video-created",
            { id: videoId, title: videoTitle }
          );
        }
      } else {
        // Ask AI (default)
        const res = await fetch("/api/ai/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: userInput,
            documentIds: docIds,
            questionId: currentQuestionId || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          addMessage("assistant", data.error || "Failed to get answer.");
        } else {
          addMessage("assistant", data.answer || "No response received.");
          if (data.questionId && !currentQuestionId) {
            setCurrentQuestionId(data.questionId);
            window.history.replaceState(null, "", `/dashboard?continue=${data.questionId}`);
          }
        }
      }
    } catch {
      addMessage("assistant", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setActiveMode(null);
    }
  }, [canSubmit, input, attachedDocs, activeMode, addMessage, currentQuestionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modeLabels: Record<string, string> = {
    course: "Course Mode",
    quiz: "Quiz Mode",
    video: "Video Mode",
    ask: "Ask AI",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pl-4 pr-16 sm:pl-6 sm:pr-16 md:px-8 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-sm sm:text-lg font-bold">
            {currentQuestionId ? "Continuing Chat" : `Welcome back, ${user?.name?.split(" ")[0]}`}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 hidden lg:block">
            {currentQuestionId
              ? "You are continuing a past Q&A session. Ask follow-up questions below."
              : "Ask anything, create courses, quizzes, or videos — all from here."}
          </p>
        </div>
        {currentQuestionId && (
          <button
            onClick={() => {
              router.push("/dashboard");
              setCurrentQuestionId(null);
              setMessages([]);
              setAttachedDocs([]);
            }}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold mb-1.5">
              How can I help you learn today?
            </h2>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "system" ? (
                  // System message (loading indicator style)
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] max-w-[90%] sm:max-w-[70%]">
                    <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="text-sm text-[var(--text-muted)]">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.role === "user" ? (
                  // User message
                  <div className="max-w-[90%] sm:max-w-[70%] px-4 py-3 rounded-2xl rounded-br-md bg-[var(--accent)] text-[var(--bg-primary)]">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-between gap-4 mt-2 pt-1.5 border-t border-[var(--bg-primary)]/10">
                      <span className="text-[10px] opacity-60">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] opacity-60 hover:opacity-100 transition-all active:scale-95 flex items-center gap-1 group/copy"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <span className="text-[10px] font-semibold animate-in fade-in slide-in-from-right-1 duration-200">
                              Copied!
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="animate-in zoom-in duration-200"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 font-medium">
                              Copy
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-70 group-hover/copy:opacity-100 transition-opacity duration-200"
                            >
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Assistant message
                  <div className="max-w-[95%] sm:max-w-[80%] sm:px-4 py-3">
                    <div
                      className="prose prose-invert prose-sm max-w-none [&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h3]:font-[family-name:var(--font-display)] [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed [&_li]:text-[var(--text-secondary)] [&_strong]:text-[var(--text-primary)] [&_code]:bg-[var(--bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[var(--accent)] [&_code]:text-xs"
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdown(msg.content),
                      }}
                    />
                    {/* Action buttons for created items */}
                    {msg.type === "course-created" && msg.meta?.id && (
                      <button
                        onClick={() =>
                          router.push(`/dashboard/courses/${msg.meta!.id}`)
                        }
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Open Course →
                      </button>
                    )}
                    {msg.type === "quiz-created" && msg.meta?.id && (
                      <button
                        onClick={() =>
                          router.push(`/dashboard/quizzes/${msg.meta!.id}`)
                        }
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Take Quiz →
                      </button>
                    )}
                    {msg.type === "video-created" && msg.meta?.id && (
                      <button
                        onClick={() =>
                          router.push(`/dashboard/videos/${msg.meta!.id}`)
                        }
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Watch Video →
                      </button>
                    )}
                    <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-[var(--border-subtle)]/30">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all active:scale-95 flex items-center gap-1 group/copy"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <span className="text-[10px] font-medium text-[var(--accent)] animate-in fade-in slide-in-from-right-1 duration-200">
                              Copied!
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="animate-in zoom-in duration-200"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 font-medium">
                              Copy
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-70 group-hover/copy:opacity-100 transition-opacity duration-200"
                            >
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading &&
              messages.length > 0 &&
              messages[messages.length - 1]?.role !== "system" && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          {/* Segmented Mode Bar */}
          <div className="flex items-center p-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl mb-2 relative">
            {[
              {
                id: "ask" as const,
                label: "Ask AI",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                id: "course" as const,
                label: "Course",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                ),
              },
              {
                id: "quiz" as const,
                label: "Quiz",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                ),
              },
              {
                id: "video" as const,
                label: "Video",
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ),
                beta: true,
              },
            ].map((modeItem, idx) => {
              const itemActive =
                (activeMode === null && modeItem.id === "ask") ||
                activeMode === modeItem.id;
              return (
                <button
                  key={modeItem.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(modeItem.id === "ask" ? null : modeItem.id);
                    textareaRef.current?.focus();
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative z-10",
                    itemActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {modeItem.icon}
                  <span>{modeItem.label}</span>
                  {modeItem.beta && <BetaBadge className="text-[8px] px-1 py-0 scale-90" />}
                </button>
              );
            })}

            {/* Sliding backdrop */}
            <div
              className="absolute top-1 bottom-1 bg-[var(--accent-subtle)] border border-[var(--accent)]/15 rounded-lg transition-all duration-300 ease-out"
              style={{
                left: `calc(${(activeMode === null ? 0 : activeMode === "ask" ? 0 : activeMode === "course" ? 1 : activeMode === "quiz" ? 2 : 3) * 25}% + 4px)`,
                width: "calc(25% - 8px)",
              }}
            />
          </div>

          {/* Contextual Mode Subtitle Description */}
          {messages.length === 0 && (
            <p className="text-[10px] text-[var(--text-muted)] mb-3 px-1.5 transition-all duration-300">
              {activeMode === "course"
                ? "Course Mode: Generates a full structured learning course based on your topic or files."
                : activeMode === "quiz"
                ? "Quiz Mode: Creates practice quizzes (multiple choice, T/F) to test your recall."
                : activeMode === "video"
                ? "Video Mode (Beta): Transforms concepts into voiceover slides. Best for visual learners."
                : "Ask AI: Clarify concepts, ask academic questions, or search summaries."}
            </p>
          )}

          {/* Quiz question count selector — only shown when Quiz mode is active */}
          {activeMode === "quiz" && (
            <div className="mb-3 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Number of Questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[5, 10, 15].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    disabled={loading}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                      numQuestions === num
                        ? "bg-[var(--accent)] text-[var(--bg-primary)] border-[var(--accent)] shadow-sm"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]"
                    )}
                  >
                    {num}Q
                  </button>
                ))}
                {[30, 50, 100].map((num) => {
                  const isLocked = !isPremium;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          setShowQuizUpsell(true);
                        } else {
                          setNumQuestions(num);
                        }
                      }}
                      disabled={loading}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border relative",
                        numQuestions === num
                          ? "bg-[var(--accent)] text-[var(--bg-primary)] border-[var(--accent)] shadow-sm"
                          : isLocked
                          ? "bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]/40"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]"
                      )}
                    >
                      {num}Q
                      {isLocked && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--accent)] rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-[var(--bg-primary)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {showQuizUpsell && (
                <p className="text-[10px] text-[var(--accent)] mt-1.5 px-0.5">
                  🔒 Upgrade to Premium to generate up to 100 questions per quiz.
                </p>
              )}
            </div>
          )}

          {/* Attached docs */}
          {attachedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedDocs.map((doc) => (
                <AttachedDocChip
                  key={doc._id}
                  doc={doc}
                  onRemove={handleRemoveDoc}
                />
              ))}
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-[var(--danger)] mb-2">{uploadError}</p>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            {/* Attach Document button */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={loading}
                title="Attach Document"
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all disabled:opacity-50 bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeMode === "course"
                    ? "Enter a topic for your course..."
                    : activeMode === "quiz"
                    ? "Enter a topic for your quiz..."
                    : activeMode === "video"
                    ? "Enter a topic for your video..."
                    : "Ask anything or type a topic..."
                }
                disabled={loading}
                rows={1}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none disabled:opacity-50 min-h-[42px] max-h-[160px]"
              />
            </div>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                canSubmit
                  ? "bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)]"
                  : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Document picker modal */}
      <DocumentPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        selectedIds={attachedDocs.map((d) => d._id)}
      />

      {/* Hidden upload input for "Attach Document" option */}
      <div className="hidden">
        <DocumentUpload
          compact
          onUploadComplete={handleUploadComplete}
          onError={setUploadError}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-full min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
