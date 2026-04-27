import * as React from 'react';
import { useTranslation } from 'next-i18next';

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


import TextareaAutosize from '@mui/material/TextareaAutosize';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

import AudioWaveformPlayer from '../../components/AudioWaveformPlayer';

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
import UnitContext from '../../../../context/unitContext';

import { getAmplifyClient } from '../../../../utils/amplifyClient';
import { $isCustomAnswerNode } from '../../plugins/CustomAnswerPlugin';

import { PromptMethodSelector, AllowedInputSelector } from '../../components/PromptMethodSelector';
import { fetchAuthSession } from 'aws-amplify/auth';

import getCachedUrl from '../../../../utils/getCachedUrl';
import { Remove } from '@mui/icons-material';

const filter = createFilterOptions();

const useColumns = (t) => [
    { field: 'prompt', headerName: t('customAnswerEditor.columnHeaders.prompt'), flex: 1, minWidth: 100 },
    {
        field: 'answer',
        headerName: t('customAnswerEditor.columnHeaders.answer'),
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
        headerName: t('customAnswerEditor.columnHeaders.id'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'promptAudio',
        headerName: t('customAnswerEditor.columnHeaders.promptAudio'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'answerAudio',
        headerName: t('customAnswerEditor.columnHeaders.answerAudio'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
    {
        field: 'hint',
        headerName: t('customAnswerEditor.columnHeaders.hint'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        hide: true,
    },
];

export default React.memo(function CustomAnswerEditor({
    className,
    format,
    nodeKey,
    ids: questionIDs,
    promptMethod,
    allowedInput,
}) {
    const { t } = useTranslation('editor.blocks');
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);
    const [gridSelection, setGridSelection] = React.useState([]);
    const [dialogValue, setDialogValue] = React.useState({
        prompt: '',
        answer: '',
        hint: '',
        promptAudio: [],
        answerAudio: [],
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
    const customAnswerRef = React.useRef(null);

    const {
        questionBank,
    } = React.useContext(DictionaryContext);

    const {
        unit,
    } = React.useContext(UnitContext);

    const columns = useColumns(t);

    const rows = React.useMemo(() => {
        const result = [];

        if(questionIDs) {
            questionIDs.forEach((id) => {
                const _q = questionBank[id];
                if (_q) {
                    result.push({
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
        return result;
    }, [questionIDs, questionBank]);

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
            setPreviewMessage(t('customAnswerEditor.successGeneratedAudio'));
        });
    }, [audioSrc]);


    const title = t('customAnswerEditor.title')

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
                    return true;
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
                // Add relationship to question
                const client = getAmplifyClient();
                const { data: question } = await client.models.Question.get({ id });
                if (question) {
                    await client.models.QuestionUnit.create({
                        unitID: unit.id,
                        questionID: question.id,
                    });
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
        setPreviewMessage(t('customAnswerEditor.generatingAudio'));

        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession()
        // send graphql mutation to create new audio file
        const client = getAmplifyClient();

        const fileGenerator = await client.mutations.generateAudioFile({
            phrase: prompt,
            voice: 'shimmer',
            model: 'tts-1-hd',
        });

        // set the presignedUrl from the response

        console.log('fileGenerator', fileGenerator)

        // The mutation returns { data: { path, identityId, ... }, errors }
        const { path } = fileGenerator.data || {};

        if (path) {
            console.log('s3Key', path, identityId)
            const _presignedUrl = await getCachedUrl(path)
            console.log('_presignedUrl', _presignedUrl);
            setPresignedUrl(_presignedUrl);

        } else {
            console.error('fileGenerator', fileGenerator);
            // send error message to preview modal

            setPreviewMessage(t('customAnswerEditor.errorGeneratingAudio'));
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

        // Extract waveform data from the backend response
        const promptWaveformData = fileGenerator?.data?.waveformData;

        // Create and save the Question model
        try {
            const client = getAmplifyClient();
            const response = await client.models.Question.create({
                prompt,
                answer,
                hint,
                audio: [path],
                audioWaveformData: promptWaveformData,
                answerAudio: [], // Can be populated later if answer audio is generated
                answerAudioWaveformData: null,
                owner: unit?.owner || 'system',
                identityId: unit?.identityId || 'system'
            });
            
            if (response.errors) {
                throw new Error(response.errors[0].message);
            }

            // Add the question ID to the custom answer node
            addQuestionID(response.data.id);
            
            // Close the modal and reset form
            toggleOpen(false);
            setWorking(false);
        } catch (error) {
            console.error('Error creating question:', error);
            setPreviewMessage(t('customAnswerEditor.errorCreatingQuestion'));
            setWorking(false);
        }

    };

    const setAllowedInput = React.useCallback((payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                console.log('setAllowedInput', payload);
                node.setAllowedInput(payload);
            }
        });
    }, [editor, nodeKey]);

    const setPromptMethod = React.useCallback((payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomAnswerNode(node)) {
                console.log('setPromptMethod', payload);
                node.setPromptMethod(payload);
            }
        });
    }, [editor, nodeKey]);



    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;

                    if (customAnswerRef.current && customAnswerRef.current.contains(event.target)) {
                        event.preventDefault();
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }

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
        isSelected,
        nodeKey,
        onDelete,
        setSelected,
    ]);


    const _questionBank = Object.values(questionBank || []);

    

    return (
        <div 
            ref={customAnswerRef}
            style={{
                maxHeight: '32rem',
                maxWidth: '72rem',
                border: isSelected ? '2px solid #1976d2' : '1px solid transparent',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
            }}
        >
            <Typography variant='h5'>
                {title}
            </Typography>

            <Typography variant='p'>
                {t('customAnswerEditor.description')}
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
                        const { key, ...otherProps } = props;
                        const phrase = `${option?.prompt} (${option?.answer}) ${option?.hint}`;
                        const uniqueKey = option?.id || key;
                        return <li key={uniqueKey} {...otherProps}>{phrase}</li>;
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label={t('customAnswerEditor.addWordLabel')} />}
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
                    <Remove />&nbsp;{t('customAnswerEditor.remove')}
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
                    <DialogTitle>{t('customAnswerEditor.dialogTitle')}</DialogTitle>
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: 'fit-content',
                        }}
                    >
                        <DialogContentText>
                            {t('customAnswerEditor.dialogDescription')}
                        </DialogContentText>

                    {audioSrc &&
                    <>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                    {t('customAnswerEditor.ttsPreview')}  {working && <CircularProgress />}
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
                        {audioSrc && (
                            <AudioWaveformPlayer
                                audioUrl={audioSrc}
                                waveformData={undefined}
                                width={600}
                                height={120}
                                title={t('customAnswerEditor.audioPreview')}
                                showDuration={true}
                            />
                        )}
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
                            label={t('customAnswerEditor.promptLabel')}
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
                            aria-label={t('customAnswerEditor.answerLabel')}
                            placeholder={t('customAnswerEditor.answerPlaceholder')}
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
                            aria-label={t('customAnswerEditor.hintLabel')}
                            placeholder={t('customAnswerEditor.hintPlaceholder')}
                            type="text"
                            variant="standard"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleClose}
                        >
                            {t('customAnswerEditor.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant='contained'
                            color='primary'
                        >
                            {t('customAnswerEditor.add')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {rows?.length === 0 && (
                <div style={{ marginTop: '0.5' }}>
                    <p>{t('customAnswerEditor.emptyState')}
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
});