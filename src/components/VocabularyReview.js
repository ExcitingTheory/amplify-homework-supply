/**
 * VocabularyReview Component
 * Displays extracted vocabulary from ParsedContent for instructor review and import
 */

import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    TextField,
    Checkbox,
    Chip,
    LinearProgress,
    Alert,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Collapse,
} from '@mui/material';
import {
    Download as ImportIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DataStore } from 'aws-amplify/datastore';
import { ParsedContent, Document } from '../models';
import {
    importVocabularyToUnit,
    getVocabularyImportStatus,
    updateVocabularyItem,
} from '../utils/vocabularyImportUtils';
import DictionaryContext from '../context/dictionaryContext';

const VocabularyReview = ({ documentId, unitId, owner, identityId, onImportComplete }) => {
    const [parsedContent, setParsedContent] = useState(null);
    const [document, setDocument] = useState(null);
    const [vocabularyItems, setVocabularyItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({ word: '', definition: '', context: '', page: null });
    const [showSummaries, setShowSummaries] = useState(false);
    const [summaries, setSummaries] = useState([]);
    const [objectives, setObjectives] = useState([]);
    
    // Use DictionaryContext to access existing dictionary words
    const { dictionary, wordMapId } = useContext(DictionaryContext) || { dictionary: {}, wordMapId: {} };

    // Fetch ParsedContent and Document
    useEffect(() => {
        loadParsedContent();
        
        const subscription = DataStore.observeQuery(ParsedContent).subscribe(() => {
            loadParsedContent();
        });
        
        return () => subscription.unsubscribe();
    }, [documentId]);

    const loadParsedContent = async () => {
        try {
            setLoading(true);
            
            // Get document
            const doc = await DataStore.query(Document, documentId);
            setDocument(doc);
            
            // Get parsed content for this document
            const parsedContents = await DataStore.query(ParsedContent, (pc) =>
                pc.documentID.eq(documentId)
            );
            
            if (parsedContents.length > 0) {
                const content = parsedContents[0]; // Get the most recent
                setParsedContent(content);
                
                // Parse vocabulary
                const vocab = content.vocabularyJSON 
                    ? JSON.parse(content.vocabularyJSON) 
                    : [];
                setVocabularyItems(vocab);
                
                // Parse summaries
                const sums = content.summariesJSON 
                    ? JSON.parse(content.summariesJSON) 
                    : [];
                setSummaries(sums);
                
                // Parse objectives
                const objs = content.objectivesJSON 
                    ? JSON.parse(content.objectivesJSON) 
                    : [];
                setObjectives(objs);
                
                // Auto-select all items by default
                if (!content.importedAt) {
                    setSelectedItems(new Set(vocab.map((_, i) => i)));
                }
            }
        } catch (error) {
            console.error('Error loading parsed content:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const toggleAll = () => {
        if (selectedItems.size === vocabularyItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(vocabularyItems.map((_, i) => i)));
        }
    };

    const startEdit = (index) => {
        const item = vocabularyItems[index];
        setEditForm({
            word: item.word || '',
            definition: item.definition || '',
            context: item.context || '',
            page: item.page || null,
        });
        setEditingIndex(index);
    };

    const saveEdit = async () => {
        if (editingIndex === null) return;
        
        const success = await updateVocabularyItem(parsedContent.id, editingIndex, editForm);
        
        if (success) {
            // Update local state
            const newItems = [...vocabularyItems];
            newItems[editingIndex] = { ...newItems[editingIndex], ...editForm };
            setVocabularyItems(newItems);
            setEditingIndex(null);
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ word: '', definition: '', context: '', page: null });
    };

    const handleImport = async () => {
        if (!parsedContent || !unitId) {
            console.error('Missing parsedContent or unitId');
            return;
        }
        
        setImporting(true);
        setImportResult(null);
        
        const selectedIndices = Array.from(selectedItems);
        
        const result = await importVocabularyToUnit(
            parsedContent.id,
            unitId,
            selectedIndices,
            owner,
            identityId,
            (current, total, message) => {
                setImportProgress({ current, total, message });
            }
        );
        
        setImporting(false);
        setImportProgress(null);
        setImportResult(result);
        
        if (result.success && onImportComplete) {
            onImportComplete(result);
        }
        
        // Reload to show updated status
        loadParsedContent();
    };

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Loading vocabulary...
                </Typography>
            </Box>
        );
    }

    if (!parsedContent || vocabularyItems.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">
                    No vocabulary found for this document.
                </Alert>
            </Box>
        );
    }

    const alreadyImported = !!parsedContent.importedAt;

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Vocabulary Review
                </Typography>
                {document && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        From: {document.filename}
                        {document.pageCount && ` (${document.pageCount} pages)`}
                    </Typography>
                )}
                
                {alreadyImported && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        Imported on {new Date(parsedContent.importedAt).toLocaleString()}
                    </Alert>
                )}
            </Box>

            {/* Summaries & Objectives Toggle */}
            {(summaries.length > 0 || objectives.length > 0) && (
                <Box sx={{ mb: 2 }}>
                    <Button
                        size="small"
                        onClick={() => setShowSummaries(!showSummaries)}
                        endIcon={showSummaries ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {showSummaries ? 'Hide' : 'Show'} Summaries & Objectives
                    </Button>
                    <Collapse in={showSummaries}>
                        <Paper elevation={0} sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                            {summaries.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Summaries
                                    </Typography>
                                    {summaries.map((summary, i) => (
                                        <Box key={i} sx={{ mb: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {summary.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {summary.content}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            {objectives.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Learning Objectives
                                    </Typography>
                                    <List dense>
                                        {objectives.map((obj, i) => (
                                            <ListItem key={i} sx={{ py: 0.5 }}>
                                                <Typography variant="body2">
                                                    • {obj.objective}
                                                </Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Paper>
                    </Collapse>
                </Box>
            )}

            {/* Actions */}
            {!alreadyImported && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleAll}
                    >
                        {selectedItems.size === vocabularyItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {selectedItems.size} of {vocabularyItems.length} selected
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<ImportIcon />}
                        onClick={handleImport}
                        disabled={importing || selectedItems.size === 0}
                    >
                        Import to Dictionary
                    </Button>
                </Box>
            )}

            {/* Import Progress */}
            {importing && importProgress && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={(importProgress.current / importProgress.total) * 100} 
                    />
                    <Typography variant="body2" sx={{ mt: 0.5, textAlign: 'center' }}>
                        {importProgress.message}
                    </Typography>
                </Box>
            )}

            {/* Import Result */}
            {importResult && !importing && (
                <Alert 
                    severity={importResult.success ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                    onClose={() => setImportResult(null)}
                >
                    {importResult.message || 
                        `Imported ${importResult.imported} new words, ${importResult.skipped} already existed, ${importResult.errors} errors`}
                </Alert>
            )}

            {/* Vocabulary List */}
            <Paper elevation={1} sx={{ maxHeight: 500, overflow: 'auto' }}>
                <List>
                    {vocabularyItems.map((item, index) => {
                        const isSelected = selectedItems.has(index);
                        const isEditing = editingIndex === index;
                        
                        // Check if word already exists in dictionary
                        const existsInDictionary = dictionary && Object.values(dictionary).some(
                            word => word.phrase?.toLowerCase().trim() === item.word?.toLowerCase().trim()
                        );
                        
                        return (
                            <React.Fragment key={index}>
                                <ListItem
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        bgcolor: isSelected ? 'action.selected' : 'inherit',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                        {!alreadyImported && (
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => toggleItem(index)}
                                                disabled={importing}
                                            />
                                        )}
                                        
                                        {isEditing ? (
                                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <TextField
                                                    label="Word"
                                                    size="small"
                                                    fullWidth
                                                    value={editForm.word}
                                                    onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                                                />
                                                <TextField
                                                    label="Definition"
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={editForm.definition}
                                                    onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                                                />
                                                <TextField
                                                    label="Context"
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={editForm.context}
                                                    onChange={(e) => setEditForm({ ...editForm, context: e.target.value })}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button size="small" variant="contained" onClick={saveEdit}>
                                                        Save
                                                    </Button>
                                                    <Button size="small" onClick={cancelEdit}>
                                                        Cancel
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {item.word}
                                                    </Typography>
                                                    {item.page && (
                                                        <Chip label={`Page ${item.page}`} size="small" />
                                                    )}
                                                    {existsInDictionary && (
                                                        <Chip 
                                                            label="Already in Dictionary" 
                                                            size="small" 
                                                            color="info"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    {item.definition}
                                                </Typography>
                                                {item.context && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        Context: "{item.context}"
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                        
                                        {!alreadyImported && !isEditing && (
                                            <IconButton
                                                size="small"
                                                onClick={() => startEdit(index)}
                                                disabled={importing}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < vocabularyItems.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    })}
                </List>
            </Paper>
        </Box>
    );
};

export default VocabularyReview;
