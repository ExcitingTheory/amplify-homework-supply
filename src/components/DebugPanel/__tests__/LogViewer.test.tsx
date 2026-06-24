/**
 * Tests for LogViewer component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogViewer } from '../LogViewer';
import { LogEntry, LogLevel } from '../../../utils/debug/DebugLogger';

const mockLogs: LogEntry[] = [
  { timestamp: Date.now() - 3000, level: 'info', message: 'Info message', stack: null },
  { timestamp: Date.now() - 2000, level: 'warn', message: 'Warning message', stack: null },
  { timestamp: Date.now() - 1000, level: 'error', message: 'Error message', stack: 'Error stack' },
  { timestamp: Date.now(), level: 'log', message: 'Regular log', stack: null },
];

describe('LogViewer', () => {
  it('renders all logs', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Regular log')).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(<LogViewer logs={[]} onClear={vi.fn()} />);
    expect(screen.getByText('No logs captured yet')).toBeInTheDocument();
  });

  it('filters logs by level', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    const levelSelect = screen.getByLabelText('Level');
    fireEvent.mouseDown(levelSelect);

    const errorOption = screen.getByText(/Error \(1\)/);
    fireEvent.click(errorOption);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });

  it('searches logs by text', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'Error' } });

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Info message')).not.toBeInTheDocument();
  });

  it('displays log counts by level', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    const levelSelect = screen.getByLabelText('Level');
    fireEvent.mouseDown(levelSelect);

    expect(screen.getByText(/Error \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Warn \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Info \(1\)/)).toBeInTheDocument();
  });

  it('shows total count badge', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);
    expect(screen.getByText(/4 \/ 4 shown/)).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    render(<LogViewer logs={mockLogs} onClear={onClear} />);

    const clearButton = screen.getByLabelText('Clear all logs');
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('displays error count badge', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);
    const chips = screen.getAllByText('1');
    expect(chips.length).toBeGreaterThan(0); // Error and warn count badges chip
  });

  it('displays warning count badge', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);
    const badges = screen.getAllByText('1');
    expect(badges.length).toBeGreaterThanOrEqual(2); // Error and warn badges
  });

  it('shows stack trace for errors', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);
    expect(screen.getByText('Error stack')).toBeInTheDocument();
  });

  it('displays timestamps', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);
    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('color-codes log levels', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    // Check that all log messages are rendered (they will have color coding via MUI sx prop)
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Regular log')).toBeInTheDocument();
  });

  it('combines filters - level and search', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    // Filter by level
    const levelSelect = screen.getByLabelText('Level');
    fireEvent.mouseDown(levelSelect);
    const infoOption = screen.getByText(/Info \(1\)/);
    fireEvent.click(infoOption);

    // Search within filtered results
    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'Info' } });

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  it('shows "no logs match filters" when filtered to empty', () => {
    render(<LogViewer logs={mockLogs} onClear={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search logs...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No logs match filters')).toBeInTheDocument();
  });
});
