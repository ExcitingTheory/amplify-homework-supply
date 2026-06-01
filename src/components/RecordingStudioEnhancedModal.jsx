/**
 * @fileoverview RecordingStudioEnhancedModal — Fullscreen dialog wrapper for RecordingStudioEnhanced.
 *
 * Renders RecordingStudioEnhanced inside a fullscreen MUI Dialog with Save / Cancel actions.
 * The current studio state is captured via a ref that RecordingStudioEnhanced writes to on each
 * render, so the modal can read it on Save without requiring internal plumbing changes.
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RecordingStudioEnhanced from './RecordingStudioEnhanced';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * @param {Object}   props
 * @param {boolean}  props.open          - Whether the dialog is open
 * @param {Function} props.onClose       - Called when the user dismisses without saving
 * @param {Function} props.onSave        - Called with studio state: { tracks, filters, metadata }
 * @param {string}   [props.title]       - Dialog title
 * @param {Object}   [props.metadata]    - Extra metadata forwarded to RecordingStudioEnhanced
 * @param {string}   [props.gradeId]
 * @param {string}   [props.nodeKey]
 */
export default function RecordingStudioEnhancedModal({
  open,
  onClose,
  onSave,
  title,
  metadata = {},
  gradeId,
  nodeKey,
}) {
  const t = useTranslations('components');

  // RecordingStudioEnhanced writes its current state here on each render.
  // We read it when the user clicks Save.
  const stateRef = React.useRef(null);

  const handleSave = () => {
    if (typeof onSave === 'function' && stateRef.current) {
      onSave(stateRef.current);
    }
    onClose?.();
  };

  const displayTitle =
    title ||
    t('recordingStudioEnhancedModal.defaultTitle', 'Generate Conversation');

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted={false}
    >
      <AppBar sx={{ position: 'relative' }} color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label={t('recordingStudioEnhancedModal.cancel', 'Cancel')}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{ ml: 2, flex: 1 }}
            variant="h6"
            component="div"
            noWrap
          >
            {displayTitle}
          </Typography>
          <Button
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ ml: 2 }}
          >
            {t('recordingStudioEnhancedModal.saveConversation', 'Save Conversation')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
        <RecordingStudioEnhanced
          gradeId={gradeId}
          nodeKey={nodeKey}
          metadata={metadata}
          stateRef={stateRef}
          onRecordingComplete={onSave}
        />
      </Box>
    </Dialog>
  );
}
