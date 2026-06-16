"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  checkOcrHealth,
  waitForOcrAwake,
  onOcrHealthChange,
  type OcrHealthStatus,
} from "@/lib/ocr-health";

export interface UploadedDoc {
  _id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
  ocrError?: string | null;
  createdAt: string;
}

interface DocumentUploadProps {
  onUploadComplete: (doc: UploadedDoc) => void;
  onError?: (error: string) => void;
  compact?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
].join(",");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_PDF_PAGES = 50;

async function getPdfPageCount(file: File): Promise<number> {
  try {
    const text = await file.text();
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

export function DocumentUpload({
  onUploadComplete,
  onError,
  compact = false,
  className,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrHealthStatus>("unknown");
  const [ocrRetryAttempt, setOcrRetryAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local OCR status in sync with the shared singleton
  useEffect(() => {
    return onOcrHealthChange((s) => setOcrStatus(s));
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setValidationError(null);

      // 1. Size check — hard limit: 20 MB
      if (file.size > MAX_FILE_SIZE) {
        const msg = `File too large. Maximum size is 20 MB (your file: ${formatFileSize(file.size)}).`;
        console.warn(`[DocumentUpload Component] File "${file.name}" is too large: ${file.size} bytes`);
        setValidationError(msg);
        onError?.(msg);
        return;
      }

      // 2. Page count check — hard limit: 50 pages (PDFs only)
      if (file.type === "application/pdf") {
        const pageCount = await getPdfPageCount(file);
        if (pageCount > MAX_PDF_PAGES) {
          const msg = `Too many pages. Maximum is 50 pages (this PDF has ${pageCount} pages).`;
          console.warn(`[DocumentUpload Component] File "${file.name}" has ${pageCount} pages, exceeds limit of ${MAX_PDF_PAGES}`);
          setValidationError(msg);
          onError?.(msg);
          return;
        }
      }

      // 3. OCR health check — make sure the microservice is awake before uploading
      //    so the document doesn't end up stuck in "processing" indefinitely.
      setUploading(true);
      setProgress(0);
      setOcrRetryAttempt(0);

      const abort = new AbortController();
      abortRef.current = abort;

      // Check once first (may use cached "awake" status from the warmup ping)
      let currentStatus = await checkOcrHealth();

      if (currentStatus === "asleep") {
        // Service is sleeping — wait up to ~1 min (6 attempts × 10s), with live UI feedback.
        // If it doesn't wake in time we still proceed: the document will be saved as
        // "processing" and the server-side watchdog cron will requeue it automatically.
        console.log("[DocumentUpload Component] OCR service is asleep. Waiting for it to wake up (max 6 attempts)...");
        const awake = await waitForOcrAwake(
          10_000,
          (attempt) => {
            console.log(`[DocumentUpload Component] OCR wake-up retry attempt ${attempt}`);
            setOcrRetryAttempt(attempt);
          },
          abort.signal,
          6
        ).catch(() => false);

        if (abort.signal.aborted) {
          setUploading(false);
          setOcrRetryAttempt(0);
          abortRef.current = null;
          return;
        }

        if (!awake) {
          console.warn("[DocumentUpload Component] OCR service did not wake up in time. Proceeding with upload anyway — the server watchdog will requeue processing.");
        }
      }

      // If abort was triggered while checking, bail
      if (abort.signal.aborted) {
        setUploading(false);
        setOcrRetryAttempt(0);
        abortRef.current = null;
        return;
      }

      // Reset the retry UI now that we're proceeding
      setOcrRetryAttempt(0);

      console.log(`[DocumentUpload Component] Starting upload process for file: "${file.name}" (Type: ${file.type}, Size: ${file.size} bytes)`);

      try {
        // Step 1: Get presigned upload URL from Next.js backend
        console.log(`[DocumentUpload Component] Fetching presigned upload URL for: "${file.name}"`);
        const presignRes = await fetch("/api/documents/presign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });

        if (!presignRes.ok) {
          const resData = await presignRes.json().catch(() => ({}));
          throw new Error(resData.error || "Failed to generate upload signature");
        }

        const { uploadUrl, publicUrl, r2Key } = await presignRes.json();
        console.log(`[DocumentUpload Component] Presigned URL retrieved successfully. Destination key: "${r2Key}"`);

        // Step 2: Upload raw file bytes directly to Cloudflare R2 via PUT using XMLHttpRequest
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              // Scale progress to 90% while uploading to storage
              const pct = Math.round((e.loaded / e.total) * 90);
              setProgress(pct);
              console.log(`[DocumentUpload Component] Storage upload progress for "${file.name}": ${pct}%`);
            }
          };

          xhr.onload = () => {
            console.log(`[DocumentUpload Component] Storage upload response received. HTTP status: ${xhr.status}`);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Storage upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            console.error(`[DocumentUpload Component] Network error during storage upload of "${file.name}"`);
            reject(new Error("Network error during storage upload"));
          };

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        await uploadPromise;
        console.log(`[DocumentUpload Component] Successfully uploaded "${file.name}" directly to R2.`);

        // Step 3: Register the uploaded document in MongoDB
        console.log(`[DocumentUpload Component] Registering file metadata with API backend`);
        const registerRes = await fetch("/api/documents/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            r2Key,
            publicUrl,
          }),
        });

        if (!registerRes.ok) {
          const resData = await registerRes.json().catch(() => ({}));
          throw new Error(resData.error || "Failed to register document metadata on server");
        }

        const data = await registerRes.json();
        console.log(`[DocumentUpload Component] Document registration succeeded. MongoDB ID: ${data.document._id}`);

        setProgress(100);
        onUploadComplete(data.document);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        console.error(`[DocumentUpload Component] Upload process failed: ${message}`, err);
        onError?.(message);
      } finally {
        setUploading(false);
        setProgress(0);
        setOcrRetryAttempt(0);
        abortRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onUploadComplete, onError]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setValidationError(null); uploadFile(file); }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      setValidationError(null);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (compact) {    return (
      <div className={cn("relative", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span>
                {ocrRetryAttempt > 0
                  ? `Waking up… (retry ${ocrRetryAttempt})`
                  : ocrStatus === "checking"
                  ? "Checking service…"
                  : `${progress}%`}
              </span>
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload file</span>
            </>
          )}
        </button>
        {uploading && ocrRetryAttempt === 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200",
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
            : validationError
              ? "border-[var(--danger)]/40 hover:border-[var(--danger)]/60"
              : "border-[var(--border)] hover:border-[var(--text-muted)]",
          uploading && "pointer-events-none opacity-70",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex flex-col items-center justify-center p-6 gap-3">
        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin" />
            {ocrRetryAttempt > 0 ? (
              <>
                <p className="text-sm text-[var(--text-secondary)] font-medium">
                  Waking up document reader…
                </p>
                <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
                  The reading service is starting up. Retrying automatically every 10 s
                  <span className="text-[var(--accent)] font-medium"> (attempt {ocrRetryAttempt})</span>.
                </p>
              </>
            ) : ocrStatus === "checking" ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Checking document reader…
              </p>
            ) : (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Uploading... {progress}%
                </p>
                <div className="w-full max-w-xs h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Click to upload
              </button>
              <span className="text-sm text-[var(--text-muted)]">
                {" "}
                or drag & drop
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              PDF, DOCX, images (PNG, JPEG, WebP), TXT — up to{" "}
              <span className="text-[var(--accent)] font-semibold">20 MB</span>
              {" "}·{" "}
              <span className="text-[var(--accent)] font-semibold">50 pages</span>{" "}max
            </p>
          </>
        )}
      </div>
    </div>

      {/* Validation error banner */}
      {validationError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--danger)]/8 border border-[var(--danger)]/20 text-xs text-[var(--danger)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

interface AttachedDocChipProps {
  doc: UploadedDoc;
  onRemove: (id: string) => void;
}

function mimeIcon(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word")) return "DOC";
  if (mime.startsWith("image/")) return "IMG";
  return "TXT";
}

export function AttachedDocChip({ doc, onRemove }: AttachedDocChipProps) {
  return (
    <div className={cn(
      "group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors",
      doc.ocrStatus === "failed" 
        ? "bg-[var(--danger)]/5 border-[var(--danger)]/20" 
        : "bg-[var(--bg-tertiary)] border-[var(--border)]"
    )}>
      <span className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold shrink-0",
        doc.ocrStatus === "failed"
          ? "bg-[var(--danger)]/10 text-[var(--danger)]"
          : "bg-[var(--accent-muted)] text-[var(--accent)]"
      )}>
        {mimeIcon(doc.mimeType)}
      </span>
      <span className="text-[var(--text-secondary)] truncate max-w-[140px] flex items-center gap-1.5">
        {doc.fileName}
        {doc.ocrStatus === "processing" && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" title="Reading file..." />
        )}
        {doc.ocrStatus === "failed" && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" title="Could not read file" />
        )}
      </span>
      <span className="text-[var(--text-muted)]">
        {formatFileSize(doc.sizeBytes)}
      </span>
      <button
        type="button"
        onClick={() => onRemove(doc._id)}
        className="ml-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
