// check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
// provide the answer to the question to the user
// record answer for this question in a ref.
// update the progress bar with the number of correct answers.
// silently record incorrect answers for review, but allow the user to continue and try to answer the question again.

import React, { lazy, Suspense } from 'react';
import {
    verifyWord,
    verifyDefinition,
} from "../../../graphql/queries";
import { generateClient } from 'aws-amplify/api';

import { useEffect, useState, useRef } from 'react';

import { TextareaAutosize } from '@mui/base/TextareaAutosize';

import {
    Box,
    Input,
    LinearProgress,
    Typography,
    Button,
} from '@mui/material';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import UnitContext from '../../../context/unitContext';

import { RecordingStudio2 } from '../../RecordingStudio2';

import dynamic from "next/dynamic";

const SketchPad = dynamic(
  async () => (await import("./SketchPad")).default,
  {
    ssr: false,
  },
);


const MediaPlayerComponent = lazy(() => import('../components/MediaPlayerComponent'));


const client = generateClient();

function LinearProgressWithLabel({ value }) {
    return (
        <>
            <Box display="flex" alignItems="center" margin={1}>
                <Box width="95%">
                    <LinearProgress variant="determinate" value={value} />
                </Box>
                <Box width='fit-content' marginLeft={1}>
                    <Typography variant="body2" color="textSecondary"
                        style={{
                            marginLeft: '1rem',
                            width: '55%',
                        }}
                    >{`${Math.round(
                        value,
                    )}%`}</Typography>
                </Box>
            </Box>
        </>
    );
}

export default function AnswerComponent({
    className,
    format,
    nodeKey,
    // setFileIDs,
    wordIDs,
    requestDefinition,
    customPrompt,
    allowedInput,
    promptMethod,
}) {

    /**
     * Answer Schema
     * 
     * ```json
     * {
     *    id: '1',
     *    answer: 'Paris',
     *    grade: 1,
     *    completed: true,
     *    reason: 'Paris is the capital of France.'
     *    model: 'gpt-3',
     * }
     * ```
     * 
     * Flow:
     *   check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
     *   provide the answer to the question to the user
     *   record answer for this question in a ref.
     *   update the progress bar with the number of correct answers.
     *   silently record incorrect answers for review, but allow the user to continue and try to answer the question again.
     */

    const [answers, setAnswers] = useState({});
    const [feedback, setFeedback] = useState({});
    const [progress, setProgress] = useState(0);

    const [currentInputMethod, setCurrentInputMethod] = useState(allowedInput[0] || 'text');
    const [allowedInputMethods, setAllowedInputMethods] = useState(allowedInput || ['text', 'audio', 'writing']);
    const [currentPromptMethod, setCurrentPromptMethod] = useState(promptMethod[0] || 'text');

    const handleInputChange = (event, newInputMethod) => {
        // console.log('newInputMethods', newInputMethods)
        setCurrentInputMethod(newInputMethod);
    }

    React.useEffect(() => {
        if (allowedInput?.length > 0) {
            console.log('allowedInput', allowedInput)
            console.log('promptMethod', promptMethod)
            console.log('AnswerComponent.currentPromptMethod', currentPromptMethod)
            setAllowedInputMethods(allowedInput);
            setCurrentInputMethod(allowedInput[0]);
        }
    }, [JSON.stringify(allowedInput)])

    React.useEffect(() => {
        console.log('AnswerComponent.promptMethod', promptMethod)
        if (promptMethod?.length > 0) {
            setCurrentPromptMethod(promptMethod[0])
        }
    }, [JSON.stringify(promptMethod)])

    React.useEffect(() => {
        console.log('allowedInput', allowedInput)
        console.log('promptMethod', promptMethod)
        setAllowedInputMethods(allowedInput);
        setCurrentInputMethod(allowedInput[0]);
        setCurrentPromptMethod(promptMethod[0]);
        console.log('AnswerComponent.currentPromptMethod', promptMethod[0])

    }, []);

    const {
        dictionary
    } = React.useContext(UnitContext);

    console.log('AnswerComponent   ', wordIDs, dictionary)

    let thisPrompt = customPrompt ? customPrompt : 'Provide words that best match the following definition(s):'

    thisPrompt = requestDefinition ? 'Please define the following word(s):' : thisPrompt


    return (
        // a list of word inputs to prompt the user to answer the question, if the request definition is provided then the user is prompted to define the word in a short answer.

        <div className={className}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {thisPrompt}
                </Typography>
            </Box>

            {/**
             * Buttons to allow the user to select an input method, or have the input method(s) selected for them. Each set of words could be run with progressively more difficult input methods. Typing, writing, speaking, etc.
             */}

            <ToggleButtonGroup
                exclusive
                value={currentInputMethod}
                onChange={handleInputChange}
                aria-label="change input method"
            >
                <ToggleButton
                    disabled={!allowedInputMethods.includes('text')}
                    value="text"
                    aria-label="text entry"
                >
                    Text
                </ToggleButton>
                <ToggleButton
                    disabled={!allowedInputMethods.includes('audio')}
                    value="audio" aria-label="audio input">
                    Audio
                </ToggleButton>
                {/* <ToggleButton value="listening" aria-label="listening exercise">
        Listening
      </ToggleButton> */}
                <ToggleButton
                    disabled={!allowedInputMethods.includes('writing')}
                    value="writing" aria-label="writing and drawing input">
                    Writing
                </ToggleButton>
            </ToggleButtonGroup>

            {/**
             * Progress bar to show the user how many questions they have answered correctly
            */}
            <Box>
                <LinearProgressWithLabel value={progress} />
            </Box>
            {!requestDefinition &&
                ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod)
            }
            {requestDefinition &&
                ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod)
            }
        </div>
    );
}

function ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod) {

    console.log('ByWordList', wordIDs, feedback, answers);
    console.log('ByWordList.currentPromptMethod', currentPromptMethod);

    

    return <ol>
        {currentInputMethod === 'text' && wordIDs.map((wordId, key) => {
            const isCorrect = feedback[key]?.answer;

            console.log("currentInputMethod === 'text")

            console.log('audio', dictionary[wordId]?.audio);
            console.log('definitionAudio', dictionary[wordId]?.definitionAudio);
            

            let borderStyle = '1px solid #ccc'
            if (isCorrect === true) {
                borderStyle = '1px solid green'
            } else if (isCorrect === false) {
                borderStyle = '1px solid red'
            }


            return (<>
                <li
                    display='flex'
                    key={key}>
                    {/**
* Area for feedback from api call
*/}
                    <Typography variant="body2" component="div"
                    
                    style={{
                        flexBasis: '40%',
                        minWidth: 'fit-content',
                        textWrap: 'wrap',
                        wordBreak: 'normal',
                        color: isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black',
                        
                    }}
                    sx={{ flexGrow: 1 }}>
                        {feedback[key]?.reason || ''}
                    </Typography>

                    {currentPromptMethod === 'text' && 
                        <Typography variant="body1"
                        display="flex"
                        style={{
                            flexBasis: '40%',
                            minWidth: 'fit-content',
                            textWrap: 'wrap',
                            wordBreak: 'normal',
                            color: isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black',
                            
                        }}
                        color="textSecondary">{dictionary[wordId]?.phrase}</Typography>
                    }
                    {currentPromptMethod === 'audio' &&
                    <Suspense fallback={<div>Loading...</div>}>
                    <MediaPlayerComponent
                        words={
                            [dictionary[wordId]]
                        }
                        />
                    </Suspense>
                    }
                    <Box
                        display='flex'
                        style={{
                            marginBottom: '1rem',
                        }}
                    >

                    <TextareaAutosize
                        minRows={3}

                        style={{
                            flexBasis: '48%',
                            color: isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black',
                            border: borderStyle,
                            color: isCorrect === true? 'green' : isCorrect === false? 'red' : 'black',
                            flexBasis: '80%',
                            maxWidth: '50rem',
                        }}
                        id={`${dictionary[wordId]?.phrase}-${key}`}
                        value={answers[key] || ''}
                        onChange={(e) => {
                            setAnswers({
                                ...answers,
                                [key]: e.target.value,
                            });
                        } }
                        aria-label={`Answer text for question ${key}`}
                        placeholder="Answer text"
                        type="text"
                        variant="standard" />

                    {/**
* A button to submit the answer
*/}

                    <Button
                        variant="contained"
                        color="primary"

                        style={{
                            marginLeft: '1rem',
                            minWidth: 'fit-content',
                        }}

                        onClick={() => {
                            // verify definition
                            // verifyDefinition(word: String!, expected: String!, definition: String!, model: String): String @function(name: "openai-${env}")


                            const response = client.graphql({
                                query: verifyDefinition,
                                variables: {
                                    word: dictionary[wordId]?.phrase,
                                    expected: dictionary[wordId]?.definition,
                                    definition: answers[key],
                                    model: 'gpt-3.5-turbo',
                                },
                            });

                            console.log('response', response);

                            const mainData = JSON.parse(response?.data?.verifyDefinition) || {};

                            const data = JSON.parse(mainData?.choices[0]?.message?.content) || {};

                            console.log('response', response);



                            setFeedback({
                                ...feedback,
                                [key]: JSON.stringify(data) || {},
                            });
                            // const progress = (correctCount / questions.length) * 100;
                            // setProgress(progress);
                        } }
                    >
                        Submit
                    </Button>
                    </Box>
                </li>
            </>
            );
        })}

        {currentInputMethod === 'audio' && wordIDs.map((wordId, key) => {
            const isCorrect = feedback[key]?.answer;    

            return(<li
                display='flex'
                key={key}>
            <Typography
                color={isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black'}
            variant="body2" component="div" sx={{ flexGrow: 1 }}>
                {feedback[key]?.reason || ''}
            </Typography>
            {currentPromptMethod === 'text' &&
            <Typography
                color={isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black'} 
            variant="body1" component="div" sx={{ flexGrow: 1 }}>
                {dictionary[wordId]?.phrase}
            </Typography>
            }
            {currentPromptMethod === 'audio' &&
            <Suspense fallback={<div>Loading...</div>}>
            <MediaPlayerComponent
                // className={className}
                // format={this.__format}
                // nodeKey={this.getKey()}
                words={[dictionary[wordId]]}
                />
            </Suspense>
            }
            <RecordingStudio2
                item={dictionary[wordId]}
                word={dictionary[wordId]?.phrase}
                requestDefinition={true}
                feedback={feedback[key]}
                isCorrect={isCorrect}
                qk={key}
                setFeedback={(data) => {
                    setFeedback({
                        ...feedback,
                        [key]: data,
                    });
                }}
            />
            </li>)
        })}

        {/* sketchPad for drawing */}
        {currentInputMethod === 'writing' && wordIDs.map((wordId, key) => {
            const isCorrect = feedback[wordId]?.answer;

            console.log('currentPromptMethod', currentPromptMethod)
            console.log('dictionary[wordId]?.phrase', dictionary[wordId]?.phrase);
            console.log('feedback[wordId]', feedback);
            return (<li key={key} sx={{ flexGrow: 1 }}>
                <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    {dictionary[wordId]?.phrase}
                </Typography>

                {isCorrect === true && <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    Correct! "{feedback[wordId]?.reason || ''}"
                </Typography>
                }
                {isCorrect === false && <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    Incorrect! "{feedback[wordId]?.reason || ''}"
                </Typography>
                }


                
                <SketchPad
                    expect={dictionary[wordId]?.definition}
                    excalidrawData={{}} // pass graded data here
                      setFeedback={(data) => {
                        setFeedback({
                            ...feedback,
                            [wordId]: data,
                        });
                    }}
                    feedback={feedback}
                    questionID={key}
                    // excalidrawData={dictionary[wordId]}
                />
            </li>)
        }
        )}
    </ol>;
}

function ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod) {
    return <ol>
        {currentInputMethod === 'text' && wordIDs.map((wordId, key) => {
            console.log('currentPromptMethod', currentPromptMethod)
            console.log('dictionary[wordId]?.phrase', dictionary[wordId]?.phrase);

            let borderStyle = '1px solid #ccc';
            if (feedback[key]?.answer === true) {
                borderStyle = '1px solid green';
            } else if (feedback[key]?.answer === false) {
                borderStyle = '1px solid red';
            }

            return (
                <li key={key} sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                        {JSON.stringify(feedback[key]?.reason) || ''}
                    </Typography>
                    {currentPromptMethod === 'text' &&                    
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                        {dictionary[wordId]?.definition}
                    </Typography>
                     }

                    {currentPromptMethod === 'audio' &&
                    <Suspense fallback={<div>Loading...</div>}>
                    <MediaPlayerComponent
                        // className={className}
                        // format={this.__format}
                        // nodeKey={this.getKey()}
                        words={
                            [dictionary[wordId]]
                        }
                        requestDefinition={true}
                        />
                    </Suspense>
                    }
                    {/**
                 * Area for feedback from api call
                 */}

                <Input
                    onChange={(e) => {
                        setAnswers({
                            ...answers,
                            [key]: e.target.value,
                        });
                    } }
                    style={{
                        border: borderStyle,
                        color: feedback[key]?.answer === true ? 'green' : feedback[key]?.answer === false ? 'red' : 'black',
                    }}
                    value={answers[key] || ''}
                    placeholder={'Enter answer here'} />
                <Button
                    variant="contained"
                    color="primary"

                    style={{
                        marginLeft: '1rem',
                        minWidth: 'fit-content',
                    }}

                    onClick={async () => {
                        // verify word 
                        //   verifyWord(word: String!, expected: String!, definition: String!, model: String): String @function(name: "openai-${env}")
                        // "{"id":"chatcmpl-9PctoIeFEcMWLkBVRUWkbc2M0TLQM","object":"chat.completion","created":1715894756,"model":"gpt-3.5-turbo-0125","choices":[{"index":0,"message":{"role":"assistant","content":"{\"answer\": false, \"reason\": \"because the definition is this instead\"}"},"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":107,"completion_tokens":16,"total_tokens":123},"system_fingerprint":null}"
                        const response = await client.graphql({
                            query: verifyWord,
                            variables: {
                                word: answers[key],
                                expected: dictionary[wordId]?.phrase,
                                definition: dictionary[wordId]?.definition,
                                model: 'gpt-3.5-turbo',
                            },
                        });

                        const mainData = JSON.parse(response?.data?.verifyWord) || {};

                        const data = JSON.parse(mainData?.choices[0]?.message?.content) || {};

                        console.log('response', response);

                        setFeedback({
                            ...feedback,
                            [key]: data,
                        });

                        // if the answer is correct
                        // grade the answer
                        // update the progress bar
                        // save in chat history
                    } }
                >
                    Submit
                </Button>
                </li>
            );

        })}

        {currentInputMethod === 'audio' && wordIDs.map((wordId, key) => {
            return (<li key={key} sx={{ flexGrow: 1 }}>
                <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    {dictionary[wordId]?.definition}
                </Typography>
                <RecordingStudio2
                    item={dictionary[wordId]}
                    word={dictionary[wordId]?.definition}
                    requestDefinition={true}
                    feedback={feedback[key]}
                    qk={key}
                    setFeedback={(data) => {
                        setFeedback({
                            ...feedback,
                            [key]: data,
                        });
                    }}
                />
            </li>)
        })}

        {currentInputMethod === 'writing' && wordIDs.map((wordId, key) => {
            return (<li key={key} sx={{ flexGrow: 1 }}>
                <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    {dictionary[wordId]?.phrase}
                </Typography>
                <SketchPad
                    expect={dictionary[wordId]?.definition}
                    excalidrawData={{}}
                    requestDefinition={true}
                    setFeedback={(data) => {
                        setFeedback({
                            ...feedback,
                            [key]: data,
                        });
                    }}
                    feedback={feedback}
                    questionID={key}
                    // excalidrawData={dictionary[wordId]}
                />
            </li>)
        }
        )}
    </ol>;
}
