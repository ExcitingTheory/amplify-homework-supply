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
import { ParsedContent, Word, Question, Document, QuestionUnit, DocumentWord, DocumentQuestion, UnitWord } from '../../../models';

/**
 * Component to display and approve suggested vocabulary from parsed documents
 */
export function SuggestedVocabulary({ documentId, unitId, onImport }) {
    const [parsedContent, setParsedContent] = useState(null);
    const [document, setDocument] = useState(null);
    const [vocabulary, setVocabulary] = useState([]);
    const [selectedWords, setSelectedWords] = useState(new Set());
    const [importedWords, setImportedWords] = useState(new Set()); // Track which words are already imported
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
                const contents = await DataStore.query(ParsedContent, c => c.documentID.eq(documentId));
                if (contents.length > 0) {
                    const content = contents[0];
                    setParsedContent(content);
                    
                    // Parse vocabulary JSON
                    try {
                        const vocabArray = content.vocabularyJSON || [];
                        setVocabulary(vocabArray);
                        
                        // Check which words are already imported by looking for DocumentWord links
                        const imported = new Set();
                        for (const item of vocabArray) {
                            // First find words with this phrase
                            const existingWords = await DataStore.query(Word, w => w.phrase.eq(item.word));
                            
                            // Then check if any are linked to this document via DocumentWord
                            for (const word of existingWords) {
                                const docWordLinks = await DataStore.query(DocumentWord, dw => 
                                    dw.and(dw => [
                                        dw.wordId.eq(word.id),
                                        dw.documentId.eq(documentId)
                                    ])
                                );
                                if (docWordLinks.length > 0) {
                                    imported.add(item.word);
                                    break;
                                }
                            }
                        }
                        setImportedWords(imported);
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
            c => c.documentID.eq(documentId)
        ).subscribe(({ items }) => {
            if (items.length > 0) {
                const content = items[0];
                setParsedContent(content);
                
                try {
                    const vocabArray = content.vocabularyJSON || [];
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
                // Check if word already exists from this document via DocumentWord link
                const existingWords = await DataStore.query(Word, w => w.phrase.eq(wordData.word));
                
                let wordAlreadyLinked = false;
                for (const word of existingWords) {
                    const docWordLinks = await DataStore.query(DocumentWord, dw => 
                        dw.and(dw => [
                            dw.wordId.eq(word.id),
                            dw.documentId.eq(documentId)
                        ])
                    );
                    if (docWordLinks.length > 0) {
                        wordAlreadyLinked = true;
                        break;
                    }
                }

                if (wordAlreadyLinked) {
                    skipped++;
                    continue;
                }

                // Create new word
                const newWord = await DataStore.save(new Word({
                    phrase: wordData.word,
                    definition: wordData.definition,
                    pronunciation: wordData.word, // Use word as pronunciation if not provided
                    importedAt: new Date().toISOString(),
                }));

                // Link word to document via DocumentWord
                await DataStore.save(new DocumentWord({
                    word: newWord,
                    document: document
                }));

                // Link word to unit via UnitWord if unitId provided
                if (unitId) {
                    const { Unit } = await import('../../../models');
                    const unit = await DataStore.query(Unit, unitId);
                    if (unit) {
                        await DataStore.save(new UnitWord({
                            word: newWord,
                            unit: unit
                        }));
                    }
                }

                // Add to imported set
                setImportedWords(prev => new Set([...prev, wordData.word]));
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

    const notImportedCount = vocabulary.filter(item => !importedWords.has(item.word)).length;

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
                
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                        label={`${vocabulary.length} total words`} 
                        size="small" 
                        color="default"
                    />
                    <Chip 
                        label={`${importedWords.size} already imported`} 
                        size="small" 
                        color="success"
                    />
                    <Chip 
                        label={`${notImportedCount} not yet imported`} 
                        size="small" 
                        color="primary"
                    />
                </Box>
            </Box>

            {/* Actions */}
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
                    const isImported = importedWords.has(item.word);

                    return (
                        <SuggestedWordItem
                            key={index}
                            item={item}
                            index={index}
                            selected={isSelected}
                            isEditing={isEditing}
                            isImported={isImported}
                            editForm={editForm}
                            setEditForm={setEditForm}
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
    isImported,
    editForm,
    setEditForm,
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
                bgcolor: selected ? 'action.selected' : isImported ? 'success.50' : 'inherit',
                '&:hover': { bgcolor: 'action.hover' },
                borderBottom: '1px solid #eee',
                borderLeft: isImported ? '3px solid' : 'none',
                borderLeftColor: 'success.main',
                py: 1,
                px: 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 0.5 }}>
                <Checkbox
                    checked={selected}
                    onChange={onToggle}
                    disabled={importing}
                    sx={{ p: 0.5 }}
                />
                
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                                <Typography 
                                    variant="subtitle2" 
                                    fontWeight="bold"
                                    sx={{
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'normal'
                                    }}
                                >
                                    {item.word}
                                </Typography>
                                {isImported && (
                                    <Chip 
                                        label="Imported" 
                                        size="small" 
                                        color="success"
                                        sx={{ height: 18, fontSize: '0.65rem', flexShrink: 0 }}
                                    />
                                )}
                            </Box>
                            {!isImported && (
                                <IconButton size="small" onClick={onEdit} sx={{ p: 0.5, flexShrink: 0 }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                        
                        {!expanded && (
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal'
                                }}
                            >
                                {item.definition}
                            </Typography>
                        )}
                        
                        {item.page && (
                            <Chip label={`Page ${item.page}`} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                        )}
                    </Box>
                )}

                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ p: 0.5, flexShrink: 0 }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            
            <Collapse in={expanded && !isEditing} sx={{ width: '100%', pl: 5, pt: 0.5 }}>
                <Box sx={{ py: 0.5 }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mb: 1,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal'
                        }}
                    >
                        <strong>Definition:</strong> {item.definition}
                    </Typography>
                    {item.context && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                fontStyle: 'italic', 
                                mb: 1,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal'
                            }}
                        >
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
    const [importedQuestions, setImportedQuestions] = useState(new Set()); // Track which questions are imported
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
                const contents = await DataStore.query(ParsedContent, c => c.documentID.eq(documentId));
                if (contents.length > 0) {
                    const content = contents[0];
                    setParsedContent(content);
                    
                    // Parse questions JSON
                    try {
                        const questionsArray = content.questionsJSON || [];
                        setQuestions(questionsArray);
                        
                        // Check which questions are already imported by looking for DocumentQuestion links
                        const imported = new Set();
                        for (let i = 0; i < questionsArray.length; i++) {
                            const item = questionsArray[i];
                            // First find questions with this prompt
                            const existingQuestions = await DataStore.query(Question, q => q.prompt.eq(item.prompt));
                            
                            // Then check if any are linked to this document via DocumentQuestion
                            for (const question of existingQuestions) {
                                const docQuestionLinks = await DataStore.query(DocumentQuestion, dq => 
                                    dq.and(dq => [
                                        dq.questionId.eq(question.id),
                                        dq.documentId.eq(documentId)
                                    ])
                                );
                                if (docQuestionLinks.length > 0) {
                                    imported.add(i);
                                    break;
                                }
                            }
                        }
                        setImportedQuestions(imported);
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
            c => c.documentID.eq(documentId)
        ).subscribe(({ items }) => {
            if (items.length > 0) {
                const content = items[0];
                setParsedContent(content);
                
                try {
                    const questionsArray = content.questionsJSON || [];
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
        let skipped = 0;
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
                // Check if question already exists from this document via DocumentQuestion link
                const existingQuestions = await DataStore.query(Question, q => q.prompt.eq(questionData.prompt));
                
                let questionAlreadyLinked = false;
                for (const question of existingQuestions) {
                    const docQuestionLinks = await DataStore.query(DocumentQuestion, dq => 
                        dq.and(dq => [
                            dq.questionId.eq(question.id),
                            dq.documentId.eq(documentId)
                        ])
                    );
                    if (docQuestionLinks.length > 0) {
                        questionAlreadyLinked = true;
                        break;
                    }
                }

                if (questionAlreadyLinked) {
                    skipped++;
                    continue;
                }

                // Create the question
                const newQuestion = await DataStore.save(new Question({
                    prompt: questionData.prompt,
                    answer: questionData.answer || '',
                    hint: questionData.hint || '',
                    importedAt: new Date().toISOString(),
                    difficulty: questionData.difficulty || 'medium',
                    questionType: questionData.questionType || 'comprehension',
                    metadata: JSON.stringify(questionData.metadata || {}),
                }));

                // Link question to document via DocumentQuestion
                await DataStore.save(new DocumentQuestion({
                    question: newQuestion,
                    document: document
                }));

                // Link question to unit via QuestionUnit if unitId provided
                if (unitId) {
                    const { Unit } = await import('../../../models');
                    const unit = await DataStore.query(Unit, unitId);
                    if (unit) {
                        await DataStore.save(new QuestionUnit({
                            question: newQuestion,
                            unit: unit
                        }));
                    }
                }

                // Add to imported set
                setImportedQuestions(prev => new Set([...prev, index]));
                imported++;
            } catch (error) {
                console.error('Error importing question:', error);
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

    const notImportedCount = questions.filter((_, i) => !importedQuestions.has(i)).length;

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
                
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                        label={`${questions.length} total questions`} 
                        size="small" 
                        color="default"
                    />
                    <Chip 
                        label={`${importedQuestions.size} already imported`} 
                        size="small" 
                        color="success"
                    />
                    <Chip 
                        label={`${notImportedCount} not yet imported`} 
                        size="small" 
                        color="primary"
                    />
                </Box>
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
                    {importResult.skipped > 0 && ` Skipped ${importResult.skipped} duplicates.`}
                    {importResult.errors > 0 && ` ${importResult.errors} errors.`}
                </Alert>
            )}

            {/* Questions List */}
            <List sx={{ width: '100%' }}>
                {questions.map((item, index) => {
                    const isImported = importedQuestions.has(index);
                    return (
                        <SuggestedQuestionItem
                            key={index}
                            item={item}
                            index={index}
                            selected={selectedQuestions.has(index)}
                            isImported={isImported}
                            importing={importing}
                            onToggle={() => toggleQuestion(index)}
                        />
                    );
                })}
            </List>
        </Box>
    );
}

function SuggestedQuestionItem({ item, index, selected, isImported, importing, onToggle }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <ListItem
            sx={{
                borderBottom: '1px solid #eee',
                backgroundColor: selected ? 'action.selected' : isImported ? 'success.50' : 'inherit',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderLeft: isImported ? '3px solid' : 'none',
                borderLeftColor: 'success.main',
                py: 1,
                px: 1,
            }}
        >
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 0.5 }}>
                <Checkbox
                    checked={selected}
                    onChange={onToggle}
                    disabled={importing}
                    sx={{ p: 0.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                        <Typography 
                            variant="subtitle2" 
                            fontWeight="medium" 
                            sx={{ 
                                flex: 1, 
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal'
                            }}
                        >
                            {item.prompt}
                        </Typography>
                        {isImported && (
                            <Chip 
                                label="Imported" 
                                size="small" 
                                color="success"
                                sx={{ height: 18, fontSize: '0.65rem', flexShrink: 0 }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {item.difficulty && (
                            <Chip
                                label={item.difficulty}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                        )}
                        {item.questionType && (
                            <Chip
                                label={item.questionType}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                        )}
                    </Box>
                </Box>
                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ p: 0.5, flexShrink: 0 }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <Collapse in={expanded} sx={{ width: '100%', pl: 5 }}>
                <Box sx={{ py: 0.5 }}>
                    {item.answer && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mb: 1,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal'
                            }}
                        >
                            <strong>Answer:</strong> {item.answer}
                        </Typography>
                    )}
                    {item.hint && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                fontStyle: 'italic',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal'
                            }}
                        >
                            <strong>Hint:</strong> {item.hint}
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </ListItem>
    );
}
