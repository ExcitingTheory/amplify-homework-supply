import type { RefObject } from "react";
import { Box, List, ListItemButton, ListItemText, Radio } from "@mui/material";
import StaticWaveform from "./StaticWaveform";

export interface AudioTakeSummary {
  createdAt: number;
  duration: number;
  id: string;
  waveformData?: number[] | null;
}

export interface AudioTakePlaylistProps {
  onSelect: (id: string) => void;
  playbackProgress?: number;
  playbackTakeId?: string | null;
  recording?: boolean;
  recordingCanvasRef?: RefObject<HTMLCanvasElement | null>;
  selectedTakeId?: string | null;
  takes: AudioTakeSummary[];
}

function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(value / 60);
  const remainingSeconds = value % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function AudioTakePlaylist({
  onSelect,
  playbackProgress = 0,
  playbackTakeId,
  recording = false,
  recordingCanvasRef,
  selectedTakeId,
  takes,
}: AudioTakePlaylistProps) {
  if (takes.length === 0 && !recording) return null;

  return (
    <Box
      data-testid="audio-take-playlist"
      sx={{ borderTop: "1px solid", borderColor: "divider" }}
    >
      <List dense disablePadding aria-label="Recorded takes">
        {recording && (
          <Box
            component="li"
            sx={{
              position: "relative",
              width: "100%",
              height: 64,
              minHeight: 64,
              p: 0,
              bgcolor: "action.selected",
              borderBottom: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", inset: 0 }}>
              <canvas
                ref={recordingCanvasRef}
                width={600}
                height={64}
                style={{ display: "block", width: "100%", height: "64px" }}
              />
            </Box>
          </Box>
        )}
        {takes.map((take, index) => (
          <ListItemButton
            key={take.id}
            selected={take.id === selectedTakeId}
            onClick={() => onSelect(take.id)}
            sx={{
              minHeight: 64,
              gap: 1,
              bgcolor:
                (index + (recording ? 1 : 0)) % 2 === 0
                  ? "background.paper"
                  : "action.hover",
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: 0 },
              "&.Mui-selected": { bgcolor: "action.selected" },
            }}
          >
            <Radio
              checked={take.id === selectedTakeId}
              size="small"
              tabIndex={-1}
              inputProps={{ "aria-hidden": true }}
            />
            <ListItemText
              primary={`Take ${index + 1}`}
              secondary={`${formatDuration(take.duration)} · ${new Date(
                take.createdAt,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
            />
            {take.waveformData && (
              <Box
                sx={{
                  position: "relative",
                  flex: "0 0 auto",
                  overflow: "hidden",
                }}
              >
                <StaticWaveform
                  waveformData={take.waveformData}
                  width={180}
                  height={36}
                  showLoading={false}
                />
                {take.id === playbackTakeId && (
                  <Box
                    component="span"
                    aria-hidden={true}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "primary.main",
                      opacity: 0.2,
                      pointerEvents: "none",
                      transform: `scaleX(${Math.max(
                        0,
                        Math.min(1, playbackProgress),
                      )})`,
                      transformOrigin: "left",
                    }}
                  />
                )}
              </Box>
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
