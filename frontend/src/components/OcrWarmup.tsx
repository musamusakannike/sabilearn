"use client";

/**
 * OcrWarmup
 *
 * Invisible component that fires a background ping to the OCR microservice
 * as soon as any user opens the app. This reduces cold-start delays when
 * they later try to upload a document.
 *
 * Renders nothing — safe to mount anywhere in the tree.
 */
import { useEffect } from "react";
import { warmUpOcr } from "@/lib/ocr-health";

export function OcrWarmup() {
  useEffect(() => {
    // Small delay so it doesn't compete with critical app bootstrap requests
    const tid = setTimeout(() => warmUpOcr(), 2000);
    return () => clearTimeout(tid);
  }, []);

  return null;
}
