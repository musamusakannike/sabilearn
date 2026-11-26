import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepPlayer } from '../LessonWorkspacePage';
import { QuizStep } from '../QuizStep';
import { Topic } from '@/lib/types';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const SAMPLE_TOPIC: Topic = {
  _id: 'topic-1',
  course: 'course-1',
  title: 'Intro to Logic Gates',
  description: 'Learn AND and OR gates',
  xp: 50,
  order: 1,
  isPublished: true,
  createdAt: '',
  updatedAt: '',
  contents: [
    { _id: 's1', type: 'text', title: 'Step One', content: 'An AND gate outputs $1$ when both inputs are $1$.' },
    {
      _id: 's2',
      type: 'quiz',
      title: 'Quick Check',
      content: '',
      quiz: {
        question: 'What is $1 \\land 0$?',
        options: [
          { text: '$1$', isCorrect: false },
          { text: '$0$', isCorrect: true },
        ],
        explanation: 'Both inputs must be $1$ for AND to output $1$.',
      },
    },
  ],
};

describe('Lesson StepPlayer & Quiz keyboard flows', () => {
  it('advances steps via keyboard ArrowRight, gates on quiz, and completes lesson', async () => {
    const onComplete = vi.fn().mockResolvedValue({ earnedXp: 50, isCourseComplete: false });
    const onSavePosition = vi.fn();

    render(
      <StepPlayer
        topic={SAMPLE_TOPIC}
        onComplete={onComplete}
        onSavePosition={onSavePosition}
        onBackToCourse={() => {}}
        onToggleTutor={() => {}}
        tutorOpen={false}
      />
    );

    expect(screen.getByText('Step One')).toBeInTheDocument();

    // Advance to step 2 (quiz) via ArrowRight
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onSavePosition).toHaveBeenCalledWith(1);
    expect(screen.getByText('Check Answer')).toBeInTheDocument();

    // Complete Lesson button is disabled until quiz is answered
    const completeBtn = screen.getByRole('button', { name: /Complete Lesson/i });
    expect(completeBtn).toBeDisabled();

    // Pick option 2 via keyboard "2" and submit via "Enter"
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(completeBtn).not.toBeDisabled();

    fireEvent.click(completeBtn);
    expect(await screen.findByText('Lesson Complete!')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard A-D selection and Enter check in QuizStep', () => {
    const onAnswered = vi.fn();
    render(
      <QuizStep
        quiz={SAMPLE_TOPIC.contents[1].quiz!}
        onAnswered={onAnswered}
      />
    );

    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onAnswered).toHaveBeenCalledWith(true);
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });
});
