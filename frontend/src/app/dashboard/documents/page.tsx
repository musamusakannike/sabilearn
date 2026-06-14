"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DocumentUpload, type UploadedDoc } from "@/components/documents";
import { FetchError } from "@/components/FetchError";
import { cn } from "@/lib/cn";

// If a document stays in "processing" for longer than this, show a retry button
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  // Track when each document entered "processing" so we can time out
  const processingStartRef = useRef<Record<string, number>>({});

  const fetchDocuments = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok && data.success) {
        const docs: UploadedDoc[] = data.documents || [];
        // Record when newly-processing documents started so we can timeout
        const now = Date.now();
        docs.forEach((doc) => {
          if (doc.ocrStatus === "processing" && !processingStartRef.current[doc._id]) {
            // Use createdAt as the start time if available, else now
            processingStartRef.current[doc._id] =
              doc.createdAt ? new Date(doc.createdAt).getTime() : now;
          }
          if (doc.ocrStatus !== "processing") {
            delete processingStartRef.current[doc._id];
          }
        });
        setDocuments(docs);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    }
  }, []);

  const retryFetch = useCallback(() => {
    setLoading(true);
    fetchDocuments().finally(() => setLoading(false));
  }, [fetchDocuments]);

  useEffect(() => {
    let cancelled = false;
    fetchDocuments().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchDocuments]);

  // Poll list every 5 seconds if there are any documents still in processing status
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.ocrStatus === "processing");
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  const handleUploadComplete = (doc: UploadedDoc) => {
    if (doc.ocrStatus === "processing") {
      processingStartRef.current[doc._id] = Date.now();
    }
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        delete processingStartRef.current[id];
        setDocuments((prev) => prev.filter((d) => d._id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleRetry = async (id: string) => {
    setRetrying(id);
    // Optimistically show processing state
    setDocuments((prev) =>
      prev.map((d) => (d._id === id ? { ...d, ocrStatus: "processing" as const } : d))
    );
    processingStartRef.current[id] = Date.now();
    try {
      const res = await fetch("/api/documents/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert to failed with the error message
        setDocuments((prev) =>
          prev.map((d) =>
            d._id === id
              ? { ...d, ocrStatus: "failed" as const, ocrError: data.error || "Retry failed" }
              : d
          )
        );
        delete processingStartRef.current[id];
      } else if (data.ocrStatus === "completed") {
        // Sync mode resolved immediately — refresh the list
        await fetchDocuments();
      }
      // If still processing, the poll interval will pick up the result
    } catch {
      setDocuments((prev) =>
        prev.map((d) =>
          d._id === id
            ? { ...d, ocrStatus: "failed" as const, ocrError: "Retry failed" }
            : d
        )
      );
      delete processingStartRef.current[id];
    } finally {
      setRetrying(null);
    }
  };

  // Determine if a processing document has timed out and needs a manual retry
  const isTimedOut = (doc: UploadedDoc): boolean => {
    if (doc.ocrStatus !== "processing") return false;
    const startedAt = processingStartRef.current[doc._id];
    if (!startedAt) return false;
    return Date.now() - startedAt > PROCESSING_TIMEOUT_MS;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold mb-2">
        Documents
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6 sm:mb-8">
        Upload and manage your study materials. Use them with AI Chat, Course Generation, or Quiz Generation.
      </p>

      {/* Upload area */}
      <DocumentUpload
        onUploadComplete={handleUploadComplete}
        className="mb-6 sm:mb-8"
      />

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <FetchError message="Couldn't load your documents." onRetry={retryFetch} />
      ) : documents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)]">
            No documents yet. Upload your first file above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              {/* Icon */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold shrink-0",
                  mimeColor(doc.mimeType)
                )}
              >
                {mimeIcon(doc.mimeType)}
              </span>

              {/* Info — clickable to navigate to insights */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/dashboard/documents/${doc._id}`)}
              >
                <div className="flex items-center gap-2 max-w-full">
                  <p className="text-sm text-[var(--text-primary)] font-medium truncate group-hover:text-[var(--accent)] transition-colors">
                    {doc.fileName}
                  </p>
                  {doc.ocrStatus === "processing" && !isTimedOut(doc) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/10 animate-pulse shrink-0">
                      Reading file...
                    </span>
                  )}
                  {doc.ocrStatus === "processing" && isTimedOut(doc) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-500 border border-amber-400/20 shrink-0">
                      Taking too long
                    </span>
                  )}
                  {doc.ocrStatus === "failed" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/10 shrink-0">
                      Could not read
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatFileSize(doc.sizeBytes)} &middot;{" "}
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Retry button — shown when processing timed out or failed */}
                {(doc.ocrStatus === "failed" || isTimedOut(doc)) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(doc._id); }}
                    disabled={retrying === doc._id}
                    className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-400/10 hover:bg-amber-400/20 transition-all disabled:opacity-50"
                    title="Retry processing"
                  >
                    {retrying === doc._id ? (
                      <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4.49" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">Retry</span>
                  </button>
                )}
                <button
                  onClick={() => router.push(`/dashboard/documents/${doc._id}`)}
                  className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] bg-[var(--accent-muted)] hover:bg-[var(--accent)]/20 transition-all"
                  title="View Insights"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="hidden sm:inline">Insights</span>
                </button>
                <a
                  href={doc.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  title="Open file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(doc._id)}
                  disabled={deleting === doc._id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === doc._id ? (
                    <div className="w-3.5 h-3.5 border-2 border-[var(--danger)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
