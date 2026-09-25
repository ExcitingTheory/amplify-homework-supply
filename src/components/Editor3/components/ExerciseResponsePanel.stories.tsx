import type { Meta, StoryObj } from "@storybook/react-vite";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import ExerciseResponsePanel from "./ExerciseResponsePanel";
import StaticWaveform from "./StaticWaveform";
import { LEARNER_EXERCISE_WAVEFORM_PRESET } from "../../../utils/waveformDefaults";

const APP_WAVEFORM_DATA = Array.from(
  { length: LEARNER_EXERCISE_WAVEFORM_PRESET.sampleCount },
  (_, index) => {
    const envelope =
      0.25 +
      0.75 *
        Math.sin(
          (index / (LEARNER_EXERCISE_WAVEFORM_PRESET.sampleCount - 1)) *
            Math.PI,
        );
    const detail = 0.35 + 0.65 * Math.abs(Math.sin(index * 0.17));
    return envelope * detail;
  },
);

const meta = {
  title: "Editor 3/Components/Exercise Response Panel",
  component: ExerciseResponsePanel,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ExerciseResponsePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextImmediateSubmit: Story = {
  render: () => (
    <ExerciseResponsePanel onSubmit={() => undefined} showCancel={false}>
      <Box
        aria-label="Written answer"
        component="textarea"
        placeholder="Write your answer"
        sx={{
          display: "block",
          width: "100%",
          minHeight: 96,
          p: 1.5,
          resize: "vertical",
          border: 0,
          outline: 0,
          boxSizing: "border-box",
          bgcolor: "transparent",
          color: "text.primary",
          font: "inherit",
        }}
      />
    </ExerciseResponsePanel>
  ),
};

export const SketchPending: Story = {
  render: () => (
    <ExerciseResponsePanel
      centerControls={
        <Typography variant="caption" color="text.secondary">
          Drawing ready to submit
        </Typography>
      }
      countdown={7}
      onCancel={() => undefined}
      onSubmit={() => undefined}
      sx={{ width: 640 }}
    >
      <Box
        sx={{
          height: 240,
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <Typography color="text.secondary">Sketch surface</Typography>
      </Box>
    </ExerciseResponsePanel>
  ),
};

export const AudioPending: Story = {
  render: () => (
    <ExerciseResponsePanel
      centerControls={
        <Box sx={{ display: "flex", alignItems: "center", width: 280 }}>
          <IconButton aria-label="Play recording" size="small">
            <PlayArrowRoundedIcon />
          </IconButton>
          <Slider aria-label="Recording position" size="small" value={35} />
        </Box>
      }
      countdown={4}
      onCancel={() => undefined}
      onSubmit={() => undefined}
      sx={{ width: LEARNER_EXERCISE_WAVEFORM_PRESET.width }}
    >
      <StaticWaveform
        width={LEARNER_EXERCISE_WAVEFORM_PRESET.width}
        height={LEARNER_EXERCISE_WAVEFORM_PRESET.height}
        waveformData={APP_WAVEFORM_DATA}
        showLoading={false}
      />
    </ExerciseResponsePanel>
  ),
};
