import React, { useReducer, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  IconButton,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  TextField,
  Divider,
  Tooltip,
  Slider,
} from "@mui/material";
import {
  recordingStudioReducer,
  initialRecordingStudioState,
} from "./recordingStudioReducer";

// Icons
import RecordIcon from "@mui/icons-material/KeyboardVoice";
import StopIcon from "@mui/icons-material/Stop";
import PlayIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import FilterListIcon from "@mui/icons-material/FilterList";

import AudioWaveformPlayer from "./Editor3/components/AudioWaveformPlayer";
import MicLevelIndicator from "./Editor3/components/MicLevelIndicator";
import { calculateWaveformData } from "../utils/calculateWaveformData";
import { uploadStudentSubmission } from "../utils/userSubmissionStorage";
import getCachedUrl from "../utils/getCachedUrl";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Enhanced Recording Studio with:
 * - Audio filtering toolbar (noise reduction, pop/click removal, speech enhancement)
 * - Cut functionality for audio editing
 * - Multiple tracks with different voices
 * - Horizontal scrolling track viewer
 * - Editable prompts per track
 * - Waveform visualization
 */
export default function RecordingStudioEnhanced({
  gradeId,
  nodeKey,
  onRecordingComplete,
  metadata = {},
  /** Optional ref — parent can read current state on demand (e.g. modal Save button) */
  stateRef,
}) {
  const t = useTranslations("components");
  const [state, dispatch] = useReducer(
    recordingStudioReducer,
    initialRecordingStudioState,
  );
  const {
    tracks,
    selectedTrackId,
    filters,
    recordingStatus,
    recordingAnalyser,
    selectionStart,
    selectionEnd,
  } = state;
  const recording = recordingStatus === "recording";

  // Keep stateRef current so parent modal can read state on Save
  if (stateRef) {
    stateRef.current = state;
  }

  // Refs
  const trackContainerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Available Whisper voices
  const whisperVoices = [
    { value: "alloy", label: "Alloy" },
    { value: "echo", label: "Echo" },
    { value: "fable", label: "Fable" },
    { value: "onyx", label: "Onyx" },
    { value: "nova", label: "Nova" },
    { value: "shimmer", label: "Shimmer" },
  ];

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  // Add new track
  const handleAddTrack = useCallback(() => {
    const newTrack = {
      id: Date.now(),
      name: t("recordingStudioEnhanced.trackName", {
        number: tracks.length + 1,
      }),
      voice: "alloy",
      prompt: "",
      clips: [],
    };
    dispatch({ type: "ADD_TRACK", track: newTrack });
  }, [tracks.length, t]);

  // Delete track
  const handleDeleteTrack = useCallback(
    (trackId) => {
      if (tracks.length === 1) {
        alert(t("recordingStudioEnhanced.deleteLastTrackAlert"));
        return;
      }
      dispatch({ type: "DELETE_TRACK", trackId });
    },
    [tracks.length, t],
  );

  // Update track property
  const updateTrack = useCallback((trackId, updates) => {
    dispatch({ type: "UPDATE_TRACK", trackId, updates });
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create AudioContext + AnalyserNode for MicLevelIndicator
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const recorder = new MediaRecorder(stream);

      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });

        // Apply filters to the recorded audio
        const processedBlob = await applyFilters(audioBlob, filters);

        // Calculate waveform
        const waveform = await calculateWaveformData(processedBlob, 600);

        // Add clip to selected track via reducer
        const newClip = {
          id: Date.now(),
          audioBlob: processedBlob,
          waveformData: waveform,
          startTime: 0,
          duration: 0,
        };

        dispatch({ type: "RECORDING_STOPPED", clip: newClip });

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      recorder.start();
      dispatch({
        type: "START_RECORDING",
        mediaStream: stream,
        mediaRecorder: recorder,
        recordingAnalyser: analyser,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(t("recordingStudioEnhanced.micAccessError"));
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (state.mediaRecorder && recording) {
      state.mediaRecorder.stop();
      dispatch({ type: "STOP_RECORDING" });
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Apply audio filters (simplified version - would need Web Audio API for real implementation)
  const applyFilters = async (audioBlob, filters) => {
    // This is a placeholder. Real implementation would use Web Audio API
    // to apply actual filters like:
    // - BiquadFilterNode for high/low pass filters
    // - DynamicsCompressorNode for normalization
    // - Custom noise gate for noise reduction
    // - etc.

    console.log("Applying filters:", filters);

    // For now, just return the original blob
    // TODO: Implement actual audio filtering
    return audioBlob;
  };

  // Cut selected portion of audio
  const handleCut = () => {
    if (selectionStart === null || selectionEnd === null) {
      alert(t("recordingStudioEnhanced.selectToCut"));
      return;
    }

    // TODO: Implement actual cutting logic using Web Audio API
    console.log("Cutting from", selectionStart, "to", selectionEnd);

    dispatch({ type: "CUT_SELECTION" });
  };

  // Generate audio from prompt using TTS
  const handleGenerateFromPrompt = async (trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.prompt.trim()) {
      alert(t("recordingStudioEnhanced.enterPrompt"));
      return;
    }

    try {
      // TODO: Call OpenAI TTS API with track.voice and track.prompt
      console.log("Generating audio:", {
        voice: track.voice,
        prompt: track.prompt,
      });

      // Placeholder - would need to implement actual API call
      alert(t("recordingStudioEnhanced.ttsNotImplemented"));
    } catch (error) {
      console.error("Error generating audio:", error);
      alert(t("recordingStudioEnhanced.ttsGenerationFailed"));
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Toolbar with filters */}
      <Toolbar
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2" sx={{ mr: 2 }}>
          {t("recordingStudioEnhanced.audioFilters")}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t("recordingStudioEnhanced.noiseReduction")}</InputLabel>
          <Select
            value={filters.noiseReduction}
            label={t("recordingStudioEnhanced.noiseReduction")}
            onChange={(e) =>
              dispatch({
                type: "SET_FILTER",
                filter: { noiseReduction: e.target.value },
              })
            }
          >
            <MenuItem value="none">
              {t("recordingStudioEnhanced.none")}
            </MenuItem>
            <MenuItem value="light">
              {t("recordingStudioEnhanced.light")}
            </MenuItem>
            <MenuItem value="medium">
              {t("recordingStudioEnhanced.medium")}
            </MenuItem>
            <MenuItem value="heavy">
              {t("recordingStudioEnhanced.heavy")}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>
            {t("recordingStudioEnhanced.speechEnhancement")}
          </InputLabel>
          <Select
            value={filters.speechEnhancement}
            label={t("recordingStudioEnhanced.speechEnhancement")}
            onChange={(e) =>
              dispatch({
                type: "SET_FILTER",
                filter: { speechEnhancement: e.target.value },
              })
            }
          >
            <MenuItem value="none">
              {t("recordingStudioEnhanced.none")}
            </MenuItem>
            <MenuItem value="clarity">
              {t("recordingStudioEnhanced.clarity")}
            </MenuItem>
            <MenuItem value="presence">
              {t("recordingStudioEnhanced.presence")}
            </MenuItem>
            <MenuItem value="broadcast">
              {t("recordingStudioEnhanced.broadcast")}
            </MenuItem>
          </Select>
        </FormControl>

        <Tooltip title={t("recordingStudioEnhanced.popClickTooltip")}>
          <Button
            size="small"
            variant={filters.popClickRemoval ? "contained" : "outlined"}
            onClick={() =>
              dispatch({
                type: "SET_FILTER",
                filter: { popClickRemoval: !filters.popClickRemoval },
              })
            }
          >
            {t("recordingStudioEnhanced.popClick")}
          </Button>
        </Tooltip>

        <Tooltip title={t("recordingStudioEnhanced.highPassTooltip")}>
          <Button
            size="small"
            variant={filters.highPassFilter ? "contained" : "outlined"}
            onClick={() =>
              dispatch({
                type: "SET_FILTER",
                filter: { highPassFilter: !filters.highPassFilter },
              })
            }
          >
            HPF
          </Button>
        </Tooltip>

        <Tooltip title={t("recordingStudioEnhanced.lowPassTooltip")}>
          <Button
            size="small"
            variant={filters.lowPassFilter ? "contained" : "outlined"}
            onClick={() =>
              dispatch({
                type: "SET_FILTER",
                filter: { lowPassFilter: !filters.lowPassFilter },
              })
            }
          >
            LPF
          </Button>
        </Tooltip>

        <Tooltip title={t("recordingStudioEnhanced.normalizeTooltip")}>
          <Button
            size="small"
            variant={filters.normalize ? "contained" : "outlined"}
            onClick={() =>
              dispatch({
                type: "SET_FILTER",
                filter: { normalize: !filters.normalize },
              })
            }
          >
            {t("recordingStudioEnhanced.normalize")}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        <Tooltip title={t("recordingStudioEnhanced.cutTooltip")}>
          <span>
            <IconButton
              onClick={handleCut}
              disabled={selectionStart === null || selectionEnd === null}
              color="primary"
            >
              <ContentCutIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>

      {/* Recording controls */}
      <Box sx={{ p: 2, bgcolor: "background.default" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          {!recording ? (
            <IconButton onClick={startRecording} color="error" size="large">
              <RecordIcon />
            </IconButton>
          ) : (
            <IconButton onClick={stopRecording} color="primary" size="large">
              <StopIcon />
            </IconButton>
          )}

          <Typography variant="body2">
            {recording
              ? t("recordingStudioEnhanced.recording")
              : t("recordingStudioEnhanced.clickToRecord")}
          </Typography>
          {recording && (
            <Box sx={{ minWidth: 120, flexGrow: 1, maxWidth: 200 }}>
              <MicLevelIndicator analyser={recordingAnalyser} />
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddTrack}
            variant="outlined"
            size="small"
          >
            {t("recordingStudioEnhanced.addTrack")}
          </Button>
        </Box>
      </Box>

      {/* Multi-track viewer with horizontal scrolling */}
      <Box
        ref={trackContainerRef}
        sx={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "60vh",
          bgcolor: "background.paper",
          p: 2,
        }}
      >
        {tracks.map((track) => (
          <Card
            key={track.id}
            sx={{
              mb: 2,
              border: 2,
              borderColor:
                selectedTrackId === track.id ? "primary.main" : "transparent",
            }}
            onClick={() =>
              dispatch({ type: "SELECT_TRACK", trackId: track.id })
            }
          >
            <CardContent>
              <Box
                sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}
              >
                <TextField
                  label={t("recordingStudioEnhanced.trackName")}
                  value={track.name}
                  onChange={(e) =>
                    updateTrack(track.id, { name: e.target.value })
                  }
                  size="small"
                  sx={{ width: 150 }}
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>{t("recordingStudioEnhanced.voice")}</InputLabel>
                  <Select
                    value={track.voice}
                    label={t("recordingStudioEnhanced.voice")}
                    onChange={(e) =>
                      updateTrack(track.id, { voice: e.target.value })
                    }
                  >
                    {whisperVoices.map((voice) => (
                      <MenuItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label={t("recordingStudioEnhanced.promptPlaceholder")}
                  value={track.prompt}
                  onChange={(e) =>
                    updateTrack(track.id, { prompt: e.target.value })
                  }
                  multiline
                  size="small"
                  sx={{ flexGrow: 1 }}
                  placeholder={t("recordingStudioEnhanced.promptPlaceholder")}
                />

                <Button
                  onClick={() => handleGenerateFromPrompt(track.id)}
                  variant="contained"
                  size="small"
                  disabled={!track.prompt.trim()}
                >
                  {t("recordingStudioEnhanced.generate")}
                </Button>

                <IconButton
                  onClick={() => handleDeleteTrack(track.id)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              {/* Track waveform - horizontal scrolling */}
              <Box
                sx={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  whiteSpace: "nowrap",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                  minHeight: 100,
                  bgcolor: "background.default",
                }}
              >
                {track.clips.length === 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "inline-block", lineHeight: "80px" }}
                  >
                    {t("recordingStudioEnhanced.noClips")}
                  </Typography>
                ) : (
                  <Box sx={{ display: "inline-flex", gap: 1 }}>
                    {track.clips.map((clip) => (
                      <Box
                        key={clip.id}
                        sx={{
                          display: "inline-block",
                          verticalAlign: "top",
                        }}
                      >
                        <AudioWaveformPlayer
                          waveformData={clip.waveformData}
                          width={300}
                          height={80}
                          showDuration={true}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Information panel */}
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t("recordingStudioEnhanced.tips")}
        </Typography>
      </Box>
    </Box>
  );
}
