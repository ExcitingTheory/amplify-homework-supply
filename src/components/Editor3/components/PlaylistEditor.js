import * as React from 'react';

import { DataGrid } from '@mui/x-data-grid';

import {
    Menu,
    MenuItem,
    TextField,
} from '@mui/material';

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
import { $isPlaylistNode } from '../plugins/PlaylistPlugin';


import MoreVertIcon from '@mui/icons-material/MoreVert';
import { File, UnitFile } from '../../../models';

import { DataStore } from 'aws-amplify/datastore';
import FileContext from '../../../context/fileContext';
import UnitContext from '../../../context/unitContext';

const filter = createFilterOptions();

const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 100 },
    { field: 'size', headerName: 'Size', flex: 1, minWidth: 100 },
];

export function ActionsMenu({
    ids,
    removeFileIDs,
}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const removeFromPlaylist = () => {
        console.log('removeFrom', ids);
        removeFileIDs(ids);
        setAnchorEl(null);
    }

    return (
        <>
            <Button
                id="playlist-edit-button"
                color="inherit"
                aria-controls={open ? 'playlist-edit-menu' : undefined}
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
                id="playlist-edit-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'playlist-edit-button',
                }}
            >
                <MenuItem onClick={removeFromPlaylist}>Remove from Playlist</MenuItem>
            </Menu>
        </>
    );
}

export default function PlaylistEditor({
    className,
    format,
    nodeKey,
    // setFileIDs,
    fileIDs,
}) {
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);
    // const [rows, setRows] = React.useState([]);
    const [gridSelection, setGridSelection] = React.useState([]);
    const [dialogValue, setDialogValue] = React.useState({
        phrase: '',
        definition: '',
        pronunciation: '',
    });

    // const [anchorEl, setAnchorEl] = React.useState(null);
    // const [openMore, setOpenMore] = React.useState(false);

    // Record previous FileIDs
    const prevFileIDs = React.useRef(fileIDs);
    const playlistRef = React.useRef(null);

    const [editor] = useLexicalComposerContext();

    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);

    const {
        unit,
    } = React.useContext(UnitContext);

    const {
        myPlaylistFiles,
    } = React.useContext(FileContext);
    
    const _fileOptions = React.useMemo(() => {
        return Object.values(myPlaylistFiles);
    }, [myPlaylistFiles]);

    const rows = React.useMemo(() => {
        const _rows = [];
        if(fileIDs){
            fileIDs.forEach((id) => {
                const file = myPlaylistFiles[id];
                if (file) {
                    _rows.push({
                        id: file.id,
                        title: file.name,
                        size: (file.size / 100000).toFixed(2) + ' MB',
                    });
                }
            });
        }
        return _rows;
    }, [fileIDs, myPlaylistFiles]);

    const onDelete = React.useCallback(
        async (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isPlaylistNode(node)) {
                    node.remove();
                    // Remove relationship to word
                    const _operations = [];
                    fileIDs.forEach((id) => {
                        _operations.push(
                            DataStore.delete(UnitFile, id)
                        );
                    }
                    );
                    await Promise.allSettled(_operations);
                }
            }
            return false;
        },
        [nodeKey],
    );


    const addFileID = (id) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isPlaylistNode(node)) {
                node.appendId(id);
                // Add relationship to word
                console.log('addFileID', id)
                const file = await DataStore.query(File, id);
                if (file) {
                    await DataStore.save(
                        new UnitFile({
                            unit,
                            file,
                        })
                    );
                }
            }
        });
    };


    const removeFileIDs = (ids) => {
        editor.update(async () => {
            const node = $getNodeByKey(nodeKey);
            if ($isPlaylistNode(node)) {
                node.removeIntersection(ids);
                // Remove relationship to word
                const _operations = [];
                ids.forEach((id) => {
                    _operations.push(
                        DataStore.delete(UnitFile, id)
                    );
                });
                await Promise.allSettled(_operations);
            }
        });
    };


    // React.useEffect(() => {
    //     if (fileIDs.length === 0) return;
    //     prevFileIDs.current = fileIDs;
    //     let _rows = []
    //     fileIDs.forEach((id) => {

    //         const file = myPlaylistFiles[id];
    //         if (file) {
    //             _rows.push({
    //                 id: file.id,
    //                 title: file.name,
    //                 size: (file.size/100000).toFixed(2) + ' MB' ,
    //             });
    //         }
    //     });

    //     setRows(_rows);
    // }, [fileIDs]);


    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;

                    if (playlistRef.current && (event.target === playlistRef.current || playlistRef.current.contains(event.target))) {
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
        editor,
        nodeKey,
        onDelete,
    ]);

    return (
        <div 
            ref={playlistRef}
            style={{
                maxHeight: '32rem',
                maxWidth: '72rem',
                padding: '8px',
            }}
        >

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
                    options={_fileOptions}
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
                        const { key, ...otherProps } = props;
                        let phrase = option.name;
                        if (option?.name && option?.mimeType) {
                            phrase = `${option.name} (${option.mimeType})`
                        }

                        return <li key={key} {...otherProps}>{phrase}</li>
                    }}
                    // sx={{ width: 300 }}
                    freeSolo
                    renderInput={(params) => <TextField {...params} label="Add file to playlist" />}
                />
                <ActionsMenu
                    removeFileIDs={removeFileIDs}
                    ids={gridSelection}
                />

            </div>

            {rows.length === 0 && (
                <div style={{ marginTop: '0.5' }}>
                    <p>No files have been added yet. Use the input above to add files to the playlist.
                        {/* Or drop the files into the playlist, and the files will be added automatically. */}
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