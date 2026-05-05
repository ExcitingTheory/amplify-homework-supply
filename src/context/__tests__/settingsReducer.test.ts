import { describe, it, expect } from 'vitest';
import { settingsReducer, initialState, actionTypes } from '../reducers/settingsReducer';

describe('settingsReducer', () => {
  it('returns the initial state for unknown action', () => {
    const state = settingsReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  it('handles SET_SETTINGS', () => {
    const settings = { id: '1', language: 'en', editorTheme: 'dark' };
    const state = settingsReducer(initialState, {
      type: actionTypes.SET_SETTINGS,
      payload: settings,
    });
    expect(state.settings).toEqual(settings);
    expect(state.isLoading).toBe(true); // unchanged
  });

  it('handles SET_LOADING', () => {
    const state = settingsReducer(initialState, {
      type: actionTypes.SET_LOADING,
      payload: false,
    });
    expect(state.isLoading).toBe(false);
  });

  it('handles SETTINGS_LOADED — sets settings and clears loading', () => {
    const settings = { id: '1', language: 'fr' };
    const state = settingsReducer(initialState, {
      type: actionTypes.SETTINGS_LOADED,
      payload: settings,
    });
    expect(state.settings).toEqual(settings);
    expect(state.isLoading).toBe(false);
  });

  it('handles SETTINGS_LOAD_FAILED — clears loading only', () => {
    const state = settingsReducer(initialState, {
      type: actionTypes.SETTINGS_LOAD_FAILED,
    });
    expect(state.settings).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('preserves other state fields on partial updates', () => {
    const prev = { settings: { id: '1' }, isLoading: false };
    const state = settingsReducer(prev, {
      type: actionTypes.SET_SETTINGS,
      payload: { id: '1', language: 'ja' },
    });
    expect(state.isLoading).toBe(false);
  });
});
