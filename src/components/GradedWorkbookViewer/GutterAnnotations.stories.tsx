import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GutterAnnotations } from './GutterAnnotations';
import type { WrongAnswerAnnotation, GradeAttempt } from './GradedWorkbookViewer';
import { expect } from 'storybook/test'

const meta: Meta<typeof GutterAnnotations> = {
  title: '� Instructor Tools/Grading/Gutter Annotations',
  component: GutterAnnotations,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof GutterAnnotations>;

const mockWrongAnswers: Record<string, WrongAnswerAnnotation[]> = {
  'block-quiz-1': [
    { blockId: 'block-quiz-1', type: 'quiz', wrongAnswer: '3', attemptNumber: 1, timestamp: '2026-06-15T10:00:00Z' },
    { blockId: 'block-quiz-1', type: 'quiz', wrongAnswer: '5', attemptNumber: 2, timestamp: '2026-06-16T14:30:00Z' },
  ],
  'block-meaning-1': [
    { blockId: 'block-meaning-1', type: 'meaning-association', wrongAnswer: 'Permanent', attemptNumber: 1, timestamp: '2026-06-15T10:00:00Z' },
  ],
  'block-answer-1': [
    { blockId: 'block-answer-1', type: 'answer', wrongAnswer: 'Plants eat sunlight', attemptNumber: 1, timestamp: '2026-06-15T10:00:00Z' },
    { blockId: 'block-answer-1', type: 'answer', wrongAnswer: 'Light makes food for plants', attemptNumber: 2, timestamp: '2026-06-16T14:30:00Z' },
    { blockId: 'block-answer-1', type: 'answer', wrongAnswer: 'Photosynthesis converts CO2 and water into glucose using light energy', attemptNumber: 3, timestamp: '2026-06-17T09:15:00Z' },
  ],
};

const mockGrades: GradeAttempt[] = [
  { id: 'grade-1', attempt: 1, accuracy: 45, percentComplete: 100, complete: true, data: {}, createdAt: '2026-06-15T10:00:00Z', updatedAt: '2026-06-15T10:00:00Z' },
  { id: 'grade-2', attempt: 2, accuracy: 67, percentComplete: 100, complete: true, data: {}, createdAt: '2026-06-16T14:30:00Z', updatedAt: '2026-06-16T14:30:00Z' },
  { id: 'grade-3', attempt: 3, accuracy: 89, percentComplete: 100, complete: true, data: {}, createdAt: '2026-06-17T09:15:00Z', updatedAt: '2026-06-17T09:15:00Z' },
];

export const MultipleBlocks: Story = {
  args: {
    wrongAnswersByBlock: mockWrongAnswers,
    currentAttempt: 3,
    grades: mockGrades,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const SingleBlock: Story = {
  args: {
    wrongAnswersByBlock: {
      'block-quiz-1': mockWrongAnswers['block-quiz-1'],
    },
    currentAttempt: 2,
    grades: mockGrades.slice(0, 2),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const NoWrongAnswers: Story = {
  args: {
    wrongAnswersByBlock: {},
    currentAttempt: 1,
    grades: [{ id: 'grade-perfect', attempt: 1, accuracy: 100, percentComplete: 100, complete: true, data: {}, createdAt: '2026-06-18T08:00:00Z', updatedAt: '2026-06-18T08:00:00Z' }],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const FirstAttempt: Story = {
  args: {
    wrongAnswersByBlock: {
      'block-quiz-1': [mockWrongAnswers['block-quiz-1'][0]],
    },
    currentAttempt: 1,
    grades: [mockGrades[0]],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
