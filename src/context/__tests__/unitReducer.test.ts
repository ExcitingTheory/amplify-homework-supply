import { describe, it, expect } from 'vitest';
import { unitReducer, initialState, actionTypes } from '../reducers/unitReducer';

describe('unitReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = unitReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  it('SET_UNIT', () => {
    const unit = { id: 'u1', name: 'Test Unit' };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_UNIT,
      payload: unit,
    });
    expect(state.unit).toEqual(unit);
  });

  it('SET_DICTIONARY', () => {
    const dict = { w1: { id: 'w1', phrase: 'hello' } };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_DICTIONARY,
      payload: dict,
    });
    expect(state.dictionary).toEqual(dict);
  });

  it('SET_QUESTION_BANK', () => {
    const qb = { q1: { id: 'q1' } };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_QUESTION_BANK,
      payload: qb,
    });
    expect(state.questionBank).toEqual(qb);
  });

  it('SET_FILES', () => {
    const files = { f1: { id: 'f1' } };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_FILES,
      payload: files,
    });
    expect(state.files).toEqual(files);
  });

  it('SET_RUBRIC', () => {
    const rubric = ['block-1', 'block-2'];
    const state = unitReducer(initialState, {
      type: actionTypes.SET_RUBRIC,
      payload: rubric,
    });
    expect(state.rubric).toEqual(rubric);
  });

  it('SET_FINISHED_QUESTIONS', () => {
    const state = unitReducer(initialState, {
      type: actionTypes.SET_FINISHED_QUESTIONS,
      payload: 5,
    });
    expect(state.finishedQuestions).toBe(5);
  });

  it('SET_SHOW_UNIT_COMPLETE', () => {
    const state = unitReducer(initialState, {
      type: actionTypes.SET_SHOW_UNIT_COMPLETE,
      payload: true,
    });
    expect(state.showUnitComplete).toBe(true);
  });

  it('SET_PERSONAL_BEST_RESULT', () => {
    const result = { isNewBest: true, previousBest: 80, newBest: 95 };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_PERSONAL_BEST_RESULT,
      payload: result,
    });
    expect(state.personalBestResult).toEqual(result);
  });

  it('SET_GRADE', () => {
    const grade = { id: 'g1', accuracy: 85 };
    const state = unitReducer(initialState, {
      type: actionTypes.SET_GRADE,
      payload: grade,
    });
    expect(state.grade).toEqual(grade);
  });

  it('SET_RECENT_GRADES', () => {
    const grades = [{ id: 'g1', accuracy: 90 }, { id: 'g2', accuracy: 80 }];
    const state = unitReducer(initialState, {
      type: actionTypes.SET_RECENT_GRADES,
      payload: grades,
    });
    expect(state.recentGrades).toEqual(grades);
  });

  it('SET_IS_SAVING', () => {
    const state = unitReducer(initialState, {
      type: actionTypes.SET_IS_SAVING,
      payload: true,
    });
    expect(state.isSaving).toBe(true);
  });

  it('SET_PERMISSION_ERROR', () => {
    const state = unitReducer(initialState, {
      type: actionTypes.SET_PERMISSION_ERROR,
      payload: 'No access',
    });
    expect(state.permissionError).toBe('No access');
  });

  it('SET_PRACTICE_SESSIONS', () => {
    const sessions = [{ id: 'ps1', unitID: 'u1' }];
    const state = unitReducer(initialState, {
      type: actionTypes.SET_PRACTICE_SESSIONS,
      payload: sessions,
    });
    expect(state.practiceSessions).toEqual(sessions);
  });

  it('UNIT_LOADED — sets multiple fields at once', () => {
    const prev = { ...initialState, permissionError: 'old error' };
    const state = unitReducer(prev, {
      type: actionTypes.UNIT_LOADED,
      payload: {
        unit: { id: 'u1', name: 'Unit' },
        dictionary: { w1: { id: 'w1' } },
        files: { f1: { id: 'f1' } },
        playlistUrls: { f1: 'url' },
        questionBank: { q1: { id: 'q1' } },
        rubric: ['block-1'],
      },
    });
    expect(state.unit.id).toBe('u1');
    expect(state.dictionary.w1).toBeDefined();
    expect(state.files.f1).toBeDefined();
    expect(state.questionBank.q1).toBeDefined();
    expect(state.rubric).toEqual(['block-1']);
    expect(state.permissionError).toBeNull();
  });

  it('UNIT_CLEARED — resets unit and clears permission error', () => {
    const prev = {
      ...initialState,
      unit: { id: 'u1', name: 'Test' },
      permissionError: 'some error',
    };
    const state = unitReducer(prev, { type: actionTypes.UNIT_CLEARED });
    expect(state.unit).toEqual({});
    expect(state.permissionError).toBeNull();
  });

  it('GRADE_SUBSCRIPTION_UPDATE — sets grade-related fields', () => {
    const state = unitReducer(initialState, {
      type: actionTypes.GRADE_SUBSCRIPTION_UPDATE,
      payload: {
        grade: { id: 'g1', accuracy: 90 },
        username: 'user123',
        showUnitComplete: true,
        finishedQuestions: 3,
        recentGrades: [{ id: 'g2' }],
      },
    });
    expect(state.grade).toEqual({ id: 'g1', accuracy: 90 });
    expect(state.username).toBe('user123');
    expect(state.showUnitComplete).toBe(true);
    expect(state.finishedQuestions).toBe(3);
    expect(state.recentGrades).toHaveLength(1);
  });

  it('preserves unrelated state on partial updates', () => {
    const prev = {
      ...initialState,
      unit: { id: 'u1' },
      dictionary: { w1: { id: 'w1' } },
      isSaving: true,
    };
    const state = unitReducer(prev, {
      type: actionTypes.SET_GRADE,
      payload: { id: 'g1' },
    });
    expect(state.unit).toEqual({ id: 'u1' });
    expect(state.dictionary).toEqual({ w1: { id: 'w1' } });
    expect(state.isSaving).toBe(true);
  });
});
