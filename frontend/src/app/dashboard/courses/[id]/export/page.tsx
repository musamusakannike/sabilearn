"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { formatMarkdown } from "@/lib/markdown";
import { ArrowLeft, Printer, FileText, Check, Info, Loader2, Sparkles } from "lucide-react";

interface Lesson {
  title: string;
  description: string;
  isCompleted?: boolean;
  generatedLessonId?: string;
  content?: string;
  summary?: string;
}

interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  title: string;
  level: string;
  style: string;
  outline: { modules: Module[] };
  createdAt: string;
}

export default function CourseExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Customization States
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [oneLessonPerPage, setOneLessonPerPage] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/ai/course?id=${id}&enrich=true`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
      } else {
        setError("Failed to load course details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">Preparing course export workspace...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-[var(--bg-primary)]">
        <div className="p-4 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold mb-2">Error Loading Course</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{error || "Could not retrieve course contents."}</p>
        <button
          onClick={() => router.push(`/dashboard/courses/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm font-semibold hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </button>
      </div>
    );
  }

  const allLessons = course.outline.modules.flatMap((m) => m.lessons);
  const generatedLessons = allLessons.filter((l) => l.isCompleted && l.content);
  const percentGenerated = allLessons.length > 0 ? Math.round((generatedLessons.length / allLessons.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* CSS Styles for Print/Preview Layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Variables for theme integration inside print area */
        .print-theme-light {
          --bg-primary: #FCFBF9;
          --text-primary: #1C1917;
          --text-secondary: #57534E;
          --text-muted: #8C8A84;
          --accent: #B47F1D;
          --accent-hover: #966612;
          --accent-muted: rgba(180, 127, 29, 0.15);
          --accent-subtle: rgba(180, 127, 29, 0.08);
          --border: #E6E2DB;
          --border-subtle: #F0EDE8;
          --bg-secondary: #F5F3EE;
          --bg-tertiary: #EAE7E2;
          --bg-elevated: #FFFFFF;
          --bg-hover: #EFECE6;
        }

        .print-theme-dark {
          --bg-primary: #0C0C0E;
          --text-primary: #F5F2ED;
          --text-secondary: #A8A29E;
          --text-muted: #6B6560;
          --accent: #E8A838;
          --accent-hover: #F0BD5C;
          --accent-muted: rgba(232, 168, 56, 0.2);
          --accent-subtle: rgba(232, 168, 56, 0.1);
          --border: #2A2A30;
          --border-subtle: #1F1F24;
          --bg-secondary: #141416;
          --bg-tertiary: #1C1C20;
          --bg-elevated: #232328;
          --bg-hover: #2A2A30;
        }

        /* Screen Preview Styling */
        .print-area {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-body), system-ui, sans-serif;
          transition: all 0.2s ease-in-out;
        }

        /* Pre-wrap and styling for printed code blocks */
        .print-area pre {
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }

        /* Media Print overrides */
        @media print {
          .no-print {
            display: none !important;
          }

          html, body {
            background: var(--bg-primary) !important;
            color: var(--text-primary) !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Remove headers/footers default margins */
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }

          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: var(--bg-primary) !important;
            color: var(--text-primary) !important;
          }

          /* Force browser to print colors and backgrounds exactly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page break controls */
          .p-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }

          .p-break-after {
            break-after: page !important;
            page-break-after: always !important;
          }

          .p-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Prevent split headers and first paragraphs */
          h1, h2, h3, h4, h5, h6 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      ` }} />

      {/* Left Sidebar - Options & Configuration */}
      <div className="w-full lg:w-96 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col no-print shrink-0">
        {/* Header bar */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/courses/${id}`)}
            className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center"
            title="Back to course"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Export PDF</h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">Configure course document</p>
          </div>
        </div>

        {/* Scrollable Configuration Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status warning if some lessons are not generated */}
          {percentGenerated < 100 && (
            <div className="p-4 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 text-xs text-[var(--text-secondary)] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[var(--warning)]">
                <Info className="w-4 h-4" />
                <span>Outline Only Notice ({percentGenerated}% Complete)</span>
              </div>
              <p className="leading-relaxed">
                Only <strong>{generatedLessons.length}</strong> of <strong>{allLessons.length}</strong> lessons are generated. Ungenerated lessons will render as outline placeholders in the PDF document.
              </p>
            </div>
          )}

          {/* Theme Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Document Theme</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setTheme("light")}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  theme === "light"
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span className="text-base">☀️</span>
                <span>Classic Light</span>
                <span className="text-[10px] opacity-75 font-normal">Print-Friendly</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                  theme === "dark"
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span className="text-base">🌙</span>
                <span>Warm Dark</span>
                <span className="text-[10px] opacity-75 font-normal">Digital Reader</span>
              </button>
            </div>
          </div>

          {/* Document Content Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Include Sections</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--border)] transition-all">
                <input
                  type="checkbox"
                  checked={includeCover}
                  onChange={(e) => setIncludeCover(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Course Cover Page</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Title, metadata, learning style</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--border)] transition-all">
                <input
                  type="checkbox"
                  checked={includeTOC}
                  onChange={(e) => setIncludeTOC(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Table of Contents</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Outline list of modules & lessons</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--border)] transition-all">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Lesson Summaries</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Include high-level overview box</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:border-[var(--border)] transition-all">
                <input
                  type="checkbox"
                  checked={oneLessonPerPage}
                  onChange={(e) => setOneLessonPerPage(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Page Break per Lesson</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Force new page for each lesson</span>
                </div>
              </label>
            </div>
          </div>

          {/* Guidelines / Tips */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] text-[var(--text-secondary)] space-y-2.5">
            <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
              How to Save as PDF
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>Click the primary <strong>Print / Save as PDF</strong> button below.</li>
              <li>In your browser's print dialog, select <strong>Save as PDF</strong> as the Destination.</li>
              <li>Set Layout to <strong>Portrait</strong>.</li>
              <li>Under More Settings:
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[var(--text-muted)]">
                  <li>Enable <strong>Background graphics</strong> (crucial to preserve theme colors and styles).</li>
                  <li>Set margins to <strong>Default</strong> or <strong>None</strong>.</li>
                  <li>Disable headers and footers for a cleaner layout.</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        {/* Action button container */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <button
            onClick={() => window.print()}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-md)]"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Right Content Area - Live Print Preview */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-4 md:p-8 no-scrollbar print-preview-scroll-container">
        {/* Page size container matching standard preview style */}
        <div className={`print-area print-theme-${theme} mx-auto max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] bg-[var(--bg-primary)] border border-[var(--border)] shadow-[var(--shadow-lg)] rounded-2xl`}>
          
          {/* Document Cover Page */}
          {includeCover && (
            <div className="flex flex-col justify-between min-h-[250mm] p-break-after">
              {/* Top Section */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center font-bold text-lg text-[var(--bg-primary)]">S</div>
                  <span className="text-sm font-bold tracking-tight font-[family-name:var(--font-display)]">Sabi Learn</span>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">{new Date(course.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {/* Main Content */}
              <div className="my-auto py-12 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-[var(--accent)] text-[10px] font-bold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3" />
                  Personalized Study Course
                </div>
                <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
                  {course.title}
                </h1>
                
                {/* Visual Accent bar */}
                <div className="w-20 h-1.5 rounded-full bg-[var(--accent)]" />
                
                {/* Metadata Details */}
                <div className="grid grid-cols-2 gap-4 max-w-md pt-8 border-t border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Level / Tier</span>
                    <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">{course.level.replace("-", " ")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Learning Style</span>
                    <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">{course.style}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Modules Count</span>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{course.outline.modules.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Lessons</span>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{allLessons.length}</p>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                <p>Generated by Sabi Learn AI Assistant</p>
                <p>© {new Date().getFullYear()} Sabi Learn. All rights reserved.</p>
              </div>
            </div>
          )}

          {/* Dotted Screen Spacer */}
          {includeCover && (
            <div className="no-print my-10 border-t-2 border-dashed border-[var(--border)] relative flex justify-center">
              <span className="absolute -top-3.5 px-3 bg-[var(--bg-primary)] text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">Page Break</span>
            </div>
          )}

          {/* Table of Contents Page */}
          {includeTOC && (
            <div className={`${includeCover ? "p-break-after" : "p-break-after"}`}>
              <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold mb-8 text-[var(--text-primary)] pb-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
                Table of Contents
              </h2>
              <div className="space-y-6">
                {course.outline.modules.map((mod, modIdx) => (
                  <div key={mod.title} className="p-break-inside-avoid">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-[var(--accent)]">Module {modIdx + 1}</span>
                      <span>{mod.title}</span>
                    </h3>
                    <ul className="space-y-2 pl-4">
                      {mod.lessons.map((lesson, lesIdx) => (
                        <li key={lesson.title} className="flex items-baseline justify-between text-xs text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2 min-w-0 pr-4">
                            <span className="font-mono text-[var(--text-muted)] shrink-0">{modIdx + 1}.{lesIdx + 1}</span>
                            <span className="truncate">{lesson.title}</span>
                            {!lesson.isCompleted && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded border border-[var(--text-muted)]/20 text-[var(--text-muted)] font-mono scale-90">Outline Only</span>
                            )}
                          </div>
                          {/* Dot Leaders */}
                          <div className="flex-1 border-b border-dotted border-[var(--border)] mx-2 shrink opacity-30" />
                          <span className="text-[var(--text-muted)] font-mono shrink-0">
                            {lesson.isCompleted ? "P. Generated" : "P. Outline"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dotted Screen Spacer */}
          {includeTOC && (
            <div className="no-print my-10 border-t-2 border-dashed border-[var(--border)] relative flex justify-center">
              <span className="absolute -top-3.5 px-3 bg-[var(--bg-primary)] text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">Page Break</span>
            </div>
          )}

          {/* Core Content: Modules & Lessons */}
          <div className="space-y-10">
            {course.outline.modules.map((mod, modIdx) => (
              <div key={mod.title} className="space-y-8">
                {/* Module Division Banner */}
                <div className="p-break-before border-b border-t border-[var(--border)] py-4 bg-[var(--bg-secondary)] px-4 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Module {modIdx + 1}</span>
                  <h2 className="text-base font-bold text-[var(--text-primary)] text-right font-[family-name:var(--font-display)]">
                    {mod.title}
                  </h2>
                </div>
                
                {/* Lessons inside Module */}
                <div className="space-y-8">
                  {mod.lessons.map((lesson, lesIdx) => {
                    const isLessonGenerated = lesson.isCompleted && lesson.content;
                    
                    return (
                      <div
                        key={lesson.title}
                        className={`${oneLessonPerPage && (modIdx > 0 || lesIdx > 0) ? "p-break-before" : ""} space-y-5`}
                      >
                        {/* Dotted Screen Spacer between lessons if oneLessonPerPage is false */}
                        {!oneLessonPerPage && (modIdx > 0 || lesIdx > 0) && (
                          <div className="no-print my-8 border-t border-dashed border-[var(--border)]/60 relative flex justify-center">
                            <span className="absolute -top-2.5 px-2 bg-[var(--bg-primary)] text-[9px] font-medium text-[var(--text-muted)] tracking-wider uppercase">Lesson Break</span>
                          </div>
                        )}

                        {/* Lesson Header */}
                        <div className="p-break-inside-avoid space-y-1.5 pb-3 border-b border-[var(--border-subtle)]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">Lesson {modIdx + 1}.{lesIdx + 1}</span>
                            {isLessonGenerated ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-semibold uppercase tracking-wider scale-90">Completed</span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--text-muted)]/10 text-[var(--text-muted)] border border-[var(--text-muted)]/20 font-semibold uppercase tracking-wider scale-90">Outline Only</span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-display)] tracking-tight">
                            {lesson.title}
                          </h3>
                        </div>

                        {/* Lesson Content */}
                        {isLessonGenerated ? (
                          <div className="space-y-6">
                            {/* Summary callout */}
                            {includeSummary && lesson.summary && (
                              <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] p-break-inside-avoid">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1">Lesson Summary</h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{lesson.summary}</p>
                              </div>
                            )}

                            {/* Rendered HTML content */}
                            <div
                              className="prose prose-sm max-w-none 
                                [&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h3]:font-[family-name:var(--font-display)] 
                                [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold
                                [&_h1]:text-[var(--text-primary)] [&_h2]:text-[var(--text-primary)] [&_h3]:text-[var(--text-primary)] 
                                [&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4 [&_h1]:mb-3 [&_h2]:mb-2.5 [&_h3]:mb-2
                                [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed [&_p]:mb-4
                                [&_li]:text-[var(--text-secondary)] [&_li]:leading-relaxed
                                [&_strong]:text-[var(--text-primary)]
                                [&_code]:bg-[var(--bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[var(--accent)] [&_code]:text-xs [&_code]:font-mono
                                [&_pre]:bg-[var(--bg-secondary)] [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
                                [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                                [&_th]:bg-[var(--bg-tertiary)] [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[var(--text-primary)]
                                [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_td]:text-xs [&_td]:text-[var(--text-secondary)]
                                [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-4 [&_blockquote]:bg-[var(--bg-secondary)] [&_blockquote]:rounded-r-lg [&_blockquote]:text-[var(--text-secondary)]
                                [&_div.katex-display-wrapper]:my-6 [&_div.katex-display-wrapper]:p-break-inside-avoid
                              "
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(lesson.content || "") }}
                            />
                          </div>
                        ) : (
                          /* Outline Placeholder Content */
                          <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-center p-break-inside-avoid space-y-3">
                            <Info className="w-5 h-5 text-[var(--text-muted)] mx-auto" />
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-[var(--text-primary)]">Lesson Content Not Yet Generated</h4>
                              <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
                                This lesson was not generated before export. If you want its full details to appear in the PDF, please return to the learning view and generate it.
                              </p>
                            </div>
                            <div className="text-left max-w-md mx-auto pt-3 border-t border-[var(--border)]/40">
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Lesson Objective:</span>
                              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">{lesson.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
