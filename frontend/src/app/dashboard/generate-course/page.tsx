'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateCourseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/ai/course-architect');
  }, [router]);

  return null;
}
