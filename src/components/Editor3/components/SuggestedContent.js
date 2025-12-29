import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Checkbox,
    Button,
    Chip,
    Divider,
    Collapse,
    Alert,
    LinearProgress,
    TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { DataStore } from 'aws-amplify/datastore';
import { ParsedContent, Word, Question, Document } from '../../../models';

/**
 * Component to display and approve suggested vocabulary from parsed documents
 */
export function SuggestedVocabulary({ documentId, unitId, onImport }) {
    const [parsedContent, setParsedContent] = useState(null);
    const [document, setDocument] = useState(null);
    const [vocabulary, setVocabulary] = useState([]);
    const [selectedWords, setSelectedWords] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({ word: '', definition: '', context: '', page: null });

    useEffect(() => {
        if (!documentId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Load parsed content
                const contents = await DataStore.query(ParsedContent, c => c.DocumentID.eq(documentId));
                if (contents.length > 0) {
                    const content = contents[0];
                    setParsedContent(content);
                    
                    // Parse vocabulary JSON
                    try {
                        const vocabArray = content.vocabularyJSON ? JSON.parse(content.vocabularyJSON) : [];
                        setVocabulary(vocabArray);
                    } catch (error) {
                        console.error('Error parsing vocabulary JSON:', error);
                    }
                }

                // Load document info
                const docs = await DataStore.query(Document, documentId);
                if (docs) {
                    setDocument(docs);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const subscription = DataStore.observeQuery(
            ParsedContent,
            c => c.DocumentID.eq(documentId)
        ).subscribe(({ items }) => {
            if (items.length > 0) {
                const content = items[0];
                setParsedContent(content);
                
                try {
                    const vocabArray = content.vocabularyJSON ? JSON.parse(content.vocabularyJSON) : [];
                    setVocabulary(vocabArray);
                } catch (error) {
                    console.error('Error parsing vocabulary JSON:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [documentId]);

    const toggleWord = (index) => {
        const newSelected = new Set(selectedWords);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedWords(newSelected);
    };

    const toggleAll = () => {
        if (selectedWords.size === vocabulary.length) {
            setSelectedWords(new Set());
        } else {
            setSelectedWords(new Set(vocabulary.map((_, i) => i)));
        }
    };

    const startEdit = (index) => {
        const item = vocabulary[index];
        setEditForm({
            word: item.word || '',
            definition: item.definition || '',
            context: item.context || '',
            page: item.page || null,
        });
        setEditingIndex(index);
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        
        const updatedVocab = [...vocabulary];
        updatedVocab[editingIndex] = {
            ...updatedVocab[editingIndex],
            ...editForm
        };
        setVocabulary(updatedVocab);
        setEditingIndex(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ word: '', definition: '', context: '', page: null });
    };

    const importSelected = async () => {
        setImporting(true);
        setImportResult(null);
        
        const selectedIndices = Array.from(selectedWords);
        const total = selectedIndices.length;
        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < selectedIndices.length; i++) {
            const index = selectedIndices[i];
            const wordData = vocabulary[index];
            
            setImportProgress({
                current: i + 1,
                total,
                message: `Importing "${wordData.word}"...`
            });

            try {
                // Check if word already exists
                const existingWords = await DataStore.query(Word, w => 
                    w.phrase.eq(wordData.word)
                );

                if (existingWords.length > 0) {
                    skipped++;
                    continue;
                }

                // Create new word
                await DataStore.save(new Word({
                    phrase: wordData.word,
                    definition: wordData.definition,
                    pronunciation: wordData.word, // Use word as pronunciation if not provided
                    unitID: unitId,
                    sourceDocumentID: documentId,
                    approved: true,
                    importedAt: new Date().toISOString(),
                }));

                imported++;
            } catch (error) {
                console.error('Error importing word:', error);
                errors++;
            }
        }

        setImportProgress(null);
        setImportResult({
            imported,
            skipped,
            errors,
            total
        });

        // Mark as imported
        if (imported > 0 && parsedContent) {
            try {
                await DataStore.save(
                    ParsedContent.copyOf(parsedContent, updated => {
                        updated.importedAt = new Date().toISOString();
                    })
                );
            } catch (error) {
                console.error('Error updating import status:', error);
            }
        }

        setImporting(false);
        setSelectedWords(new Set());

        if (onImport) {
            onImport(imported);
        }
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

    if (!vocabulary || vocabulary.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">
                    No vocabulary suggestions available. Upload a document to extract vocabulary.
                </Alert>
            </Box>
        );
    }

    const alreadyImported = !!parsedContent?.importedAt;

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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

            {/* Actions */}
            {!alreadyImported && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleAll}
                        disabled={importing}
                    >
                        {selectedWords.size === vocabulary.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        disabled={selectedWords.size === 0 || importing}
                        onClick={importSelected}
                    >
                        Import Selected ({selectedWords.size})
                    </Button>
                </Box>
            )}

            {/* Import Progress */}
            {importProgress && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={(importProgress.current / importProgress.total) * 100} 
                    />
                    <Typography variant="body2" sx={{ mt: 0.5, textAlign: 'center' }}>
                        {importProgress.message} ({importProgress.current}/{importProgress.total})
                    </Typography>
                </Box>
            )}

            {/* Import Result */}
            {importResult && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportResult(null)}>
                    Imported {importResult.imported} words. 
                    {importResult.skipped > 0 && ` Skipped ${importResult.skipped} duplicates.`}
                    {importResult.errors > 0 && ` ${importResult.errors} errors.`}
                </Alert>
            )}

            {/* Vocabulary List */}
            <List sx={{ width: '100%' }}>
                {vocabulary.map((item, index) => {
                    const isSelected = selectedWords.has(index);
                    const isEditing = editingIndex === index;

                    return (
                        <SuggestedWordItem
                            key={index}
                            item={item}
                            index={index}
                            selected={isSelected}
                            isEditing={isEditing}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            alreadyImported={alreadyImported}
                            importing={importing}
                            onToggle={() => toggleWord(index)}
                            onEdit={() => startEdit(index)}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                        />
                    );
                })}
            </List>
        </Box>
    );
}

function SuggestedWordItem({ 
    item, 
    index, 
    selected, 
    isEditing, 
    editForm,
    setEditForm,
    alreadyImported,
    importing,
    onToggle, 
    onEdit,
    onSave,
    onCancel
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <ListItem
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                bgcolor: selected ? 'action.selected' : 'inherit',
                '&:hover': { bgcolor: 'action.hover' },
                borderBottom: '1px solid #eee',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                {!alreadyImported && (
                    <Checkbox
                        checked={selected}
                        onChange={onToggle}
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
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button 
                                size="small" 
                                variant="contained" 
                                startIcon={<SaveIcon />}
                                onClick={onSave}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {item.word}
                            </Typography>
                            {!alreadyImported && (
                                <IconButton size="small" onClick={onEdit}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                        
                        {!expanded && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {item.definition}
                            </Typography>
                        )}
                        
                        {item.page && (
                            <Chip label={`Page ${item.page}`} size="small" sx={{ mt: 0.5 }} />
                        )}
                    </Box>
                )}

                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ ml: 1 }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            
            <Collapse in={expanded && !isEditing} sx={{ width: '100%', pl: alreadyImported ? 0 : 6, pt: 1 }}>
                <Box sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Definition:</strong> {item.definition}
                    </Typography>
                    {item.context && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                            <strong>Context:</strong> "{item.context}"
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </ListItem>
    );
}

/**
 * Component to display and approve suggested questions from parsed documents
 */
export function SuggestedQuestions({ documentId, unitId, onImport }) {
    const [parsedContent, setParsedContent] = useState(null);
    const [document, setDocument] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        if (!documentId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Load parsed content
                const contents = await DataStore.query(ParsedContent, c => c.DocumentID.eq(documentId));
                if (contents.length > 0) {
                    const content = contents[0];
                    setParsedContent(content);
                    
                    // Parse questions JSON
                    try {
                        const questionsArray = content.questionsJSON ? JSON.parse(content.questionsJSON) : [];
                        setQuestions(questionsArray);
                    } catch (error) {
                        console.error('Error parsing questions JSON:', error);
                    }
                }

                // Load document info
                const docs = await DataStore.query(Document, documentId);
                if (docs) {
                    setDocument(docs);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const subscription = DataStore.observeQuery(
            ParsedContent,
            c => c.DocumentID.eq(documentId)
        ).subscribe(({ items }) => {
            if (items.length > 0) {
                const content = items[0];
                setParsedContent(content);
                
                try {
                    const questionsArray = content.questionsJSON ? JSON.parse(content.questionsJSON) : [];
                    setQuestions(questionsArray);
                } catch (error) {
                    console.error('Error parsing questions JSON:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [documentId]);

    const toggleQuestion = (index) => {
        const newSelected = new Set(selectedQuestions);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedQuestions(newSelected);
    };

    const toggleAll = () => {
        if (selectedQuestions.size === questions.length) {
            setSelectedQuestions(new Set());
        } else {
            setSelectedQuestions(new Set(questions.map((_, i) => i)));
        }
    };

    const importSelected = async () => {
        setImporting(true);
        setImportResult(null);
        
        const selectedIndices = Array.from(selectedQuestions);
        const total = selectedIndices.length;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < selectedIndices.length; i++) {
            const index = selectedIndices[i];
            const questionData = questions[index];
            
            setImportProgress({
                current: i + 1,
                total,
                message: `Importing question ${i + 1}...`
            });

            try {
                await DataStore.save(new Question({
                    prompt: questionData.prompt,
                    answer: questionData.answer || '',
                    hint: questionData.hint || '',
                    unitID: unitId,
                    sourceDocumentID: documentId,
                    approved: true,
                    importedAt: new Date().toISOString(),
                    difficulty: questionData.difficulty || 'medium',
                    questionType: questionData.questionType || 'comprehension',
                    metadata: JSON.stringify(questionData.metadata || {}),
                }));

                imported++;
            } catch (error) {
                console.error('Error importing question:', error);
                errors++;
            }
        }

        setImportProgress(null);
        setImportResult({
            imported,
            errors,
            total
        });

        setImporting(false);
        setSelectedQuestions(new Set());

        if (onImport) {
            onImport(imported);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Loading questions...
                </Typography>
            </Box>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">
                    No question suggestions available. Upload a document to generate questions.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Questions Review
                </Typography>
                {document && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        From: {document.filename}
                    </Typography>
                )}
            </Box>

            {/* Actions */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={toggleAll}
                    disabled={importing}
                >
                    {selectedQuestions.size === questions.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    disabled={selectedQuestions.size === 0 || importing}
                    onClick={importSelected}
                >
                    Import Selected ({selectedQuestions.size})
                </Button>
            </Box>

            {/* Import Progress */}
            {importProgress && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={(importProgress.current / importProgress.total) * 100} 
                    />
                    <Typography variant="body2" sx={{ mt: 0.5, textAlign: 'center' }}>
                        {importProgress.message} ({importProgress.current}/{importProgress.total})
                    </Typography>
                </Box>
            )}

            {/* Import Result */}
            {importResult && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportResult(null)}>
                    Imported {importResult.imported} questions.
                    {importResult.errors > 0 && ` ${importResult.errors} errors.`}
                </Alert>
            )}

            {/* Questions List */}
            <List sx={{ width: '100%' }}>
                {questions.map((item, index) => (
                    <SuggestedQuestionItem
                        key={index}
                        item={item}
                        index={index}
                        selected={selectedQuestions.has(index)}
                        importing={importing}
                        onToggle={() => toggleQuestion(index)}
                    />
                ))}
            </List>
        </Box>
    );
}

function SuggestedQuestionItem({ item, index, selected, importing, onToggle }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <ListItem
            sx={{
                borderBottom: '1px solid #eee',
                backgroundColor: selected ? 'action.selected' : 'inherit',
                flexDirection: 'column',
                alignItems: 'flex-start',
            }}
        >
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                <Checkbox
                    checked={selected}
                    onChange={onToggle}
                    disabled={importing}
                    sx={{ mr: 1, mt: 0.5 }}
                />
                <Box sx={{ flex: 1 }}>
                    <ListItemText
                        primary={item.prompt}
                        secondary={
                            <Box sx={{ mt: 0.5 }}>
                                {item.difficulty && (
                                    <Chip
                                        label={item.difficulty}
                                        size="small"
                                        sx={{ mr: 0.5 }}
                                    />
                                )}
                                {item.questionType && (
                                    <Chip
                                        label={item.questionType}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        }
                        sx={{
                            '& .MuiListItemText-primary': {
                                fontWeight: 'medium',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                            }
                        }}
                    />
                </Box>
                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <Collapse in={expanded} sx={{ width: '100%', pl: 6 }}>
                <Box sx={{ py: 1 }}>
                    {item.answer && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Answer:</strong> {item.answer}
                        </Typography>
                    )}
                    {item.hint && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            <strong>Hint:</strong> {item.hint}
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </ListItem>
    );
}
