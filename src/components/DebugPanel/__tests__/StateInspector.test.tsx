/**
 * Tests for StateInspector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StateInspector } from '../StateInspector';
import { StateSnapshot } from '../../../utils/debug/StateSnapshot';

// Keep interpolated counts observable: render "key(value,...)" when values are passed.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join(',')})` : key,
}));

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

    expect(screen.getByText('stateInspector.environment')).toBeInTheDocument();
    expect(screen.getByText(/stateInspector\.localStorage/)).toBeInTheDocument();
    expect(screen.getByText(/stateInspector\.sessionStorage/)).toBeInTheDocument();
    expect(screen.getByText(/stateInspector\.componentTree/)).toBeInTheDocument();
    expect(screen.getByText(/stateInspector\.logs/)).toBeInTheDocument();
    expect(screen.getByText('stateInspector.dataStoreModels')).toBeInTheDocument();
    expect(screen.getByText('stateInspector.performanceMetrics')).toBeInTheDocument();
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

    const refreshButton = screen.getByLabelText('stateInspector.refreshSnapshot');
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

    const exportButton = screen.getByLabelText('stateInspector.exportSnapshot');
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

    const environmentSection = screen.getByText('stateInspector.environment');
    fireEvent.click(environmentSection);

    // Content should be visible after expansion (already defaultExpanded)
    expect(screen.getByText('stateInspector.userAgentLabel')).toBeInTheDocument();
  });

  it('displays component count badge', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('stateInspector.componentTree(1)')).toBeInTheDocument();
  });

  it('displays localStorage count badge', () => {
    render(
      <StateInspector
        snapshot={mockSnapshot}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('stateInspector.localStorage(1)')).toBeInTheDocument();
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

    expect(screen.getByText('stateInspector.localStorage(0)')).toBeInTheDocument();
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

    expect(screen.getByText('stateInspector.componentTree(0)')).toBeInTheDocument();
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

    expect(screen.getByText('stateInspector.errors(1)')).toBeInTheDocument();
  });
});
