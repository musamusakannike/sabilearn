"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { DocumentUpload, type UploadedDoc } from "./DocumentUpload";

interface DocumentPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (docs: UploadedDoc[]) => void;
  selectedIds?: string[];
}

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

export function DocumentPicker({
  open,
  onClose,
  onSelect,
  selectedIds = [],
}: DocumentPickerProps) {
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(selectedIds));
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) setDocuments(data.documents || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDocuments();
      setSelected(new Set(selectedIds));
      // Ping the OCR microservice health endpoint to wake it up (cold start recovery)
      // Uses the shared singleton so it doesn't double-fire if OcrWarmup already ran
      import("@/lib/ocr-health").then(({ checkOcrHealth }) => {
        checkOcrHealth().catch((err) => {
          console.warn("[OCR Health] Failed to ping health endpoint:", err);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Poll list silently every 5 seconds inside the picker modal if any document is processing
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.ocrStatus === "processing");
    if (hasProcessing && open) {
      const interval = setInterval(() => {
        fetch("/api/documents")
          .then((res) => res.json())
          .then((data) => {
            if (data.success) setDocuments(data.documents || []);
          })
          .catch(() => {});
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents, open]);

  const toggleSelect = (id: string) => {
    const doc = documents.find((d) => d._id === id);
    if (doc?.ocrStatus === "processing" || doc?.ocrStatus === "failed") {
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedDocs = documents.filter((d) => selected.has(d._id));
  const hasProcessingSelected = selectedDocs.some((d) => d.ocrStatus === "processing");
  const hasFailedSelected = selectedDocs.some((d) => d.ocrStatus === "failed");
  const isAttachDisabled = selected.size === 0 || hasProcessingSelected || hasFailedSelected;

  const handleConfirm = () => {
    if (isAttachDisabled) return;
    onSelect(selectedDocs);
    onClose();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d._id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadComplete = (doc: UploadedDoc) => {
    setDocuments((prev) => [doc, ...prev]);
    setSelected((prev) => new Set([...prev, doc._id]));
    setTab("library");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Documents
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setTab("library")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "library"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            My Library
          </button>
          <button
            onClick={() => setTab("upload")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "upload"
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "upload" ? (
            <DocumentUpload
              onUploadComplete={handleUploadComplete}
              onError={(err) => console.error(err)}
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-muted)] mb-3">
                No documents yet.
              </p>
              <button
                onClick={() => setTab("upload")}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isProcessing = doc.ocrStatus === "processing";
                const isFailed = doc.ocrStatus === "failed";
                const isDisabled = isProcessing || isFailed;
                return (
                  <div
                    key={doc._id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isDisabled
                        ? "opacity-60 cursor-not-allowed border-[var(--border)] bg-[var(--bg-secondary)]"
                        : selected.has(doc._id)
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] cursor-pointer"
                        : "border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
                    )}
                    onClick={() => toggleSelect(doc._id)}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        isDisabled
                          ? "border-[var(--border)] bg-[var(--bg-secondary)]"
                          : selected.has(doc._id)
                          ? "border-[var(--accent)] bg-[var(--accent)]"
                          : "border-[var(--border)]"
                      )}
                    >
                      {selected.has(doc._id) && !isDisabled && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Icon */}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold shrink-0",
                        mimeColor(doc.mimeType)
                      )}
                    >
                      {mimeIcon(doc.mimeType)}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 max-w-full">
                        <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                          {doc.fileName}
                        </p>
                        {isProcessing && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/10 animate-pulse shrink-0">
                            Reading file...
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/10 shrink-0">
                            Could not read
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatFileSize(doc.sizeBytes)} &middot;{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc._id);
                    }}
                    disabled={deleting === doc._id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    style={{ opacity: deleting === doc._id ? 0.5 : undefined }}
                  >
                    {deleting === doc._id ? (
                      <div className="w-3 h-3 border-2 border-[var(--danger)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )}
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "library" && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-primary)]">
            <p className="text-xs text-[var(--text-muted)]">
              {selected.size} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isAttachDisabled}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasProcessingSelected ? "Processing..." : hasFailedSelected ? "Could not read" : `Attach ${selected.size > 0 ? `(${selected.size})` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
