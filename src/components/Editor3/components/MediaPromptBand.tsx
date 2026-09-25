import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import MovieIcon from "@mui/icons-material/Movie";

export interface MediaPromptBandProps {
  children?: ReactNode;
  description?: ReactNode;
  elapsedTime: string;
  isVideo?: boolean;
  remainingTime: string;
  title: ReactNode;
}

export default function MediaPromptBand({
  children,
  description,
  elapsedTime,
  isVideo = false,
  remainingTime,
  title,
}: MediaPromptBandProps) {
  return (
    <Box
      data-testid="media-prompt-band"
      sx={{
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {children && <Box data-testid="media-prompt-body">{children}</Box>}

      <Box
        aria-label="Media timecodes"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 0.5,
          mt: -0.5,
          minHeight: 12,
          bgcolor: "background.paper",
          color: "text.secondary",
          fontFamily: "monospace",
          fontSize: "0.5rem",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        <span>{elapsedTime}</span>
        <span>{remainingTime}</span>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 56,
          maxHeight: 64,
          px: 1.5,
          py: 0.75,
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden={true}
          sx={{
            flex: "0 0 40px",
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
            color: "text.secondary",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {isVideo ? <MovieIcon /> : <AudiotrackIcon />}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            variant="body2"
            color="text.primary"
            noWrap
            sx={{ m: 0, fontWeight: 700, lineHeight: 1.35 }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
