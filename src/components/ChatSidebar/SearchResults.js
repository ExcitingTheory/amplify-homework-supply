import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Button,
    Tooltip,
    CircularProgress,
    ButtonGroup,
} from '@mui/material';
import {
    Description as FileIcon,
    Translate as WordIcon,
    Quiz as QuestionIcon,
    Add as AddIcon,
    Edit as EditIcon,
    OpenInNew as OpenIcon,
    AddBox as InsertIcon,
} from '@mui/icons-material';
import { DataStore } from 'aws-amplify/datastore';
import { Unit, UnitWord, QuestionUnit } from '../../models';

/**
 * Display search results from the search_content tool
 * 
 * @param {Array} results - Search results to display
 * @param {string} unitId - Current unit ID for linking
 * @param {object} tabHandlers - Tab management functions
 * @param {Function} tabHandlers.setLeftTab - Set left sidebar tab
 * @param {Function} tabHandlers.setLeftOpen - Open/close left sidebar
 * @param {Function} tabHandlers.setRightOpen - Open/close right sidebar
 * @param {Function} onInsertWord - Callback to insert word into editor
 * @param {Function} onInsertQuestion - Callback to insert question into editor
 * @param {Function} onFocusItem - Callback when item needs focus (type, id)
 */
export default function SearchResults({ 
    results, 
    unitId, 
    tabHandlers = {},
    onInsertWord,
    onInsertQuestion,
    onFocusItem
}) {
    const [linkingStates, setLinkingStates] = React.useState({});
    const { setLeftTab, setLeftOpen, setRightOpen } = tabHandlers;

    // Tab indices (from useTabState defaults and typical setup)
    const TAB_INDICES = {
        FILES: 4,
        DICTIONARY: 3,
        QUESTIONS: 2,
    };

    const handleOpenFile = (file) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.FILES);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('file', file.id);
            }
        }
    };

    const handleOpenWord = (word) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.DICTIONARY);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('word', word.id);
            }
        }
    };

    const handleOpenQuestion = (question) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.QUESTIONS);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('question', question.id);
            }
        }
    };

    const handleLinkToUnit = async (item, itemType) => {
        if (!unitId) {
            console.warn('[SearchResults] No unit ID provided, cannot link');
            return;
        }

        const key = `${itemType}-${item.id}`;
        setLinkingStates(prev => ({ ...prev, [key]: 'loading' }));

        try {
            const unit = await DataStore.query(Unit, unitId);
            if (!unit) {
                throw new Error('Unit not found');
            }

            if (itemType === 'word') {
                // Check if already linked
                const existing = await DataStore.query(UnitWord, uw =>
                    uw.and(uw => [
                        uw.unitID.eq(unitId),
                        uw.wordID.eq(item.id)
                    ])
                );

                if (existing.length > 0) {
                    setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
                    return;
                }

                // Create link
                await DataStore.save(new UnitWord({
                    unitID: unitId,
                    wordID: item.id
                }));

                setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
            } else if (itemType === 'question') {
                // Check if already linked
                const existing = await DataStore.query(QuestionUnit, uq =>
                    uq.and(uq => [
                        uq.unitID.eq(unitId),
                        uq.questionID.eq(item.id)
                    ])
                );

                if (existing.length > 0) {
                    setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
                    return;
                }

                // Create link
                await DataStore.save(new QuestionUnit({
                    unitID: unitId,
                    questionID: item.id
                }));

                setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
            }

            console.log(`[SearchResults] Linked ${itemType} ${item.id} to unit ${unitId}`);
        } catch (error) {
            console.error('[SearchResults] Error linking to unit:', error);
            setLinkingStates(prev => ({ ...prev, [key]: 'error' }));
        }
    };

    const renderFileResult = (file) => {
        const key = `file-${file.id}`;
        const similarity = file.similarity ? (file.similarity * 100).toFixed(0) : 'N/A';

        return (
            <Box
                key={file.id}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <FileIcon sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {file.name}
                    </Typography>
                    {file.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {file.description.substring(0, 80)}...
                        </Typography>
                    )}
                    {file.page && (
                        <Chip label={`Page ${file.page}`} size="small" sx={{ mt: 0.5 }} />
                    )}
                </Box>
                <Chip label={`${similarity}%`} size="small" color="primary" />
                <Tooltip title="Open file">
                    <IconButton
                        size="small"
                        onClick={() => handleOpenFile(file)}
                    >
                        <OpenIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    };

    const renderWordResult = (word) => {
        const key = `word-${word.id}`;
        const similarity = word.similarity ? (word.similarity * 100).toFixed(0) : 'N/A';
        const linkState = linkingStates[key];

        return (
            <Box
                key={word.id}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <WordIcon sx={{ color: 'secondary.main' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {word.phrase}
                        {word.phonetic && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                ({word.phonetic})
                            </Typography>
                        )}
                    </Typography>
                    {word.definition && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {word.definition}
                        </Typography>
                    )}
                </Box>
                <Chip label={`${similarity}%`} size="small" color="secondary" />
                <ButtonGroup size="small" variant="outlined">
                    {onInsertWord && (
                        <Tooltip title="Insert into editor">
                            <IconButton
                                size="small"
                                onClick={() => onInsertWord(word)}
                                color="primary"
                            >
                                <InsertIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {unitId && (
                        <Tooltip title={linkState === 'linked' ? 'Linked to unit' : 'Add to unit'}>
                            <IconButton
                                size="small"
                                onClick={() => handleLinkToUnit(word, 'word')}
                                disabled={linkState === 'loading' || linkState === 'linked'}
                                color={linkState === 'linked' ? 'success' : 'default'}
                            >
                                {linkState === 'loading' ? (
                                    <CircularProgress size={16} />
                                ) : linkState === 'linked' ? (
                                    <AddIcon fontSize="small" />
                                ) : (
                                    <AddIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Edit word">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenWord(word)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>
            </Box>
        );
    };

    const renderQuestionResult = (question) => {
        const key = `question-${question.id}`;
        const similarity = question.similarity ? (question.similarity * 100).toFixed(0) : 'N/A';
        const linkState = linkingStates[key];

        return (
            <Box
                key={question.id}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <QuestionIcon sx={{ color: 'info.main' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {question.prompt}
                    </Typography>
                    {question.answer && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Answer: {question.answer.substring(0, 80)}
                            {question.answer.length > 80 && '...'}
                        </Typography>
                    )}
                </Box>
                <Chip label={`${similarity}%`} size="small" color="info" />
                <ButtonGroup size="small" variant="outlined">
                    {onInsertQuestion && (
                        <Tooltip title="Insert into editor">
                            <IconButton
                                size="small"
                                onClick={() => onInsertQuestion(question)}
                                color="primary"
                            >
                                <InsertIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {unitId && (
                        <Tooltip title={linkState === 'linked' ? 'Linked to unit' : 'Add to unit'}>
                            <IconButton
                                size="small"
                                onClick={() => handleLinkToUnit(question, 'question')}
                                disabled={linkState === 'loading' || linkState === 'linked'}
                                color={linkState === 'linked' ? 'success' : 'default'}
                            >
                                {linkState === 'loading' ? (
                                    <CircularProgress size={16} />
                                ) : linkState === 'linked' ? (
                                    <AddIcon fontSize="small" />
                                ) : (
                                    <AddIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Edit question">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenQuestion(question)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>
            </Box>
        );
    };

    if (!results || results.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No results found
            </Typography>
        );
    }

    // Group results by type
    const fileResults = results.filter(r => r.type === 'file');
    const wordResults = results.filter(r => r.type === 'word');
    const questionResults = results.filter(r => r.type === 'question');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {fileResults.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', mb: 1, display: 'block' }}>
                        Files ({fileResults.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {fileResults.map(renderFileResult)}
                    </Box>
                </Box>
            )}

            {wordResults.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main', mb: 1, display: 'block' }}>
                        Vocabulary ({wordResults.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {wordResults.map(renderWordResult)}
                    </Box>
                </Box>
            )}

            {questionResults.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', mb: 1, display: 'block' }}>
                        Questions ({questionResults.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {questionResults.map(renderQuestionResult)}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
