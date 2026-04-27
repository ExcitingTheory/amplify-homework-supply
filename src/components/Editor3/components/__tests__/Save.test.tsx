/**
 * Save Component Tests
 *
 * Tests the manual save button behavior, permission error detection,
 * snackbar feedback, and beforeunload handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Save } from '../Save';
import UnitContext from '../../../../context/unitContext';

describe('Save', () => {
  let saveEditorContent: ReturnType<typeof vi.fn>;
  let editorStateRef: { current: any };

  beforeEach(() => {
    saveEditorContent = vi.fn().mockResolvedValue(true);
    editorStateRef = { current: { root: { children: [] } } };
  });

  function renderSave(overrides = {}) {
    const contextValue = {
      saveEditorContent,
      editorStateRef,
      unit: { id: 'unit-1', data: { root: { children: [] } } },
      ...overrides,
    };
    return render(
      <UnitContext.Provider value={contextValue as any}>
        <Save />
      </UnitContext.Provider>
    );
  }

  describe('Rendering', () => {
    it('renders a save button', () => {
      renderSave();
      const button = screen.getByTitle(/Save now/);
      expect(button).toBeDefined();
    });

    it('button is enabled by default', () => {
      renderSave();
      const button = screen.getByTitle(/Save now/);
      expect(button).not.toBeDisabled();
    });
  });

  describe('Manual save', () => {
    it('calls saveEditorContent on click', async () => {
      renderSave();
      fireEvent.click(screen.getByTitle(/Save now/));
      await waitFor(() => {
        expect(saveEditorContent).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after save', async () => {
      renderSave();
      fireEvent.click(screen.getByTitle(/Save now/));
      await waitFor(() => {
        expect(screen.getByText('Saved successfully')).toBeDefined();
      });
    });

    it('shows permission error when saveEditorContent returns false', async () => {
      saveEditorContent.mockResolvedValue(false);
      renderSave();
      fireEvent.click(screen.getByTitle(/Save now/));
      await waitFor(() => {
        expect(screen.getByText(/do not have permission/)).toBeDefined();
      });
    });

    it('shows failure message when saveEditorContent throws', async () => {
      saveEditorContent.mockRejectedValue(new Error('Network error'));
      renderSave();
      fireEvent.click(screen.getByTitle(/Save now/));
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeDefined();
      });
    });

    it('disables button while saving', async () => {
      let resolvePromise: (v: any) => void;
      saveEditorContent.mockReturnValue(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      renderSave();
      fireEvent.click(screen.getByTitle(/Save now/));

      // Button should be disabled while saving
      expect(screen.getByTitle(/Save now/)).toBeDisabled();

      // Resolve the save
      resolvePromise!(true);
    });
  });

  describe('beforeunload handler', () => {
    it('registers beforeunload event listener', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      renderSave();
      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addSpy.mockRestore();
    });

    it('removes beforeunload event listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderSave();
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
