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

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  ListItemText,
  ListItemButton,
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
import { generateClient } from 'aws-amplify/api';
import { uploadStudentSubmission } from '../utils/userSubmissionStorage';
import { calculateWaveformData } from '../utils/calculateWaveformData';
import getCachedUrl from '../utils/getCachedUrl';
import AudioWaveformPlayer from './Editor3/components/AudioWaveformPlayer';
import StaticWaveform from './Editor3/components/StaticWaveform';

const client = generateClient();

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
export default function RecordingStudio3({
  scriptData: initialScriptData,
  onScriptChange,
  onUpdateData,
  lockedTracks = [],
  gradeId,
  nodeKey,
  identityId,
  readOnly = false,
}) {
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
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState('overdub'); // 'overdub', 'punch-in', 'replace'
  const [ttsQueue, setTtsQueue] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
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
      alert('Please add a speaker first');
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

  // Start recording
  const handleStartRecording = async () => {
    if (!selectedDialogue) {
      alert('Please select a dialogue line first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
        await handleRecordingComplete(audioBlob, 'human');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

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
      alert('Failed to save recording');
    }
  };

  // Generate TTS for dialogue line
  const handleGenerateTTS = async (dialogueId) => {
    const dialogue = scriptData.dialogue.find(d => d.id === dialogueId);
    if (!dialogue || !dialogue.text) {
      alert('No text to generate');
      return;
    }

    const speaker = scriptData.speakers[dialogue.speaker];
    if (!speaker) {
      alert('Speaker not found');
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
      const { generateAudioFile } = await import('../graphql/mutations');
      const response = await client.graphql({
        query: generateAudioFile,
        variables: {
          phrase: dialogue.text,
          voice: speaker.voice || 'alloy',
          model: 'tts-1-hd',
        },
      });

      const fileData = response.data.generateAudioFile;
      
      // Get audio URL
      const audioUrl = await getCachedUrl(fileData.path, 'protected', fileData.identityId);
      
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
      alert('Failed to generate TTS audio');
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
      alert('No missing audio to generate');
      return;
    }

    setTtsQueue(missingLines.map(line => line.id));

    for (const line of missingLines) {
      await handleGenerateTTS(line.id);
      setTtsQueue(prev => prev.filter(id => id !== line.id));
    }
  };

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
        if (onScriptChange) {
          onScriptChange(imported);
        }
      } catch (error) {
        console.error('Error importing JSON:', error);
        alert('Failed to import JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flex: 1 }}>
            {scriptData.metadata.title}
          </Typography>
          
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
              Import JSON
            </Button>
          </label>
          
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportJSON}
            variant="outlined"
            size="small"
          >
            Export JSON
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Script Panel - Left */}
        <Paper sx={{ width: 350, borderRadius: 0, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                Script
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddDialogueLine}
                disabled={readOnly}
              >
                Add Line
              </Button>
            </Stack>

            <List dense>
              {scriptData.dialogue.map((line, index) => {
                const speaker = scriptData.speakers[line.speaker];
                const hasRecording = line.takes && line.takes.length > 0;
                const isSelected = selectedDialogueId === line.id;

                return (
                  <ListItem
                    key={line.id}
                    disablePadding
                    secondaryAction={
                      !readOnly && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDeleteDialogueLine(line.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedDialogueId(line.id)}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              {index + 1}.
                            </Typography>
                            <Chip
                              label={speaker?.name || 'Unknown'}
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            {hasRecording && (
                              <WaveformIcon fontSize="small" color="primary" />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" noWrap>
                            {line.text || '(empty)'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>

        {/* Center - Properties and Timeline */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Properties Panel */}
          {selectedDialogue && (
            <Paper sx={{ p: 2, borderRadius: 0 }}>
              <Typography variant="subtitle2" gutterBottom>
                Line #{scriptData.dialogue.findIndex(d => d.id === selectedDialogue.id) + 1} - {selectedSpeaker?.name}
              </Typography>

              <Stack spacing={2}>
                {/* Text */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Text"
                  value={selectedDialogue.text || ''}
                  onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { text: e.target.value })}
                  disabled={readOnly}
                />

                <Stack direction="row" spacing={2}>
                  {/* Direction */}
                  <TextField
                    fullWidth
                    label="Direction"
                    value={selectedDialogue.direction || ''}
                    onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { direction: e.target.value })}
                    disabled={readOnly}
                    placeholder="e.g., entering, out of breath"
                  />

                  {/* Emotion */}
                  <TextField
                    fullWidth
                    label="Emotion"
                    value={selectedDialogue.emotion || ''}
                    onChange={(e) => handleUpdateDialogueLine(selectedDialogue.id, { emotion: e.target.value })}
                    disabled={readOnly}
                    placeholder="e.g., cheerful, tired"
                  />
                </Stack>

                {/* Recording/TTS Controls */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={recording ? 'contained' : 'outlined'}
                    color={recording ? 'error' : 'primary'}
                    startIcon={recording ? <StopIcon /> : <RecordIcon />}
                    onClick={recording ? handleStopRecording : handleStartRecording}
                    disabled={readOnly || isGenerating}
                  >
                    {recording ? 'Stop' : 'Record'}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<WaveformIcon />}
                    onClick={() => handleGenerateTTS(selectedDialogue.id)}
                    disabled={readOnly || isGenerating || !selectedDialogue.text}
                  >
                    Generate TTS
                  </Button>
                </Stack>

                {/* Takes List */}
                {selectedDialogue.takes && selectedDialogue.takes.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Takes:
                    </Typography>
                    <List dense>
                      {selectedDialogue.takes.map((take, index) => {
                        const isActive = selectedDialogue.activeTakeIndex === index;
                        return (
                          <ListItem
                            key={take.id}
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
                            <IconButton
                              size="small"
                              onClick={() => handleSetActiveTake(selectedDialogue.id, index)}
                              disabled={readOnly}
                            >
                              {isActive ? <StarIcon color="primary" /> : <StarBorderIcon />}
                            </IconButton>
                            <ListItemText
                              primary={`Take ${index + 1} (${take.type})`}
                              secondary={new Date(take.createdAt).toLocaleTimeString()}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}

          {/* Timeline/Waveform View */}
          <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Timeline
            </Typography>
            
            {scriptData.dialogue.map((line) => {
              const speaker = scriptData.speakers[line.speaker];
              const activeTake = line.activeTakeIndex !== null && line.takes?.[line.activeTakeIndex];
              
              return (
                <Paper key={line.id} sx={{ p: 1, mb: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip label={speaker?.name || 'Unknown'} size="small" />
                    <Typography variant="caption" sx={{ flex: 1 }} noWrap>
                      {line.text}
                    </Typography>
                    {activeTake && activeTake.waveformData && (
                      <Box sx={{ width: 200 }}>
                        <StaticWaveform
                          waveformData={activeTake.waveformData}
                          width={200}
                          height={40}
                        />
                      </Box>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Box>

        {/* Right Panel - Speakers */}
        <Paper sx={{ width: 300, borderRadius: 0, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                Speakers
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSpeaker}
                disabled={readOnly}
              >
                Add
              </Button>
            </Stack>

            <Stack spacing={2}>
              {Object.entries(scriptData.speakers).map(([speakerId, speaker]) => {
                const isLocked = isTrackLocked(speakerId);
                
                return (
                  <Paper key={speakerId} variant="outlined" sx={{ p: 2 }}>
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
                        <InputLabel>Voice</InputLabel>
                        <Select
                          value={speaker.voice || 'alloy'}
                          onChange={(e) => handleUpdateSpeaker(speakerId, { voice: e.target.value })}
                          disabled={readOnly}
                          label="Voice"
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

            {/* Batch TTS Generation */}
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<WaveformIcon />}
                onClick={handleBatchGenerateTTS}
                disabled={readOnly || isGenerating}
              >
                Generate All Missing TTS
              </Button>
              {ttsQueue.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary">
                    Processing {ttsQueue.length} lines...
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
