export const initialState = {
  sections: [],
  sectionMap: {},
  assignments: [],
};

export const actionTypes = {
  SET_SECTIONS: 'SET_SECTIONS',
  ADD_SECTION: 'ADD_SECTION',
  UPDATE_SECTION: 'UPDATE_SECTION',
  DELETE_SECTION: 'DELETE_SECTION',
  SET_ASSIGNMENTS: 'SET_ASSIGNMENTS',
  ADD_ASSIGNMENT: 'ADD_ASSIGNMENT',
  UPDATE_ASSIGNMENT: 'UPDATE_ASSIGNMENT',
  DELETE_ASSIGNMENT: 'DELETE_ASSIGNMENT',
};

export function sectionReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_SECTIONS: {
      const incoming = action.payload;
      // Skip if same count and no version changes
      if (incoming.length === state.sections.length && incoming.length > 0) {
        const anyNewer = incoming.some(item => {
          const existing = state.sectionMap[item.id];
          return !existing || (item._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      const sectionMap = {};
      incoming.forEach(item => { sectionMap[item.id] = item; });
      return { ...state, sections: incoming, sectionMap };
    }
    case actionTypes.ADD_SECTION: {
      const section = action.payload;
      if (state.sections.some(s => s.id === section.id)) return state;
      const sections = [...state.sections, section];
      return { ...state, sections, sectionMap: { ...state.sectionMap, [section.id]: section } };
    }
    case actionTypes.UPDATE_SECTION: {
      const section = action.payload;
      const existing = state.sectionMap[section.id];
      if (existing && section._version != null &&
          section._version <= (existing._version || 0)) {
        return state; // Not newer, skip re-render
      }
      return {
        ...state,
        sections: state.sections.map(s => s.id === section.id ? section : s),
        sectionMap: { ...state.sectionMap, [section.id]: section },
      };
    }
    case actionTypes.DELETE_SECTION: {
      const id = action.payload;
      const sectionMap = { ...state.sectionMap };
      delete sectionMap[id];
      return {
        ...state,
        sections: state.sections.filter(s => s.id !== id),
        sectionMap,
      };
    }
    case actionTypes.SET_ASSIGNMENTS: {
      const incoming = action.payload;
      // Skip if same count and no version changes
      if (incoming.length === state.assignments.length && incoming.length > 0) {
        const anyNewer = incoming.some(item => {
          const existing = state.assignments.find(a => a.id === item.id);
          return !existing || (item._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, assignments: incoming };
    }
    case actionTypes.ADD_ASSIGNMENT: {
      const assignment = action.payload;
      if (state.assignments.some(a => a.id === assignment.id)) return state;
      return { ...state, assignments: [...state.assignments, assignment] };
    }
    case actionTypes.UPDATE_ASSIGNMENT: {
      const assignment = action.payload;
      const existing = state.assignments.find(a => a.id === assignment.id);
      if (existing && assignment._version != null &&
          assignment._version <= (existing._version || 0)) {
        return state; // Not newer, skip re-render
      }
      return {
        ...state,
        assignments: state.assignments.map(a => a.id === assignment.id ? assignment : a),
      };
    }
    case actionTypes.DELETE_ASSIGNMENT: {
      const id = action.payload;
      return { ...state, assignments: state.assignments.filter(a => a.id !== id) };
    }
    default:
      return state;
  }
}
