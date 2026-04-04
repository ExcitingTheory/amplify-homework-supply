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

import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
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
import { useTranslation } from 'next-i18next';
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
import { getAmplifyClient } from '../utils/amplifyClient';
import { ParsedContent, Document } from '../models';
import DictionaryContext from '../context/dictionaryContext';

// Placeholder functions until utils are created
const importQuestionsToUnit = async (...args: any[]): Promise<any> => {
    console.log('importQuestionsToUnit called with:', args);
    return { success: true, imported: 0, skipped: 0, errors: 0 };
};

const updateQuestionItem = async (...args: any[]): Promise<boolean> => {
    console.log('updateQuestionItem called with:', args);
    return true;
};

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

export interface QuestionItem {
    prompt: string;
    answer: string;
    hint?: string;
    type?: 'essay' | 'short_answer' | 'comprehension' | 'multiple_choice';
    difficulty?: 'easy' | 'medium' | 'hard';
    page?: number;
    hasAudio?: boolean;
    hasImage?: boolean;
    // Source tracking
    documentID?: string;
    fileID?: string;
    filename?: string;
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
                                style={{
                                    minHeight: multiline ? '80px' : '24px',
                                    padding: multiline ? '8px' : '4px 8px',
                                    border: '1px solid rgba(0, 0, 0, 0.12)',
                                    borderRadius: '4px',
                                    fontSize: field === 'prompt' ? '1rem' : '0.875rem',
                                    fontFamily: 'inherit',
                                    fontWeight: field === 'prompt' ? 500 : 400,
                                    outline: 'none',
                                    resize: multiline ? 'vertical' : 'none',
                                    backgroundColor: '#fff',
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
                                        color: 'rgba(0, 0, 0, 0.38)',
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
    const { t } = useTranslation('components');
    const isEvenRow = index % 2 === 0;

    return (
        <ListItem
            sx={{
                backgroundColor: isEvenRow ? 'background.paper' : 'grey.50',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 0,
                margin: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: 'action.hover',
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
                        />
                    )}
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(index);
                        }}
                        sx={{ p: 0.5 }}
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
                        <Tooltip title={`Source: ${item.filename}`}>
                            <Chip 
                                label={item.filename.length > 20 ? `${item.filename.slice(0, 17)}...` : item.filename}
                                size="small" 
                                variant="outlined"
                                color="primary"
                                sx={{ fontSize: '0.65rem', height: '20px', maxWidth: '150px' }}
                            />
                        </Tooltip>
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
                            <MicIcon fontSize="small" color="primary" aria-label="audio" />
                        </Tooltip>
                    )}
                    {item.hasImage && (
                        <Tooltip title={t('questionsReview.hasImage')}>
                            <ImageIcon fontSize="small" color="secondary" aria-label="image" />
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Expanded content - Editable fields */}
            {isExpanded && (
                <Box sx={{ p: 2, pt: 1.5 }}>
                    <NestedQuestionField
                        value={item.prompt}
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
                        value={item.answer}
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
    const { t } = useTranslation('components');
    const [parsedContent, setParsedContent] = useState<any>(null);
    const [document, setDocument] = useState<any>(null);
    const [questionItems, setQuestionItems] = useState<QuestionItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<any>(null);
    const [importResult, setImportResult] = useState<any>(null);
    const [showSummaries, setShowSummaries] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [objectives, setObjectives] = useState<any[]>([]);
    
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
    const virtualizer = useVirtualizer({
        count: filteredQuestions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: useCallback((index: number) => {
            return expandedItems.has(index) ? 400 : 60;
        }, [expandedItems]),
        overscan: 5,
    });

    // Fetch ParsedContent and Document
    useEffect(() => {
        loadParsedContent();
        
        const client = getAmplifyClient();
        const subscription = client.models.ParsedContent.observeQuery().subscribe({
            next: ({ items }) => {
                // Filter out null items that can appear during subscription updates
                const validItems = items.filter((item: any) => item != null && item.id != null);
                loadParsedContent();
            },
            error: (error: any) => console.error('[QuestionsReview2] ParsedContent subscription error:', error)
        });
        
        return () => subscription.unsubscribe();
    }, [documentId]);

    const loadParsedContent = async () => {
        try {
            setLoading(true);
            
            const client = getAmplifyClient();
            // Get document
            const { data: doc } = await client.models.Document.get({ id: documentId });
            setDocument(doc);
            
            // Get parsed content for this document
            const { data: parsedContents } = await client.models.ParsedContent.list({
                filter: { documentID: { eq: documentId } }
            });
            
            if (parsedContents.length > 0) {
                const content = parsedContents[0];
                setParsedContent(content);
                
                // Parse questions - handle both string and object formats
                const questions = (() => {
                    if (!content.questionsJSON) return [];
                    if (typeof content.questionsJSON === 'string') {
                        try {
                            return JSON.parse(content.questionsJSON);
                        } catch (e) {
                            console.error('Error parsing questionsJSON:', e);
                            return [];
                        }
                    }
                    // Already an object/array
                    return Array.isArray(content.questionsJSON) ? content.questionsJSON : [];
                })();
                
                // Enrich questions with source metadata
                const enrichedQuestions = questions.map((q: QuestionItem) => ({
                    ...q,
                    documentID: content.documentID,
                    fileID: content.fileID || undefined,
                    filename: doc?.filename || undefined,
                }));
                
                setQuestionItems(enrichedQuestions);
                
                // Parse summaries - handle both string and object formats
                const sums = (() => {
                    if (!content.summariesJSON) return [];
                    if (typeof content.summariesJSON === 'string') {
                        try {
                            return JSON.parse(content.summariesJSON);
                        } catch (e) {
                            console.error('Error parsing summariesJSON:', e);
                            return [];
                        }
                    }
                    return Array.isArray(content.summariesJSON) ? content.summariesJSON : [];
                })();
                setSummaries(sums);
                
                // Parse objectives - handle both string and object formats
                const objs = (() => {
                    if (!content.objectivesJSON) return [];
                    if (typeof content.objectivesJSON === 'string') {
                        try {
                            return JSON.parse(content.objectivesJSON);
                        } catch (e) {
                            console.error('Error parsing objectivesJSON:', e);
                            return [];
                        }
                    }
                    return Array.isArray(content.objectivesJSON) ? content.objectivesJSON : [];
                })();
                setObjectives(objs);
                
                // Auto-select all items by default if not imported
                if (!content.importedAt) {
                    setSelectedItems(new Set(enrichedQuestions.map((_: any, i: number) => i)));
                }
            }
        } catch (error) {
            console.error('Error loading parsed content:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (index: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const toggleExpand = (index: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
        
        // Recalculate virtual items when expanding/collapsing
        virtualizer.measure();
    };

    const toggleAll = () => {
        if (selectedItems.size === questionItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(questionItems.map((_, i) => i)));
        }
    };

    const handleUpdate = async (index: number, field: string, newValue: string) => {
        if (!parsedContent) return;
        
        const updates = { [field]: newValue };
        const success = await updateQuestionItem(parsedContent.id, index, updates);
        
        if (success) {
            // Update local state
            const newItems = [...questionItems];
            newItems[index] = { ...newItems[index], ...updates };
            setQuestionItems(newItems);
        }
    };

    const handleImport = async () => {
        if (!parsedContent || !unitId) {
            console.error('Missing parsedContent or unitId');
            return;
        }
        
        setImporting(true);
        setImportResult(null);
        
        const selectedIndices = Array.from(selectedItems);
        
        const result = await importQuestionsToUnit(
            parsedContent.id,
            unitId,
            selectedIndices,
            owner,
            identityId,
            (current: number, total: number, message: string) => {
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

    const alreadyImported = !!parsedContent.importedAt;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
                
                {alreadyImported && (
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
                        onClick={() => setShowSummaries(!showSummaries)}
                        endIcon={showSummaries ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        variant="outlined"
                    >
                        {showSummaries ? t('questionsReview.hide') : t('questionsReview.show')} {t('questionsReview.summariesAndObjectives')}
                    </Button>
                    <Collapse in={showSummaries}>
                        <Paper elevation={0} sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
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
            {!alreadyImported && (
                <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleAll}
                    >
                        {selectedItems.size === questionItems.length ? t('questionsReview.deselectAll') : t('questionsReview.selectAll')}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {t('questionsReview.selectedCount', { count: selectedItems.size, total: questionItems.length })}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<ImportIcon />}
                        onClick={handleImport}
                        disabled={importing || selectedItems.size === 0}
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
                        onClose={() => setImportResult(null)}
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
                                    alreadyImported={alreadyImported}
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
