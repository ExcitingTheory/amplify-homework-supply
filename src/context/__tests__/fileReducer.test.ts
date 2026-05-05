import { describe, it, expect } from 'vitest';
import { fileReducer, initialState, actionTypes } from '../reducers/fileReducer';

describe('fileReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = fileReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  it('SET_AUDIO_FILES', () => {
    const files = { key1: { key: 'audio/file.mp3' } };
    const state = fileReducer(initialState, {
      type: actionTypes.SET_AUDIO_FILES,
      payload: files,
    });
    expect(state.audioFiles).toEqual(files);
  });

  it('SET_MY_FILES', () => {
    const files = [{ id: 'f1', name: 'doc.pdf' }];
    const state = fileReducer(initialState, {
      type: actionTypes.SET_MY_FILES,
      payload: files,
    });
    expect(state.myFiles).toEqual(files);
  });

  it('SET_PLAYLIST_FILES', () => {
    const playlist = { f1: { id: 'f1', mimeType: 'audio/mp3' } };
    const state = fileReducer(initialState, {
      type: actionTypes.SET_PLAYLIST_FILES,
      payload: playlist,
    });
    expect(state.myPlaylistFiles).toEqual(playlist);
  });

  it('SET_PDFS', () => {
    const pdfs = { f1: { id: 'f1', mimeType: 'application/pdf' } };
    const state = fileReducer(initialState, {
      type: actionTypes.SET_PDFS,
      payload: pdfs,
    });
    expect(state.myPdfs).toEqual(pdfs);
  });

  it('SET_DOCUMENTS', () => {
    const docs = { d1: { id: 'd1', status: 'completed' } };
    const state = fileReducer(initialState, {
      type: actionTypes.SET_DOCUMENTS,
      payload: docs,
    });
    expect(state.documents).toEqual(docs);
  });

  it('SET_VECTOR_STORE_READY', () => {
    const state = fileReducer(initialState, {
      type: actionTypes.SET_VECTOR_STORE_READY,
      payload: true,
    });
    expect(state.vectorStoreReady).toBe(true);
  });

  it('FILES_SUBSCRIPTION_UPDATE — updates files, playlists, pdfs and increments version', () => {
    const prev = { ...initialState, filesVersion: 3 };
    const state = fileReducer(prev, {
      type: actionTypes.FILES_SUBSCRIPTION_UPDATE,
      payload: {
        myFiles: [{ id: 'f1' }],
        myPlaylistFiles: { f2: { id: 'f2' } },
        myPdfs: { f3: { id: 'f3' } },
      },
    });
    expect(state.myFiles).toEqual([{ id: 'f1' }]);
    expect(state.myPlaylistFiles).toEqual({ f2: { id: 'f2' } });
    expect(state.myPdfs).toEqual({ f3: { id: 'f3' } });
    expect(state.filesVersion).toBe(4);
  });

  it('INCREMENT_FILES_VERSION — bumps version by 1', () => {
    const prev = { ...initialState, filesVersion: 5 };
    const state = fileReducer(prev, { type: actionTypes.INCREMENT_FILES_VERSION });
    expect(state.filesVersion).toBe(6);
  });

  it('preserves unrelated state on partial update', () => {
    const prev = { ...initialState, vectorStoreReady: true, audioFiles: { a: 1 } };
    const state = fileReducer(prev, {
      type: actionTypes.SET_MY_FILES,
      payload: [{ id: 'f1' }],
    });
    expect(state.vectorStoreReady).toBe(true);
    expect(state.audioFiles).toEqual({ a: 1 });
  });
});
