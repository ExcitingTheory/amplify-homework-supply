import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import {
    Box,
    Card,
    Toolbar,
    Button,
    TextField,
    Typography,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    InputAdornment,
    Collapse,
    Stack,
    Divider,
    Checkbox,
    Tooltip,
    Portal,
    Snackbar,
    Alert
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    VolumeUp as AudioIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    Description as DocumentIcon,
    Folder as FolderIcon,
    Delete as DeleteIcon,
    Info as InfoIcon
} from '@mui/icons-material';

// Highlight search terms in text
const highlightMatches = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
        regex.test(part) ? (
            <mark key={index} style={{ backgroundColor: 'var(--mui-palette-custom-searchHighlight, #ffeb3b)', padding: '0 2px' }}>
                {part}
            </mark>
        ) : part
    );
};

// Get file type icon
const getFileTypeIcon = (mimeType) => {
    if (mimeType?.includes('image')) return <ImageIcon />;
    if (mimeType?.includes('audio')) return <AudioIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType?.includes('text') || mimeType?.includes('document')) return <DocumentIcon />;
    return <FolderIcon />;
};

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`metadata-tabpanel-${index}`}
            aria-labelledby={`metadata-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function FileMetadataComponent({
    className,
    nodeKey,
    file,
    parsedContent,
    onFileNameUpdate,
    onRemove,
    search = '',
    index = 0
}) {
    const { t } = useTranslation('editor.files');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const [editingFileName, setEditingFileName] = useState(false);
    const [fileName, setFileName] = useState(file?.name || '');
    const [localSearch, setLocalSearch] = useState(search || '');
    const [selectedTab, setSelectedTab] = useState(0);
    const [expandedSections, setExpandedSections] = useState(new Set(['basic']));
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null, severity: 'warning' });

    const isEvenRow = index % 2 === 0;

    // Update local search when prop changes
    useEffect(() => {
        setLocalSearch(search || '');
    }, [search]);

    // Update filename when file prop changes
    useEffect(() => {
        if (file?.name) {
            setFileName(file.name);
        }
    }, [file?.name]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleSaveFileName = () => {
        if (onFileNameUpdate && fileName !== file?.name) {
            onFileNameUpdate(fileName);
        }
        setEditingFileName(false);
    };

    const handleCancelFileName = () => {
        setFileName(file?.name || '');
        setEditingFileName(false);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const clearLocalSearch = () => {
        setLocalSearch('');
    };

    // Filter and highlight content based on search
    const filterAndHighlight = useCallback((items, textKey, searchTerm = localSearch) => {
        if (!searchTerm || !items || !Array.isArray(items)) return items || [];
        
        return items.filter(item => {
            if (!item) return false;
            const text = typeof item === 'string' ? item : item[textKey];
            return text && text.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [localSearch]);

    const renderBasicInfo = () => (
        <Stack spacing={2}>
            {/* File Type and Size */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getFileTypeIcon(file?.mimeType)}
                <Typography variant="body2" color="text.secondary">
                    {file?.mimeType} • {file?.size ? `${(file.size / 1000).toFixed(2)} KB` : t('fileMetadataComponent.unknownSize')}
                </Typography>
            </Box>

            {/* Protection Level */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{t('fileMetadataComponent.protectionLevel')}</Typography>
                <Chip 
                    size="small" 
                    label={file?.level || t('fileMetadataComponent.unset')} 
                    color={file?.level === 'PRIVATE' ? 'error' : file?.level === 'PROTECTED' ? 'warning' : 'default'}
                />
            </Box>

            {/* File Path */}
            {file?.path && (
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    <strong>{t('fileMetadataComponent.path')}</strong> {highlightMatches(file.path, localSearch)}
                </Typography>
            )}

            {/* Created/Modified dates */}
            {file?.createdAt && (
                <Typography variant="body2" color="text.secondary">
                    <strong>{t('fileMetadataComponent.created')}</strong> {new Date(file.createdAt).toLocaleString()}
                </Typography>
            )}
        </Stack>
    );

    const renderMetadataTab = () => {
        if (!file?.metadata) {
            return (
                <Typography variant="body2" color="text.secondary">
                    {t('fileMetadataComponent.noMetadataAvailable')}
                </Typography>
            );
        }

        return (
            <Box>
                <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--mui-palette-grey-100, #f5f5f5)',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto'
                }}>
                    {highlightMatches(JSON.stringify(file.metadata, null, 2), localSearch)}
                </pre>
            </Box>
        );
    };

    const renderParsedContentTab = () => {
        if (!parsedContent) {
            return (
                <Typography variant="body2" color="text.secondary">
                    {t('fileMetadataComponent.noParsedContentAvailable')}
                </Typography>
            );
        }

        return (
            <Stack spacing={2}>
                {/* Vocabulary */}
                {parsedContent.vocabulary && parsedContent.vocabulary.length > 0 && (
                    <Accordion 
                        expanded={expandedSections.has('vocabulary')}
                        onChange={() => toggleSection('vocabulary')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                {t('fileMetadataComponent.vocabularyCount', { count: filterAndHighlight(parsedContent.vocabulary, 'term').length })}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {filterAndHighlight(parsedContent.vocabulary, 'term').map((vocab, index) => (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={highlightMatches(vocab.term, localSearch)}
                                            secondary={highlightMatches(vocab.definition, localSearch)}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Summaries */}
                {parsedContent.summaries && parsedContent.summaries.length > 0 && (
                    <Accordion 
                        expanded={expandedSections.has('summaries')}
                        onChange={() => toggleSection('summaries')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                {t('fileMetadataComponent.summariesCount', { count: filterAndHighlight(parsedContent.summaries, 'content').length })}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                {filterAndHighlight(parsedContent.summaries, 'content').map((summary, index) => (
                                    <Box key={index}>
                                        <Typography variant="body1" component="div">
                                            {highlightMatches(summary.content, localSearch)}
                                        </Typography>
                                        {summary.type && (
                                            <Chip size="small" label={summary.type} sx={{ mt: 1 }} />
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Objectives */}
                {parsedContent.objectives && parsedContent.objectives.length > 0 && (
                    <Accordion 
                        expanded={expandedSections.has('objectives')}
                        onChange={() => toggleSection('objectives')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                {t('fileMetadataComponent.objectivesCount', { count: filterAndHighlight(parsedContent.objectives, 'description').length })}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {filterAndHighlight(parsedContent.objectives, 'description').map((objective, index) => (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={highlightMatches(objective.description, localSearch)}
                                            secondary={objective.type && `Type: ${objective.type}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Concepts */}
                {parsedContent.concepts && parsedContent.concepts.length > 0 && (
                    <Accordion 
                        expanded={expandedSections.has('concepts')}
                        onChange={() => toggleSection('concepts')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                {t('fileMetadataComponent.conceptsCount', { count: filterAndHighlight(parsedContent.concepts, 'name').length })}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {filterAndHighlight(parsedContent.concepts, 'name').map((concept, index) => (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={highlightMatches(concept.name, localSearch)}
                                            secondary={highlightMatches(concept.description, localSearch)}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Questions */}
                {parsedContent.questions && parsedContent.questions.length > 0 && (
                    <Accordion 
                        expanded={expandedSections.has('questions')}
                        onChange={() => toggleSection('questions')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                {t('fileMetadataComponent.questionsCount', { count: filterAndHighlight(parsedContent.questions, 'question').length })}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {filterAndHighlight(parsedContent.questions, 'question').map((q, index) => (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={highlightMatches(q.question, localSearch)}
                                            secondary={q.answer && highlightMatches(`Answer: ${q.answer}`, localSearch)}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                )}
            </Stack>
        );
    };

    return (
        <Box sx={{ margin: 0 }}>
            <ListItem
                sx={{
                    backgroundColor: isEvenRow ? 'background.paper' : 'action.hover',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: 0,
                    margin: 0,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                <Box
                    sx={{
                        backgroundColor: isEvenRow ? 'grey.100' : 'grey.200',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {/* Header with controls */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0,
                            justifyContent: 'space-between',
                            padding: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            minHeight: 24,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                            <Checkbox
                                size="small"
                                checked={isSelected}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setIsSelected(!isSelected);
                                }}
                                sx={{ p: 0.25 }}
                            />
                            <IconButton
                                size="small"
                                title={isExpanded ? t('fileMetadataComponent.collapse') : t('fileMetadataComponent.expand')}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                sx={{ paddingLeft: 1 }}
                            >
                                {!isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                            </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                {file?.size ? `${(file.size / 1000).toFixed(2)} KB` : ''}
                            </Typography>
                            
                            <Chip 
                                size="small" 
                                label={file?.level || t('fileMetadataComponent.unset')} 
                                color={file?.level === 'PRIVATE' ? 'error' : file?.level === 'PROTECTED' ? 'warning' : 'default'}
                            />
                            
                            <Tooltip title={t('fileMetadataComponent.fileInfo')}>
                                <IconButton
                                    size="small"
                                    color="default"
                                >
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title={t('fileMetadataComponent.deleteFile')}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDialog({
                                            open: true,
                                            message: t('fileMetadataComponent.deleteConfirmation', { fileName: file?.name }),
                                            severity: 'warning',
                                            onConfirm: () => {
                                                onRemove && onRemove(nodeKey);
                                                setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                                            }
                                        });
                                    }}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Filename field - shown when collapsed */}
                    {!isExpanded && (
                        <Box sx={{ padding: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileTypeIcon(file?.mimeType)}
                            {editingFileName ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <TextField
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        variant="standard"
                                        size="small"
                                        fullWidth
                                        autoFocus
                                    />
                                    <IconButton size="small" onClick={handleSaveFileName}>
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={handleCancelFileName}>
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Typography 
                                    variant="body1" 
                                    component="div" 
                                    sx={{ 
                                        flex: 1,
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                    onClick={() => setEditingFileName(true)}
                                >
                                    {highlightMatches(fileName, localSearch)}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Expanded content - File Details */}
                {isExpanded && (
                    <Box sx={{ width: '100%', position: 'relative' }}>
                        <Box sx={{ p: 2 }}>
                            {/* Filename */}
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ minWidth: 100 }}>
                                    {t('fileMetadataComponent.filename')}
                                </Typography>
                                {getFileTypeIcon(file?.mimeType)}
                                {editingFileName ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                        <TextField
                                            value={fileName}
                                            onChange={(e) => setFileName(e.target.value)}
                                            variant="standard"
                                            size="small"
                                            fullWidth
                                            autoFocus
                                        />
                                        <IconButton size="small" onClick={handleSaveFileName}>
                                            <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={handleCancelFileName}>
                                            <CancelIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <Typography 
                                        variant="body1" 
                                        component="div" 
                                        sx={{ 
                                            flex: 1,
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => setEditingFileName(true)}
                                    >
                                        {highlightMatches(fileName, localSearch)}
                                    </Typography>
                                )}
                            </Box>

                            {/* File Type and Size */}
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ minWidth: 100 }}>
                                    {t('fileMetadataComponent.type')}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {file?.mimeType || t('fileMetadataComponent.unknown')}
                                </Typography>
                            </Box>

                            {/* File Path */}
                            {file?.path && (
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 100 }}>
                                        {t('fileMetadataComponent.path')}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ wordBreak: 'break-all', flex: 1 }}>
                                        {highlightMatches(file.path, localSearch)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Search Bar */}
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    placeholder={t('fileMetadataComponent.searchPlaceholder')}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: localSearch && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={clearLocalSearch}>
                                                    <ClearIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Tabs for detailed content */}
                            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                                <Tabs 
                                    value={selectedTab} 
                                    onChange={handleTabChange}
                                    variant="fullWidth"
                                >
                                    <Tab label={t('fileMetadataComponent.basicInfo')} />
                                    <Tab label={t('fileMetadataComponent.rawMetadata')} />
                                    <Tab label={t('fileMetadataComponent.parsedContent')} />
                                </Tabs>

                                {/* Tab Panels */}
                                <TabPanel value={selectedTab} index={0}>
                                    {renderBasicInfo()}
                                </TabPanel>

                                <TabPanel value={selectedTab} index={1}>
                                    {renderMetadataTab()}
                                </TabPanel>

                                <TabPanel value={selectedTab} index={2}>
                                    {renderParsedContentTab()}
                                </TabPanel>
                            </Box>
                        </Box>
                    </Box>
                )}
            </ListItem>
            
            {/* Confirmation Snackbar - Rendered in Portal to escape container overflow */}
            <Portal>
                <Snackbar
                    open={confirmDialog.open}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    onClose={(event, reason) => {
                        if (reason === 'clickaway') {
                            return;
                        }
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
                                        if (confirmDialog.onConfirm) {
                                            confirmDialog.onConfirm();
                                        }
                                    }}
                                    variant="outlined"
                                >
                                    {t('fileMetadataComponent.confirm')}
                                </Button>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'warning' });
                                    }}
                                    variant="contained"
                                >
                                    {t('fileMetadataComponent.cancel')}
                                </Button>
                            </Box>
                        }
                    >
                        {confirmDialog.message}
                    </Alert>
                </Snackbar>
            </Portal>
        </Box>
    );
}