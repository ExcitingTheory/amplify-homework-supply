export const initialState = {
  words: {},
  filteredWords: {},
  wordMapId: {},
  wordMapPhrase: {},
  filter: '',
  wordRefs: {},
  jaroWinklerThreshold: 0.85,
  syntacticSimilarityThreshold: 0.6,
  searching: false,
  questionBank: [],
};

export const actionTypes = {
  SET_WORDS: 'SET_WORDS',
  SET_FILTERED_WORDS: 'SET_FILTERED_WORDS',
  SET_WORD_MAP_ID: 'SET_WORD_MAP_ID',
  SET_WORD_MAP_PHRASE: 'SET_WORD_MAP_PHRASE',
  SET_FILTER: 'SET_FILTER',
  SET_WORD_REFS: 'SET_WORD_REFS',
  SET_JARO_WINKLER_THRESHOLD: 'SET_JARO_WINKLER_THRESHOLD',
  SET_SYNTACTIC_SIMILARITY_THRESHOLD: 'SET_SYNTACTIC_SIMILARITY_THRESHOLD',
  SET_SEARCHING: 'SET_SEARCHING',
  SET_QUESTION_BANK: 'SET_QUESTION_BANK',
  WORDS_SUBSCRIPTION_UPDATE: 'WORDS_SUBSCRIPTION_UPDATE',
  FILTER_COMPLETE: 'FILTER_COMPLETE',
};

export function dictionaryReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_WORDS:
      return { ...state, words: action.payload };
    case actionTypes.SET_FILTERED_WORDS:
      return { ...state, filteredWords: action.payload };
    case actionTypes.SET_WORD_MAP_ID:
      return { ...state, wordMapId: action.payload };
    case actionTypes.SET_WORD_MAP_PHRASE:
      return { ...state, wordMapPhrase: action.payload };
    case actionTypes.SET_FILTER:
      return { ...state, filter: action.payload };
    case actionTypes.SET_WORD_REFS:
      return { ...state, wordRefs: action.payload };
    case actionTypes.SET_JARO_WINKLER_THRESHOLD:
      return { ...state, jaroWinklerThreshold: action.payload };
    case actionTypes.SET_SYNTACTIC_SIMILARITY_THRESHOLD:
      return { ...state, syntacticSimilarityThreshold: action.payload };
    case actionTypes.SET_SEARCHING:
      return { ...state, searching: action.payload };
    case actionTypes.SET_QUESTION_BANK: {
      const incoming = action.payload;
      // Skip if same count and no version changes
      const incomingKeys = Object.keys(incoming);
      const existingKeys = Object.keys(state.questionBank);
      if (incomingKeys.length === existingKeys.length && incomingKeys.length > 0) {
        const anyNewer = incomingKeys.some(id => {
          const existing = state.questionBank[id];
          return !existing || (incoming[id]._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, questionBank: incoming };
    }
    case actionTypes.WORDS_SUBSCRIPTION_UPDATE: {
      const { words, wordMapId } = action.payload;
      // Skip if same count and no version changes
      const incomingIds = Object.keys(wordMapId);
      const existingIds = Object.keys(state.wordMapId);
      if (incomingIds.length === existingIds.length && incomingIds.length > 0) {
        const anyNewer = incomingIds.some(id => {
          const existing = state.wordMapId[id];
          return !existing || (wordMapId[id]._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return {
        ...state,
        words,
        filteredWords: words,
        wordMapId,
        searching: false,
      };
    }
    case actionTypes.FILTER_COMPLETE:
      return { ...state, filteredWords: action.payload, searching: false };
    default:
      return state;
  }
}
