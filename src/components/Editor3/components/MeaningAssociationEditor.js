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
import { $isMeaningAssociationNode } from '../plugins/MeaningAssociationPlugin';


import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UnitWord, Word } from '../../../models';
import UnitContext from '../../../context/unitContext';

import { DataStore } from 'aws-amplify/datastore';

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
                id="basic-button"
                color="inherit"
                aria-controls={open ? 'basic-menu' : undefined}
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
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={removeFromAssignment}>Remove from Assignment</MenuItem>
            </Menu>
        </>
    );
}

export default function MeaningAssociationEditor({
    className,
    format,
    nodeKey,
    // setWordIDs,
    wordIDs,
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
                if ($isMeaningAssociationNode(node)) {
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
            if ($isMeaningAssociationNode(node)) {
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


    const removeWordIDs = (ids) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isMeaningAssociationNode(node)) {
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
                <ActionsMenu
                    removeWordIDs={removeWordIDs}
                    ids={gridSelection}
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