import { ImageResponse } from 'next/og';
import { getCourseQuestions } from '@/data/public-quizzes/registry';
import { PublicQuizCourse } from '@/types/public-quiz';

export const PUBLIC_QUIZ_OG_SIZE = {
  width: 1200,
  height: 630,
};

export function renderPublicQuizOgImage(course?: PublicQuizCourse, topicSubtitle?: string) {
  const totalQuestions = course ? getCourseQuestions(course).length : 150;
  const calcCount = course
    ? getCourseQuestions(course).filter((q) => q.difficulty === 'calculation').length
    : 0;
  const topicCount = course ? course.topics.length : 0;

  const courseCode = course?.code ?? 'SabiLearn';
  const courseTitle = course?.title ?? 'Public Practice Quiz';
  const institution = course?.institution ?? 'University Exam Practice';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF9F7',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Main Framed Card (SabiLearn 2px/4px Heavy Ink Signature) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            border: '4px solid #0E0E1A',
            borderRadius: '32px',
            padding: '48px 56px',
            boxShadow: '10px 10px 0px #0E0E1A',
          }}
        >
          {/* Top Row: Brand + Quiz Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '34px',
                  fontWeight: 800,
                  color: '#0E0E1A',
                  letterSpacing: '-0.03em',
                }}
              >
                <span>Sabi</span>
                <span style={{ color: '#F2A900' }}>Learn</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  backgroundColor: '#F8BE43',
                  border: '2px solid #0E0E1A',
                  color: '#0E0E1A',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                PRACTICE QUIZ
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                borderRadius: '999px',
                backgroundColor: '#E7E3FB',
                color: '#5B4FE8',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {institution}
            </div>
          </div>

          {/* Center: Course Name & Quiz Label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '26px',
                fontWeight: 800,
                color: '#5B4FE8',
                letterSpacing: '0.02em',
              }}
            >
              <span>{courseCode}</span>
              <span style={{ color: '#A9A9BC' }}>•</span>
              <span>COURSE QUIZ</span>
            </div>

            <div
              style={{
                fontSize: courseTitle.length > 34 ? '50px' : '60px',
                fontWeight: 800,
                color: '#0E0E1A',
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
              }}
            >
              {courseTitle}
            </div>

            {topicSubtitle ? (
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 600,
                  color: '#35354A',
                }}
              >
                Topic: {topicSubtitle}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: '#6B6B80',
                }}
              >
                Interactive MCQs with instant feedback &amp; worked LaTeX explanations
              </div>
            )}
          </div>

          {/* Bottom Row: Stats Pills + CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '2px solid #DEDAD0',
              paddingTop: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#ECE8DF',
                  color: '#0E0E1A',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {totalQuestions} Questions
              </div>
              {topicCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#ECE8DF',
                    color: '#0E0E1A',
                    fontSize: '20px',
                    fontWeight: 700,
                  }}
                >
                  {topicCount} Topics
                </div>
              )}
              {calcCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#E7E3FB',
                    color: '#5B4FE8',
                    fontSize: '20px',
                    fontWeight: 700,
                  }}
                >
                  {calcCount} Calculations
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                padding: '12px 26px',
                borderRadius: '14px',
                backgroundColor: '#0E0E1A',
                color: '#F8BE43',
                fontSize: '20px',
                fontWeight: 800,
              }}
            >
              Take Free Quiz →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...PUBLIC_QUIZ_OG_SIZE,
    }
  );
}
