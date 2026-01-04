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
} from "@mui/material";
import { useVirtualizer } from '@tanstack/react-virtual';
import React from "react";
import { isMimeType } from '@lexical/utils';

import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import UploadFile from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import FilesContext from "../../../context/fileContext";
import SettingsContext from "../../../context/settingsContext";

import { DataStore } from 'aws-amplify/datastore';
import { uploadData, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { calculateWaveformData } from '../../../utils/calculateWaveformData';
import { uploadFile, uploadAndAnalyzePDF, analyzePDF, cancelPDFAnalysis } from '../../../utils/fileUploadUtils';

import { FileProtectionLevels } from '../../../models';
import { File as FileModel, Document, Settings, ParsedContent } from '../../../models';
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

import { UnitFile } from '../../../models';
import UnitContext from '../../../context/unitContext';
import getCachedUrl from "../../../utils/getCachedUrl";
import AudioWaveformPlayer from './AudioWaveformPlayer';

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

import { useTheme } from '@mui/material/styles';

import {
    generateAudioFile,
    generateImageFile,
} from '../../../graphql/mutations';
import { hexToRgb } from "../../../utils/hexToRgb";
import { ImageGeneratorButton, AudioGeneratorButton } from './EnhancedGenerators';
import { SuggestedVocabulary, SuggestedQuestions } from './SuggestedContent';

const client = generateClient();

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

// Cosine similarity for vector comparison
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Highlight text matches
const highlightMatches = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.test(part)
            ? React.createElement('mark', { key: i, style: { backgroundColor: '#ffeb3b', padding: '0 2px' } }, part)
            : part
    );
};

// Check if text contains search term (case-insensitive)
const containsSearchTerm = (text, searchTerm) => {
    if (!text || !searchTerm) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
};

// Simple in-memory vector store for fast semantic search
class CourseVectorStore {
    constructor() {
        this.items = []; // {id, text, vector, metadata: {fileId, documentId, page, fileName, mimeType}}
    }

    clear() {
        this.items = [];
    }

    add(item) {
        this.items.push(item);
    }

    search(queryVector, filters = {}, topK = 50) {
        let results = this.items;

        // Apply metadata filters first
        if (filters.fileId) {
            results = results.filter(item => item.metadata.fileId === filters.fileId);
        }
        if (filters.documentId) {
            results = results.filter(item => item.metadata.documentId === filters.documentId);
        }
        if (filters.mimeType) {
            results = results.filter(item => item.metadata.mimeType === filters.mimeType);
        }

        // Compute similarities
        results = results.map(item => ({
            ...item,
            similarity: cosineSimilarity(queryVector, item.vector)
        }));

        // Sort and return top K
        return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
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
                                color: '#999',
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
                        Draft changes
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={handleSaveNow}
                        sx={{ minWidth: 'auto', px: 1 }}
                    >
                        Save
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={handleRevert}
                        sx={{ minWidth: 'auto', px: 1 }}
                    >
                        Revert
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

function ExpandedFileContent({ file, parsedContent, search, editor }) {
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
    const vocabulary = parsedContent?.vocabularyJSON ? (() => {
        try {
            return JSON.parse(parsedContent.vocabularyJSON);
        } catch (e) {
            return [];
        }
    })() : [];

    const summaries = parsedContent?.summariesJSON ? (() => {
        try {
            return JSON.parse(parsedContent.summariesJSON);
        } catch (e) {
            return [];
        }
    })() : [];

    const objectives = parsedContent?.objectivesJSON ? (() => {
        try {
            return JSON.parse(parsedContent.objectivesJSON);
        } catch (e) {
            return [];
        }
    })() : [];

    const concepts = parsedContent?.conceptsJSON ? (() => {
        try {
            return JSON.parse(parsedContent.conceptsJSON);
        } catch (e) {
            return [];
        }
    })() : [];

    const questions = parsedContent?.questionsJSON ? (() => {
        try {
            return JSON.parse(parsedContent.questionsJSON);
        } catch (e) {
            return [];
        }
    })() : [];

    const highlightText = (text) => {
        if (!search || !text) return text;
        return highlightMatches(text, search);
    };

    const isDocument = file.mimeType === 'application/pdf' ||
        file.mimeType === 'text/plain' ||
        file.mimeType === 'text/markdown';

    return (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1, mt: 1 }}>
            {/* Audio/Image Metadata */}
            {metadata && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Extracted Content
                    </Typography>
                    {metadata.analysis?.description && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                                Description:
                            </Typography>
                            <Typography variant="body2">
                                {highlightText(metadata.analysis.description)}
                            </Typography>
                        </Box>
                    )}
                    {metadata.analysis?.transcription && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                                Transcription:
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
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{ 
                            position: 'relative', 
                            zIndex: 2,
                            backgroundColor: 'background.paper',
                            borderRadius: '4px 4px 0 0'
                        }}
                    >
                        <Tab label={`Vocabulary (${vocabulary.length})`} />
                        <Tab label={`Summaries (${summaries.length})`} />
                        <Tab label={`Objectives (${objectives.length})`} />
                        <Tab label={`Concepts (${concepts.length})`} />
                        <Tab label={`Questions (${questions.length})`} />
                    </Tabs>

                    {/* Vocabulary Tab */}
                    {activeTab === 0 && vocabulary.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {vocabulary.map((item, index) => (
                                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="primary">
                                        {highlightText(item.word)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        {highlightText(item.definition)}
                                    </Typography>
                                    {item.context && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            Context: {highlightText(item.context)}
                                        </Typography>
                                    )}
                                    {item.page && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Page {item.page}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Summaries Tab */}
                    {activeTab === 1 && summaries.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {summaries.map((item, index) => (
                                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="primary">
                                        {highlightText(item.title)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        {highlightText(item.content)}
                                    </Typography>
                                    {item.page_range && (
                                        <Typography variant="caption" color="text.secondary">
                                            Pages: {item.page_range}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Objectives Tab */}
                    {activeTab === 2 && objectives.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {objectives.map((item, index) => (
                                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        {highlightText(item.objective)}
                                    </Typography>
                                    {item.bloom_level && (
                                        <Chip
                                            label={item.bloom_level}
                                            size="small"
                                            color="secondary"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Concepts Tab */}
                    {activeTab === 3 && concepts.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {concepts.map((item, index) => (
                                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="primary">
                                        {highlightText(item.concept)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        {highlightText(item.description)}
                                    </Typography>
                                    {item.related_vocabulary && (
                                        <Typography variant="caption" color="text.secondary">
                                            Related: {highlightText(item.related_vocabulary)}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Questions Tab */}
                    {activeTab === 4 && questions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {questions.map((item, index) => (
                                <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="primary">
                                        {highlightText(item.question)}
                                    </Typography>
                                    {item.expectedAnswer && (
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Answer:</strong> {highlightText(item.expectedAnswer)}
                                        </Typography>
                                    )}
                                    {item.hint && (
                                        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                                            <strong>Hint:</strong> {highlightText(item.hint)}
                                        </Typography>
                                    )}
                                    {item.type && (
                                        <Chip
                                            label={item.type}
                                            size="small"
                                            color="primary"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Empty states */}
                    {activeTab === 0 && vocabulary.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No vocabulary extracted
                        </Typography>
                    )}
                    {activeTab === 1 && summaries.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No summaries extracted
                        </Typography>
                    )}
                    {activeTab === 2 && objectives.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No objectives extracted
                        </Typography>
                    )}
                    {activeTab === 3 && concepts.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No concepts extracted
                        </Typography>
                    )}
                    {activeTab === 4 && questions.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No questions extracted
                        </Typography>
                    )}
                </Box>
            )}

            {/* No content available */}
            {!metadata && !parsedContent && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No extracted content available
                </Typography>
            )}
        </Box>
    );
}

function NewImageFileForm({ open, toggleNewImageFileForm }) {

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
                setPreviewMessage('Successfully generated image file');

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
                        placeholder='Text to transform into image file.'

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
                        aria-label="Generate"
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage('Generating image file...');

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new image file

                            const fileGenerator = await client.graphql({
                                query: generateImageFile,
                                variables: {
                                    phrase: newDescription,
                                    model: 'dall-e-3',
                                }
                            },
                                {
                                    'x-api-identity': idToken.toString(),
                                });

                            // set the presignedUrl from the response

                            console.log('fileGenerator', fileGenerator)


                            const path = fileGenerator?.data?.generateImageFile?.path;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage('Error generating image file');
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
                        Text to Image Preview  {working && <CircularProgress />}
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
                                backgroundColor: '#ffffff !important',
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
                        Close
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
                    aria-label="Generate"
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
                    Create
                </Button>

            </Box>
        </Collapse>
    )
}

function NewAudioFileForm({ open, toggleNewAudioFileForm }) {
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

    const theme = useTheme();
    const mainColor = theme.palette.primary.main;

    console.log('FileManager.mainColor', mainColor);

    const rgbColor = hexToRgb(mainColor); // Replace 'primary.main' with the color you want to convert
    console.log('rgbColor, rgbColor'); // Output: "rgb(33, 150, 243)"
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
            setPreviewMessage('Successfully generated audio file');
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
                        placeholder='Text to transform into audio file.'

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
                        aria-label="Generate"
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage('Generating audio file...');

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new audio file

                            const fileGenerator = await client.graphql({
                                query: generateAudioFile,
                                variables: {
                                    phrase: newDescription,
                                    voice: 'shimmer',
                                    model: 'tts-1-hd',
                                }
                            },
                                {
                                    'x-api-identity': idToken.toString(),
                                });

                            // set the presignedUrl from the response

                            console.log('fileGenerator', fileGenerator)


                            const path = fileGenerator?.data?.generateAudioFile?.path;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage('Error generating audio file');
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
                        Text to Speech Preview  {working && <CircularProgress />}
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
                        Close
                    </Button>

                </Card>

            </Modal>
        </>
    )

}

// =============================================================================
// Header Components for File List
// =============================================================================

function ProtectionLevelHeader({ label, totalFiles }) {
    return (
        <Box sx={{
            height: '100%',
            minHeight: 48,
            px: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
        }}>
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
}

function FileTypeSubheader({ label, fileType }) {
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
        <Box sx={{
            height: '100%',
            minHeight: 36,
            px: 2,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0
        }}>
            <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                {getIconForType(fileType)}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1 }}>
                {label}
            </Typography>
        </Box>
    );
}

// =============================================================================
// FileRowComponent - Renders individual file rows based on file type
// =============================================================================

function FileRowComponent({
    file,
    fileType,
    isExpanded,
    isSelected,
    search,
    onToggleExpand,
    onToggleSelect,
    onDelete,
    onNameUpdate,
    editor,
    parsedContent,
    documentStatus,
    expandedFileContent,
    setConfirmDialog,
    INSERT_IMAGE_COMMAND,
    INSERT_PLAYLIST_COMMAND,
    analyzePDF,
    cancelPDFAnalysis,
    setGenerator,
    setSelectedDocument,
    remove,
    index
}) {
    const isEvenRow = index % 2 === 0;

    // Common action buttons for all file types
    const renderActionButtons = () => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Expand/Collapse Content Button */}
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(file.id);
                }}
                title={expandedFileContent ? 'Collapse' : 'Expand details'}
            >
                {expandedFileContent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>

            {/* Insert Button - varies by file type */}
            {editor && fileType === 'images' && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                            altText: file.name,
                            path: file.path,
                            identityId: file.identityId,
                        });
                    }}
                    title="Insert into editor"
                >
                    <AddIcon />
                </IconButton>
            )}
            {editor && fileType === 'audio' && (
                <IconButton
                    size="small"
                    onClick={async (e) => {
                        e.stopPropagation();
                        editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [file.id]);
                    }}
                    title="Insert into editor"
                >
                    <AddIcon />
                </IconButton>
            )}

            {/* Delete Button */}
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({
                        open: true,
                        message: `Are you sure you want to delete ${file.path}?`,
                        severity: 'warning',
                        onConfirm: async () => {
                            await DataStore.delete(file);
                            await remove(file);
                            setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                        }
                    });
                }}
                title="Delete file"
            >
                <DeleteIcon />
            </IconButton>
        </Box>
    );

    return (
        <Box sx={{
            backgroundColor: isSelected ? 'action.selected' : isEvenRow ? 'grey.50' : 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        }}>
            {/* Row 1: Preview/Icon and Actions */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <ListItemImage file={file} />
                {renderActionButtons()}
            </Box>

            {/* Row 2: Filename */}
            <Box sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <FileNameField
                    value={file.name}
                    fileId={file.id}
                    onSave={onNameUpdate}
                    searchTerm={search}
                />
            </Box>

            {/* Row 3: Metadata */}
            <Box sx={{
                px: 2,
                py: 1
            }}>
                <Typography variant="caption" color="text.secondary">
                    {(file.size / 1000).toFixed(2)} KB
                </Typography>
                {documentStatus && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        • Status: {documentStatus.status}
                    </Typography>
                )}
            </Box>

            {/* Expanded Content */}
            {expandedFileContent && (
                <ExpandedFileContent
                    file={file}
                    parsedContent={parsedContent}
                    search={search}
                    editor={editor}
                />
            )}
        </Box>
    );
}

function ListItemImage({ file }) {
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



}

export default function FileManager2() {
    const [editor] = useLexicalComposerContext();
    const [search, setSearch] = React.useState('');
    const [searchMode, setSearchMode] = React.useState('hybrid'); // 'keyword', 'semantic', 'hybrid'
    const [searching, setSearching] = React.useState(false);
    const [selectedItems, setSelectedItems] = React.useState(new Set());




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

    // Persist expanded items to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('fileManager2_expandedItems', JSON.stringify(Array.from(expandedItems)));
        }
    }, [expandedItems]);

    const [contextMenu, setContextMenu] = React.useState(null);
    const [confirmDialog, setConfirmDialog] = React.useState({ open: false, message: '', onConfirm: null, severity: 'warning' });
    const [editingFileId, setEditingFileId] = React.useState(null);
    const [expandedFileContent, setExpandedFileContent] = React.useState(new Set()); // Files with expanded content view
    const [parsedContentData, setParsedContentData] = React.useState({}); // Cache for parsed content
    const [semanticResults, setSemanticResults] = React.useState(null); // {fileId: {maxScore, pages: [{page, score}]}}
    const [fileEmbeddings, setFileEmbeddings] = React.useState({}); // Cache embeddings
    const vectorStore = React.useRef(new CourseVectorStore()).current;
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
        const allFileIds = new Set(files.map(f => f.id));
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

    // Expand/Collapse handlers
    const handleExpandAll = () => {
        const allFileIds = new Set(files.map(f => f.id));
        setExpandedItems(allFileIds);
    };

    const handleCollapseAll = () => {
        setExpandedItems(new Set());
    };

    const handleToggleExpand = (fileId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
            }
            return newSet;
        });
    };

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

            await DataStore.save(FileModel.copyOf(fileToUpdate, updated => {
                updated.name = finalName;
            }));

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

    // Handle file content expansion
    const toggleFileContentExpansion = async (fileId) => {
        setExpandedFileContent(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
                // Load parsed content for documents if not already loaded
                loadParsedContentForFile(fileId);
            }
            return newSet;
        });
    };

    // Load parsed content for a document
    const loadParsedContentForFile = async (fileId) => {
        try {
            const file = files.find(f => f.id === fileId);
            if (!file) return;

            // For documents, load ParsedContent
            if (file.documentID) {
                const parsedContents = await DataStore.query(ParsedContent, c => c.documentID.eq(file.documentID));
                if (parsedContents.length > 0) {
                    setParsedContentData(prev => ({
                        ...prev,
                        [fileId]: parsedContents[0]
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading parsed content:', error);
        }
    };

    const [isDragging, setIsDragging] = React.useState(false);
    const [fileOperations, setFileOperations] = React.useState([]);
    const [filesToUpload, setFilesToUpload] = React.useState([]);
    const [newFileFormOpen, setNewFileFormOpen] = React.useState(false);
    const [newImageFileFormOpen, setNewImageFileFormOpen] = React.useState(false);
    const [newAudioFileFormOpen, setNewAudioFileFormOpen] = React.useState(false);
    const [newVideoFileFormOpen, setNewVideoFileFormOpen] = React.useState(false);

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

    const [documentStatuses, setDocumentStatuses] = React.useState({});

    const { files, session } = React.useContext(FilesContext);
    const { identityId } = session;
    const { unit } = React.useContext(UnitContext);

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

            // Check parsed content if available
            const parsedContent = parsedContentData[file.id];
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
    }, [files, parsedContentData]);

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
            const keywordMatches = new Set(files.filter(matchesKeyword).map(f => f.id));

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
            'PRIVATE': { images: [], audio: [], documents: [], other: [] },
            'PUBLIC': { images: [], audio: [], documents: [], other: [] },
            'PROTECTED': { images: [], audio: [], documents: [], other: [] },
            'UNSET': { images: [], audio: [], documents: [], other: [] }
        };

        files.forEach(file => {
            const level = file.level || 'UNSET';
            const mimeType = file.mimeType || '';

            if (mimeType.includes('image')) {
                organized[level].images.push(file);
            } else if (mimeType.includes('audio')) {
                organized[level].audio.push(file);
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

            // Add protection level header
            items.push({
                type: 'protection-header',
                level: protectionLevel,
                label: protectionLevel,
                id: `header-${protectionLevel}`,
                totalFiles
            });

            // For each file type (images, audio, documents, video, other)
            ['images', 'audio', 'documents', 'video', 'other'].forEach(fileType => {
                const fileTypeFiles = filesByType[fileType] || [];
                const shouldShow = fileTypeFiles.length > 0 && (
                    generator === 'all' ||
                    generator === fileType.slice(0, -1) ||  // 'image', 'audio', etc.
                    (generator === 'document' && fileType === 'documents')
                );

                if (shouldShow) {
                    // Add file type subheader
                    const label = fileType.charAt(0).toUpperCase() + fileType.slice(1);
                    items.push({
                        type: 'filetype-subheader',
                        fileType,
                        label: `${label} (${fileTypeFiles.length})`,
                        id: `subheader-${protectionLevel}-${fileType}`
                    });

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
    }, [organizedFiles, generator]);

    // Setup parent ref for virtualized scrolling
    const parentRef = React.useRef(null);

    // Setup virtualizer for performance
    const virtualizer = useVirtualizer({
        count: fileListItems.length,
        getScrollElement: () => parentRef?.current,
        estimateSize: (index) => {
            const item = fileListItems[index];
            if (item.type === 'protection-header') return 48;
            if (item.type === 'filetype-subheader') return 36;
            // File rows: base height + expanded content if applicable
            const baseHeight = 140;
            const expandedHeight = expandedFileContent.has(item.id) ? 400 : 0;
            return baseHeight + expandedHeight;
        },
        overscan: 3,
    });

    console.log('FilesContext.files', files);

    // Populate vector store from document page embeddings (incremental updates)
    React.useEffect(() => {
        const isInitialLoad = loadedVersions.current.size === 0;

        if (isInitialLoad) {
            // Initial load: clear and load everything
            vectorStore.clear();
            console.log('[VectorStore] Initial load: loading all embeddings');
        }

        files.forEach(file => {
            const docStatus = documentStatuses[file.documentID];
            const pageEmbeddings = docStatus?.pageEmbeddings;
            const currentVersion = docStatus?._version || file._version;
            const loadedVersion = loadedVersions.current.get(file.id);

            // Skip if already loaded and version unchanged
            if (!isInitialLoad && loadedVersion === currentVersion) {
                return;
            }

            // Remove old entries for this file if updating
            if (!isInitialLoad) {
                vectorStore.items = vectorStore.items.filter(
                    item => item.metadata.fileId !== file.id
                );
            }

            // Add page-level embeddings
            if (pageEmbeddings && Array.isArray(pageEmbeddings)) {
                pageEmbeddings.forEach(pageData => {
                    if (pageData.embedding) {
                        vectorStore.add({
                            id: `${file.id}-page-${pageData.page}`,
                            text: pageData.text,
                            vector: pageData.embedding,
                            metadata: {
                                fileId: file.id,
                                documentId: file.documentID,
                                page: pageData.page,
                                fileName: file.name,
                                mimeType: file.mimeType,
                            },
                        });
                    }
                });
            }

            // Add file-level embedding for non-PDF files
            const fileEmbedding = file.embedding || fileEmbeddings[file.id];
            if (fileEmbedding && !pageEmbeddings) {
                vectorStore.add({
                    id: file.id,
                    text: file.description || file.name,
                    vector: fileEmbedding,
                    metadata: {
                        fileId: file.id,
                        documentId: file.documentID,
                        page: null,
                        fileName: file.name,
                        mimeType: file.mimeType,
                    },
                });
            }

            // Update loaded version
            if (currentVersion) {
                loadedVersions.current.set(file.id, currentVersion);
            }
        });

        // Remove embeddings for deleted files
        const currentFileIds = new Set(files.map(f => f.id));
        loadedVersions.current.forEach((version, fileId) => {
            if (!currentFileIds.has(fileId)) {
                vectorStore.items = vectorStore.items.filter(
                    item => item.metadata.fileId !== fileId
                );
                loadedVersions.current.delete(fileId);
            }
        });

        console.log(`[VectorStore] ${isInitialLoad ? 'Loaded' : 'Updated'} ${vectorStore.items.length} embeddings`);
    }, [files, documentStatuses, fileEmbeddings, vectorStore]);

    // Note: Settings are now provided by SettingsContext
    // Get settings from context instead of local subscription
    const settingsContext = React.useContext(SettingsContext);
    const settings = settingsContext?.settings || null;

    // Subscribe to Document status changes
    React.useEffect(() => {
        console.log('[FileManager] Setting up Document subscription...');
        const subscription = DataStore.observeQuery(Document).subscribe(({ items, isSynced }) => {
            const statusMap = {};
            items.forEach(doc => {
                // Use document ID as the key for easier lookup
                statusMap[doc.id] = {
                    id: doc.id,
                    s3Key: doc.s3Key, // Add s3Key for debugging
                    status: doc.status,
                    pageCount: doc.pageCount,
                    extractedText: doc.extractedText,
                    pageEmbeddings: doc.pageEmbeddings, // Array of { page, embedding, text }
                };
            });
            setDocumentStatuses(statusMap);
            console.log('[FileManager] Document statuses updated:', {
                count: items.length,
                isSynced,
                statusMap,
                fileDocumentIDs: files.map(f => ({ fileId: f.id, documentID: f.documentID, path: f.path }))
            });
        });

        return () => {
            console.log('[FileManager] Cleaning up Document subscription');
            subscription.unsubscribe();
        };
    }, [files]);

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

            if (filesToUpload.length === 0) {
                return;
            }

            const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput, mapIndex) => {
                const { file, index } = fileInput;
                const progressIndex = index !== undefined ? index : mapIndex;

                // const isEvenRow = index % 2 === 0;
                const audioUrls = audio || [];
                const hasAudio = audioUrls.length > 0;

                console.log('uploading file', fileInput);
                console.log('fileOperations', fileOperations);


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

                    console.log('Upload result:', result);

                    // If PDF and auto-analyze is enabled, trigger analysis
                    if (file.type === 'application/pdf' && settings?.autoAnalyzeDocuments && result.documentModel) {
                        console.log('Auto-analyzing file:', result.fileModel.id);
                        // Don't await - let analysis run in background
                        analyzePDF(result.fileModel.id)
                            .then(() => console.log('Auto-analysis completed'))
                            .catch((error) => {
                                // If already being processed, this is expected - just log as info
                                if (error.message?.includes('currently being processed') || error.message?.includes('already been analyzed')) {
                                    console.log('Document analysis already in progress or completed:', error.message);
                                } else {
                                    console.error('Auto-analysis failed:', error);
                                }
                            });
                    }
                } catch (error) {
                    console.error('Error uploading file:', error);
                }
            }));

            // timeout to allow for the UI to update
            setTimeout(() => {
                setFilesToUpload([]);
                setFileOperations([]);
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

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isDragging ? '2px dashed #1976d2' : '2px dashed transparent',
                borderRadius: 1,
            }}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* Sticky Toolbar - QuestionEditor2 Style */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 0,
                    alignItems: 'center',
                    px: 1,
                    py: 0.5,
                    zIndex: 1,
                }}
            >
                <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    <Tooltip title="Select All">
                        <Checkbox
                            size="small"
                            checked={
                                files &&
                                files.length > 0 &&
                                selectedItems.size === files.length
                            }
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
                    </Tooltip>

                    <Tooltip title={expandedItems.size === 0 ? 'Expand All' : 'Collapse All'}>
                        <IconButton
                            size="small"
                            onClick={expandedItems.size === 0 ? handleExpandAll : handleCollapseAll}
                            disabled={!files || files.length === 0}
                        >
                            {expandedItems.size === 0 ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>

                <TextField
                    defaultValue=""
                    onInput={handleSearch}
                    type="text"
                    size="small"
                    fullWidth
                    placeholder="Search files, content, vocabulary, questions..."
                    label="Search"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Select
                                    value={searchMode}
                                    onChange={(e) => setSearchMode(e.target.value)}
                                    variant="standard"
                                    disableUnderline
                                    size="small"
                                    sx={{
                                        minWidth: 40,
                                        '& .MuiSelect-select': {
                                            py: 0,
                                            pr: '24px !important',
                                        },
                                    }}
                                    renderValue={(value) => {
                                        if (value === 'keyword') return <SearchIcon fontSize="small" />;
                                        if (value === 'semantic') return <AutoAwesomeIcon fontSize="small" />;
                                        return <Badge badgeContent="AI" color="primary"><SearchIcon fontSize="small" /></Badge>;
                                    }}
                                >
                                    <MenuItem value="keyword">
                                        <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                                        Keyword
                                    </MenuItem>
                                    <MenuItem value="semantic">
                                        <AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />
                                        Semantic
                                    </MenuItem>
                                    <MenuItem value="hybrid">
                                        <Badge badgeContent="AI" color="primary" sx={{ mr: 1 }}>
                                            <SearchIcon fontSize="small" />
                                        </Badge>
                                        Hybrid
                                    </MenuItem>
                                </Select>
                            </InputAdornment>
                        ),
                    }}
                />

                <Tooltip title="Upload Files">
                    <IconButton
                        onClick={() => {
                            document.getElementById('file-upload-input')?.click();
                        }}
                        color="primary"
                        size="small"
                    >
                        <UploadFile fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Actions">
                    <IconButton
                        onClick={(e) =>
                            setContextMenu(contextMenu ? null : { mouseX: e.clientX, mouseY: e.clientY })
                        }
                        size="small"
                        disabled={selectedItems.size === 0}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Context Menu for Actions */}
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
                <MenuItem
                    onClick={() => {
                        setConfirmDialog({
                            open: true,
                            message: `Delete ${selectedItems.size} selected file(s)?`,
                            severity: 'error',
                            onConfirm: async () => {
                                for (const fileId of selectedItems) {
                                    const file = files.find(f => f.id === fileId);
                                    if (file) {
                                        await DataStore.delete(file);
                                        await remove(file);
                                    }
                                }
                                setSelectedItems(new Set());
                                setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                            }
                        });
                        setContextMenu(null);
                    }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete Selected ({selectedItems.size})
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleDeselectAll();
                        setContextMenu(null);
                    }}
                >
                    Deselect All
                </MenuItem>
            </Menu>

            {/* OLD CODE TO BE REMOVED - Keeping temporarily for reference */}
            {/* Sticky Header with Search and Tabs */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 100,
                    display: 'none', // Hidden - will be removed in next step
                }}
            >
                {/* Sticky Search Bar - Different content per tab */}
                {false && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            px: 1,
                            py: 1,
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid #e0e0e0'
                        }}
                    >
                        <TextField
                            value={search}
                            onInput={handleSearch}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchSubmit();
                                }
                            }}
                            size="small"
                            fullWidth
                            placeholder={`Search ${generator === 'all' ? 'all files' : generator === 'image' ? 'images' : generator === 'audio' ? 'audio' : generator === 'document' ? 'documents' : 'files'}...`}
                            label="Search"
                        />

                        {searching && (
                            <IconButton size="small" aria-label="searching" disabled>
                                <CircularProgress size={20} />
                            </IconButton>
                        )}

                        {!searching && (
                            <>
                                <IconButton
                                    size="small"
                                    aria-label="search files"
                                    onClick={handleSearchSubmit}
                                >
                                    <SearchIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    aria-label="search options"
                                    onClick={(e) => setSearchMenuAnchor(e.currentTarget)}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={searchMenuAnchor}
                                    open={Boolean(searchMenuAnchor)}
                                    onClose={() => setSearchMenuAnchor(null)}
                                >
                                    <MenuItem onClick={() => {
                                        setSearch('');
                                        setSearchMenuAnchor(null);
                                    }}>Clear Search</MenuItem>
                                </Menu>
                            </>
                        )}

                        {/* Tab-specific action buttons */}
                        {generator === 'image' && (
                            <Tooltip title="Generate Image">
                                <IconButton
                                    onClick={() => toggleNewFileForm()}
                                    color="primary"
                                    size="small"
                                >
                                    <AutoAwesomeIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {generator === 'audio' && (
                            <Tooltip title="Generate Audio">
                                <IconButton
                                    onClick={() => toggleNewFileForm()}
                                    color="primary"
                                    size="small"
                                >
                                    <AutoAwesomeIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {(generator === 'all' || generator === 'document') && (
                            <Tooltip title="Upload Files">
                                <IconButton
                                    onClick={() => {
                                        document.getElementById('file-upload-input')?.click();
                                    }}
                                    color="primary"
                                    size="small"
                                >
                                    <UploadFile fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                )}

            </Box>

            {/* Tabs for filtering files and generating content */}
            <Tabs
                value={generator}
                onChange={(e, newValue) => {
                    setGenerator(newValue);
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    width: '100%',
                    padding: 0,
                    minHeight: 0,
                    '& .MuiTab-root': {
                        padding: '4px 8px',
                        minWidth: 0,
                        minHeight: 0,
                        fontSize: '0.75rem',
                    },
                    '& .MuiTabs-flexContainer': {
                        gap: 0,
                    },
                }}
            >
                <Tab
                    label={
                        <Tooltip title="All Files">
                            <FolderIcon fontSize="small" />
                        </Tooltip>
                    }
                    value="all"
                />
                <Tab
                    label={
                        <Tooltip title="Images">
                            <ImageIcon fontSize="small" />
                        </Tooltip>
                    }
                    value="image"
                />
                <Tab
                    label={
                        <Tooltip title="Audio">
                            <AudioFileIcon fontSize="small" />
                        </Tooltip>
                    }
                    value="audio"
                />
                <Tab
                    label={
                        <Tooltip title="Documents">
                            <PictureAsPdfIcon fontSize="small" />
                        </Tooltip>
                    }
                    value="document"
                />
            </Tabs>

            {/* Scrollable Content Area */}
            <Box sx={{ width: '100%' }}>
                {/* Hidden - Suggestions removed */}
                {generator === 'suggestions_removed' && (
                    <Box sx={{ width: '100%' }}>
                        {/* Document search bar */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 1,
                                bgcolor: 'background.paper',
                                borderBottom: '1px solid #e0e0e0'
                            }}
                        >
                            <TextField
                                value={search}
                                onInput={handleSearch}
                                size="small"
                                fullWidth
                                placeholder="Search documents..."
                                label="Search Documents"
                            />
                        </Box>

                        {/* Suggestion type tabs */}
                        <Tabs
                            value={suggestionTab}
                            onChange={(e, newValue) => setSuggestionTab(newValue)}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
                        >
                            <Tab label="Vocabulary" />
                            <Tab label="Questions" />
                        </Tabs>

                        {/* Document list */}
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                            {files
                                .filter(file =>
                                    file.documentID && (
                                        file.mimeType === 'application/pdf' ||
                                        file.mimeType === 'text/plain' ||
                                        file.mimeType === 'text/markdown' ||
                                        file.mimeType === 'text/csv'
                                    ) && (!search || file.name.toLowerCase().includes(search.toLowerCase()))
                                )
                                .map((file) => {
                                    const docStatus = documentStatuses[file.documentID];
                                    const statusInfo = getDocumentStatusInfo(docStatus?.status || 'uploaded');
                                    const isSelected = selectedDocument === file.documentID;

                                    return (
                                        <ListItem
                                            key={file.id}
                                            button
                                            selected={isSelected}
                                            onClick={() => {
                                                setSelectedDocument(file.documentID);
                                            }}
                                            sx={{
                                                borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                                                borderColor: isSelected ? 'primary.main' : 'transparent',
                                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                                '&:hover': {
                                                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                                                },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <PictureAsPdfIcon color={statusInfo.color} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {(file.size / 1000).toFixed(2)} KB
                                                        </Typography>
                                                        {docStatus?.pageCount && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                • {docStatus.pageCount} pages
                                                            </Typography>
                                                        )}
                                                        <Chip
                                                            size="small"
                                                            label={statusInfo.label}
                                                            color={statusInfo.chipColor}
                                                            icon={statusInfo.icon}
                                                            sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            {files.filter(file =>
                                file.documentID && (
                                    file.mimeType === 'application/pdf' ||
                                    file.mimeType === 'text/plain' ||
                                    file.mimeType === 'text/markdown' ||
                                    file.mimeType === 'text/csv'
                                ) && (!search || file.name.toLowerCase().includes(search.toLowerCase()))
                            ).length === 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                    {search ? 'No documents match your search' : 'No documents available'}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                        </List>

                        {/* Show suggestions if document is selected */}
                        {selectedDocument && (
                            <>
                                {/* Vocabulary Tab */}
                                {suggestionTab === 0 && (
                                    <SuggestedVocabulary
                                        documentId={selectedDocument}
                                        unitId={unit?.id}
                                        enableInlineEditing={true}
                                        onImport={(count) => {
                                            console.log(`Imported ${count} vocabulary items`);
                                        }}
                                    />
                                )}

                                {/* Questions Tab */}
                                {suggestionTab === 1 && (
                                    <SuggestedQuestions
                                        documentId={selectedDocument}
                                        unitId={unit?.id}
                                        enableInlineEditing={true}
                                        onImport={(count) => {
                                            console.log(`Imported ${count} questions`);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                )}


                {/* File Tree - shows all files organized by protection level first */}
                {/* VIRTUALIZED LIST RENDERING */}
                {generator !== 'suggestions_removed' && (
                    <Box
                        ref={parentRef}
                        sx={{
                            overflow: 'auto',
                            position: 'relative'
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Drag and drop is handled by DragDropPastePlugin in the editor
                            console.log('File drop detected in FileManager2');
                        }}
                    >
                        <div style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative'
                        }}>
                            {virtualizer.getVirtualItems().map(virtualRow => {
                                const item = fileListItems[virtualRow.index];

                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`
                                        }}
                                    >
                                        {item.type === 'protection-header' && (
                                            <ProtectionLevelHeader
                                                label={item.label}
                                                totalFiles={item.totalFiles}
                                            />
                                        )}

                                        {item.type === 'filetype-subheader' && (
                                            <FileTypeSubheader
                                                label={item.label}
                                                fileType={item.fileType}
                                            />
                                        )}

                                        {item.type === 'file' && (
                                            <FileRowComponent
                                                file={item.file}
                                                fileType={item.fileType}
                                                isExpanded={expandedItems.has(item.id)}
                                                isSelected={selectedItems.has(item.id)}
                                                search={search}
                                                onToggleExpand={toggleFileContentExpansion}
                                                onToggleSelect={handleToggleSelect}
                                                onDelete={() => { }}
                                                onNameUpdate={handleFileNameUpdate}
                                                editor={editor}
                                                parsedContent={parsedContentData[item.id]}
                                                documentStatus={documentStatuses[item.file.documentID]}
                                                expandedFileContent={expandedFileContent.has(item.id)}
                                                setConfirmDialog={setConfirmDialog}
                                                INSERT_IMAGE_COMMAND={INSERT_IMAGE_COMMAND}
                                                INSERT_PLAYLIST_COMMAND={INSERT_PLAYLIST_COMMAND}
                                                analyzePDF={analyzePDF}
                                                cancelPDFAnalysis={cancelPDFAnalysis}
                                                setGenerator={setGenerator}
                                                setSelectedDocument={setSelectedDocument}
                                                remove={remove}
                                                index={virtualRow.index}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Box>
                )}
                {/* END VIRTUALIZED LIST RENDERING */}
            </Box>

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
                hidden
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
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

            {/* Confirmation Snackbar */}
            <Snackbar
                open={confirmDialog.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 8 }}
            >
                <Alert
                    severity={confirmDialog.severity}
                    sx={{ width: '100%' }}
                    action={
                        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => {
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
                                onClick={() => setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' })}
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
        </Box>
    );
}