export const initialState = {
  audioFiles: {},
  myFiles: [],
  myPlaylistFiles: {},
  myPlaylistUrls: {},
  myPdfs: {},
  documents: {},
  filesVersion: 0,
  vectorStoreReady: false,
};

export const actionTypes = {
  SET_AUDIO_FILES: 'SET_AUDIO_FILES',
  SET_MY_FILES: 'SET_MY_FILES',
  SET_PLAYLIST_FILES: 'SET_PLAYLIST_FILES',
  SET_PLAYLIST_URLS: 'SET_PLAYLIST_URLS',
  SET_PDFS: 'SET_PDFS',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  SET_FILES_VERSION: 'SET_FILES_VERSION',
  SET_VECTOR_STORE_READY: 'SET_VECTOR_STORE_READY',
  FILES_SUBSCRIPTION_UPDATE: 'FILES_SUBSCRIPTION_UPDATE',
  INCREMENT_FILES_VERSION: 'INCREMENT_FILES_VERSION',
};

export function fileReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_AUDIO_FILES:
      return { ...state, audioFiles: action.payload };
    case actionTypes.SET_MY_FILES: {
      const incoming = action.payload;
      // Skip if same count and no version changes
      if (state.myFiles.length === incoming.length && incoming.length > 0) {
        const anyNewer = incoming.some(f => {
          const existing = state.myFiles.find(e => e.id === f.id);
          return !existing || (f._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, myFiles: incoming };
    }
    case actionTypes.SET_PLAYLIST_FILES:
      return { ...state, myPlaylistFiles: action.payload };
    case actionTypes.SET_PLAYLIST_URLS:
      return { ...state, myPlaylistUrls: action.payload };
    case actionTypes.SET_PDFS:
      return { ...state, myPdfs: action.payload };
    case actionTypes.SET_DOCUMENTS: {
      const incoming = action.payload;
      // Skip if same count and no version changes
      const incomingKeys = Object.keys(incoming);
      const existingKeys = Object.keys(state.documents);
      if (incomingKeys.length === existingKeys.length && incomingKeys.length > 0) {
        const anyNewer = incomingKeys.some(id => {
          const existing = state.documents[id];
          return !existing || (incoming[id]._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, documents: incoming };
    }
    case actionTypes.SET_FILES_VERSION:
      return { ...state, filesVersion: action.payload };
    case actionTypes.SET_VECTOR_STORE_READY:
      return { ...state, vectorStoreReady: action.payload };
    case actionTypes.FILES_SUBSCRIPTION_UPDATE:
      return {
        ...state,
        myFiles: action.payload.myFiles,
        myPlaylistFiles: action.payload.myPlaylistFiles,
        myPdfs: action.payload.myPdfs,
        filesVersion: state.filesVersion + 1,
      };
    case actionTypes.INCREMENT_FILES_VERSION:
      return { ...state, filesVersion: state.filesVersion + 1 };
    default:
      return state;
  }
}
