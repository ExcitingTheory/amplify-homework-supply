/**
 * Manual Save component.
 * Provides a manual save button for users to force immediate save.
 * Also handles beforeunload to save when closing tab.
 * Note: Automatic debounced saving is handled by MyOnChangePlugin in index.js
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

export function Save() {
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const {
        saveEditorContent,
        editorStateRef,
        unit
    } = useContext(UnitContext);

    // Save on page close/refresh as safety net
    React.useEffect(() => {
        const handleBeforeUnload = async (event) => {
            const content = JSON.stringify(editorStateRef.current);
            const unitContent = JSON.stringify(unit?.data || {});
            
            if (content !== unitContent) {
                console.log('[Save] Saving before unload');
                await saveEditorContent();
                event.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, [unit?.data, editorStateRef, saveEditorContent]);

    const handleManualSave = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        
        try {
            const response = await saveEditorContent();
            console.log('[Save] Manual save completed:', response);
            
            if (response === false) {
                setSaveMessage('Error: You do not have permission to edit this unit.');
            } else {
                setSaveMessage('Saved successfully');
            }
        } catch (error) {
            console.error('[Save] Manual save failed:', error);
            setSaveMessage('Save failed');
        } finally {
            setTimeout(() => {
                setIsSaving(false);
            }, 1000);
        }
    };

    return (
        <>
            <Snackbar
                open={saveMessage !== ''}
                autoHideDuration={3000}
                onClose={() => setSaveMessage('')}
                message={saveMessage}
                style={{ zIndex: 2000000000 }}
                sx={{ zIndex: 2000000000 }}
            />
            <Button
                disabled={isSaving}
                color='inherit'
                size='small'
                sx={{
                    minWidth: '3rem'
                }}
                onClick={handleManualSave}
                title="Save now (automatic save happens 2 seconds after you stop typing)"
            >
                <SaveIcon />
            </Button>
        </>
    );
}