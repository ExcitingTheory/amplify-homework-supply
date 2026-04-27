import {
    AppBar,
    Box,
    Toolbar,
    Typography,
    TextField,
    Button,
    IconButton,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    ListItemAvatar,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Modal,
    Card,
    Tabs,
    Tab,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Menu,
    Checkbox,
    ToggleButton,
    ToggleButtonGroup,
    Badge,
    InputAdornment,
    Snackbar,
    Alert,
    Chip,
    Portal,
    Divider,
    LinearProgress,
} from "@mui/material";
import { useVirtualizer } from '@tanstack/react-virtual';
import React from "react";
import { useTranslation } from 'next-i18next';
import { isMimeType } from '@lexical/utils';
import VectorStoreContext from '../../../context/vectorStoreContext';

import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import UploadFile from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuizIcon from '@mui/icons-material/Quiz';
import SummarizeIcon from '@mui/icons-material/Summarize';
import FlagIcon from '@mui/icons-material/Flag';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FilesContext from "../../../context/fileContext";
import SettingsContext from "../../../context/settingsContext";

import { getAmplifyClient } from '../../../utils/amplifyClient';
import { useYjsFile } from '../../../hooks/useYjsFile';
import { uploadData, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { calculateWaveformData } from '../../../utils/calculateWaveformData';
import { uploadFile, uploadAndAnalyzePDF, analyzePDF, cancelPDFAnalysis, generateEmbeddings, isAnalyzableDocument } from '../../../utils/fileUploadUtils';
import {
    saveEmbeddings,
    loadAllEmbeddings,
    loadEmbeddingsByDocument,
    deleteEmbeddings,
    getEmbeddingsTimestamp,
    loadEmbeddingsFromS3
} from '../../../utils/vectorStoreDB';
import * as EmbeddingWorker from '../../../utils/embeddingWorkerManager';
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../plugins/DragDropPastePlugin';
import { INSERT_PLAYLIST_COMMAND } from "../plugins/PlaylistPlugin";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagesPlugin";
import { INSERT_PDF_COMMAND } from "../plugins/PdfViewerPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// Lexical imports for inline editing
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection, $isRangeSelection, createEditor } from "lexical";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";

// FileMetadata node imports
import { $createFileMetadataNode } from "../nodes/FileMetadataNode";
import UnitContext from '../../../context/unitContext';
import { FileManagerProvider, useFileManager } from './FileManagerContext';
import { useTabContext } from '../../../context/tabContext';
import getCachedUrl from "../../../utils/getCachedUrl";
import AudioWaveformPlayer from './AudioWaveformPlayer';
import StaticWaveform from './StaticWaveform';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';

import TextareaAutosize from '@mui/material/TextareaAutosize';

import MicIcon from '@mui/icons-material/Mic';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';

import { hexToRgb } from "../../../utils/hexToRgb";
import { ImageGeneratorButton, AudioGeneratorButton } from './EnhancedGenerators';
import { SuggestedVocabulary, SuggestedQuestions } from './SuggestedContent';
import RecordingStudio3Modal from "../../RecordingStudio3Modal";
import { createConversationPreset } from "../../../utils/recordingStudioPresets";

// Utility functions for hybrid search
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Highlight text matches
const highlightMatches = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.test(part)
            ? React.createElement('mark', { key: i, style: { backgroundColor: 'var(--mui-palette-custom-searchHighlight, #ffeb3b)', padding: '0 2px' } }, part)
            : part
    );
};

// Check if text contains search term (case-insensitive)
const containsSearchTerm = (text, searchTerm) => {
    if (!text || !searchTerm) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
};

// IndexedDB-backed vector store for persistent semantic search
export class CourseVectorStore {
    constructor() {
        this.items = []; // In-memory cache for fast search
        this.loaded = false; // Track if IndexedDB data has been loaded
        this.loadPromise = null; // Prevent duplicate loads
    }

    async clear() {
        this.items = [];
        this.loaded = false;
    }

    add(item) {
        console.log(`[VectorStore.add] Adding embedding:`, {
            id: item.id,
            documentId: item.documentId,
            page: item.page,
            hasVector: !!item.vector,
            vectorLength: item.vector?.length,
            fileName: item.metadata?.fileName,
            totalItemsAfter: this.items.length + 1
        });
        this.items.push(item);
    }

    /**
     * Load all embeddings from IndexedDB into memory
     * @returns {Promise<number>} Number of embeddings loaded
     */
    async loadFromIndexedDB() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = (async () => {
            try {
                const embeddings = await loadAllEmbeddings();
                this.items = embeddings;
                this.loaded = true;
                console.log(`[VectorStore] Loaded ${embeddings.length} embeddings from IndexedDB`);
                return embeddings.length;
            } catch (error) {
                console.error('[VectorStore] Failed to load from IndexedDB:', error);
                this.loaded = false;
                return 0;
            } finally {
                this.loadPromise = null;
            }
        })();

        return this.loadPromise;
    }

    /**
     * Save document embeddings to IndexedDB
     * @param {string} documentId 
     * @param {Array} embeddings - Array of {page, embedding} objects
     * @param {Object} metadata - File metadata
     */
    async saveToIndexedDB(documentId, embeddings, metadata) {
        try {
            await saveEmbeddings(documentId, embeddings, metadata);
        } catch (error) {
            console.error('[VectorStore] Failed to save to IndexedDB:', error);
        }
    }

    /**
     * Delete document embeddings from IndexedDB
     * @param {string} documentId 
     */
    async deleteFromIndexedDB(documentId) {
        try {
            await deleteEmbeddings(documentId);
            // Also remove from in-memory cache
            this.items = this.items.filter(item => item.documentId !== documentId);
        } catch (error) {
            console.error('[VectorStore] Failed to delete from IndexedDB:', error);
        }
    }

    async search(queryVector, filters = {}, topK = 50, queryText = '') {
        let results = this.items;

        // Apply metadata filters first
        if (filters.fileId) {
            results = results.filter(item => item.metadata?.fileId === filters.fileId);
        }
        if (filters.documentId) {
            results = results.filter(item => item.metadata?.documentId === filters.documentId || item.documentId === filters.documentId);
        }
        if (filters.mimeType) {
            results = results.filter(item => item.metadata?.mimeType === filters.mimeType);
        }

        // Separate items with and without embeddings
        const itemsWithEmbeddings = results.filter(item => queryVector && item.vector);
        const itemsWithoutEmbeddings = results.filter(item => !(queryVector && item.vector));

        console.log(`[VectorStore.search] Processing ${itemsWithEmbeddings.length} items with embeddings, ${itemsWithoutEmbeddings.length} without`);

        // Compute vector similarities using worker (for large batches)
        let vectorResults = [];
        if (itemsWithEmbeddings.length > 0) {
            // For large datasets, use the worker to calculate similarities in parallel
            if (itemsWithEmbeddings.length > 50) {
                console.log('[VectorStore.search] Using worker for similarity calculations');
                try {
                    // Calculate similarities in the worker
                    const similarities = await Promise.all(
                        itemsWithEmbeddings.map(item =>
                            EmbeddingWorker.cosineSimilarity(queryVector, item.vector)
                        )
                    );

                    vectorResults = itemsWithEmbeddings.map((item, i) => ({
                        ...item,
                        similarity: similarities[i]
                    }));
                } catch (error) {
                    console.error('[VectorStore.search] Worker error, falling back to main thread:', error);
                    // Fallback: calculate on main thread
                    vectorResults = await this._calculateSimilaritiesMainThread(queryVector, itemsWithEmbeddings);
                }
            } else {
                // For small datasets, calculate on main thread (avoid worker overhead)
                vectorResults = await this._calculateSimilaritiesMainThread(queryVector, itemsWithEmbeddings);
            }
        }

        // Compute text similarities for items without embeddings
        const textResults = itemsWithoutEmbeddings.map(item => {
            let similarity = 0;

            if (queryText && item.text) {
                const queryLower = queryText.toLowerCase();
                const textLower = item.text.toLowerCase();

                // Simple text matching score
                if (textLower.includes(queryLower)) {
                    // Exact phrase match
                    similarity = 0.8;
                } else {
                    // Word-level matching
                    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
                    const matchedWords = queryWords.filter(word => textLower.includes(word));
                    similarity = matchedWords.length / Math.max(queryWords.length, 1) * 0.6;
                }
            }

            return {
                ...item,
                similarity
            };
        });

        // Combine results
        results = [...vectorResults, ...textResults];

        // Filter out very low scores
        results = results.filter(item => item.similarity > 0.1);

        // Sort and return top K (use worker for large result sets)
        if (results.length > 100) {
            try {
                return await EmbeddingWorker.sortAndLimit(results, topK);
            } catch (error) {
                console.error('[VectorStore.search] Worker sort error, falling back:', error);
                return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
            }
        } else {
            return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
        }
    }

    // Fallback method: calculate similarities on main thread
    async _calculateSimilaritiesMainThread(queryVector, items) {
        // Inline cosine similarity for fallback
        const cosineSimilarity = (vecA, vecB) => {
            if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
            let dotProduct = 0, normA = 0, normB = 0;
            for (let i = 0; i < vecA.length; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }
            const denominator = Math.sqrt(normA) * Math.sqrt(normB);
            return denominator === 0 ? 0 : dotProduct / denominator;
        };

        return items.map(item => ({
            ...item,
            similarity: cosineSimilarity(queryVector, item.vector)
        }));
    }
}

// =============================================================================
// InlineEditorField - Lexical editor for inline filename and content editing
// =============================================================================

function InlineEditorField({
    value,
    field,
    onSave,
    placeholder = '',
    label = '',
    multiline = false,
    autosave = true,
    storageKey,
}) {
    const [localValue, setLocalValue] = React.useState(value);
    const [isDraft, setIsDraft] = React.useState(false);
    const saveTimeoutRef = React.useRef(null);
    const editorRef = React.useRef(null);

    // Load draft from sessionStorage
    React.useEffect(() => {
        if (storageKey && typeof window !== 'undefined') {
            const draft = sessionStorage.getItem(`draft_${storageKey}`);
            if (draft && draft !== value) {
                setLocalValue(draft);
                setIsDraft(true);
            }
        }
    }, [storageKey, value]);

    React.useEffect(() => {
        setLocalValue(value);
        setIsDraft(false);
    }, [value]);

    const initialConfig = {
        namespace: `InlineEditor-${field}-${storageKey}`,
        theme: {
            text: {
                bold: 'font-weight: bold;',
                italic: 'font-style: italic;',
            },
        },
        onError: (error) => console.error('Lexical error:', error),
        editorState: () => {
            if (localValue) {
                const editor = createEditor(initialConfig);
                const parser = new DOMParser();
                const dom = parser.parseFromString(localValue, 'text/html');
                return editor.setEditorState(editor.parseEditorState(JSON.stringify({
                    root: {
                        children: [{
                            children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: localValue, type: 'text', version: 1 }],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'paragraph',
                            version: 1
                        }],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'root',
                        version: 1
                    }
                })));
            }
            return null;
        },
    };

    const handleChange = (editorState, editor) => {
        editor.read(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            const textContent = $getRoot().getTextContent();

            setLocalValue(textContent);

            // Save draft to sessionStorage
            if (storageKey && typeof window !== 'undefined') {
                sessionStorage.setItem(`draft_${storageKey}`, textContent);
            }

            const hasChanges = textContent !== value;
            setIsDraft(hasChanges);

            if (autosave && hasChanges) {
                // Clear previous timeout
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                // Debounced save
                saveTimeoutRef.current = setTimeout(() => {
                    onSave(textContent);
                    setIsDraft(false);

                    // Clear draft from sessionStorage after successful save
                    if (storageKey && typeof window !== 'undefined') {
                        sessionStorage.removeItem(`draft_${storageKey}`);
                    }
                }, 1000);
            }
        });
    };

    const handleSaveNow = () => {
        if (localValue !== value) {
            onSave(localValue);
            setIsDraft(false);

            // Clear draft from sessionStorage
            if (storageKey && typeof window !== 'undefined') {
                sessionStorage.removeItem(`draft_${storageKey}`);
            }
        }
    };

    const handleRevert = () => {
        setLocalValue(value);
        setIsDraft(false);

        // Clear draft from sessionStorage
        if (storageKey && typeof window !== 'undefined') {
            sessionStorage.removeItem(`draft_${storageKey}`);
        }

        // Reset editor state
        if (editorRef.current) {
            editorRef.current.setEditorState(
                editorRef.current.parseEditorState(JSON.stringify({
                    root: {
                        children: [{
                            children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: value, type: 'text', version: 1 }],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'paragraph',
                            version: 1
                        }],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'root',
                        version: 1
                    }
                }))
            );
        }
    };

    return (
        <Box
            sx={{
                minHeight: multiline ? '2.5rem' : '1.5rem',
                position: 'relative',
                '& .inline-editor': {
                    outline: 'none',
                    minHeight: multiline ? '2.5rem' : '1.5rem',
                    cursor: 'text',
                    padding: '4px 8px',
                    border: '1px solid',
                    borderColor: isDraft ? 'warning.main' : 'divider',
                    borderRadius: '4px',
                    backgroundColor: isDraft ? 'warning.50' : 'background.paper',
                    '&:focus-within': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                    },
                },
            }}
        >
            {label && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {label}
                </Typography>
            )}

            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="inline-editor"
                            aria-label={label || "File metadata field"}
                            style={{
                                fontSize: '0.875rem',
                                lineHeight: '1.4',
                                resize: multiline ? 'vertical' : 'none',
                                minHeight: multiline ? '2.5rem' : '1.5rem',
                                maxHeight: multiline ? '10rem' : '1.5rem',
                                overflow: multiline ? 'auto' : 'hidden',
                            }}
                        />
                    }
                    placeholder={
                        <div
                            style={{
                                position: 'absolute',
                                top: multiline ? '8px' : '6px',
                                left: '12px',
                                color: 'var(--mui-palette-text-disabled, #999)',
                                fontSize: '0.875rem',
                                pointerEvents: 'none',
                            }}
                        >
                            {placeholder}
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <OnChangePlugin onChange={handleChange} />
                <HistoryPlugin />
            </LexicalComposer>

            {isDraft && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="warning.main">
                        {t('fileManager.draftChanges')}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={handleSaveNow}
                        sx={{ minWidth: 'auto', px: 1 }}
                    >
                        {t('fileManager.save')}
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={handleRevert}
                        sx={{ minWidth: 'auto', px: 1 }}
                    >
                        {t('fileManager.revert')}
                    </Button>
                </Box>
            )}
        </Box>
    );
}

// =============================================================================
// ExpandedFileContent - Display extracted content from embeddings and analysis
// =============================================================================

// =============================================================================
// FileNameField - Simple contentEditable field for filename editing
// =============================================================================

function FileNameField({ value, fileId, onSave, searchTerm }) {
    const [localValue, setLocalValue] = React.useState(value);
    const editableRef = React.useRef(null);

    React.useEffect(() => {
        setLocalValue(value);
        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
    }, [value]);

    const handleInput = (e) => {
        const newValue = e.target.textContent;
        setLocalValue(newValue);
    };

    const handleSave = () => {
        if (onSave && localValue !== value && localValue.trim()) {
            onSave(fileId, localValue);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (editableRef.current) {
            editableRef.current.focus();

            // Select all text except the extension
            const text = editableRef.current.textContent;
            const lastDotIndex = text.lastIndexOf('.');

            if (lastDotIndex > 0) {
                // Select from start to before the extension
                const range = document.createRange();
                const sel = window.getSelection();
                const textNode = editableRef.current.firstChild;

                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(textNode, 0);
                    range.setEnd(textNode, lastDotIndex);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } else {
                // No extension, select all
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editableRef.current);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    };

    const handleKeyDown = (e) => {
        // Stop propagation for all key events to prevent TreeView interference
        e.stopPropagation();

        // Enter to save and blur
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
            e.target.blur();
        }
        // Escape to revert and blur
        else if (e.key === 'Escape') {
            e.preventDefault();
            setLocalValue(value);
            if (editableRef.current) {
                editableRef.current.textContent = value;
            }
            e.target.blur();
        }
    };

    const handleBlur = () => {
        // Save on blur only if value changed
        handleSave();
    };

    return (
        <Box
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            aria-label={t('fileMetadataComponent.filename', { ns: 'editor.files' })}
            onInput={handleInput}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            sx={{
                outline: 'none',
                cursor: 'text',
                fontSize: '0.875rem',
                minHeight: '1.2rem',
                '&:focus': {
                    backgroundColor: 'action.hover',
                },
            }}
        >
            {value}
        </Box>
    );
}

// =============================================================================
// ExpandedFileContent - Display extracted content from embeddings and analysis
// =============================================================================

// Metadata Editor Component for editing file properties
function MetadataEditor({ file, onUpdate, onClose }) {
    const { t } = useTranslation('editor.files');
    const [editing, setEditing] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: file.name || '',
        description: file.description || '',
        prompt: file.prompt || '',
        model: file.model || '',
        variant: file.variant || '',
    });

    const handleSave = async () => {
        try {
            const client = getAmplifyClient();
            const { data: updatedFile } = await client.models.File.update({
                id: file.id,
                name: formData.name,
                description: formData.description,
                prompt: formData.prompt,
                model: formData.model,
                variant: formData.variant
            });
            onUpdate?.(updatedFile);
            setEditing(false);
        } catch (error) {
            console.error('Error updating file:', error);
        }
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{t('fileManager2.metadataEditor.heading')}</Typography>
                {!editing && (
                    <IconButton size="small" onClick={() => setEditing(true)}>
                        <EditIcon />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label={t('fileManager2.metadataEditor.nameLabel')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editing}
                    size="small"
                    fullWidth
                />
                <TextField
                    label={t('fileManager2.metadataEditor.descriptionLabel')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!editing}
                    multiline
                    rows={2}
                    size="small"
                    fullWidth
                />
                <TextField
                    label={t('fileManager2.metadataEditor.promptLabel')}
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    disabled={!editing}
                    multiline
                    rows={2}
                    size="small"
                    fullWidth
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label={t('fileManager2.metadataEditor.modelLabel')}
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        disabled={!editing}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        label={t('fileManager2.metadataEditor.variantLabel')}
                        value={formData.variant}
                        onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                        disabled={!editing}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                </Box>

                {/* File info (read-only) */}
                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        <strong>{t('fileManager2.metadataEditor.typeLabel')}:</strong> {file.mimeType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        <strong>{t('fileManager2.metadataEditor.sizeLabel')}:</strong> {file.size ? `${(file.size / 1000).toFixed(2)} KB` : t('fileManager2.metadataEditor.unknown')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        <strong>{t('fileManager2.metadataEditor.pathLabel')}:</strong> {file.path}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        <strong>{t('fileManager2.metadataEditor.protectionLevelLabel')}:</strong> {file.level || 'UNSET'}
                    </Typography>
                    {file.createdAt && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            <strong>{t('fileManager2.metadataEditor.createdLabel')}:</strong> {new Date(file.createdAt).toLocaleString()}
                        </Typography>
                    )}
                </Box>

                {editing && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setFormData({
                                    name: file.name || '',
                                    description: file.description || '',
                                    prompt: file.prompt || '',
                                    model: file.model || '',
                                    variant: file.variant || '',
                                });
                                setEditing(false);
                            }}
                        >
                            {t('fileManager2.metadataEditor.cancelButton')}
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleSave}
                        >
                            {t('fileManager2.metadataEditor.saveButton')}
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

const ExpandedFileContent = React.memo(function ExpandedFileContent({ file, parsedContent, search, editor }) {
    const { t } = useTranslation('editor.files');
    const [activeTab, setActiveTab] = React.useState(0);

    const handleInsertIntoEditor = () => {
        if (!editor) return;

        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // Create normalized parsed content
                const normalizedParsedContent = parsedContent ? {
                    vocabulary: vocabulary,
                    summaries: summaries,
                    objectives: objectives,
                    concepts: concepts,
                    questions: questions
                } : null;

                const fileMetadataNode = $createFileMetadataNode(file, normalizedParsedContent);
                selection.insertNodes([fileMetadataNode]);
            }
        });
    };

    // Parse metadata for audio/image files
    const metadata = file.metadata ? (() => {
        try {
            return JSON.parse(file.metadata);
        } catch (e) {
            return null;
        }
    })() : null;

    // Parse JSON content for documents

    const highlightText = (text) => {
        if (!search || !text) return text;
        return highlightMatches(text, search);
    };

    const isDocument = file.mimeType === 'application/pdf' ||
        file.mimeType === 'text/plain' ||
        file.mimeType === 'text/markdown';

    console.log('ExpandedFileContent render', { file, parsedContent });

    return (
        <Box sx={{ p: 2 }}>
            {/* Audio/Image Metadata */}
            {metadata && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        {t('fileManager2.expandedContent.extractedContentHeading')}
                    </Typography>
                    {metadata.analysis?.description && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                                {t('fileManager2.expandedContent.descriptionLabel')}
                            </Typography>
                            <Typography variant="body2">
                                {highlightText(metadata.analysis.description)}
                            </Typography>
                        </Box>
                    )}
                    {metadata.analysis?.transcription && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                                {t('fileManager2.expandedContent.transcriptionLabel')}
                            </Typography>
                            <Typography variant="body2">
                                {highlightText(metadata.analysis.transcription)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Document Parsed Content */}
            {isDocument && parsedContent && (
                <Box sx={{ position: 'relative', zIndex: 1, mx: -2 }}>
                    <Tabs
                        value={activeTab}
                        scrollButtons="auto"
                        variant="scrollable"
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            position: 'relative',
                            zIndex: 2,
                            backgroundColor: 'background.paper',
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Tooltip title={t('fileMetadataComponent.vocabulary', 'Vocabulary')} arrow>
                            <Tab
                                icon={<MenuBookIcon />}
                                label={`(${parsedContent.vocabularyJSON.length})`}
                                iconPosition="start"
                            />
                        </Tooltip>
                        <Tooltip title={t('fileMetadataComponent.questions', 'Questions')} arrow>
                            <Tab
                                icon={<QuizIcon />}
                                label={`(${parsedContent.questionsJSON.length})`}
                                iconPosition="start"
                            />
                        </Tooltip>
                        <Tooltip title={t('fileMetadataComponent.summaries', 'Summaries')} arrow>
                            <Tab
                                icon={<SummarizeIcon />}
                                label={`(${parsedContent.summariesJSON.length})`}
                                iconPosition="start"
                            />
                        </Tooltip>
                        <Tooltip title={t('fileMetadataComponent.objectives', 'Objectives')} arrow>
                            <Tab
                                icon={<FlagIcon />}
                                label={`(${parsedContent.objectivesJSON.length})`}
                                iconPosition="start"
                            />
                        </Tooltip>
                        <Tooltip title={t('fileMetadataComponent.concepts', 'Concepts')} arrow>
                            <Tab
                                icon={<LightbulbIcon />}
                                label={`(${parsedContent.conceptsJSON.length})`}
                                iconPosition="start"
                            />
                        </Tooltip>
                    </Tabs>

                    {/* Vocabulary Tab with SuggestedVocabulary */}
                    {activeTab === 0 && (
                        <Box sx={{ pt: 2, px: 2 }}>
                            {parsedContent.vocabularyJSON.length > 0 ? (
                                <>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {t('fileManager2.expandedContent.reviewVocabularyMessage')}
                                    </Alert>
                                    <SuggestedVocabulary
                                        documentId={file.documentID}
                                        fileId={file.id}
                                        unitId={editor?.__unit?.id}
                                        enableInlineEditing={true}
                                        onImport={(count) => {
                                            console.log(`Imported ${count} vocabulary words`);
                                        }}
                                    />
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {t('fileManager2.expandedContent.noVocabularyExtracted')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Questions Tab with SuggestedQuestions */}
                    {activeTab === 1 && (
                        <Box sx={{ pt: 2, px: 2 }}>
                            {parsedContent.questionsJSON.length > 0 ? (
                                <>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {t('fileManager2.expandedContent.reviewQuestionsMessage')}
                                    </Alert>
                                    <SuggestedQuestions
                                        documentId={file.documentID}
                                        fileId={file.id}
                                        unitId={editor?.__unit?.id}
                                        enableInlineEditing={true}
                                        onImport={(count) => {
                                            console.log(`Imported ${count} questions`);
                                        }}
                                    />
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {t('fileManager2.expandedContent.noQuestionsExtracted')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Summaries Tab */}
                    {activeTab === 2 && (
                        <Box sx={{ pt: 2, px: 2 }}>
                            {parsedContent.summariesJSON.length > 0 ? (
                                parsedContent.summariesJSON.map((item, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            border: 2,
                                            borderColor: 'primary.main',
                                            borderRadius: 1,
                                            backgroundColor: 'primary.light',
                                            opacity: 0.9
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="primary.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {highlightText(item.title)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                                            {highlightText(item.content)}
                                        </Typography>
                                        {item.page_range && (
                                            <Chip
                                                label={`Pages: ${item.page_range}`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {t('fileManager2.expandedContent.noSummariesExtracted')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Objectives Tab */}
                    {activeTab === 3 && (
                        <Box sx={{ pt: 2, px: 2 }}>
                            {parsedContent.objectivesJSON.length > 0 ? (
                                parsedContent.objectivesJSON.map((item, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            border: 2,
                                            borderColor: 'secondary.main',
                                            borderRadius: 1,
                                            backgroundColor: 'secondary.light',
                                            opacity: 0.9
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                            {highlightText(item.objective)}
                                        </Typography>
                                        {item.bloom_level && (
                                            <Chip
                                                label={`Bloom Level: ${item.bloom_level}`}
                                                size="small"
                                                color="secondary"
                                                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {t('fileManager2.expandedContent.noObjectivesExtracted')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Concepts Tab */}
                    {activeTab === 4 && (
                        <Box sx={{ pt: 2, px: 2 }}>
                            {parsedContent.conceptsJSON.length > 0 ? (
                                parsedContent.conceptsJSON.map((item, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            border: 2,
                                            borderColor: 'success.main',
                                            borderRadius: 1,
                                            backgroundColor: 'success.light',
                                            opacity: 0.9
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="success.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {highlightText(item.concept)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {highlightText(item.description)}
                                        </Typography>
                                        {item.related_vocabulary && (
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    label={`Related: ${highlightText(item.related_vocabulary)}`}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {t('fileManager2.expandedContent.noConceptsExtracted')}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* No content available */}
            {!metadata && !parsedContent && !isDocument && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('fileManager2.expandedContent.fileInfoHeading', 'File Info')}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'baseline' }}>
                        <Typography variant="body2" color="text.secondary">{t('fileMetadataComponent.type', 'Type:')}</Typography>
                        <Typography variant="body2">{file.mimeType || t('fileMetadataComponent.unknown', 'Unknown')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('fileMetadataComponent.path', 'Path:')}</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{file.path}</Typography>
                        {file.size != null && (
                            <>
                                <Typography variant="body2" color="text.secondary">{t('fileManager2.expandedContent.sizeLabel', 'Size:')}</Typography>
                                <Typography variant="body2">{(file.size / 1024).toFixed(1)} KB</Typography>
                            </>
                        )}
                        {file.duration != null && (
                            <>
                                <Typography variant="body2" color="text.secondary">{t('fileManager2.expandedContent.durationLabel', 'Duration:')}</Typography>
                                <Typography variant="body2">{file.duration}s</Typography>
                            </>
                        )}
                    </Box>
                </Box>
            )}
            {!metadata && !parsedContent && isDocument && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {t('fileManager2.expandedContent.noContentAvailable')}
                </Typography>
            )}
        </Box>
    );
});

function NewImageFileForm({ open, toggleNewImageFileForm }) {
    const { t } = useTranslation('editor.files');

    const [newDescription, setNewDescription] = React.useState('');
    const [presignedUrl, setPresignedUrl] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const [working, setWorking] = React.useState(false);
    const [previewMessage, setPreviewMessage] = React.useState('');

    const imageRef = React.useRef(null);


    React.useEffect(() => {
        const fetchImage = async () => {
            try {
                console.log('presignedUrl!!!', presignedUrl)
                const response = await fetch(presignedUrl);
                console.log('response!!!', response)
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                console.log('url!!!', url)
                imageRef.current.src = url;

                setWorking(false);
                setNewDescription('');
                setPreviewMessage(t('fileManager2.generators.successfullyGeneratedImage'));

            } catch (error) {
                console.error(error);
            }
        };

        if (!presignedUrl) {
            return;
        }

        fetchImage();

    }, [presignedUrl]);


    return (
        <>
            <Collapse in={open}>

                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >

                    <TextareaAutosize
                        minRows={3}
                        value={newDescription}
                        onChange={(e) => {
                            setNewDescription(e.target.value);

                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        placeholder={t('fileManager2.generators.imagePromptPlaceholder')}

                        ref={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        // onBlur={async (event) => {
                        //     event.preventDefault();
                        //     setEditing(false);
                        // }}
                        style={{
                            width: '100%',
                            wordWrap: 'break-word',
                            minHeight: '3rem',
                        }} />
                    <Button
                        variant="outlined"
                        aria-label={t('unifiedGenerateModal.generate', { ns: 'editor.ai' })}
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage(t('fileManager2.generators.generatingImage'));

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new image file
                        const client = getAmplifyClient();

                        const fileGenerator = await client.mutations.generateImageFile({
                            phrase: newDescription,
                            model: 'dall-e-3',
                        });

                            const path = fileGenerator?.data?.path;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage(t('fileManager2.generators.errorGeneratingImage'));
                                setWorking(false);
                            }






                            // open modal to preview audio
                            // close form
                            // toggleNewImageFileForm();
                        }}
                        style={{
                            width: '100%',
                            margin: '1rem',
                        }}
                    >
                        {t('fileManager.create')}
                    </Button>
                </Box>
            </Collapse>
            {/**
                 * Create a modal to preview the audio file
                 */}

            <Modal
                open={isOpen}
                onClose={() => {
                    // close modal
                    setWorking(false);
                    setPreviewMessage('');
                    setIsOpen(false);
                }}
                aria-labelledby="modal-text-to-image-preview"
                aria-describedby="modal-text-to-image-preview-description"
            >
                <Card
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        style: {
                            minWidth: '20vw',
                            maxWidth: '80vw',
                            minHeight: '20vw',
                            maxHeight: '80vw',
                            padding: '1rem',

                        },
                    }}

                >
                    <Typography id="modal-text-to-image-preview" variant="h6" component="h2">
                        {t('fileManager.textToImagePreview')} {working && <CircularProgress />}
                    </Typography>

                    <Typography id="modal-text-to-image-preview-description" sx={{ mt: 2 }}>
                        {previewMessage}
                    </Typography>
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <img
                            // onClick={doNothing}
                            style={{
                                backgroundColor: 'background.paper',
                                width: '100%',
                                margin: '1rem auto'
                            }}
                            ref={imageRef} />
                    </Box>

                    <Button
                        onClick={() => {
                            // close modal
                            setIsOpen(false);
                        }}>
                        {t('fileManager.close')}
                    </Button>


                    {/**
                     * Add a button to insert the image into the editor
                    */}

                    {/**
                     * Add a button to delete the image
                     */}

                    {/**
                     * Add a button to download the image?
                     */}

                    {/**
                      * Add a button to share the image?
                      */}

                </Card>

            </Modal>
        </>
    )

}

function NewVideoFileForm({ open, toggleNewVideoFileForm }) {
    const [newDescription, setNewDescription] = React.useState('');

    return (
        <Collapse in={open}>

            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                }}
            >

                <TextareaAutosize
                    minRows={3}
                    value={newDescription}
                    onChange={(e) => {
                        setNewDescription(e.target.value);

                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    placeholder='No Description'

                    // ref={(input) => {
                    //     if (input != null) {
                    //     input.focus();
                    //     }
                    // }}
                    // onBlur={async (event) => {
                    //     event.preventDefault();
                    //     setEditing(false);
                    // }}
                    style={{
                        width: '100%',
                        wordWrap: 'break-word',
                        minHeight: '3rem',
                    }} />
                <Button
                    variant="outlined"
                    aria-label={t('unifiedGenerateModal.generate', { ns: 'editor.ai' })}
                    onClick={() => {
                        // send graphql mutation to create new image file
                        // close form
                        // toggleNewImageFileForm();
                    }}
                    style={{
                        width: '100%',
                        margin: '1rem',
                    }}
                >
                    {t('fileManager.create')}
                </Button>

            </Box>
        </Collapse>
    )
}

function NewAudioFileForm({ open, toggleNewAudioFileForm }) {
    const { t } = useTranslation('editor.files');
    const [newDescription, setNewDescription] = React.useState('');
    const [audioSrc, setAudioSrc] = React.useState('');
    const [presignedUrl, setPresignedUrl] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const [working, setWorking] = React.useState(false);
    const [previewMessage, setPreviewMessage] = React.useState('');


    const audioRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const audioContextRef = React.useRef(null);
    const sourceRef = React.useRef(null);
    const analyserRef = React.useRef(null);
    const fileInput = React.createRef(null);

    const mainColor = typeof document !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--mui-palette-primary-main').trim() || '#556cd6'
        : '#556cd6';

    console.log('FileManager.mainColor', mainColor);

    const rgbColor = hexToRgb(mainColor);
    const _r = rgbColor.r;
    const _g = rgbColor.g;
    const _b = rgbColor.b;


    const doNothing = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    React.useEffect(() => {

        const audio = audioRef.current;

        if (!audio) {
            return;
        } else if (audio.srcObject) {
            const tracks = audio.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            audio.srcObject = null;
        }

        const audioContext = audioContextRef.current || new AudioContext();
        const source = sourceRef.current || audioContext.createMediaElementSource(audio);
        const analyser = analyserRef.current || audioContext.createAnalyser();

        sourceRef.current = source;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        const canvas = canvasRef.current;
        // const timeline = timelineRef.current;
        const canvasCtx = canvas.getContext('2d');
        // const timelineCtx = timeline.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        // const timelineDataArray = new Uint8Array(bufferLength);

        // setDataArray(dataArray);
        const draw = () => {
            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);
            // TODO make this white or black depending on if its light or dark mode
            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Find the maximum value in the dataArray
            const max = Math.max(...dataArray);

            // Reflect the canvas horizontally
            canvasCtx.scale(-1, 1);
            canvasCtx.translate(-canvas.width, 0);

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / max) * canvas.height / 2;

                canvasCtx.fillStyle = `rgb(${barHeight + 100},${_g},${_b})`;
                canvasCtx.fillRect(canvas.width - (x + barWidth / 2), canvas.height / 2 - (barHeight / 2), barWidth, barHeight);

                x += barWidth + 1;
            }

            // Reset the canvas transformation
            canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        };

        draw();

        audio.addEventListener('canplaythrough', () => {
            console.log('canplaythrough');
            audio.play();
            setWorking(false);
            setNewDescription('');
            setPreviewMessage(t('fileManager2.generators.successfullyGeneratedAudio'));
        });
    }, [audioSrc]);

    React.useEffect(() => {
        const fetchAudio = async () => {
            try {
                console.log('presignedUrl!!!', presignedUrl)
                const response = await fetch(presignedUrl);
                console.log('response!!!', response)
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                console.log('url!!!', url)
                setAudioSrc(url);
            } catch (error) {
                console.error(error);
            }
        };

        fetchAudio();
    }, [presignedUrl]);


    return (
        <>
            <Collapse in={open}>

                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >

                    <TextareaAutosize
                        minRows={3}
                        value={newDescription}
                        onChange={(e) => {
                            setNewDescription(e.target.value);

                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        placeholder={t('fileManager2.generators.audioPromptPlaceholder')}

                        ref={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        // onBlur={async (event) => {
                        //     event.preventDefault();
                        //     setEditing(false);
                        // }}
                        style={{
                            width: '100%',
                            wordWrap: 'break-word',
                            minHeight: '3rem',
                        }} />
                    <Button
                        variant="outlined"
                        aria-label={t('unifiedGenerateModal.generate', { ns: 'editor.ai' })}
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage(t('fileManager2.generators.generatingAudio'));

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new audio file
                        const client = getAmplifyClient();

                        const fileGenerator = await client.mutations.generateAudioFile({
                            phrase: newDescription,
                            voice: 'shimmer',
                            model: 'tts-1-hd',
                        });

                            const path = fileGenerator?.data?.path;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage(t('fileManager2.generators.errorGeneratingAudio'));
                                setWorking(false);
                            }






                            // open modal to preview audio
                            // close form
                            // toggleNewImageFileForm();
                        }}
                        style={{
                            width: '100%',
                            margin: '1rem',
                        }}
                    >
                        Create
                    </Button>




                </Box>
            </Collapse>
            {/**
                 * Create a modal to preview the audio file
                 */}

            <Modal
                open={isOpen}
                onClose={() => {
                    // close modal
                    setWorking(false);
                    setPreviewMessage('');
                    setIsOpen(false);
                }}
                aria-labelledby="modal-text-to-speech-preview"
                aria-describedby="modal-text-to-speech-preview-description"
            >
                <Card
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        p: 4,
                        style: {
                            minWidth: '20vw',
                            maxWidth: '80vw',
                            minHeight: '20vw',
                            maxHeight: '80vw',
                            padding: '1rem',

                        },
                    }}

                >
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        {t('fileManager.textToSpeechPreview')} {working && <CircularProgress />}
                    </Typography>

                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        {previewMessage}
                    </Typography>
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        {audioSrc && (
                            <AudioWaveformPlayer
                                audioUrl={audioSrc}
                                waveformData={previewFile?.waveformData ? JSON.parse(previewFile.waveformData) : undefined}
                                width={600}
                                height={120}
                                title={previewFile?.name || 'Audio Preview'}
                                showDuration={true}
                            />
                        )}
                    </Box>

                    <Button
                        onClick={() => {
                            // close modal
                            setIsOpen(false);
                        }}>
                        {t('fileManager.close')}
                    </Button>

                </Card>

            </Modal>
        </>
    )

}

// =============================================================================
// Header Components for File List
// =============================================================================

const ProtectionLevelHeader = React.memo(function ProtectionLevelHeader({
    label,
    totalFiles,
    isExpanded = true,
    onToggleExpand = () => { }
}) {
    return (
        <Box sx={{
            position: 'sticky',
            top: 0,
            height: '100%',
            minHeight: 48,
            px: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            zIndex: 98,
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
                bgcolor: 'primary.dark'
            }
        }}
            onClick={onToggleExpand}
        >
            {/* Expand/Collapse Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}>
                {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'inherit', fontSize: '0.875rem' }}>
                {label}
            </Typography>
            <Chip
                label={totalFiles}
                size="small"
                sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'primary.contrastText',
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600
                }}
            />
        </Box>
    );
});

const FileTypeSubheader = React.memo(function FileTypeSubheader({ label, fileType, isExpanded, onToggleExpand }) {
    const getIconForType = (type) => {
        switch (type) {
            case 'images': return '🖼️';
            case 'audio': return '🎵';
            case 'documents': return '📄';
            case 'video': return '🎬';
            case 'other': return '📎';
            default: return '📁';
        }
    };

    return (
        <Box
            onClick={onToggleExpand}
            sx={{
                height: '100%',
                minHeight: 36,
                px: 2,
                pl: 0.625,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid',
                borderLeft: '3px solid transparent',
                borderColor: 'divider',
                flexShrink: 0,
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                    bgcolor: 'action.focus'
                }
            }}>
            <ExpandMoreIcon sx={{
                fontSize: '1.2rem',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s ease'
            }} />
            <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                {getIconForType(fileType)}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1 }}>
                {label}
            </Typography>
        </Box>
    );
});

// =============================================================================
// FileDetailsPanel - Shows file details and actions in right panel header
// =============================================================================

const FileDetailsPanel = React.memo(function FileDetailsPanel({ file, documentStatus, editor }) {
    const { t } = useTranslation('editor.files');
    const { setConfirmDialog } = useFileManager();
    const [imageUrl, setImageUrl] = React.useState(null);
    const [audioUrl, setAudioUrl] = React.useState(null);
    const [videoUrl, setVideoUrl] = React.useState(null);
    const audioContainerRef = React.useRef(null);
    const [audioWidth, setAudioWidth] = React.useState(400);

    // Measure audio container width
    React.useEffect(() => {
        if (!file.mimeType?.startsWith('audio/') || !audioContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = Math.floor(entry.contentRect.width);
                if (w > 0) setAudioWidth(w);
            }
        });
        observer.observe(audioContainerRef.current);
        return () => observer.disconnect();
    }, [file.mimeType]);

    // Load signed URLs for media files
    React.useEffect(() => {
        const loadUrls = async () => {
            try {
                if (file.mimeType?.startsWith('image/')) {
                    const url = await getCachedUrl(file.path, file.level?.toLowerCase() || 'protected', file.identityId);
                    setImageUrl(url);
                } else if (file.mimeType?.startsWith('audio/')) {
                    const url = await getCachedUrl(file.path, file.level?.toLowerCase() || 'protected', file.identityId);
                    setAudioUrl(url);
                } else if (file.mimeType?.startsWith('video/')) {
                    const url = await getCachedUrl(file.path, file.level?.toLowerCase() || 'protected', file.identityId);
                    setVideoUrl(url);
                }
            } catch (error) {
                console.error('Error loading file URL:', error);
            }
        };

        loadUrls();
    }, [file.id, file.path, file.level, file.identityId, file.mimeType]);

    const handleMenuAction = async (action) => {
        switch (action) {
            case 'insert-image':
                if (editor) {
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                        altText: file.name,
                        path: file.path,
                        identityId: file.identityId,
                    });
                }
                break;
            case 'insert-audio':
                if (editor) {
                    editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [file.id]);
                }
                break;
            case 'download':
                try {
                    const url = await getCachedUrl(file.path, 'protected', file.identityId);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error('Error downloading file:', error);
                }
                break;
            case 'delete':
                setConfirmDialog({
                    open: true,
                    message: `Delete ${file.name}?`,
                    severity: 'warning',
                    onConfirm: async () => {
                        try {
                            console.log('[FileManager2] Deleting single file:', file.name, file.id);
                            await deleteFileCompletely(file);
                            console.log('[FileManager2] Successfully deleted:', file.name);
                            setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                        } catch (error) {
                            console.error('[FileManager2] Failed to delete file:', file.name, error);
                            setConfirmDialog({
                                open: true,
                                message: `Failed to delete ${file.name}: ${error.message}`,
                                severity: 'error',
                                onConfirm: () => setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' })
                            });
                        }
                    }
                });
                break;
            case 're-analyze':
                try {
                    if (isAnalyzableDocument(file.mimeType)) {
                        console.log('[FileManager2] Re-analyzing document:', file.name, 'type:', file.mimeType, 'documentID:', file.documentID);
                        
                        // Analyze document - analyzeDocument will create Document if needed
                        await analyzePDF(file.id);
                        console.log('[FileManager2] Document analysis started for:', file.name);
                        
                        // Generate embeddings after analysis
                        console.log('[FileManager2] Generating embeddings for:', file.name);
                        await generateEmbeddings(file.id);
                        console.log('[FileManager2] Embedding generation started for:', file.name);
                    } else if (file.documentID) {
                        // For non-analyzable files with existing embeddings, just regenerate
                        console.log('[FileManager2] Re-generating embeddings for:', file.name);
                        await generateEmbeddings(file.id);
                        console.log('[FileManager2] Embedding generation started for:', file.name);
                    } else {
                        console.warn('[FileManager2] Cannot re-analyze - not an analyzable document and no documentID:', file.name, file.mimeType);
                    }
                } catch (error) {
                    console.error('[FileManager2] Error re-analyzing document:', error);
                    // Show error to user
                    setConfirmDialog({
                        open: true,
                        message: `Error re-analyzing ${file.name}: ${error.message}`,
                        severity: 'error',
                        onConfirm: () => {
                            setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                        }
                    });
                }
                break;
        }
    };

    return (
        <Box
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: 2,
                flexShrink: 0
            }}
        >
            {/* File Preview, Audio Player, or Video Player */}
            <Box
                sx={{
                    width: '100%',
                    minHeight: '200px',
                    mb: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    p: 2
                }}
            >
                {file.mimeType?.startsWith('image/') ? (
                    imageUrl ? (
                        <Box
                            component="img"
                            src={imageUrl}
                            alt={file.name}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: 300,
                                objectFit: 'cover',
                                borderRadius: 1
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <CircularProgress />
                    )
                ) : file.mimeType?.startsWith('audio/') ? (
                    audioUrl ? (
                        <Box ref={audioContainerRef} sx={{ width: '100%', overflow: 'hidden' }}>
                            <AudioWaveformPlayer
                                audioUrl={audioUrl}
                                file={file}
                                waveformData={file.waveformData ? JSON.parse(file.waveformData) : undefined}
                                width={Math.max(audioWidth - 36, 100)}
                                height={80}
                                title={file.name}
                                showDuration={true}
                            />
                        </Box>
                    ) : (
                        <Box ref={audioContainerRef} sx={{ width: '100%', overflow: 'hidden' }}>
                            <StaticWaveform
                                file={file}
                                waveformData={file.waveformData ? JSON.parse(file.waveformData) : undefined}
                                width={Math.max(audioWidth - 2, 100)}
                                height={80}
                                backgroundColor="transparent"
                            />
                        </Box>
                    )
                ) : file.mimeType?.startsWith('video/') ? (
                    videoUrl ? (
                        <video
                            controls
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        >
                            <source src={videoUrl} type={file.mimeType} />
                            {t('fileManager2.fileDetails.videoNotSupported')}
                        </video>
                    ) : (
                        <CircularProgress />
                    )
                ) : (
                    <Box sx={{ textAlign: 'center', color: 'action.disabled' }}>
                        {file.mimeType === 'application/pdf' && <PictureAsPdfIcon sx={{ fontSize: '64px' }} />}
                        {file.mimeType !== 'application/pdf' && <DescriptionIcon sx={{ fontSize: '64px' }} />}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                    {file.name}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                    {(file.size / 1000).toFixed(2)} KB
                </Typography>
                {documentStatus && (
                    <Chip
                        label={documentStatus.status}
                        size="small"
                        variant="outlined"
                    />
                )}
                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {editor && file.mimeType?.startsWith('image/') && (
                        <Tooltip title={t('fileManager2.fileDetails.insertTooltip')}>
                            <IconButton size="small" onClick={() => handleMenuAction('insert-image')}>
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {editor && (file.mimeType?.startsWith('audio/') || file.mimeType === 'application/octet-stream') && (
                        <Tooltip title={t('fileManager2.fileDetails.insertTooltip')}>
                            <IconButton size="small" onClick={() => handleMenuAction('insert-audio')}>
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title={t('fileManager2.fileDetails.downloadTooltip')}>
                        <IconButton size="small" onClick={() => handleMenuAction('download')} aria-label={t('fileManager2.fileDetails.downloadTooltip')}>
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {(isAnalyzableDocument(file.mimeType) || file.documentID) && (
                        <Tooltip title={t('fileManager2.fileDetails.reAnalyzeTooltip')}>
                            <IconButton size="small" onClick={() => handleMenuAction('re-analyze')} aria-label={t('fileManager2.fileDetails.reAnalyzeTooltip')}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title={t('fileManager2.fileDetails.deleteTooltip')}>
                        <IconButton size="small" onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }} aria-label={t('fileManager2.fileDetails.deleteTooltip')}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
});

// =============================================================================
// FileRowComponent - Renders individual file rows based on file type
// =============================================================================

const FileRowComponent = React.memo(function FileRowComponent({ file, fileType, index, isSelected, allFiles, selectedItems, setSelectedItems, search }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedName, setEditedName] = React.useState(file.name);
    const [isSaving, setIsSaving] = React.useState(false);
    const { handleFileNameUpdate } = useFileManager();
    const isEvenRow = index % 2 === 0;
    
    // Lazy Yjs: Only connect when editing
    const { metadata, updateMetadata, forceSave, isSynced } = useYjsFile({
        fileId: isEditing ? file.id : null,
        enableWebSocket: isEditing,
        enablePersistence: false // No need for IndexedDB on quick edits
    });

    const handleSaveFileName = async () => {
        if (!editedName.trim() || editedName === file.name) {
            setIsEditing(false);
            setEditedName(file.name);
            return;
        }

        try {
            setIsSaving(true);
            
            // Extract extension from original filename
            const originalName = file.name;
            const lastDotIndex = originalName.lastIndexOf('.');
            const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

            // Check if new name has an extension
            const newNameTrimmed = editedName.trim();
            const newHasExtension = newNameTrimmed.lastIndexOf('.') > 0;

            // If new name doesn't have extension, append the original extension
            const finalName = newHasExtension ? newNameTrimmed : newNameTrimmed + extension;
            
            // Use Yjs metadata for real-time sync if available
            if (metadata && updateMetadata) {
                updateMetadata({ name: finalName });
                await forceSave(); // Force immediate save to GraphQL
                console.log('[FileRowComponent] Saved via Yjs:', finalName);
            } else {
                // Fallback to direct GraphQL if Yjs not ready
                await handleFileNameUpdate(file.id, finalName);
                console.log('[FileRowComponent] Saved via GraphQL:', finalName);
            }
            
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating filename:', error);
            setEditedName(file.name);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedName(file.name);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveFileName();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleCheckboxChange = React.useCallback((e) => {
        e.stopPropagation();
        
        if (e.shiftKey) {
            // Shift-click: range select
            const selectedArray = Array.from(selectedItems);
            if (selectedArray.length === 0) {
                // No previous selection, just toggle this file
                setSelectedItems(new Set([file.id]));
            } else {
                // Find range between last selected and current file
                const lastSelectedId = selectedArray[selectedArray.length - 1];
                const lastSelectedIndex = allFiles.findIndex(f => f.id === lastSelectedId);
                const currentIndex = allFiles.findIndex(f => f.id === file.id);
                
                const start = Math.min(lastSelectedIndex, currentIndex);
                const end = Math.max(lastSelectedIndex, currentIndex);
                
                const rangeSet = new Set(selectedArray);
                for (let i = start; i <= end; i++) {
                    rangeSet.add(allFiles[i].id);
                }
                setSelectedItems(rangeSet);
            }
        } else {
            // Toggle selection
            const newSet = new Set(selectedItems);
            if (newSet.has(file.id)) {
                newSet.delete(file.id);
            } else {
                newSet.add(file.id);
            }
            setSelectedItems(newSet);
        }
    }, [selectedItems, setSelectedItems, allFiles, file.id]);

    const handleRowClick = React.useCallback((e) => {
        if (isEditing) return;

        // Shift-click: range select
        if (e.shiftKey) {
            const selectedArray = Array.from(selectedItems);
            if (selectedArray.length === 0) {
                // No previous selection, just select this file
                setSelectedItems(new Set([file.id]));
            } else {
                // Find range between last selected and current file
                const lastSelectedId = selectedArray[selectedArray.length - 1];
                const lastSelectedIndex = allFiles.findIndex(f => f.id === lastSelectedId);
                const currentIndex = allFiles.findIndex(f => f.id === file.id);
                
                const start = Math.min(lastSelectedIndex, currentIndex);
                const end = Math.max(lastSelectedIndex, currentIndex);
                
                const rangeSet = new Set(selectedArray);
                for (let i = start; i <= end; i++) {
                    rangeSet.add(allFiles[i].id);
                }
                setSelectedItems(rangeSet);
            }
        } else {
            // Single click: select only this file
            setSelectedItems(new Set([file.id]));
        }
    }, [isEditing, selectedItems, setSelectedItems, allFiles, file.id]);

    const handleFileNameClick = React.useCallback((e) => {
        e.stopPropagation();
        setSelectedItems(new Set([file.id]));
        setIsEditing(true);
    }, [file.id, setSelectedItems]);

    const typographySx = React.useMemo(() => ({
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline',
            color: 'primary.main'
        }
    }), []);

    return (
        <Box
            onClick={handleRowClick}
            sx={{
                backgroundColor: isSelected ? 'action.selected' : isEvenRow ? 'action.hover' : 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                borderLeft: '3px solid',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'text' : 'pointer',
                p: 1,
                pl: 0.625, // Consistent left padding with 3px border
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                '&:hover': {
                    backgroundColor: isSelected ? 'action.selected' : 'action.focus'
                }
            }}>
            {/* Selection Checkbox */}
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    sx={{ p: 0, mr: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                />
            </Box>
            {/* File Icon */}
            <Box sx={{ flexShrink: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {fileType === 'images' && <ImageIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
                {fileType === 'audio' && <AudioFileIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
                {fileType === 'documents' && <PictureAsPdfIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
                {fileType === 'video' && <ArticleIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
                {fileType === 'scripts' && <TheaterComedyIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
                {fileType === 'other' && <DescriptionIcon sx={{ fontSize: '20px', color: isSelected ? 'primary.main' : 'inherit', transition: 'color 0.2s' }} />}
            </Box>

            {/* File Name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                    <TextField
                        size="small"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleSaveFileName}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        disabled={isSaving}
                        fullWidth
                    />
                ) : (
                    <Typography
                        variant="body2"
                        onClick={handleFileNameClick}
                        sx={typographySx}
                    >
                        {search ? highlightMatches(file.name, search) : file.name}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if these specific props change
    return (
        prevProps.file.id === nextProps.file.id &&
        prevProps.fileType === nextProps.fileType &&
        prevProps.index === nextProps.index &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.search === nextProps.search
        // Don't compare allFiles, selectedItems, or setSelectedItems to avoid re-renders on scroll
    );
});

const ListItemImage = React.memo(function ListItemImage({ file }) {
    const [url, setUrl] = React.useState(null);

    React.useEffect(() => {
        const asyncFunc = async () => {
            const _url = await getCachedUrl(file.path, 'protected', file.identityId)
            setUrl(_url);
        }
        asyncFunc();
    }, [file.path, file.identityId]);

    return (
        <>
            {file.mimeType.includes('image') &&
                <img
                    src={url}
                    style={{
                        width: '3rem',
                        height: '3rem',
                        objectFit: 'contain',
                    }}
                />
            }
            {file.mimeType.includes('audio') && (
                url ? (
                    <Box sx={{ width: '100%' }}>
                        <AudioWaveformPlayer
                            audioUrl={url}
                            displayTitle={true}
                            title={file.name}
                            waveformData={file.waveformData ? JSON.parse(file.waveformData) : undefined}
                            width={200}
                            height={60}
                            showDuration={true}
                        />
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                )
            )}
        </>)
});

/**
 * Helper function to completely delete a file from both Gen2 client and S3
 * @param {FileModel} file - The file model to delete
 * @returns {Promise<void>}
 */
async function deleteFileCompletely(file) {
    if (!file) return;

    try {
        const client = getAmplifyClient();

        // Delete associated Document and all its relationships if it exists
        if (file.documentID) {
            const { data: document } = await client.models.Document.get({ id: file.documentID });
            if (document) {
                console.log('Deleting Document and all related records:', file.documentID);
                
                // Delete embeddings from IndexedDB
                try {
                    await deleteEmbeddings(file.documentID);
                    console.log('Deleted embeddings for document:', file.documentID);
                } catch (embError) {
                    console.warn('Failed to delete embeddings:', embError);
                }

                // Delete all ParsedContent records associated with this document
                const { data: parsedContents } = await client.models.ParsedContent.list({
                    filter: { documentID: { eq: file.documentID } }
                });
                for (const parsedContent of parsedContents || []) {
                    await client.models.ParsedContent.delete({ id: parsedContent.id });
                }
                console.log(`Deleted ${parsedContents?.length || 0} ParsedContent records`);

                // Delete all UnitDocument join table entries
                const { data: unitDocuments } = await client.models.UnitDocument.list({
                    filter: { documentID: { eq: file.documentID } }
                });
                for (const unitDoc of unitDocuments || []) {
                    await client.models.UnitDocument.delete({ id: unitDoc.id });
                }
                console.log(`Deleted ${unitDocuments?.length || 0} UnitDocument links`);

                // Delete all DocumentWord join table entries
                const { data: documentWords } = await client.models.DocumentWord.list({
                    filter: { documentID: { eq: file.documentID } }
                });
                for (const docWord of documentWords || []) {
                    await client.models.DocumentWord.delete({ id: docWord.id });
                }
                console.log(`Deleted ${documentWords?.length || 0} DocumentWord links`);

                // Delete all DocumentQuestion join table entries
                const { data: documentQuestions } = await client.models.DocumentQuestion.list({
                    filter: { documentID: { eq: file.documentID } }
                });
                for (const docQuestion of documentQuestions || []) {
                    await client.models.DocumentQuestion.delete({ id: docQuestion.id });
                }
                console.log(`Deleted ${documentQuestions?.length || 0} DocumentQuestion links`);

                // Delete all AgentJob records
                const { data: agentJobs } = await client.models.AgentJob.list({
                    filter: { documentID: { eq: file.documentID } }
                });
                for (const job of agentJobs || []) {
                    await client.models.AgentJob.delete({ id: job.id });
                }
                console.log(`Deleted ${agentJobs?.length || 0} AgentJob records`);
                
                // Finally delete the Document model itself
                await client.models.Document.delete({ id: file.documentID });
                console.log('Deleted Document model:', file.documentID);
            }
        }

        // Delete all File relationship join table entries
        
        // Delete UnitFile join table entries
        const { data: unitFiles } = await client.models.UnitFile.list({
            filter: { fileID: { eq: file.id } }
        });
        for (const unitFile of unitFiles || []) {
            await client.models.UnitFile.delete({ id: unitFile.id });
        }
        console.log(`Deleted ${unitFiles?.length || 0} UnitFile links`);

        // Delete WordFile join table entries
        const { data: wordFiles } = await client.models.WordFile.list({
            filter: { fileID: { eq: file.id } }
        });
        for (const wordFile of wordFiles || []) {
            await client.models.WordFile.delete({ id: wordFile.id });
        }
        console.log(`Deleted ${wordFiles?.length || 0} WordFile links`);

        // Delete QuestionFile join table entries
        const { data: questionFiles } = await client.models.QuestionFile.list({
            filter: { fileID: { eq: file.id } }
        });
        for (const questionFile of questionFiles || []) {
            await client.models.QuestionFile.delete({ id: questionFile.id });
        }
        console.log(`Deleted ${questionFiles?.length || 0} QuestionFile links`);

        // Delete AssistantChatFile join table entries
        const { data: chatFiles } = await client.models.AssistantChatFile.list({
            filter: { fileID: { eq: file.id } }
        });
        for (const chatFile of chatFiles || []) {
            await client.models.AssistantChatFile.delete({ id: chatFile.id });
        }
        console.log(`Deleted ${chatFiles?.length || 0} AssistantChatFile links`);

        // Delete ParsedContent associated directly with the file
        const { data: fileParsedContents } = await client.models.ParsedContent.list({
            filter: { fileID: { eq: file.id } }
        });
        for (const parsedContent of fileParsedContents || []) {
            await client.models.ParsedContent.delete({ id: parsedContent.id });
        }
        console.log(`Deleted ${fileParsedContents?.length || 0} ParsedContent records for file`);

        // Delete the File model itself
        await client.models.File.delete({ id: file.id });
        console.log('Successfully deleted File model:', file.id);

        // Delete from S3 - must provide accessLevel and identityId for protected files
        try {
            await remove({ 
                key: file.path,
                options: {
                    accessLevel: 'protected',
                    identityId: file.identityId
                }
            });
            console.log('Deleted S3 file:', file.path);
        } catch (s3Error) {
            console.error('S3 deletion error (file may not exist):', s3Error);
            // Don't throw - file model is already deleted
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Component to handle selected file view with parsedContent
 * parsedContent is lazy-loaded via Amplify Gen 2 hasMany relationship
 */
function SelectedFileView({ selectedFile, documentStatus, search, editor }) {
    const [parsedContent, setParsedContent] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        setParsedContent(null);

        const loadParsedContent = async () => {
            try {
                if (typeof selectedFile.parsedContent === 'function') {
                    const result = await selectedFile.parsedContent();
                    if (!cancelled) {
                        setParsedContent(result?.data?.[0] || null);
                    }
                } else if (Array.isArray(selectedFile.parsedContent)) {
                    if (!cancelled) {
                        setParsedContent(selectedFile.parsedContent[0] || null);
                    }
                }
            } catch (err) {
                console.error('[SelectedFileView] Failed to load parsedContent:', err);
            }
        };

        if (selectedFile?.id) {
            loadParsedContent();
        }

        return () => { cancelled = true; };
    }, [selectedFile?.id, selectedFile?._version]);

    return (
        <>
            <FileDetailsPanel
                file={selectedFile}
                documentStatus={documentStatus}
                editor={editor}
            />
            {/* Metadata Editor */}
            <MetadataEditor
                file={selectedFile}
            />
            {/* File Content */}
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <ExpandedFileContent
                    file={selectedFile}
                    parsedContent={parsedContent}
                    search={search}
                    editor={editor}
                />
            </Box>
        </>
    );
}

/**
 * Component to render selected file details panel
 * Handles finding the selected file and wrapping with Suspense
 */
function SelectedFileDetailsPanel({ selectedItems, files, documentStatuses, search, editor }) {
    const { t } = useTranslation('editor.files');
    if (selectedItems.size === 0) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                }}
            >
                <Typography variant="body2">
                    {t('fileManager2.selectedFileDetails.emptyState')}
                </Typography>
            </Box>
        );
    }

    // Multi-select summary
    if (selectedItems.size > 1) {
        const selectedFiles = files.filter(f => selectedItems.has(f.id));
        const totalSize = selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        const byType = {};
        selectedFiles.forEach(f => {
            const type = f.mimeType?.split('/')[0] || 'other';
            byType[type] = (byType[type] || 0) + 1;
        });

        return (
            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('fileManager2.selectedFileDetails.multiSelectHeading', {
                        count: selectedItems.size,
                        defaultValue: '{{count}} files selected'
                    })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('fileManager2.selectedFileDetails.totalSize', {
                        size: (totalSize / 1024).toFixed(1),
                        defaultValue: 'Total size: {{size}} KB'
                    })}
                </Typography>
                {Object.entries(byType).map(([type, count]) => (
                    <Chip
                        key={type}
                        label={`${type}: ${count}`}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                    />
                ))}
                <Box component="ul" sx={{ mt: 2, pl: 2, m: 0 }}>
                    {selectedFiles.map(f => (
                        <Typography component="li" variant="body2" key={f.id} sx={{ py: 0.25 }}>
                            {f.name}
                        </Typography>
                    ))}
                </Box>
            </Box>
        );
    }

    const firstSelectedId = Array.from(selectedItems)[0];
    const selectedFile = files.find(f => f.id === firstSelectedId);
    if (!selectedFile) return null;

    const documentStatus = documentStatuses[selectedFile.documentID];
    
    return (
        <React.Suspense fallback={
            <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
            }}>
                <CircularProgress size={24} />
            </Box>
        }>
            <SelectedFileView
                selectedFile={selectedFile}
                documentStatus={documentStatus}
                search={search}
                editor={editor}
            />
        </React.Suspense>
    );
}

export default function FileManager2() {
    console.log('[FileManager2] Component render started');
    const { t } = useTranslation('editor.files');
    const [editor] = useLexicalComposerContext();
    const [search, setSearch] = React.useState('');
    const [searchMode, setSearchMode] = React.useState('hybrid'); // 'keyword', 'semantic', 'hybrid'
    const [searching, setSearching] = React.useState(false);
    const [selectedItems, setSelectedItems] = React.useState(new Set());

    const { files, documents, session } = React.useContext(FilesContext);
    const { identityId } = session || {};
    const { unit } = React.useContext(UnitContext);

    // RecordingStudio3 modal state (hoisted for handleStudioSave callback)
    const [studioOpen, setStudioOpen] = React.useState(false);
    const [studioScriptFile, setStudioScriptFile] = React.useState(null);




    // Load expanded items from localStorage
    const [expandedItems, setExpandedItems] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fileManager2_expandedItems');
            if (saved) {
                try {
                    return new Set(JSON.parse(saved));
                } catch (e) {
                    return new Set();
                }
            }
        }
        return new Set();
    });

    // Track collapsed protection levels - all expanded by default
    const [collapsedProtectionLevels, setCollapsedProtectionLevels] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fileManager2_collapsedProtectionLevels');
            if (saved) {
                try {
                    return new Set(JSON.parse(saved));
                } catch (e) {
                    return new Set();
                }
            }
        }
        return new Set();
    });

    const handleToggleProtectionLevelCollapse = (protectionLevel) => {
        setCollapsedProtectionLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(protectionLevel)) {
                newSet.delete(protectionLevel);
            } else {
                newSet.add(protectionLevel);
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem('fileManager2_collapsedProtectionLevels', JSON.stringify(Array.from(newSet)));
            }
            return newSet;
        });
    };

    // Track collapsed file types - all expanded by default
    const [collapsedFileTypes, setCollapsedFileTypes] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fileManager2_collapsedFileTypes');
            if (saved) {
                try {
                    return new Set(JSON.parse(saved));
                } catch (e) {
                    return new Set();
                }
            }
        }
        return new Set();
    });

    const handleToggleFileTypeCollapse = (fileTypeKey) => {
        setCollapsedFileTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileTypeKey)) {
                newSet.delete(fileTypeKey);
            } else {
                newSet.add(fileTypeKey);
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem('fileManager2_collapsedFileTypes', JSON.stringify(Array.from(newSet)));
            }
            return newSet;
        });
    };

    // Persist expanded items to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('fileManager2_expandedItems', JSON.stringify(Array.from(expandedItems)));
        }
    }, [expandedItems]);

    const [contextMenu, setContextMenu] = React.useState(null);
    const [confirmDialog, setConfirmDialog] = React.useState({ open: false, message: '', onConfirm: null, severity: 'warning' });
    const [editingFileId, setEditingFileId] = React.useState(null);
    const [semanticResults, setSemanticResults] = React.useState(null); // {fileId: {maxScore, pages: [{page, score}]}}
    const [fileEmbeddings, setFileEmbeddings] = React.useState({}); // Cache embeddings

    // Use vector store from FilesContext (shared across entire app, initialized early)
    const { vectorStore, vectorStoreReady } = React.useContext(FilesContext);
    const loadedVersions = React.useRef(new Map()); // Track loaded document versions

    const debouncedSearch = React.useRef(
        debounce((value) => {
            setSearch(value);
        }, 300)
    ).current;

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);

        // Trigger semantic search for semantic/hybrid modes
        if ((searchMode === 'semantic' || searchMode === 'hybrid') && value.trim()) {
            performSemanticSearch(value);
        } else {
            setSemanticResults(null);
        }
    }

    // Select/Deselect handlers
    const handleSelectAll = () => {
        // Filter out null items before mapping to IDs
        const allFileIds = new Set(files.filter(f => f != null && f.id != null).map(f => f.id));
        setSelectedItems(allFileIds);
    };

    const handleDeselectAll = () => {
        setSelectedItems(new Set());
    };

    const handleToggleSelect = (fileId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
            }
            return newSet;
        });
    };

    // --- RecordingStudio3 handlers ---

    /**
     * Open RS3 with a new conversation preset, or re-open an existing script file.
     * @param {Object|null} scriptFile - Existing File record with mimeType text/x-fountain, or null for new
     */
    const handleOpenStudio = React.useCallback((scriptFile = null) => {
        setStudioScriptFile(scriptFile);
        setStudioOpen(true);
    }, []);

    /**
     * RS3Modal onSave handler — creates File records for audio takes and
     * persists the script as a text/x-fountain File record.
     */
    const handleStudioSave = React.useCallback(async (payload) => {
        const { audioFiles, scriptData } = payload;
        console.log('[FileManager2] RS3 save payload:', { audioCount: audioFiles?.length, scriptData: !!scriptData });

        const client = getAmplifyClient();
        const createdFileIds = [];

        // 1. Create File model records for each audio take with an audioPath
        if (audioFiles?.length > 0) {
            for (const audioFile of audioFiles) {
                if (!audioFile.audioPath) continue;

                try {
                    const { data: newFile, errors } = await client.models.File.create({
                        path: audioFile.audioPath,
                        owner: session?.username,
                        identityId,
                        name: `${audioFile.speakerName || 'audio'} - ${(audioFile.text || '').slice(0, 40)}.mp3`,
                        mimeType: 'audio/mpeg',
                        level: 'PROTECTED',
                        waveformData: audioFile.waveformData ? JSON.stringify(audioFile.waveformData) : null,
                    });

                    if (errors?.length > 0 || !newFile) {
                        console.error('[FileManager2] Error creating audio File record:', errors);
                        continue;
                    }

                    createdFileIds.push(newFile.id);
                    console.log('[FileManager2] Created audio File record:', newFile.id);
                } catch (error) {
                    console.error('[FileManager2] Error creating audio File record:', error);
                }
            }
        }

        // 2. Persist the script as a text/x-fountain File record for re-opening
        if (scriptData) {
            try {
                const scriptTitle = scriptData.metadata?.title || 'Conversation';
                const scriptContent = JSON.stringify(scriptData);
                const scriptBlob = new Blob([scriptContent], { type: 'text/x-fountain' });
                const scriptFileName = `${scriptTitle.replace(/[^a-zA-Z0-9]/g, '_')}.fountain`;
                const s3Path = `protected/${identityId}/scripts/${scriptFileName}`;

                // Upload script content to S3
                const { uploadData } = await import('aws-amplify/storage');
                await uploadData({
                    path: s3Path,
                    data: scriptBlob,
                    options: { contentType: 'text/x-fountain' },
                }).result;

                // Create or update File record for the script
                if (studioScriptFile) {
                    // Update existing script file
                    await client.models.File.update({
                        id: studioScriptFile.id,
                        path: s3Path,
                        name: scriptFileName,
                        metadata: JSON.stringify({
                            voiceAssignments: Object.fromEntries(
                                Object.entries(scriptData.speakers || {}).map(([id, s]) => [id, s.voice])
                            ),
                        }),
                    });
                    console.log('[FileManager2] Updated script File record:', studioScriptFile.id);
                } else {
                    // Create new script file
                    const { data: scriptFile, errors } = await client.models.File.create({
                        path: s3Path,
                        owner: session?.username,
                        identityId,
                        name: scriptFileName,
                        mimeType: 'text/x-fountain',
                        level: 'PROTECTED',
                        size: scriptBlob.size,
                        metadata: JSON.stringify({
                            voiceAssignments: Object.fromEntries(
                                Object.entries(scriptData.speakers || {}).map(([id, s]) => [id, s.voice])
                            ),
                        }),
                    });

                    if (errors?.length > 0 || !scriptFile) {
                        console.error('[FileManager2] Error creating script File record:', errors);
                    } else {
                        console.log('[FileManager2] Created script File record:', scriptFile.id);
                    }
                }
            } catch (error) {
                console.error('[FileManager2] Error persisting script:', error);
            }
        }

        // 3. Insert audio files into editor via INSERT_PLAYLIST_COMMAND
        if (createdFileIds.length > 0 && editor) {
            editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, createdFileIds);
            console.log('[FileManager2] Dispatched INSERT_PLAYLIST_COMMAND with', createdFileIds.length, 'files');
        }
    }, [identityId, session, editor, studioScriptFile]);

    // // Expand/Collapse handlers
    // const handleExpandAll = () => {
    //     const allFileIds = new Set(files.map(f => f.id));
    //     setExpandedItems(allFileIds);
    // };

    // const handleCollapseAll = () => {
    //     setExpandedItems(new Set());
    // };

    // const handleToggleExpand = (fileId) => {
    //     setExpandedItems(prev => {
    //         const newSet = new Set(prev);
    //         if (newSet.has(fileId)) {
    //             newSet.delete(fileId);
    //         } else {
    //             newSet.add(fileId);
    //         }
    //         return newSet;
    //     });
    // };

    // Handle filename updates
    const handleFileNameUpdate = async (fileId, newName) => {
        try {
            const fileToUpdate = files.find(f => f.id === fileId);
            if (!fileToUpdate) return;

            // Extract extension from original filename
            const originalName = fileToUpdate.name;
            const lastDotIndex = originalName.lastIndexOf('.');
            const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

            // Check if new name has an extension
            const newNameTrimmed = newName.trim();
            const newHasExtension = newNameTrimmed.lastIndexOf('.') > 0;

            // If new name doesn't have extension, append the original extension
            const finalName = newHasExtension ? newNameTrimmed : newNameTrimmed + extension;

            const client = getAmplifyClient();
            await client.models.File.update({
                id: fileToUpdate.id,
                name: finalName
            });

            console.log('File name updated successfully');
            setEditingFileId(null);
        } catch (error) {
            console.error('Error updating file name:', error);
            alert('Failed to update file name: ' + error.message);
        }
    };

    // Handle escape key to cancel editing
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && editingFileId) {
                setEditingFileId(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [editingFileId]);



    const [isDragging, setIsDragging] = React.useState(false);
    const [fileOperations, setFileOperations] = React.useState([]);
    const [filesToUpload, setFilesToUpload] = React.useState([]);
    const uploadInProgressRef = React.useRef(false);
    const [newFileFormOpen, setNewFileFormOpen] = React.useState(false);
    
    // Calculate overall upload progress
    const uploadProgress = React.useMemo(() => {
        if (fileOperations.length === 0) return 0;
        const totalProgress = fileOperations.reduce((sum, op) => {
            const percent = parseInt(op.progress) || 0;
            return sum + percent;
        }, 0);
        return Math.round(totalProgress / fileOperations.length);
    }, [fileOperations]);
    const [newImageFileFormOpen, setNewImageFileFormOpen] = React.useState(false);

    // Load generator tab from localStorage, default to 'all'
    const [generator, setGenerator] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fileManager2_activeTab');
            return saved || 'all';
        }
        return 'all';
    });

    // Persist tab selection to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('fileManager2_activeTab', generator);
        }
    }, [generator]);

    const [selectedDocument, setSelectedDocument] = React.useState(null);
    const [suggestionTab, setSuggestionTab] = React.useState(0);

    // Debug: log files received
    React.useEffect(() => {
        console.log('[FileManager2] Files received from context:', files?.length || 0, files);
    }, [files]);
    const documentStatuses = documents || {};

    // Enhanced text search function
    const performSimpleTextSearch = React.useCallback((query) => {
        if (!query.trim()) {
            setSemanticResults(null);
            return;
        }

        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        const results = {};

        // Search through file names and any extracted content
        files.forEach(file => {
            const fileName = file.name.toLowerCase();
            const filePath = file.path?.toLowerCase() || '';
            const matches = [];

            // Check file name matches
            searchTerms.forEach(term => {
                if (fileName.includes(term)) {
                    matches.push({ type: 'filename', score: 0.9, text: file.name, term });
                }
                if (filePath.includes(term)) {
                    matches.push({ type: 'path', score: 0.7, text: file.path, term });
                }
            });

            // Check parsed content if available (parsedContent is a hasMany array, take first item)
            const parsedContent = file.parsedContent?.[0] || file.document?.parsedContent?.[0];
            console.log('[SimpleTextSearch] Parsed content for file', file.id, parsedContent);
            if (parsedContent) {
                // Search vocabulary
                (parsedContent.vocabulary || []).forEach(v => {
                    const vocabText = `${v.term} ${v.definition}`.toLowerCase();
                    searchTerms.forEach(term => {
                        if (vocabText.includes(term)) {
                            matches.push({ type: 'vocabulary', score: 0.8, text: `${v.term}: ${v.definition}`, term });
                        }
                    });
                });

                // Search summaries
                (parsedContent.summaries || []).forEach(s => {
                    const summaryText = s.content.toLowerCase();
                    searchTerms.forEach(term => {
                        if (summaryText.includes(term)) {
                            matches.push({ type: 'summary', score: 0.6, text: s.content, term });
                        }
                    });
                });

                // Search objectives
                (parsedContent.objectives || []).forEach(o => {
                    const objText = o.description.toLowerCase();
                    searchTerms.forEach(term => {
                        if (objText.includes(term)) {
                            matches.push({ type: 'objective', score: 0.6, text: o.description, term });
                        }
                    });
                });

                // Search concepts
                (parsedContent.concepts || []).forEach(c => {
                    const conceptText = `${c.name} ${c.description}`.toLowerCase();
                    searchTerms.forEach(term => {
                        if (conceptText.includes(term)) {
                            matches.push({ type: 'concept', score: 0.6, text: `${c.name}: ${c.description}`, term });
                        }
                    });
                });

                // Search questions
                (parsedContent.questions || []).forEach(q => {
                    const questionText = `${q.question} ${q.answer || ''}`.toLowerCase();
                    searchTerms.forEach(term => {
                        if (questionText.includes(term)) {
                            matches.push({ type: 'question', score: 0.7, text: `Q: ${q.question}${q.answer ? ` A: ${q.answer}` : ''}`, term });
                        }
                    });
                });
            }

            if (matches.length > 0) {
                // Sort matches by score and create pages
                matches.sort((a, b) => b.score - a.score);
                const maxScore = Math.max(...matches.map(m => m.score));

                results[file.id] = {
                    maxScore,
                    pages: matches.slice(0, 10).map((match, index) => ({
                        page: index + 1,
                        score: match.score,
                        text: match.text,
                        type: match.type
                    }))
                };
            }
        });

        setSemanticResults(Object.keys(results).length > 0 ? results : null);
    }, [files]);

    // Enhanced text search function (no external API calls)
    const performSemanticSearch = React.useCallback(async (query) => {
        if (!query.trim()) {
            setSemanticResults(null);
            return;
        }

        setSearching(true);
        try {
            // Use enhanced text search instead of external API calls
            performSimpleTextSearch(query);
        } finally {
            setSearching(false);
        }
    }, [performSimpleTextSearch]);

    // Filter files based on search term and mode
    const filteredFiles = React.useMemo(() => {
        if (!search.trim()) return files;

        const searchLower = search.toLowerCase();

        // Helper: Check if file matches keyword search
        const matchesKeyword = (file) => {
            // Search in filename
            if (containsSearchTerm(file.name, search)) return true;

            // Search in file description/summary
            if (file.description && containsSearchTerm(file.description, search)) return true;

            // Search in extracted text (for documents)
            const docStatus = documentStatuses[file.documentID];
            if (docStatus?.extractedText && containsSearchTerm(docStatus.extractedText, search)) return true;

            // Search in metadata if available
            if (file.metadata) {
                const metadataStr = JSON.stringify(file.metadata);
                if (containsSearchTerm(metadataStr, search)) return true;
            }

            return false;
        };

        // Mode-specific filtering
        if (searchMode === 'keyword') {
            // Pure keyword search with highlighting
            return files.filter(matchesKeyword);
        }

        if (searchMode === 'semantic') {
            // Pure semantic search (requires embeddings)
            if (!semanticResults) return files.filter(matchesKeyword); // Fallback to keyword

            // Sort by semantic similarity score (using max page score)
            return files
                .map(file => ({
                    file,
                    score: semanticResults[file.id]?.maxScore || 0,
                    pages: semanticResults[file.id]?.pages || [],
                }))
                .filter(item => item.score > 0.5) // Threshold for relevance
                .sort((a, b) => b.score - a.score)
                .map(item => item.file);
        }

        // Hybrid: Combine keyword and semantic
        if (searchMode === 'hybrid') {
            // Filter out null items before processing
            const validFiles = files.filter(f => f != null && f.id != null);
            const keywordMatches = new Set(validFiles.filter(matchesKeyword).map(f => f.id));

            if (!semanticResults) {
                // No semantic results yet, use keyword only
                return files.filter(f => keywordMatches.has(f.id));
            }

            // Combine: Include keyword matches + high-scoring semantic matches (best page)
            return files
                .map(file => {
                    const keywordMatch = keywordMatches.has(file.id);
                    const semanticScore = semanticResults[file.id]?.maxScore || 0;
                    const pages = semanticResults[file.id]?.pages || [];

                    // Boost score if keyword match
                    const finalScore = keywordMatch ? semanticScore + 0.5 : semanticScore;

                    return { file, score: finalScore, keywordMatch, pages };
                })
                .filter(item => item.keywordMatch || item.score > 0.4)
                .sort((a, b) => b.score - a.score)
                .map(item => item.file);
        }

        return files;
    }, [files, search, searchMode, semanticResults, documentStatuses]);

    // Helper function to organize files by protection level
    const organizeFilesByProtectionLevel = (files) => {
        const organized = {
            'PRIVATE': { images: [], audio: [], documents: [], video: [], scripts: [], other: [] },
            'PUBLIC': { images: [], audio: [], documents: [], video: [], scripts: [], other: [] },
            'PROTECTED': { images: [], audio: [], documents: [], video: [], scripts: [], other: [] },
            'UNSET': { images: [], audio: [], documents: [], video: [], scripts: [], other: [] }
        };

        files.forEach(file => {
            // Default to UNSET if no level property
            const level = file.level || 'UNSET';
            const mimeType = file.mimeType || '';

            // Make sure the level exists in organized
            if (!organized[level]) {
                organized[level] = { images: [], audio: [], documents: [], video: [], scripts: [], other: [] };
            }

            if (mimeType.includes('image')) {
                organized[level].images.push(file);
            } else if (mimeType.includes('audio')) {
                organized[level].audio.push(file);
            } else if (mimeType.includes('video')) {
                organized[level].video.push(file);
            } else if (mimeType === 'text/x-fountain') {
                organized[level].scripts.push(file);
            } else if (
                mimeType === 'application/pdf' ||
                mimeType === 'text/plain' ||
                mimeType === 'text/markdown' ||
                mimeType === 'text/csv' ||
                mimeType === 'application/msword' ||
                mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) {
                organized[level].documents.push(file);
            } else {
                // Default to 'other' for unrecognized types
                organized[level].other.push(file);
            }
        });

        return organized;
    };

    const organizedFiles = React.useMemo(() =>
        organizeFilesByProtectionLevel(filteredFiles),
        [filteredFiles]
    );

    // Flatten file organization into a flat list with headers/subheaders
    const fileListItems = React.useMemo(() => {
        const items = [];

        // For each protection level
        Object.entries(organizedFiles).forEach(([protectionLevel, filesByType]) => {
            const totalFiles = Object.values(filesByType).reduce((sum, files) => sum + files.length, 0);

            if (totalFiles === 0) return;

            const isCollapsed = collapsedProtectionLevels.has(protectionLevel);

            // Add protection level header
            items.push({
                type: 'protection-header',
                level: protectionLevel,
                label: protectionLevel,
                id: `header-${protectionLevel}`,
                totalFiles,
                isExpanded: !isCollapsed,
                onToggleExpand: () => handleToggleProtectionLevelCollapse(protectionLevel)
            });

            // If collapsed, skip rendering files
            if (isCollapsed) return;

            // For each file type (images, audio, documents, video, scripts, other)
            ['images', 'audio', 'documents', 'video', 'scripts', 'other'].forEach(fileType => {
                const fileTypeFiles = filesByType[fileType] || [];

                if (fileTypeFiles.length > 0) {
                    // Add file type subheader
                    const label = fileType.charAt(0).toUpperCase() + fileType.slice(1);
                    const fileTypeKey = `${protectionLevel}-${fileType}`;
                    const isFileTypeCollapsed = collapsedFileTypes.has(fileTypeKey);

                    items.push({
                        type: 'filetype-subheader',
                        fileType,
                        label: `${label} (${fileTypeFiles.length})`,
                        id: `subheader-${protectionLevel}-${fileType}`,
                        fileTypeKey,
                        isExpanded: !isFileTypeCollapsed,
                        onToggleExpand: () => handleToggleFileTypeCollapse(fileTypeKey)
                    });

                    // If collapsed, skip rendering files
                    if (isFileTypeCollapsed) return;

                    // Add individual files
                    fileTypeFiles.forEach(file => {
                        items.push({
                            type: 'file',
                            file,
                            fileType,
                            id: file.id
                        });
                    });
                }
            });
        });

        return items;
    }, [organizedFiles, collapsedProtectionLevels, handleToggleProtectionLevelCollapse, collapsedFileTypes, handleToggleFileTypeCollapse]);

    // Setup parent ref for virtualized scrolling
    const parentRef = React.useRef(null);

    // Setup virtualizer for performance with dynamic measurement
    const virtualizer = useVirtualizer({
        count: fileListItems.length,
        getScrollElement: () => parentRef?.current,
        estimateSize: (index) => {
            const item = fileListItems[index];
            if (item.type === 'protection-header') return 48;
            if (item.type === 'filetype-subheader') return 36;
            // File rows: initial estimate, will be replaced by actual measurements
            return 140;
        },
        // Enable dynamic measurement with ResizeObserver
        measureElement: (element) => {
            // Return actual height of the rendered element
            return element?.getBoundingClientRect().height ?? 140;
        },
        overscan: 3,
    });

    // Note: Settings are now provided by SettingsContext
    // Get settings from context instead of local subscription
    const settingsContext = React.useContext(SettingsContext);
    const settings = settingsContext?.settings || null;

    // Periodic cleanup of old sessionStorage drafts (run every 5 minutes)
    React.useEffect(() => {
        const cleanupDrafts = () => {
            if (typeof window === 'undefined') return;

            // Clean up old drafts for files that no longer exist
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('draft_file_name_')) {
                    try {
                        const fileId = key.replace('draft_file_name_', '');
                        const fileExists = files.some(f => f.id === fileId);
                        if (!fileExists) {
                            sessionStorage.removeItem(key);
                        }
                    } catch (e) {
                        console.warn('Could not process draft item:', key);
                        sessionStorage.removeItem(key); // Remove corrupted items
                    }
                }
            }
        };

        cleanupDrafts(); // Run once on mount
        const interval = setInterval(cleanupDrafts, 5 * 60 * 1000); // Run every 5 minutes

        return () => clearInterval(interval);
    }, [files]);

    // Helper function to get status display info
    const getDocumentStatusInfo = (status) => {
        const statusConfig = {
            'uploaded': {
                icon: <CloudUploadIcon fontSize="small" />,
                color: 'default',
                label: 'Ready',
                chipColor: 'default',
            },
            'extracting': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'info',
                label: 'Extracting...',
                chipColor: 'info',
            },
            'extracted': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'primary',
                label: 'Extracted',
                chipColor: 'primary',
            },
            'analyzing': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'warning',
                label: 'Analyzing...',
                chipColor: 'warning',
            },
            'completed': {
                icon: <CheckCircleIcon fontSize="small" />,
                color: 'success',
                label: 'Analyzed',
                chipColor: 'success',
            },
            'failed': {
                icon: <ErrorIcon fontSize="small" />,
                color: 'error',
                label: 'Failed',
                chipColor: 'error',
            },
        };
        return statusConfig[status] || statusConfig['uploaded'];
    };

    const toggleNewAudioFileForm = () => {
        setNewAudioFileFormOpen(!newAudioFileFormOpen);
    }

    const toggleNewImageFileForm = () => {
        setNewImageFileFormOpen(!newImageFileFormOpen);
    }

    const toggleNewVideoFileForm = () => {
        setNewVideoFileFormOpen(!newVideoFileFormOpen);
    }

    const toggleNewFileForm = () => {
        const newState = !newFileFormOpen;
        setNewFileFormOpen(newState);

        // When opening, also open the form for the current tab
        if (newState) {
            if (generator === 'image') {
                setNewImageFileFormOpen(true);
            } else if (generator === 'audio') {
                setNewAudioFileFormOpen(true);
            } else if (generator === 'video') {
                setNewVideoFileFormOpen(true);
            }
        } else {
            // When closing, close all forms
            setNewImageFileFormOpen(false);
            setNewAudioFileFormOpen(false);
            setNewVideoFileFormOpen(false);
        }
    }




    React.useEffect(() => {

        const asyncFunc = async () => {
            // when files change, upload them to S3
            // and update the entry in the database

            console.log('[FileManager2] Upload useEffect triggered. filesToUpload:', filesToUpload.length, 'uploadInProgress:', uploadInProgressRef.current);

            if (filesToUpload.length === 0 || uploadInProgressRef.current) {
                console.log('[FileManager2] Skipping upload - no files or already in progress');
                return;
            }

            uploadInProgressRef.current = true;

            console.log('[FileManager2] About to start upload. filesToUpload:', filesToUpload.length, filesToUpload);

            const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput, mapIndex) => {
                const { file, index } = fileInput;
                const progressIndex = index !== undefined ? index : mapIndex;

                console.log('[FileManager2] Uploading file:', file.name, 'identityId:', identityId, 'unitId:', unit?.id);

                try {
                    // Use shared utility for file upload
                    const result = await uploadFile(
                        file,
                        identityId,
                        unit?.id,
                        (loaded, total) => {
                            setFileOperations((prev) => {
                                const newFileOperations = [...prev];
                                if (newFileOperations[progressIndex]) {
                                    newFileOperations[progressIndex].progress = Math.round(loaded / total * 100) + '%';
                                }
                                return newFileOperations;
                            });
                        }
                    );

                    console.log('[FileManager2] Upload result:', {
                        fileId: result?.fileModel?.id,
                        fileName: result?.fileModel?.name,
                        documentId: result?.documentModel?.id
                    });

                    // If analyzable document and auto-analyze is enabled, trigger both analysis and embeddings in parallel
                    if (isAnalyzableDocument(file.type) && settings?.autoAnalyzeDocuments && result.documentModel) {
                        console.log('Auto-analyzing and generating embeddings for document:', result.fileModel.id, 'type:', file.type);

                        // Run both in parallel - don't await
                        Promise.all([
                            analyzePDF(result.fileModel.id),
                            generateEmbeddings(result.fileModel.id)
                        ])
                            .then(([analysisResult, embeddingsResult]) => {
                                console.log('Auto-analysis completed:', analysisResult);
                                console.log('Embeddings generation completed:', embeddingsResult);
                            })
                            .catch((error) => {
                                // If already being processed, this is expected - just log as info
                                if (error.message?.includes('currently being processed') || error.message?.includes('already been analyzed')) {
                                    console.log('Document processing already in progress or completed:', error.message);
                                } else {
                                    console.error('Auto-processing failed:', error);
                                }
                            });
                    }
                } catch (error) {
                    console.error('Error uploading file:', error);
                    return { status: 'rejected', reason: error };
                }
            }));

            // Check results and log any failures
            const failures = fileKeys.filter(result => result.status === 'rejected');
            if (failures.length > 0) {
                console.error(`${failures.length} file(s) failed to upload:`, failures);
                failures.forEach((failure, index) => {
                    console.error(`File ${index + 1} error:`, failure.reason);
                });
            }

            const successes = fileKeys.filter(result => result.status === 'fulfilled');
            console.log(`[FileManager2] Upload complete. ${successes.length} succeeded, ${failures.length} failed`);

            // timeout to allow for the UI to update
            setTimeout(() => {
                setFilesToUpload([]);
                setFileOperations([]);
                uploadInProgressRef.current = false;
            }, 1000);
        };

        asyncFunc();

    }, [filesToUpload]);

    // const audioUrls = entry?.audioUrls || [];

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = async (event) => {
        console.log('dropped');
        event.preventDefault();
        //   event.stopPropagation();

        console.log(event.dataTransfer.files);

        const _files = Array.from(event.dataTransfer.files);

        console.log('files>>>>', _files);

        const _toupload = _files.map((f, index) => {
            return {
                file: f,
                index,
            }
        });

        const _fileOperations = _files.map((f) => ({ name: f.name, progress: '0%' }));


        console.log('_toupload', _toupload);
        console.log('_fileOperations', _fileOperations);

        setFilesToUpload(_toupload);
        setFileOperations(_fileOperations);

        setIsDragging(false);
    };

    const handleChange = (event) => {
        console.log('handleChange', event.target.value);

    }

    // Vector store search function exposed to other components
    const performVectorSearch = React.useCallback(async (query, options = {}) => {
        const { topK = 10, filters = {}, includeText = true } = options;

        console.log(`[FileManager2.performVectorSearch] Query: "${query}", topK: ${topK}`);

        if (!query.trim()) {
            return { results: [], query };
        }

        try {
            // Generate embedding for the query
            const client = getAmplifyClient();
            const response = await client.mutations.generateEmbedding({
                content: query,
                model: 'text-embedding-3-small',
                dimensions: 1536
            });

            const queryEmbedding = response.data?.embedding;
            console.log(`[FileManager2.performVectorSearch] Generated ${queryEmbedding.length}D embedding`);

            // Search vector store (now async due to worker usage)
            const results = await vectorStore.search(queryEmbedding, filters, topK, query);
            console.log(`[FileManager2.performVectorSearch] Found ${results.length} results`);

            return {
                success: true,
                query,
                results: results.map(r => ({
                    id: r.id,
                    documentId: r.documentId || r.metadata?.documentId,
                    fileId: r.metadata?.fileId,
                    fileName: r.metadata?.fileName,
                    page: r.page,
                    similarity: r.similarity,
                    text: includeText ? r.text : undefined,
                    metadata: r.metadata
                }))
            };
        } catch (error) {
            console.error('[FileManager2.performVectorSearch] Error:', error);
            return {
                success: false,
                error: error.message,
                query,
                results: []
            };
        }
    }, [vectorStore]);

    // Context value for VectorStoreContext
    const vectorStoreContextValue = {
        vectorStore,
        search: performVectorSearch,
        isReady: vectorStore.loaded && vectorStore.items.length > 0,
    };

    // Context value for FileManagerProvider
    const fileManagerContextValue = {
        search,
        expandedItems,
        selectedItems,
        documentStatuses,
        handleToggleSelect,
        handleFileNameUpdate,
        setConfirmDialog,
        setGenerator,
        setSelectedDocument,
        remove
    };

    try {
        return (
            <VectorStoreContext.Provider value={vectorStoreContextValue}>
                <FileManagerProvider value={fileManagerContextValue}>
                    <Box
                        sx={{
                            height: '100%',
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 1,
                            position: 'relative',
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                    {/* Upload Progress Bar */}
                    {fileOperations.length > 0 && (
                        <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress} 
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                zIndex: 1100,
                                height: 3,
                                borderRadius: '1px 1px 0 0',
                            }}
                        />
                    )}
                    {/* Drag and Drop Overlay */}
                    {isDragging && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                border: '3px dashed',
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                zIndex: 1000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 4,
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                                <Typography variant="h6" color="primary">
                                    {t('fileManager2.dragDrop.dropFilesHere')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('fileManager2.dragDrop.supportedFormats')}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <Box
                        sx={{
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            gap: 0,
                            alignItems: 'center',
                            px: 1,
                            py: 0.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                            <Tooltip title={t('fileManager2.toolbar.selectAllTooltip')}>
                                <span>
                                    <Checkbox
                                        size="small"
                                        checked={Boolean(
                                            files &&
                                            files.length > 0 &&
                                            selectedItems.size === files.length
                                        )}
                                        indeterminate={
                                            selectedItems.size > 0 &&
                                            selectedItems.size < files.length
                                        }
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                handleSelectAll();
                                            } else {
                                                handleDeselectAll();
                                            }
                                        }}
                                        disabled={!files || files.length === 0}
                                        sx={{ p: 0.25 }}
                                    />
                                </span>
                            </Tooltip>
                        </Box>

                        {/* Search Bar */}
                        <TextField
                            value={search}
                            onInput={handleSearch}
                            size="small"
                            placeholder={t('fileManager2.toolbar.searchPlaceholder')}
                            sx={{ flex: 1, minWidth: '100px', mx: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Tooltip title={t('fileManager2.toolbar.uploadTooltip')}>
                            <IconButton
                                onClick={() => {
                                    document.getElementById('file-upload-input')?.click();
                                }}
                                color="primary"
                                size="small"
                                aria-label={t('fileManager2.toolbar.uploadTooltip')}
                            >
                                <UploadFile fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={t('fileManager2.toolbar.recordConversation', 'Record Conversation')}>
                            <IconButton
                                onClick={() => handleOpenStudio()}
                                size="small"
                                aria-label={t('fileManager2.toolbar.recordConversation', 'Record Conversation')}
                            >
                                <MicIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={t('fileManager2.toolbar.actionsTooltip')}>
                            <span>
                                <IconButton
                                    onClick={(e) =>
                                        setContextMenu(contextMenu ? null : { mouseX: e.clientX, mouseY: e.clientY })
                                    }
                                    size="small"
                                    disabled={selectedItems.size === 0}
                                    aria-label={t('fileManager2.toolbar.actionsTooltip')}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Menu
                            open={contextMenu !== null}
                            onClose={() => setContextMenu(null)}
                            anchorReference="anchorPosition"
                            anchorPosition={
                                contextMenu !== null
                                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                    : undefined
                            }
                        >
                            {/**
                 *  Deselect all action
                 */}
                            <MenuItem
                                onClick={() => {
                                    handleDeselectAll();
                                    setContextMenu(null);
                                }}
                            >
                                {t('fileManager2.contextMenu.deselectAll')}
                            </MenuItem>

                            {/**
                 * Delete selected files action
                 */}
                            <MenuItem
                                onClick={() => {
                                    setContextMenu(null);
                                    setConfirmDialog({
                                        open: true,
                                        message: t('fileManager2.contextMenu.deleteConfirmMessage', { count: selectedItems.size }),
                                        severity: 'error',
                                        onConfirm: async () => {
                                            console.log('[FileManager2] Starting delete operation for', selectedItems.size, 'files');
                                            const deleteErrors = [];
                                            
                                            for (const fileId of selectedItems) {
                                                const file = files.find(f => f.id === fileId);
                                                if (file) {
                                                    try {
                                                        console.log('[FileManager2] Deleting file:', file.name, file.id);
                                                        await deleteFileCompletely(file);
                                                        console.log('[FileManager2] Successfully deleted:', file.name);
                                                    } catch (error) {
                                                        console.error('[FileManager2] Failed to delete file:', file.name, error);
                                                        deleteErrors.push({ file: file.name, error: error.message });
                                                    }
                                                }
                                            }
                                            
                                            setSelectedItems(new Set());
                                            
                                            if (deleteErrors.length > 0) {
                                                console.error('[FileManager2] Delete operation completed with errors:', deleteErrors);
                                                setConfirmDialog({
                                                    open: true,
                                                    message: `Failed to delete ${deleteErrors.length} file(s): ${deleteErrors.map(e => e.file).join(', ')}`,
                                                    severity: 'error',
                                                    onConfirm: () => setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' })
                                                });
                                            } else {
                                                console.log('[FileManager2] All files deleted successfully');
                                                setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                                            }
                                        }
                                    });
                                }}
                            >
                                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                                {t('fileManager2.contextMenu.deleteSelected', { count: selectedItems.size })}
                            </MenuItem>

                            {/**
                 * Rerun the document analysis pipeline for selected documents
                 */}
                            <MenuItem
                                onClick={() => {
                                    setContextMenu(null);
                                    selectedItems.forEach(async (fileId) => {
                                        const file = files.find(f => f.id === fileId);
                                        if (file) {
                                            try {
                                                if (isAnalyzableDocument(file.mimeType)) {
                                                    console.log('[FileManager2] Re-analyzing document:', file.name, 'type:', file.mimeType);
                                                    await analyzePDF(file.id);
                                                    console.log('[FileManager2] Generating embeddings for:', file.name);
                                                    await generateEmbeddings(file.id);
                                                } else if (file.documentID) {
                                                    console.log('[FileManager2] Re-generating embeddings for:', file.name);
                                                    await generateEmbeddings(file.id);
                                                } else {
                                                    console.warn('[FileManager2] Cannot re-analyze - not an analyzable document and no documentID:', file.name, file.mimeType);
                                                }
                                            } catch (error) {
                                                console.error('[FileManager2] Error re-analyzing document:', file.name, error);
                                            }
                                        }
                                    });
                                }}
                            >
                                <AutorenewIcon fontSize="small" sx={{ mr: 1 }} />
                                {t('fileManager2.contextMenu.reAnalyzeSelected', { count: selectedItems.size })}
                            </MenuItem>
                        </Menu>
                    </Box>

                    {/* Context Menu for Actions */}



                    {/* Scrollable Content Area */}
                    <Box sx={{
                        width: '100%',
                        flex: 1,
                        overflow: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'row'
                    }}>
                        {/* Tree View: Files organized by Protection Level → File Type */}
                        {!files?.length ? (
                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                color: 'text.secondary'
                            }}>
                                <Typography>{t('fileManager2.mainView.noFilesMessage')}</Typography>
                            </Box>
                        ) : (<>
                            <Box
                                ref={parentRef}
                                sx={{
                                    flex: '0 0 35%',
                                    borderRight: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'auto',
                                    overflowX: 'hidden',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: 0,
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: (theme) => `${theme.palette.action.disabled} transparent`,
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'transparent',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: (theme) => theme.palette.action.disabled,
                                        borderRadius: '4px',
                                        '&:hover': {
                                            background: (theme) => theme.palette.action.active,
                                        }
                                    }
                                }}
                            >
                                <div style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxSizing: 'border-box'
                                }}>
                                    {(() => {
                                        const virtualItems = virtualizer.getVirtualItems();
                                        return virtualItems.map(virtualRow => {
                                            const item = fileListItems[virtualRow.index];

                                            return (
                                                <div
                                                    key={item.id}
                                                    data-index={virtualRow.index}
                                                    ref={virtualizer.measureElement}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        transform: `translateY(${virtualRow.start}px)`
                                                    }}
                                                >
                                                    {item.type === 'protection-header' && (
                                                        <Box
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                item.onToggleExpand?.();
                                                            }}
                                                            sx={{
                                                                px: 2,
                                                                pl: 0.625,
                                                                py: 1.5,
                                                                bgcolor: (theme) => theme.vars
                                                                    ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`
                                                                    : theme.palette.action.hover,
                                                                borderBottom: '1px solid',
                                                                borderLeft: '3px solid transparent',
                                                                borderColor: 'divider',
                                                                fontWeight: 600,
                                                                fontSize: '0.95rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                color: 'primary.main',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    bgcolor: (theme) => theme.vars
                                                                        ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.14)`
                                                                        : theme.palette.action.focus
                                                                }
                                                            }}
                                                        >
                                                            {/* Expand/Collapse Icon */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: item.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                                                <ExpandMoreIcon fontSize="small" />
                                                            </Box>
                                                            <FolderIcon fontSize="small" />
                                                            {item.label}
                                                            <Chip
                                                                label={item.totalFiles}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ ml: 'auto', height: '20px', fontSize: '0.7rem' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </Box>
                                                    )}

                                                    {item.type === 'filetype-subheader' && (
                                                        <FileTypeSubheader
                                                            label={item.label}
                                                            fileType={item.fileType}
                                                            isExpanded={item.isExpanded}
                                                            onToggleExpand={item.onToggleExpand}
                                                        />
                                                    )}

                                                    {item.type === 'file' && (
                                                        <FileRowComponent
                                                            file={item.file}
                                                            fileType={item.fileType}
                                                            index={virtualRow.index}
                                                            isSelected={selectedItems.has(item.file.id)}
                                                            allFiles={filteredFiles}
                                                            selectedItems={selectedItems}
                                                            setSelectedItems={setSelectedItems}
                                                            search={search}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </Box>

                        <Box
                            sx={{
                                flex: '0 0 65%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                bgcolor: 'background.paper',
                                minWidth: 0
                            }}
                        >
                            <SelectedFileDetailsPanel
                                selectedItems={selectedItems}
                                files={files}
                                documentStatuses={documentStatuses}
                                search={search}
                                editor={editor}
                            />
                        </Box></>
                        )}

                        {/* Generation Modals */}
                        {generator === 'image' && (
                            <ImageGeneratorButton
                                open={newFileFormOpen}
                                onSuccess={() => {
                                    setNewFileFormOpen(false);
                                    setNewImageFileFormOpen(false);
                                }}
                            />
                        )}
                        {generator === 'audio' && (
                            <AudioGeneratorButton
                                open={newFileFormOpen}
                                onSuccess={() => {
                                    setNewFileFormOpen(false);
                                    setNewAudioFileFormOpen(false);
                                }}
                            />
                        )}

                        {/* File Upload Input */}
                        <input
                            id="file-upload-input"
                            type="file"
                            multiple
                            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.fountain,.odt,.ods,.odp,.imscc,.epub,.gift,.qti.xml"
                            hidden
                            aria-label={t('fileManager2.toolbar.uploadTooltip')}
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.log('[FileManager2] Files selected:', files.length, files.map(f => f.name));
                                setFilesToUpload(files.map((f, index) => ({ file: f, index })));
                                setFileOperations(files.map((f) => ({ name: f.name, progress: '0%' })));
                            }}
                        />

                        {/* File Operations Display */}
                        {
                            fileOperations.length > 0 && (
                                <Box sx={{ p: 1 }}>
                                    {fileOperations.map((fileOperation, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                py: 0.5,
                                            }}
                                        >
                                            <Typography variant="body2">{fileOperation.name}</Typography>
                                            <Typography variant="body2">{fileOperation.progress}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )
                        }

                    </Box>

                    <Portal>
                        <Snackbar
                            open={confirmDialog.open}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                            onClose={(event, reason) => {
                                if (reason === 'clickaway') {
                                    return;
                                }
                                console.log('[Snackbar] onClose triggered');
                            }}
                        >
                            <Alert
                                severity={confirmDialog.severity}
                                sx={{
                                    width: '100%',
                                    minWidth: '300px',
                                    boxShadow: 3
                                }}
                                action={
                                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('[Snackbar] Confirm clicked');
                                                if (confirmDialog.onConfirm) {
                                                    confirmDialog.onConfirm();
                                                }
                                            }}
                                            variant="outlined"
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('[Snackbar] Cancel clicked');
                                                setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                                            }}
                                            variant="contained"
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                }
                            >
                                {confirmDialog.message}
                            </Alert>
                        </Snackbar>
                    </Portal>

                    {/* RecordingStudio3 Modal */}
                    <RecordingStudio3Modal
                        open={studioOpen}
                        onClose={() => {
                            setStudioOpen(false);
                            setStudioScriptFile(null);
                        }}
                        onSave={handleStudioSave}
                        title={unit?.name ? `${t('fileManager2.toolbar.recordConversation', 'Record Conversation')}: ${unit.name}` : t('fileManager2.toolbar.recordConversation', 'Record Conversation')}
                        preset="conversation"
                        scriptData={createConversationPreset(unit?.name).scriptData}
                        lockedTracks={[]}
                        identityId={identityId}
                    />
                </Box>
            </FileManagerProvider>
        </VectorStoreContext.Provider>
        );
    } catch (err) {
        console.error('[FileManager2] Render error:', err);
        return <Box>{t('fileManager.errorRendering', { message: err?.message })}</Box>;
    }
}   
