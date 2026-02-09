/**
 * Tests for StateInspector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StateInspector } from '../StateInspector';
import { StateSnapshot } from '../../../utils/debug/StateSnapshot';

const mockSnapshot: StateSnapshot = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  environment: {
    userAgent: 'test',
    url: 'http://localhost',
    screenSize: { width: 1920, height: 1080 },
    viewport: { width: 1920, height: 1080 },
    platform: 'test',
    language: 'en-US',
    cookiesEnabled: true,
    online: true,
  },
  localStorage: { key1: 'value1' },
  sessionStorage: { key2: 'value2' },
  componentTree: JSON.stringify([
    {
      id: 'test-1',
      name: 'TestComponent',
      props: { test: true },
      state: { count: 0 },
      renderCount: 1,
    },
  ]),
  logs: JSON.stringify([]),
  dataStore: {},
  contexts: {},
  performance: {
    memory: { usedJSHeapSize: 1000000, totalJSHeapSize: 2000000, jsHeapSizeLimit: 4000000 },
    navigation: null,
    timing: { domContentLoaded: 50, loadComplete: 100 },
  },
  errors: [],
};

describe('StateInspector', () => {
  it('renders all sections', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText(/Local Storage/)).toBeInTheDocument();
    expect(screen.getByText(/Session Storage/)).toBeInTheDocument();
    expect(screen.getByText(/Component Tree/)).toBeInTheDocument();
    expect(screen.getByText(/Logs/)).toBeInTheDocument();
    expect(screen.getByText('DataStore Models')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={onRefresh}
        onExport={vi.fn()}
      />
    );

    const refreshButton = screen.getByLabelText('Refresh snapshot');
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it('calls onExport when export button clicked', () => {
    const onExport = vi.fn();
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={onExport}
      />
    );

    const exportButton = screen.getByLabelText('Export snapshot');
    fireEvent.click(exportButton);

    expect(onExport).toHaveBeenCalledWith(mockSnapshot);
  });

  it('expands accordion when clicked', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    const environmentSection = screen.getByText('Environment');
    fireEvent.click(environmentSection);

    // Content should be visible after expansion (already defaultExpanded)
    expect(screen.getByText(/User Agent:/)).toBeInTheDocument();
  });

  it('displays component count badge', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Component Tree \(1\)/)).toBeInTheDocument();
  });

  it('displays localStorage count badge', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Local Storage \(1\)/)).toBeInTheDocument();
  });

  it('handles empty localStorage gracefully', () => {
    const emptySnapshot: StateSnapshot = {
      ...mockSnapshot,
      localStorage: {},
    };

    render(
      <StateInspector
        snapshot={emptySnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Local Storage \(0\)/)).toBeInTheDocument();
  });

  it('handles empty componentTree gracefully', () => {
    const emptySnapshot: StateSnapshot = {
      ...mockSnapshot,
      componentTree: JSON.stringify([]),
    };

    render(
      <StateInspector
        snapshot={emptySnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Component Tree \(0\)/)).toBeInTheDocument();
  });

  it('displays error count when present', () => {
    const snapshotWithErrors: StateSnapshot = {
      ...mockSnapshot,
      errors: [
        { message: 'Test error', timestamp: Date.now(), stack: 'test stack' },
      ],
    };

    render(
      <StateInspector
        snapshot={snapshotWithErrors}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Errors \(1\)/)).toBeInTheDocument();
  });
});
