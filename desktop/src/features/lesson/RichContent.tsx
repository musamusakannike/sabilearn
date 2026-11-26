import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  IconCheck,
  IconCopy,
  IconHeadphones,
  IconMaximize,
  IconMinus,
  IconPlus,
  IconWifiOff,
  IconX,
} from '@tabler/icons-react';
import {
  parseTextAndTables,
  parseYouTubeId,
  renderKatexHtml,
  splitMathSegments,
} from '@/lib/parsers';
import { TopicContent } from '@/lib/types';
import { clipboard } from '@/platform';
import { useUiStore } from '@/stores/ui.store';

export function RichMathText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const segments = splitMathSegments(text || '');
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'display-math') {
          return (
            <span
              key={i}
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: renderKatexHtml(seg.content, true) }}
            />
          );
        }
        if (seg.type === 'inline-math') {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderKatexHtml(seg.content, false) }}
            />
          );
        }
        // Inline backtick code inside plain text segments
        const parts = seg.content.split(/(`[^`]+`)/g);
        return (
          <React.Fragment key={i}>
            {parts.map((p, j) =>
              p.startsWith('`') && p.endsWith('`') ? (
                <code
                  key={j}
                  className="px-1.5 py-0.5 rounded-[5px] bg-[var(--surface-sunken)] text-[0.9em] font-mono text-[var(--text-primary)]"
                >
                  {p.slice(1, -1)}
                </code>
              ) : (
                <React.Fragment key={j}>{p}</React.Fragment>
              )
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-3 rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)] bg-[#0E0E1A] text-[#F4F2EC]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161625] border-b border-white/10 text-[12px]">
        <span className="font-mono uppercase tracking-wider text-[#A9A9BC]">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[#CBC8D8] hover:text-white cursor-pointer"
        >
          {copied ? <IconCheck size={14} className="text-[#34D399]" /> : <IconCopy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono m-0">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function LessonImage({ src, alt }: { src: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === '-') setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="my-4 relative group rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-sunken)]">
        <img
          src={src}
          alt={alt || 'Lesson diagram'}
          className="w-full max-h-[380px] object-contain mx-auto cursor-zoom-in"
          onClick={() => {
            setZoom(1);
            setOpen(true);
          }}
        />
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setOpen(true);
          }}
          className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <IconMaximize size={13} /> Zoom
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          className="fixed inset-0 z-50 bg-black/85 flex flex-col"
          onWheel={(e) => {
            e.preventDefault();
            setZoom((z) => Math.max(0.5, Math.min(4, +(z + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
          }}
        >
          <div className="flex items-center justify-between px-5 py-3 text-white">
            <span className="text-[13px] opacity-80">{Math.round(zoom * 100)}% (Scroll or +/- to zoom, Esc to close)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <IconMinus size={16} />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <IconPlus size={16} />
              </button>
              <button
                type="button"
                aria-label="Close lightbox"
                onClick={() => setOpen(false)}
                className="p-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <img
              src={src}
              alt={alt || 'Lesson diagram'}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-full transition-transform duration-100 select-none"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function SafeMarkdown({ content }: { content: string }) {
  const hasMath = /\$[^$]+\$|\\\(|\\\[/.test(content);
  if (hasMath) {
    return (
      <div className="space-y-3 leading-relaxed text-[15px] text-[var(--text-primary)]">
        {content.split(/\n{2,}/).map((para, idx) => (
          <p key={idx} className="m-0">
            <RichMathText text={para} />
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="lesson-prose space-y-3 text-[15px] leading-relaxed text-[var(--text-primary)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const str = String(children).replace(/\n$/, '');
            if (match || str.includes('\n')) {
              return <CodeBlock code={str} language={match?.[1]} />;
            }
            return (
              <code className="px-1.5 py-0.5 rounded-[5px] bg-[var(--surface-sunken)] font-mono text-[0.9em]">
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-link)] underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function LessonContentBlock({ block }: { block: TopicContent }) {
  const connectivity = useUiStore((s) => s.connectivity);

  if (block.type === 'group' && block.blocks) {
    return (
      <div className="space-y-4">
        {block.blocks.map((child, idx) => (
          <LessonContentBlock key={child._id || idx} block={child} />
        ))}
      </div>
    );
  }

  if (block.type === 'latex') {
    return (
      <div
        className="my-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-sunken)]/60 border border-[var(--border-subtle)] overflow-x-auto text-center"
        dangerouslySetInnerHTML={{ __html: renderKatexHtml(block.content, true) }}
      />
    );
  }

  if (block.type === 'code') {
    return <CodeBlock code={block.content} language={block.language} />;
  }

  if (block.type === 'image') {
    return <LessonImage src={block.content} alt={block.title} />;
  }

  if (block.type === 'youtube' || block.type === 'video') {
    const videoId = parseYouTubeId(block.content);
    if (connectivity === 'offline') {
      return (
        <div className="my-4 p-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-sunken)] flex items-center gap-3 text-[13.5px] text-[var(--text-secondary)]">
          <IconWifiOff size={20} className="text-[var(--warning)] shrink-0" />
          <span>Video playback requires an internet connection.</span>
        </div>
      );
    }
    if (!videoId) {
      return (
        <div className="my-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] text-[13px] text-[var(--text-tertiary)]">
          Video unavailable: {block.content}
        </div>
      );
    }
    return (
      <div className="my-4 aspect-video w-full rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)] bg-black">
        <iframe
          title={block.title || 'Lesson video'}
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (block.type === 'audio') {
    return (
      <div className="my-4 p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-sunken)]/60 flex items-center gap-3 text-[13.5px] text-[var(--text-secondary)]">
        <IconHeadphones size={18} className="text-[var(--brand-primary)] shrink-0" />
        <span>Audio lessons are coming soon to SabiLearn Desktop.</span>
      </div>
    );
  }

  // Default: text + interleaved GFM tables
  const segments = parseTextAndTables(block.content || '');
  return (
    <div className="space-y-4">
      {segments.map((seg, idx) => {
        if (seg.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto my-3 rounded-[var(--radius-md)] border border-[var(--border-default)]">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-[var(--surface-sunken)]">
                    {seg.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        style={{ textAlign: seg.alignments[hIdx] || 'left' }}
                        className="px-3.5 py-2.5 font-semibold border-b border-[var(--border-default)]"
                      >
                        <RichMathText text={h} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seg.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b last:border-b-0 border-[var(--border-subtle)] even:bg-[var(--surface-sunken)]/35"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{ textAlign: seg.alignments[cIdx] || 'left' }}
                          className="px-3.5 py-2.5"
                        >
                          <RichMathText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <SafeMarkdown key={idx} content={seg.content} />;
      })}
    </div>
  );
}
