/**
 * MetadataEditor Component
 * 
 * A polished file metadata editor with:
 * - Lexical-powered text editing with unified undo/redo
 * - Character counters for all text fields
 * - Auto-save with debouncing
 * - Always-on editing mode
 * - Success/error feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Alert,
    Snackbar,
    FormHelperText,
    Divider,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createTextNode, $createLineBreakNode, $createParagraphNode, EditorState } from 'lexical';

interface MetadataEditorProps {
    file: any;
    onUpdate?: (file: any) => void;
    onClose?: () => void;
    autoSaveDelay?: number;
}

interface FormData {
    name: string;
    description: string;
    prompt: string;
    model: string;
    variant: string;
}

const CHAR_LIMITS = {
    name: 255,
    description: 1000,
    prompt: 2000,
    model: 50,
    variant: 50,
};

// Lexical field component with character counter
function LexicalField({
    label,
    value,
    onChange,
    maxLength,
    placeholder,
    multiline = false,
    helperText,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    placeholder?: string;
    multiline?: boolean;
    helperText?: string;
    required?: boolean;
}) {
    const charCount = value?.length || 0;
    const percentage = (charCount / maxLength) * 100;
    const color = percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'text.secondary';

    const initialConfig = {
        namespace: 'MetadataField',
        theme: {},
        onError: (error: Error) => console.error('Lexical error:', error),
        editorState: () => {
            const root = $getRoot();
            root.clear();
            if (value) {
                const paragraph = $createParagraphNode();
                const lines = value.split('\n');
                lines.forEach((line, i) => {
                    const textNode = $createTextNode(line);
                    paragraph.append(textNode);
                    if (i < lines.length - 1) {
                        paragraph.append($createLineBreakNode());
                    }
                });
                root.append(paragraph);
            }
        },
    };

    const handleChange = (editorState: EditorState) => {
        editorState.read(() => {
            const root = $getRoot();
            const text = root.getTextContent();
            if (text.length <= maxLength) {
                onChange(text);
            }
        });
    };

    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography 
                variant="caption" 
                sx={{ 
                    display: 'block', 
                    mb: 0.5, 
                    fontWeight: 500,
                    color: 'text.secondary' 
                }}
            >
                {label} {required && <span style={{ color: 'error.main' }}>*</span>}
            </Typography>
            <LexicalComposer initialConfig={initialConfig}>
                <Box sx={{ position: 'relative' }}>
                    <PlainTextPlugin
                            ErrorBoundary={LexicalErrorBoundary}
                            contentEditable={
                            <ContentEditable
                                style={{
                                    minHeight: multiline ? '80px' : '36px',
                                    padding: '8px 12px',
                                    border: '1px solid',
                                    borderColor: 'var(--mui-palette-divider, rgba(0, 0, 0, 0.23))',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    resize: multiline ? 'vertical' : 'none',
                                }}
                            />
                        }
                        placeholder={
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '12px',
                                    color: 'var(--mui-palette-text-disabled, rgba(0, 0, 0, 0.38))',
                                    pointerEvents: 'none',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {placeholder}
                            </div>
                        }
                    />
                    <HistoryPlugin />
                    <OnChangePlugin onChange={handleChange} />
                </Box>
            </LexicalComposer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 1.5 }}>
                {helperText && (
                    <FormHelperText>{helperText}</FormHelperText>
                )}
                <Typography 
                    variant="caption" 
                    color={color}
                    sx={{ ml: 'auto' }}
                >
                    {charCount}/{maxLength}
                </Typography>
            </Box>
        </Box>
    );
}

export default function MetadataEditor({
    file,
    onUpdate,
    autoSaveDelay = 2000,
}: MetadataEditorProps) {
    const { t } = useTranslation('editor.shared');
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: file.name || '',
        description: file.description || '',
        prompt: file.prompt || '',
        model: file.model || '',
        variant: file.variant || '',
    });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({ open: false, message: '', severity: 'info' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const initialData = useRef(formData);

    // Track changes for auto-save (only name and description are editable)
    useEffect(() => {
        const currentEditable = {
            name: formData.name,
            description: formData.description,
        };
        const initialEditable = {
            name: initialData.current.name,
            description: initialData.current.description,
        };
        const hasChanges = JSON.stringify(currentEditable) !== JSON.stringify(initialEditable);
        setHasUnsavedChanges(hasChanges);

        if (hasChanges) {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
            autoSaveTimer.current = setTimeout(() => {
                handleSave(true);
            }, autoSaveDelay);
        }

        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
        };
    }, [formData, autoSaveDelay]);

    const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = async (isAutoSave: boolean = false) => {
        if (!hasUnsavedChanges) return;
        
        setSaving(true);
        
        try {
            // In a real app, use DataStore.save with FileModel.copyOf
            // For now, just call the callback
            // Only save editable fields (name and description)
            const updatedFile = {
                ...file,
                name: formData.name,
                description: formData.description,
            };
            
            onUpdate?.(updatedFile);
            initialData.current = { ...initialData.current, name: formData.name, description: formData.description };
            setHasUnsavedChanges(false);
            
            setSnackbar({
                open: true,
                message: isAutoSave ? 'Auto-saved' : 'Saved successfully',
                severity: 'success',
            });
        } catch (error: any) {
            console.error('Error updating file:', error);
            setSnackbar({
                open: true,
                message: `Error saving: ${error.message}`,
                severity: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <Paper 
            elevation={2}
            sx={{ 
                p: 3, 
                backgroundColor: 'background.paper',
                borderRadius: 2,
                position: 'relative',
            }}
        >
            {saving && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
            
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('metadataEditor.fileMetadataHeading')}
                    </Typography>
                    {hasUnsavedChanges && (
                        <Chip 
                            label="Unsaved" 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                        />
                    )}
                    <Chip 
                        label="Auto-save" 
                        size="small" 
                        color="info" 
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* Form Fields with Lexical */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <LexicalField
                    label="File Name"
                    value={formData.name}
                    onChange={(value) => handleFieldChange('name', value)}
                    maxLength={CHAR_LIMITS.name}
                    placeholder="Enter file name..."
                    required
                />

                <LexicalField
                    label="Description"
                    value={formData.description}
                    onChange={(value) => handleFieldChange('description', value)}
                    maxLength={CHAR_LIMITS.description}
                    placeholder="Add a description for this file..."
                    multiline
                />

                {/* Read-only AI Generation Metadata */}
                {(formData.prompt || formData.model || formData.variant) && (
                    <Box sx={{ mb: 2.5 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('metadataEditor.aiGenerationInfo')}
                        </Typography>
                        
                        {formData.prompt && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                    {t('metadataEditor.promptLabel')}
                                </Typography>
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 1.5, 
                                        bgcolor: 'action.hover',
                                        fontSize: '0.875rem',
                                        fontFamily: 'inherit',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {formData.prompt}
                                </Paper>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {formData.model && (
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                        {t('metadataEditor.modelLabel')}
                                    </Typography>
                                    <Chip 
                                        label={formData.model} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace' }}
                                    />
                                </Box>
                            )}
                            {formData.variant && (
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                        {t('metadataEditor.variantLabel')}
                                    </Typography>
                                    <Chip 
                                        label={formData.variant} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace' }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Read-only File Information */}
                <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('metadataEditor.fileInfo')}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, mt: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('metadataEditor.typeLabel')}
                        </Typography>
                        <Typography variant="body2">
                            {file.mimeType || t('metadataEditor.unknown')}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('metadataEditor.sizeLabel')}
                        </Typography>
                        <Typography variant="body2">
                            {formatFileSize(file.size)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('metadataEditor.pathLabel')}
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {file.path || t('metadataEditor.notSet')}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('metadataEditor.protectionLabel')}
                        </Typography>
                        <Chip 
                            label={file.level || 'UNSET'} 
                            size="small" 
                            color={file.level === 'PUBLIC' ? 'success' : file.level === 'PROTECTED' ? 'warning' : 'default'}
                            sx={{ width: 'fit-content' }}
                        />

                        {file.createdAt && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {t('metadataEditor.createdLabel')}
                                </Typography>
                                <Typography variant="body2">
                                    {new Date(file.createdAt).toLocaleString()}
                                </Typography>
                            </>
                        )}

                        {file.updatedAt && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {t('metadataEditor.updatedLabel')}
                                </Typography>
                                <Typography variant="body2">
                                    {new Date(file.updatedAt).toLocaleString()}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Snackbar Feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    iconMapping={{
                        success: <CheckIcon fontSize="inherit" />,
                        error: <ErrorIcon fontSize="inherit" />,
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
}
