import * as React from 'react';
import {
    Menu,
    MenuItem, ListItemIcon
} from '@mui/material';
import Button from '@mui/material/Button';
import { Check } from '@mui/icons-material';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import InputIcon from '@mui/icons-material/Input';
import { useTranslation } from 'next-i18next';

export const AllowedInputSelector = React.memo(({
    ids, defaultAllowedInputs = ['text', 'audio'], allowedInput = [], setAllowedInput,
    // wordIDs,
}) => {
    const { t } = useTranslation('editor.ai');
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_allowedInputs, setAllowedInputs] = React.useState(allowedInput.length > 0 ? allowedInput : defaultAllowedInputs);
    const open = Boolean(anchorEl);

    // Sync external allowedInput prop with internal state
    React.useEffect(() => {
        if (allowedInput && allowedInput.length > 0) {
            const newAllowedInputString = JSON.stringify(allowedInput);
            const currentAllowedInputString = JSON.stringify(_allowedInputs);
            if (newAllowedInputString !== currentAllowedInputString) {
                setAllowedInputs(allowedInput);
            }
        }
    }, [allowedInput]);

    // Removed the useEffect that was causing infinite loop
    // Only update parent when menu closes

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setAllowedInput(_allowedInputs);
    };

    const handleSelect = (event) => {
        const value = event.target.getAttribute('value');
        const mergeInputs = _allowedInputs.includes(value) ? _allowedInputs.filter((x) => x !== value) : [..._allowedInputs, value];
        setAllowedInputs(mergeInputs);
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

                <InputIcon />&nbsp;{t('promptMethodSelector.inputButton')}
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
                    {t('promptMethodSelector.menuItems.text')}</MenuItem>
                <MenuItem onClick={handleSelect} value='audio'>

                    {_allowedInputs.includes('audio') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.audio')}</MenuItem>
                <MenuItem onClick={handleSelect} value='image'>

                    {_allowedInputs.includes('image') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.image')}</MenuItem>
                <MenuItem onClick={handleSelect} value='writing'>

                    {_allowedInputs.includes('writing') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.drawing')}</MenuItem>
                <MenuItem onClick={handleSelect} value='video'
                    style={{
                        textAlign: 'right',
                    }}
                >

                    {_allowedInputs.includes('video') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.video')}</MenuItem>
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
});
export const PromptMethodSelector = React.memo(({
    ids, defaultPromptMethods = ['text', 'audio', 'writing'], promptMethod = [], setPromptMethod,
    // wordIDs,
}) => {
    const { t } = useTranslation('editor.ai');
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [_promptMethods, setPromptMethods] = React.useState(promptMethod.length > 0 ? promptMethod : []);
    const open = Boolean(anchorEl);

    // Sync external promptMethod prop with internal state
    React.useEffect(() => {
        if (promptMethod && promptMethod.length > 0) {
            const newMethodsStr = JSON.stringify(promptMethod);
            const currentMethodsStr = JSON.stringify(_promptMethods);
            if (newMethodsStr !== currentMethodsStr) {
                setPromptMethods(promptMethod);
            }
        }
    }, [promptMethod]);

    // if the working methods change, update the promptMethod
    // React.useEffect(() => {
    //     console.log('useEffect._promptMethods', _promptMethods);
    //     setPromptMethod(_promptMethods);
    // }, [JSON.stringify(_promptMethods)]);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setPromptMethod(_promptMethods);
    };

    const handleSelect = (event) => {
        const value = event.target.getAttribute('value');
        const mergeMethods = _promptMethods.includes(value) ? _promptMethods.filter((x) => x !== value) : [..._promptMethods, value];
        setPromptMethods(mergeMethods);
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

                <VideoSettingsIcon />&nbsp;{t('promptMethodSelector.outputButton')}
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
                    {t('promptMethodSelector.menuItems.text')}</MenuItem>
                <MenuItem onClick={handleSelect} value='audio'>

                    {_promptMethods.includes('audio') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.audio')}</MenuItem>
                <MenuItem onClick={handleSelect} value='image'>

                    {_promptMethods.includes('image') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.image')}</MenuItem>
                <MenuItem onClick={handleSelect} value='writing'>

                    {_promptMethods.includes('writing') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.drawing')}</MenuItem>
                <MenuItem onClick={handleSelect} value='video'
                    style={{
                        textAlign: 'right',
                    }}
                >

                    {_promptMethods.includes('video') &&
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>}
                    {t('promptMethodSelector.menuItems.video')}</MenuItem>
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
});
