"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { formatMarkdown } from "@/lib/markdown";
import { ShareButton } from "@/components/ShareButton";

interface Lesson {
  title: string;
  description: string;
  isCompleted?: boolean;
  generatedLessonId?: string;
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

interface LessonContent {
  _id: string;
  content: string;
  summary: string;
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonContent | null>(null);
  const [error, setError] = useState("");
  const [showOutline, setShowOutline] = useState(true);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/ai/course?id=${id}`);
      const data = await res.json();
      if (data.success) setCourse(data.course);
      else router.push("/dashboard/courses");
    } catch {
      router.push("/dashboard/courses");
    } finally {
      setLoading(false);
    }
  };

  const generateLesson = async (moduleTitle: string, lessonTitle: string) => {
    setGenerating(lessonTitle);
    setError("");
    setShowOutline(false); // Switch to content view on mobile
    try {
      const res = await fetch("/api/ai/course", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id, moduleTitle, lessonTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate lesson");
      } else {
        setActiveLesson({ _id: data.lessonId, content: data.content, summary: data.summary });
        await fetchCourse();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setGenerating(null);
    }
  };

  const viewLesson = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/ai/course?lessonId=${lessonId}`);
      const data = await res.json();
      if (data.success) {
        setActiveLesson(data.lesson);
        setShowOutline(false); // Switch to content view on mobile
      }
    } catch {
      // silent
    }
  };

  const generateFinalExam = async () => {
    setGeneratingExam(true);
    setError("");
    try {
      const res = await fetch("/api/ai/course/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate final exam");
      } else {
        router.push(`/dashboard/quizzes/${data.quizId}`);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setGeneratingExam(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    setDeletingCourseId(course._id);
    setError("");
    try {
      const res = await fetch(`/api/ai/course?id=${course._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourseToDelete(null);
        router.push("/dashboard/courses");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete course");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setDeletingCourseId(null);
    }
  };

  // Continue with the first lesson that hasn't been generated/completed yet
  const startNextLesson = () => {
    if (!course) return;
    for (const mod of course.outline.modules) {
      const lesson = mod.lessons.find((l) => !l.isCompleted);
      if (lesson) {
        if (lesson.generatedLessonId) viewLesson(lesson.generatedLessonId);
        else generateLesson(mod.title, lesson.title);
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  const allLessons = course.outline.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isComplete = totalLessons > 0 && completedLessons === totalLessons;
  // ~8 minutes of study per lesson
  const remainingMinutes = (totalLessons - completedLessons) * 8;
  const remainingLabel =
    remainingMinutes >= 60
      ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60 ? `${remainingMinutes % 60}m` : ""}`.trim()
      : `${remainingMinutes}m`;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Mobile toggle buttons */}
      <div className="md:hidden flex border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <button
          onClick={() => setShowOutline(true)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            showOutline
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          Outline
        </button>
        <button
          onClick={() => setShowOutline(false)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            !showOutline
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          Content
        </button>
      </div>

      {/* Outline sidebar */}
      <div className={`w-full md:w-80 border-r border-[var(--border-subtle)] overflow-y-auto p-6 ${
        showOutline ? "block" : "hidden md:block"
      }`}>
        <button
          onClick={() => router.push("/dashboard/courses")}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4"
        >
          ← Back to courses
        </button>
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight">
            {course.title}
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <ShareButton id={course._id} type="course" />
            <button
              onClick={() => router.push(`/dashboard/courses/${course._id}/export`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
              title="Export to PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              onClick={() => setCourseToDelete(course)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
              title="Delete course"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress overview */}
        {totalLessons > 0 && (
          <div className="mb-5 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {completedLessons} of {totalLessons} lessons
              </span>
              <span className="text-xs font-semibold" style={{ color: isComplete ? "var(--success)" : "var(--accent)" }}>
                {percent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: isComplete ? "var(--success)" : "var(--accent)" }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              {isComplete ? "Course complete — nice work!" : `~${remainingLabel} of study left`}
            </p>

            {!isComplete && (
              <button
                onClick={startNextLesson}
                disabled={!!generating}
                className="mt-3 w-full px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completedLessons === 0 ? "Start first lesson" : "Continue learning"}
              </button>
            )}

            {isComplete && (
              <button
                onClick={generateFinalExam}
                disabled={generatingExam}
                className="mt-3 w-full px-4 py-2.5 rounded-xl bg-[var(--success)] text-[var(--bg-primary)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingExam ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                    Building exam...
                  </>
                ) : (
                  "Generate final exam"
                )}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 rounded-lg bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {course.outline.modules.map((mod) => (
            <div key={mod.title}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                {mod.title}
              </h3>
              <div className="space-y-2">
                {mod.lessons.map((lesson) => (
                  <button
                    key={lesson.title}
                    onClick={() => {
                      if (lesson.generatedLessonId) {
                        viewLesson(lesson.generatedLessonId);
                      } else {
                        generateLesson(mod.title, lesson.title);
                      }
                    }}
                    disabled={generating === lesson.title}
                    className="w-full text-left p-3 rounded-xl text-sm transition-all border border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--bg-hover)]"
                  >
                    <div className="flex items-center gap-2">
                      {lesson.isCompleted ? (
                        <div className="w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">
                        {generating === lesson.title ? "Generating..." : lesson.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lesson content */}
      <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${
        showOutline ? "hidden md:block" : "block"
      }`}>
        {activeLesson ? (
          <div className="max-w-3xl">
            {activeLesson.summary && (
              <div className="mb-6 p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
                <p className="text-sm text-[var(--text-secondary)]">{activeLesson.summary}</p>
              </div>
            )}
            <div
              className="prose prose-invert prose-sm max-w-none [&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h3]:font-[family-name:var(--font-display)] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed [&_li]:text-[var(--text-secondary)] [&_strong]:text-[var(--text-primary)] [&_code]:bg-[var(--bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[var(--accent)] [&_code]:text-xs [&_pre]:bg-[var(--bg-secondary)] [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:rounded-xl"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(activeLesson.content) }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-[var(--text-muted)]">
                Select a lesson from the outline to view or generate it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setCourseToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
          >
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold mb-2">
              Delete Course
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Are you sure you want to delete &quot;{courseToDelete.title}&quot;? This will permanently delete the course outline, all generated lessons, and any associated final exams. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all"
                disabled={deletingCourseId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                className="px-4 py-2 rounded-xl bg-[var(--danger)] text-white text-sm font-semibold hover:bg-[var(--danger)]/90 transition-all disabled:opacity-50 flex items-center gap-2"
                disabled={deletingCourseId !== null}
              >
                {deletingCourseId === courseToDelete._id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
