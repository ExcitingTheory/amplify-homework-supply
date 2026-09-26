import * as React from "react";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import ArrowDropDownOutlinedIcon from "@mui/icons-material/ArrowDropDownOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import { Box, Button, ListItemIcon, Menu, MenuItem } from "@mui/material";

export type AudioAnswerInputMode = "text" | "sketch" | "audio";
export type AudioAnswerPromptSource =
  "byWord" | "byDefinition" | "byQuestion" | "byAnswer" | "byImage";

export interface AudioAnswerMediaLabels {
  answer: string;
  audio: string;
  cancel: string;
  correctAnswer: string;
  playlist: string;
  sketch: string;
  submit: string;
  text: string;
}

export interface AudioAnswerMediaProps {
  allowedInputs?: AudioAnswerInputMode[];
  audioInput: React.ReactNode;
  answerAudioPlaying?: boolean;
  correctAnswer?: React.ReactNode;
  defaultInput?: AudioAnswerInputMode;
  description?: React.ReactNode;
  graded?: boolean;
  labels?: Partial<AudioAnswerMediaLabels>;
  media: React.ReactElement<{
    externalPlaybackActive?: boolean;
    onHelp?: () => void;
    onPlaylistOpenChange?: (open: boolean) => void;
    playlistAdjacentControls?: React.ReactNode;
    playlistOpen?: boolean;
    promptDescription?: React.ReactNode;
    promptThumbnail?: React.ReactNode;
    promptTitle?: React.ReactNode;
    recordingMode?: "none" | "audio";
    showTakeSubmissionControls?: boolean;
  }>;
  onCancel?: () => void;
  onHelp?: () => void;
  onSubmit?: () => void;
  ownedFooterInputs?: AudioAnswerInputMode[];
  promptSource: AudioAnswerPromptSource;
  sketchInput: React.ReactNode;
  submitDisabled?: boolean;
  textInput: React.ReactNode;
  title: React.ReactNode;
}

const DEFAULT_LABELS: AudioAnswerMediaLabels = {
  answer: "Answer",
  audio: "Speak Answer",
  cancel: "Cancel",
  correctAnswer: "Correct answer",
  playlist: "Playlist",
  sketch: "Sketch Answer",
  submit: "Submit",
  text: "Type Answer",
};

const INPUT_ICONS: Record<AudioAnswerInputMode, React.ReactNode> = {
  text: <KeyboardOutlinedIcon fontSize="small" />,
  sketch: <DrawOutlinedIcon fontSize="small" />,
  audio: <RecordVoiceOverOutlinedIcon fontSize="small" />,
};

export default function AudioAnswerMedia({
  allowedInputs = ["text", "sketch", "audio"],
  answerAudioPlaying = false,
  audioInput,
  correctAnswer,
  defaultInput = "text",
  description,
  graded = false,
  labels: labelOverrides,
  media,
  onCancel,
  onHelp,
  onSubmit,
  ownedFooterInputs = [],
  promptSource,
  sketchInput,
  submitDisabled = false,
  textInput,
  title,
}: AudioAnswerMediaProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const initialInput = allowedInputs.includes(defaultInput)
    ? defaultInput
    : allowedInputs[0];
  const [activeInput, setActiveInput] =
    React.useState<AudioAnswerInputMode>(initialInput);
  const [answerMenuAnchor, setAnswerMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [answerOpen, setAnswerOpen] = React.useState(true);
  const inputContent = {
    text: textInput,
    sketch: sketchInput,
    audio: audioInput,
  }[activeInput];
  const showFooter = !ownedFooterInputs.includes(activeInput);
  const answerControl = (
    <>
      <Button
        aria-label={labels[activeInput]}
        aria-haspopup="menu"
        aria-expanded={Boolean(answerMenuAnchor)}
        endIcon={<ArrowDropDownOutlinedIcon />}
        onClick={(event) => {
          setAnswerOpen(true);
          setAnswerMenuAnchor(event.currentTarget);
        }}
        size="small"
        startIcon={INPUT_ICONS[activeInput]}
        variant="outlined"
        sx={{
          minWidth: { xs: 28, sm: 0 },
          width: { xs: 28, sm: "auto" },
          height: { xs: 28, sm: 30 },
          px: { xs: 0, sm: 0.75 },
          "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
          "& .MuiButton-endIcon": { display: { xs: "none", sm: "inherit" } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {labels[activeInput]}
        </Box>
      </Button>
      <Menu
        anchorEl={answerMenuAnchor}
        open={Boolean(answerMenuAnchor)}
        onClose={() => setAnswerMenuAnchor(null)}
      >
        {allowedInputs.map((input) => (
          <MenuItem
            key={input}
            selected={input === activeInput}
            onClick={() => {
              setActiveInput(input);
              setAnswerMenuAnchor(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              {INPUT_ICONS[input]}
            </ListItemIcon>
            {labels[input]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
  const mediaWithAnswerControl = React.cloneElement(media, {
    externalPlaybackActive: answerAudioPlaying,
    onHelp,
    playlistOpen: !answerOpen,
    onPlaylistOpenChange: (open: boolean) => setAnswerOpen(!open),
    playlistAdjacentControls: answerControl,
    promptDescription:
      graded && correctAnswer ? (
        <>
          {labels.correctAnswer}: {correctAnswer}
        </>
      ) : (
        description
      ),
    promptThumbnail: <RecordVoiceOverOutlinedIcon />,
    promptTitle: title,
    recordingMode:
      media.props.recordingMode ??
      (allowedInputs.includes("audio") ? "audio" : "none"),
    showTakeSubmissionControls: false,
  });

  return (
    <Box data-prompt-source={promptSource} sx={{ width: "min(100%, 40rem)" }}>
      <Box
        aria-label={typeof title === "string" ? title : undefined}
        sx={{
          overflow: "hidden",
          "& > *": {
            width: "100% !important",
            borderBottomLeftRadius: "0 !important",
            borderBottomRightRadius: "0 !important",
          },
        }}
      >
        {mediaWithAnswerControl}
      </Box>

      <Box
        sx={{
          overflow: "hidden",
          border: "1px solid",
          borderTop: 0,
          borderColor: "divider",
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        {answerOpen && (
          <Box
            sx={{
              height: 180,
              overflow: "auto",
              borderTop: "1px solid",
              borderColor: "divider",
              "& > *": {
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              },
            }}
          >
            {inputContent}
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent:
              answerOpen && activeInput === "sketch"
                ? "space-between"
                : "flex-end",
            alignItems: "center",
            minHeight: 48,
            px: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          {answerOpen && showFooter && (
            <>
              {activeInput === "sketch" && (
                <Button onClick={onCancel} size="small">
                  {labels.cancel}
                </Button>
              )}
              <Button
                disabled={submitDisabled}
                onClick={onSubmit}
                size="small"
                variant="contained"
              >
                {labels.submit}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
