"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

// If a document stays in "processing" longer than this, offer a retry
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface DocumentMeta {
  _id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  createdAt: string;
  extractedText: string;
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
  ocrError?: string | null;
}

interface KeyConcept {
  concept: string;
  description: string;
}

interface GlossaryItem {
  term: string;
  definition: string;
}

interface CourseModule {
  module: string;
  lessons: string[];
}

interface Insights {
  summary: string;
  keyConcepts: KeyConcept[];
  glossary: GlossaryItem[];
  quizTopics: string[];
  courseOutline: CourseModule[];
}

type TabId = "summary" | "concepts" | "glossary" | "quiz" | "course";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "summary",
    label: "Summary",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "concepts",
    label: "Key Concepts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    id: "glossary",
    label: "Glossary",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: "quiz",
    label: "Quiz Topics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: "course",
    label: "Course Outline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeIcon(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word")) return "DOC";
  if (mime.startsWith("image/")) return "IMG";
  return "TXT";
}

function mimeColor(mime: string) {
  if (mime === "application/pdf") return "text-red-400 bg-red-400/10";
  if (mime.includes("word")) return "text-blue-400 bg-blue-400/10";
  if (mime.startsWith("image/")) return "text-green-400 bg-green-400/10";
  return "text-[var(--accent)] bg-[var(--accent-muted)]";
}

export default function DocumentInsightsPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [document, setDocument] = useState<DocumentMeta | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  // Track when processing started so we can offer a retry after timeout
  const processingStartRef = useRef<number | null>(null);

  const fetchDocument = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/insights?id=${docId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load document");
        return;
      }
      const doc: DocumentMeta = data.document;
      setDocument(doc);
      // Track when processing started
      if (doc.ocrStatus === "processing") {
        if (!processingStartRef.current) {
          processingStartRef.current =
            doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now();
        }
      } else {
        processingStartRef.current = null;
      }
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch {
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  useEffect(() => {
    if (document?.ocrStatus === "processing") {
      const interval = setInterval(() => {
        fetchDocument();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [document?.ocrStatus, fetchDocument]);

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate insights");
        return;
      }
      setInsights(data.insights);
    } catch {
      setError("Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    setDocument((prev) => prev ? { ...prev, ocrStatus: "processing" } : prev);
    processingStartRef.current = Date.now();
    try {
      const res = await fetch("/api/documents/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Retry failed. Please try again.");
        setDocument((prev) =>
          prev ? { ...prev, ocrStatus: "failed", ocrError: data.error || "Retry failed" } : prev
        );
        processingStartRef.current = null;
      } else if (data.ocrStatus === "completed") {
        // Sync mode resolved immediately — refresh
        await fetchDocument();
      }
      // If still processing, the poll interval picks it up
    } catch {
      setError("Retry failed. Please try again.");
      setDocument((prev) =>
        prev ? { ...prev, ocrStatus: "failed", ocrError: "Retry failed" } : prev
      );
      processingStartRef.current = null;
    } finally {
      setRetrying(false);
    }
  };

  const isTimedOut =
    document?.ocrStatus === "processing" &&
    processingStartRef.current !== null &&
    Date.now() - (processingStartRef.current ?? 0) > PROCESSING_TIMEOUT_MS;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/documents")}
        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Documents
      </button>

      {/* Document header */}
      {document && (
        <div className="flex items-start gap-4 mb-8">
          <span
            className={cn(
              "inline-flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold shrink-0",
              mimeColor(document.mimeType)
            )}
          >
            {mimeIcon(document.mimeType)}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold truncate">
              {document.fileName}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {formatFileSize(document.sizeBytes)} &middot;{" "}
              {new Date(document.createdAt).toLocaleDateString()} &middot;{" "}
              <a
                href={document.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Open file
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}

      {/* Processing State */}
      {document?.ocrStatus === "processing" && (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] w-1/3 rounded-full animate-[loading-bar_1.5s_infinite_linear]" style={{ transformOrigin: "0% 50%" }} />
          </div>
          <style>{`
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-2xl border-2 border-[var(--accent)] animate-ping opacity-25" />
            {isTimedOut ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            )}
          </div>
          {isTimedOut ? (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                This is taking longer than usual
              </h2>
              <p className="text-sm text-[var(--text-secondary)] text-center max-w-md mb-6">
                The processing service may have been temporarily unavailable. You can retry
                to re-trigger extraction.
              </p>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {retrying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.49" />
                  </svg>
                )}
                {retrying ? "Retrying..." : "Retry Processing"}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Reading your document...
              </h2>
              <p className="text-sm text-[var(--text-secondary)] text-center max-w-md mb-2">
                We are currently reading and analyzing the content of this file.
              </p>
              <p className="text-xs text-[var(--text-muted)] text-center">
                This will refresh automatically. Please do not close the window.
              </p>
            </>
          )}
        </div>
      )}

      {/* Failed State */}
      {document?.ocrStatus === "failed" && (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--danger)]/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Unable to read document
          </h2>
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-md mb-6">
            {document.ocrError || "An error occurred during text extraction."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {retrying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.49" />
                </svg>
              )}
              {retrying ? "Retrying..." : "Retry Processing"}
            </button>
            <button
              onClick={() => router.push("/dashboard/documents")}
              className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors"
            >
              Back to Documents
            </button>
          </div>
        </div>
      )}

      {/* Generate insights CTA */}
      {!insights && !generating && document?.ocrStatus !== "processing" && document?.ocrStatus !== "failed" && (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Generate Document Insights
          </h2>
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-md mb-6">
            AI will analyze your document and extract a summary, key concepts, glossary,
            quiz topics, and a suggested course outline.
          </p>
          <button
            onClick={handleGenerateInsights}
            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Generate Insights
          </button>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Uses 1 AI generation credit
          </p>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-3 border-[var(--accent)]/20 animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-6 font-medium">
            Analyzing your document...
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            This may take 10-20 seconds
          </p>
        </div>
      )}

      {/* Insights content */}
      {insights && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[300px]">
            {activeTab === "summary" && <SummaryTab summary={insights.summary} />}
            {activeTab === "concepts" && <ConceptsTab concepts={insights.keyConcepts} />}
            {activeTab === "glossary" && <GlossaryTab glossary={insights.glossary} />}
            {activeTab === "quiz" && <QuizTopicsTab topics={insights.quizTopics} />}
            {activeTab === "course" && <CourseOutlineTab outline={insights.courseOutline} />}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTab({ summary }: { summary: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Document Summary</h3>
      </div>
      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
        {summary}
      </p>
    </div>
  );
}

function ConceptsTab({ concepts }: { concepts: KeyConcept[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {concepts.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 hover:border-[var(--accent)]/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {item.concept}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GlossaryTab({ glossary }: { glossary: GlossaryItem[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {glossary.map((item, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 p-4 sm:p-5 hover:bg-[var(--bg-hover)] transition-colors">
            <span className="text-sm font-semibold text-[var(--accent)] sm:w-40 shrink-0">
              {item.term}
            </span>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {item.definition}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizTopicsTab({ topics }: { topics: string[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)] mb-4">
        These topics can be used to create targeted quizzes from this document.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((topic, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 hover:border-[var(--accent)]/30 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-400/10 text-purple-400 text-xs font-bold shrink-0 mt-0.5">
              ?
            </span>
            <p className="text-sm text-[var(--text-primary)]">{topic}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseOutlineTab({ outline }: { outline: CourseModule[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)] mb-4">
        A suggested course structure based on this document&apos;s content.
      </p>
      {outline.map((mod, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white text-xs font-bold shrink-0">
              M{i + 1}
            </span>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {mod.module}
            </h4>
          </div>
          <div className="p-4 sm:p-5 space-y-2">
            {mod.lessons.map((lesson, j) => (
              <div key={j} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]/40" />
                </span>
                <p className="text-sm text-[var(--text-secondary)]">{lesson}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
