"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Box, Typography, Card, CardContent } from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import PlayIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RecordIcon from "@mui/icons-material/KeyboardVoice";
import StaticWaveform from "./Editor3/components/StaticWaveform";
import AudioWaveformPlayer from "./Editor3/components/AudioWaveformPlayer";
import MicLevelIndicator from "./Editor3/components/MicLevelIndicator";
import getCachedUrl from "../utils/getCachedUrl";

// Component to handle async audio URL loading for an existing recording.
export function AudioRecordingCard({ file, index, identityId }) {
  const t = useTranslations("components");
  const [audioUrl, setAudioUrl] = React.useState(null);

  React.useEffect(() => {
    if (file.path) {
      getCachedUrl(file.path)
        .then((url) => setAudioUrl(url))
        .catch((err) => console.error("Error loading audio URL:", err));
    }
  }, [file.path, identityId]);

  return (
    <Card
      sx={{
        boxShadow: 3,
        "&:hover": {
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        {audioUrl ? (
          <AudioWaveformPlayer
            audioUrl={audioUrl}
            file={file}
            width={600}
            height={80}
            title={
              file.name ||
              t("recordingStudio2.recordingNumber", {
                number: index + 1,
              })
            }
            showDuration={true}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {file.name ||
                t("recordingStudio2.recordingNumber", {
                  number: index + 1,
                })}
            </Typography>
            <StaticWaveform
              file={file}
              width={600}
              height={80}
              backgroundColor="transparent"
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(file.createdAt).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * RecordingStudio2View — presentational single-word recorder UI. All recording,
 * upload, and transcription logic lives in the RecordingStudio2 wrapper, which
 * threads state, refs, and callbacks in.
 */
export function RecordingStudio2View({
  error = null,
  audioFile = null,
  audioFiles = {},
  embedded = false,
  recording = false,
  isPlaying = false,
  audioBlob = null,
  waveformData = null,
  recordingAnalyser = null,
  identityId,
  audioRef,
  canvasRef,
  onPlay = () => {},
  onPause = () => {},
  onEnded = () => {},
  onStartRecording = () => {},
  onStopRecording = () => {},
}) {
  const t = useTranslations("components");

  return (
    <>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      <Box>
        {audioFile && (
          <>
            <audio controls={false} ref={audioRef} onEnded={onEnded}>
              <source src={audioFile} />
            </audio>
            {!isPlaying && (
              <PlayIcon
                color="primary"
                sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
                onClick={onPlay}
              />
            )}
            {isPlaying && (
              <PauseIcon
                color="primary"
                sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
                onClick={onPause}
              />
            )}
          </>
        )}
        {!recording && (
          <RecordIcon
            color="primary"
            onClick={onStartRecording}
            sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
          />
        )}
        {recording && (
          <StopIcon
            onClick={onStopRecording}
            color="error"
            sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
          />
        )}
        {audioBlob && (
          <>
            <audio controls={false} ref={audioRef} onEnded={onEnded}>
              <source src={URL.createObjectURL(audioBlob)} />
            </audio>
            {!isPlaying && (
              <PlayIcon
                color="primary"
                sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
                onClick={onPlay}
              />
            )}
            {isPlaying && (
              <PauseIcon
                color="primary"
                sx={{ position: "relative", top: "0.2rem", cursor: "pointer" }}
                onClick={onPause}
              />
            )}
          </>
        )}
      </Box>
      <canvas
        ref={canvasRef}
        id="waveform"
        style={{ backgroundColor: "white" }}
      />
      {/* Mic level indicator during recording */}
      {recording && (
        <Box sx={{ mt: 1 }}>
          <MicLevelIndicator analyser={recordingAnalyser} />
        </Box>
      )}
      {/* Display all existing audio recordings */}
      {!embedded && Object.keys(audioFiles).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("recordingStudio2.existingRecordings")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {Object.values(audioFiles).map((file, index) => (
              <AudioRecordingCard
                key={file.id || index}
                file={file}
                index={index}
                identityId={identityId}
              />
            ))}
          </Box>
        </Box>
      )}
      {!embedded && audioFile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t("recordingStudio2.staticWaveformPreview")}
          </Typography>
          <StaticWaveform file={audioFile} width={600} height={80} />
        </Box>
      )}
      {!embedded && waveformData && audioBlob && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t("recordingStudio2.recordedAudioWaveform")}
          </Typography>
          <StaticWaveform waveformData={waveformData} width={600} height={80} />
        </Box>
      )}
    </>
  );
}

export default RecordingStudio2View;
