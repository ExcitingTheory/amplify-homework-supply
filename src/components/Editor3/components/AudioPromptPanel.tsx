import * as React from "react";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, ButtonBase, Typography } from "@mui/material";
import getCachedUrl from "../../../utils/getCachedUrl";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import StaticWaveform from "./StaticWaveform";

export interface AudioPromptFile {
  key?: string;
  path?: string;
  waveformData?: number[];
}

export interface AudioPromptPanelProps {
  audioFile?: AudioPromptFile | null;
  audioUrl?: string | null;
  definition?: string | null;
  prompt?: string | null;
  width: number;
}

interface PromptAudioPlayer {
  currentSource: string | null;
  isPlaying: boolean;
  pause: () => void;
  play: (sourceUrl: string) => Promise<boolean>;
}

const PROMPT_WAVEFORM_HEIGHT = 48;

export default function AudioPromptPanel({
  audioFile,
  audioUrl,
  definition,
  prompt,
  width,
}: AudioPromptPanelProps) {
  const audioPlayer = useAudioPlayer() as PromptAudioPlayer;
  const audioPath = audioUrl || audioFile?.path || audioFile?.key || null;
  const [resolvedAudioUrl, setResolvedAudioUrl] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!audioPath) {
      setResolvedAudioUrl(null);
      return;
    }

    let active = true;
    void getCachedUrl(audioPath)
      .then((url) => {
        if (active) setResolvedAudioUrl(url || null);
      })
      .catch((error) => {
        console.warn(
          "[AudioPromptPanel] Unable to resolve prompt audio:",
          error,
        );
        if (active) setResolvedAudioUrl(null);
      });

    return () => {
      active = false;
    };
  }, [audioPath]);

  const isPlaying =
    resolvedAudioUrl !== null &&
    audioPlayer.currentSource === resolvedAudioUrl &&
    audioPlayer.isPlaying;

  const togglePlayback = () => {
    if (!resolvedAudioUrl) return;
    if (isPlaying) {
      audioPlayer.pause();
      return;
    }
    void audioPlayer.play(resolvedAudioUrl);
  };

  if (!prompt && !definition && !audioPath) return null;

  const waveformFile = audioFile || (audioPath ? { path: audioPath } : null);

  return (
    <Box
      data-testid="audio-prompt-panel"
      sx={{
        width: "100%",
        borderTop: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
        bgcolor: "action.selected",
        overflow: "hidden",
      }}
    >
      {(prompt || definition) && (
        <Box sx={{ px: 1.5, py: 1 }}>
          {prompt && (
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ fontWeight: 700, lineHeight: 1.4 }}
            >
              {prompt}
            </Typography>
          )}
          {definition && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: prompt ? 0.25 : 0, lineHeight: 1.4 }}
            >
              {definition}
            </Typography>
          )}
        </Box>
      )}

      {waveformFile && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: PROMPT_WAVEFORM_HEIGHT,
            borderTop: prompt || definition ? "1px solid" : "none",
            borderColor: "divider",
            overflow: "hidden",
            "& canvas": {
              border: "0 !important",
              borderRadius: "0 !important",
              width: "100% !important",
              height: `${PROMPT_WAVEFORM_HEIGHT}px !important`,
            },
          }}
        >
          <StaticWaveform
            file={waveformFile}
            waveformData={audioFile?.waveformData as number[]}
            width={width}
            height={PROMPT_WAVEFORM_HEIGHT}
          />
          <ButtonBase
            aria-label={isPlaying ? "Pause prompt audio" : "Play prompt audio"}
            disabled={!resolvedAudioUrl}
            onClick={togglePlayback}
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              color: "primary.contrastText",
              bgcolor: "transparent",
              "&:hover": { bgcolor: "action.hover" },
              "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
            }}
          >
            <Box
              component="span"
              sx={{
                display: "grid",
                placeItems: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "primary.main",
                boxShadow: 2,
              }}
            >
              {isPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
            </Box>
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}
