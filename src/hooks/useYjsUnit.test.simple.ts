/**
 * Simple test to verify test infrastructure works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as Y from 'yjs';

// Import actual hook
import { useYjsUnit } from './useYjsUnit';

// Mock dependencies
const mockGetAmplifyClient = vi.fn();
const mockUseYjsProvider = vi.fn();

vi.mock('../utils/amplifyClient', () => ({
  getAmplifyClient: () => mockGetAmplifyClient(),
}));

vi.mock('../../yjs/hooks', () => ({
  useYjsProvider: (config: any) => mockUseYjsProvider(config),
}));

describe('useYjsUnit - Simple Tests', () => {
  let mockDoc: Y.Doc;
  let mockProvider: any;
  let mockClient: any;

  const mockUnit = {
    id: 'unit-1',
    name: 'Test Unit',
    data: JSON.stringify({ content: 'Test' }),
    _version: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDoc = new Y.Doc();

    mockProvider = {
      getDoc: vi.fn(() => mockDoc),
      getText: vi.fn((name: string) => mockDoc.getText(name)),
      getMap: vi.fn((name: string) => mockDoc.getMap(name)),
      onUpdate: vi.fn(() => vi.fn()),
    };

    mockUseYjsProvider.mockReturnValue({
      provider: mockProvider,
      isSynced: true,
      isConnected: true,
    });

    mockClient = {
      models: {
        Unit: {
          get: vi.fn().mockResolvedValue({ data: mockUnit }),
          update: vi.fn().mockResolvedValue({ data: { ...mockUnit, _version: 6 } }),
        },
      },
    };

    mockGetAmplifyClient.mockReturnValue(mockClient);
  });

  it('should load unit data', async () => {
    const { result } = renderHook(() => useYjsUnit({ unitId: 'unit-1' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(mockClient.models.Unit.get).toHaveBeenCalledWith({ id: 'unit-1' });
    expect(result.current.unit).toBeTruthy();
  });

  it('should return provider', async () => {
    const { result } = renderHook(() => useYjsUnit({ unitId: 'unit-1' }));

    await waitFor(() => {
      expect(result.current.unit).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.provider).toBe(mockProvider);
  });

  it('should handle errors', async () => {
    mockClient.models.Unit.get.mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useYjsUnit({ unitId: 'unit-1' }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.error?.message).toBe('Test error');
  });
});
