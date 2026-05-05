export const initialState = {
  unit: {},
  dictionary: {},
  questionBank: {},
  files: {},
  rubric: [],
  finishedQuestions: 0,
  showUnitComplete: false,
  personalBestResult: null,
  playlistUrls: {},
  username: null,
  permissionError: null,
  isSaving: false,
  grade: {},
  recentGrades: [],
  practiceSessions: [],
};

export const actionTypes = {
  SET_UNIT: 'SET_UNIT',
  SET_DICTIONARY: 'SET_DICTIONARY',
  SET_QUESTION_BANK: 'SET_QUESTION_BANK',
  SET_FILES: 'SET_FILES',
  SET_RUBRIC: 'SET_RUBRIC',
  SET_FINISHED_QUESTIONS: 'SET_FINISHED_QUESTIONS',
  SET_SHOW_UNIT_COMPLETE: 'SET_SHOW_UNIT_COMPLETE',
  SET_PERSONAL_BEST_RESULT: 'SET_PERSONAL_BEST_RESULT',
  SET_PLAYLIST_URLS: 'SET_PLAYLIST_URLS',
  SET_USERNAME: 'SET_USERNAME',
  SET_PERMISSION_ERROR: 'SET_PERMISSION_ERROR',
  SET_IS_SAVING: 'SET_IS_SAVING',
  SET_GRADE: 'SET_GRADE',
  SET_RECENT_GRADES: 'SET_RECENT_GRADES',
  SET_PRACTICE_SESSIONS: 'SET_PRACTICE_SESSIONS',
  UNIT_LOADED: 'UNIT_LOADED',
  UNIT_CLEARED: 'UNIT_CLEARED',
  GRADE_SUBSCRIPTION_UPDATE: 'GRADE_SUBSCRIPTION_UPDATE',
};

export function unitReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_UNIT:
      return { ...state, unit: action.payload };
    case actionTypes.SET_DICTIONARY:
      return { ...state, dictionary: action.payload };
    case actionTypes.SET_QUESTION_BANK:
      return { ...state, questionBank: action.payload };
    case actionTypes.SET_FILES:
      return { ...state, files: action.payload };
    case actionTypes.SET_RUBRIC:
      return { ...state, rubric: action.payload };
    case actionTypes.SET_FINISHED_QUESTIONS:
      return { ...state, finishedQuestions: action.payload };
    case actionTypes.SET_SHOW_UNIT_COMPLETE:
      return { ...state, showUnitComplete: action.payload };
    case actionTypes.SET_PERSONAL_BEST_RESULT:
      return { ...state, personalBestResult: action.payload };
    case actionTypes.SET_PLAYLIST_URLS:
      return { ...state, playlistUrls: action.payload };
    case actionTypes.SET_USERNAME:
      return { ...state, username: action.payload };
    case actionTypes.SET_PERMISSION_ERROR:
      return { ...state, permissionError: action.payload };
    case actionTypes.SET_IS_SAVING:
      return { ...state, isSaving: action.payload };
    case actionTypes.SET_GRADE:
      return { ...state, grade: action.payload };
    case actionTypes.SET_RECENT_GRADES:
      return { ...state, recentGrades: action.payload };
    case actionTypes.SET_PRACTICE_SESSIONS: {
      const sessions = action.payload;
      // Skip if same count and no version changes
      if (state.practiceSessions.length === sessions.length &&
          sessions.length > 0) {
        const anyNewer = sessions.some(s => {
          const existing = state.practiceSessions.find(e => e.id === s.id);
          return !existing || (s._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, practiceSessions: sessions };
    }
    case actionTypes.UNIT_LOADED:
      return {
        ...state,
        unit: action.payload.unit,
        dictionary: action.payload.dictionary,
        files: action.payload.files,
        playlistUrls: action.payload.playlistUrls,
        questionBank: action.payload.questionBank,
        rubric: action.payload.rubric,
        permissionError: null,
      };
    case actionTypes.UNIT_CLEARED:
      return { ...state, unit: {}, permissionError: null };
    case actionTypes.GRADE_SUBSCRIPTION_UPDATE: {
      const { grade, username, showUnitComplete, finishedQuestions, recentGrades } = action.payload;
      // Skip if current grade hasn't changed version
      if (state.grade?.id && grade?.id === state.grade.id &&
          grade?._version != null &&
          grade._version <= (state.grade._version || 0) &&
          state.recentGrades.length === recentGrades.length) {
        return state; // Not newer, skip re-render
      }
      return {
        ...state,
        grade,
        username,
        showUnitComplete,
        finishedQuestions,
        recentGrades,
      };
    }
    default:
      return state;
  }
}
