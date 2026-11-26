import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconCards, IconListCheck } from '@tabler/icons-react';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { courseApi } from '@/lib/api';
import { getCachedCourses } from '@/lib/offlineSync';
import { getBundledCourseList } from '@/lib/offlineCourses';
import { Course } from '@/lib/types';

export function StudyHubPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await getCachedCourses();
      if (!cancelled && cached.length > 0) {
        setCourses(cached);
        setLoading(false);
      }
      try {
        const res = await courseApi.list({ limit: 50 });
        if (!cancelled) {
          setCourses(res.data?.length ? res.data : getBundledCourseList());
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          if (cached.length === 0) setCourses(getBundledCourseList());
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-[1040px] mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold">Study Decks</h1>
        <p className="text-[13.5px] text-[var(--text-tertiary)] mt-0.5">
          Drill flashcards (Space to flip) and practice MCQs across any course.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState mascot title="No courses available to study" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <Card key={c._id} className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={c.difficulty}>{c.difficulty}</Badge>
                  {c.academicMeta?.courseCode && (
                    <Badge variant="default">{c.academicMeta.courseCode}</Badge>
                  )}
                </div>
                <h2 className="font-bold text-[15.5px]">{c.title}</h2>
                <p className="text-[12.5px] text-[var(--text-tertiary)] mt-1 line-clamp-2">
                  {c.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<IconCards size={15} />}
                  onClick={() => navigate(`/course/${c._id}/flashcards`)}
                >
                  Flashcards
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<IconListCheck size={15} />}
                  onClick={() => navigate(`/course/${c._id}/mcq`)}
                >
                  Practice MCQs
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
