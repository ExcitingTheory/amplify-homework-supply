/**
 * VocabularyReview2 Component
 * 
 * Enhanced vocabulary review panel with:
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
    LibraryBooks as LibraryBooksIcon,
    Info as InfoIcon,
    Mic as MicIcon,
} from '@mui/icons-material';
import { getAmplifyClient } from '../utils/amplifyClient';
import { ParsedContent, Document } from '../models';
import {
    importVocabularyToUnit,
    updateVocabularyItem,
} from '../utils/vocabularyImportUtils';
import DictionaryContext from '../context/dictionaryContext';
import AuthContext from '../context/authContext';

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
import { Icon } from '@aws-amplify/ui-react';

export interface VocabularyItem {
    word: string;
    definition: string;
    context?: string;
    page?: number;
    phonetic?: string;
    audio?: string[];
    // Source tracking
    documentID?: string;
    fileID?: string;
    filename?: string;
}

interface VocabularyReview2Props {
    documentId: string;
    unitId: string;
    owner: string;
    identityId: string;
    onImportComplete?: (result: any) => void;
    searchTerm?: string;
}

// =============================================================================
// NestedVocabField - Individual field editor with Lexical + search highlighting
// =============================================================================

interface NestedVocabFieldProps {
    value: string;
    field: 'word' | 'definition' | 'context' | 'phonetic';
    itemIndex: number;
    onSave: (index: number, field: string, newValue: string) => Promise<void>;
    searchTerm?: string;
    label?: string;
    placeholder?: string;
    multiline?: boolean;
}

function NestedVocabField({
    value,
    field,
    itemIndex,
    onSave,
    searchTerm = '',
    label = '',
    placeholder = '',
    multiline = false,
}: NestedVocabFieldProps) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const initialConfig = {
        namespace: `VocabField-${field}-${itemIndex}`,
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
                                    minHeight: multiline ? '60px' : '24px',
                                    padding: multiline ? '8px' : '4px 8px',
                                    border: '1px solid rgba(0, 0, 0, 0.12)',
                                    borderRadius: '4px',
                                    fontSize: field === 'word' ? '1.1rem' : '0.875rem',
                                    fontFamily: 'inherit',
                                    fontWeight: field === 'word' ? 600 : 400,
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
// VocabularyCard - Individual vocabulary item with Lexical editing
// =============================================================================

export interface VocabularyCardProps {
    item: VocabularyItem;
    index: number;
    isSelected: boolean;
    isExpanded: boolean;
    existsInDictionary: boolean;
    alreadyImported: boolean;
    searchTerm?: string;
    onToggleSelect: (index: number) => void;
    onToggleExpand: (index: number) => void;
    onUpdate: (index: number, field: string, value: string) => Promise<void>;
    onOpenRubyEditor?: () => void;
    onOpenAudioStudio?: () => void;
}

export function VocabularyCard({
    item,
    index,
    isSelected,
    isExpanded,
    existsInDictionary,
    alreadyImported,
    searchTerm = '',
    onToggleSelect,
    onToggleExpand,
    onUpdate,
    onOpenRubyEditor,
    onOpenAudioStudio,
}: VocabularyCardProps) {
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
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flex: 1 }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Box 
                                    onClick={(e) => e.stopPropagation()} 
                                    sx={{ 
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        minWidth: '120px',
                                        flex: '0 1 auto',
                                    }}
                                >
                                    <NestedVocabField
                                        value={item.word || ''}
                                        field="word"
                                        itemIndex={index}
                                        onSave={onUpdate}
                                        searchTerm={searchTerm}
                                    />
                                </Box>
                                <Box 
                                    onClick={(e) => e.stopPropagation()} 
                                    sx={{ 
                                        fontSize: '0.875rem',
                                        flex: 1,
                                        minWidth: '200px',
                                        display: { xs: 'none', sm: 'block' },
                                    }}
                                >
                                    <NestedVocabField
                                        value={item.definition || ''}
                                        field="definition"
                                        itemIndex={index}
                                        onSave={onUpdate}
                                        searchTerm={searchTerm}
                                    />
                                </Box>
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
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                    )}
                    {item.phonetic && (
                        <Tooltip title={onOpenRubyEditor ? "Open ruby tag editor" : "Has phonetic notation"}>
                            <Box component="span" display="inline-block">
                                <Chip
                                    icon={<LibraryBooksIcon fontSize="small" />}
                                    label={item.phonetic}
                                    size="small"
                                    variant="outlined"
                                    onClick={onOpenRubyEditor ? (e) => {            
                                        e.stopPropagation();
                                        onOpenRubyEditor();
                                    } : undefined}
                                    sx={{ 
                                        fontSize: '0.65rem', 
                                        height: '20px',
                                        maxWidth: '200px',
                                        cursor: onOpenRubyEditor ? 'pointer' : 'default',
                                        '&:hover': onOpenRubyEditor ? {
                                            backgroundColor: 'action.hover',
                                        } : undefined,
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    )}
                    {item.audio && item.audio.length > 0 && (
                        <Tooltip title={onOpenAudioStudio ? "Open audio studio" : `${item.audio.length} audio file(s)`}>        
                            <Box component="span" display="inline-block">
                                <Chip
                                    icon={<MicIcon fontSize="small" />}
                                    label={item.audio.length}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={onOpenAudioStudio ? (e) => {
                                        e.stopPropagation();
                                        onOpenAudioStudio();
                                    } : undefined}
                                    sx={{ 
                                        fontSize: '0.65rem', 
                                        height: '20px',
                                        cursor: onOpenAudioStudio ? 'pointer' : 'default',
                                        '&:hover': onOpenAudioStudio ? {
                                            backgroundColor: 'action.hover',
                                        } : undefined,
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Expanded content - Editable fields */}
            {isExpanded && (
                <Box sx={{ p: 2, pt: 1.5 }}>
                    <NestedVocabField
                        value={item.word}
                        field="word"
                        itemIndex={index}
                        onSave={onUpdate}
                        searchTerm={searchTerm}
                        label="Word"
                        placeholder="Enter word..."
                    />

                    {item.phonetic !== undefined && (
                        <NestedVocabField
                            value={item.phonetic || ''}
                            field="phonetic"
                            itemIndex={index}
                            onSave={onUpdate}
                            searchTerm={searchTerm}
                            label="Phonetic"
                            placeholder="Enter phonetic pronunciation..."
                        />
                    )}

                    <NestedVocabField
                        value={item.definition}
                        field="definition"
                        itemIndex={index}
                        onSave={onUpdate}
                        searchTerm={searchTerm}
                        label="Definition"
                        placeholder="Enter definition..."
                        multiline
                    />

                    {item.context !== undefined && (
                        <NestedVocabField
                            value={item.context || ''}
                            field="context"
                            itemIndex={index}
                            onSave={onUpdate}
                            searchTerm={searchTerm}
                            label="Context"
                            placeholder="Enter context or example sentence..."
                            multiline
                        />
                    )}
                </Box>
            )}
        </ListItem>
    );
}

// Export VocabularyCard for reuse in other components - already exported above as named export

// =============================================================================
// VocabularyReview2 - Main component with virtual scrolling
// =============================================================================

const VocabularyReview2: React.FC<VocabularyReview2Props> = ({
    documentId,
    unitId,
    owner,
    identityId,
    onImportComplete,
    searchTerm = '',
}) => {
    const { t } = useTranslation('components');
    const { user, isLoading: authLoading } = useContext(AuthContext) || { user: undefined, isLoading: true };
    const [parsedContent, setParsedContent] = useState<any>(null);
    const [document, setDocument] = useState<any>(null);
    const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<any>(null);
    const [importResult, setImportResult] = useState<any>(null);
    const [showSummaries, setShowSummaries] = useState(false);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [objectives, setObjectives] = useState<any[]>([]);
    
    // Use DictionaryContext to access existing dictionary words
    const { dictionary } = useContext(DictionaryContext) || { dictionary: {} };

    // Refs for virtual scrolling
    const parentRef = useRef<HTMLDivElement>(null);

    // Filter vocabulary items by search term
    const filteredVocabulary = useMemo(() => {
        if (!searchTerm) return vocabularyItems;
        
        const lowerSearch = searchTerm.toLowerCase();
        return vocabularyItems.filter((item) => {
            return (
                item.word?.toLowerCase().includes(lowerSearch) ||
                item.definition?.toLowerCase().includes(lowerSearch) ||
                item.context?.toLowerCase().includes(lowerSearch) ||
                item.phonetic?.toLowerCase().includes(lowerSearch)
            );
        });
    }, [vocabularyItems, searchTerm]);

    // Virtual scrolling setup
    const virtualizer = useVirtualizer({
        count: filteredVocabulary.length,
        getScrollElement: () => parentRef.current,
        estimateSize: useCallback((index: number) => {
            return expandedItems.has(index) ? 300 : 60;
        }, [expandedItems]),
        overscan: 5,
    });

    // Fetch ParsedContent and Document
    useEffect(() => {
        // Wait for authentication
        if (authLoading || !user) {
            console.log('[VocabularyReview2] Waiting for authentication', { authLoading, hasUser: !!user });
            return;
        }
        
        loadParsedContent();
        
        console.log('[VocabularyReview2] Setting up ParsedContent subscription for user:', user.username);
        const client = getAmplifyClient();
        const subscription = client.models.ParsedContent.observeQuery().subscribe({
            next: ({ items }) => {
                // Filter out null items that can appear during subscription updates
                const validItems = items.filter((item: any) => item != null && item.id != null);
                loadParsedContent();
            },
            error: (error: any) => console.error('[VocabularyReview2] ParsedContent subscription error:', error)
        });
        
        return () => subscription.unsubscribe();
    }, [documentId, authLoading, user?.username]);

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
                
                // Parse vocabulary
                const vocab = content.vocabularyJSON 
                    ? JSON.parse(String(content.vocabularyJSON))
                    : [];
                
                // Enrich vocabulary with source metadata
                const enrichedVocab = vocab.map((v: VocabularyItem) => ({
                    ...v,
                    documentID: content.documentID,
                    fileID: content.fileID || undefined,
                    filename: doc?.filename || undefined,
                }));
                
                setVocabularyItems(enrichedVocab);
                
                // Parse summaries
                const sums = content.summariesJSON 
                    ? JSON.parse(String(content.summariesJSON)) 
                    : [];
                setSummaries(sums);
                
                // Parse objectives
                const objs = content.objectivesJSON 
                    ? JSON.parse(String(content.objectivesJSON)) 
                    : [];
                setObjectives(objs);
                
                // Auto-select all items by default if not imported
                if (!content.importedAt) {
                    setSelectedItems(new Set(enrichedVocab.map((_: any, i: number) => i)));
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
        if (selectedItems.size === vocabularyItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(vocabularyItems.map((_, i) => i)));
        }
    };

    const handleUpdate = async (index: number, field: string, newValue: string) => {
        if (!parsedContent) return;
        
        const updates = { [field]: newValue };
        const success = await updateVocabularyItem(parsedContent.id, index, updates);
        
        if (success) {
            // Update local state
            const newItems = [...vocabularyItems];
            newItems[index] = { ...newItems[index], ...updates };
            setVocabularyItems(newItems);
        }
    };

    const handleImport = async () => {
        if (!parsedContent || !unitId) {
            console.error('Missing parsedContent or unitId');
            return;
        }
        
        setImporting(true);
        setImportResult(null);
        
        const selectedIndices = Array.from(selectedItems).map(String);
        
        const result: any = await importVocabularyToUnit(
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
        
        if (result?.success && onImportComplete) {
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
                    {t('vocabularyReview.loading')}
                </Typography>
            </Box>
        );
    }

    if (!parsedContent || vocabularyItems.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">
                    {t('vocabularyReview.noVocabulary')}
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
                    {t('vocabularyReview.sectionHeading')}
                </Typography>
                {document && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('vocabularyReview.from')}: {document.filename}
                        {document.pageCount && ` (${document.pageCount} ${t('vocabularyReview.pages')})`}
                    </Typography>
                )}
                
                {alreadyImported && (
                    <Alert severity="success" sx={{ mt: 1 }} icon={<CheckCircleIcon />}>
                        {t('vocabularyReview.importedOn', { date: new Date(parsedContent.importedAt).toLocaleString() })}
                    </Alert>
                )}
                
                {searchTerm && (
                    <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
                        {t('vocabularyReview.filteringBySearch', { 
                            searchTerm, 
                            count: filteredVocabulary.length, 
                            total: vocabularyItems.length 
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
                        {showSummaries ? t('vocabularyReview.hide') : t('vocabularyReview.show')} {t('vocabularyReview.summariesAndObjectives')}
                    </Button>
                    <Collapse in={showSummaries}>
                        <Paper elevation={0} sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                            {summaries.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                        {t('vocabularyReview.summaries')}
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
                                        {t('vocabularyReview.learningObjectives')}
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
                        {selectedItems.size === vocabularyItems.length ? t('vocabularyReview.deselectAll') : t('vocabularyReview.selectAll')}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {t('vocabularyReview.selectedCount', { count: selectedItems.size, total: vocabularyItems.length })}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<ImportIcon />}
                        onClick={handleImport}
                        disabled={importing || selectedItems.size === 0}
                    >
                        {t('vocabularyReview.importToDictionary')}
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
                            `Imported ${importResult.imported} new words, ${importResult.skipped} already existed, ${importResult.errors} errors`}
                    </Alert>
                </Box>
            )}

            {/* Vocabulary List with Virtual Scrolling */}
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
                        const item = filteredVocabulary[virtualItem.index];
                        const existsInDictionary = dictionary && Object.values(dictionary).some(
                            (word: any) => word.phrase?.toLowerCase().trim() === item.word?.toLowerCase().trim()
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
                                <VocabularyCard
                                    item={item}
                                    index={virtualItem.index}
                                    isSelected={selectedItems.has(virtualItem.index)}
                                    isExpanded={expandedItems.has(virtualItem.index)}
                                    existsInDictionary={existsInDictionary}
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

export default VocabularyReview2;
