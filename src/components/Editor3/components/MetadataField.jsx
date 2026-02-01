/**
 * MetadataField Component
 * 
 * Reusable component for editing metadata fields with Lexical editor
 * Follows the VocabularyReview2 pattern for inline editing with auto-save
 * 
 * Used in:
 * - FileManager2 (file metadata)
 * - DictionaryEditor2 (word metadata)
 * - QuestionEditor2 (question metadata)
 */

import React from 'react';
import {
    Box,
    TextField,
    Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

/**
 * MetadataField - Individual metadata field editor with optional Lexical support
 */
function MetadataField({
    label,
    value,
    field,
    onSave,
    placeholder = '',
    multiline = false,
    disabled = false,
    required = false,
    variant = 'standard',
}) {
    const { t } = useTranslation('editor.shared');
    const [localValue, setLocalValue] = React.useState(value);
    const [isDraft, setIsDraft] = React.useState(false);
    const saveTimeoutRef = React.useRef(null);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        // Mark as draft if value changed
        if (newValue !== value) {
            setIsDraft(true);
        }

        // Debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (newValue !== value && !disabled) {
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await onSave(field, newValue);
                    setIsDraft(false);
                } catch (error) {
                    console.error(`Error saving ${field}:`, error);
                }
            }, 1000);
        }
    };

    React.useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Box sx={{ mb: 1.5, width: '100%' }}>
            {label && (
                <Typography 
                    variant="caption" 
                    color={isDraft ? 'warning.main' : 'text.secondary'}
                    sx={{ 
                        display: 'block', 
                        mb: 0.5, 
                        fontWeight: 500 
                    }}
                >
                    {label}
                    {required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                    {isDraft && <span style={{ marginLeft: '4px' }}>({t('metadataField.unsavedChanges')})</span>}
                </Typography>
            )}
            <TextField
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                multiline={multiline}
                rows={multiline ? 2 : 1}
                size="small"
                fullWidth
                variant={variant}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: isDraft ? 'warning.50' : 'background.paper',
                        borderColor: isDraft ? 'warning.main' : 'divider',
                    },
                    '&:hover .MuiOutlinedInput-root': {
                        backgroundColor: isDraft ? 'warning.50' : 'background.paper',
                    },
                }}
            />
        </Box>
    );
}

export default MetadataField;
