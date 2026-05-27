/**
 * @fileoverview DictionaryContext is a React Context object that provides
 * access to the dictionary of words and phrases.
 *
 * It is used by the Dictionary component to display a list of words and phrases.
 *
 * It is used by the Editor2 component to provide a list of words and phrases
 * for the autocomplete feature.
 *
 */

import React, { createContext, useReducer, useRef } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";
import {
  dictionaryReducer,
  initialState,
  actionTypes,
} from "./reducers/dictionaryReducer";

// Provider and Consumer are connected through their "parent" context
const DictionaryContext = createContext({
  dictionary: {},
  filteredDictionary: {},
  wordMapId: {},
  wordMapPhrase: {},
  wordRefs: {},
  questionBank: {},
  filter: "",
  setFilter: () => {},
  filterWords: () => {},
  searching: false,
  setSearching: () => {},
});

// Provider will be exported wrapped in ConfigProvider component.
const DictionaryProvider = ({ children }) => {
  // TODO add a filter to the dictionary
  // TODO add a sort to the dictionary?
  // TODO add keep a map of refs to the words in the dictionary for scrolling to the word in the editor?

  const { user, isLoading: authLoading } = React.useContext(AuthContext);
  const [state, dispatch] = useReducer(dictionaryReducer, initialState);
  const wordVersionMapRef = useRef({});
  const questionVersionMapRef = useRef({});

  // search words for a new filter value for the wordblock list

  // React.useEffect(() => {
  //     console.log("DictionaryProvider.useEffect.filter", filter)
  //     // for each word in the dictionary, check if it matches the filter
  //     // determine if the filter is a phrase or a pronunciation
  //     // if the filter is a phrase, then check if the word's phrase matches the filter

  // }, [filterPhraseAndPronunciation])

  const filterWords = React.useCallback(async () => {
    // Reduce logging frequency for performance
    if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
      console.log("filterWords", {
        wordsCount: Object.keys(state.words || {}).length,
        filter: state.filter,
      });
    }

    if (!state.words) {
      return;
    }

    if (!state.filter || state.filter === "" || state.filter === " ") {
      dispatch({ type: actionTypes.FILTER_COMPLETE, payload: state.words });
      return;
    }

    const _processingQueue = Object.keys(state.words).map(
      async (value, key) => {
        let found = false;
        const word = state.words[value];

        if (
          word.phrase.toLowerCase().includes(state.filter.toLowerCase()) ||
          word.definition.toLowerCase().includes(state.filter.toLowerCase()) ||
          word.pronunciation.includes(state.filter.toLowerCase())
        ) {
          found = true;
        }

        // calculate jarowinkler distance
        const jaroWinklerPhrase = jaroWinklerDistance(
          state.filter.toLowerCase(),
          word.phrase.toLowerCase(),
        );
        const jaroWinklerDefinition = jaroWinklerDistance(
          state.filter.toLowerCase(),
          word.definition.toLowerCase(),
        );
        const jaroWinklerPronunciation = jaroWinklerDistance(
          state.filter.toLowerCase(),
          word.pronunciation.toLowerCase(),
        );

        const jaroWinkler = Math.max(
          jaroWinklerPhrase,
          jaroWinklerDefinition,
          jaroWinklerPronunciation,
        );

        if (jaroWinkler > state.jaroWinklerThreshold) {
          found = true;
        }

        if (found) {
          return word;
        }
      },
    );
    const _filteredWords = (await Promise.allSettled(_processingQueue))
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    if (Object.keys(_filteredWords).length === 0) {
      dispatch({ type: actionTypes.FILTER_COMPLETE, payload: state.words });
    } else {
      dispatch({ type: actionTypes.FILTER_COMPLETE, payload: _filteredWords });
    }
  }, [state.words, state.filter, state.jaroWinklerThreshold]);

  React.useEffect(() => {
    // Debounce filterWords to prevent excessive calls
    const timeoutId = setTimeout(() => {
      filterWords();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [state.filter, filterWords]);

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      return;
    }

    // ── Offline fallback: load words from IndexedDB cache ─────────
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      (async () => {
        try {
          const { getAllRecords } = await import("../offline/OfflineDataStore");
          const cachedWords = await getAllRecords("words");
          if (cachedWords.length > 0) {
            const wordMap = {};
            const _wordMapId = {};
            cachedWords.forEach((item) => {
              wordMap[item.phrase] = item;
              _wordMapId[item.id] = item;
            });
            dispatch({
              type: actionTypes.WORDS_SUBSCRIPTION_UPDATE,
              payload: { words: wordMap, wordMapId: _wordMapId },
            });
            console.log(
              "[DictionaryContext] Loaded",
              cachedWords.length,
              "words from offline cache",
            );
          }
        } catch (err) {
          console.warn(
            "[DictionaryContext] Offline word cache load failed:",
            err,
          );
        }
      })();
      return;
    }
    // ── End offline fallback ──────────────────────────────────────

    const client = getAmplifyClient();
    let cancelled = false;

    function handleError(label, error) {
      const msg =
        error?.message ||
        error?.errors?.[0]?.message ||
        error?.error?.errors?.[0]?.message ||
        JSON.stringify(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[DictionaryContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      console.error(`[DictionaryContext] ${label} error:`, error);
    }

    function buildWordMaps(items) {
      const words = {};
      const wordMapId = {};
      items.forEach((item) => {
        words[item.phrase] = item;
        wordMapId[item.id] = item;
      });
      return { words, wordMapId };
    }

    // Single observeQuery replaces list() + 3 manual subscriptions
    // Exclude heavy fields: yjsSnapshot
    const subscription = client.models.Word.observeQuery({
      selectionSet: [
        "id",
        "owner",
        "identityId",
        "phrase",
        "pronunciation",
        "definition",
        "rubyTags",
        "audio.*",
        "definitionAudio.*",
        "importedAt",
        "embedding.*",
        "moderation.*",
        "_version",
        "_lastChangedAt",
        "_deleted",
        "createdAt",
        "updatedAt",
      ],
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = wordVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (!hasChanges && Object.keys(wordVersionMapRef.current).length > 0) {
          return; // All items same or older version — skip dispatch
        }

        // Update version map
        wordVersionMapRef.current = {};
        validItems.forEach((item) => {
          wordVersionMapRef.current[item.id] = item._version;
        });

        dispatch({
          type: actionTypes.WORDS_SUBSCRIPTION_UPDATE,
          payload: buildWordMaps(validItems),
        });
      },
      error: (error) => handleError("Word observeQuery", error),
    });

    return function cleanup() {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      return;
    }

    // ── Offline fallback: load questions from IndexedDB cache ─────
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      (async () => {
        try {
          const { getAllRecords } = await import("../offline/OfflineDataStore");
          const cachedQuestions = await getAllRecords("questions");
          if (cachedQuestions.length > 0) {
            dispatch({
              type: actionTypes.SET_QUESTION_BANK,
              payload: cachedQuestions,
            });
            console.log(
              "[DictionaryContext] Loaded",
              cachedQuestions.length,
              "questions from offline cache",
            );
          }
        } catch (err) {
          console.warn(
            "[DictionaryContext] Offline question cache load failed:",
            err,
          );
        }
      })();
      return;
    }
    // ── End offline fallback ──────────────────────────────────────

    // Single observeQuery replaces list() + 3 manual subscriptions
    const client = getAmplifyClient();
    let cancelled = false;

    function handleError(label, error) {
      const msg =
        error?.message ||
        error?.errors?.[0]?.message ||
        error?.error?.errors?.[0]?.message ||
        JSON.stringify(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[DictionaryContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      console.error(`[DictionaryContext] ${label} error:`, error);
    }

    // Exclude heavy fields: yjsSnapshot
    const subscription = client.models.Question.observeQuery({
      selectionSet: [
        "id",
        "owner",
        "identityId",
        "prompt",
        "answer",
        "choices.*",
        "audio.*",
        "answerAudio.*",
        "image",
        "answerImage",
        "type",
        "difficulty",
        "points",
        "tags.*",
        "embedding.*",
        "moderation.*",
        "_version",
        "_lastChangedAt",
        "_deleted",
        "createdAt",
        "updatedAt",
      ],
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = questionVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(questionVersionMapRef.current).length > 0
        ) {
          return; // All items same or older version — skip dispatch
        }

        // Update version map
        questionVersionMapRef.current = {};
        validItems.forEach((item) => {
          questionVersionMapRef.current[item.id] = item._version;
        });

        const questionBank = {};
        validItems.forEach((item) => {
          questionBank[item.id] = item;
        });
        dispatch({
          type: actionTypes.SET_QUESTION_BANK,
          payload: questionBank,
        });
      },
      error: (error) => handleError("Question observeQuery", error),
    });

    return function cleanup() {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  // Stable dispatch-based setters for consumers
  const setFilter = React.useCallback(
    (val) => dispatch({ type: actionTypes.SET_FILTER, payload: val }),
    [],
  );
  const setSearching = React.useCallback(
    (val) => dispatch({ type: actionTypes.SET_SEARCHING, payload: val }),
    [],
  );

  // Optimistic version bump helpers — call before save to block subscription echo
  const bumpWordVersion = React.useCallback((id, currentVersion) => {
    const previousVersion = wordVersionMapRef.current[id] || currentVersion;
    wordVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        wordVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        wordVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  const bumpQuestionVersion = React.useCallback((id, currentVersion) => {
    const previousVersion = questionVersionMapRef.current[id] || currentVersion;
    questionVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        questionVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        questionVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
      dictionary: state.words,
      filteredDictionary: state.filteredWords,
      wordMapId: state.wordMapId,
      wordMapPhrase: state.wordMapPhrase,
      wordRefs: state.wordRefs,
      questionBank: state.questionBank,
      filter: state.filter,
      setFilter,
      filterWords,
      searching: state.searching,
      setSearching,
      bumpWordVersion,
      bumpQuestionVersion,
    }),
    [
      state.words,
      state.filteredWords,
      state.wordMapId,
      state.wordMapPhrase,
      state.wordRefs,
      state.questionBank,
      state.filter,
      setFilter,
      filterWords,
      state.searching,
      setSearching,
      bumpWordVersion,
      bumpQuestionVersion,
    ],
  );

  return (
    <DictionaryContext.Provider value={contextValue}>
      {children}
    </DictionaryContext.Provider>
  );
};

export { DictionaryProvider };

export default DictionaryContext;
