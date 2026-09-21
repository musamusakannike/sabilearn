import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Maximize2, X, ExternalLink } from 'lucide-react';
import { TopicContent } from '@/lib/types';
import { MathBlock, RichText } from '@/components/lesson/RichText';

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] transition-colors hover:bg-[var(--line)]"
      title="Copy code to clipboard"
      type="button"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-[var(--success)]" />
          <span className="text-[var(--success)]">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function FullscreenImage({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const modal = isOpen && mounted ? (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
    >
      {/* Top Header */}
      <div
        className="w-full max-w-5xl flex items-center justify-between gap-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-white/80 truncate max-w-md select-none">
          {alt}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original image in new tab"
            className="flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-colors cursor-pointer"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close fullscreen view"
            className="flex items-center justify-center size-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 min-h-0"
        onClick={() => setIsOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[82vh] max-w-full rounded-xl object-contain drop-shadow-2xl select-none cursor-default"
        />
      </div>

      {/* Bottom Hint */}
      <div
        className="z-10 text-xs text-white/50 select-none pb-1"
        onClick={(e) => e.stopPropagation()}
      >
        Click anywhere outside or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white/80">ESC</kbd> to close
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="group/img relative inline-flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-2 transition-all hover:border-[var(--brand-gold)] shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onClick={() => setIsOpen(true)}
          className="max-h-72 w-auto max-w-full rounded-xl bg-transparent object-contain drop-shadow-sm cursor-zoom-in transition-transform duration-200 group-hover/img:scale-[1.01]"
        />

        {/* Expand / Fullscreen Button Badge */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="View image fullscreen"
          className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all sm:opacity-0 sm:group-hover/img:opacity-100 hover:scale-105 cursor-pointer"
        >
          <Maximize2 className="size-3.5" />
          <span>Fullscreen</span>
        </button>
      </div>

      {modal && createPortal(modal, document.body)}
    </>
  );
}

function FormattedParagraph({ text }: { text: string }) {
  return (
    <p className="text-base sm:text-lg leading-relaxed text-[var(--ink-900)] mb-4 last:mb-0">
      <RichText text={text} />
    </p>
  );
}

export default function InfoStepBlock({ content, index = 0, topicTitle = '' }: { content: TopicContent; index?: number; topicTitle?: string }) {
  return (
    <div className="space-y-4">
      {content.type === 'text' && (
        <div className="space-y-4">
          {content.content
            .split(/\n\n+/)
            .filter((p) => p.trim().length > 0)
            .map((paragraph, pIdx) => (
              <FormattedParagraph key={pIdx} text={paragraph} />
            ))}
        </div>
      )}

      {content.type === 'latex' && <MathBlock tex={content.content} />}

      {content.type === 'code' && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2 font-mono text-xs text-[var(--ink-500)] sm:px-4">
            <span className="font-semibold uppercase tracking-wider">{content.language || 'code'}</span>
            <CopyButton text={content.content} />
          </div>
          <div className="overflow-x-auto bg-white">
            <SyntaxHighlighter
              language={content.language || 'text'}
              style={oneLight}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '13px',
                lineHeight: '1.6',
                background: 'transparent',
                minWidth: 'min-content',
              }}
              codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } }}
              wrapLongLines={false}
            >
              {content.content}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {content.type === 'group' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {(content.blocks || []).map((subBlock, bIdx) => (
              <InfoStepBlock key={bIdx} content={subBlock} index={bIdx} topicTitle={topicTitle} />
            ))}
          </div>
        </div>
      )}

      {content.type === 'youtube' &&
        (getYouTubeId(content.content) ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(content.content)}`}
              title={`Video content ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : (
          <a href={content.content} target="_blank" rel="noopener noreferrer" className="text-sm break-all font-semibold text-[#0084FE] hover:underline">
            {content.content}
          </a>
        ))}

      {content.type === 'image' && (
        <div className="flex justify-center py-2">
          <FullscreenImage
            src={content.content}
            alt={content.title || `${topicTitle ? `${topicTitle} - ` : ''}illustration ${index + 1}`}
          />
        </div>
      )}

      {content.type === 'video' && (
        <video src={content.content} controls className="w-full rounded-2xl border border-[var(--line)] shadow-sm" />
      )}
      {content.type === 'audio' && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4">
          <audio src={content.content} controls className="w-full" />
        </div>
      )}
    </div>
  );
}
