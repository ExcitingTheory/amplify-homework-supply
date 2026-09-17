"use client";
import React from "react";
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
} from "@mui/material";
import RecordIcon from "@mui/icons-material/KeyboardVoice";
import StopIcon from "@mui/icons-material/Stop";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import AudioWaveformPlayer from "./Editor3/components/AudioWaveformPlayer";
import MicLevelIndicator from "./Editor3/components/MicLevelIndicator";

const WHISPER_VOICES = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

/**
 * RecordingStudioEnhancedView — presentational multi-track recording studio UI.
 * All audio/reducer logic lives in the RecordingStudioEnhanced wrapper, which
 * threads state + callbacks in. Renders standalone (design showcase) too.
 */
export default function RecordingStudioEnhancedView({
  tracks = [],
  selectedTrackId,
  filters = {},
  recording = false,
  recordingAnalyser = null,
  selectionStart = null,
  selectionEnd = null,
  whisperVoices = WHISPER_VOICES,
  trackContainerRef,
  onStartRecording = () => {},
  onStopRecording = () => {},
  onCut = () => {},
  onAddTrack = () => {},
  onDeleteTrack = () => {},
  onUpdateTrack = () => {},
  onGenerateFromPrompt = () => {},
  onSetFilter = () => {},
  onSelectTrack = () => {},
}) {
  const t = useTranslations("components");

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
            onChange={(e) => onSetFilter({ noiseReduction: e.target.value })}
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
            onChange={(e) => onSetFilter({ speechEnhancement: e.target.value })}
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
              onSetFilter({ popClickRemoval: !filters.popClickRemoval })
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
              onSetFilter({ highPassFilter: !filters.highPassFilter })
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
              onSetFilter({ lowPassFilter: !filters.lowPassFilter })
            }
          >
            LPF
          </Button>
        </Tooltip>

        <Tooltip title={t("recordingStudioEnhanced.normalizeTooltip")}>
          <Button
            size="small"
            variant={filters.normalize ? "contained" : "outlined"}
            onClick={() => onSetFilter({ normalize: !filters.normalize })}
          >
            {t("recordingStudioEnhanced.normalize")}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        <Tooltip title={t("recordingStudioEnhanced.cutTooltip")}>
          <span>
            <IconButton
              onClick={onCut}
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
            <IconButton onClick={onStartRecording} color="error" size="large">
              <RecordIcon />
            </IconButton>
          ) : (
            <IconButton onClick={onStopRecording} color="primary" size="large">
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
            onClick={onAddTrack}
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
            onClick={() => onSelectTrack(track.id)}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}
              >
                <TextField
                  label={t("recordingStudioEnhanced.trackName")}
                  value={track.name}
                  onChange={(e) =>
                    onUpdateTrack(track.id, { name: e.target.value })
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
                      onUpdateTrack(track.id, { voice: e.target.value })
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
                    onUpdateTrack(track.id, { prompt: e.target.value })
                  }
                  multiline
                  size="small"
                  sx={{ flexGrow: 1 }}
                  placeholder={t("recordingStudioEnhanced.promptPlaceholder")}
                />

                <Button
                  onClick={() => onGenerateFromPrompt(track.id)}
                  variant="contained"
                  size="small"
                  disabled={!track.prompt.trim()}
                >
                  {t("recordingStudioEnhanced.generate")}
                </Button>

                <IconButton
                  onClick={() => onDeleteTrack(track.id)}
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
