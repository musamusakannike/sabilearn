'use client';

import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { courseRequestApi } from '@/lib/api';

interface CourseRequest {
  _id: string;
  courseName: string;
  category: 'academic' | 'non-academic';
  details?: string;
  createdAt: string;
}

function CourseRequestsContent() {
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    courseRequestApi.list()
      .then((res) => setRequests(res.data.data || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load course requests.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader title="Course requests" description="Courses learners have asked us to bring to SabiLearn" />
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <Card className="p-6 text-sm text-[var(--danger)]">{error}</Card>
      ) : requests.length === 0 ? (
        <EmptyState icon={<Lightbulb className="size-12" />} title="No course requests yet" description="New public suggestions will show up here." />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request._id} className="p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--ink-900)]">{request.courseName}</h2>
                  {request.details && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-500)]">{request.details}</p>}
                  <p className="mt-3 text-xs text-[var(--ink-300)]">Submitted {new Date(request.createdAt).toLocaleString()}</p>
                </div>
                <Badge tone={request.category === 'academic' ? 'violet' : 'gold'}>
                  {request.category === 'academic' ? 'Academic' : 'Non-academic'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseRequestsAdminPage() {
  return <AdminGuard><CourseRequestsContent /></AdminGuard>;
}
