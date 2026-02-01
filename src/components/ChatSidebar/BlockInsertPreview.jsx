/**
 * BlockInsertPreview - Displays a preview of an editor block ready to be inserted
 * Shows block details and provides approve/reject buttons
 */

import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QuizIcon from '@mui/icons-material/Quiz';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArticleIcon from '@mui/icons-material/Article';
import QuizComponent from '../Editor3/components/QuizComponent';
import AnswerComponent from '../Editor3/components/AnswerComponent';
import MeaningAssociationExercise from '../MeaningAssociationExercise';
import CustomAnswerComponent from '../Editor3/nodes/CustomAnswerNode/CustomAnswerComponent';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import LanguageEditorTheme from '../Editor3/components/LanguageEditorTheme';
import { HeadingNode } from '@lexical/rich-text';

/**
 * Renders a preview of a quiz block with actual quiz interaction
 */
const QuizBlockPreview = ({ preview, blockData }) => {
    // Group quiz data by question to display them properly
    const questionGroups = [];
    const questionMap = new Map();
    
    blockData.forEach((item) => {
        if (!questionMap.has(item.question)) {
            questionMap.set(item.question, []);
        }
        questionMap.get(item.question).push(item);
    });

    questionMap.forEach((answers, question) => {
        questionGroups.push({
            question,
            answers
        });
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QuizIcon color="primary" />
                <Typography variant="h6">{preview?.title || 'Quiz'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={`${questionGroups.length} questions`} size="small" color="primary" variant="outlined" />
            </Box>
            
            {/* Render each question group */}
            {questionGroups.map((group, idx) => (
                <Box key={idx} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {idx + 1}. {group.question}
                    </Typography>
                    <QuizComponent 
                        nodeKey={`preview-quiz-${idx}`} 
                        data={group.answers}
                    />
                </Box>
            ))}
        </Box>
    );
};

/**
 * Renders a preview of an answer block with actual answer component
 */
const AnswerBlockPreview = ({ preview, blockData }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">Answer Block</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${preview?.wordCount || blockData?.length || 0} words`} size="small" color="primary" variant="outlined" />
            {preview?.mode && <Chip label={preview.mode} size="small" color="info" variant="outlined" />}
            {preview?.inputMethods && (
                <Chip label={`Input: ${preview.inputMethods.join(', ')}`} size="small" variant="outlined" />
            )}
        </Box>
        <AnswerComponent
            nodeKey="preview-answer"
            ids={blockData || []}
        />
    </Box>
);

/**
 * Renders a preview of a meaning association block with actual exercise
 */
const MeaningAssociationPreview = ({ preview, blockData }) => {
    const [tabIndex, setTabIndex] = React.useState(0);
    
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LinkIcon color="primary" />
                <Typography variant="h6">Meaning Association</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={`${preview?.wordCount || blockData?.length || 0} words`} size="small" color="primary" variant="outlined" />
                {preview?.modes && (
                    <Chip label={`Modes: ${preview.modes.join(', ')}`} size="small" color="info" variant="outlined" />
                )}
            </Box>
            {preview?.instructions && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {preview.instructions}
                </Typography>
            )}
            <MeaningAssociationExercise
                nodeKey="preview-meaning-association"
                wordIDs={blockData || []}
                tabIndex={tabIndex}
                setTabIndex={setTabIndex}
                enabledModes={preview?.modes || ['learn', 'easy', 'hard']}
            />
        </Box>
    );
};

/**
 * Renders a preview of a custom answer block with actual component
 */
const CustomAnswerPreview = ({ preview, blockData }) => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HelpOutlineIcon color="primary" />
            <Typography variant="h6">Custom Answer</Typography>
        </Box>
        {preview?.prompt && (
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {preview.prompt}
            </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
                label={`${preview?.questionCount || blockData?.length || 0} questions`} 
                size="small" 
                color="primary" 
                variant="outlined" 
            />
            {preview?.inputMethods && (
                <Chip label={`Input: ${preview.inputMethods.join(', ')}`} size="small" variant="outlined" />
            )}
            {preview?.promptMethods && (
                <Chip label={`Prompt: ${preview.promptMethods.join(', ')}`} size="small" color="info" variant="outlined" />
            )}
            {preview?.allowMultipleAttempts && (
                <Chip label="Multiple attempts" size="small" color="success" variant="outlined" />
            )}
        </Box>
        <CustomAnswerComponent
            nodeKey="preview-custom-answer"
            ids={blockData || []}
            allowedInput={preview?.inputMethods || ['text']}
            promptMethod={preview?.promptMethods || ['text']}
        />
    </Box>
);

/**
 * Renders a preview of content block with Lexical editor
 */
const ContentBlockPreview = ({ preview, blockData }) => {
    const initialConfig = {
        namespace: 'ContentBlockPreview',
        theme: LanguageEditorTheme,
        onError: (error) => console.error(error),
        editable: false,
        editorState: blockData ? JSON.stringify(blockData) : undefined,
        nodes: [HeadingNode],
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ArticleIcon color="primary" />
                <Typography variant="h6">{preview?.title || 'Content Block'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {preview?.contentType && (
                    <Chip label={preview.contentType} size="small" color="primary" variant="outlined" />
                )}
                {preview?.nodeCount && (
                    <Chip label={`${preview.nodeCount} elements`} size="small" variant="outlined" />
                )}
            </Box>
            {preview?.excerpt && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {preview.excerpt}
                </Typography>
            )}
            <Paper
                sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: '400px',
                    overflow: 'auto'
                }}
            >
                <LexicalComposer initialConfig={initialConfig}>
                    <RichTextPlugin
                        contentEditable={<ContentEditable style={{ outline: 'none' }} />}
                        placeholder={null}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </LexicalComposer>
            </Paper>
        </Box>
    );
};

/**
 * Main component - displays block preview with approve/reject actions
 */
const BlockInsertPreview = ({ toolOutput, onInsertBlock, onReject }) => {
    if (!toolOutput || !toolOutput.success || toolOutput.action !== 'insert_editor_block') {
        return null;
    }

    const { blockType, blockData, preview, message } = toolOutput;

    const handleApprove = () => {
        onInsertBlock?.(blockType, blockData);
    };

    const handleReject = () => {
        onReject?.();
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: 'background.paper',
            }}
        >
            {/* Block type specific preview */}
            {blockType === 'quiz' && <QuizBlockPreview preview={preview} blockData={blockData} />}
            {blockType === 'answer' && <AnswerBlockPreview preview={preview} blockData={blockData} />}
            {blockType === 'meaning-association' && <MeaningAssociationPreview preview={preview} blockData={blockData} />}
            {blockType === 'custom-answer' && <CustomAnswerPreview preview={preview} blockData={blockData} />}
            {blockType === 'content' && <ContentBlockPreview preview={preview} blockData={blockData} />}

            <Divider sx={{ my: 2 }} />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleReject}
                    size="small"
                >
                    Reject
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleApprove}
                    size="small"
                >
                    Insert into Editor
                </Button>
            </Box>

            {message && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {message}
                </Typography>
            )}
        </Paper>
    );
};

export default BlockInsertPreview;
