/**
 * Tests for DebugPanel component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DebugPanel } from '../DebugPanel';

// Keep interpolated counts observable: render "key(value,...)" when values are passed.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join(',')})` : key,
}));

// Mock Material-UI components for testing
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
  };
});

describe('DebugPanel', () => {
  beforeEach(() => {
    // Set up window globals for component tree and logger
    if (typeof window !== 'undefined') {
      (window as any).__COMPONENT_TREE__ = {
        getTree: vi.fn(() => []),
        subscribe: vi.fn(() => vi.fn()),
      };
      (window as any).__DEBUG_LOGGER__ = {
        getLogs: vi.fn(() => []),
        subscribe: vi.fn(() => vi.fn()),
        clear: vi.fn(),
      };
    }
  });

  it('renders when open', () => {
    render(<DebugPanel open={true} onClose={() => {}} />);
    expect(screen.getByText('debugPanel.title')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<DebugPanel open={false} onClose={() => {}} />);
    // Drawer should not show content when closed
    expect(container.querySelector('.MuiDrawer-paper')).not.toBeVisible();
  });

  it('shows all tabs', () => {
    render(<DebugPanel open={true} onClose={() => {}} />);
    
    expect(screen.getByText('debugPanel.tabs.components')).toBeInTheDocument();
    expect(screen.getByText(/debugPanel\.tabs\.logs/)).toBeInTheDocument();
    expect(screen.getByText('debugPanel.tabs.state')).toBeInTheDocument();
    expect(screen.getByText('debugPanel.tabs.performance')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DebugPanel open={true} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('actions.close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('switches tabs when clicked', async () => {
    render(<DebugPanel open={true} onClose={() => {}} />);
    
    const logsTab = screen.getByText(/debugPanel\.tabs\.logs/);
    fireEvent.click(logsTab);
    
    await waitFor(() => {
      // LogViewer should be rendered
      expect(screen.getByPlaceholderText('logViewer.searchPlaceholder')).toBeInTheDocument();
    });
  });

  it('displays log count in logs tab', () => {
    const mockLogger = {
      getLogs: vi.fn(() => [
        { timestamp: Date.now(), level: 'info' as const, message: 'Test log' },
      ]),
      subscribe: vi.fn(() => vi.fn()),
      clear: vi.fn(),
    };
    
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_LOGGER__ = mockLogger;
    }
    
    render(<DebugPanel open={true} onClose={() => {}} />);
    
    expect(screen.getByText('debugPanel.tabs.logs(1)')).toBeInTheDocument();
  });

  it('respects position prop', () => {
    const { container } = render(
      <DebugPanel open={true} onClose={() => {}} position="left" />
    );
    
    const drawer = container.querySelector('.MuiDrawer-root');
    expect(drawer).toBeInTheDocument();
  });

  it('respects width prop', () => {
    const { container } = render(
      <DebugPanel open={true} onClose={() => {}} width={500} />
    );
    
    const paper = container.querySelector('.MuiDrawer-paper');
    expect(paper).toHaveStyle({ width: '500px' });
  });

  it('respects height prop for bottom position', () => {
    const { container } = render(
      <DebugPanel open={true} onClose={() => {}} position="bottom" height={300} />
    );
    
    const paper = container.querySelector('.MuiDrawer-paper');
    expect(paper).toHaveStyle({ height: '300px' });
  });

  it('subscribes to logger when open', () => {
    const mockSubscribe = vi.fn(() => vi.fn());
    const mockLogger = {
      getLogs: vi.fn(() => []),
      subscribe: mockSubscribe,
      clear: vi.fn(),
    };
    
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_LOGGER__ = mockLogger;
    }
    
    render(<DebugPanel open={true} onClose={() => {}} />);
    
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('clears logs when clear button clicked', async () => {
    const mockClear = vi.fn();
    const mockLogger = {
      getLogs: vi.fn(() => [
        { timestamp: Date.now(), level: 'info' as const, message: 'Test' },
      ]),
      subscribe: vi.fn(() => vi.fn()),
      clear: mockClear,
    };
    
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_LOGGER__ = mockLogger;
    }
    
    render(<DebugPanel open={true} onClose={() => {}} />);
    
    // Switch to logs tab
    const logsTab = screen.getByText(/debugPanel\.tabs\.logs/);
    fireEvent.click(logsTab);
    
    await waitFor(() => {
      const clearButton = screen.getAllByLabelText(/Clear/i)[0];
      fireEvent.click(clearButton);
    });
    
    expect(mockClear).toHaveBeenCalled();
  });
});
