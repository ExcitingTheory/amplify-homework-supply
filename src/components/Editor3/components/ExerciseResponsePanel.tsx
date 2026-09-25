import { forwardRef, type ReactNode } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  type BoxProps,
} from "@mui/material";

interface ExerciseResponsePanelProps extends Omit<
  BoxProps,
  "children" | "onSubmit"
> {
  children: ReactNode;
  centerControls?: ReactNode;
  countdown?: number | null;
  countdownDuration?: number;
  cancelDisabled?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  showActionRow?: boolean;
  showCancel?: boolean;
  showSubmit?: boolean;
  submitDisabled?: boolean;
  submitIcon?: ReactNode;
  submitLabel?: string;
}

const ExerciseResponsePanel = forwardRef<
  HTMLDivElement,
  ExerciseResponsePanelProps
>(function ExerciseResponsePanel(
  {
    children,
    centerControls,
    countdown = null,
    countdownDuration = 10,
    cancelDisabled = countdown === null,
    cancelLabel = "Cancel",
    onCancel,
    onSubmit,
    showActionRow = true,
    showCancel = true,
    showSubmit = true,
    submitDisabled = false,
    submitIcon = <ArrowForwardRoundedIcon />,
    submitLabel = "Submit",
    sx,
    ...boxProps
  },
  ref,
) {
  const progress =
    countdown === null
      ? 0
      : Math.max(0, Math.min(100, (countdown / countdownDuration) * 100));

  return (
    <Box
      {...boxProps}
      ref={ref}
      sx={[
        {
          width: "100%",
          maxWidth: "50rem",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          transition: "outline-color 120ms ease",
          "&:focus-within": {
            outline: "3px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      {showActionRow && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "center",
            gap: 1,
            minHeight: 56,
            px: 1.5,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Box sx={{ justifySelf: "start" }}>
            {showCancel && (
              <Button
                aria-label="Cancel submission"
                disabled={cancelDisabled}
                onClick={onCancel}
                size="small"
                variant="text"
                endIcon={
                  <Box
                    aria-live="polite"
                    sx={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                    }}
                  >
                    <CircularProgress
                      aria-hidden="true"
                      size={24}
                      thickness={4}
                      value={progress}
                      variant="determinate"
                    />
                    {countdown !== null && (
                      <Typography
                        component="span"
                        sx={{
                          position: "absolute",
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {countdown}
                      </Typography>
                    )}
                  </Box>
                }
              >
                {cancelLabel}
              </Button>
            )}
          </Box>
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {centerControls}
          </Box>
          <Box sx={{ justifySelf: "end" }}>
            {showSubmit && (
              <Button
                disabled={submitDisabled}
                endIcon={submitIcon}
                onClick={onSubmit}
                size="small"
                variant="contained"
              >
                {submitLabel}
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default ExerciseResponsePanel;
