import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import { uploadToR2, downloadFromR2, isR2Configured } from "@/lib/r2";
import { extractTextFromBuffer, isSupportedMime } from "@/lib/document-extract";
import pdf from "pdf-parse";

// Allow up to 5 minutes for large scanned PDFs that require multi-batch OCR
export const maxDuration = 300;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_PDF_PAGES = 50;

/** Returns the page count of a PDF buffer without extracting text. Returns 0 on failure. */
async function getPdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const meta = await pdf(buffer, { max: 0 });
    return meta.numpages ?? 0;
  } catch {
    return 0;
  }
}

// Helper to get user session from cookie or Authorization header (for mobile support)
async function getSessionUser(request: Request) {
  // 1. Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    if (payload) return payload;
  }

  // 2. Fall back to cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  return verifyJWT(token);
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      console.warn("[Upload API] Failed: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Upload API] Initiating document registration/upload for user ID: ${session.userId}`);

    if (!isR2Configured) {
      console.error("[Upload API] Failed: R2 storage is not configured");
      return NextResponse.json(
        { error: "File storage is not configured. Please set up Cloudflare R2." },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let fileName = "";
    let mimeType = "";
    let sizeBytes = 0;
    let r2Key = "";
    let publicUrl = "";
    let buffer: Buffer | null = null;
    let isDirectUpload = false;

    if (contentType.includes("application/json")) {
      // Direct-to-R2 upload: Client sends file metadata
      const body = await request.json().catch(() => ({}));
      fileName = body.fileName;
      mimeType = body.mimeType;
      sizeBytes = body.sizeBytes;
      r2Key = body.r2Key;
      publicUrl = body.publicUrl;
      isDirectUpload = true;

      if (!fileName || !mimeType || !r2Key || !publicUrl) {
        console.warn("[Upload API] Failed: Missing metadata in JSON payload");
        return NextResponse.json({ error: "Missing required metadata fields" }, { status: 400 });
      }
    } else {
      // Legacy Multipart Form Upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        console.warn("[Upload API] Failed: No file provided in form data");
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      fileName = file.name;
      mimeType = file.type;
      sizeBytes = file.size;

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    console.log(`[Upload API] Processing file: "${fileName}" (Type: ${mimeType}, Size: ${sizeBytes} bytes, DirectUpload: ${isDirectUpload})`);

    if (sizeBytes > MAX_FILE_SIZE) {
      console.warn(`[Upload API] Failed: File size ${sizeBytes} exceeds maximum limit of ${MAX_FILE_SIZE} bytes for: "${fileName}"`);
      return NextResponse.json(
        { error: "File too large. Maximum size is 20 MB." },
        { status: 400 }
      );
    }

    if (!isSupportedMime(mimeType)) {
      console.warn(`[Upload API] Failed: Unsupported MIME type "${mimeType}" for file: "${fileName}"`);
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Supported: PDF, DOCX, PNG, JPEG, WebP, GIF, TXT, Markdown.` },
        { status: 400 }
      );
    }

    // PDF page count check — download buffer now for direct uploads so we can reuse it later
    if (mimeType === "application/pdf") {
      if (isDirectUpload && !buffer) {
        console.log(`[Upload API] Downloading buffer from R2 to validate page count for: "${fileName}"`);
        buffer = await downloadFromR2(r2Key);
      }
      if (buffer) {
        const pageCount = await getPdfPageCount(buffer);
        if (pageCount > MAX_PDF_PAGES) {
          console.warn(`[Upload API] Failed: PDF "${fileName}" has ${pageCount} pages, exceeds limit of ${MAX_PDF_PAGES}`);
          return NextResponse.json(
            { error: `PDF too long. Maximum is ${MAX_PDF_PAGES} pages (this file has ${pageCount} pages).` },
            { status: 400 }
          );
        }
        console.log(`[Upload API] PDF page count OK: ${pageCount} pages for "${fileName}"`);
      }
    }

    const useMicroservice = !!process.env.OCR_MICROSERVICE_URL;
    let ocrStatus = "completed";
    let extractedText = "";

    // If microservice is enabled, we postpone extraction (it runs in background via callback)
    if (useMicroservice) {
      ocrStatus = "processing";
      console.log(`[Upload API] OCR Microservice is enabled. Postponing extraction for: "${fileName}"`);
    } else {
      // Fallback: Run OCR synchronously
      try {
        console.log(`[Upload API] OCR Microservice URL is not set. Falling back to synchronous extraction for: "${fileName}"`);
        
        // If it was a direct upload, we need to download the buffer from R2 first
        if (isDirectUpload && !buffer) {
          console.log(`[Upload API] Downloading direct-uploaded buffer from R2 for OCR: "${r2Key}"`);
          buffer = await downloadFromR2(r2Key);
        }

        if (buffer) {
          extractedText = await extractTextFromBuffer(buffer, mimeType, fileName);
          console.log(`[Upload API] Synced text extraction completed successfully for: "${fileName}" (Extracted length: ${extractedText.length} chars)`);
        } else {
          throw new Error("File buffer is empty or could not be retrieved");
        }
      } catch (extractError: any) {
        console.error(`[Upload API] Synced text extraction failed for: "${fileName}". Error: ${extractError.message || extractError}`);
        ocrStatus = "failed";
      }
    }

    // If it was a multipart upload, we need to upload the buffer to R2 now
    if (!isDirectUpload) {
      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      r2Key = `documents/${session.userId}/${timestamp}-${safeName}`;
      
      console.log(`[Upload API] Uploading multipart buffer to R2 with key: "${r2Key}"`);
      if (!buffer) {
        throw new Error("No buffer available to upload");
      }
      publicUrl = await uploadToR2(buffer, r2Key, mimeType);
      console.log(`[Upload API] Uploaded successfully to R2. Public URL: ${publicUrl}`);
    }

    // Save metadata to MongoDB
    console.log(`[Upload API] Saving metadata to MongoDB for document: "${fileName}"`);
    const { db } = await connectToDatabase();
    const result = await db.collection("documents").insertOne({
      userId: session.userId,
      fileName,
      mimeType,
      sizeBytes,
      r2Key,
      publicUrl,
      extractedText,
      ocrStatus,
      createdAt: new Date(),
    });
    console.log(`[Upload API] Metadata saved to MongoDB with document ID: ${result.insertedId}`);

    // Asynchronously call the microservice if enabled
    if (useMicroservice) {
      const microserviceUrl = process.env.OCR_MICROSERVICE_URL;
      const secret = process.env.OCR_MICROSERVICE_SECRET;
      const docId = result.insertedId;

      console.log(`[Upload API] Triggering OCR microservice asynchronously for document: ${docId}`);

      // Retry helper: attempt to contact the microservice up to maxAttempts times.
      // The first attempt uses a short timeout so we detect cold-start quickly.
      // On cold-start the Render free tier needs ~30s to wake up, so we retry
      // with increasing delays rather than giving up immediately.
      const triggerMicroservice = async () => {
        const MAX_ATTEMPTS = 3;
        const ATTEMPT_TIMEOUTS_MS = [10_000, 20_000, 30_000]; // per attempt
        const RETRY_DELAYS_MS   = [5_000, 15_000];            // between attempts

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            ATTEMPT_TIMEOUTS_MS[attempt - 1]
          );

          try {
            const res = await fetch(`${microserviceUrl}/process-document`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(secret ? { "Authorization": `Bearer ${secret}` } : {}),
              },
              body: JSON.stringify({ documentId: docId.toString() }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (res.ok) {
              console.log(`[Upload API] Microservice triggered successfully for document ${docId} (attempt ${attempt})`);
              return; // success
            }

            const text = await res.text();
            console.error(`[Upload API] Microservice returned HTTP ${res.status} on attempt ${attempt}: ${text}`);

            // Non-retriable HTTP error — mark failed immediately
            if (res.status >= 400 && res.status < 500) {
              await db.collection("documents").updateOne(
                { _id: docId },
                { $set: { ocrStatus: "failed", ocrError: `Microservice returned HTTP ${res.status}: ${text}` } }
              );
              return;
            }

            // 5xx — fall through to retry
          } catch (err: any) {
            clearTimeout(timeoutId);
            const isTimeout = err?.name === "AbortError";
            console.warn(
              `[Upload API] Microservice ${isTimeout ? "timed out" : "unreachable"} on attempt ${attempt}/${MAX_ATTEMPTS}:`,
              err.message || err
            );
          }

          // Wait before retrying (skip delay after last attempt)
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
          }
        }

        // All attempts exhausted — mark as failed so the document doesn't spin forever
        console.error(`[Upload API] All ${MAX_ATTEMPTS} microservice trigger attempts failed for document ${docId}. Marking as failed.`);
        await db.collection("documents").updateOne(
          { _id: docId },
          {
            $set: {
              ocrStatus: "failed",
              ocrError:
                "OCR service could not be reached after multiple attempts. Please use the Retry button to try again.",
            },
          }
        );
      };

      // Fire-and-forget — do not await so we can return the upload response immediately
      triggerMicroservice().catch((err) => {
        console.error(`[Upload API] Unhandled error in triggerMicroservice for ${docId}:`, err);
      });
    }

    console.log(`[Upload API] Document "${fileName}" registered/uploaded successfully!`);

    return NextResponse.json({
      success: true,
      document: {
        _id: result.insertedId.toString(),
        fileName,
        mimeType,
        sizeBytes,
        publicUrl,
        ocrStatus,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Upload API] Critical error during document upload/registration:", error);
    const message = error instanceof Error ? error.message : "Failed to upload/register document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
