import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import { downloadFromR2 } from "@/lib/r2";
import { extractTextFromBuffer } from "@/lib/document-extract";
import { ObjectId } from "mongodb";

// Allow up to 5 minutes for large scanned PDFs
export const maxDuration = 300;

async function getSessionUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    if (payload) return payload;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyJWT(token);
}

/**
 * POST /api/documents/reprocess
 *
 * Re-triggers OCR processing for a document that is stuck in "processing"
 * or has previously "failed". Ownership is verified before retrying.
 *
 * Body: { documentId }
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.documentId || !ObjectId.isValid(body.documentId)) {
      return NextResponse.json(
        { error: "Invalid or missing documentId" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const doc = await db.collection("documents").findOne({
      _id: new ObjectId(body.documentId),
      userId: session.userId,
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only allow reprocessing when stuck or previously failed
    if (doc.ocrStatus === "completed" && doc.extractedText?.trim()) {
      return NextResponse.json(
        { error: "Document has already been processed successfully." },
        { status: 409 }
      );
    }

    const useMicroservice = !!process.env.OCR_MICROSERVICE_URL;

    if (useMicroservice) {
      // Mark as processing again and re-trigger the microservice
      await db.collection("documents").updateOne(
        { _id: doc._id },
        { $set: { ocrStatus: "processing", ocrError: null } }
      );

      const microserviceUrl = process.env.OCR_MICROSERVICE_URL;
      const secret = process.env.OCR_MICROSERVICE_SECRET;

      // Call microservice with a timeout so we know if it's unreachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

      try {
        const res = await fetch(`${microserviceUrl}/process-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
          },
          body: JSON.stringify({ documentId: doc._id.toString() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const text = await res.text();
          console.error(
            `[Reprocess API] Microservice returned error: ${res.status} - ${text}`
          );
          await db.collection("documents").updateOne(
            { _id: doc._id },
            {
              $set: {
                ocrStatus: "failed",
                ocrError: `Microservice returned HTTP ${res.status}: ${text}`,
              },
            }
          );
          return NextResponse.json(
            {
              error:
                "OCR service is unavailable. Please try again in a few moments.",
            },
            { status: 503 }
          );
        }

        console.log(
          `[Reprocess API] Microservice successfully triggered for document ${doc._id}`
        );
        return NextResponse.json({
          success: true,
          message: "Reprocessing started",
          ocrStatus: "processing",
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        const isTimeout = fetchErr?.name === "AbortError";
        const errMsg = isTimeout
          ? "OCR service timed out (it may be starting up). Please try again in 30 seconds."
          : fetchErr.message || String(fetchErr);

        console.error(`[Reprocess API] Failed to contact microservice:`, fetchErr);
        await db.collection("documents").updateOne(
          { _id: doc._id },
          { $set: { ocrStatus: "failed", ocrError: errMsg } }
        );
        return NextResponse.json({ error: errMsg }, { status: 503 });
      }
    } else {
      // No microservice — run synchronously
      await db.collection("documents").updateOne(
        { _id: doc._id },
        { $set: { ocrStatus: "processing", ocrError: null } }
      );

      try {
        console.log(
          `[Reprocess API] Downloading buffer from R2 for document: ${doc._id}`
        );
        const buffer = await downloadFromR2(doc.r2Key);
        const extractedText = await extractTextFromBuffer(
          buffer,
          doc.mimeType,
          doc.fileName
        );

        await db.collection("documents").updateOne(
          { _id: doc._id },
          {
            $set: {
              extractedText,
              ocrStatus: "completed",
              ocrError: null,
            },
          }
        );

        console.log(
          `[Reprocess API] Synchronous extraction completed for: ${doc._id} (${extractedText.length} chars)`
        );
        return NextResponse.json({
          success: true,
          message: "Document processed successfully",
          ocrStatus: "completed",
        });
      } catch (extractError: any) {
        const errMsg =
          extractError.message || String(extractError);
        console.error(
          `[Reprocess API] Synchronous extraction failed for: ${doc._id}:`,
          extractError
        );
        await db.collection("documents").updateOne(
          { _id: doc._id },
          { $set: { ocrStatus: "failed", ocrError: errMsg } }
        );
        return NextResponse.json(
          { error: `Extraction failed: ${errMsg}` },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("[Reprocess API] Critical error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
