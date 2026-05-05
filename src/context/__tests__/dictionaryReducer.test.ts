import { describe, it, expect } from 'vitest';
import { dictionaryReducer, initialState, actionTypes } from '../reducers/dictionaryReducer';

describe('dictionaryReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = dictionaryReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  it('SET_WORDS', () => {
    const words = { hello: { id: 'w1', phrase: 'hello' } };
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_WORDS,
      payload: words,
    });
    expect(state.words).toEqual(words);
  });

  it('SET_FILTERED_WORDS', () => {
    const filtered = { hello: { id: 'w1', phrase: 'hello' } };
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_FILTERED_WORDS,
      payload: filtered,
    });
    expect(state.filteredWords).toEqual(filtered);
  });

  it('SET_WORD_MAP_ID', () => {
    const map = { w1: { id: 'w1', phrase: 'hello' } };
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_WORD_MAP_ID,
      payload: map,
    });
    expect(state.wordMapId).toEqual(map);
  });

  it('SET_FILTER', () => {
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_FILTER,
      payload: 'hel',
    });
    expect(state.filter).toBe('hel');
  });

  it('SET_SEARCHING', () => {
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_SEARCHING,
      payload: true,
    });
    expect(state.searching).toBe(true);
  });

  it('SET_QUESTION_BANK', () => {
    const bank = [{ id: 'q1', question: 'What?' }];
    const state = dictionaryReducer(initialState, {
      type: actionTypes.SET_QUESTION_BANK,
      payload: bank,
    });
    expect(state.questionBank).toEqual(bank);
  });

  it('WORDS_SUBSCRIPTION_UPDATE — sets words, filteredWords, wordMapId, clears searching', () => {
    const prev = { ...initialState, searching: true };
    const words = { hello: { id: 'w1', phrase: 'hello' } };
    const wordMapId = { w1: { id: 'w1', phrase: 'hello' } };
    const state = dictionaryReducer(prev, {
      type: actionTypes.WORDS_SUBSCRIPTION_UPDATE,
      payload: { words, wordMapId },
    });
    expect(state.words).toEqual(words);
    expect(state.filteredWords).toEqual(words);
    expect(state.wordMapId).toEqual(wordMapId);
    expect(state.searching).toBe(false);
  });

  it('FILTER_COMPLETE — sets filteredWords and clears searching', () => {
    const prev = { ...initialState, searching: true };
    const filtered = { hello: { id: 'w1' } };
    const state = dictionaryReducer(prev, {
      type: actionTypes.FILTER_COMPLETE,
      payload: filtered,
    });
    expect(state.filteredWords).toEqual(filtered);
    expect(state.searching).toBe(false);
  });

  it('preserves unrelated state fields', () => {
    const prev = {
      ...initialState,
      questionBank: [{ id: 'q1' }],
      jaroWinklerThreshold: 0.9,
    };
    const state = dictionaryReducer(prev, {
      type: actionTypes.SET_FILTER,
      payload: 'test',
    });
    expect(state.questionBank).toEqual([{ id: 'q1' }]);
    expect(state.jaroWinklerThreshold).toBe(0.9);
  });
});
