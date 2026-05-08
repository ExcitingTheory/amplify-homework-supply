/**
 * QuizComponent (QuestionBlockRo) Tests
 *
 * Tests grading logic, answer detection, locking behavior, and
 * score calculation for the read-only quiz block.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import QuestionBlockRo from '../QuizComponent';
import UnitContext from '../../../../context/unitContext';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (key === 'quizComponent.gradeDisplay') return `Score: ${params?.score ?? 0}%`;
    return key;
  },
}));

function renderQuiz({
  data = [],
  nodeKey = 'quiz-1',
  gradeData = {},
  saveGrade = vi.fn(),
}: {
  data?: Array<{ answer: string; correct: boolean }>;
  nodeKey?: string;
  gradeData?: Record<string, any>;
  saveGrade?: ReturnType<typeof vi.fn>;
} = {}) {
  const grade = {
    id: 'grade-1',
    data: JSON.stringify(gradeData),
  };

  return render(
    <UnitContext.Provider value={{ grade, saveGrade } as any}>
      <QuestionBlockRo nodeKey={nodeKey} data={data} />
    </UnitContext.Provider>
  );
}

const sampleQuiz = [
  { answer: 'Paris', correct: true },
  { answer: 'London', correct: false },
  { answer: 'Berlin', correct: false },
  { answer: 'Tokyo', correct: false },
];

const multiCorrectQuiz = [
  { answer: 'Red', correct: true },
  { answer: 'Green', correct: true },
  { answer: 'Purple', correct: false },
  { answer: 'Orange', correct: false },
];

describe('QuestionBlockRo (QuizComponent)', () => {
  let saveGrade: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveGrade = vi.fn();
  });

  describe('Rendering', () => {
    it('renders all answer options', () => {
      renderQuiz({ data: sampleQuiz, saveGrade });
      expect(screen.getByText('Paris')).toBeDefined();
      expect(screen.getByText('London')).toBeDefined();
      expect(screen.getByText('Berlin')).toBeDefined();
      expect(screen.getByText('Tokyo')).toBeDefined();
    });

    it('renders score display showing 0% initially', () => {
      renderQuiz({ data: sampleQuiz, saveGrade });
      expect(screen.getByText('Score: 0%')).toBeDefined();
    });

    it('renders empty state when data is empty', () => {
      renderQuiz({ data: [], saveGrade });
      expect(screen.getByText('Score: 0%')).toBeDefined();
    });

    it('renders quiz block data-tour attribute', () => {
      const { container } = renderQuiz({ data: sampleQuiz, saveGrade });
      expect(container.querySelector('[data-tour="quiz-block"]')).not.toBeNull();
    });
  });

  describe('Grading logic', () => {
    it('calls saveGrade when an answer is selected', async () => {
      renderQuiz({ data: sampleQuiz, saveGrade });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Paris (correct)

      await waitFor(() => {
        expect(saveGrade).toHaveBeenCalled();
      });
    });

    it('saves 100% accuracy when correct answer chosen (single correct)', async () => {
      renderQuiz({ data: sampleQuiz, saveGrade });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Paris (correct)

      await waitFor(() => {
        expect(saveGrade).toHaveBeenCalled();
        const savedData = saveGrade.mock.calls[0][0];
        expect(savedData['quiz-1'].accuracy).toBe(100);
        expect(savedData['quiz-1'].complete).toBe(true);
      });
    });

    it('saves 0% accuracy when wrong answer chosen (single correct)', async () => {
      renderQuiz({ data: sampleQuiz, saveGrade });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // London (incorrect)

      await waitFor(() => {
        expect(saveGrade).toHaveBeenCalled();
        const savedData = saveGrade.mock.calls[0][0];
        expect(savedData['quiz-1'].accuracy).toBe(0);
        expect(savedData['quiz-1'].complete).toBe(true);
      });
    });
  });

  describe('Locked state', () => {
    it('disables checkboxes when quiz is locked via pre-existing grade', () => {
      renderQuiz({
        data: sampleQuiz,
        saveGrade,
        gradeData: {
          'quiz-1': {
            accuracy: 100,
            complete: true,
            attemptedAnswers: { 0: 'Paris' },
            correctAnswers: { 0: 'Paris' },
            percentComplete: 100,
        };
      };
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });

    it('shows score from existing grade data', () => {
      renderQuiz({
        data: sampleQuiz,
        saveGrade,
        gradeData: {
          'quiz-1': {
            accuracy: 75,
            complete: true,
            attemptedAnswers: { 0: 'Paris' },
            correctAnswers: { 0: 'Paris' },
            percentComplete: 100,
        };
      };
      });

      expect(screen.getByText('Score: 75%')).toBeDefined();
    });
  });

  describe('Multi-correct quizzes', () => {
    it('tracks partial progress for multi-correct quizzes', async () => {
      renderQuiz({ data: multiCorrectQuiz, saveGrade });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Red (correct)

      await waitFor(() => {
        expect(saveGrade).toHaveBeenCalled();
        const savedData = saveGrade.mock.calls[0][0];
        // 1 correct out of 2 total correct = 50%
        expect(savedData['quiz-1'].accuracy).toBe(50);
        // Not complete yet — need 2 attempts for 2 correct answers
        expect(savedData['quiz-1'].complete).toBe(false);
      });
    });
  });

  describe('Grade data parsing', () => {
    it('handles grade.data as JSON string', () => {
      renderQuiz({
        data: sampleQuiz,
        saveGrade,
        gradeData: {
          'quiz-1': { accuracy: 50, complete: false, attemptedAnswers: {}, correctAnswers: {}, percentComplete: 0 },
      };
      });
      expect(screen.getByText('Score: 50%')).toBeDefined();
    });

    it('handles empty grade data', () => {
      renderQuiz({ data: sampleQuiz, saveGrade, gradeData: {} });
      expect(screen.getByText('Score: 0%')).toBeDefined();
    });

    it('handles null grade', () => {
      render(
        <UnitContext.Provider value={{ grade: null, saveGrade } as any}>
          <QuestionBlockRo nodeKey="quiz-1" data={sampleQuiz} />
        </UnitContext.Provider>
      );
      expect(screen.getByText('Score: 0%')).toBeDefined();
    });
  });
});
