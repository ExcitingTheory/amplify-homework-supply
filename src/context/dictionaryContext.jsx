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

import React, { createContext, useReducer } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';
import { dictionaryReducer, initialState, actionTypes } from './reducers/dictionaryReducer';


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

    // const [filterPhraseAndPronunciation, setFilterPhraseAndPronunciation] = React.useState("")
    // const [phraseAndPronunciationFilteredWords, setPhraseAndPronunciationFilteredWords] = React.useState({})




    // search words for a new filter value for the wordblock list

    // React.useEffect(() => {
    //     console.log("DictionaryProvider.useEffect.filter", filter)
    //     // for each word in the dictionary, check if it matches the filter
    //     // determine if the filter is a phrase or a pronunciation
    //     // if the filter is a phrase, then check if the word's phrase matches the filter

    // }, [filterPhraseAndPronunciation])


    const filterWords = React.useCallback(async () => {

        // Reduce logging frequency for performance
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
            console.log("filterWords", { wordsCount: Object.keys(state.words || {}).length, filter: state.filter })
        }

        if (!state.words) {
            return
        }

        if (!state.filter || state.filter === "" || state.filter === " ") {
            dispatch({ type: actionTypes.FILTER_COMPLETE, payload: state.words });
            return
        }

        const _processingQueue = Object.keys(state.words).map(async (value, key) => {
            let found = false
            const word = state.words[value]

            if (word.phrase.toLowerCase().includes(state.filter.toLowerCase())
                || word.definition.toLowerCase().includes(state.filter.toLowerCase())
                || word.pronunciation.includes(state.filter.toLowerCase())
            ) {
                found = true
            }

            // calculate jarowinkler distance
            const jaroWinklerPhrase = jaroWinklerDistance(state.filter.toLowerCase(), word.phrase.toLowerCase())
            const jaroWinklerDefinition = jaroWinklerDistance(state.filter.toLowerCase(), word.definition.toLowerCase())
            const jaroWinklerPronunciation = jaroWinklerDistance(state.filter.toLowerCase(), word.pronunciation.toLowerCase())

            const jaroWinkler = Math.max(jaroWinklerPhrase, jaroWinklerDefinition, jaroWinklerPronunciation)

            if (jaroWinkler > state.jaroWinklerThreshold) {
                found = true
            }

            if (found) {
                return word
            }
        })
        const _filteredWords = await Promise.all(_processingQueue)

        if (Object.keys(_filteredWords).length === 0) {
            dispatch({ type: actionTypes.FILTER_COMPLETE, payload: state.words });
        } else {
            dispatch({ type: actionTypes.FILTER_COMPLETE, payload: _filteredWords });
        }
    }, [state.words, state.filter, state.jaroWinklerThreshold])

    React.useEffect(() => {
        // Debounce filterWords to prevent excessive calls
        const timeoutId = setTimeout(() => {
            filterWords()
        }, 100);
        
        return () => clearTimeout(timeoutId);
    }, [state.filter, filterWords])

    React.useEffect(() => {
        // Wait for auth to be ready
        if (authLoading || !user) {
            return;
        }

        // ── Offline fallback: load words from IndexedDB cache ─────────
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            (async () => {
                try {
                    const { getAllRecords } = await import('../offline/OfflineDataStore');
                    const cachedWords = await getAllRecords('words');
                    if (cachedWords.length > 0) {
                        const wordMap = {};
                        const _wordMapId = {};
                        cachedWords.forEach(item => {
                            wordMap[item.phrase] = item;
                            _wordMapId[item.id] = item;
                        });
                        dispatch({ type: actionTypes.WORDS_SUBSCRIPTION_UPDATE, payload: { words: wordMap, wordMapId: _wordMapId } });
                        console.log('[DictionaryContext] Loaded', cachedWords.length, 'words from offline cache');
                    }
                } catch (err) {
                    console.warn('[DictionaryContext] Offline word cache load failed:', err);
                }
            })();
            return;
        }
        // ── End offline fallback ──────────────────────────────────────

        const client = getAmplifyClient();
        const subscriptions = [];
        let cancelled = false;

        function handleError(label, error) {
            const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
            if (msg.includes('DuplicatedOperationError')) {
                console.warn(`[DictionaryContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
                return;
            }
            console.error(`[DictionaryContext] ${label} error:`, error);
        }

        function buildWordMaps(items) {
            const words = {};
            const wordMapId = {};
            items.forEach(item => {
                words[item.phrase] = item;
                wordMapId[item.id] = item;
            });
            return { words, wordMapId };
        }

        async function fetchWords() {
            try {
                const { data: items, errors } = await client.models.Word.list();
                if (cancelled) return;
                if (errors?.length) console.error('[DictionaryContext] Word list errors:', errors);

                const validItems = (items || []).filter(item => item != null && item.id != null);
                dispatch({ type: actionTypes.WORDS_SUBSCRIPTION_UPDATE, payload: buildWordMaps(validItems) });

                if (cancelled) return;

                const createSub = client.models.Word.onCreate().subscribe({
                    next: (response) => {
                        const word = response?.data;
                        if (!word || !word.id) return;
                        dispatch({ type: actionTypes.WORDS_SUBSCRIPTION_UPDATE, payload: buildWordMaps([word]), meta: 'create' });
                    },
                    error: (error) => handleError('Word onCreate', error)
                });
                subscriptions.push(createSub);

                const updateSub = client.models.Word.onUpdate().subscribe({
                    next: (response) => {
                        const word = response?.data;
                        if (!word || !word.id) return;
                        dispatch({ type: actionTypes.WORDS_SUBSCRIPTION_UPDATE, payload: buildWordMaps([word]), meta: 'update' });
                    },
                    error: (error) => handleError('Word onUpdate', error)
                });
                subscriptions.push(updateSub);

                const deleteSub = client.models.Word.onDelete().subscribe({
                    next: (response) => {
                        const word = response?.data;
                        if (!word || !word.id) return;
                        // For delete, we need to remove from current state - dispatch full refresh
                        dispatch({ type: actionTypes.SET_WORD_MAP_ID, payload: { deleteId: word.id } });
                    },
                    error: (error) => handleError('Word onDelete', error)
                });
                subscriptions.push(deleteSub);
            } catch (error) {
                console.error('[DictionaryContext] fetchWords error:', error);
            }
        }

        fetchWords();

        return function cleanup() {
            cancelled = true;
            subscriptions.forEach(sub => sub.unsubscribe());
        };
    }, [user, authLoading]);

    React.useEffect(() => {
        // Wait for auth to be ready
        if (authLoading || !user) {
            return;
        }

        // ── Offline fallback: load questions from IndexedDB cache ─────
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            (async () => {
                try {
                    const { getAllRecords } = await import('../offline/OfflineDataStore');
                    const cachedQuestions = await getAllRecords('questions');
                    if (cachedQuestions.length > 0) {
                        dispatch({ type: actionTypes.SET_QUESTION_BANK, payload: cachedQuestions });
                        console.log('[DictionaryContext] Loaded', cachedQuestions.length, 'questions from offline cache');
                    }
                } catch (err) {
                    console.warn('[DictionaryContext] Offline question cache load failed:', err);
                }
            })();
            return;
        }
        // ── End offline fallback ──────────────────────────────────────

        // Prevent StrictMode double-subscribe — not needed with list+subs
        const client = getAmplifyClient();
        const subscriptions = [];
        let cancelled = false;

        function handleError(label, error) {
            const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
            if (msg.includes('DuplicatedOperationError')) {
                console.warn(`[DictionaryContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
                return;
            }
            console.error(`[DictionaryContext] ${label} error:`, error);
        }

        async function fetchQuestions() {
            try {
                const { data: items, errors } = await client.models.Question.list();
                if (cancelled) return;
                if (errors?.length) console.error('[DictionaryContext] Question list errors:', errors);

                const validItems = (items || []).filter(item => item != null && item.id != null);
                const questionBank = {};
                validItems.forEach(item => { questionBank[item.id] = item; });
                dispatch({ type: actionTypes.SET_QUESTION_BANK, payload: questionBank });

                if (cancelled) return;

                const createSub = client.models.Question.onCreate().subscribe({
                    next: (response) => {
                        const q = response?.data;
                        if (!q || !q.id) return;
                        dispatch({ type: actionTypes.SET_QUESTION_BANK, payload: { [q.id]: q }, meta: 'create' });
                    },
                    error: (error) => handleError('Question onCreate', error)
                });
                subscriptions.push(createSub);

                const updateSub = client.models.Question.onUpdate().subscribe({
                    next: (response) => {
                        const q = response?.data;
                        if (!q || !q.id) return;
                        dispatch({ type: actionTypes.SET_QUESTION_BANK, payload: { [q.id]: q }, meta: 'update' });
                    },
                    error: (error) => handleError('Question onUpdate', error)
                });
                subscriptions.push(updateSub);

                const deleteSub = client.models.Question.onDelete().subscribe({
                    next: (response) => {
                        const q = response?.data;
                        if (!q || !q.id) return;
                        dispatch({ type: actionTypes.SET_QUESTION_BANK, payload: { deleteId: q.id }, meta: 'delete' });
                    },
                    error: (error) => handleError('Question onDelete', error)
                });
                subscriptions.push(deleteSub);
            } catch (error) {
                console.error('[DictionaryContext] fetchQuestions error:', error);
            }
        }

        fetchQuestions();

        return function cleanup() {
            cancelled = true;
            subscriptions.forEach(sub => sub.unsubscribe());
        };
    }, [user, authLoading]);

    // Stable dispatch-based setters for consumers
    const setFilter = React.useCallback((val) => dispatch({ type: actionTypes.SET_FILTER, payload: val }), []);
    const setSearching = React.useCallback((val) => dispatch({ type: actionTypes.SET_SEARCHING, payload: val }), []);

    const contextValue = React.useMemo(() => ({
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
    }), [
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
    ]);

    return (
        <DictionaryContext.Provider value={contextValue}>
            {children}
        </DictionaryContext.Provider>
    );
}

export { DictionaryProvider };

export default DictionaryContext;