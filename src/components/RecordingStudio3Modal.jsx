/**
 * @fileoverview RecordingStudio3Modal - Fullscreen modal wrapper for RecordingStudio3
 *
 * Provides the shared modal chrome (open/close, title bar, confirmation preview,
 * save/cancel actions) around RecordingStudio3 for both Dictionary and Editor workflows.
 *
 * RecordingStudio3 itself has NO internal save/close UI — it is purely reactive,
 * calling onScriptChange on every mutation. This modal adds:
 *   - Fullscreen MUI Dialog with AppBar-style title bar
 *   - "Done" button that opens a confirmation preview before saving
 *   - "Cancel" button with unsaved-changes guard
 *   - MicLevelIndicator integration during active recording
 *   - Preset-aware save logic (word preset saves to Word model, conversation saves File records)
 *
 * Props:
 * @param {boolean} open                    - Controls dialog visibility
 * @param {Function} onClose                - Called when modal is dismissed (cancel or after save)
 * @param {Function} onSave                 - Called with save payload after user confirms preview
 *                                            Dictionary: (wordUpdates, scriptData) => Promise<void>
 *                                            Editor:     (fileRecords, scriptData) => Promise<void>
 * @param {string} title                    - Dialog title text
 * @param {'word'|'conversation'|'question'} preset - Determines save behavior and confirmation UI
 * @param {Object} scriptData               - Initial script data from preset factory
 * @param {string[]} lockedTracks           - Passed through to RecordingStudio3
 * @param {string} [gradeId]               - For student S3 uploads (passed through)
 * @param {string} [nodeKey]               - File organization key (passed through)
 * @param {Object} [identityId]            - User identity for S3 (passed through)
 * @param {boolean} [readOnly=false]        - Disable all editing (passed through)
 * @param {Function} [onGenerateMissingTTS]  - Called when user clicks "Generate Missing" in preview.
 *                                             Receives (missingLines) array. Parent or RS3 handles TTS.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  GraphicEq as WaveformIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  MusicNote as AudioIcon,
  RecordVoiceOver as TtsIcon,
} from '@mui/icons-material';
import { LinearProgress, Skeleton } from '@mui/material';
import RecordingStudio3 from './RecordingStudio3';

// Slide-up transition for fullscreen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Extracts a save summary from scriptData for the confirmation preview.
 *
 * @param {Object} scriptData - Current script state from RS3
 * @param {string} preset     - 'word' | 'conversation' | 'question'
 * @returns {{ totalTakes: number, linesSummary: Array, speakers: string[], hasUnsaved: boolean }}
 */
function extractSaveSummary(scriptData, preset) {
  const speakers = Object.values(scriptData.speakers || {}).map(s => s.name);
  const linesSummary = (scriptData.dialogue || []).map((line) => {
    const speaker = scriptData.speakers[line.speaker];
    const activeTake = line.activeTakeIndex !== null && line.takes?.[line.activeTakeIndex];
    return {
      id: line.id,
      speaker: speaker?.name || 'Unknown',
      text: line.text,
      hasTake: !!activeTake,
      takeType: activeTake?.type || null,      // 'human' | 'tts' | null
      hasAudioPath: !!activeTake?.audioPath,
      totalTakes: line.takes?.length || 0,
    };
  });

  const totalTakes = linesSummary.reduce((sum, l) => sum + l.totalTakes, 0);
  const linesWithActiveTake = linesSummary.filter(l => l.hasTake).length;
  const linesWithoutTake = linesSummary.filter(l => !l.hasTake).length;
  const linesWithTextButNoTake = linesSummary.filter(l => !l.hasTake && l.text);

  return { totalTakes, linesSummary, speakers, linesWithActiveTake, linesWithoutTake, linesWithTextButNoTake };
}

/**
 * Builds the save payload depending on preset type.
 *
 * For 'word' preset:
 *   - phrase_track active takes → audio paths for Word.audio[]
 *   - definition_track active takes → audio paths for Word.definitionAudio[]
 *   - waveformData extracted per track
 *   - Full scriptData for Word.scriptData field
 *
 * For 'conversation' / 'question' preset:
 *   - All active takes with audioPath → File record candidates
 *   - Full scriptData for File record (application/json)
 */
function buildSavePayload(scriptData, preset) {
  if (preset === 'word') {
    const phraseLines = scriptData.dialogue.filter(d => d.speaker === 'phrase_track');
    const defLines = scriptData.dialogue.filter(d => d.speaker === 'definition_track');

    const extractActivePaths = (lines) =>
      lines
        .filter(l => l.activeTakeIndex !== null && l.takes?.[l.activeTakeIndex]?.audioPath)
        .map(l => ({
          audioPath: l.takes[l.activeTakeIndex].audioPath,
          waveformData: l.takes[l.activeTakeIndex].waveformData,
        }));

    return {
      type: 'word',
      phraseAudio: extractActivePaths(phraseLines),
      definitionAudio: extractActivePaths(defLines),
      scriptData,
    };
  }

  // conversation or question
  const audioFiles = scriptData.dialogue
    .filter(l => l.activeTakeIndex !== null && l.takes?.[l.activeTakeIndex]?.audioPath)
    .map(l => {
      const take = l.takes[l.activeTakeIndex];
      const speaker = scriptData.speakers[l.speaker];
      return {
        audioPath: take.audioPath,
        waveformData: take.waveformData,
        speakerName: speaker?.name,
        text: l.text,
        type: take.type,
      };
    });

  return {
    type: preset,
    audioFiles,
    scriptData,
  };
}

export default function RecordingStudio3Modal({
  open,
  onClose,
  onSave,
  title,
  preset,
  scriptData: initialScriptData,
  lockedTracks = [],
  gradeId,
  nodeKey,
  identityId,
  readOnly = false,
}) {
  const t = useTranslations('components');

  // Track latest script state from RS3's reactive callbacks
  const scriptDataRef = useRef(initialScriptData);
  const [hasChanges, setHasChanges] = useState(false);

  // Confirmation preview state
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSummary, setSaveSummary] = useState(null);

  // TTS generation state for "Generate Missing" in preview
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [ttsProgress, setTtsProgress] = useState({ done: 0, total: 0 });
  const rs3Ref = useRef(null);

  // MicLevelIndicator state — RS3 does not expose its analyser, so we track
  // recording state via onUpdateData events to show a visual cue in the AppBar
  const [isRecording, setIsRecording] = useState(false);

  // Reset when dialog opens with new data
  useEffect(() => {
    if (open) {
      scriptDataRef.current = initialScriptData;
      setHasChanges(false);
      setShowPreview(false);
      setSaving(false);
      setSaveSummary(null);
      setGeneratingTTS(false);
      setTtsProgress({ done: 0, total: 0 });
    }
  }, [open, initialScriptData]);

  // Reactive callback — RS3 calls this on every script mutation
  const handleScriptChange = useCallback((newScriptData) => {
    scriptDataRef.current = newScriptData;
    setHasChanges(true);
  }, []);

  // Granular update callback — used for tracking recording state
  const handleUpdateData = useCallback(({ type, payload, scriptData: newData }) => {
    scriptDataRef.current = newData;
    setHasChanges(true);

    // Track recording state for AppBar indicator
    if (type === 'TAKE_ADDED') {
      setIsRecording(false);
    }
  }, []);

  // "Done" button → open confirmation preview
  const handleDoneClick = useCallback(() => {
    const summary = extractSaveSummary(scriptDataRef.current, preset);
    setSaveSummary(summary);
    setShowPreview(true);
  }, [preset]);

  // Confirm save from preview
  const handleConfirmSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = buildSavePayload(scriptDataRef.current, preset);
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('RecordingStudio3Modal save error:', error);
      setSaving(false);
    }
  }, [preset, onSave, onClose]);

  // "Generate Missing TTS" — goes back to studio, triggers batch TTS,
  // then returns to preview with updated summary
  const handleGenerateMissingTTS = useCallback(() => {
    setGeneratingTTS(true);
    const missing = saveSummary?.linesWithTextButNoTake || [];
    setTtsProgress({ done: 0, total: missing.length });

    // Return to studio view so RS3 can run its internal batch TTS
    setShowPreview(false);

    // Signal to RS3 via ref to trigger batch generation
    if (rs3Ref.current?.triggerBatchTTS) {
      rs3Ref.current.triggerBatchTTS().then(() => {
        setGeneratingTTS(false);
        // Re-open preview with updated data
        const summary = extractSaveSummary(scriptDataRef.current, preset);
        setSaveSummary(summary);
        setShowPreview(true);
      }).catch(() => {
        setGeneratingTTS(false);
      });
    } else {
      // Fallback: just go back to studio for manual batch TTS
      setGeneratingTTS(false);
    }
  }, [saveSummary, preset]);

  // Cancel with unsaved-changes guard
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      // Browser-level confirm for now — can upgrade to MUI Dialog later
      const confirmed = window.confirm(t('recordingStudio3Modal.unsavedChanges'));
      if (!confirmed) return;
    }
    onClose();
  }, [hasChanges, onClose, t]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullScreen
      TransitionComponent={Transition}
    >
      {/* AppBar with title, recording indicator, and action buttons */}
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleCancel}
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </IconButton>

          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {title}
          </Typography>

          {isRecording && (
            <Chip
              icon={<WaveformIcon />}
              label={t('recordingStudio3Modal.recording')}
              color="error"
              size="small"
              sx={{ mr: 2 }}
            />
          )}

          <Button
            autoFocus
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={handleDoneClick}
            disabled={readOnly || saving}
          >
            {t('recordingStudio3Modal.done')}
          </Button>
        </Toolbar>
      </AppBar>

      {/* RS3 fills the remaining viewport */}
      {!showPreview ? (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <RecordingStudio3
            ref={rs3Ref}
            scriptData={initialScriptData}
            onScriptChange={handleScriptChange}
            onUpdateData={handleUpdateData}
            lockedTracks={lockedTracks}
            gradeId={gradeId}
            nodeKey={nodeKey}
            identityId={identityId}
            readOnly={readOnly}
          />
        </Box>
      ) : (
        /* Confirmation preview panel */
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom>
            {t('recordingStudio3Modal.confirmTitle')}
          </Typography>

          {saveSummary && (
            <Stack spacing={2}>
              {/* Summary stats */}
              <Stack direction="row" spacing={2}>
                <Chip label={`${saveSummary.speakers.length} speakers`} />
                <Chip label={`${saveSummary.totalTakes} total takes`} />
                <Chip
                  label={`${saveSummary.linesWithActiveTake} lines with audio`}
                  color="success"
                  variant="outlined"
                />
                {saveSummary.linesWithoutTake > 0 && (
                  <Chip
                    label={`${saveSummary.linesWithoutTake} lines without audio`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>

              {/* Warning for lines without takes — with Generate TTS offer */}
              {saveSummary.linesWithoutTake > 0 && (
                <Alert
                  severity="warning"
                  icon={<WarningIcon />}
                  action={
                    saveSummary.linesWithTextButNoTake.length > 0 && (
                      <Button
                        color="warning"
                        size="small"
                        startIcon={generatingTTS ? null : <TtsIcon />}
                        onClick={handleGenerateMissingTTS}
                        disabled={generatingTTS || saving}
                      >
                        {generatingTTS
                          ? t('recordingStudio3Modal.generatingTts')
                          : t('recordingStudio3Modal.generateMissingTts', {
                              count: saveSummary.linesWithTextButNoTake.length,
                            })}
                      </Button>
                    )
                  }
                >
                  {t('recordingStudio3Modal.missingTakesWarning', {
                    count: saveSummary.linesWithoutTake,
                  })}
                </Alert>
              )}

              {/* TTS generation progress */}
              {generatingTTS && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('recordingStudio3Modal.generatingTtsProgress')}
                  </Typography>
                </Box>
              )}

              {/* Per-line breakdown */}
              <List>
                {saveSummary.linesSummary.map((line, index) => (
                  <React.Fragment key={line.id}>
                    <ListItem>
                      <ListItemIcon>
                        {line.hasTake ? (
                          <CheckIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              {index + 1}.
                            </Typography>
                            <Chip label={line.speaker} size="small" />
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {line.text || '(empty)'}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          line.hasTake
                            ? `${line.takeType} recording • ${line.totalTakes} take(s)`
                            : t('recordingStudio3Modal.noActiveTake')
                        }
                      />
                    </ListItem>
                    {index < saveSummary.linesSummary.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {/* Preset-specific info */}
              {preset === 'word' && (
                <Alert severity="info">
                  {t('recordingStudio3Modal.wordSaveInfo')}
                </Alert>
              )}
              {preset === 'conversation' && (
                <Alert severity="info">
                  {t('recordingStudio3Modal.conversationSaveInfo')}
                </Alert>
              )}

              <Divider />

              {/* Action buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => setShowPreview(false)}
                  disabled={saving}
                >
                  {t('recordingStudio3Modal.backToStudio')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleConfirmSave}
                  disabled={saving}
                >
                  {saving
                    ? t('recordingStudio3Modal.saving')
                    : t('recordingStudio3Modal.confirmSave')}
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      )}
    </Dialog>
  );
}
