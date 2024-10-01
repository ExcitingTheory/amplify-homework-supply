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
import { DataStore } from "aws-amplify/datastore";
import { Question, Word } from "../models"
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';


// Provider and Consumer are connected through their "parent" context
const DictionaryContext = createContext();


function jaroWinklerDistance(s1, s2) {
    // If the strings are equal, return 1
    if (s1 === s2) {
        return 1;
    }

    // Find the length of the matching prefix up to a maximum of 4 characters
    let prefixLength = 0;
    for (let i = 0; i < 4 && s1[i] === s2[i]; i++) {
        prefixLength++;
    }

    // Calculate the Jaro distance
    let m = 0;
    let t = 0;
    let s1Matches = new Array(s1.length).fill(false);
    let s2Matches = new Array(s2.length).fill(false);
    for (let i = 0; i < s1.length; i++) {
        let start = Math.max(0, i - Math.floor(Math.max(0, s2.length - s1.length - i - 1) / 2));
        let end = Math.min(s2.length - 1, i + Math.floor(Math.max(0, s1.length - s2.length - i - 1) / 2));
        for (let j = start; j <= end; j++) {
            if (!s2Matches[j] && s1[i] === s2[j]) {
                s1Matches[i] = true;
                s2Matches[j] = true;
                m++;
                break;
            }
        }
    }

    if (m === 0) {
        return 0;
    }

    let jaro = (m / s1.length + m / s2.length + (m - Math.floor((m - t) / 2)) / m) / 3;

    // Calculate the Jaro-Winkler distance
    let jaroWinkler = jaro + prefixLength * 0.1 * (1 - jaro);

    return jaroWinkler;
}

const dot = function (a, b) {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var sum = 0;
    for (var key in a) {
        if (hasOwnProperty.call(a, key) && hasOwnProperty.call(b, key)) {
            sum += a[key] * b[key]
        }
    }
    return sum
}

const similarity = function (a, b) {
    var magnitudeA = Math.sqrt(dot(a, a));
    var magnitudeB = Math.sqrt(dot(b, b));
    if (magnitudeA && magnitudeB)
        return dot(a, b) / (magnitudeA * magnitudeB);
    else return false
}



const cosineSimilarityMatrix = function (matrix) {
    let cosine_similarity_matrix = [];
    for (let i = 0; i < matrix.length; i++) {
        let row = [];
        for (let j = 0; j < i; j++) {
            row.push(cosine_similarity_matrix[j][i]);
        }
        row.push(1);
        for (let j = (i + 1); j < matrix.length; j++) {
            row.push(similarity(matrix[i], matrix[j]));
        }
        cosine_similarity_matrix.push(row);
    }
    return cosine_similarity_matrix;
}

function memoize(func) {
    const cache = {};

    return function (...args) {
        const key = JSON.stringify(args);

        if (cache[key]) {
            return cache[key];
        }

        const result = func.apply(this, args);
        cache[key] = result;

        return result;
    };
}

function hasWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

const syntacticSimilarity = async (sentences) => {
    const model = await use.load()
    const embeddings = await model.embed(sentences)
    let arr = cosineSimilarityMatrix(embeddings.arraySync())
    return arr
}

const syntacticSimilarityWebGl = async (sentences) => {
    // Load the model
    const model = await use.load();

    // Embed the sentences using the model
    const embeddings = await model.embed(sentences);

    // Compute the cosine similarity matrix using WebGL
    const embeddingsT = embeddings.transpose();
    const dotProduct = embeddings.matMul(embeddingsT);
    const norms = embeddings.norm(2, 1, true);
    const normsT = norms.transpose();
    const normProduct = norms.matMul(normsT);
    const similarity = dotProduct.div(normProduct).arraySync();

    // Clean up
    embeddings.dispose();
    embeddingsT.dispose();
    dotProduct.dispose();
    norms.dispose();
    normsT.dispose();
    normProduct.dispose();
    // model.dispose();

    return similarity;
}



const compareSyntacticSimilarity = async (string1, string2) => {

    console.log("compareSyntacticSimilarity", string1, string2)

    if (string1 === string2) {
        return 1;
    }

    const sentences = [string1, string2]
    console.log("sentences", sentences)

    let _syntacticSimilarity
    let syntacticSimilarityMatrix

    if (hasWebGLSupport()) {
        console.log("hasWebGLSupport")
        syntacticSimilarityMatrix = await syntacticSimilarityWebGl(sentences)
        _syntacticSimilarity = syntacticSimilarityMatrix[0][1]
    } else {
        syntacticSimilarityMatrix = await syntacticSimilarity(sentences)
        _syntacticSimilarity = syntacticSimilarityMatrix[0][1]
    }

    console.log("_syntacticSimilarity", _syntacticSimilarity)

    return _syntacticSimilarity
};

// Provider will be exported wrapped in ConfigProvider component.
const DictionaryProvider = ({ children }) => {

    // TODO add a filter to the dictionary
    // TODO add a sort to the dictionary?
    // TODO add keep a map of refs to the words in the dictionary for scrolling to the word in the editor?

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


    console.log("DictionaryProvider.filter", filter)

    // search words for a new filter value for the wordblock list

    // React.useEffect(() => {
    //     console.log("DictionaryProvider.useEffect.filter", filter)
    //     // for each word in the dictionary, check if it matches the filter
    //     // determine if the filter is a phrase or a pronunciation
    //     // if the filter is a phrase, then check if the word's phrase matches the filter

    // }, [filterPhraseAndPronunciation])


    const filterWords = async () => {

        console.log("filterWords")
        console.log("filterWords.words", words)
        console.log("filterWords.filter", filter)

        if (!words) {
            return
        }
        // for the words in the local state, filter out the ones that don't match the filter


        // if filtered words is empty, then set filtered words to all words
        if (!filter || filter === "" || filter === " ") {
            console.log("filterWords.filter is empty")
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
            console.log("value", value)
            console.log("key", key)

            let found = false


            const word = words[value]

            console.log("word", word)

            if (word.phrase.toLowerCase().includes(filter.toLowerCase())
                || word.definition.toLowerCase().includes(filter.toLowerCase())
                || word.pronunciation.includes(filter.toLowerCase())
            ) {
                console.log("phrase, definition, or pronunciation includes filter")
                found = true
            }

            // calculate jarowinkler distance

            const jaroWinklerPhrase = jaroWinklerDistance(filter.toLowerCase(), word.phrase.toLowerCase())
            const jaroWinklerDefinition = jaroWinklerDistance(filter.toLowerCase(), word.definition.toLowerCase())
            const jaroWinklerPronunciation = jaroWinklerDistance(filter.toLowerCase(), word.pronunciation.toLowerCase())

            console.log("jaroWinklerPhrase", jaroWinklerPhrase)
            console.log("jaroWinklerDefinition", jaroWinklerDefinition)
            console.log("jaroWinklerPronunciation", jaroWinklerPronunciation)
            console.log("jaroWinklerThreshold", jaroWinklerThreshold)

            const jaroWinkler = Math.max(jaroWinklerPhrase, jaroWinklerDefinition, jaroWinklerPronunciation)
            console.log("jaroWinkler", jaroWinkler)

            if (jaroWinkler > jaroWinklerThreshold) {
                console.log(`${jaroWinkler} > ${jaroWinklerThreshold}`, jaroWinkler > jaroWinklerThreshold)
                found = true
            }


            // calculate syntactic similarity
            // const syntacticSimilarityPhrase = await compareSyntacticSimilarity(filter.toLowerCase(), word.phrase.toLowerCase())
            // const syntacticSimilarityDefinition = await compareSyntacticSimilarity(filter.toLowerCase(), word.definition.toLowerCase())
            // const syntacticSimilarityPronunciation = await compareSyntacticSimilarity(filter.toLowerCase(), word.pronunciation.toLowerCase())

            // const _syntacticSimilarity = Math.max(syntacticSimilarityPhrase, syntacticSimilarityDefinition, syntacticSimilarityPronunciation)

            // console.log("syntacticSimilarityPhrase", filter, word.phrase, syntacticSimilarityPhrase)

            // if (syntacticSimilarityPhrase > syntacticSimilarityThreshold) {
            //     console.log(`${syntacticSimilarityPhrase} > ${syntacticSimilarityThreshold}`, syntacticSimilarityPhrase > syntacticSimilarityThreshold)
            //     found = true
            // }

            if (found) {
                return word
            }
        })
        const _filteredWords = await Promise.all(_processingQueue)


        if (Object.keys(_filteredWords).length === 0) {
            setFilteredWords(words)
        } else {
            setFilteredWords(_filteredWords)
        }
        if (setSearching) {
            setSearching(false)
        }
    }

    React.useEffect(() => {
        filterWords()
    }, [filter, words])

    React.useEffect(() => {
        const subscription = DataStore.observeQuery(Word).subscribe(({ items }) => {
            // console.log("Word.items", items)
            const wordMap = {}

            items.forEach((item) => {
                wordMap[item.phrase] = item
                wordMapId[item.id] = item
            })

            setWords(wordMap);
            setFilteredWords(wordMap);
            setWordMapId(wordMapId);
            if (setSearching) {
                setSearching(false)
            }
        });
        return function cleanup() {
            subscription.unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        const subscription = DataStore.observeQuery(Question).subscribe(({ items }) => {
            // console.log("Word.items", items)
            const questionMap = {}

            items.forEach((item) => {
                questionMap[item.id] = item
            })

            setQuestionBank(questionMap);

            // setWords(questionMap);
            // setFilteredWords(questionMap);
            // setWordMapId(questionMap);
            // if (setSearching) {
            //     setSearching(false)
            // }
        });
        return function cleanup() {
            subscription.unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        const setTensorflowBackend = async () => {
            if (hasWebGLSupport()) {
                console.log("setTensorflowBackend")
                await tf.setBackend('webgl');
            }

        }
        setTensorflowBackend()
    }, []);

    return (
        <DictionaryContext.Provider
            value={{
                dictionary: words,
                filteredDictionary: filteredWords,
                // phraseAndPronunciationFilteredDictionary: phraseAndPronunciationFilteredWords,
                wordMapId,
                wordMapPhrase,
                wordRefs,
                questionBank,
                filter,
                setFilter,
                filterWords,
                // filterPhraseAndPronunciation,
                searching,
                setSearching,
            }}
        >
            {children}
        </DictionaryContext.Provider>
    );
}

export { DictionaryProvider };

export default DictionaryContext;