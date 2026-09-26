import type { ReactNode, RefObject } from "react";
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StaticWaveform from "./StaticWaveform";

export interface AudioTakeSummary {
  createdAt: number;
  duration: number;
  id: string;
  waveformData?: number[] | null;
}

export interface AudioTakePlaylistProps {
  backgroundVisualizer?: ReactNode;
  compact?: boolean;
  onDelete?: (id: string) => void;
  onSelect: (id: string) => void;
  playbackProgress?: number;
  playbackTakeId?: string | null;
  playbackActive?: boolean;
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
  backgroundVisualizer,
  compact = false,
  onDelete,
  onSelect,
  playbackProgress = 0,
  playbackTakeId,
  playbackActive = false,
  recording = false,
  recordingCanvasRef,
  selectedTakeId,
  takes,
}: AudioTakePlaylistProps) {
  if (takes.length === 0 && !recording) return null;

  const rowMinHeight = compact ? 36 : 64;

  return (
    <Box
      data-testid="audio-take-playlist"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <List
        dense
        disablePadding
        aria-label="Recorded takes"
        sx={{ position: "relative", zIndex: 1 }}
      >
        {recording && compact && (
          <Box
            component="li"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: rowMinHeight,
              px: 1.5,
              py: 0,
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-action-selected) 88%, transparent)",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <ListItemText
              primary="Recording…"
              primaryTypographyProps={{ noWrap: true, variant: "body2" }}
            />
          </Box>
        )}
        {recording && !compact && (
          <Box
            component="li"
            sx={{
              position: "relative",
              width: "100%",
              height: 64,
              minHeight: 64,
              p: 0,
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-action-selected) 88%, transparent)",
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
              position: "relative",
              minHeight: rowMinHeight,
              gap: 1,
              py: 0,
              pr: 0,
              overflow: "hidden",
              bgcolor:
                (index + (recording ? 1 : 0)) % 2 === 0
                  ? "color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent)"
                  : "color-mix(in srgb, var(--mui-palette-action-hover) 88%, transparent)",
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: 0 },
              "&.Mui-selected": {
                bgcolor:
                  "color-mix(in srgb, var(--mui-palette-action-selected) 90%, transparent)",
              },
            }}
          >
            <Radio
              checked={take.id === selectedTakeId}
              size="small"
              tabIndex={-1}
              inputProps={{ "aria-hidden": true }}
              sx={{ position: "relative", zIndex: 1 }}
            />
            <ListItemText
              primary={
                compact
                  ? `Take ${index + 1} · ${formatDuration(take.duration)} · ${new Date(
                      take.createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : `Take ${index + 1}`
              }
              secondary={
                compact
                  ? undefined
                  : `${formatDuration(take.duration)} · ${new Date(
                      take.createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
              }
              primaryTypographyProps={
                compact ? { noWrap: true, variant: "body2" } : undefined
              }
              sx={{ position: "relative", zIndex: 1 }}
            />
            {onDelete && (
              <Tooltip title="Delete take">
                <IconButton
                  aria-label="Delete take"
                  size="small"
                  sx={{ position: "relative", zIndex: 1 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(take.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!compact &&
              (take.waveformData ||
                (take.id === playbackTakeId && backgroundVisualizer)) && (
                <Box
                  aria-hidden={true}
                  sx={{
                    position: "relative",
                    alignSelf: "stretch",
                    flex: { xs: "0 0 120px", sm: "0 0 180px" },
                    width: { xs: 120, sm: 180 },
                    height: 64,
                    overflow: "hidden",
                    pointerEvents: "none",
                    "& > div, & canvas": {
                      width: "100% !important",
                      height: "100% !important",
                      borderRadius: "0 !important",
                    },
                  }}
                >
                  {take.waveformData && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: 1,
                      }}
                    >
                      <StaticWaveform
                        waveformData={take.waveformData}
                        width={180}
                        height={64}
                        showLoading={false}
                        transparentBackground
                      />
                    </Box>
                  )}
                  {take.id === playbackTakeId && backgroundVisualizer && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: playbackActive ? 1 : 0,
                        transform: playbackActive ? "scaleY(1)" : "scaleY(0)",
                        transformOrigin: "center",
                        transition:
                          "opacity 240ms cubic-bezier(0.77, 0, 0.175, 1), transform 240ms cubic-bezier(0.77, 0, 0.175, 1)",
                      }}
                    >
                      {backgroundVisualizer}
                    </Box>
                  )}
                  {take.id === playbackTakeId && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        bgcolor: "primary.main",
                        opacity: 0.2,
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
