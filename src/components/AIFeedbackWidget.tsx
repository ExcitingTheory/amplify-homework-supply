/**
 * @fileoverview AIFeedbackWidget - Reusable component for collecting user feedback on AI-generated content
 * 
 * Displays thumbs up/down buttons and allows users to provide optional reasons
 * for negative feedback. Integrates with DataStore to persist feedback.
 * 
 * @example
 * <AIFeedbackWidget
 *   contentType="CHAT_MESSAGE"
 *   messageId={message.id}
 *   generatedContent={message.content}
 *   model="gpt-4"
 *   prompt={userPrompt}
 *   metadata={{ unitId: currentUnit.id }}
 * />
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import { DataStore } from 'aws-amplify/datastore';

import { AIFeedback } from '../models';
import { 
  AiFeedbackType, 
  AiFeedbackReason, 
  AiContentType 
} from '../API';

interface AIFeedbackWidgetProps {
  /** Type of AI-generated content */
  contentType: keyof typeof AiContentType;
  /** The AI-generated content itself */
  generatedContent: string;
  /** The model used to generate the content */
  model?: string;
  /** The prompt that generated this content */
  prompt?: string;
  /** Message ID for chat messages */
  messageId?: string;
  /** Unit ID if content is related to a unit */
  unitId?: string;
  /** Grade ID if content is related to grading */
  gradeId?: string;
  /** Document ID if content is related to a document */
  documentId?: string;
  /** Session ID to group related feedback */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Callback when feedback is submitted */
  onFeedbackSubmitted?: (feedback: AIFeedback) => void;
  /** Size of the buttons */
  size?: 'small' | 'medium' | 'large';
  /** Show labels */
  showLabels?: boolean;
}

const REASON_LABELS: Record<string, string> = {
  INCORRECT: 'Incorrect information',
  INCOMPLETE: 'Incomplete or missing details',
  INAPPROPRIATE: 'Inappropriate content',
  NOT_HELPFUL: "Doesn't answer the question",
  IRRELEVANT: 'Off-topic or irrelevant',
  POOR_QUALITY: 'Poor quality (grammar, formatting, etc.)',
  OTHER: 'Other (specify below)',
};

export default function AIFeedbackWidget({
  contentType,
  generatedContent,
  model,
  prompt,
  messageId,
  unitId,
  gradeId,
  documentId,
  sessionId,
  metadata,
  onFeedbackSubmitted,
  size = 'small',
  showLabels = false,
}: AIFeedbackWidgetProps) {
  const [feedbackType, setFeedbackType] = useState<'POSITIVE' | 'NEGATIVE' | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<Set<keyof typeof AiFeedbackReason>>(new Set());
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleThumbsUp = () => {
    if (feedbackType === 'POSITIVE') {
      // Remove feedback
      setFeedbackType(null);
    } else {
      setFeedbackType('POSITIVE');
      submitFeedback('POSITIVE');
    }
  };

  const handleThumbsDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (feedbackType === 'NEGATIVE') {
      // Remove feedback
      setFeedbackType(null);
      setAnchorEl(null);
    } else {
      setFeedbackType('NEGATIVE');
      setAnchorEl(event.currentTarget);
    }
  };

  const handleReasonToggle = (reason: keyof typeof AiFeedbackReason) => {
    const newReasons = new Set(selectedReasons);
    if (newReasons.has(reason)) {
      newReasons.delete(reason);
    } else {
      newReasons.add(reason);
    }
    setSelectedReasons(newReasons);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const submitFeedback = async (type: 'POSITIVE' | 'NEGATIVE', reasons?: string[], userComment?: string) => {
    setIsSubmitting(true);
    
    try {
      const feedback = await DataStore.save(
        new AIFeedback({
          contentType: AiContentType[contentType],
          feedbackType: type === 'POSITIVE' ? AiFeedbackType.POSITIVE : AiFeedbackType.NEGATIVE,
          reasons: reasons?.map(r => AiFeedbackReason[r as keyof typeof AiFeedbackReason]),
          comment: userComment,
          model,
          prompt,
          generatedContent,
          unitID: unitId,
          gradeID: gradeId,
          documentID: documentId,
          messageId,
          sessionId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        } as any)
      );

      setSnackbar({
        open: true,
        message: 'Thank you for your feedback!',
        severity: 'success',
      });

      onFeedbackSubmitted?.(feedback);
      
      // Clear the form
      setSelectedReasons(new Set());
      setComment('');
      handleClosePopover();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit feedback. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNegativeFeedback = () => {
    const reasonArray = Array.from(selectedReasons) as string[];
    submitFeedback('NEGATIVE', reasonArray, comment);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <Tooltip title="This was helpful">
          <span>
            <IconButton
              size={size}
              onClick={handleThumbsUp}
              color={feedbackType === 'POSITIVE' ? 'success' : 'default'}
              disabled={isSubmitting}
              sx={{ 
                opacity: feedbackType === 'NEGATIVE' ? 0.3 : 1,
                '&:hover': {
                  backgroundColor: feedbackType === 'POSITIVE' ? 'success.light' : undefined,
                }
              }}
            >
              {feedbackType === 'POSITIVE' ? <ThumbUpIcon fontSize={size} /> : <ThumbUpOutlinedIcon fontSize={size} />}
            </IconButton>
          </span>
        </Tooltip>
        
        {showLabels && feedbackType === 'POSITIVE' && (
          <Typography variant="caption" color="success.main">
            Helpful
          </Typography>
        )}

        <Tooltip title="This needs improvement">
          <span>
            <IconButton
              size={size}
              onClick={handleThumbsDown}
              color={feedbackType === 'NEGATIVE' ? 'error' : 'default'}
              disabled={isSubmitting}
              sx={{ 
                opacity: feedbackType === 'POSITIVE' ? 0.3 : 1,
                '&:hover': {
                  backgroundColor: feedbackType === 'NEGATIVE' ? 'error.light' : undefined,
                }
              }}
            >
              {feedbackType === 'NEGATIVE' ? <ThumbDownIcon fontSize={size} /> : <ThumbDownOutlinedIcon fontSize={size} />}
            </IconButton>
          </span>
        </Tooltip>
        
        {showLabels && feedbackType === 'NEGATIVE' && (
          <Typography variant="caption" color="error.main">
            Needs improvement
          </Typography>
        )}
      </Box>

      {/* Negative feedback popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
          <Typography variant="subtitle2" gutterBottom>
            What could be improved?
          </Typography>
          
          <FormControl component="fieldset" variant="standard" fullWidth>
            <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
              Select all that apply:
            </FormLabel>
            <FormGroup>
              {Object.entries(REASON_LABELS).map(([key, label]) => {
                const reasonKey = key as keyof typeof AiFeedbackReason;
                return (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={selectedReasons.has(reasonKey)}
                        onChange={() => handleReasonToggle(reasonKey)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">{label}</Typography>}
                  />
                );
              })}
            </FormGroup>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Additional comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mt: 2 }}
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClosePopover}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmitNegativeFeedback}
              disabled={isSubmitting || selectedReasons.size === 0}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Success/Error snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
