import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    TextField,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Unified modal for generate workflow that handles:
 * - Generate form input
 * - Preview of generated content
 * - Cancel confirmation
 * All within the same modal container
 */
export default function UnifiedGenerateModal({
    open,
    onClose,
    onGenerate,
    onRegenerate,
    title = 'Generate Content',
    inputPlaceholder = 'Enter description...',
    type = 'image', // 'image', 'audio', 'video'
    children, // Custom form inputs if needed
}) {
    const [mode, setMode] = useState('input'); // 'input', 'generating', 'preview', 'confirming-cancel'
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description');
            return;
        }

        setMode('generating');
        setError(null);

        try {
            const result = await onGenerate(prompt);
            setGeneratedContent(result);
            setMode('preview');
        } catch (err) {
            console.error('Generation error:', err);
            setError(err.message || 'Failed to generate content');
            setMode('input');
        }
    };

    const handleRegenerate = async (maskData = null) => {
        setMode('generating');
        setError(null);

        try {
            const result = await onRegenerate(prompt, generatedContent, maskData);
            setGeneratedContent(result);
            setMode('preview');
        } catch (err) {
            console.error('Regeneration error:', err);
            setError(err.message || 'Failed to regenerate content');
            setMode('preview');
        }
    };

    const handleEditPrompt = () => {
        setMode('input');
    };

    const handleClose = () => {
        if (mode === 'preview' || mode === 'generating') {
            setMode('confirming-cancel');
        } else if (mode === 'confirming-cancel') {
            setMode('preview');
        } else {
            resetAndClose();
        }
    };

    const handleConfirmCancel = () => {
        resetAndClose();
    };

    const resetAndClose = () => {
        setMode('input');
        setPrompt('');
        setGeneratedContent(null);
        setError(null);
        onClose();
    };

    const handleSave = () => {
        // The generated content is already saved via the onGenerate callback
        resetAndClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={mode === 'generating'}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{title}</Typography>
                    <IconButton
                        onClick={handleClose}
                        disabled={mode === 'generating'}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Input Mode */}
                {mode === 'input' && (
                    <Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={inputPlaceholder}
                            variant="outlined"
                            error={!!error}
                            helperText={error}
                            autoFocus
                            sx={{ mb: 2 }}
                        />
                        {children}
                    </Box>
                )}

                {/* Generating Mode */}
                {mode === 'generating' && (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="200px"
                    >
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography variant="body1">Generating {type}...</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            This may take a few moments
                        </Typography>
                    </Box>
                )}

                {/* Preview Mode */}
                {mode === 'preview' && generatedContent && (
                    <Box>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Preview
                            </Typography>
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={handleEditPrompt}
                                    title="Edit prompt"
                                >
                                    <EditIcon />
                                </IconButton>
                                {onRegenerate && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRegenerate()}
                                        title="Regenerate"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        {/* Display prompt */}
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                p: 1,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                fontStyle: 'italic',
                            }}
                        >
                            "{prompt}"
                        </Typography>

                        {/* Content preview */}
                        <Box
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden',
                            }}
                        >
                            {generatedContent.preview}
                        </Box>
                    </Box>
                )}

                {/* Cancel Confirmation Mode */}
                {mode === 'confirming-cancel' && (
                    <Box textAlign="center" py={3}>
                        <Typography variant="h6" gutterBottom>
                            Discard changes?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Your generated {type} will be lost if you cancel now.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                {/* Input Mode Actions */}
                {mode === 'input' && (
                    <>
                        <Button onClick={resetAndClose} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            variant="contained"
                            disabled={!prompt.trim()}
                        >
                            Generate
                        </Button>
                    </>
                )}

                {/* Generating Mode - No actions */}
                {mode === 'generating' && null}

                {/* Preview Mode Actions */}
                {mode === 'preview' && (
                    <>
                        <Button onClick={handleClose} color="inherit">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} variant="contained">
                            Save & Close
                        </Button>
                    </>
                )}

                {/* Confirmation Mode Actions */}
                {mode === 'confirming-cancel' && (
                    <>
                        <Button onClick={() => setMode('preview')} color="inherit">
                            Keep Editing
                        </Button>
                        <Button onClick={handleConfirmCancel} color="error" variant="contained">
                            Discard
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
