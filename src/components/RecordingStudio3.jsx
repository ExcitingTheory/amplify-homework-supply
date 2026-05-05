/**
 * RecordingStudio3 - Advanced Dialogue Recording and TTS Generation
 * 
 * Features:
 * - Script-based dialogue format with speakers, timing, emotions, and directions
 * - Multiple takes per dialogue line (human recordings or TTS generated)
 * - Locked tracks mode for model-bound recordings (Word, Question)
 * - Timeline view with waveform visualization
 * - Batch TTS generation
 * - Non-destructive editing (all takes preserved)
 */

import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Tooltip,
  Alert,
  List,
  ListItem,
  Badge,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Mic as MicIcon,
  GraphicEq as WaveformIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { uploadStudentSubmission } from '../utils/userSubmissionStorage';
import { calculateWaveformData } from '../utils/calculateWaveformData';
import getCachedUrl from '../utils/getCachedUrl';
import AudioWaveformPlayer from './Editor3/components/AudioWaveformPlayer';
import ScreenplayEditor from './RecordingStudio3/ScreenplayEditor';
import HorizontalTimeline from './RecordingStudio3/HorizontalTimeline';
import { parseFountainToScriptData, scriptDataToFountain } from './RecordingStudio3/parseFountainToScriptData';
import { getAmplifyClient } from '../utils/amplifyClient';

// Available TTS voices
const TTS_VOICES = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British Male)' },
  { value: 'onyx', label: 'Onyx (Deep Male)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Soft Female)' },
];

/**
 * RecordingStudio3 Component
 * 
 * @param {Object} props
 * @param {Object} props.scriptData - Initial script data (metadata, speakers, dialogue)
 * @param {Function} props.onScriptChange - Callback when script data changes (receives full scriptData)
 * @param {Function} props.onUpdateData - Callback for granular updates (receives { type, payload })
 * @param {string[]} props.lockedTracks - Array of speaker IDs that cannot be deleted/renamed
 * @param {string} props.gradeId - Grade ID for student submissions
 * @param {string} props.nodeKey - Node key for file organization
 * @param {Object} props.identityId - User identity for S3 uploads
 * @param {boolean} props.readOnly - Disable all editing
 */
export default forwardRef(function RecordingStudio3({
  scriptData: initialScriptData,
  onScriptChange,
  onUpdateData,
  lockedTracks = [],
  gradeId,
  nodeKey,
  identityId,
  readOnly = false,
}, ref) {
  const { t } = useTranslation('components');
  
  // Script data state
  const [scriptData, setScriptData] = useState(initialScriptData || {
    metadata: {
      title: 'New Recording',
      scene: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    speakers: {},
    dialogue: [],
  });

  // UI state
  const [selectedDialogueId, setSelectedDialogueId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState('overdub'); // 'overdub', 'punch-in', 'replace'
  const [ttsQueue, setTtsQueue] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fountain screenplay text — bidirectional sync with scriptData
  const [fountainText, setFountainText] = useState(() =>
    scriptDataToFountain(initialScriptData || { metadata: { title: '', scene: '', date: '', version: '1.0' }, speakers: {}, dialogue: [] })
  );

  // Refs
  const playbackTimerRef = useRef(null);

  // Get selected dialogue line
  const selectedDialogue = scriptData.dialogue.find(d => d.id === selectedDialogueId);
  const selectedSpeaker = selectedDialogue ? scriptData.speakers[selectedDialogue.speaker] : null;

  // Check if track is locked
  const isTrackLocked = useCallback((speakerId) => {
    return lockedTracks.includes(speakerId);
  }, [lockedTracks]);

  // Update script data and notify parent
  const updateScriptData = useCallback((updates, updateType = null, updatePayload = null) => {
    setScriptData(prev => {
      const newData = { ...prev, ...updates };
      
      // Call onScriptChange with full data
      if (onScriptChange) {
        onScriptChange(newData);
      }
      
      // Call onUpdateData with granular update info
      if (onUpdateData && updateType) {
        onUpdateData({
          type: updateType,
          payload: updatePayload,
          scriptData: newData,
        });
      }
      
      return newData;
    });
  }, [onScriptChange, onUpdateData]);

  // Add new speaker
  const handleAddSpeaker = () => {
    const speakerId = `speaker_${Date.now()}`;
    const newSpeaker = {
      name: 'New Speaker',
      voice: 'alloy',
      description: '',
    };
    
    updateScriptData(
      {
        ...scriptData,
        speakers: {
          ...scriptData.speakers,
          [speakerId]: newSpeaker,
        },
      },
      'SPEAKER_ADDED',
      { speakerId, speaker: newSpeaker }
    );
  };

  // Update speaker
  const handleUpdateSpeaker = (speakerId, updates) => {
    if (isTrackLocked(speakerId) && (updates.name !== undefined)) {
      console.warn('Cannot update locked speaker name');
      return;
    }

    updateScriptData(
      {
        ...scriptData,
        speakers: {
          ...scriptData.speakers,
          [speakerId]: {
            ...scriptData.speakers[speakerId],
            ...updates,
          },
        },
      },
      'SPEAKER_UPDATED',
      { speakerId, updates }
    );
  };

  // Delete speaker
  const handleDeleteSpeaker = (speakerId) => {
    if (isTrackLocked(speakerId)) {
      console.warn('Cannot delete locked speaker');
      return;
    }

    const { [speakerId]: removed, ...remainingSpeakers } = scriptData.speakers;
    const updatedDialogue = scriptData.dialogue.filter(d => d.speaker !== speakerId);
    
    updateScriptData(
      {
        ...scriptData,
        speakers: remainingSpeakers,
        dialogue: updatedDialogue,
      },
      'SPEAKER_DELETED',
      { speakerId, removedSpeaker: removed }
    );
  };

  // Add dialogue line
  const handleAddDialogueLine = () => {
    const speakerIds = Object.keys(scriptData.speakers);
    if (speakerIds.length === 0) {
      alert(t('recordingStudio3.addSpeakerFirst'));
      return;
    }

    const newLine = {
      id: Date.now(),
      speaker: speakerIds[0],
      text: '',
      timing: { start: 0, end: 0 },
      direction: '',
      emotion: '',
      takes: [],
      activeTakeIndex: null,
    };

    updateScriptData(
      {
        ...scriptData,
        dialogue: [...scriptData.dialogue, newLine],
      },
      'DIALOGUE_ADDED',
      { dialogueId: newLine.id, dialogue: newLine }
    );
    
    setSelectedDialogueId(newLine.id);
  };

  // Update dialogue line
  const handleUpdateDialogueLine = (dialogueId, updates) => {
    updateScriptData(
      {
        ...scriptData,
        dialogue: scriptData.dialogue.map(d =>
          d.id === dialogueId ? Object.assign({}, d, updates) : d
        ),
      },
      'DIALOGUE_UPDATED',
      { dialogueId, updates }
    );
  };

  // Delete dialogue line
  const handleDeleteDialogueLine = (dialogueId) => {
    const deletedDialogue = scriptData.dialogue.find(d => d.id === dialogueId);
    
    updateScriptData(
      {
        ...scriptData,
        dialogue: scriptData.dialogue.filter(d => d.id !== dialogueId),
      },
      'DIALOGUE_DELETED',
      { dialogueId, dialogue: deletedDialogue }
    );
    
    if (selectedDialogueId === dialogueId) {
      setSelectedDialogueId(null);
    }
  };

  // Handle recording from AudioWaveformPlayer
  const handleAudioWaveformRecordingComplete = useCallback(async (file) => {
    if (!selectedDialogue) return;
    // file is { path: blobURL, waveformData } or a saved File record
    const waveformData = file?.waveformData ? JSON.parse(file.waveformData) : null;
    // Fetch the blob from the URL for handleRecordingComplete
    try {
      const response = await fetch(file.path);
      const audioBlob = await response.blob();
      await handleRecordingComplete(audioBlob, 'human');
    } catch (error) {
      console.error('Error processing AudioWaveformPlayer recording:', error);
    }
  }, [selectedDialogue]);

  // Handle completed recording
  const handleRecordingComplete = async (audioBlob, type = 'human', cinematicMetadata = null) => {
    if (!selectedDialogue) return;

    try {
      // Calculate waveform
      const waveformData = await calculateWaveformData(audioBlob, 600);
      
      // Upload to S3 if gradeId and nodeKey provided
      let audioPath = null;
      if (gradeId && nodeKey && identityId) {
        const uploadResult = await uploadStudentSubmission({
          file: audioBlob,
          gradeId,
          nodeKey: `${nodeKey}_dialogue_${selectedDialogue.id}`,
          fileType: 'mp3',
          metadata: {
            dialogueId: selectedDialogue.id,
            speaker: selectedDialogue.speaker,
            text: selectedDialogue.text,
            scene: scriptData.metadata.scene,
            direction: selectedDialogue.direction,
            emotion: selectedDialogue.emotion,
            ...cinematicMetadata,
          },
        });
        audioPath = uploadResult.path;
      }

      // Create new take with file metadata and cinematic context
      const newTake = {
        id: Date.now(),
        type, // 'human' or 'tts'
        audioBlob: audioPath ? null : audioBlob, // Store blob if not uploaded
        audioPath, // S3 path if uploaded
        waveformData, // Waveform data for visualization
        duration: audioBlob.size ? 0 : 0, // Will be calculated from actual audio
        file: audioPath ? {
          key: audioPath,
          level: 'protected',
          identityId: identityId,
          type: audioBlob.type || 'audio/mpeg',
          size: audioBlob.size,
        } : null,
        cinematicMetadata, // Store scene, direction, emotion context
        createdAt: new Date().toISOString(),
      };

      // Add take to dialogue line
      const existingTakes = selectedDialogue.takes || [];
      const updatedTakes = [...existingTakes, newTake];
      
      // Update with specific TAKE_ADDED event
      updateScriptData(
        {
          ...scriptData,
          dialogue: scriptData.dialogue.map(d =>
            d.id === selectedDialogue.id
              ? { ...d, takes: updatedTakes, activeTakeIndex: updatedTakes.length - 1 }
              : d
          ),
        },
        'TAKE_ADDED',
        {
          dialogueId: selectedDialogue.id,
          take: newTake,
          takeIndex: updatedTakes.length - 1,
        }
      );

    } catch (error) {
      console.error('Error processing recording:', error);
      alert(t('recordingStudio3.saveRecordingFailed'));
    }
  };

  // Generate TTS for dialogue line
  const handleGenerateTTS = async (dialogueId) => {
    const dialogue = scriptData.dialogue.find(d => d.id === dialogueId);
    if (!dialogue || !dialogue.text) {
      alert(t('recordingStudio3.noTextToGenerate'));
      return;
    }

    const speaker = scriptData.speakers[dialogue.speaker];
    if (!speaker) {
      alert(t('recordingStudio3.speakerNotFound'));
      return;
    }

    setIsGenerating(true);
    
    try {
      // Build cinematic context for TTS generation
      const contextParts = [];
      
      // Add scene context
      if (scriptData.metadata.scene) {
        contextParts.push(`Scene: ${scriptData.metadata.scene}`);
      }
      
      // Add character description
      if (speaker.description) {
        contextParts.push(`Character: ${speaker.name} (${speaker.description})`);
      }
      
      // Add direction notes
      if (dialogue.direction) {
        contextParts.push(`Direction: ${dialogue.direction}`);
      }
      
      // Add emotional context
      if (dialogue.emotion) {
        contextParts.push(`Emotion: ${dialogue.emotion}`);
      }
      
      const cinematicContext = contextParts.length > 0 
        ? contextParts.join(' | ') 
        : null;

      // Call generateAudioFile mutation
      const client = getAmplifyClient();
      const { data: fileData, errors } = await client.mutations.generateAudioFile({
        phrase: dialogue.text,
        voice: speaker.voice || 'alloy',
        model: 'tts-1-hd',
      });
      
      if ((errors && errors.length > 0) || !fileData?.path) {
        throw new Error('Failed to generate audio file');
      }
      
      // Get audio URL
      const audioUrl = await getCachedUrl(fileData.path);
      
      // Fetch audio as blob
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      
      // Process as TTS recording with cinematic metadata
      await handleRecordingComplete(audioBlob, 'tts', {
        cinematicContext,
        scene: scriptData.metadata.scene,
        direction: dialogue.direction,
        emotion: dialogue.emotion,
        characterDescription: speaker.description,
      });
      
    } catch (error) {
      console.error('Error generating TTS:', error);
      alert(t('recordingStudio3.ttsGenerationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch generate TTS for all missing
  const handleBatchGenerateTTS = async () => {
    const missingLines = scriptData.dialogue.filter(d => 
      d.text && (!d.takes || d.takes.length === 0)
    );

    if (missingLines.length === 0) {
      alert(t('recordingStudio3.noMissingAudio'));
      return;
    }

    setTtsQueue(missingLines.map(line => line.id));

    for (const line of missingLines) {
      await handleGenerateTTS(line.id);
      setTtsQueue(prev => prev.filter(id => id !== line.id));
    }
  };

  // Expose imperative API for parent (e.g., RecordingStudio3Modal)
  useImperativeHandle(ref, () => ({
    triggerBatchTTS: handleBatchGenerateTTS,
  }), [handleBatchGenerateTTS]);

  // Set active take
  const handleSetActiveTake = (dialogueId, takeIndex) => {
    updateScriptData(
      {
        ...scriptData,
        dialogue: scriptData.dialogue.map(d =>
          d.id === dialogueId ? { ...d, activeTakeIndex: takeIndex } : d
        ),
      },
      'ACTIVE_TAKE_CHANGED',
      { dialogueId, takeIndex }
    );
  };

  // Delete take
  const handleDeleteTake = (dialogueId, takeIndex) => {
    const dialogue = scriptData.dialogue.find(d => d.id === dialogueId);
    if (!dialogue) return;

    const deletedTake = dialogue.takes[takeIndex];
    const updatedTakes = dialogue.takes.filter((_, idx) => idx !== takeIndex);
    const newActiveTakeIndex = dialogue.activeTakeIndex === takeIndex
      ? (updatedTakes.length > 0 ? 0 : null)
      : dialogue.activeTakeIndex > takeIndex
        ? dialogue.activeTakeIndex - 1
        : dialogue.activeTakeIndex;

    updateScriptData(
      {
        ...scriptData,
        dialogue: scriptData.dialogue.map(d =>
          d.id === dialogueId
            ? { ...d, takes: updatedTakes, activeTakeIndex: newActiveTakeIndex }
            : d
        ),
      },
      'TAKE_DELETED',
      { dialogueId, takeIndex, take: deletedTake }
    );
  };

  // Export script as JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(scriptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scriptData.metadata.title || 'script'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import script from JSON
  const handleImportJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setScriptData(imported);
        setFountainText(scriptDataToFountain(imported));
        if (onScriptChange) {
          onScriptChange(imported);
        }
      } catch (error) {
        console.error('Error importing JSON:', error);
        alert(t('recordingStudio3.importFailed'));
      }
    };
    reader.readAsText(file);
  };

  // Handle AI prompt submission — generate/modify Fountain screenplay
  const handlePromptSubmit = useCallback(async (prompt) => {
    setIsGenerating(true);
    try {
      const client = getAmplifyClient();
      const systemMessage = [
        'You are a screenplay writer. Output ONLY valid Fountain format text, no explanation.',
        'Fountain format rules:',
        '- Title page: "Title: ..." and "Date: ..." at the top, followed by a blank line',
        '- Scene headings: lines starting with INT. or EXT.',
        '- Character names: UPPERCASE on their own line before dialogue',
        '- Dialogue: normal text on the line after the character name',
        '- Parentheticals: (emotion) between character name and dialogue',
        '- Notes: [[direction notes]] inside dialogue text',
        '- Blank line between each dialogue block',
      ].join('\n');

      // Include current script as context if it exists
      const currentContext = scriptData.dialogue.length > 0
        ? `\n\nCurrent screenplay:\n${fountainText}\n\nModify or extend the above based on the user request.`
        : '';

      const messages = JSON.stringify([
        { role: 'system', content: systemMessage + currentContext },
        { role: 'user', content: prompt },
      ]);

      const { data, errors } = await client.mutations.chat({ messages });

      if (errors?.length > 0) {
        throw new Error(errors[0].message || 'Chat mutation failed');
      }

      if (data) {
        const newFountain = data.trim();
        setFountainText(newFountain);

        // Parse into scriptData
        const existingVoices = {};
        for (const [key, speaker] of Object.entries(scriptData.speakers)) {
          existingVoices[key] = speaker.voice;
        }
        const parsed = parseFountainToScriptData(newFountain, existingVoices);
        updateScriptData(parsed, 'AI_GENERATE', { prompt });
      }
    } catch (err) {
      console.error('AI script generation failed:', err);
      alert(t('recordingStudio3.aiGenerationFailed', 'Failed to generate script. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  }, [scriptData.speakers, scriptData.dialogue.length, fountainText, updateScriptData, t]);

  // Handle Fountain editor changes — re-parse into scriptData, preserving takes
  const handleFountainChange = useCallback((newText) => {
    setFountainText(newText);
    try {
      // Build existing voice map so parser preserves voice assignments
      const existingVoices = {};
      for (const [key, speaker] of Object.entries(scriptData.speakers)) {
        existingVoices[key] = speaker.voice;
      }
      const parsed = parseFountainToScriptData(newText, existingVoices);

      // Preserve takes from current dialogue lines by matching on speaker+text
      const takesMap = new Map();
      for (const line of scriptData.dialogue) {
        const key = `${line.speaker}::${line.text}`;
        if (line.takes?.length > 0) {
          takesMap.set(key, { takes: line.takes, activeTakeIndex: line.activeTakeIndex });
        }
      }
      for (const line of parsed.dialogue) {
        const key = `${line.speaker}::${line.text}`;
        const existing = takesMap.get(key);
        if (existing) {
          line.takes = existing.takes;
          line.activeTakeIndex = existing.activeTakeIndex;
        }
      }

      updateScriptData(parsed, 'FOUNTAIN_CHANGE', { fountainText: newText });
    } catch (err) {
      console.warn('Fountain parse error (waiting for valid text):', err);
    }
  }, [scriptData.speakers, scriptData.dialogue, updateScriptData]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 1.5, borderRadius: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flex: 1 }}>
            {scriptData.metadata.title}
          </Typography>

          <Button
            startIcon={<WaveformIcon />}
            onClick={handleBatchGenerateTTS}
            disabled={readOnly || isGenerating}
            variant="contained"
            size="small"
          >
            {t('recordingStudio3.generateAllMissing')}
          </Button>
          {ttsQueue.length > 0 && (
            <Box sx={{ width: 120 }}>
              <LinearProgress />
            </Box>
          )}

          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            id="import-json-input"
            onChange={handleImportJSON}
          />
          <label htmlFor="import-json-input">
            <Button
              component="span"
              startIcon={<UploadIcon />}
              variant="outlined"
              size="small"
            >
              {t('recordingStudio3.importJson')}
            </Button>
          </label>

          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportJSON}
            variant="outlined"
            size="small"
          >
            {t('recordingStudio3.exportJson')}
          </Button>
        </Stack>
      </Paper>

      {/* ── Top section: Screenplay Editor + Speakers Panel ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Screenplay Editor (left) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ScreenplayEditor
            fountainText={fountainText}
            onFountainChange={handleFountainChange}
            onPromptSubmit={handlePromptSubmit}
            isGenerating={isGenerating}
            readOnly={readOnly}
          />
        </Box>

        {/* Right: Speakers Panel + Properties (when card selected) */}
        <Paper sx={{ width: 300, borderRadius: 0, overflow: 'auto', flexShrink: 0 }}>
          <Box sx={{ p: 2 }}>
            {/* ── Properties Panel (shown when a timeline card is selected) ── */}
            {selectedDialogue && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('recordingStudio3.lineNumber', {
                    number: scriptData.dialogue.findIndex(d => d.id === selectedDialogue.id) + 1,
                    speaker: selectedSpeaker?.name,
                  })}
                </Typography>

                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Text"
                    value={selectedDialogue.text || ''}
                    onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { text: e.target.value })}
                    disabled={readOnly}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Direction"
                    value={selectedDialogue.direction || ''}
                    onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { direction: e.target.value })}
                    disabled={readOnly}
                    placeholder="e.g., entering, out of breath"
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Emotion"
                    value={selectedDialogue.emotion || ''}
                    onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { emotion: e.target.value })}
                    disabled={readOnly}
                    placeholder="e.g., cheerful, tired"
                  />

                  {/* Recording / TTS controls */}
                  <Stack spacing={1}>
                    {!readOnly && (
                      <AudioWaveformPlayer
                        enableRecording
                        onRecordingComplete={handleAudioWaveformRecordingComplete}
                        height={60}
                        width={400}
                      />
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<WaveformIcon />}
                      onClick={() => handleGenerateTTS(selectedDialogue.id)}
                      disabled={readOnly || isGenerating || !selectedDialogue.text}
                    >
                      {t('recordingStudio3.generateTts')}
                    </Button>
                  </Stack>

                  {/* Takes list */}
                  {selectedDialogue.takes && selectedDialogue.takes.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('recordingStudio3.takes')}
                      </Typography>
                      <List dense>
                        {selectedDialogue.takes.map((take, index) => {
                          const isActive = selectedDialogue.activeTakeIndex === index;
                          const takeAudioUrl = take.audioPath
                            ? null  // Will be resolved by AudioWaveformPlayer via file prop
                            : take.audioBlob
                              ? URL.createObjectURL(take.audioBlob)
                              : null;
                          return (
                            <ListItem
                              key={take.id}
                              sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1 }}
                              secondaryAction={
                                !readOnly && (
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleDeleteTake(selectedDialogue.id, index)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )
                              }
                            >
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetActiveTake(selectedDialogue.id, index)}
                                  disabled={readOnly}
                                >
                                  {isActive ? <StarIcon color="primary" /> : <StarBorderIcon />}
                                </IconButton>
                                <Typography variant="caption" sx={{ minWidth: 90 }}>
                                  {`Take ${index + 1} (${take.type})`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(take.createdAt).toLocaleTimeString()}
                                </Typography>
                              </Stack>
                              {(takeAudioUrl || take.file) && (
                                <Box sx={{ mt: 0.5, pl: 5 }}>
                                  <AudioWaveformPlayer
                                    audioUrl={takeAudioUrl}
                                    file={take.file}
                                    waveformData={take.waveformData}
                                    width={350}
                                    height={50}
                                    showDuration
                                  />
                                </Box>
                              )}
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {/* ── Speakers ── */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                {t('recordingStudio3.speakers')}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSpeaker}
                disabled={readOnly}
              >
                {t('recordingStudio3.add')}
              </Button>
            </Stack>

            <Stack spacing={2}>
              {Object.entries(scriptData.speakers).map(([speakerId, speaker]) => {
                const isLocked = isTrackLocked(speakerId);

                return (
                  <Paper key={speakerId} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          value={speaker.name}
                          onChange={(e) => handleUpdateSpeaker(speakerId, { name: e.target.value })}
                          disabled={readOnly || isLocked}
                          label="Name"
                        />
                        {!isLocked && !readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSpeaker(speakerId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        {isLocked && (
                          <Tooltip title="Locked track">
                            <Badge badgeContent="🔒" />
                          </Tooltip>
                        )}
                      </Stack>

                      <FormControl fullWidth size="small">
                        <InputLabel>{t('recordingStudio3.voice')}</InputLabel>
                        <Select
                          value={speaker.voice || 'alloy'}
                          onChange={(e) => handleUpdateSpeaker(speakerId, { voice: e.target.value })}
                          disabled={readOnly}
                          label={t('recordingStudio3.voice')}
                        >
                          {TTS_VOICES.map(voice => (
                            <MenuItem key={voice.value} value={voice.value}>
                              {voice.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        value={speaker.description || ''}
                        onChange={(e) => handleUpdateSpeaker(speakerId, { description: e.target.value })}
                        disabled={readOnly}
                        label="Description"
                        placeholder="e.g., 30s, energetic, professional"
                      />
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* ── Bottom: Horizontal Timeline ── */}
      <HorizontalTimeline
        scriptData={scriptData}
        selectedDialogueId={selectedDialogueId}
        onSelectDialogue={setSelectedDialogueId}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onStop={() => setPlaying(false)}
        onRecordingComplete={handleAudioWaveformRecordingComplete}
        readOnly={readOnly}
      />
    </Box>
  );
})