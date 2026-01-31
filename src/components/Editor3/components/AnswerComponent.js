// check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
// provide the answer to the question to the user
// record answer for this question in a ref.
// update the progress bar with the number of correct answers.
// silently record incorrect answers for review, but allow the user to continue and try to answer the question again.

import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'next-i18next';
import {
    verifyWord,
    verifyDefinition,
} from "../../../graphql/queries";
import { generateClient } from 'aws-amplify/api';

import { useEffect, useState, useRef } from 'react';

import TextareaAutosize from '@mui/material/TextareaAutosize';

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

import dynamic from "next/dynamic";

const SketchPad = dynamic(
  async () => (await import("./SketchPad")).default,
  {
    ssr: false,
  },
);

import AudioWaveformPlayer from './AudioWaveformPlayer';
import getCachedUrl from '../../../utils/getCachedUrl';
import { RecordingStudio2 } from '../../RecordingStudio2';

// Component to handle signed URL for word audio
function SignedAudioPlayer({ audioKey, identityId, waveformData, width, height, title }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const signUrl = async () => {
      if (audioKey) {
        try {
          const url = await getCachedUrl(audioKey, 'protected', identityId);
          setSignedUrl(url);
        } catch (error) {
          console.error('Error signing audio URL:', error);
        }
      }
      setLoading(false);
    };
    signUrl();
  }, [audioKey, identityId]);

  if (loading) {
    return <Typography variant="body2" sx={{ opacity: 0.6 }}>Loading audio...</Typography>;
  }

  if (!signedUrl) {
    return <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: 'italic' }}>{t('answerComponent.audioNotAvailable')}</Typography>;
  }

  return (
    <AudioWaveformPlayer
      audioUrl={signedUrl}
      waveformData={waveformData}
      width={width}
      height={height}
      title={title}
    />
  );
}


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
    const { t } = useTranslation('editor');

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
        dictionary,
        grade,
        saveGrade
    } = React.useContext(UnitContext);

    console.log('AnswerComponent   ', wordIDs, dictionary)

    let thisPrompt = customPrompt ? customPrompt : 'Provide words that best match the following definition(s):'

    thisPrompt = requestDefinition ? 'Please define the following word(s):' : thisPrompt

    // Track completion and save grade
    React.useEffect(() => {
        if (!wordIDs || !feedback || !saveGrade || !nodeKey) return;

        // Check if all words have been answered correctly
        const answeredWords = Object.keys(feedback);
        const correctAnswers = answeredWords.filter(wordId => feedback[wordId]?.answer === true);
        const incorrectAnswers = answeredWords.filter(wordId => feedback[wordId]?.answer === false);
        
        const totalWords = wordIDs.length;
        const answeredCount = answeredWords.length;
        const correctCount = correctAnswers.length;
        
        // Consider complete if all words have been attempted
        const isComplete = answeredCount >= totalWords;
        const accuracy = totalWords > 0 ? Math.floor((correctCount / totalWords) * 100) : 0;

        if (isComplete) {
            // Update grade data
            const currentGradeData = grade?.data || {};
            const updatedGradeData = {
                ...currentGradeData,
                [nodeKey]: {
                    complete: true,
                    accuracy,
                    totalWords,
                    correctCount,
                    answeredCount,
                    feedback: feedback
                }
            };
            
            saveGrade(updatedGradeData);
        }
    }, [feedback, wordIDs, saveGrade, nodeKey, grade]);


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
                    {t('answerComponent.inputMethods.text')}
                </ToggleButton>
                <ToggleButton
                    disabled={!allowedInputMethods.includes('audio')}
                    value="audio" aria-label="audio input">
                    {t('answerComponent.inputMethods.audio')}
                </ToggleButton>
                {/* <ToggleButton value="listening" aria-label="listening exercise">
        Listening
      </ToggleButton> */}
                <ToggleButton
                    disabled={!allowedInputMethods.includes('writing')}
                    value="writing" aria-label="writing and drawing input">
                    {t('answerComponent.inputMethods.writing')}
                </ToggleButton>
            </ToggleButtonGroup>

            {/**
             * Progress bar to show the user how many questions they have answered correctly
            */}
            <Box>
                <LinearProgressWithLabel value={progress} />
            </Box>
            {!requestDefinition &&
                ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey)
            }
            {requestDefinition &&
                ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey)
            }
        </div>
    );
}

function ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey) {

    console.log('ByWordList', wordIDs, feedback, answers);
    console.log('ByWordList.currentPromptMethod', currentPromptMethod);
    console.log('ByWordList.dictionary keys:', dictionary ? Object.keys(dictionary) : 'dictionary is null/undefined');
    console.log('ByWordList.dictionary:', dictionary);

    // Add defensive check for dictionary
    if (!dictionary) {
        return <Typography variant="body2" color="error">{t('answerComponent.noDictionaryAvailable')}</Typography>;
    }

    return <ol>
        {currentInputMethod === 'text' && wordIDs.map((wordId, key) => {
            const isCorrect = feedback[key]?.answer;

            console.log(`currentInputMethod === 'text' for wordId: ${wordId}`);
            console.log(`dictionary[${wordId}]:`, dictionary[wordId]);
            console.log('audio', dictionary[wordId]?.audio);
            console.log('definitionAudio', dictionary[wordId]?.definitionAudio);
            console.log('phrase:', dictionary[wordId]?.phrase);
            
            // Skip if word not in dictionary
            if (!dictionary[wordId]) {
                console.warn(`Word ${wordId} not found in dictionary`);
                return null;
            }

            let borderStyle = '1px solid #ccc'
            if (isCorrect === true) {
                borderStyle = '1px solid green'
            } else if (isCorrect === false) {
                borderStyle = '1px solid red'
            }


            return (<React.Fragment key={`${wordId}-${key}`}>
                <li
                    display='flex'>
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
                    {currentPromptMethod === 'audio' && (
                        dictionary[wordId]?.audio ? (
                            <SignedAudioPlayer
                                audioKey={dictionary[wordId].audio[0]}
                                identityId={dictionary[wordId].identityId}
                                waveformData={dictionary[wordId].waveformData ? JSON.parse(dictionary[wordId].waveformData) : undefined}
                                width={400}
                                height={60}
                                title={dictionary[wordId].phrase}
                            />
                        ) : (
                            <Typography variant="body1"
                            display="flex"
                            style={{
                                flexBasis: '40%',
                                minWidth: 'fit-content',
                                textWrap: 'wrap',
                                wordBreak: 'normal',
                                fontStyle: 'italic',
                                color: 'gray',
                            }}>
                                {dictionary[wordId]?.phrase} {t('answerComponent.audioNotAvailableParens')}
                            </Typography>
                        )
                    )}
                    <Box
                        display='flex'
                        style={{
                            marginBottom: '1rem',
                        }}
                    >

                    <TextareaAutosize
                        minRows={3}

                        style={{
                            flexBasis: '80%',
                            maxWidth: '50rem',
                            color: isCorrect === true ? 'green' : isCorrect === false ? 'red' : 'black',
                            border: borderStyle,
                            borderRadius: '12px',
                            padding: '16px',
                            fontSize: '16px',
                            lineHeight: '1.5',
                            fontFamily: 'inherit',
                            resize: 'vertical',
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
                        {t('answerComponent.submit')}
                    </Button>
                    </Box>
                </li>
            </React.Fragment>
            );
        })}

        {currentInputMethod === 'audio' && wordIDs.map((wordId, key) => {
            const isCorrect = feedback[key]?.answer;    

            // Skip if word not in dictionary
            if (!dictionary[wordId]) {
                console.warn(`Word ${wordId} not found in dictionary`);
                return null;
            }

            return(<li
                display='flex'
                key={`${wordId}-${key}`}>
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
            {currentPromptMethod === 'audio' && (
                dictionary[wordId]?.audio ? (
                    <SignedAudioPlayer
                        audioKey={dictionary[wordId].audio[0]}
                        identityId={dictionary[wordId].identityId}
                        waveformData={dictionary[wordId].waveformData ? JSON.parse(dictionary[wordId].waveformData) : undefined}
                        width={400}
                        height={60}
                        title={dictionary[wordId].phrase}
                    />
                ) : (
                    <Typography
                        variant="body1"
                        component="div"
                        sx={{ flexGrow: 1, fontStyle: 'italic', color: 'gray' }}>
                        {t('answerComponent.audioNotAvailable', { text: dictionary[wordId]?.phrase })}
                    </Typography>
                )
            )}
            <AudioWaveformPlayer
                enableRecording={true}
                gradeId={grade?.id}
                nodeKey={`${nodeKey}-${wordId}`}
                title={dictionary[wordId]?.phrase}
                onRecordingComplete={(audioFile, waveformData) => {
                    // Handle recording completion
                    console.log('Recording complete:', audioFile, waveformData);
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
            return (<li key={`${wordId}-${key}`} sx={{ flexGrow: 1 }}>
                {/* Display prompt based on currentPromptMethod */}
                {currentPromptMethod === 'text' && 
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                        {dictionary[wordId]?.phrase}
                    </Typography>
                }
                
                {currentPromptMethod === 'audio' && (
                    dictionary[wordId]?.audio ? (
                        <SignedAudioPlayer
                            audioKey={dictionary[wordId].audio[0]}
                            identityId={dictionary[wordId].identityId}
                            waveformData={dictionary[wordId].waveformData ? JSON.parse(dictionary[wordId].waveformData) : undefined}
                            width={400}
                            height={60}
                            title={dictionary[wordId].phrase}
                        />
                    ) : (
                        <Typography variant="body2" component="div" sx={{ flexGrow: 1, fontStyle: 'italic', color: 'gray' }}>
                            {t('answerComponent.audioNotAvailable', { text: dictionary[wordId]?.phrase })}
                        </Typography>
                    )
                )}

                {isCorrect === true && <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    {t('answerComponent.feedback.correct')} "{feedback[wordId]?.reason || ''}"
                </Typography>
                }
                {isCorrect === false && <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                    {t('answerComponent.feedback.incorrect')} "{feedback[wordId]?.reason || ''}"
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

function ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey) {
    // Add defensive check for dictionary
    if (!dictionary) {
        return <Typography variant="body2" color="error">{t('answerComponent.noDictionaryAvailable')}</Typography>;
    }

    return <ol>
        {currentInputMethod === 'text' && wordIDs.map((wordId, key) => {
            console.log('currentPromptMethod', currentPromptMethod)
            console.log('dictionary[wordId]?.phrase', dictionary[wordId]?.phrase);

            // Skip if word not in dictionary
            if (!dictionary[wordId]) {
                console.warn(`Word ${wordId} not found in dictionary`);
                return null;
            }

            let borderStyle = '1px solid #ccc';
            if (feedback[key]?.answer === true) {
                borderStyle = '1px solid green';
            } else if (feedback[key]?.answer === false) {
                borderStyle = '1px solid red';
            }

            return (
                <li key={`${wordId}-${key}`} sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" component="div" sx={{ flexGrow: 1 }}>
                        {JSON.stringify(feedback[key]) || ''}
                    </Typography>
                    {currentPromptMethod === 'text' &&                    
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                        {dictionary[wordId]?.definition}
                    </Typography>
                     }

                    {currentPromptMethod === 'audio' && (
                        dictionary[wordId]?.definitionAudio ? (
                            <SignedAudioPlayer
                                audioKey={dictionary[wordId].definitionAudio[0]}
                                identityId={dictionary[wordId].identityId}
                                waveformData={dictionary[wordId].definitionWaveformData ? JSON.parse(dictionary[wordId].definitionWaveformData) : undefined}
                                width={400}
                                height={60}
                                title={dictionary[wordId].definition}
                            />
                        ) : (
                            <Typography variant="body2" component="div" sx={{ flexGrow: 1, fontStyle: 'italic', color: 'gray' }}>
                                {t('answerComponent.audioNotAvailable', { text: dictionary[wordId]?.definition })}
                            </Typography>
                        )
                    )}
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
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        color: feedback[key]?.answer === true ? 'green' : feedback[key]?.answer === false ? 'red' : 'black',
                    }}
                    disableUnderline
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
                    {t('answerComponent.submit')}
                </Button>
                </li>
            );

        })}

        {currentInputMethod === 'audio' && wordIDs.map((wordId, key) => {
            return (<li key={`${wordId}-${key}`} sx={{ flexGrow: 1 }}>

<Typography variant="body2" component="div" sx={{ flexGrow: 1, 
                    // red if incorrect, green if correct
                    color: feedback[wordId]?.answer === true ? 'green' : feedback[wordId]?.answer === false ? 'red' : 'black', }}>
                    {
                        feedback[wordId]?.answer === true ? t('answerComponent.feedback.correct') + ' ' : feedback[wordId]?.answer === false ? t('answerComponent.feedback.incorrect') + ' ' : ''
                    }
                    {JSON.stringify(feedback[wordId]?.reason) || ''}
                </Typography>
                
                {/* Display prompt based on currentPromptMethod */}
                {currentPromptMethod === 'text' && 
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                        {dictionary[wordId]?.definition}
                    </Typography>
                }
                
                {currentPromptMethod === 'audio' && (
                    dictionary[wordId]?.definitionAudio ? (
                        <SignedAudioPlayer
                            audioKey={dictionary[wordId].definitionAudio[0]}
                            identityId={dictionary[wordId].identityId}
                            waveformData={dictionary[wordId].definitionWaveformData ? JSON.parse(dictionary[wordId].definitionWaveformData) : undefined}
                            width={400}
                            height={60}
                            title={dictionary[wordId].definition}
                        />
                    ) : (
                        <Typography variant="body2" component="div" sx={{ flexGrow: 1, fontStyle: 'italic', color: 'gray' }}>
                            {t('answerComponent.audioNotAvailable', { text: dictionary[wordId]?.definition })}
                        </Typography>
                    )
                )}

                <RecordingStudio2
                    item={dictionary[wordId]}
                    word={dictionary[wordId]?.definition}
                    requestDefinition={true}
                    feedback={feedback}
                    qk={wordId}
                    setFeedback={(data) => {
                        setFeedback({
                            ...feedback,
                            [wordId]: data,
                        });
                    }}
                />
                
            </li>)
        })}

        {currentInputMethod === 'writing' && wordIDs.map((wordId, key) => {
            // Skip if word not in dictionary
            if (!dictionary[wordId]) {
                console.warn(`Word ${wordId} not found in dictionary`);
                return null;
            }

            return (<li key={`${wordId}-${key}`} sx={{ flexGrow: 1 }}>
                {/* Display prompt based on currentPromptMethod */}
                {currentPromptMethod === 'text' && 
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
                        {dictionary[wordId]?.definition}
                    </Typography>
                }
                
                {currentPromptMethod === 'audio' && (
                    dictionary[wordId]?.definitionAudio ? (
                        <SignedAudioPlayer
                            audioKey={dictionary[wordId].definitionAudio[0]}
                            identityId={dictionary[wordId].identityId}
                            waveformData={dictionary[wordId].definitionWaveformData ? JSON.parse(dictionary[wordId].definitionWaveformData) : undefined}
                            width={400}
                            height={60}
                            title={dictionary[wordId].definition}
                        />
                    ) : (
                        <Typography variant="body2" component="div" sx={{ flexGrow: 1, fontStyle: 'italic', color: 'gray' }}>
                            {t('answerComponent.audioNotAvailable', { text: dictionary[wordId]?.definition })}
                        </Typography>
                    )
                )}
                
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
