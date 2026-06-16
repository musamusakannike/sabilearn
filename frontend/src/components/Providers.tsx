"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OcrWarmup } from "@/components/OcrWarmup";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <OcrWarmup />
      </AuthProvider>
    </ThemeProvider>
  );
}
