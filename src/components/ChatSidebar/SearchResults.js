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
    Link,
    Collapse,
    Skeleton,
    LinearProgress,
} from '@mui/material';
import {
    Description as FileIcon,
    Translate as WordIcon,
    Quiz as QuestionIcon,
    Add as AddIcon,
    Edit as EditIcon,
    OpenInNew as OpenIcon,
    AddBox as InsertIcon,
    ExpandMore as ExpandMoreIcon,
    SearchOff as SearchOffIcon,
    Class as SectionIcon,
    Article as UnitIcon,
} from '@mui/icons-material';
import { getAmplifyClient } from '../../utils/amplifyClient';
import { Unit, UnitWord, QuestionUnit } from '../../models';

/**
 * Highlight search terms in text
 */
const highlightMatches = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(regex);
    
    return parts.map((part, index) => 
        regex.test(part) ? (
            <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px', borderRadius: '2px' }}>
                {part}
            </mark>
        ) : part
    );
};

/**
 * Animated relevance score chip - neutral styling
 */
function RelevanceScore({ similarity }) {
    const score = similarity ? parseFloat(similarity) : 0;
    const scorePercent = typeof similarity === 'number' ? Math.round(score * 100) : parseInt(similarity);
    
    return (
        <Chip 
            label={`${scorePercent}%`} 
            size="small" 
            variant="outlined"
            sx={{
                fontWeight: 600,
                animation: 'fadeIn 0.3s ease-in',
                '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'scale(0.8)' },
                    to: { opacity: 1, transform: 'scale(1)' }
                }
            }}
        />
    );
}

/**
 * Simple inline markdown renderer for basic formatting
 */
function renderSimpleMarkdown(text) {
    if (!text) return text;
    
    // Split by markdown bold patterns **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
        // Check if it's a bold pattern
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return <strong key={index}>{content}</strong>;
        }
        return part;
    });
}

/**
 * Component to display truncated text with show more/less and optional markdown
 */
function TruncatedText({ text, maxLength = 150, variant = 'caption', sx = {}, searchTerm = '', markdown = false }) {
    const [expanded, setExpanded] = React.useState(false);
    
    if (!text || text.length <= maxLength) {
        const content = markdown ? renderSimpleMarkdown(text) : searchTerm ? highlightMatches(text, searchTerm) : text;
        return (
            <Typography variant={variant} sx={sx} component="div">
                {content}
            </Typography>
        );
    }
    
    const displayText = expanded ? text : `${text.substring(0, maxLength)}...`;
    const content = markdown ? renderSimpleMarkdown(displayText) : searchTerm ? highlightMatches(displayText, searchTerm) : displayText;
    
    return (
        <Typography variant={variant} sx={sx} component="div">
            {content}
            {' '}
            <Link
                component="button"
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
            >
                {expanded ? 'show less' : 'show more'}
            </Link>
        </Typography>
    );
}

/**
 * Loading skeleton for search results
 */
function ResultSkeleton() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="60%" />
                </Box>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
        </Box>
    );
}

/**
 * Enhanced empty state with icon and message
 */
function EmptyState({ query }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 4,
                textAlign: 'center',
            }}
        >
            <SearchOffIcon 
                sx={{ 
                    fontSize: 64, 
                    color: 'text.disabled',
                    opacity: 0.5
                }} 
            />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                No results found
            </Typography>
            {query && (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    Try adjusting your search terms or browse the content library for related materials.
                </Typography>
            )}
        </Box>
    );
}

/**
 * Display search results from the search_content tool
 * 
 * @param {Array} results - Search results to display
 * @param {string} unitId - Current unit ID for linking
 * @param {string} searchQuery - Original search query for highlighting
 * @param {object} tabHandlers - Tab management functions
 * @param {Function} tabHandlers.setLeftTab - Set left sidebar tab
 * @param {Function} tabHandlers.setLeftOpen - Open/close left sidebar
 * @param {Function} tabHandlers.setRightOpen - Open/close right sidebar
 * @param {Function} onInsertWord - Callback to insert word into editor
 * @param {Function} onInsertQuestion - Callback to insert question into editor
 * @param {Function} onFocusItem - Callback when item needs focus (type, id)
 * @param {boolean} isLoading - Show loading skeletons
 */
export default function SearchResults({ 
    results, 
    unitId,
    searchQuery = '',
    tabHandlers = {},
    onInsertWord,
    onInsertQuestion,
    onFocusItem,
    isLoading = false,
}) {
    const [linkingStates, setLinkingStates] = React.useState({});
    const [expandedSections, setExpandedSections] = React.useState({
        files: true,
        words: true,
        questions: true,
        sections: true,
        units: true,
    });
    const { setLeftTab, setLeftOpen, setRightOpen, scrollToItem } = tabHandlers;

    // Tab indices (from useTabState defaults and typical setup)
    const TAB_INDICES = {
        FILES: 4,
        DICTIONARY: 2,
        QUESTIONS: 3,
        SECTIONS: 0,
        UNITS: 1,
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleOpenFile = (file) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.FILES);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('file', file.id);
            }
            // Scroll to item after a short delay to allow tab to open
            if (scrollToItem) {
                setTimeout(() => scrollToItem('file', file.id), 300);
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
            // Scroll to item after a short delay to allow tab to open
            if (scrollToItem) {
                setTimeout(() => scrollToItem('word', word.id), 300);
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
            // Scroll to item after a short delay to allow tab to open
            if (scrollToItem) {
                setTimeout(() => scrollToItem('question', question.id), 300);
            }
        }
    };

    const handleOpenSection = (section) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.SECTIONS);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('section', section.id);
            }
            if (scrollToItem) {
                setTimeout(() => scrollToItem('section', section.id), 300);
            }
        }
    };

    const handleOpenUnit = (unit) => {
        if (setLeftTab && setLeftOpen) {
            setLeftTab(TAB_INDICES.UNITS);
            setLeftOpen(true);
            if (onFocusItem) {
                onFocusItem('unit', unit.id);
            }
            if (scrollToItem) {
                setTimeout(() => scrollToItem('unit', unit.id), 300);
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
            const client = getAmplifyClient();
            const { data: unit } = await client.models.Unit.get({ id: unitId });
            if (!unit) {
                throw new Error('Unit not found');
            }

            if (itemType === 'word') {
                // Check if already linked
                const { data: existing } = await client.models.UnitWord.list({
                    filter: {
                        and: [
                            { unitID: { eq: unitId } },
                            { wordID: { eq: item.id } }
                        ]
                    }
                });

                if (existing.length > 0) {
                    setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
                    return;
                }

                // Create link
                await client.models.UnitWord.create({
                    unitID: unitId,
                    wordID: item.id
                });

                setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
            } else if (itemType === 'question') {
                // Check if already linked
                const { data: existing } = await client.models.QuestionUnit.list({
                    filter: {
                        and: [
                            { unitID: { eq: unitId } },
                            { questionID: { eq: item.id } }
                        ]
                    }
                });

                if (existing.length > 0) {
                    setLinkingStates(prev => ({ ...prev, [key]: 'linked' }));
                    return;
                }

                // Create link
                await client.models.QuestionUnit.create({
                    unitID: unitId,
                    questionID: item.id
                });

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

        return (
            <Box
                key={file.id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                {/* Header row with icon, title, and controls */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <FileIcon sx={{ color: 'primary.main', fontSize: 28, flexShrink: 0, mt: 0.25 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontWeight: 600, 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    mb: 0.5,
                                    lineHeight: 1.4
                                }} 
                                component="div"
                            >
                                {searchQuery ? highlightMatches(file.name, searchQuery) : file.name}
                            </Typography>
                            {file.page && (
                                <Chip 
                                    label={`Page ${file.page}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        borderRadius: 1
                                    }} 
                                />
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <RelevanceScore similarity={file.similarity} />
                        <Tooltip title="Open file">
                            <IconButton
                                size="small"
                                onClick={() => handleOpenFile(file)}
                            >
                                <OpenIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                {/* Description */}
                {file.description && (
                    <TruncatedText
                        text={file.description}
                        maxLength={150}
                        variant="body2"
                        searchTerm={searchQuery}
                        markdown={true}
                        sx={{ 
                            color: 'text.secondary', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            pl: 5.5,
                            lineHeight: 1.6
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderWordResult = (word) => {
        const key = `word-${word.id}`;
        const linkState = linkingStates[key];

        return (
            <Box
                key={word.id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                {/* Header row with icon, title, and controls */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <WordIcon sx={{ color: 'secondary.main', fontSize: 28, flexShrink: 0, mt: 0.25 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontWeight: 600, 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    lineHeight: 1.4
                                }} 
                                component="div"
                            >
                                {searchQuery ? highlightMatches(word.phrase, searchQuery) : word.phrase}
                            </Typography>
                            {word.phonetic && (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        mt: 0.5
                                    }}
                                >
                                    {searchQuery ? highlightMatches(word.phonetic, searchQuery) : word.phonetic}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <RelevanceScore similarity={word.similarity} />
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
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleLinkToUnit(word, 'word')}
                                            disabled={linkState === 'loading' || linkState === 'linked'}
                                            color={linkState === 'linked' ? 'success' : 'default'}
                                        >
                                            {linkState === 'loading' ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                <AddIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </span>
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
                </Box>
                
                {/* Definition */}
                {word.definition && (
                    <TruncatedText
                        text={word.definition}
                        maxLength={150}
                        variant="body2"
                        searchTerm={searchQuery}
                        markdown={true}
                        sx={{ 
                            color: 'text.secondary', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            pl: 5.5,
                            lineHeight: 1.6
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderQuestionResult = (question) => {
        const key = `question-${question.id}`;
        const linkState = linkingStates[key];

        return (
            <Box
                key={question.id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                {/* Header row with icon, title, and controls */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <QuestionIcon sx={{ color: 'info.main', fontSize: 28, flexShrink: 0, mt: 0.25 }} />
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontWeight: 600, 
                                wordBreak: 'break-word', 
                                overflowWrap: 'break-word', 
                                whiteSpace: 'normal',
                                flex: 1,
                                lineHeight: 1.4
                            }} 
                            component="div"
                        >
                            {searchQuery ? highlightMatches(question.prompt, searchQuery) : question.prompt}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <RelevanceScore similarity={question.similarity} />
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
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleLinkToUnit(question, 'question')}
                                            disabled={linkState === 'loading' || linkState === 'linked'}
                                            color={linkState === 'linked' ? 'success' : 'default'}
                                        >
                                            {linkState === 'loading' ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                <AddIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </span>
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
                </Box>
                
                {/* Answer */}
                {question.answer && (
                    <TruncatedText
                        text={`**Answer:** ${question.answer}`}
                        maxLength={150}
                        variant="body2"
                        searchTerm={searchQuery}
                        markdown={true}
                        sx={{ 
                            color: 'text.secondary', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            pl: 5.5,
                            lineHeight: 1.6
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderSectionResult = (section) => {
        return (
            <Box
                key={section.id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <SectionIcon sx={{ color: 'secondary.main', fontSize: 28, flexShrink: 0, mt: 0.25 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontWeight: 600, 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    lineHeight: 1.4,
                                    mb: 0.5
                                }} 
                                component="div"
                            >
                                {searchQuery ? highlightMatches(section.name, searchQuery) : section.name}
                            </Typography>
                            {section.joinCode && (
                                <Chip 
                                    label={`Code: ${section.joinCode}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        borderRadius: 1
                                    }} 
                                />
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <RelevanceScore similarity={section.similarity} />
                        <Tooltip title="Open section">
                            <IconButton
                                size="small"
                                onClick={() => handleOpenSection(section)}
                            >
                                <OpenIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                {section.description && (
                    <TruncatedText
                        text={section.description}
                        maxLength={150}
                        variant="body2"
                        searchTerm={searchQuery}
                        markdown={true}
                        sx={{ 
                            color: 'text.secondary', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            pl: 5.5,
                            lineHeight: 1.6
                        }}
                    />
                )}
            </Box>
        );
    };

    const renderUnitResult = (unit) => {
        return (
            <Box
                key={unit.id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                        bgcolor: 'action.hover',
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                        <UnitIcon sx={{ color: 'primary.main', fontSize: 28, flexShrink: 0, mt: 0.25 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontWeight: 600, 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word', 
                                    whiteSpace: 'normal',
                                    lineHeight: 1.4,
                                    mb: 0.5
                                }} 
                                component="div"
                            >
                                {searchQuery ? highlightMatches(unit.name, searchQuery) : unit.name}
                            </Typography>
                            {unit.published && (
                                <Chip 
                                    label="Published" 
                                    size="small" 
                                    color="success"
                                    variant="outlined"
                                    sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        borderRadius: 1
                                    }} 
                                />
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <RelevanceScore similarity={unit.similarity} />
                        <Tooltip title="Open unit">
                            <IconButton
                                size="small"
                                onClick={() => handleOpenUnit(unit)}
                            >
                                <OpenIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                {unit.description && (
                    <TruncatedText
                        text={unit.description}
                        maxLength={150}
                        variant="body2"
                        searchTerm={searchQuery}
                        markdown={true}
                        sx={{ 
                            color: 'text.secondary', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'normal', 
                            pl: 5.5,
                            lineHeight: 1.6
                        }}
                    />
                )}
            </Box>
        );
    };

    // Show loading state
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                <ResultSkeleton />
                <ResultSkeleton />
                <ResultSkeleton />
            </Box>
        );
    }

    if (!results || results.length === 0) {
        return <EmptyState query={searchQuery} />;
    }

    // Group results by type
    const fileResults = results.filter(r => r.type === 'file');
    const wordResults = results.filter(r => r.type === 'word');
    const questionResults = results.filter(r => r.type === 'question');
    const sectionResults = results.filter(r => r.type === 'section');
    const unitResults = results.filter(r => r.type === 'unit');

    // Collapsible section header component
    const SectionHeader = ({ title, count, color, expanded, onToggle }) => (
        <Box
            onClick={onToggle}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 1.5,
                cursor: 'pointer',
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: 'action.hover'
                }
            }}
        >
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    fontWeight: 700, 
                    color: `${color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                {title}
                <Chip 
                    label={count} 
                    size="small" 
                    sx={{ 
                        height: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}
                />
            </Typography>
            <ExpandMoreIcon
                sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: `${color}.main`
                }}
            />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {fileResults.length > 0 && (
                <Box>
                    <SectionHeader
                        title="Files"
                        count={fileResults.length}
                        color="primary"
                        expanded={expandedSections.files}
                        onToggle={() => toggleSection('files')}
                    />
                    <Collapse in={expandedSections.files} timeout={300}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {fileResults.map(renderFileResult)}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {wordResults.length > 0 && (
                <Box>
                    <SectionHeader
                        title="Vocabulary"
                        count={wordResults.length}
                        color="secondary"
                        expanded={expandedSections.words}
                        onToggle={() => toggleSection('words')}
                    />
                    <Collapse in={expandedSections.words} timeout={300}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {wordResults.map(renderWordResult)}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {questionResults.length > 0 && (
                <Box>
                    <SectionHeader
                        title="Questions"
                        count={questionResults.length}
                        color="info"
                        expanded={expandedSections.questions}
                        onToggle={() => toggleSection('questions')}
                    />
                    <Collapse in={expandedSections.questions} timeout={300}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {questionResults.map(renderQuestionResult)}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {sectionResults.length > 0 && (
                <Box>
                    <SectionHeader
                        title="Sections"
                        count={sectionResults.length}
                        color="secondary"
                        expanded={expandedSections.sections}
                        onToggle={() => toggleSection('sections')}
                    />
                    <Collapse in={expandedSections.sections} timeout={300}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {sectionResults.map(renderSectionResult)}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {unitResults.length > 0 && (
                <Box>
                    <SectionHeader
                        title="Units"
                        count={unitResults.length}
                        color="primary"
                        expanded={expandedSections.units}
                        onToggle={() => toggleSection('units')}
                    />
                    <Collapse in={expandedSections.units} timeout={300}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {unitResults.map(renderUnitResult)}
                        </Box>
                    </Collapse>
                </Box>
            )}
        </Box>
    );
}
