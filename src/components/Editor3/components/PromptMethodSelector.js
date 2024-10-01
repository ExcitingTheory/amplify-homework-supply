import * as React from 'react';
import {
    Menu,
    MenuItem, ListItemIcon
} from '@mui/material';
import Button from '@mui/material/Button';
import { Check } from '@mui/icons-material';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import InputIcon from '@mui/icons-material/Input';

export const AllowedInputSelector = ({
    ids, defaultAllowedInputs = ['text', 'audio'], allowedInput = [], setAllowedInput,
    // wordIDs,
}) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_allowedInputs, setAllowedInputs] = React.useState(allowedInput.length > 0 ? allowedInput : defaultAllowedInputs);
    const open = Boolean(anchorEl);

    console.log('AllowedInputSelector.allowedInput', allowedInput);
    // load defaults from allowedInputs
    React.useEffect(() => {
        if (allowedInput) {
            setAllowedInputs(allowedInput);
        }
    }, [JSON.stringify(allowedInput)]);

    // if the working inputs change, update the allowedInput
    React.useEffect(() => {
        console.log('useEffect._allowedInputs', _allowedInputs);
        setAllowedInput(_allowedInputs);
    }, [JSON.stringify(_allowedInputs)]);

    const handleClick = (event) => {
        console.log('handleClick', event.currentTarget);
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        console.log('handleClose');
        setAnchorEl(null);

        setAllowedInput(_allowedInputs);
    };

    const handleSelect = (event) => {
        console.log('handleSelect', event.target);

        const value = event.target.getAttribute('value');
        console.log('value', value);
        const mergeInputs = _allowedInputs.includes(value) ? _allowedInputs.filter((x) => x !== value) : [..._allowedInputs, value];
        console.log('mergeInputs', mergeInputs);
        setAllowedInputs(mergeInputs);
        // setAnchorEl(null);
    };

    return (
        <>
            <Button
                id="open-allowed-inputs-button"
                color="inherit"
                aria-controls={open ? 'allowed-inputs-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={open ? handleClose : handleClick}
                sx={{
                    minWidth: '3rem',
                    margin: '0 0 0 0.5rem'
                }}
            >

                <InputIcon />&nbsp;Input
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
                <MenuItem onClick={handleSelect}
                    style={{
                        textAlign: 'right',
                    }}
                    value='text'>

                    {_allowedInputs.includes('text') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Text</MenuItem>
                <MenuItem onClick={handleSelect} value='audio'>

                    {_allowedInputs.includes('audio') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Audio</MenuItem>
                <MenuItem onClick={handleSelect} value='image'>

                    {_allowedInputs.includes('image') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Image</MenuItem>
                <MenuItem onClick={handleSelect} value='writing'>

                    {_allowedInputs.includes('writing') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Drawing</MenuItem>
                <MenuItem onClick={handleSelect} value='video'
                    style={{
                        textAlign: 'right',
                    }}
                >

                    {_allowedInputs.includes('video') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Video</MenuItem>
            </Menu>
        </>

        //     <MenuList dense open={open}>
        //         <MenuItem>
        //         {useVideos &&
        //         <ListItemIcon>
        //         <Check />
        //         </ListItemIcon>
        //         }
        //         <ListItemText primary="Videos" />
        //         </MenuItem>
        //     </MenuList>
        // </>
    );
};
export const PromptMethodSelector = ({
    ids, defaultPromptMethods = ['text', 'audio', 'writing'], promptMethod = [], setPromptMethod,
    // wordIDs,
}) => {

    console.log('PromptMethodSelector.promptMethod', promptMethod);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_promptMethods, setPromptMethods] = React.useState(promptMethod.length > 0 ? promptMethod : []);
    const open = Boolean(anchorEl);

    console.log('PromptMethodSelector.promptMethod', promptMethod);
    // load defaults from promptMethods
    React.useEffect(() => {
        if (promptMethod) {
            setPromptMethods(promptMethod);
        }
    }, [JSON.stringify(promptMethod)]);

    // if the working methods change, update the promptMethod
    // React.useEffect(() => {
    //     console.log('useEffect._promptMethods', _promptMethods);
    //     setPromptMethod(_promptMethods);
    // }, [JSON.stringify(_promptMethods)]);
    const handleClick = (event) => {
        console.log('handleClick', event.currentTarget);
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        console.log('handleClose');
        setAnchorEl(null);

        setPromptMethod(_promptMethods);
    };

    const handleSelect = (event) => {
        console.log('handleSelect', event);

        const value = event.target.getAttribute('value');
        console.log('value', value);
        const mergeMethods = _promptMethods.includes(value) ? _promptMethods.filter((x) => x !== value) : [..._promptMethods, value];

        setPromptMethods(mergeMethods);
        // setAnchorEl(null);
    };

    return (
        <>
            <Button
                id="open-prompt-methods-button"
                color="inherit"
                aria-controls={open ? 'prompt-methods-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={open ? handleClose : handleClick}
                sx={{
                    minWidth: '3rem',
                    margin: '0 0 0 0.5rem'
                }}
            >

                <VideoSettingsIcon />&nbsp;Output
            </Button>
            <Menu
                id="prompt-methods-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'open-prompt-methods-button',
                }}
            >
                <MenuItem onClick={handleSelect}
                    style={{
                        textAlign: 'right',
                    }}
                    value='text'>

                    {_promptMethods.includes('text') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Text</MenuItem>
                <MenuItem onClick={handleSelect} value='audio'>

                    {_promptMethods.includes('audio') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Audio</MenuItem>
                <MenuItem onClick={handleSelect} value='image'>

                    {_promptMethods.includes('image') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Image</MenuItem>
                <MenuItem onClick={handleSelect} value='writing'>

                    {_promptMethods.includes('writing') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Drawing</MenuItem>
                <MenuItem onClick={handleSelect} value='video'
                    style={{
                        textAlign: 'right',
                    }}
                >

                    {_promptMethods.includes('video') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    Video</MenuItem>
            </Menu>
        </>

        //     <MenuList dense open={open}>
        //         <MenuItem>
        //         {useVideos &&
        //         <ListItemIcon>
        //         <Check />
        //         </ListItemIcon>
        //         }
        //         <ListItemText primary="Videos" />
        //         </MenuItem>
        //     </MenuList>
        // </>
    );
};
