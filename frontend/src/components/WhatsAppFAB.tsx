"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function WhatsAppFAB() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check if the user has previously dismissed the FAB
    const dismissed = localStorage.getItem("sabilearn_wa_dismissed");
    if (!dismissed) {
      // Delay showing the FAB slightly for a smooth, natural entrance
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMounted(false);
    localStorage.setItem("sabilearn_wa_dismissed", "true");
  };

  if (!isMounted) return null;

  // Formatting phone number to international wa.me standard (no + prefix, spaces, or dashes)
  const phone = "2348084737618";
  const message = "Hello Sabi Learn Support! I have a question and would like some assistance.";
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] flex items-center justify-end select-none transition-all duration-500 ease-out",
        isMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90 pointer-events-none"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip text, displayed on hover */}
      <div
        className={cn(
          "absolute right-12 mr-3 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 shadow-lg border",
          "bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] border-[var(--border)]",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        )}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse mr-2" />
        Chat with Support
      </div>

      <div className="relative flex items-center justify-center">
        {/* Cancellable Dismiss Button */}
        <button
          onClick={handleDismiss}
          className={cn(
            "absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 rounded-full border shadow-sm transition-all duration-200 cursor-pointer",
            "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--text-muted)]",
            "hover:scale-110 active:scale-95"
          )}
          aria-label="Dismiss WhatsApp support"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Dynamic Pulse Glow Ring */}
        <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 animate-ping opacity-60 pointer-events-none" />

        {/* Premium Glassmorphic FAB Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full border shadow-lg transition-all duration-300",
            "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300",
            "hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          )}
          aria-label="Chat on WhatsApp"
        >
          {/* Custom SVG WhatsApp Path to guarantee exact rendering and brand look */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19.14 7.86A9.9 9.9 0 0 0 12 4a10 10 0 0 0-8.52 15.24L3 23l3.9-1a9.92 9.92 0 0 0 4.7 1.2h.01a10 10 0 0 0 7.87-3.83A9.9 9.9 0 0 0 19.14 7.86zM12 21.6a8.28 8.28 0 0 1-4.22-1.16l-.3-.18-2.3.6.61-2.23-.2-.32A8.25 8.25 0 0 1 4.3 12a8.3 8.3 0 0 1 8.3-8.3A8.25 8.25 0 0 1 20.9 12a8.33 8.33 0 0 1-8.9 8.3h-.01zm4.55-6.2c-.25-.12-1.47-.72-1.7-.8s-.38-.12-.54.12-.62.8-.76.96-.28.17-.53.05a6.73 6.73 0 0 1-2.48-1.53 7.4 7.4 0 0 1-1.72-2.14c-.15-.25-.02-.38.1-.5s.25-.3.38-.45a1.72 1.72 0 0 0 .25-.42.47.47 0 0 0-.02-.45c-.07-.15-.54-1.32-.74-1.8-.2-.48-.38-.41-.54-.42l-.46-.01a.88.88 0 0 0-.64.3 2.68 2.68 0 0 0-.84 2c0 1.18.86 2.32.98 2.49a19.16 19.16 0 0 0 7.37 6.47c1.75.76 2.4.82 3.25.7a2.78 2.78 0 0 0 1.83-1.3 2.25 2.25 0 0 0 .15-1.3c-.07-.1-.28-.22-.53-.34z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
