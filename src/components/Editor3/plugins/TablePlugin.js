import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {INSERT_TABLE_COMMAND} from '@lexical/table';
import {
    $insertNodes,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
} from 'lexical';
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import * as React from 'react';

import {$createTableNodeWithDimensions, TableNode} from '../components/TableNode';

import {
    MenuItem,
    Modal,
    Box,
    Button,
    Card,
    Typography,
    Stack,
    TextField,
} from '@mui/material';

import TableViewIcon from '@mui/icons-material/TableView';

export const INSERT_NEW_TABLE_COMMAND=
    createCommand('INSERT_NEW_TABLE_COMMAND');

export const CellContext = createContext({
    cellEditorConfig: null,
    cellEditorPlugins: null,
    set: () => {
        // Empty
    },
});

export function TableContext({children}) {
    const [contextValue, setContextValue] = useState({
        cellEditorConfig: null,
        cellEditorPlugins: null,
    });
    return (
        <CellContext.Provider
            value={useMemo(
                () => ({
                    cellEditorConfig: contextValue.cellEditorConfig,
                    cellEditorPlugins: contextValue.cellEditorPlugins,
                    set: (cellEditorConfig, cellEditorPlugins) => {
                        setContextValue({cellEditorConfig, cellEditorPlugins});
                    },
                }),
                [contextValue.cellEditorConfig, contextValue.cellEditorPlugins],
            )}>
            {children}
        </CellContext.Provider>
    );
}

export function InsertNewTableDialog({editor, onClose}) {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [rows, setRows] = useState('');
    const [columns, setColumns] = useState('');
    const [isDisabled, setIsDisabled] = useState(true);

    const onRowsChange = (event) => {
        setRows(event.target.value);
    }

    const onColumnsChange = (event) => {
        setColumns(event.target.value);
    }

    useEffect(() => {
        const row = Number(rows);
        const column = Number(columns);
        if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
            setIsDisabled(false);
        } else {
            setIsDisabled(true);
        }
    }, [rows, columns]);

    const onClick = () => {
        editor.dispatchCommand(INSERT_NEW_TABLE_COMMAND, {columns, rows});
        onClose();
    };

    return (
        <>
        <MenuItem
        
        onClick={handleOpen}
        >

            <TableViewIcon />
              <span className="text">Table</span>
            </MenuItem>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Card sx={{
                        minWidth: 'min-content',
                        minHeight: 'min-content',
                        width: '30vw',
                        margin: '20vh auto',
                        verticalAlign: 'middle',
                        padding: '2rem',

                    }}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Choose a layout
                        </Typography>

                        <TextField
                            placeholder={'# of rows (1-500)'}
                            label="Rows"
                            onChange={onRowsChange}
                            value={rows}
                            data-test-id="table-modal-rows"
                            type="number"
                        />
                        <TextField
                            placeholder={'# of columns (1-50)'}
                            label="Columns"
                            onChange={onColumnsChange}
                            value={columns}
                            data-test-id="table-modal-columns"
                            type="number"
                        />

                        <Stack
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                marginTop: '1rem',
                                overflowY: 'auto'
                            }}
                        >
                            <Button variant='contained' color='primary' onClick={onClick}>Insert</Button>
                        </Stack>

                    </Card>
                </Modal>
            </Box>
        </>
    );

}

export function TablePlugin({cellEditorConfig, children}) {
    const [editor] = useLexicalComposerContext();
    const cellContext = useContext(CellContext);

    useEffect(() => {
        if (!editor.hasNodes([TableNode])) {
            throw('TablePlugin: TableNode is not registered on editor');
        }

        cellContext.set(cellEditorConfig, children);

        return editor.registerCommand(
            INSERT_NEW_TABLE_COMMAND,
            ({columns, rows, includeHeaders}) => {
                const tableNode = $createTableNodeWithDimensions(
                    Number(rows),
                    Number(columns),
                    includeHeaders,
                );
                $insertNodes([tableNode]);
                // Save the editor state?
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [cellContext, cellEditorConfig, children, editor]);

    return null;
}