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
    Collapse,
    FormGroup,
    FormControlLabel,
    Checkbox,
    ListItemText,
    List,
    ListItem,
    MenuList,
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

import DictionaryContext from '../../../context/dictionaryContext';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UnitWord, Word } from '../../../models';
import UnitContext from '../../../context/unitContext';

import { DataStore } from 'aws-amplify/datastore';
import { $isAnswerNode } from '../plugins/AnswerPlugin';

import { PromptMethodSelector, AllowedInputSelector } from './PromptMethodSelector';

const filter = createFilterOptions();

const columns = [
    { field: 'phrase', headerName: 'Phrase', flex: 1, minWidth: 100 },
    { field: 'pronunciation', headerName: 'Pronunciation', flex: 1, minWidth: 100 },
    {
        field: 'definition',
        headerName: 'Definition',
        flex: 1, minWidth: 200
    },
];

export function ActionsMenu({
    ids,
    removeWordIDs,
    requestDefinition,
    setRequestDefinition,
}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const removeFromAssignment = () => {
        console.log('removeFromAssignment', ids);
        removeWordIDs(ids);
        setAnchorEl(null);
    }

    return (
        <>
            <Button
                id="open-allowed-inputs-button"
                color="inherit"
                aria-controls={open ? 'allowed-inputs-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{
                    minWidth: '3rem',
                    margin: '0 0 0 0.5rem'
                }}
            >
                <MoreVertIcon />
            </Button>
            <Menu
                id="allowed-inputs-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'open-allowed-inputs-button',
                }}
            >
                <MenuItem onClick={removeFromAssignment}>Remove from Exercise</MenuItem>
                {!requestDefinition &&
                <MenuItem onClick={() => {
                    
                    console.log('setRequestDefinition', true)
                    setRequestDefinition(true)}}>Prompt for a definition</MenuItem>
                }
                {requestDefinition &&
                <MenuItem onClick={() => {setRequestDefinition(false)}}>Prompt for Word</MenuItem>
                }
                
            </Menu>
        </>
    );
}

export default function AnswerEditor({
    className,
    format,
    nodeKey,
    // setWordIDs,
    requestDefinition,
    wordIDs,
    allowedInput,
    promptMethod,
}) {
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);
    // const [rows, setRows] = React.useState([]);
    const [selection, setSelection] = React.useState(null);
    const [gridSelection, setGridSelection] = React.useState([]);
    const [dialogValue, setDialogValue] = React.useState({
        phrase: '',
        definition: '',
        pronunciation: '',
    });

    console.log('AnswerEditor.allowedInput', allowedInput);

    const [title, setTitle] = React.useState('Short Answer Exercise');

    React.useEffect(() => {
        let titleSuffix = requestDefinition? 'Definition' : 'Word';
        let _title = 'Short Answer Exercise by ' + titleSuffix;
        setTitle(_title);

    }, [requestDefinition]);

    const {
        wordMapId,
    } = React.useContext(DictionaryContext);

    const {
        unit,
    } = React.useContext(UnitContext);

    const rows = []

    if(wordIDs) {
        wordIDs.forEach((id) => {
            const word = wordMapId[id];
            if (word) {
                rows.push({
                    id: word.id,
                    phrase: word.phrase,
                    pronunciation: word.pronunciation,
                    definition: word.definition,
                });
            }
        });
    
    }

    const [editor] = useLexicalComposerContext();

    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);

    const _dictionary = Object.values(wordMapId);


    const onDelete = React.useCallback(
        async (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isAnswerNode(node)) {
                    node.remove();

                    // Remove relationship to word
                    const _operations = [];
                    wordIDs.forEach((id) => {
                        _operations.push(
                            DataStore.delete(UnitWord, id)
                        );
                    }
                    );
                    await Promise.allSettled(_operations);

                }
            }
            return false;
        },
        [isSelected, nodeKey],
    );


    const handleClose = () => {
        setDialogValue({
            phrase: '',
            pronunciation: '',
            definition: '',
        });
        toggleOpen(false);
    };

    const addWordID = (id) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isAnswerNode(node)) {
                node.appendId(id);
                // Add relationship to word
                const word = await DataStore.query(Word, id);
                if (word) {
                    await DataStore.save(
                        new UnitWord({
                            unit,
                            word,
                        })
                    );
                }
            }
        });
    };


    const setRequestDefinition = (payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isAnswerNode(node)) {
                node.setRequestDefinition(payload);
            }
        });
    };

    const setAllowedInput = (payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isAnswerNode(node)) {
                console.log('setAllowedInput', payload);
                node.setAllowedInput(payload);
            }
        });
    };

    const setPromptMethod = (payload) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isAnswerNode(node)) {
                console.log('setPromptMethod', payload);
                node.setPromptMethod(payload);
            }
        });
    };

    const removeWordIDs = (ids) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isAnswerNode(node)) {
                node.removeIntersection(ids);
                // Remove relationship to word
                const _operations = [];
                ids.forEach((id) => {
                    _operations.push(
                        DataStore.delete(UnitWord, id)
                    );
                });
                await Promise.allSettled(_operations);
            }
        });
    };


    const handleSubmit = (event) => {
        event.preventDefault();
        setValue({
            phrase: dialogValue.phrase,
            // pronunciation: '',
            // definition: '',
        });
        handleClose();
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
            // editor.registerCommand(
            //     CLICK_COMMAND,
            //     (payload) => {
            //         const event = payload;

            //         if (event.target === imageRef.current) {
            //             if (event.shiftKey) {
            //                 setSelected(!isSelected);
            //             } else {
            //                 clearSelection();
            //                 setSelected(true);
            //             }
            //             return true;
            //         }

            //         return false;
            //     },
            //     COMMAND_PRIORITY_LOW,
            // ),

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

    

    return (
        <div style={{
            maxHeight: '32rem',
            maxWidth: '72rem'
        }}>
            <Typography variant='h5'>
                {title}
            </Typography>

            <Typography variant='p'>
                Create a short answer exercise, that can either prompt the user to type in a word or a definition.
            </Typography>

            {/**
             * The short answer editor is a simple text input that allows the user to add words to the exercise.
             */}

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
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
                                phrase: newValue.inputValue,
                                pronunciation: '',
                                definition: '',
                            });
                        } else {
                            console.log('Autocomplete.newValue', newValue);
                            // Append wordID to wordIDs
                            const newWordID = newValue?.id;
                            if (newWordID) {
                                addWordID(newWordID);
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

                        if (params.inputValue !== '') {
                            filtered.push({
                                inputValue: params.inputValue,
                                phrase: `Add "${params.inputValue}"`,
                            });
                        }

                        return filtered;
                    }}
                    sx={{
                        flexGrow: 1,
                    }}
                    id="add-new-word"
                    options={_dictionary}
                    getOptionLabel={(option) => {
                        // e.g value selected with enter, right from the input
                        if (typeof option === 'string') {
                            return option;
                        }
                        if (option.inputValue) {
                            return option.inputValue;
                        }
                        return option.phrase;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    renderOption={(props, option) => {
                        let phrase = option.phrase;
                        if (option.phrase && option.pronunciation) {
                            phrase = `${option.phrase} (${option.pronunciation})`
                        }

                        return <li {...props}>{phrase}</li>
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label="Add word to exercise" />}
                />
                <PromptMethodSelector
                    ids={gridSelection}
                    wordIDs={wordIDs}
                    promptMethod={promptMethod}
                    setPromptMethod={setPromptMethod}
                />
                <AllowedInputSelector
                    ids={gridSelection}
                    wordIDs={wordIDs}
                    setAllowedInput={setAllowedInput}
                    allowedInput={allowedInput}
                />
                <ActionsMenu
                    removeWordIDs={removeWordIDs}
                    ids={gridSelection}
                    requestDefinition={requestDefinition}
                    setRequestDefinition={setRequestDefinition}
                />

            </div>


            <Dialog open={open} onClose={handleClose}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Add a new word</DialogTitle>
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: 'fit-content',
                        }}
                    >
                        <DialogContentText>
                            Add a new word to the dictionary.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            value={dialogValue.phrase}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    phrase: event.target.value,
                                })
                            }
                            label="phrase"
                            type="text"
                            variant="standard"
                        />
                        <TextField
                            margin="dense"
                            id="pronunciation"
                            value={dialogValue.pronunciation}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    pronunciation: event.target.value,
                                })
                            }
                            label="pronunciation"
                            type="text"
                            variant="standard"
                        />
                        <TextareaAutosize
                            minRows={3}
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                            }}
                            id="definition"
                            value={dialogValue.definition}
                            onChange={(event) =>
                                setDialogValue({
                                    ...dialogValue,
                                    definition: event.target.value,
                                })
                            }
                            aria-label='Definition'
                            placeholder="definition"
                            type="text"
                            variant="standard"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            // variant='contained'
                            // color='error'
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

            {rows.length === 0 && (
                <div style={{ marginTop: '0.5' }}>
                    <p>No words have been added yet. Use the input above to add words from the dictionary. If the word you want to add is not in the dictionary, you can add it by clicking the "Add Word" item in the dropdown or from the dictionary editor in the Sidebar.
                    </p>
                </div>
            )}
            {rows.length > 0 && (
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
