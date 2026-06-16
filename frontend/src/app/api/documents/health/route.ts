import { NextResponse } from "next/server";

export async function GET() {
  try {
    const microserviceUrl = process.env.OCR_MICROSERVICE_URL;
    if (!microserviceUrl) {
      return NextResponse.json({ status: "skipped", message: "OCR microservice URL not configured" });
    }

    console.log(`[OCR Health] Pinging OCR Microservice health endpoint at: ${microserviceUrl}/health`);
    
    const res = await fetch(`${microserviceUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[OCR Health] Ping failed with status ${res.status}: ${errorText}`);
      return NextResponse.json(
        { status: "error", error: `Microservice returned status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    console.log(`[OCR Health] Ping succeeded:`, data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[OCR Health] Error pinging OCR microservice:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
