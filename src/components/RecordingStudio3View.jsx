"use client";
import React from "react";
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
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTranslations } from "next-intl";
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  GraphicEq as WaveformIcon,
} from "@mui/icons-material";
import AudioWaveformPlayer from "./Editor3/components/AudioWaveformPlayer";
import ScreenplayEditor from "./RecordingStudio3/ScreenplayEditor";
import HorizontalTimeline from "./RecordingStudio3/HorizontalTimeline";
import AudioFilterPanel from "./RecordingStudio3/AudioFilterPanel";
import TakeVersionHistory from "./RecordingStudio3/TakeVersionHistory";

// Available TTS voices
const TTS_VOICES = [
  { value: "alloy", fallback: "Alloy (Neutral)" },
  { value: "echo", fallback: "Echo (Male)" },
  { value: "fable", fallback: "Fable (British Male)" },
  { value: "onyx", fallback: "Onyx (Deep Male)" },
  { value: "nova", fallback: "Nova (Female)" },
  { value: "shimmer", fallback: "Shimmer (Soft Female)" },
];

/**
 * RecordingStudio3View — presentational script/dialogue recording studio UI.
 * All state, context, TTS, upload, and imperative-handle logic lives in the
 * RecordingStudio3 wrapper, which threads state + handlers in with matching
 * names so this render mirrors the wrapper exactly. Also renders standalone
 * (design showcase) with mock props.
 */
export default function RecordingStudio3View({
  scriptData,
  selectedDialogueId = null,
  playing = false,
  isGenerating = false,
  ttsQueue = [],
  statusMessage = "",
  fountainText = "",
  activeFilters = new Set(),
  pendingDelete = null,
  identityId,
  readOnly = false,
  handleBatchGenerateTTS = () => {},
  handleImportJSON = () => {},
  handleExportJSON = () => {},
  handleFountainChange = () => {},
  handlePromptSubmit = () => {},
  handleUpdateDialogueLine = () => {},
  handleAudioWaveformRecordingComplete = () => {},
  handleGenerateTTS = () => {},
  handleFiltersChange = () => {},
  handleSetActiveTake = () => {},
  handleRollbackTake = () => {},
  setPendingDelete = () => {},
  handleAddSpeaker = () => {},
  handleUpdateSpeaker = () => {},
  handleDeleteSpeaker = () => {},
  isTrackLocked = () => false,
  setSelectedDialogueId = () => {},
  setPlaying = () => {},
  confirmDeleteTake = () => {},
}) {
  const t = useTranslations("components");

  const selectedDialogue = scriptData.dialogue.find(
    (d) => d.id === selectedDialogueId,
  );
  const selectedSpeaker = selectedDialogue
    ? scriptData.speakers[selectedDialogue.speaker]
    : null;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper sx={{ p: 1.5, borderRadius: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography variant="h6" sx={{ flex: 1, minWidth: 0 }}>
            {scriptData.metadata.title}
          </Typography>

          <Button
            startIcon={<WaveformIcon />}
            onClick={handleBatchGenerateTTS}
            disabled={readOnly || isGenerating}
            variant="contained"
            size="small"
          >
            {t("recordingStudio3.generateAllMissing")}
          </Button>
          {ttsQueue.length > 0 && (
            <Box sx={{ width: { xs: "100%", sm: 120 } }}>
              <LinearProgress />
            </Box>
          )}

          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
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
              {t("recordingStudio3.importJson")}
            </Button>
          </label>

          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportJSON}
            variant="outlined"
            size="small"
          >
            {t("recordingStudio3.exportJson")}
          </Button>
        </Stack>
        <Box
          role="status"
          aria-live="polite"
          aria-atomic="true"
          sx={{ minHeight: statusMessage ? 24 : 0, mt: statusMessage ? 1 : 0 }}
        >
          {statusMessage && (
            <Typography variant="caption" color="text.secondary">
              {statusMessage}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── Top section: Screenplay Editor + Speakers Panel ── */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Screenplay Editor (left) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ScreenplayEditor
            fountainText={fountainText}
            onFountainChange={handleFountainChange}
            onPromptSubmit={handlePromptSubmit}
            isGenerating={isGenerating}
            readOnly={readOnly}
          />
        </Box>

        {/* Right: Speakers Panel + Properties (when card selected) */}
        <Paper
          sx={{
            width: { xs: "100%", md: 300 },
            maxHeight: { xs: "45vh", md: "none" },
            borderRadius: 0,
            overflow: "auto",
            flexShrink: 0,
          }}
        >
          <Box sx={{ p: 2 }}>
            {/* ── Properties Panel (shown when a timeline card is selected) ── */}
            {selectedDialogue && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t("recordingStudio3.lineNumber", {
                    number:
                      scriptData.dialogue.findIndex(
                        (d) => d.id === selectedDialogue.id,
                      ) + 1,
                    speaker: selectedSpeaker?.name,
                  })}
                </Typography>

                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label={t("recordingStudio3.text", "Text")}
                    value={selectedDialogue.text || ""}
                    onChange={(e) =>
                      handleUpdateDialogueLine(selectedDialogue.id, {
                        text: e.target.value,
                      })
                    }
                    disabled={readOnly}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label={t("recordingStudio3.direction", "Direction")}
                    value={selectedDialogue.direction || ""}
                    onChange={(e) =>
                      handleUpdateDialogueLine(selectedDialogue.id, {
                        direction: e.target.value,
                      })
                    }
                    disabled={readOnly}
                    placeholder={t(
                      "recordingStudio3.directionPlaceholder",
                      "e.g., entering, out of breath",
                    )}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label={t("recordingStudio3.emotion", "Emotion")}
                    value={selectedDialogue.emotion || ""}
                    onChange={(e) =>
                      handleUpdateDialogueLine(selectedDialogue.id, {
                        emotion: e.target.value,
                      })
                    }
                    disabled={readOnly}
                    placeholder={t(
                      "recordingStudio3.emotionPlaceholder",
                      "e.g., cheerful, tired",
                    )}
                  />

                  {/* Recording / TTS controls */}
                  <Stack spacing={1}>
                    {!readOnly && (
                      <AudioWaveformPlayer
                        enableRecording
                        onRecordingComplete={
                          handleAudioWaveformRecordingComplete
                        }
                        height={60}
                        width="100%"
                      />
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<WaveformIcon />}
                      onClick={() => handleGenerateTTS(selectedDialogue.id)}
                      disabled={
                        readOnly || isGenerating || !selectedDialogue.text
                      }
                    >
                      {t("recordingStudio3.generateTts")}
                    </Button>
                  </Stack>

                  {/* Audio Filter Panel */}
                  <AudioFilterPanel
                    activeFilters={activeFilters}
                    onFiltersChange={handleFiltersChange}
                  />

                  {/* Takes list */}
                  {selectedDialogue.takes &&
                    selectedDialogue.takes.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t("recordingStudio3.takes")}
                        </Typography>
                        <List dense>
                          {selectedDialogue.takes.map((take, index) => {
                            const isActive =
                              selectedDialogue.activeTakeIndex === index;
                            const takeAudioUrl = take.audioPath
                              ? null // Will be resolved by AudioWaveformPlayer via file prop
                              : take.audioBlob
                                ? URL.createObjectURL(take.audioBlob)
                                : null;
                            return (
                              <ListItem
                                key={take.id}
                                sx={{
                                  flexDirection: "column",
                                  alignItems: "stretch",
                                  py: 1,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ width: "100%" }}
                                >
                                  <IconButton
                                    size="small"
                                    aria-label={t(
                                      isActive
                                        ? "recordingStudio3.activeTake"
                                        : "recordingStudio3.selectTake",
                                      isActive ? "Active take" : "Select take",
                                    )}
                                    aria-pressed={isActive}
                                    onClick={() =>
                                      handleSetActiveTake(
                                        selectedDialogue.id,
                                        index,
                                      )
                                    }
                                    disabled={readOnly}
                                  >
                                    {isActive ? (
                                      <StarIcon color="primary" />
                                    ) : (
                                      <StarBorderIcon />
                                    )}
                                  </IconButton>
                                  <Typography
                                    variant="caption"
                                    sx={{ minWidth: 90 }}
                                  >
                                    {`Take ${index + 1} (${take.type})`}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {new Date(
                                      take.createdAt,
                                    ).toLocaleTimeString()}
                                  </Typography>
                                  <TakeVersionHistory
                                    identityId={identityId}
                                    dialogueId={selectedDialogue.id}
                                    slotId={
                                      typeof take.id === "string"
                                        ? take.id
                                        : null
                                    }
                                    currentVersion={take.version}
                                    currentAudioPath={take.audioPath}
                                    takeType={take.type}
                                    onRestore={handleRollbackTake}
                                    disabled={
                                      readOnly || typeof take.id !== "string"
                                    }
                                  />
                                  {!readOnly && (
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      aria-label={t(
                                        "recordingStudio3.deleteTake",
                                        "Delete take",
                                      )}
                                      onClick={() =>
                                        setPendingDelete({
                                          dialogueId: selectedDialogue.id,
                                          takeIndex: index,
                                        })
                                      }
                                      sx={{ ml: "auto", flexShrink: 0 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Stack>
                                {(takeAudioUrl || take.file) && (
                                  <Box sx={{ mt: 0.5, pl: 5 }}>
                                    <AudioWaveformPlayer
                                      audioUrl={takeAudioUrl}
                                      file={take.file}
                                      waveformData={take.waveformData}
                                      audioFilters={activeFilters}
                                      width="100%"
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
                {t("recordingStudio3.speakers")}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSpeaker}
                disabled={readOnly}
              >
                {t("recordingStudio3.add")}
              </Button>
            </Stack>

            <Stack spacing={2}>
              {Object.entries(scriptData.speakers).map(
                ([speakerId, speaker]) => {
                  const isLocked = isTrackLocked(speakerId);

                  return (
                    <Paper key={speakerId} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={speaker.name}
                            onChange={(e) =>
                              handleUpdateSpeaker(speakerId, {
                                name: e.target.value,
                              })
                            }
                            disabled={readOnly || isLocked}
                            label={t("recordingStudio3.name", "Name")}
                          />
                          {!isLocked && !readOnly && (
                            <IconButton
                              size="small"
                              aria-label={t(
                                "recordingStudio3.deleteSpeaker",
                                "Delete speaker",
                              )}
                              onClick={() => handleDeleteSpeaker(speakerId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                          {isLocked && (
                            <Tooltip
                              title={t(
                                "recordingStudio3.lockedTrack",
                                "Locked track",
                              )}
                            >
                              <Badge
                                badgeContent="🔒"
                                aria-label={t(
                                  "recordingStudio3.lockedTrack",
                                  "Locked track",
                                )}
                              />
                            </Tooltip>
                          )}
                        </Stack>

                        <FormControl fullWidth size="small">
                          <InputLabel>{t("recordingStudio3.voice")}</InputLabel>
                          <Select
                            value={speaker.voice || "alloy"}
                            onChange={(e) =>
                              handleUpdateSpeaker(speakerId, {
                                voice: e.target.value,
                              })
                            }
                            disabled={readOnly}
                            label={t("recordingStudio3.voice")}
                          >
                            {TTS_VOICES.map((voice) => (
                              <MenuItem key={voice.value} value={voice.value}>
                                {t(
                                  `recordingStudio3.voices.${voice.value}`,
                                  voice.fallback,
                                )}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          value={speaker.description || ""}
                          onChange={(e) =>
                            handleUpdateSpeaker(speakerId, {
                              description: e.target.value,
                            })
                          }
                          disabled={readOnly}
                          label={t(
                            "recordingStudio3.description",
                            "Description",
                          )}
                          placeholder={t(
                            "recordingStudio3.descriptionPlaceholder",
                            "e.g., 30s, energetic, professional",
                          )}
                        />
                      </Stack>
                    </Paper>
                  );
                },
              )}
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

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-take-title"
      >
        <DialogTitle id="delete-take-title">
          {t("recordingStudio3.deleteTakeTitle", "Delete this take?")}
        </DialogTitle>
        <DialogContent>
          {t(
            "recordingStudio3.deleteTakeMessage",
            "This recording will be removed from the dialogue line.",
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={confirmDeleteTake}>
            {t("common.delete", "Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
