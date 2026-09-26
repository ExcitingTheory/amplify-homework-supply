import * as React from "react";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import getCachedUrl from "../../../utils/getCachedUrl";
import { AUDIO_WAVEFORM_PLAYER_DEFAULTS } from "../../../utils/waveformDefaults";
import MediaPromptBand from "./MediaPromptBand";

export interface ImagePromptFile {
  key?: string;
  path?: string;
}

export interface ImagePromptMediaProps {
  altText?: string;
  externalPlaybackActive?: boolean;
  imageFile?: ImagePromptFile | null;
  imageUrl?: string | null;
  onHelp?: () => void;
  onPlaylistOpenChange?: (open: boolean) => void;
  playlistAdjacentControls?: React.ReactNode;
  playlistOpen?: boolean;
  promptDescription?: React.ReactNode;
  promptThumbnail?: React.ReactNode;
  promptTitle?: React.ReactNode;
  recordingMode?: "none" | "audio";
  showTakeSubmissionControls?: boolean;
}

const VISUALIZATION_HEIGHT = AUDIO_WAVEFORM_PLAYER_DEFAULTS.height + 16;

// Mirrors MediaPlayerComponent's chrome (visualization box, MediaPromptBand,
// playlist/answer-control footer) with a static image in place of the waveform.
export default function ImagePromptMedia({
  altText,
  imageFile,
  imageUrl,
  onHelp,
  onPlaylistOpenChange,
  playlistAdjacentControls,
  playlistOpen = true,
  promptDescription,
  promptThumbnail,
  promptTitle,
}: ImagePromptMediaProps) {
  const imagePath = imageUrl || imageFile?.path || imageFile?.key || null;
  const [resolvedImageUrl, setResolvedImageUrl] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!imagePath) {
      setResolvedImageUrl(null);
      return;
    }

    let active = true;
    void getCachedUrl(imagePath)
      .then((url) => {
        if (active) setResolvedImageUrl(url || null);
      })
      .catch((error) => {
        console.warn(
          "[ImagePromptMedia] Unable to resolve prompt image:",
          error,
        );
        if (active) setResolvedImageUrl(null);
      });

    return () => {
      active = false;
    };
  }, [imagePath]);

  return (
    <Box
      sx={{
        width: "min(100%, 40rem)",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: VISUALIZATION_HEIGHT,
          minHeight: VISUALIZATION_HEIGHT,
          maxHeight: VISUALIZATION_HEIGHT,
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        {resolvedImageUrl ? (
          <Box
            component="img"
            src={resolvedImageUrl}
            alt={altText || ""}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="caption">No image</Typography>
          </Box>
        )}

        {onHelp && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              color: "rgba(255, 255, 255, 0.92)",
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
            }}
          >
            <Tooltip title="Help">
              <IconButton
                aria-label="Help"
                onClick={onHelp}
                size="small"
                sx={{ color: "inherit", opacity: 0.72 }}
              >
                <Typography component="span" fontWeight={700}>
                  ?
                </Typography>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <MediaPromptBand
        description={promptDescription}
        elapsedTime=""
        remainingTime=""
        isVideo={false}
        thumbnail={promptThumbnail}
        title={promptTitle}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          minHeight: 40,
          px: { xs: 0.5, sm: 0.75 },
          py: 0.25,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tooltip title="Playlist">
          <span>
            <IconButton
              aria-label="Playlist"
              aria-expanded={playlistOpen}
              onClick={() => onPlaylistOpenChange?.(!playlistOpen)}
              size="small"
              sx={{ width: { xs: 28, sm: 30 }, height: { xs: 28, sm: 30 } }}
            >
              <PlaylistPlayIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        {playlistAdjacentControls}
      </Box>
    </Box>
  );
}
