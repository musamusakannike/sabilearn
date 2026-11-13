'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function stripDelimiters(input: string): string {
  let s = input.trim();
  s = s.replace(/^\$\$([\s\S]*)\$\$$/, '$1').trim();
  s = s.replace(/^\$([\s\S]*)\$$/, '$1').trim();
  s = s.replace(/^\\\[([\s\S]*)\\\]$/, '$1').trim();
  s = s.replace(/^\\\(([\s\S]*)\\\)$/, '$1').trim();
  return s;
}

function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(stripDelimiters(tex), {
    throwOnError: false,
    displayMode,
    output: 'html',
  });
}

/** Block formula card for a lesson `latex` content block. */
export function MathBlock({ tex }: { tex: string }) {
  const html = useMemo(() => renderTex(tex, true), [tex]);
  return (
    <div
      className="my-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-5 text-[var(--ink-900)] [&_.katex-display]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'math'; value: string; display: boolean };

function parseSegments(text: string): Segment[] {
  const re = /`[^`]+?`|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const pushText = (val: string) => {
    if (!val) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.kind === 'text') {
      prev.value += val;
    } else {
      segments.push({ kind: 'text', value: val });
    }
  };
  while ((match = re.exec(text))) {
    if (match.index > last) {
      pushText(text.slice(last, match.index));
    }
    if (match[0].startsWith('`')) {
      pushText(match[0]);
    } else {
      const display = match[1] != null || match[2] != null;
      const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
      segments.push({ kind: 'math', value, display });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) pushText(text.slice(last));
  return segments;
}

function InlineCodeText({ value }: { value: string }) {
  const parts = value.split(/(`[^`]+?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        const codeMatch = part.match(/^`([^`]+?)`$/);
        if (codeMatch) {
          return (
            <code
              key={i}
              className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--ink-900)] border border-[var(--line)]"
            >
              {codeMatch[1]}
            </code>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function InlinePiece({ value }: { value: string }) {
  const parts = value.split(/(`[^`]+?`|\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const codeMatch = part.match(/^`([^`]+?)`$/);
        if (codeMatch) {
          return (
            <code
              key={i}
              className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--ink-900)] border border-[var(--line)]"
            >
              {codeMatch[1]}
            </code>
          );
        }
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#0084FE] hover:underline"
            >
              <InlineCodeText value={linkMatch[1]} />
            </a>
          );
        }
        const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
        if (boldMatch) {
          return (
            <strong key={i} className="font-bold text-[#0084FE]">
              <InlineCodeText value={boldMatch[1]} />
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * Prose that may mix plain text, `inline code`, **bold**, links, and inline or display LaTeX
 * (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`).
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const segments = useMemo(() => parseSegments(text), [text]);
  const hasMath = segments.some((s) => s.kind === 'math');
  if (!hasMath) {
    return (
      <span className={className}>
        <InlinePiece value={text} />
      </span>
    );
  }
  return (
    <span className={className}>
      {segments.map((segment, i) => {
        if (segment.kind === 'text') return <InlinePiece key={i} value={segment.value} />;
        const html = renderTex(segment.value, segment.display);
        if (segment.display) {
          return (
            <span
              key={i}
              className="my-2 block overflow-x-auto py-1 [&_.katex-display]:my-0"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
