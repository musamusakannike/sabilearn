'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import katex from 'katex';

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
}

function renderMath(text: string): React.ReactNode {
  if (!text.includes('$')) return text;

  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const isBlock = token.startsWith('$$') && token.endsWith('$$');
    const mathContent = isBlock ? token.slice(2, -2) : token.slice(1, -1);

    try {
      const html = katex.renderToString(mathContent, {
        displayMode: isBlock,
        throwOnError: false,
      });
      parts.push(
        <span
          key={match.index}
          className={isBlock ? 'my-2 block overflow-x-auto text-center' : 'inline-block px-0.5 align-middle'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      parts.push(token);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function processChildrenWithMath(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    return renderMath(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? <React.Fragment key={i}>{renderMath(child)}</React.Fragment> : child
    );
  }
  return children;
}

function CodeBlock({ language, value }: { language?: string; value: string }) {
  const [copied, setCopied] = useState(false);

  if (language === 'latex' || language === 'math') {
    try {
      const html = katex.renderToString(value, {
        displayMode: true,
        throwOnError: false,
      });
      return (
        <div
          className="my-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)]/50 p-4 text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      // fallback to syntax highlighter below
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-card)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
        <span className="font-mono font-medium">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-[var(--line)] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '0.85rem 1rem',
          fontSize: '13px',
          lineHeight: '1.5',
          background: 'transparent',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MarkdownContent({ content, isStreaming }: MarkdownContentProps) {
  return (
    <div className="text-sm leading-relaxed text-[var(--ink-900)] space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-[var(--ink-900)] mt-3 mb-1.5 font-[var(--font-display)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-[var(--ink-900)] mt-3 mb-1 font-[var(--font-display)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-[var(--ink-900)] mt-2 mb-1 font-[var(--font-display)]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-[var(--text-body)]">
              {processChildrenWithMath(children)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2.5 ml-4 list-disc space-y-1 text-[var(--text-body)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 ml-4 list-decimal space-y-1 text-[var(--text-body)]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{processChildrenWithMath(children)}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[#FF8A00] bg-[var(--surface-sunken)]/60 px-3 py-1.5 rounded-r text-[var(--text-muted)] italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[var(--ink-900)]">{children}</strong>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const str = String(children).replace(/\n$/, '');
            const isMultiLine = str.includes('\n');

            if (match || isMultiLine) {
              return <CodeBlock language={match ? match[1] : undefined} value={str} />;
            }

            return (
              <code
                className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-xs text-[#0084FE] border border-[var(--line)]"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-[var(--line)]">
              <table className="min-w-full divide-y divide-[var(--line)] text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[var(--surface-sunken)] px-3 py-1.5 text-left font-semibold text-[var(--ink-900)]">
              {processChildrenWithMath(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-[var(--text-body)] border-t border-[var(--line)]">
              {processChildrenWithMath(children)}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Pulsing blinking caret during stream */}
      {isStreaming && (
        <span className="inline-block size-2 rounded-full bg-[#FF8A00] animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
