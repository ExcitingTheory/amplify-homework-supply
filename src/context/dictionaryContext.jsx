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

import React, { createContext } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';


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
    const [words, setWords] = React.useState({})
    const [filteredWords, setFilteredWords] = React.useState({})
    const [wordMapId, setWordMapId] = React.useState({})
    const [wordMapPhrase, setWordMapPhrase] = React.useState({})
    const [filter, setFilter] = React.useState("")
    const [wordRefs, setWordRefs] = React.useState({})
    const [jaroWinklerThreshold, setJaroWinklerThreshold] = React.useState(0.85)
    const [syntacticSimilarityThreshold, setSyntacticSimilarityThreshold] = React.useState(0.6)
    const [searching, setSearching] = React.useState(false)
    const [questionBank, setQuestionBank] = React.useState([])

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
            console.log("filterWords", { wordsCount: Object.keys(words || {}).length, filter })
        }

        if (!words) {
            return
        }
        // for the words in the local state, filter out the ones that don't match the filter


        // if filtered words is empty, then set filtered words to all words
        if (!filter || filter === "" || filter === " ") {
            setFilteredWords(words)
            if (setSearching) {
                setSearching(false)
            }
            return
        }

        // if filter is less than 3 characters, then set filtered words to all words
        // if (filter.length < 3) {
        //     console.log("filterWords.filter is less than 3 characters")
        //     setFilteredWords(words)
        //     if (setSearching) {
        //         setSearching(false)
        //     }
        //     return
        // }


        const _processingQueue = Object.keys(words).map(async (value, key) => {
            let found = false
            const word = words[value]

            if (word.phrase.toLowerCase().includes(filter.toLowerCase())
                || word.definition.toLowerCase().includes(filter.toLowerCase())
                || word.pronunciation.includes(filter.toLowerCase())
            ) {
                found = true
            }

            // calculate jarowinkler distance
            const jaroWinklerPhrase = jaroWinklerDistance(filter.toLowerCase(), word.phrase.toLowerCase())
            const jaroWinklerDefinition = jaroWinklerDistance(filter.toLowerCase(), word.definition.toLowerCase())
            const jaroWinklerPronunciation = jaroWinklerDistance(filter.toLowerCase(), word.pronunciation.toLowerCase())

            const jaroWinkler = Math.max(jaroWinklerPhrase, jaroWinklerDefinition, jaroWinklerPronunciation)

            if (jaroWinkler > jaroWinklerThreshold) {
                found = true
            }

            if (found) {
                return word
            }
        })
        const _filteredWords = await Promise.all(_processingQueue)


        if (Object.keys(_filteredWords).length === 0) {
            setFilteredWords(prev => {
                const prevStr = JSON.stringify(prev);
                const newStr = JSON.stringify(words);
                return prevStr === newStr ? prev : words;
            });
        } else {
            setFilteredWords(prev => {
                const prevStr = JSON.stringify(prev);
                const newStr = JSON.stringify(_filteredWords);
                return prevStr === newStr ? prev : _filteredWords;
            });
        }
        if (setSearching) {
            setSearching(false)
        }
    }, [words, filter, jaroWinklerThreshold])

    React.useEffect(() => {
        // Debounce filterWords to prevent excessive calls
        const timeoutId = setTimeout(() => {
            filterWords()
        }, 100);
        
        return () => clearTimeout(timeoutId);
    }, [filter, filterWords])

    React.useEffect(() => {
        // Wait for auth to be ready
        if (authLoading || !user) {
            return;
        }

        const client = getAmplifyClient();
        let subscription;

        const setupSubscription = async () => {
            subscription = client.models.Word.observeQuery().subscribe({
            next: ({ items }) => {
                const wordMap = {}
                const _wordMapId = {}

                items.forEach((item) => {
                    wordMap[item.phrase] = item
                    _wordMapId[item.id] = item
                })

                // Only update if the words have actually changed
                setWords(prevWords => {
                    const prevStr = JSON.stringify(Object.keys(prevWords).sort());
                    const newStr = JSON.stringify(Object.keys(wordMap).sort());
                    if (prevStr === newStr) {
                        return prevWords;
                    }
                    return wordMap;
                });
                
                setFilteredWords(prevFiltered => {
                    const prevStr = JSON.stringify(Object.keys(prevFiltered).sort());
                    const newStr = JSON.stringify(Object.keys(wordMap).sort());
                    if (prevStr === newStr) {
                        return prevFiltered;
                    }
                    return wordMap;
                });
                
                setWordMapId(prev => {
                    const prevStr = JSON.stringify(prev);
                    const newStr = JSON.stringify(_wordMapId);
                    return prevStr === newStr ? prev : _wordMapId;
                });
                
                if (setSearching) {
                    setSearching(false)
                }
            },
            error: (error) => {
                console.error('[DictionaryContext] Word subscription error:', error);
            }
        });
        };

        setupSubscription();
        return function cleanup() {
            if (subscription) subscription.unsubscribe();
        };
    }, [user, authLoading]);

    React.useEffect(() => {
        // Wait for auth to be ready
        if (authLoading || !user) {
            return;
        }

        const client = getAmplifyClient();
        let subscription;

        const setupSubscription = async () => {
            subscription = client.models.Question.observeQuery().subscribe({
            next: ({ items }) => {
                const questionMap = {}

                items.forEach((item) => {
                    questionMap[item.id] = item
                })

                setQuestionBank(prev => {
                    const prevStr = JSON.stringify(prev);
                    const newStr = JSON.stringify(questionMap);
                    return prevStr === newStr ? prev : questionMap;
                });
            },
            error: (error) => {
                console.error('[DictionaryContext] Question subscription error:', error);
            }
        });
        };

        setupSubscription();
        return function cleanup() {
            if (subscription) subscription.unsubscribe();
        };
    }, [user, authLoading]);

    const contextValue = React.useMemo(() => ({
        dictionary: words,
        filteredDictionary: filteredWords,
        wordMapId,
        wordMapPhrase,
        wordRefs,
        questionBank,
        filter,
        setFilter,
        filterWords,
        searching,
        setSearching,
    }), [
        words,
        filteredWords,
        wordMapId,
        wordMapPhrase,
        wordRefs,
        questionBank,
        filter,
        filterWords,
        searching,
    ]);

    return (
        <DictionaryContext.Provider value={contextValue}>
            {children}
        </DictionaryContext.Provider>
    );
}

export { DictionaryProvider };

export default DictionaryContext;