import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Typography } from "@mui/material";
import AudioAnswerMedia, {
  type AudioAnswerInputMode,
  type AudioAnswerPromptSource,
} from "./AudioAnswerMedia";
import AudioTakePlaylist from "./AudioTakePlaylist";
import ImagePromptMedia from "./ImagePromptMedia";
import MediaPlayerComponent from "./MediaPlayerComponent";
import PlaybackWaveformVisualizer from "./PlaybackWaveformVisualizer";
import UnitContext from "../../../context/unitContext";

const WAVEFORM = Array.from(
  { length: 600 },
  (_, index) =>
    Math.abs(Math.sin(index * 0.08)) *
    (0.3 + 0.7 * Math.sin((index / 599) * Math.PI)),
);

const TAKES = [
  { id: "take-1", duration: 4.2, createdAt: 1_000, waveformData: WAVEFORM },
  { id: "take-2", duration: 5.7, createdAt: 2_000, waveformData: WAVEFORM },
];

const SOURCE_CONTENT: Record<
  AudioAnswerPromptSource,
  { title: string; description: string; correctAnswer: string }
> = {
  byWord: {
    title: "serendipity",
    description: "Speak or enter the definition",
    correctAnswer: "A fortunate discovery made by chance",
  },
  byDefinition: {
    title: "A domesticated animal that purrs",
    description: "Speak or enter the matching word",
    correctAnswer: "cat",
  },
  byQuestion: {
    title: "What is the capital of France?",
    description: "Listen to the prompt, then answer",
    correctAnswer: "Paris",
  },
  byAnswer: {
    title: "Paris",
    description: "Create the matching question",
    correctAnswer: "What is the capital of France?",
  },
  byImage: {
    title: "What do you see?",
    description: "Look at the image, then answer",
    correctAnswer: "A herd of animals",
  },
};

const IMAGE_PROMPT_URL = "/story-mocks/animals-10008941_1280.jpg";

function AudioAnswerDemo({
  promptSource,
  allowedInputs,
  defaultInput,
  graded = false,
}: {
  promptSource: AudioAnswerPromptSource;
  allowedInputs?: AudioAnswerInputMode[];
  defaultInput?: AudioAnswerInputMode;
  graded?: boolean;
}) {
  const content = SOURCE_CONTENT[promptSource];
  const [answer, setAnswer] = React.useState("");
  const [selectedTakeId, setSelectedTakeId] = React.useState(TAKES[0].id);
  const [takeAudioElement, setTakeAudioElement] =
    React.useState<HTMLAudioElement | null>(null);
  const [takePlaying, setTakePlaying] = React.useState(false);
  const [takeProgress, setTakeProgress] = React.useState(0);
  const selectTake = React.useCallback(
    (takeId: string) => {
      setSelectedTakeId(takeId);
      setTakeProgress(0);
      if (!takeAudioElement) return;
      takeAudioElement.currentTime = 0;
      const mediaPlay = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        "play",
      )?.value;
      if (typeof mediaPlay !== "function") return;
      const playResult = Reflect.apply(mediaPlay, takeAudioElement, []);
      if (playResult?.catch) void playResult.catch(() => undefined);
    },
    [takeAudioElement],
  );
  const mediaContext = React.useMemo(
    () => ({
      unit: { id: "audio-answer-story-unit" },
      files: {
        "audio-answer-prompt": {
          id: "audio-answer-prompt",
          name: content.title,
          path: "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          mimeType: "audio/mpeg",
          size: 52_000,
        },
      },
      questionBank: {},
    }),
    [content.title],
  );
  return (
    <UnitContext.Provider value={mediaContext}>
      <AudioAnswerMedia
        allowedInputs={allowedInputs}
        defaultInput={defaultInput}
        answerAudioPlaying={takePlaying}
        promptSource={promptSource}
        title={content.title}
        description={content.description}
        graded={graded}
        correctAnswer={content.correctAnswer}
        media={
          promptSource === "byImage" ? (
            <ImagePromptMedia
              imageUrl={IMAGE_PROMPT_URL}
              altText={content.title}
            />
          ) : (
            <MediaPlayerComponent
              fileIDs={["audio-answer-prompt"]}
              nodeKey="audio-answer-media"
            />
          )
        }
        textInput={
          <Box
            aria-label="Answer"
            component="textarea"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Enter your answer"
            sx={{
              display: "block",
              height: "100%",
              minHeight: 180,
              p: 1.5,
              resize: "vertical",
              border: 0,
              borderRadius: 0,
              outline: 0,
              bgcolor: "transparent",
              color: "text.primary",
              font: "inherit",
              "&:focus": { outline: 0 },
            }}
          />
        }
        sketchInput={
          <Box
            sx={{
              minHeight: 180,
              display: "grid",
              placeItems: "center",
              bgcolor: "background.default",
            }}
          >
            <Typography color="text.secondary">SketchPad</Typography>
          </Box>
        }
        audioInput={
          <Box sx={{ height: "100%", overflow: "auto" }}>
            <AudioTakePlaylist
              backgroundVisualizer={
                takeAudioElement ? (
                  <PlaybackWaveformVisualizer mediaElement={takeAudioElement} />
                ) : undefined
              }
              takes={TAKES}
              selectedTakeId={selectedTakeId}
              playbackTakeId={selectedTakeId}
              playbackProgress={takeProgress}
              playbackActive={takePlaying}
              onSelect={selectTake}
            />
            <audio
              ref={setTakeAudioElement}
              src="/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3"
              onPlay={() => setTakePlaying(true)}
              onPause={() => setTakePlaying(false)}
              onEnded={() => {
                setTakePlaying(false);
                setTakeProgress(1);
              }}
              onTimeUpdate={(event) => {
                const audio = event.currentTarget;
                setTakeProgress(
                  audio.duration > 0 ? audio.currentTime / audio.duration : 0,
                );
              }}
              hidden
            />
          </Box>
        }
        onCancel={() => undefined}
        onHelp={() => undefined}
        onSubmit={() => undefined}
      />
    </UnitContext.Provider>
  );
}

const meta = {
  title: "✏️ Lesson Editor/Components/Audio Answer Media",
  component: AudioAnswerMedia,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof AudioAnswerMedia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByWord: Story = {
  render: () => <AudioAnswerDemo promptSource="byWord" />,
};

export const ByDefinition: Story = {
  render: () => <AudioAnswerDemo promptSource="byDefinition" />,
};

export const ByQuestion: Story = {
  render: () => <AudioAnswerDemo promptSource="byQuestion" />,
};

export const ByAnswerGraded: Story = {
  render: () => <AudioAnswerDemo promptSource="byAnswer" graded />,
};

export const ImageOutputAudio: Story = {
  render: () => (
    <AudioAnswerDemo
      promptSource="byImage"
      allowedInputs={["audio"]}
      defaultInput="audio"
    />
  ),
};

export const ImageInputDrawing: Story = {
  render: () => (
    <AudioAnswerDemo
      promptSource="byImage"
      allowedInputs={["sketch"]}
      defaultInput="sketch"
    />
  ),
};

export const ImageInputText: Story = {
  render: () => (
    <AudioAnswerDemo
      promptSource="byImage"
      allowedInputs={["text"]}
      defaultInput="text"
    />
  ),
};
