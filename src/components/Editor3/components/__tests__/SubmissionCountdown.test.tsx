/**
 * SubmissionCountdown Component Tests
 *
 * Tests the inline countdown UI displayed before auto-submitting an answer.
 * Pure presentational component — all timer logic is in the parent.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SubmissionCountdown from '../SubmissionCountdown';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, fallback?: string) => {
    const translations: Record<string, string> = {
      'autoSubmit.submittingInSeconds': `Submitting in {{countdown}} seconds`,
      'autoSubmit.submitNow': 'Submit Now',
      'autoSubmit.cancelSubmission': 'Cancel',
    };
    return translations[key] || fallback || key;
  },
}));

describe('SubmissionCountdown', () => {
  const defaultProps = {
    countdown: 5,
    onCancel: vi.fn(),
    onSubmitNow: vi.fn(),
  };

  it('renders countdown value', () => {
    render(<SubmissionCountdown {...defaultProps} />);
    expect(screen.getByText(/Submitting in/)).toBeDefined();
  });

  it('renders Submit Now button', () => {
    render(<SubmissionCountdown {...defaultProps} />);
    expect(screen.getByText('Submit Now')).toBeDefined();
  });

  it('renders Cancel button', () => {
    render(<SubmissionCountdown {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('calls onSubmitNow when Submit Now clicked', () => {
    const onSubmitNow = vi.fn();
    render(<SubmissionCountdown {...defaultProps} onSubmitNow={onSubmitNow} />);
    fireEvent.click(screen.getByText('Submit Now'));
    expect(onSubmitNow).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    render(<SubmissionCountdown {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('returns null when countdown is null', () => {
    const { container } = render(
      <SubmissionCountdown countdown={null} onCancel={vi.fn()} onSubmitNow={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when countdown is undefined', () => {
    const { container } = render(
      <SubmissionCountdown countdown={undefined} onCancel={vi.fn()} onSubmitNow={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders with countdown of 0', () => {
    render(<SubmissionCountdown countdown={0} onCancel={vi.fn()} onSubmitNow={vi.fn()} />);
    expect(screen.getByText(/Submitting in/)).toBeDefined();
  });
});
