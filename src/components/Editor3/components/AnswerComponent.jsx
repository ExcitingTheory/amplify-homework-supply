// check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
// provide the answer to the question to the user
// record answer for this question in a ref.
// update the progress bar with the number of correct answers.
// silently record incorrect answers for review, but allow the user to continue and try to answer the question again.

import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'next-i18next';
import { getAmplifyClient } from '../../../utils/amplifyClient';

import { useEffect, useState, useRef } from 'react';

import TextareaAutosize from '@mui/material/TextareaAutosize';

import {
    Box,
    Input,
    LinearProgress,
    Typography,
    Button,
} from '@mui/material';

import Chip from '@mui/material/Chip';

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
  const { t } = useTranslation('workbook');
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
    const { t } = useTranslation('workbook');

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

    const currentInputMethod = allowedInput?.[0] || 'text';
    const [currentPromptMethod, setCurrentPromptMethod] = useState(promptMethod?.[0] || 'text');

    React.useEffect(() => {
        if (promptMethod?.length > 0) {
            setCurrentPromptMethod(promptMethod[0])
        }
    }, [JSON.stringify(promptMethod)]);

    const {
        dictionary,
        grade,
        saveGrade
    } = React.useContext(UnitContext);

    // Reset local state when grade changes (e.g., new grade after unit completion)
    const gradeIdRef = useRef(grade?.id);
    React.useEffect(() => {
        if (grade?.id && grade.id !== gradeIdRef.current) {
            gradeIdRef.current = grade.id;
            // Only reset if the new grade has no data for this exercise
            if (!grade?.data?.[nodeKey]) {
                setAnswers({});
                setFeedback({});
                setProgress(0);
            }
        }
    }, [grade?.id, grade?.data, nodeKey]);

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

            <Chip
                label={t(`answerComponent.inputMethods.${currentInputMethod}`)}
                variant="outlined"
                size="small"
                sx={{ my: 1 }}
            />

            {/**
             * Progress bar to show the user how many questions they have answered correctly
            */}
            <Box>
                <LinearProgressWithLabel value={progress} />
            </Box>
            {!requestDefinition &&
                ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey, t)
            }
            {requestDefinition &&
                ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey, t, saveGrade)
            }
        </div>
    );
}

function ByWordList(wordIDs, feedback, dictionary, answers, setAnswers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey, t, saveGrade) {

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
                        data-testid="answer-input"
                        data-word-id={wordId}
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
                        data-testid="answer-submit-button"
                        data-word-id={wordId}
                        style={{
                            marginLeft: '1rem',
                            minWidth: 'fit-content',
                        }}

onClick={async () => {
                        // verify definition
                        // verifyDefinition(word: String!, expected: String!, definition: String!, model: String): String @function(name: "openai-${env}")
                            const client = getAmplifyClient();

                            const response = await client.queries.verifyDefinition({
                                word: dictionary[wordId]?.phrase,
                                expected: dictionary[wordId]?.definition,
                                definition: answers[key],
                                model: 'gpt-3.5-turbo',
                            });

                            console.log('response', response);

                            const data = JSON.parse(response?.data) || {};

                            console.log('verifyDefinition parsed data', data);



                            setFeedback({
                                ...feedback,
                                [key]: data,
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
                onRecordingComplete={async (audioFile, uploadResult) => {
                    const currentGradeData = grade?.data || {};
                    const audioNodeKey = `${nodeKey}-${wordId}`;
                    const updatedGradeData = {
                        ...currentGradeData,
                        [audioNodeKey]: {
                            ...currentGradeData[audioNodeKey],
                            audioFilePath: audioFile?.path || null,
                            audioFileId: audioFile?.id || null,
                            inputMethod: 'audio',
                        }
                    };
                    saveGrade(updatedGradeData);

                    // Verify the recorded audio against expected word
                    try {
                        const client = getAmplifyClient();
                        const audioUrl = audioFile?.path || uploadResult?.path;
                        if (audioUrl) {
                            const { data, errors } = await client.queries.verifyAudioUrl({
                                expected: dictionary[wordId]?.phrase,
                                audioUrl,
                                model: 'whisper-1',
                                chatModel: 'gpt-3.5-turbo',
                            });
                            if (!errors && data) {
                                const feedbackData = JSON.parse(data);
                                setFeedback(prev => ({ ...prev, [key]: feedbackData }));
                            }
                        }
                    } catch (err) {
                        console.error('[AnswerComponent] Audio verification error:', err);
                    }
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

function ByDefinitionWordList(wordIDs, dictionary, feedback, setAnswers, answers, setFeedback, currentInputMethod, currentPromptMethod, grade, nodeKey, t) {
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
                        const client = getAmplifyClient();
                        const response = await client.queries.verifyWord({
                            word: answers[key],
                            expected: dictionary[wordId]?.phrase,
                            definition: dictionary[wordId]?.definition,
                            model: 'gpt-3.5-turbo',
                        });

                        const data = JSON.parse(response?.data) || {};

                        console.log('verifyWord parsed data', data);

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
