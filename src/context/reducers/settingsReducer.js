export const initialState = {
  settings: null,
  isLoading: true,
};

export const actionTypes = {
  SET_SETTINGS: 'SET_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SETTINGS_LOADED: 'SETTINGS_LOADED',
  SETTINGS_LOAD_FAILED: 'SETTINGS_LOAD_FAILED',
};

export function settingsReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_SETTINGS: {
      const incoming = action.payload;
      if (state.settings && incoming?._version != null &&
          incoming._version <= (state.settings._version || 0)) {
        return state; // Not newer, skip re-render
      }
      return { ...state, settings: incoming };
    }
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SETTINGS_LOADED: {
      const incoming = action.payload;
      if (state.settings && incoming?._version != null &&
          incoming._version <= (state.settings._version || 0)) {
        return { ...state, isLoading: false }; // Not newer, but mark loaded
      }
      // Merge with existing settings to preserve fields the subscription may omit
      const merged = state.settings ? { ...state.settings, ...incoming } : incoming;
      return { settings: merged, isLoading: false };
    }
    case actionTypes.SETTINGS_LOAD_FAILED:
      return { ...state, isLoading: false };
    default:
      return state;
  }
}
