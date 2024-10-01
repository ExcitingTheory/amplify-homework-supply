import * as React from 'react';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import DictionaryContext from '../../../context/dictionaryContext';

const filter = createFilterOptions();

export default function FreeSoloCreateOptionDialog() {
    const [value, setValue] = React.useState(null);
    const [open, toggleOpen] = React.useState(false);

    const {
        dictionary,
    } = React.useContext(DictionaryContext});

    const _dictionary = Object.values(dictionary);


    const handleClose = () => {
        setDialogValue({
            phrase: '',
            year: '',
        });
        toggleOpen(false);
    };

    const [dialogValue, setDialogValue] = React.useState({
        phrase: '',
        year: '',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        setValue({
            phrase: dialogValue.phrase,
            year: parseInt(dialogValue.year, 10),
        });
        handleClose();
    };

    return (
        <React.Fragment>
            <Autocomplete
                value={value}
                onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                        // timeout to avoid instant validation of the dialog's form.
                        setTimeout(() => {
                            toggleOpen(true);
                            setDialogValue({
                                phrase: newValue,
                                year: '',
                            });
                        });
                    } else if (newValue && newValue.inputValue) {
                        toggleOpen(true);
                        setDialogValue({
                            phrase: newValue.inputValue,
                            year: '',
                        });
                    } else {
                        setValue(newValue);
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
                renderInput={(params) => <TextField {...params} label="Free solo dialog" />}
            />
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
        </React.Fragment>
    );
}
