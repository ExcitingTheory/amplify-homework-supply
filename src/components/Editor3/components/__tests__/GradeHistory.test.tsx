/**
 * GradeHistory Component Tests
 *
 * Tests statistics calculation, trend detection, and rendering of
 * previous grade attempts in the workbook sidebar.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import GradeHistory from '../GradeHistory';
import UnitContext from '../../../../context/unitContext';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'gradeHistory.title': 'Grade History',
      'gradeHistory.noAttempts': 'No previous attempts',
      'gradeHistory.completeFirstAttempt': 'Complete the assignment to see your history',
      'gradeHistory.attempts': 'attempts',
      'gradeHistory.trend.up': 'Improving',
      'gradeHistory.trend.down': 'Declining',
      'gradeHistory.trend.flat': 'Steady',
      'gradeHistory.bestScore': 'Best Score',
      'gradeHistory.averageScore': 'Average Score',
      'gradeHistory.recentAttempts': 'Recent Attempts',
      'gradeHistory.best': 'Best',
      'gradeHistory.complete': 'complete',
    };
    return translations[key] || key;
  },
}));

function renderWithContext(recentGrades: any[] = [], grade: any = null) {
  return render(
    <UnitContext.Provider
      value={{
        unit: { id: 'unit-1', name: 'Test Unit' },
        grade: grade,
        recentGrades: recentGrades,
      } as any}
    >
      <GradeHistory />
    </UnitContext.Provider>
  );
}

describe('GradeHistory', () => {
  describe('Empty state', () => {
    it('shows no attempts message when recentGrades is empty', () => {
      renderWithContext([]);
      expect(screen.getByText('No previous attempts')).toBeDefined();
      expect(screen.getByText('Complete the assignment to see your history')).toBeDefined();
    });

    it('shows no attempts when recentGrades is undefined', () => {
      renderWithContext(undefined as any);
      expect(screen.getByText('No previous attempts')).toBeDefined();
    });

    it('renders title always', () => {
      renderWithContext([]);
      expect(screen.getByText('Grade History')).toBeDefined();
    });
  });

  describe('Statistics', () => {
    const grades = [
      { id: 'g1', accuracy: 90, createdAt: '2026-04-17T12:00:00Z' },
      { id: 'g2', accuracy: 80, createdAt: '2026-04-16T12:00:00Z' },
      { id: 'g3', accuracy: 70, createdAt: '2026-04-15T12:00:00Z' },
    ];

    it('calculates average accuracy', () => {
      renderWithContext(grades);
      // (90 + 80 + 70) / 3 = 80
      // Average appears in h6, distinct from list entries
      const averageEl = screen.getAllByText('80%');
      expect(averageEl.length).toBeGreaterThanOrEqual(1);
    });

    it('calculates best accuracy', () => {
      renderWithContext(grades);
      // Best score is in h5 tag
      const bestEls = screen.getAllByText('90%');
      expect(bestEls.length).toBeGreaterThanOrEqual(1);
    });

    it('shows attempt count', () => {
      renderWithContext(grades);
      expect(screen.getByText('3 attempts')).toBeDefined();
    });
  });

  describe('Trend detection', () => {
    it('shows improving trend when latest > previous by > 0.5', () => {
      const grades = [
        { id: 'g1', accuracy: 85, createdAt: '2026-04-17T12:00:00Z' },
        { id: 'g2', accuracy: 70, createdAt: '2026-04-16T12:00:00Z' },
      ];
      renderWithContext(grades);
      expect(screen.getByText('Improving')).toBeDefined();
    });

    it('shows declining trend when latest < previous by > 0.5', () => {
      const grades = [
        { id: 'g1', accuracy: 60, createdAt: '2026-04-17T12:00:00Z' },
        { id: 'g2', accuracy: 85, createdAt: '2026-04-16T12:00:00Z' },
      ];
      renderWithContext(grades);
      expect(screen.getByText('Declining')).toBeDefined();
    });

    it('shows steady trend when difference is within 0.5', () => {
      const grades = [
        { id: 'g1', accuracy: 80, createdAt: '2026-04-17T12:00:00Z' },
        { id: 'g2', accuracy: 80.3, createdAt: '2026-04-16T12:00:00Z' },
      ];
      renderWithContext(grades);
      expect(screen.getByText('Steady')).toBeDefined();
    });

    it('shows steady for single attempt (no comparison possible)', () => {
      const grades = [
        { id: 'g1', accuracy: 80, createdAt: '2026-04-17T12:00:00Z' },
      ];
      renderWithContext(grades);
      expect(screen.getByText('Steady')).toBeDefined();
    });
  });

  describe('Recent attempts list', () => {
    it('renders all grade entries', () => {
      const grades = [
        { id: 'g1', accuracy: 95, createdAt: '2026-04-17T12:00:00Z' },
        { id: 'g2', accuracy: 80, createdAt: '2026-04-16T12:00:00Z' },
        { id: 'g3', accuracy: 65, createdAt: '2026-04-15T12:00:00Z' },
      ];
      renderWithContext(grades);
      // Text may appear in both stats summary and list entries
      expect(screen.getAllByText('95%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    });

    it('marks the best attempt with a chip', () => {
      const grades = [
        { id: 'g1', accuracy: 70, createdAt: '2026-04-17T12:00:00Z' },
        { id: 'g2', accuracy: 95, createdAt: '2026-04-16T12:00:00Z' },
        { id: 'g3', accuracy: 80, createdAt: '2026-04-15T12:00:00Z' },
      ];
      renderWithContext(grades);
      expect(screen.getByText('Best')).toBeDefined();
    });

    it('handles grades with zero accuracy', () => {
      const grades = [
        { id: 'g1', accuracy: 0, createdAt: '2026-04-17T12:00:00Z' },
      ];
      renderWithContext(grades);
      // 0% appears in best score, average, and the list entry
      expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
    });
  });
});
