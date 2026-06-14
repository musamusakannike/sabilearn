import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * POST /api/documents/ocr-callback
 *
 * Called by the OCR microservice when it finishes processing a document.
 * Accepts the extracted text and status, then updates the document in MongoDB.
 *
 * Body: { documentId, extractedText?, ocrStatus, ocrError? }
 * Auth: Bearer <OCR_MICROSERVICE_SECRET>
 */
export async function POST(request: Request) {
  try {
    // Authenticate the callback using the shared microservice secret
    const secret = process.env.OCR_MICROSERVICE_SECRET;
    if (secret) {
      const authHeader = request.headers.get("authorization");
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.substring(7)
          : null;

      if (!token || token !== secret) {
        console.warn("[OCR Callback] Unauthorized callback attempt.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn(
        "[OCR Callback] WARNING: OCR_MICROSERVICE_SECRET is not set. Callback endpoint is unsecured."
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { documentId, extractedText, ocrStatus, ocrError } = body;

    if (!documentId || !ObjectId.isValid(documentId)) {
      return NextResponse.json(
        { error: "Invalid or missing documentId" },
        { status: 400 }
      );
    }

    if (!ocrStatus || !["completed", "failed"].includes(ocrStatus)) {
      return NextResponse.json(
        { error: "ocrStatus must be 'completed' or 'failed'" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateFields: Record<string, unknown> = {
      ocrStatus,
      ocrError: ocrError || null,
    };

    if (ocrStatus === "completed" && extractedText !== undefined) {
      updateFields.extractedText = extractedText;
    }

    const result = await db.collection("documents").updateOne(
      { _id: new ObjectId(documentId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      console.warn(
        `[OCR Callback] Document not found: ${documentId}`
      );
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(
      `[OCR Callback] Document ${documentId} updated → ocrStatus: ${ocrStatus} (${
        ocrStatus === "completed"
          ? `${extractedText?.length ?? 0} chars extracted`
          : `error: ${ocrError}`
      })`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OCR Callback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
