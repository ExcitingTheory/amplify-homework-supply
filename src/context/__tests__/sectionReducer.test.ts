import { describe, it, expect } from 'vitest';
import { sectionReducer, initialState, actionTypes } from '../reducers/sectionReducer';

describe('sectionReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = sectionReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toBe(initialState);
  });

  describe('sections', () => {
    it('SET_SECTIONS — sets sections and builds sectionMap', () => {
      const sections = [
        { id: 's1', name: 'Section A' },
        { id: 's2', name: 'Section B' },
      ];
      const state = sectionReducer(initialState, {
        type: actionTypes.SET_SECTIONS,
        payload: sections,
      });
      expect(state.sections).toEqual(sections);
      expect(state.sectionMap).toEqual({ s1: sections[0], s2: sections[1] });
    });

    it('ADD_SECTION — appends a new section', () => {
      const prev = {
        ...initialState,
        sections: [{ id: 's1', name: 'A' }],
        sectionMap: { s1: { id: 's1', name: 'A' } },
      };
      const newSection = { id: 's2', name: 'B' };
      const state = sectionReducer(prev, {
        type: actionTypes.ADD_SECTION,
        payload: newSection,
      });
      expect(state.sections).toHaveLength(2);
      expect(state.sectionMap.s2).toEqual(newSection);
    });

    it('ADD_SECTION — deduplicates by id', () => {
      const existing = { id: 's1', name: 'A' };
      const prev = { ...initialState, sections: [existing], sectionMap: { s1: existing } };
      const state = sectionReducer(prev, {
        type: actionTypes.ADD_SECTION,
        payload: existing,
      });
      expect(state).toBe(prev); // reference equality — no change
    });

    it('UPDATE_SECTION — replaces matching section', () => {
      const sections = [{ id: 's1', name: 'Old' }];
      const prev = { ...initialState, sections, sectionMap: { s1: sections[0] } };
      const updated = { id: 's1', name: 'New' };
      const state = sectionReducer(prev, {
        type: actionTypes.UPDATE_SECTION,
        payload: updated,
      });
      expect(state.sections[0].name).toBe('New');
      expect(state.sectionMap.s1.name).toBe('New');
    });

    it('DELETE_SECTION — removes section by id', () => {
      const sections = [{ id: 's1', name: 'A' }, { id: 's2', name: 'B' }];
      const prev = {
        ...initialState,
        sections,
        sectionMap: { s1: sections[0], s2: sections[1] },
      };
      const state = sectionReducer(prev, {
        type: actionTypes.DELETE_SECTION,
        payload: 's1',
      });
      expect(state.sections).toHaveLength(1);
      expect(state.sections[0].id).toBe('s2');
      expect(state.sectionMap.s1).toBeUndefined();
    });
  });

  describe('assignments', () => {
    it('SET_ASSIGNMENTS', () => {
      const assignments = [{ id: 'a1', unitID: 'u1' }];
      const state = sectionReducer(initialState, {
        type: actionTypes.SET_ASSIGNMENTS,
        payload: assignments,
      });
      expect(state.assignments).toEqual(assignments);
    });

    it('ADD_ASSIGNMENT — appends and deduplicates', () => {
      const prev = { ...initialState, assignments: [{ id: 'a1' }] };
      const state = sectionReducer(prev, {
        type: actionTypes.ADD_ASSIGNMENT,
        payload: { id: 'a2' },
      });
      expect(state.assignments).toHaveLength(2);

      // duplicate
      const state2 = sectionReducer(state, {
        type: actionTypes.ADD_ASSIGNMENT,
        payload: { id: 'a2' },
      });
      expect(state2).toBe(state);
    });

    it('UPDATE_ASSIGNMENT — replaces matching assignment', () => {
      const prev = { ...initialState, assignments: [{ id: 'a1', status: 'draft' }] };
      const state = sectionReducer(prev, {
        type: actionTypes.UPDATE_ASSIGNMENT,
        payload: { id: 'a1', status: 'published' },
      });
      expect(state.assignments[0].status).toBe('published');
    });

    it('DELETE_ASSIGNMENT — removes by id', () => {
      const prev = { ...initialState, assignments: [{ id: 'a1' }, { id: 'a2' }] };
      const state = sectionReducer(prev, {
        type: actionTypes.DELETE_ASSIGNMENT,
        payload: 'a1',
      });
      expect(state.assignments).toHaveLength(1);
      expect(state.assignments[0].id).toBe('a2');
    });
  });
});
