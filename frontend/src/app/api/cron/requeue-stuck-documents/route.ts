import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// Documents stuck in "processing" for longer than this are considered stale
const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/cron/requeue-stuck-documents
 *
 * Cron job that finds documents stuck in "processing" for >10 minutes and
 * re-triggers the OCR microservice for each one.
 *
 * Schedule: every 10 minutes (configure in vercel.json)
 * Auth: Bearer <CRON_SECRET> or open if CRON_SECRET is not set.
 */
export async function GET(request: Request) {
  // Validate cron secret when configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const microserviceUrl = process.env.OCR_MICROSERVICE_URL;
  const microserviceSecret = process.env.OCR_MICROSERVICE_SECRET;

  if (!microserviceUrl) {
    return NextResponse.json({
      success: true,
      message: "OCR microservice not configured — nothing to requeue",
      requeued: 0,
    });
  }

  try {
    const { db } = await connectToDatabase();

    const stuckBefore = new Date(Date.now() - STUCK_THRESHOLD_MS);

    // Find all documents that are still in "processing" and were created/updated
    // before the stuck threshold.
    const stuckDocs = await db
      .collection("documents")
      .find({
        ocrStatus: "processing",
        createdAt: { $lt: stuckBefore },
      })
      .project({ _id: 1, fileName: 1, userId: 1 })
      .toArray();

    if (stuckDocs.length === 0) {
      console.log("[Watchdog Cron] No stuck documents found.");
      return NextResponse.json({ success: true, requeued: 0 });
    }

    console.log(
      `[Watchdog Cron] Found ${stuckDocs.length} stuck document(s). Re-triggering OCR microservice...`
    );

    const results: { id: string; fileName: string; status: string }[] = [];

    for (const doc of stuckDocs) {
      const docId = doc._id.toString();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s per attempt

        const res = await fetch(`${microserviceUrl}/process-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(microserviceSecret
              ? { Authorization: `Bearer ${microserviceSecret}` }
              : {}),
          },
          body: JSON.stringify({ documentId: docId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          console.log(`[Watchdog Cron] Re-queued document ${docId} (${doc.fileName})`);
          results.push({ id: docId, fileName: doc.fileName, status: "requeued" });
        } else {
          const text = await res.text();
          console.warn(
            `[Watchdog Cron] Microservice returned ${res.status} for document ${docId}: ${text}`
          );

          // If the microservice definitively rejects the document (4xx), mark it failed
          // so users see an actionable error rather than an infinite spinner.
          if (res.status >= 400 && res.status < 500) {
            await db.collection("documents").updateOne(
              { _id: doc._id },
              {
                $set: {
                  ocrStatus: "failed",
                  ocrError: `Processing failed (microservice HTTP ${res.status}). Please retry.`,
                },
              }
            );
            results.push({ id: docId, fileName: doc.fileName, status: "marked_failed" });
          } else {
            results.push({ id: docId, fileName: doc.fileName, status: `error_${res.status}` });
          }
        }
      } catch (err: any) {
        const isTimeout = err?.name === "AbortError";
        console.warn(
          `[Watchdog Cron] ${isTimeout ? "Timeout" : "Error"} contacting microservice for document ${docId}:`,
          err.message || err
        );
        results.push({
          id: docId,
          fileName: doc.fileName,
          status: isTimeout ? "timeout" : "error",
        });
      }
    }

    const requeuedCount = results.filter((r) => r.status === "requeued").length;
    const failedCount = results.filter((r) => r.status === "marked_failed").length;

    console.log(
      `[Watchdog Cron] Done. Requeued: ${requeuedCount}, Marked failed: ${failedCount}, Total stuck: ${stuckDocs.length}`
    );

    return NextResponse.json({
      success: true,
      requeued: requeuedCount,
      markedFailed: failedCount,
      total: stuckDocs.length,
      results,
    });
  } catch (error: any) {
    console.error("[Watchdog Cron] Critical error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
