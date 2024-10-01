import * as React from 'react';

import { DataGrid } from '@mui/x-data-grid';

import {
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';


import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $setSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';

import DictionaryContext from '../../../../context/dictionaryContext';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Question, QuestionFile, QuestionUnit, UnitWord, Word } from '../../../../models';
import UnitContext from '../../../../context/unitContext';

import { DataStore } from 'aws-amplify/datastore';
import { $isCustomAnswerNode } from '../../plugins/CustomAnswerPlugin';

import { PromptMethodSelector, AllowedInputSelector } from '../../components/PromptMethodSelector';
import { generateAudioFile } from '../../../../graphql/mutations';
import { fetchAuthSession } from 'aws-amplify/auth';

import { generateClient } from 'aws-amplify/api';

import getCachedUrl from '../../../../utils/getCachedUrl';
import { Remove } from '@mui/icons-material';

const filter = createFilterOptions();

const client = generateClient();


const columns = [
    { field: 'prompt', headerName: 'Prompt', flex: 1, minWidth: 100 },
    {
        field: 'answer',
        headerName: 'Answer',
        flex: 1, minWidth: 200
    },
    // {
    //     field: 'actions',
    //     headerName: 'Actions',
    //     sortable: false,
    //     flex: 1,
    //     minWidth: 100,
    //     renderCell: (params) => {
    //         return (
    //             <ActionsMenu
    //                 ids={[params.row.id]}
    //                 removeQuestionIDs={removeQuestionIDs}
    //             />
    //         );
    //     },
    // },
    {
        field: 'id',
        headerName: 'ID',
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'promptAudio',
        headerName: 'Prompt Audio',
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'answerAudio',
        headerName: 'Answer Audio',
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'hint',
        headerName: 'Hint',
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
];

export default function CustomAnswerEditor({
    className,
    format,
    nodeKey,
    ids: questionIDs,
    promptMethod,
    allowedInput,
}) {
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);
    // const [rows, setRows] = React.useState([]);
    const [selection, setSelection] = React.useState(null);
    const [gridSelection, setGridSelection] = React.useState([]);
    const [dialogValue, setDialogValue] = React.useState({
        prompt: '',
        answer: '',
        hint: '',
        promptAudio: [],
        answerAudio: [],
    });



    const [questions, setQuestions] = React.useState({
        items: [],
        map: {},
        isLoading: false,
        error: null,
    });

    const [working, setWorking] = React.useState(false);
    const [previewMessage, setPreviewMessage] = React.useState('');

    const canvasRef = React.useRef(null);
    const audioRef = React.useRef(null);
    const [audioSrc, setAudioSrc] = React.useState('');
    const [presignedUrl, setPresignedUrl] = React.useState('');

    const doNothing = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const _r = Math.floor(Math.random() * 255);
    const _g = Math.floor(Math.random() * 255);
    const _b = Math.floor(Math.random() * 255);

    const audioContextRef = React.useRef(null);
    const sourceRef = React.useRef(null);
    const analyserRef = React.useRef(null);

    const {
        questionBank,
    } = React.useContext(DictionaryContext);

    const {
        unit,
    } = React.useContext(UnitContext);

    const rows = []

    console.log('questionIDs', questionIDs);
    console.log('questionBank', questionBank);

    if(questionIDs) {
        questionIDs.forEach((id) => {
            console.log('id', id);
            const _q = questionBank[id];
            console.log('_q', _q);
            if (_q) {
                rows.push({
                    id: _q.id,
                    prompt: _q.prompt,
                    answer: _q.answer,
                    hint: _q.hint,
                    promptAudio: _q.audio,
                    answerAudio: _q.answerAudio,
                });
            }
        });
    
    }

    const fetch = () => {
        setQuestions({ ...questions, isLoading: true, });
        const subscription = DataStore.observe(Question).subscribe(msg => {
            console.log(msg.model, msg.opType, msg.element);
            const _questions = msg.element
            console.log('items', msg.element);
            setResult({ isLoading: false, items: msg.element });
            const _rows = [];
            if (_questions.length > 0) {
                console.log('questions', _questions);
                _questions.forEach((question) => {
                    const { prompt, answer, hint, id } = question;
                    const promptAudio = question?.promptAudio?.[0];
                    const answerAudio = question?.answerAudio?.[0];
                    _rows.push({
                        id,
                        prompt,
                        answer,
                        hint,
                        promptAudio,
                        answerAudio,
                    });
                });
            }
            console.log('rows', _rows);
            setRows(_rows);
          });
          // Call unsubscribe to close the subscription
          return subscription.unsubscribe();
      };
    React.useEffect(fetch, []);


                        

    React.useEffect(() => {

        const audio = audioRef.current;

        if (!audio) {
            return;
        } else if (audio.srcObject) {
            const tracks = audio.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            audio.srcObject = null;
        }

        const audioContext = audioContextRef.current || new AudioContext();
        const source = sourceRef.current || audioContext.createMediaElementSource(audio);
        const analyser = analyserRef.current || audioContext.createAnalyser();

        sourceRef.current = source;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        const canvas = canvasRef.current;
        // const timeline = timelineRef.current;
        const canvasCtx = canvas.getContext('2d');
        // const timelineCtx = timeline.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        // const timelineDataArray = new Uint8Array(bufferLength);

        // setDataArray(dataArray);
        const draw = () => {
            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);
            // TODO make this white or black depending on if its light or dark mode
            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Find the maximum value in the dataArray
            const max = Math.max(...dataArray);

            // Reflect the canvas horizontally
            canvasCtx.scale(-1, 1);
            canvasCtx.translate(-canvas.width, 0);

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / max) * canvas.height / 2;

                canvasCtx.fillStyle = `rgb(${barHeight + 100},${_g},${_b})`;
                canvasCtx.fillRect(canvas.width - (x + barWidth / 2), canvas.height / 2 - (barHeight / 2), barWidth, barHeight);

                x += barWidth + 1;
            }

            // Reset the canvas transformation
            canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        };

        draw();

        audio.addEventListener('canplaythrough', () => {
            console.log('canplaythrough');
            audio.play();
            setWorking(false);
            // setValue('');
            setPreviewMessage('Successfully generated audio file');
        });
    }, [audioSrc]);


    const title ='Custom Answer Exercise'

    React.useEffect(() => {
        const fetchAudio = async () => {
            if (!presignedUrl) {
                return;
            }
            try {
                console.log('presignedUrl!!!', presignedUrl)
                const response = await fetch(presignedUrl);
                console.log('response!!!', response)
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                console.log('url!!!', url)
                setAudioSrc(url);
            } catch (error) {
                console.error(error);
            }
        };

        fetchAudio();
    }, [presignedUrl]);



    const [editor] = useLexicalComposerContext();

    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);


    const onDelete = React.useCallback(
        (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isCustomAnswerNode(node)) {
                    node.remove();
                }
            }
            return false;
        },
        [isSelected, nodeKey],
    );


    const handleClose = () => {
        setDialogValue({
            prompt: '',
            answer: '',
        });
        // close modal
        setWorking(false);
        setPreviewMessage('');    
        toggleOpen(false);
    };

    const addQuestion = (question) => {
        editor.update(async () => {
            console.log('addQuestion', question);
            // upload the audio file if the question has one
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                node.appendQuestion(question);
            }
        });
    };


    const removeQuestionIDs = (ids) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                node.removeIntersection(ids);
            }
        });
    };


    const addQuestionID = (id) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                node.appendId(id);
                // Add relationship to word
                const question = await DataStore.query(Question, id);
                if (question) {
                    await DataStore.save(
                        new QuestionUnit({
                            unit,
                            question,
                        })
                    );
                }
            }
        });
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        const prompt = event.target[0].value
        const answer = event.target[1].value
        const hint = event.target[2].value


        // upload the audio file for the prompt and answer
        // 1st just upload the prompt 
        
        toggleOpen(true);
        setWorking(true);
        setPreviewMessage('Generating audio file...');

        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession()
        // send graphql mutation to create new audio file

        const fileGenerator = await client.graphql({
            query: generateAudioFile,
            variables: {
                phrase: prompt,
                voice: 'shimmer',
                model: 'tts-1-hd',
            }
        },
            {
                'x-api-identity': idToken.toString(),
            });

        // set the presignedUrl from the response

        console.log('fileGenerator', fileGenerator)

        
        const { path } = fileGenerator.data.generateAudioFile;

        if (path) {
            console.log('s3Key', path, identityId)
            const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
            console.log('_presignedUrl', _presignedUrl);
            setPresignedUrl(_presignedUrl);

        } else {
            console.error('fileGenerator', fileGenerator);
            // send error message to preview modal

            setPreviewMessage('Error generating audio file');
            setWorking(false);
        }

        console.log('handleSubmit', event);
        // default to creating an audio prompt and answer
        // upload the audio file for the prompt and answer

        // convert the expected prompt to a different style question with a hint
        // For example given the prompt "What is the capital of Japan?":
        // The expected answer would be "Tokyo"
        // The reversed question would be:
        // "The capital of Japan is famous for its sushi and is the largest city in the world."
        // The expected answer would be:
        // " What is Tokyo?"        



        const _payload = {
            id: value.length,
            prompt,
            answer,
            promptAudio: [path],
            answerAudio: [],
            hint,
        }

        // save the question to the database and add the id to the custom answer node

        
        // addQuestion(_payload);
        // setValue([...value, _payload]);

    };

    const setAllowedInput = (payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                console.log('setAllowedInput', payload);
                node.setAllowedInput(payload);
            }
        });
    };

    const setPromptMethod = (payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                console.log('setPromptMethod', payload);
                node.setPromptMethod(payload);
            }
        });
    };



    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, activeEditor) => {
                    // activeEditorRef.current = activeEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),

            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            // editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
            // editor.registerCommand(
            //     KEY_ESCAPE_COMMAND,
            //     onEscape,
            //     COMMAND_PRIORITY_LOW,
            // ),
        );
        return () => {
            isMounted = false;
            unregister();
        };
    }, [
        clearSelection,
        editor,
        // isResizing,
        isSelected,
        nodeKey,
        onDelete,
        // onEnter,
        // onEscape,
        setSelected,
    ]);


    const _questionBank = Object.values(questionBank || []);

    

    return (
        <div style={{
            maxHeight: '32rem',
            maxWidth: '72rem'
        }}>
            <Typography variant='h5'>
                {title}
            </Typography>

            <Typography variant='p'>
                Create a short answer exercise, that can prompt the user with a question and expect a short answer.
            </Typography>

            {/**
             * The custom answer editor is a simple text input that allows the user to add questions and answer pairs to to the exercise.
             */}

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'right'
            }}>

                <Autocomplete
                    value={value}
                    onChange={(event, newValue) => {
                        if (typeof newValue === 'string') {
                            // timeout to avoid instant validation of the dialog's form.
                            setTimeout(() => {
                                toggleOpen(true);
                                setDialogValue({
                                    phrase: newValue,
                                    pronunciation: '',
                                    definition: '',
                                });
                            });
                        } else if (newValue && newValue.inputValue) {
                            toggleOpen(true);
                            setDialogValue({
                                prompt: newValue.inputValue,
                                answer: '',
                                hint: '',
                            });
                        } else {
                            console.log('Autocomplete.newValue', newValue);
                            // Append wordID to wordIDs
                            const newQuestionId = newValue?.id;
                            if (newQuestionId) {
                                addQuestionID(newQuestionId);
                                setSelection(null);
                                setValue(null);
                                setDialogValue({
                                    prompt: '',
                                    answer: '',
                                    hint: '',
                                });
                            }

                        }
                    }}
                    filterOptions={(options, params) => {
                        const filtered = filter(options, params);

                        if (params.inputValue !== '') {
                            filtered.push({
                                inputValue: params.inputValue,
                                prompt: `Add "${params.inputValue}"`,
                            });
                        }

                        return filtered;
                    }}
                    sx={{
                        flexGrow: 1,
                    }}
                    id="add-new-question"
                    options={_questionBank}
                    getOptionLabel={(option) => {
                        // e.g value selected with enter, right from the input
                        if (typeof option === 'string') {
                            return option;
                        }
                        if (option.inputValue) {
                            return option.inputValue;
                        }
                        return option.prompt;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    renderOption={(props, option) => {
                        const phrase = `${option?.prompt} (${option?.answer}) ${option?.hint}`
                        return <li {...props}>{phrase}</li>
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label="Add word to exercise" />}
                />

                {/* <Autocomplete
                    value={value}
                    onChange={(event, newValue) => {
                        if (typeof newValue === 'string') {
                            // timeout to avoid instant validation of the dialog's form.
                            setTimeout(() => {
                                // toggleOpen(true);
                                setDialogValue({
                                    phrase: newValue,
                                    pronunciation: '',
                                    definition: '',
                                });
                            });
                        } else if (newValue && newValue.inputValue) {
                            // toggleOpen(true);
                            setDialogValue({
                                phrase: newValue.inputValue,
                                pronunciation: '',
                                definition: '',
                            });
                        } else {
                            console.log('Autocomplete.newValue', newValue);
                            // Append wordID to FileIDs
                            const newFileID = newValue?.id;
                            if (newFileID) {
                                addFileID(newFileID);
                                setSelection(null);
                                setValue(null);
                                setDialogValue({
                                    phrase: '',
                                    pronunciation: '',
                                    definition: '',
                                });
                            }

                        }
                    }}
                    filterOptions={(options, params) => {
                        const filtered = filter(options, params);
                        return filtered;
                    }}
                    sx={{
                        flexGrow: 1,
                    }}
                    id="add-new-word"
                    options={value}
                    getOptionLabel={(option) => {
                        // e.g value selected with enter, right from the input
                        if (typeof option === 'string') {
                            return option;
                        }
                        if (option.inputValue) {
                            return option.inputValue;
                        }
                        return option.name;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    renderOption={(props, option) => {
                        let phrase = option.name;
                        if (option?.name && option?.mimeType) {
                            phrase = `${option.name} (${option.mimeType})`
                        }

                        return <li {...props}>{phrase}</li>
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label="Add question" />}
                /> */}

                {/* <ActionsMenu
                    removeQuestionIDs={removeQuestionIDs}
                    ids={gridSelection}
                /> */}

  
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'right'
            }}>


                <Button
                    color='error'
                    style={{
                        margin: '0 0.5rem'
                    
                    }}
                    onClick={() => {

                        console.log('gridSelection', gridSelection);
                        console.log('removeQuestionIDs');
                    removeQuestionIDs(gridSelection);
                }}>
                    <Remove />&nbsp;remove
                </Button>
                <PromptMethodSelector
                    ids={gridSelection}
                    promptMethod={promptMethod}
                    setPromptMethod={setPromptMethod}
                />
                <AllowedInputSelector
                    ids={gridSelection}
                    setAllowedInput={setAllowedInput}
                    allowedInput={allowedInput}
                />



            </div>


            <Dialog open={open} onClose={handleClose}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Add a new question</DialogTitle>
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: 'fit-content',
                        }}
                    >
                        <DialogContentText>
                            Add a new question and answer pair.
                        </DialogContentText>

                    {audioSrc &&
                    <>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                    Text to Speech Preview  {working && <CircularProgress />}
                </Typography>

                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    {previewMessage}
                </Typography>
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <canvas
                            style={{
                                // width: '100%',
                                // height: '10vw',
                                margin: 'auto'
                            }}
                            ref={canvasRef} />
                        <audio
                            onClick={doNothing}
                            style={{
                                backgroundColor: '#ffffff !important',
                                // width: '100%',
                                // margin: '1rem auto'
                            }}
                            ref={audioRef} src={audioSrc} controls />
                    </Box>
                    </>}
                        <TextField
                            autoFocus
                            margin="dense"
                            id="prompt"
                            value={dialogValue.phrase}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    prompt: event.target.value,
                                })
                            }
                            label="Prompt"
                            type="text"
                            variant="standard"
                        />
                        <TextareaAutosize
                            minRows={3}
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                            }}
                            id="answer"
                            value={dialogValue.definition}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    answer: event.target.value,
                                })
                            }
                            aria-label='Answer'
                            placeholder="Answer"
                            type="text"
                            variant="standard"
                        />
                        <TextareaAutosize
                            minRows={3}
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                            }}
                            id="hint"
                            value={dialogValue.hint}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    hint: event.target.value,
                                })
                            }
                            aria-label='Hint'
                            placeholder="Hint"
                            type="text"
                            variant="standard"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant='contained'
                            color='primary'
                        >
                            Add
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {rows?.length === 0 && (
                <div style={{ marginTop: '0.5' }}>
                    <p>No questions have been added yet. Use the input above to add prompt and answer pairs.
                    </p>
                </div>
            )}
            {rows?.length > 0 && (
                <DataGrid
                    sx={{
                        marginTop: '0.5rem',
                    }}
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 100]}
                    checkboxSelection
                    onRowSelectionModelChange={(e) => {
                        console.log('onRowSelectionModelChange', e);
                        setGridSelection(e)
                    }}
                />
            )}

        </div>
    );
}