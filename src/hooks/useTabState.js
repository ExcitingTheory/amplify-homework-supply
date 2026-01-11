import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  loadTabState,
  saveTabState,
  parseTabStateFromURL,
  buildTabStateQuery,
  mergeTabState,
} from '../utils/tabStateUtils';

/**
 * Reducer for tab state management
 */
const tabStateReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_LEFT_SIDEBAR':
      return { 
        ...state, 
        leftTab: action.tab ?? state.leftTab, 
        leftOpen: true 
      };
    case 'OPEN_RIGHT_SIDEBAR':
      return { 
        ...state, 
        rightTab: action.tab ?? state.rightTab, 
        rightOpen: true 
      };
    case 'CLOSE_LEFT_SIDEBAR':
      return { ...state, leftOpen: false };
    case 'CLOSE_RIGHT_SIDEBAR':
      return { ...state, rightOpen: false };
    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, leftOpen: !state.leftOpen };
    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, rightOpen: !state.rightOpen };
    case 'SET_LEFT_TAB':
      return { ...state, leftTab: action.tab };
    case 'SET_RIGHT_TAB':
      return { ...state, rightTab: action.tab };
    case 'SET_LEFT_WIDTH':
      return { ...state, leftWidth: action.width };
    case 'SET_RIGHT_WIDTH':
      return { ...state, rightWidth: action.width };
    case 'SET_WIDTHS':
      return { 
        ...state, 
        leftWidth: action.leftWidth, 
        rightWidth: action.rightWidth 
      };
    case 'RESTORE_FROM_URL':
      return { ...state, ...action.payload };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

/**
 * Custom hook for managing vertical tab state with localStorage and URL sync
 * 
 * @param {object} options - Configuration options
 * @param {number} options.defaultLeftTab - Default left tab index
 * @param {number} options.defaultRightTab - Default right tab index
 * @param {number} options.defaultLeftWidth - Default left drawer width
 * @param {number} options.defaultRightWidth - Default right drawer width
 * @param {boolean} options.syncToURL - Whether to sync state to URL (default: true)
 * @param {boolean} options.syncToLocalStorage - Whether to sync to localStorage (default: true)
 * 
 * @returns {object} Tab state and setter functions
 */
export function useTabState(options = {}) {
  const {
    defaultLeftTab = 4, // files
    defaultRightTab = 1, // chat
    defaultLeftWidth = 350,
    defaultRightWidth = 350,
    syncToURL = true,
    syncToLocalStorage = true,
  } = options;

  const router = useRouter();
  const isInitialized = useRef(false);
  const isUpdatingURL = useRef(false);

  // Initialize state from URL and localStorage
  const [state, dispatch] = useReducer(tabStateReducer, null, () => {
    if (typeof window === 'undefined') {
      return {
        leftTab: defaultLeftTab,
        rightTab: defaultRightTab,
        leftOpen: false,
        rightOpen: false,
        leftWidth: defaultLeftWidth,
        rightWidth: defaultRightWidth,
      };
    }

    const urlState = parseTabStateFromURL(router.query);
    const localState = syncToLocalStorage ? loadTabState() : null;
    
    // Prioritize: URL state > component defaults > localStorage
    // This prevents stale localStorage values from overriding new component defaults
    const merged = {
      leftTab: urlState.leftTab ?? defaultLeftTab ?? localState?.leftTab,
      rightTab: urlState.rightTab ?? defaultRightTab ?? localState?.rightTab,
      leftOpen: urlState.leftOpen ?? localState?.leftOpen ?? false,
      rightOpen: urlState.rightOpen ?? localState?.rightOpen ?? false,
      leftWidth: urlState.leftWidth ?? defaultLeftWidth ?? localState?.leftWidth,
      rightWidth: urlState.rightWidth ?? defaultRightWidth ?? localState?.rightWidth,
    };
    
    console.log('[useTabState] Initialized with:', merged, 'from URL:', urlState, 'localStorage:', localState, 'defaults:', { defaultLeftTab, defaultRightTab });
    
    return merged;
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    if (!syncToLocalStorage || !isInitialized.current) return;
    
    saveTabState(state);
  }, [state, syncToLocalStorage]);

  // Sync to URL whenever state changes (debounced)
  useEffect(() => {
    if (!syncToURL || !isInitialized.current || isUpdatingURL.current || !router.isReady) return;

    const timeoutId = setTimeout(() => {
      // Build tab state query params
      const tabQuery = buildTabStateQuery(state);
      
      // Only update URL if tab query actually changed
      const currentTabQuery = buildTabStateQuery(parseTabStateFromURL(router.query));
      const newTabQuery = buildTabStateQuery(state);
      
      if (JSON.stringify(currentTabQuery) !== JSON.stringify(newTabQuery)) {
        isUpdatingURL.current = true;
        
        // Build URL string to avoid interpolation issues with dynamic routes
        // Use only tab state params, not dynamic route params like 'id'
        const currentPath = router.asPath.split('?')[0];
        const queryString = new URLSearchParams(tabQuery).toString();
        const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;
        
        router.replace(newUrl, undefined, { shallow: true }).finally(() => {
          isUpdatingURL.current = false;
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [state, syncToURL, router.pathname, router.query, router.isReady]);

  // Listen for URL changes from external sources (browser back/forward, manual URL edits)
  useEffect(() => {
    if (!syncToURL || isUpdatingURL.current) return;

    const urlState = parseTabStateFromURL(router.query);
    const localState = syncToLocalStorage ? loadTabState() : null;
    
    // Merge with component defaults, not utility defaults
    const merged = {
      leftTab: urlState.leftTab ?? localState?.leftTab ?? defaultLeftTab,
      rightTab: urlState.rightTab ?? localState?.rightTab ?? defaultRightTab,
      leftOpen: urlState.leftOpen ?? localState?.leftOpen ?? false,
      rightOpen: urlState.rightOpen ?? localState?.rightOpen ?? false,
      leftWidth: urlState.leftWidth ?? localState?.leftWidth ?? defaultLeftWidth,
      rightWidth: urlState.rightWidth ?? localState?.rightWidth ?? defaultRightWidth,
    };

    // Mark as initialized after first load
    if (!isInitialized.current) {
      isInitialized.current = true;
      dispatch({ type: 'RESTORE_FROM_URL', payload: merged });
    } else {
      // For subsequent changes, only restore if URL was changed externally
      // (We detect this by checking if we're not currently updating the URL ourselves)
      dispatch({ type: 'RESTORE_FROM_URL', payload: merged });
    }
  }, [router.query, syncToURL, syncToLocalStorage, defaultLeftTab, defaultRightTab, defaultLeftWidth, defaultRightWidth]);

  // Setter functions with dispatch
  const setLeftTab = useCallback((value) => {
    dispatch({ type: 'SET_LEFT_TAB', tab: value });
  }, []);

  const setRightTab = useCallback((value) => {
    dispatch({ type: 'SET_RIGHT_TAB', tab: value });
  }, []);

  const setLeftOpen = useCallback((value) => {
    dispatch({ type: value ? 'OPEN_LEFT_SIDEBAR' : 'CLOSE_LEFT_SIDEBAR' });
  }, []);

  const setRightOpen = useCallback((value) => {
    dispatch({ type: value ? 'OPEN_RIGHT_SIDEBAR' : 'CLOSE_RIGHT_SIDEBAR' });
  }, []);

  const setLeftWidth = useCallback((value) => {
    dispatch({ type: 'SET_LEFT_WIDTH', width: value });
  }, []);

  const setRightWidth = useCallback((value) => {
    dispatch({ type: 'SET_RIGHT_WIDTH', width: value });
  }, []);

  // Batch update function
  const updateState = useCallback((updates) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates });
  }, []);

  return {
    // State values
    leftTab: state.leftTab,
    rightTab: state.rightTab,
    leftOpen: state.leftOpen,
    rightOpen: state.rightOpen,
    leftWidth: state.leftWidth,
    rightWidth: state.rightWidth,

    // Setters
    setLeftTab,
    setRightTab,
    setLeftOpen,
    setRightOpen,
    setLeftWidth,
    setRightWidth,
    
    // Batch update
    updateState,
  };
}
