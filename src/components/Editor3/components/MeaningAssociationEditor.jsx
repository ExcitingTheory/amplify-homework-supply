import * as React from 'react';
import { useTranslations } from 'next-intl';

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

import TextareaAutosize from '@mui/material/TextareaAutosize';
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
import UnitContext from '../../../context/unitContext';

import { getAmplifyClient } from '../../../utils/amplifyClient';

const filter = createFilterOptions();

const getColumns = (t) => [
    { field: 'phrase', headerName: t('meaningAssociationEditor.columnHeaders.phrase'), flex: 1, minWidth: 100 },
    { field: 'pronunciation', headerName: t('meaningAssociationEditor.columnHeaders.pronunciation'), flex: 1, minWidth: 100 },
    {
        field: 'definition',
        headerName: t('meaningAssociationEditor.columnHeaders.definition'),
        flex: 1, minWidth: 200
    },
];

export function ActionsMenu({
    ids,
    removeWordIDs,
}) {
    const t = useTranslations('editor.blocks');
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
                <MenuItem onClick={removeFromAssignment}>{t('meaningAssociationEditor.removeFromAssignment')}</MenuItem>
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
    enabledModes = ['learn', 'easy', 'hard'],
}) {
    const t = useTranslations('editor.blocks');
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);
    // const [rows, setRows] = React.useState([]);
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

    const meaningAssociationRef = React.useRef(null);

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
                    const client = getAmplifyClient();
                    const _operations = [];
                    wordIDs.forEach((id) => {
                        _operations.push(
                            client.models.UnitWord.delete({ id })
                        );
                    });
                    await Promise.allSettled(_operations);

                }
            }
            return false;
        },
        [isSelected, nodeKey, wordIDs],
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
                if (unit) {
                    const client = getAmplifyClient();
                    const { data: word } = await client.models.Word.get({ id });
                    if (word) {
                        await client.models.UnitWord.create({
                            unitID: unit.id,
                            wordID: word.id,
                        });
                    }
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
                const client = getAmplifyClient();
                const _operations = [];
                ids.forEach((id) => {
                    _operations.push(
                        client.models.UnitWord.delete({ id })
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
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;

                    if (meaningAssociationRef.current && meaningAssociationRef.current.contains(event.target)) {
                        event.preventDefault();
                        if (event.shiftKey) {
                            setSelected(prev => !prev);
                        } else {
                            // Only clear selection if we're not already selected
                            setSelected(prev => {
                                if (!prev) {
                                    clearSelection();
                                }
                                return true;
                            });
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
        // isResizing,
        isSelected,
        nodeKey,
        onDelete,
        // onEnter,
        // onEscape,
        setSelected,
    ]);

    return (
        <div 
            ref={meaningAssociationRef}
            style={{
                maxHeight: '32rem',
                maxWidth: '72rem',
                border: isSelected ? '2px solid var(--mui-palette-primary-main, #1976d2)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
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
                    renderOption={(props, option, { index }) => {
                        let phrase = option.phrase;
                        if (option.phrase && option.pronunciation) {
                            phrase = `${option.phrase} (${option.pronunciation})`
                        }

                        const { key, ...otherProps } = props;
                        // Create a unique key using option ID if available, otherwise use phrase + index
                        const uniqueKey = option.id || `${option.phrase}-${index}`;
                        return <li key={uniqueKey} {...otherProps}>{phrase}</li>
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label={t('meaningAssociationEditor.addWordLabel')} />}
                />
                <ActionsMenu
                    removeWordIDs={removeWordIDs}
                    ids={gridSelection}
                />

            </div>


            <Dialog open={open} onClose={handleClose}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{t('meaningAssociationEditor.dialogTitle')}</DialogTitle>
                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: 'fit-content',
                        }}
                    >
                        <DialogContentText>
                            {t('meaningAssociationEditor.dialogDescription')}
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
                            label={t('meaningAssociationEditor.phraseLabel')}
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
                            label={t('meaningAssociationEditor.pronunciationLabel')}
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
                            placeholder={t('meaningAssociationEditor.definitionPlaceholder')}
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
                            {t('meaningAssociationEditor.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant='contained'
                            color='primary'
                        >
                            {t('meaningAssociationEditor.add')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {rows.length === 0 && (
                <div style={{ marginTop: '0.5' }}>
                    <p>{t('meaningAssociationEditor.emptyState')}
                    </p>
                </div>
            )}
            {rows.length > 0 && (
                <DataGrid
                    sx={{
                        marginTop: '0.5rem',
                    }}
                    rows={rows}
                    columns={getColumns(t)}
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