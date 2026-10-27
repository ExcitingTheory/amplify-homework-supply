/**
 * QuestionsReview2 Component
 * 
 * Enhanced questions review panel with:
 * - Lexical-powered inline editing with unified undo/redo
 * - Virtual scrolling for large lists (TanStack Virtual)
 * - Search term highlighting
 * - Auto-save with debouncing
 * - Polished card design with badges and shadows
 * - Better expand/collapse affordances
 * - Import state indicators
 */

import React, { useReducer, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    Checkbox,
    Chip,
    LinearProgress,
    Alert,
    Collapse,
    Tooltip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import {
    Download as ImportIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Mic as MicIcon,
    Image as ImageIcon,
    Info as InfoIcon,
    QuestionAnswer as QuestionIcon,
} from '@mui/icons-material';
import { getParsedContentModeration } from '../utils/parsedContentModeration';
import { toEntryList } from '../utils/parsedContentLists';
import { useDocumentParsedContent } from '../hooks/useDocumentParsedContent';
import { useDocumentLinks } from '../hooks/useDocumentLinks';
import { questionEntryKey } from '../utils/documentLinks';
import DictionaryContext from '../context/dictionaryContext';
import { importQuestionsToUnit, updateQuestionItem } from '../utils/questionImportUtils';

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkNode } from '@lexical/mark';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import SearchHighlightPlugin from './Editor3/plugins/SearchHighlightPlugin';

// Virtual scrolling
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    importReviewReducer,
    createInitialImportReviewState,
} from './importReviewReducer';
import type { ImportReviewAction, ImportResult } from './importReviewReducer';

export interface QuestionItem {
    prompt: string;
    answer: string;
    hint?: string;
    questionType?: 'essay' | 'short_answer' | 'comprehension' | 'multiple_choice';
    difficulty?: 'easy' | 'medium' | 'hard';
    page?: number;
    hasAudio?: boolean;
    hasImage?: boolean;
    // Source tracking
    documentID?: string;
    fileID?: string;
    filename?: string;
    // True when this document already imported the question into the bank
    alreadyImported?: boolean;
    // Detail of the source link, when known (see useItemSources)
    sourceText?: string;
    extraSources?: number;
}

interface QuestionsReview2Props {
    documentId: string;
    unitId: string;
    owner: string;
    identityId: string;
    onImportComplete?: (result: any) => void;
    searchTerm?: string;
}

// =============================================================================
// NestedQuestionField - Individual field editor with Lexical + search highlighting
// =============================================================================

interface NestedQuestionFieldProps {
    value: string;
    field: 'prompt' | 'answer' | 'hint';
    itemIndex: number;
    onSave: (index: number, field: string, newValue: string) => Promise<void>;
    searchTerm?: string;
    label?: string;
    placeholder?: string;
    multiline?: boolean;
    autoFocus?: boolean;
}

function NestedQuestionField({
    value,
    field,
    itemIndex,
    onSave,
    searchTerm = '',
    label = '',
    placeholder = '',
    multiline = false,
}: NestedQuestionFieldProps) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const initialConfig = {
        namespace: `QuestionField-${field}-${itemIndex}`,
        nodes: [MarkNode],
        theme: {
            mark: 'search-highlight',
        },
        onError: (error: Error) => console.error('Lexical error:', error),
        editorState: () => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            const text = $createTextNode(value || '');
            paragraph.append(text);
            root.append(paragraph);
        },
    };

    const handleChange = (editorState: any) => {
        editorState.read(() => {
            const text = $getRoot().getTextContent();

            // Debounced save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                if (text !== value) {
                    await onSave(itemIndex, field, text);
                }
            }, 1000);
        });
    };

    return (
        <Box sx={{ mb: multiline ? 1.5 : 0.5, width: '100%' }}>
            {label && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 500 }}>
                    {label}
                </Typography>
            )}
            <LexicalComposer initialConfig={initialConfig}>
                <Box sx={{ position: 'relative' }}>
                    <PlainTextPlugin
                        ErrorBoundary={LexicalErrorBoundary}
                        contentEditable={
                            <ContentEditable
                                contentEditable={true}
                                aria-label={label || placeholder || field}
                                style={{
                                    minHeight: multiline ? '80px' : '24px',
                                    padding: multiline ? '8px' : '4px 8px',
                                    border: '1px solid var(--mui-palette-divider, rgba(0, 0, 0, 0.12))',
                                    borderRadius: '4px',
                                    fontSize: field === 'prompt' ? '1rem' : '0.875rem',
                                    fontFamily: 'inherit',
                                    fontWeight: field === 'prompt' ? 500 : 400,
                                    outline: 'none',
                                    resize: multiline ? 'vertical' : 'none',
                                    backgroundColor: 'background.paper',
                                    cursor: 'text',
                                }}
                            />
                        }
                        placeholder={
                            placeholder ? (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: multiline ? '8px' : '4px',
                                        left: '8px',
                                        color: 'var(--mui-palette-text-disabled, rgba(0, 0, 0, 0.38))',
                                        pointerEvents: 'none',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {placeholder}
                                </div>
                            ) : null
                        }
                    />
                    <HistoryPlugin />
                    <OnChangePlugin onChange={handleChange} />
                    <SearchHighlightPlugin searchTerm={searchTerm} />
                </Box>
            </LexicalComposer>
        </Box>
    );
}

// =============================================================================
// QuestionCard - Individual question item with Lexical editing
// =============================================================================

export interface QuestionCardProps {
    item: QuestionItem;
    index: number;
    isSelected: boolean;
    isExpanded: boolean;
    existsInQuestionBank: boolean;
    alreadyImported: boolean;
    searchTerm?: string;
    onToggleSelect: (index: number) => void;
    onToggleExpand: (index: number) => void;
    onUpdate: (index: number, field: string, value: string) => Promise<void>;
}

export function QuestionCard({
    item,
    index,
    isSelected,
    isExpanded,
    existsInQuestionBank,
    alreadyImported,
    searchTerm = '',
    onToggleSelect,
    onToggleExpand,
    onUpdate,
}: QuestionCardProps) {
    const t = useTranslations('components');
    const isEvenRow = index % 2 === 0;

    return (
        <ListItem
            sx={{
                backgroundColor: isEvenRow ? 'background.paper' : 'action.hover',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 0,
                margin: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
                transition: 'box-shadow 0.2s ease',
                '&:hover': {
                    backgroundColor: isEvenRow ? 'action.selected' : 'action.focus',
                    boxShadow: 1,
                },
            }}
        >
            {/* Header with controls */}
            <Box
                onClick={(e) => {
                    // Don't expand if clicking checkbox
                    if ((e.target as HTMLElement).closest('.MuiCheckbox-root')) return;
                    if (!isExpanded) onToggleExpand(index);
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: 'space-between',
                    padding: 1,
                    borderBottom: isExpanded ? '1px solid' : 'none',
                    borderColor: 'divider',
                    cursor: isExpanded ? 'default' : 'pointer',
                }}
            >
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    {!alreadyImported && (
                        <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => onToggleSelect(index)}
                            sx={{ p: 0.5 }}
                            className="MuiCheckbox-root"
                            inputProps={{ 'aria-label': t('questionsReview.selectQuestion', { index: index + 1 }) } as any}
                        />
                    )}
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(index);
                        }}
                        sx={{ p: 0.5 }}
                        aria-label={isExpanded ? t('questionsReview.collapse') : t('questionsReview.expand')}
                    >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {!isExpanded ? (
                            <Box 
                                onClick={(e) => e.stopPropagation()} 
                                sx={{ 
                                    fontSize: '0.875rem',
                                    flex: 1,
                                }}
                            >
                                <NestedQuestionField
                                    value={item.prompt || ''}
                                    field="prompt"
                                    itemIndex={index}
                                    onSave={onUpdate}
                                    searchTerm={searchTerm}
                                />
                            </Box>
                        ) : null}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                    {item.filename && (
                        <Tooltip
                            title={
                                t('questionsReview.sourceTooltip', { filename: item.filename }) +
                                (item.sourceText ? ` - "${item.sourceText}"` : '')
                            }
                        >
                            <Chip 
                                label={item.filename.length > 20 ? `${item.filename.slice(0, 17)}...` : item.filename}
                                size="small" 
                                variant="outlined"
                                color="primary"
                                sx={{ fontSize: '0.65rem', height: '20px', maxWidth: '150px' }}
                            />
                        </Tooltip>
                    )}
                    {!!item.extraSources && (
                        <Chip
                            label={`+${item.extraSources}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                    )}
                    {item.alreadyImported && (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label={t('questionsReview.alreadyImported')}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                    )}
                    {item.page && (
                        <Chip 
                            label={`p.${item.page}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                    )}
                    {item.hasAudio && (
                        <Tooltip title={t('questionsReview.hasAudio')}>
                            <MicIcon fontSize="small" color="primary" aria-label={t('questionsReview.hasAudio')} />
                        </Tooltip>
                    )}
                    {item.hasImage && (
                        <Tooltip title={t('questionsReview.hasImage')}>
                            <ImageIcon fontSize="small" color="secondary" aria-label={t('questionsReview.hasImage')} />
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Expanded content - Editable fields */}
            {isExpanded && (
                <Box sx={{ p: 2, pt: 1.5 }}>
                    <NestedQuestionField
                        value={item.prompt || ''}
                        field="prompt"
                        itemIndex={index}
                        onSave={onUpdate}
                        searchTerm={searchTerm}
                        label={t('questionsReview.questionPrompt')}
                        placeholder={t('questionsReview.enterQuestion')}
                        multiline
                    />

                    {item.hint !== undefined && (
                        <NestedQuestionField
                            value={item.hint || ''}
                            field="hint"
                            itemIndex={index}
                            onSave={onUpdate}
                            searchTerm={searchTerm}
                            label={t('questionsReview.hintOptional')}
                            placeholder={t('questionsReview.enterHint')}
                            multiline
                        />
                    )}

                    <NestedQuestionField
                        value={item.answer || ''}
                        field="answer"
                        itemIndex={index}
                        onSave={onUpdate}
                        searchTerm={searchTerm}
                        label={t('questionsReview.answer')}
                        placeholder={t('questionsReview.enterAnswer')}
                        multiline
                    />
                </Box>
            )}
        </ListItem>
    );
}

// =============================================================================
// QuestionsReview2 - Main component with virtual scrolling
// =============================================================================

const QuestionsReview2: React.FC<QuestionsReview2Props> = ({
    documentId,
    unitId,
    owner,
    identityId,
    onImportComplete,
    searchTerm = '',
}) => {
    const t = useTranslations('components');

    const [state, dispatch] = useReducer(
        importReviewReducer<QuestionItem>,
        undefined,
        () => createInitialImportReviewState<QuestionItem>()
    );
    const {
        parsedContent,
        document,
        items: questionItems,
        selectedItems,
        expandedItems,
        loading,
        importStatus,
        importProgress,
        importResult,
        showSummaries,
        summaries,
        objectives,
    } = state;
    const importing = importStatus === 'importing';
    const moderation = getParsedContentModeration(document);
    
    // Use DictionaryContext to access existing questions
    const { questionBank } = useContext(DictionaryContext) || { questionBank: {} };

    // Refs for virtual scrolling
    const parentRef = useRef<HTMLDivElement>(null);

    // Filter question items by search term
    const filteredQuestions = useMemo(() => {
        if (!searchTerm) return questionItems;
        
        const lowerSearch = searchTerm.toLowerCase();
        return questionItems.filter((item) => {
            return (
                item.prompt?.toLowerCase().includes(lowerSearch) ||
                item.answer?.toLowerCase().includes(lowerSearch) ||
                item.hint?.toLowerCase().includes(lowerSearch)
            );
        });
    }, [questionItems, searchTerm]);

    // Virtual scrolling setup
    // estimateSize returns a stable collapsed-row height;
    // measureElement's ResizeObserver handles actual sizing on expand/collapse
    const virtualizer = useVirtualizer({
        count: filteredQuestions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    // The document's chunks, loaded page by page and kept current without
    // reloading: this changes only when a chunk's _version actually changes.
    const {
        parsedContent: content,
        document: doc,
        state: loadState,
        loadingMore,
        refresh,
    } = useDocumentParsedContent(documentId);
    // Which of those questions this document already imported
    const {
        importedKeys,
        loaded: linksLoaded,
        refresh: refreshLinks,
    } = useDocumentLinks(documentId, 'question');
    const hasLoaded = useRef(false);

    useEffect(() => {
        hasLoaded.current = false;
        dispatch({ type: 'LOAD_START' });
    }, [documentId]);

    useEffect(() => {
        // Wait for the links too, so nothing is pre-selected and then deselected
        if (loadState === 'loading' || !linksLoaded) return;
        if (!content) {
            dispatch({ type: 'LOAD_ERROR' });
            return;
        }

        const questions = toEntryList<QuestionItem>(content.questionsJSON);

        // Enrich questions with source metadata
        const enrichedQuestions = questions.map((q: QuestionItem) => ({
            ...q,
            documentID: content.documentID as string,
            fileID: (content.fileID as string | null | undefined) || undefined,
            filename: doc?.filename || undefined,
            alreadyImported: importedKeys.has(questionEntryKey(q.prompt)),
        }));

        dispatch({
            type: hasLoaded.current ? 'CONTENT_UPDATED' : 'LOAD_SUCCESS',
            parsedContent: content,
            document: doc,
            items: enrichedQuestions,
            summaries: toEntryList(content.summariesJSON),
            objectives: toEntryList(content.objectivesJSON),
            autoSelectAll: true,
        });
        hasLoaded.current = true;
    }, [content, doc, loadState, linksLoaded, importedKeys]);

    const pendingCount = useMemo(
        () => questionItems.filter((item) => !item.alreadyImported).length,
        [questionItems],
    );

    const toggleItem = useCallback((index: number) => {
        dispatch({ type: 'TOGGLE_SELECT', index });
    }, []);

    const toggleExpand = useCallback((index: number) => {
        dispatch({ type: 'TOGGLE_EXPAND', index });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedItems.size === pendingCount) {
            dispatch({ type: 'DESELECT_ALL' });
        } else {
            dispatch({ type: 'SELECT_ALL', count: questionItems.length });
        }
    }, [selectedItems.size, pendingCount, questionItems.length]);

    const handleUpdate = useCallback(async (index: number, field: string, newValue: string) => {
        if (!parsedContent) return;
        
        const updates = { [field]: newValue };
        const success = await updateQuestionItem(parsedContent.id, index, updates);
        
        if (success) {
            const updated = { ...questionItems[index], ...updates } as QuestionItem;
            dispatch({ type: 'UPDATE_ITEM', index, item: updated });
        }
    }, [parsedContent, questionItems]);

    const handleImport = useCallback(async () => {
        if (!parsedContent || !unitId) {
            console.error('Missing parsedContent or unitId');
            return;
        }
        if (moderation.blocked) {
            console.error(
                moderation.error || 'Moderation flagged this document; import is blocked',
            );
            return;
        }
        
        dispatch({ type: 'IMPORT_START' });
        
        const selectedIndices = Array.from(selectedItems);
        
        const result = await importQuestionsToUnit(
            parsedContent.id,
            unitId,
            selectedIndices,
            owner,
            identityId,
            (current: number, total: number, message: string) => {
                dispatch({ type: 'IMPORT_PROGRESS', progress: { current, total, message } });
            }
        ) as ImportResult;
        
        if (result.success) {
            dispatch({ type: 'IMPORT_SUCCESS', result });
            onImportComplete?.(result);
        } else {
            dispatch({ type: 'IMPORT_ERROR', result });
        }
        
        // Fetch again to show the updated status
        refresh();
        refreshLinks();
    }, [parsedContent, unitId, selectedItems, owner, identityId, onImportComplete, refresh, refreshLinks, moderation.blocked, moderation.error]);

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {t('questionsReview.loading')}
                </Typography>
            </Box>
        );
    }

    if (!parsedContent || questionItems.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info" icon={<QuestionIcon />}>
                    {t('questionsReview.noQuestions')}
                </Alert>
            </Box>
        );
    }

    // Entries are marked one by one, so a later page of a partly imported
    // document can still be imported.
    const hasPending = pendingCount > 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {loadingMore && (
                <LinearProgress aria-label={t('questionsReview.loading')} sx={{ flexShrink: 0 }} />
            )}
            {/* Header */}
            <Box sx={{ p: 2, flexShrink: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('questionsReview.sectionHeading')}
                </Typography>
                {document && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('questionsReview.from')}: {document.filename}
                        {document.pageCount && ` (${document.pageCount} ${t('questionsReview.pages')})`}
                    </Typography>
                )}

                {moderation.blocked && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        {moderation.error
                            ? t('moderationPanel.alertMessage')
                            : moderation.categories.length > 0
                                ? t('moderationBadge.flaggedWithCategories', {
                                    categories: moderation.categories.join(', '),
                                })
                                : t('moderationPanel.alertMessage')}
                    </Alert>
                )}
                
                {!hasPending && parsedContent.importedAt && (
                    <Alert severity="success" sx={{ mt: 1 }} icon={<CheckCircleIcon />}>
                        {t('questionsReview.importedOn', { date: new Date(parsedContent.importedAt).toLocaleString() })}
                    </Alert>
                )}
                
                {searchTerm && (
                    <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
                        {t('questionsReview.filteringBySearch', { 
                            searchTerm, 
                            count: filteredQuestions.length, 
                            total: questionItems.length 
                        })}
                    </Alert>
                )}
            </Box>

            {/* Summaries & Objectives Toggle */}
            {(summaries.length > 0 || objectives.length > 0) && (
                <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
                    <Button
                        size="small"
                        onClick={() => dispatch({ type: 'TOGGLE_SUMMARIES' })}
                        endIcon={showSummaries ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        variant="outlined"
                    >
                        {showSummaries ? t('questionsReview.hide') : t('questionsReview.show')} {t('questionsReview.summariesAndObjectives')}
                    </Button>
                    <Collapse in={showSummaries}>
                        <Paper elevation={0} sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                            {summaries.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                        {t('questionsReview.summaries')}
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
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                        {t('questionsReview.learningObjectives')}
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
            {hasPending && (
                <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleAll}
                    >
                        {selectedItems.size === pendingCount ? t('questionsReview.deselectAll') : t('questionsReview.selectAll')}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {t('questionsReview.selectedCount', { count: selectedItems.size, total: pendingCount })}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<ImportIcon />}
                        onClick={handleImport}
                        disabled={moderation.blocked || importing || selectedItems.size === 0}
                    >
                        {t('questionsReview.importToQuestionBank')}
                    </Button>
                </Box>
            )}

            {/* Import Progress */}
            {importing && importProgress && (
                <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
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
                <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
                    <Alert 
                        severity={importResult.success ? 'success' : 'error'} 
                        onClose={() => dispatch({ type: 'CLEAR_IMPORT_RESULT' })}
                    >
                        {importResult.message || 
                            `Imported ${importResult.imported} new questions, ${importResult.skipped} already existed, ${importResult.errors} errors`}
                    </Alert>
                </Box>
            )}

            {/* Questions List with Virtual Scrolling */}
            <Paper 
                ref={parentRef}
                elevation={2}
                sx={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    mx: 2,
                    mb: 2,
                }}
            >
                <List
                    sx={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                        padding: 0,
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const item = filteredQuestions[virtualItem.index];
                        const existsInQuestionBank = questionBank && Object.values(questionBank).some(
                            (q: any) => q.prompt?.toLowerCase().trim() === item.prompt?.toLowerCase().trim()
                        );
                        
                        return (
                            <Box
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <QuestionCard
                                    item={item}
                                    index={virtualItem.index}
                                    isSelected={selectedItems.has(virtualItem.index)}
                                    isExpanded={expandedItems.has(virtualItem.index)}
                                    existsInQuestionBank={existsInQuestionBank}
                                    alreadyImported={!!item.alreadyImported}
                                    searchTerm={searchTerm}
                                    onToggleSelect={toggleItem}
                                    onToggleExpand={toggleExpand}
                                    onUpdate={handleUpdate}
                                />
                            </Box>
                        );
                    })}
                </List>
            </Paper>
        </Box>
    );
};

export default QuestionsReview2;
