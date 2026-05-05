import { describe, it, expect } from 'vitest';
import { chatReducer, initialState, actionTypes } from '../reducers/chatReducer';

describe('chatReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = chatReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  it('SET_ASSISTANT_CHAT', () => {
    const chat = { id: 'c1', model: 'gpt-4' };
    const state = chatReducer(initialState, {
      type: actionTypes.SET_ASSISTANT_CHAT,
      payload: chat,
    });
    expect(state.assistantChat).toEqual(chat);
  });

  it('SET_CHAT_HISTORIES', () => {
    const histories = [{ id: 'c1' }, { id: 'c2' }];
    const state = chatReducer(initialState, {
      type: actionTypes.SET_CHAT_HISTORIES,
      payload: histories,
    });
    expect(state.chatHistories).toEqual(histories);
  });

  it('SET_LOADING_CHAT', () => {
    const state = chatReducer(initialState, {
      type: actionTypes.SET_LOADING_CHAT,
      payload: true,
    });
    expect(state.isLoadingChat).toBe(true);
  });

  it('SET_CHAT_CREATION_ERROR', () => {
    const state = chatReducer(initialState, {
      type: actionTypes.SET_CHAT_CREATION_ERROR,
      payload: 'Network error',
    });
    expect(state.chatCreationError).toBe('Network error');
  });

  it('SET_SUBSCRIPTION_READY', () => {
    const state = chatReducer(initialState, {
      type: actionTypes.SET_SUBSCRIPTION_READY,
      payload: true,
    });
    expect(state.subscriptionReady).toBe(true);
  });

  it('SET_CHAT_OPEN', () => {
    const state = chatReducer(initialState, {
      type: actionTypes.SET_CHAT_OPEN,
      payload: true,
    });
    expect(state.isChatOpen).toBe(true);
  });

  it('SET_PAGE_CONTEXT', () => {
    const ctx = { unit: { id: 'u1' }, files: [{ id: 'f1' }] };
    const state = chatReducer(initialState, {
      type: actionTypes.SET_PAGE_CONTEXT,
      payload: ctx,
    });
    expect(state.pageContext).toEqual(ctx);
  });

  it('SET_MESSAGES', () => {
    const msgs = [{ id: 'm1', role: 'user', parts: [] }];
    const state = chatReducer(initialState, {
      type: actionTypes.SET_MESSAGES,
      payload: msgs,
    });
    expect(state.messages).toEqual(msgs);
  });

  it('CHAT_CREATION_STARTED — sets loading, clears error', () => {
    const prev = { ...initialState, chatCreationError: 'old error' };
    const state = chatReducer(prev, { type: actionTypes.CHAT_CREATION_STARTED });
    expect(state.isLoadingChat).toBe(true);
    expect(state.chatCreationError).toBeNull();
  });

  it('CHAT_CREATION_SUCCEEDED — clears loading', () => {
    const prev = { ...initialState, isLoadingChat: true };
    const state = chatReducer(prev, { type: actionTypes.CHAT_CREATION_SUCCEEDED });
    expect(state.isLoadingChat).toBe(false);
  });

  it('CHAT_CREATION_FAILED — clears loading, sets error', () => {
    const prev = { ...initialState, isLoadingChat: true };
    const state = chatReducer(prev, {
      type: actionTypes.CHAT_CREATION_FAILED,
      payload: 'Auth error',
    });
    expect(state.isLoadingChat).toBe(false);
    expect(state.chatCreationError).toBe('Auth error');
  });

  it('SUBSCRIPTION_SYNCED — sets ready and histories', () => {
    const histories = [{ id: 'c1' }];
    const state = chatReducer(initialState, {
      type: actionTypes.SUBSCRIPTION_SYNCED,
      payload: histories,
    });
    expect(state.subscriptionReady).toBe(true);
    expect(state.chatHistories).toEqual(histories);
  });
});
