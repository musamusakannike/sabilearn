import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { RegisterSW } from "@/components/RegisterSW";
import { OfflineToast } from "@/components/OfflineToast";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";
import { Analytics } from "@vercel/analytics/react";
import "katex/dist/katex.min.css";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sabilearn.online"),
  title: {
    default: "Sabi Learn — Sabi the way your brain dey work",
    template: "%s | Sabi Learn",
  },
  description: "AI-powered personalized learning. Generate courses, explanatory videos, and practice quizzes tailored entirely to how you sabi book best.",
  keywords: ["AI learning", "personalized education", "course generator", "AI tutor", "study tools", "AI course maker", "personalized quizzes", "sabi learn"],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Sabi Learn — Sabi the way your brain dey work",
    description: "AI-powered personalized learning. Generate courses, explanatory videos, and practice quizzes tailored entirely to how you sabi book best.",
    url: "https://sabilearn.online",
    siteName: "Sabi Learn",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabi Learn — Sabi the way your brain dey work",
    description: "AI-powered personalized learning. Generate courses, explanatory videos, and practice quizzes tailored entirely to how you sabi book best.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sabi Learn",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                  if (saved === 'light' || (!saved && systemLight)) {
                     document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: "list",
                  urls: ["/login", "/register"],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
          <RegisterSW />
          <OfflineToast />
          <WhatsAppFAB />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
