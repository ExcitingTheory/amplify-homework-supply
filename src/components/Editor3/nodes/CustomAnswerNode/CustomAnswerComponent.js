import React, { lazy, Suspense } from 'react';
import {
    verifyShortAnswer,
} from "../../../../graphql/queries";
import { generateClient } from 'aws-amplify/api';

import { useEffect, useState, useRef } from 'react';

import { TextareaAutosize } from '@mui/base/TextareaAutosize';

import {
    Box,
    LinearProgress,
    Typography,
    Button,
    ToggleButton,
    ToggleButtonGroup

} from '@mui/material';
import dynamic from "next/dynamic";

const SketchPad = dynamic(
  async () => (await import("../../components/SketchPad")).default,
  {
    ssr: false,
  },
);
const MediaPlayerComponent = lazy(() => import('../.../../../components/MediaPlayerComponent'));
import { RecordingStudio2 } from '../../../RecordingStudio2';
import UnitContext from '../../../../context/unitContext';
import DictionaryContext from '../../../../context/dictionaryContext';
const client = generateClient();

function LinearProgressWithLabel({ value }) {
    return (
        <>
            <Box display="flex" alignItems="center" margin={1}>
                <Box width="95%">
                    <LinearProgress variant="determinate" value={value} />
                </Box>
                <Box width='fit-content' marginLeft={1}>
                    <Typography variant="body2" color="textSecondary">{`${Math.round(
                        value,
                    )}%`}</Typography>
                </Box>
            </Box>
        </>
    );
}

export default function CustomAnswerComponent({
    className,
    // questions,
    ids: questionIDs,
    requestDefinition=false,
    customPrompt,
    allowedInput = [],
    promptMethod = [],
}) {
    const [answers, setAnswers] = useState({});
    const [progress, setProgress] = useState(0);
    const [feedback, setFeedback] = useState({});

    const [currentInputMethod, setCurrentInputMethod] = useState(allowedInput[0] || 'text');
    const [allowedInputMethods, setAllowedInputMethods] = useState(allowedInput || ['text', 'audio', 'writing']);
    const [currentPromptMethod, setCurrentPromptMethod] = useState(promptMethod[0] || 'text');

    const { grade } = React.useContext(UnitContext);
    const {
        questionBank,
    } = React.useContext(DictionaryContext);

    const gradeId = grade?.id;

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

    return (
        // a list of questions having a prompt and an expected answer in a collection
        <div className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                // alignItems: 'center',
                marginBottom: '6rem',

            }}
        >
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Answer the following questions:
                </Typography>

            </Box>

            <ToggleButtonGroup
                exclusive
                value={currentInputMethod}
                onChange={handleInputChange}
                aria-label="change input method"
            >
                {allowedInputMethods.length > 0 &&
                <>
                
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
                </>
}
            </ToggleButtonGroup>


            <Box>
                <LinearProgressWithLabel value={0} />
            </Box>

            
            <ol>
            
            {questionIDs &&
            questionIDs.map((questionID) => {

                    const question = questionBank[questionID] || {};
                    console.log('CustomAnswerComponent.question', question)

                    let borderStyle = '1px solid #ccc'
                    if (feedback[questionID]?.answer === true) {
                        console.log('feedback[questionID]', feedback[questionID])
                        borderStyle = '1px solid green'
                    } else if (feedback[questionID]?.answer === false) {
                        console.log('feedback[questionID]', feedback[questionID])
                        borderStyle = '1px solid red'
                    }


                    const { prompt, answer } = question;
                    console.log('CustomAnswerComponent.prompt', prompt)
                    return (
                        <li
                            display='flex'
                            key={questionID}>
                            {/**
                             * Area for feedback from api call
                             */}

                            <Typography variant="body2"
                                style={{
                                    color: feedback[questionID]?.answer === true? 'green' : feedback[questionID]?.answer === false? 'red' : 'black',
                                }}
                            component="div" sx={{ flexGrow: 1 }}>
                                {feedback[questionID]?.reason || ''}
                            </Typography>

                            { currentPromptMethod === 'text' && 
                            <Typography variant="body1"
                                display="flex"
                                style={{
                                    // flexBasis: '40%',
                                    // minWidth: 'fit-content',
                                    textWrap: 'wrap',
                                    wordBreak: 'normal',
                                }}
                                color="textSecondary">{prompt}</Typography>

                            }
                                
                            { currentPromptMethod === 'audio' &&
                            <Suspense fallback={<div>{`Loading... questionID: ${questionID}`}</div>}>
                            <MediaPlayerComponent
                                questionIDs={[questionID]}
                                
                                />
                            </Suspense>
                            }

                            { currentInputMethod === 'text' &&
                            <Box
                                display='flex'
                                style={{
                                    marginBottom: '1rem',
                                }}
                            >

                            <TextareaAutosize
                                minRows={3}

                                style={{
                                    border: borderStyle,
                                    color: feedback[questionID]?.answer === true? 'green' : feedback[questionID]?.answer === false? 'red' : 'black',
                                    flexBasis: '80%',
                                    maxWidth: '50rem',
                                }}
                                id={`${answer}-${questionID}`}
                                value={answers[questionID] || ''}
                                onChange={(e) => {
                                    setAnswers({
                                        ...answers,
                                        [questionID]: e.target.value,
                                    });
                                }}

                                aria-label={`Answer text for question ${questionID}`}
                                placeholder="Answer text"
                                type="text"
                                variant="standard"
                            />
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

                                onClick={async () => {
                                    // call the api to verify the answer
                                    try {

                                        // verifyShortAnswer(expected: String!, answer: String!, prompt: String!, model: String): String @function(name: "openai-${env}")

                                        const response = await client.graphql({
                                            query: verifyShortAnswer,
                                            variables: {
                                                answer: answers[questionID],
                                                prompt: prompt,
                                                expected: answer,
                                                model: 'gpt-3.5-turbo',
                                            },
                                        });

                                        console.log('response', response)

                                        const mainData = JSON.parse(response?.data?.verifyShortAnswer) || {}

                                        const data = JSON.parse(mainData?.choices[0]?.message?.content) || {}
                                       
                                        setFeedback({
                                            ...feedback,
                                            [questionID]: data,
                                        });
                                    } catch (error) {
                                        console.error(error);
                                        setFeedback({
                                            ...feedback,
                                            [questionID]: 'Error occurred',
                                        });
                                    }



                                }}
                            >
                                Submit
                            </Button>
                            
                            </Box>
                            }
                            { currentInputMethod === 'audio' &&
                            <Box
                                display='flex'
                                style={{
                                    marginBottom: '1rem',
                                }}
                            >
                                <RecordingStudio2
                                    className={className}
                                    requestDefinition={requestDefinition}
                                    word={prompt}
                                    item={{
                                        id: gradeId,
                                        phrase: requestDefinition? prompt : answer,
                                        definition: requestDefinition? answer : prompt,
                                    }}
                                    questionID={questionID}
                                    setFeedback={setFeedback}
                                    feedback={feedback}
                                />
                            </Box>
                            }
                            { currentInputMethod === 'writing' &&
                            <Box
                                display='flex'
                                style={{
                                    marginBottom: '1rem',
                                }}
                            >
                                <Suspense fallback={<div>Loading...</div>}>
                                <SketchPad

// expect={dictionary[wordId]?.definition}
// excalidrawData={{}} // pass graded data here
//   setFeedback={(data) => {
//     setFeedback({
//         ...feedback,
//         [wordId]: data,
//     });
// }}
// feedback={feedback}
// questionID={key}
                                    excalidrawData={{}} // pass graded data here
                                    className={className}
                                    expect={answer}
                                    questionID={questionID}
                                    setFeedback={(data) => {
                                        setFeedback({
                                            ...feedback,
                                            [questionID]: data,
                                        });
                                    }}
                                    feedback={feedback}
                                    question={prompt}
                                />

                                </Suspense>
                            </Box>
                            }
                        </li>
                    );
                })
            }
            </ol>

        </div>
    );
}
