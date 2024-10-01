/**
 * Autosave component.
 * This component is used in the Editor2 component.
 * It is used to save the content of the editor to the database.
 * It is used to display a message to the user that the content is being saved.
 */
import React from 'react';
import {
    useState,
    useContext,
} from 'react';
import Button from '@mui/material/Button';
import UnitContext from '../../../context/unitContext';

import SaveIcon from '@mui/icons-material/Save';

import Snackbar from '@mui/material/Snackbar';


export function AutoSave() {
    const [work, setIsWorking] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const {
        saveEditorContent,
        editorStateRef,
        unit
    } = useContext(UnitContext);

    React.useEffect(() => {
        const handleBeforeUnload = async (event) => {
            const content = JSON.stringify(editorStateRef.current);
            const unitContent = JSON.stringify(unit.data);
            console.log('unitContent', unitContent)
            if (content === unitContent) {
                console.log('content === unitContent')
            } else {
                console.log('content !== unitContent')
                await saveEditorContent();
                event.preventDefault();
                
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, [unit?.data, editorStateRef.current]);

    return (
        <>
        <Snackbar
          open={saveMessage !== ''}
          autoHideDuration={6000}
          onClose={() => setSaveMessage('')}
          message={saveMessage}
        />
        <Button
            disabled={work}
            color='inherit'
            size='small'
            sx={{
                minWidth: '3rem'
            }}
            onClick={async (event) => {
                event.preventDefault()
                setIsWorking(true)                
                const response = await saveEditorContent()
                console.log('saveEditorContent', response)
                if (response === false) {
                    alert('Error saving content, you do not have permission to edit this unit.')
                }
                setTimeout(() => {
                    setIsWorking(false)
                }, 1000);

            }}>
            <SaveIcon />
        </Button>
        </>
    )
}