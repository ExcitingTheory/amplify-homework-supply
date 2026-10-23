import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import UnitContext from "../../../context/unitContext";
import type { UnitContextValue } from "../../../context/unitContext";
import CallResponsePlayer from "./CallResponsePlayer";
import type { CallResponseScript } from "../../../utils/callResponse/buildCallResponseScript";

const script: CallResponseScript = {
  cardKey: "trump-i-the-magus",
  title: "The Magus",
  voices: { narrator: "alloy", answer: "nova" },
  cues: [
    {
      id: "magus-number-prompt",
      kind: "prompt",
      text: "The Magus. Number?",
    },
    {
      id: "magus-number-response",
      kind: "response",
      expected: "I",
      accept: ["one", "1"],
      field: "number",
      minMs: 2500,
      maxMs: 8000,
      silenceEndMs: 700,
    },
    {
      id: "magus-number-answer",
      kind: "answer",
      text: "Number: I.",
    },
  ],
};

const unitContext = {
  unit: { id: "call-response-story-unit" },
  name: "Call response story",
  rubric: [],
  grade: { data: {} },
  recentGrades: [],
  dictionary: {},
  files: {},
  questionBank: {},
  playlistUrls: {},
  description: "",
  editorStateRef: { current: null },
  editorSelectionRef: { current: null },
  editorRef: { current: null },
  versionRef: { current: 0 },
  unitRef: { current: null },
  finishedQuestions: 0,
  showUnitComplete: false,
  handleBeforeUnload: () => undefined,
  setShowUnitComplete: () => undefined,
  setFinishedQuestions: () => undefined,
  saveName: () => undefined,
  saveDescription: () => undefined,
  handleDelete: () => undefined,
  handleStatusChange: () => undefined,
  saveEditorContent: () => undefined,
  saveGrade: () => undefined,
  createGrade: () => undefined,
  isSaving: false,
  beginSaving: () => undefined,
  endSaving: () => undefined,
  session: { username: "student@example.com" },
  workbook: null,
  workbookStats: {
    completion: 0,
    accuracy: 0,
    totalBlocks: 0,
    completeBlocks: 0,
  },
  workbookEnabled: false,
  assignmentWindowReady: false,
} satisfies UnitContextValue;

function replaceProperty(
  target: object,
  property: PropertyKey,
  value: unknown,
): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(target, property);
  Object.defineProperty(target, property, {
    configurable: true,
    writable: true,
    value,
  });
  return () => {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  };
}

class FakeAudioContext {
  sampleRate = 8000;
  destination = {};
  async resume() {}
  async close() {}

  createBuffer(_channels: number, length: number) {
    return { length, copyToChannel() {} };
  }

  createGain() {
    return { gain: { value: 1 }, connect() {} };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
    };
  }

  createMediaStreamSource() {
    return { connect() {}, disconnect() {} };
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData(data: Uint8Array) {
        data.fill(0);
      },
      getByteTimeDomainData(data: Uint8Array) {
        data.fill(128);
      },
    };
  }
}

class FakeMediaRecorder {
  static isTypeSupported() {
    return false;
  }

  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  private listeners = new Map<string, EventListener[]>();

  constructor(_stream: MediaStream) {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event);
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback]);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    const dataEvent = new Event("dataavailable");
    Object.defineProperty(dataEvent, "data", { value: new Blob([]) });
    this.listeners.get("dataavailable")?.forEach((listener) => listener(dataEvent));
    this.listeners.get("stop")?.forEach((listener) => listener(new Event("stop")));
  }
}

function textSlide(text: string) {
  return { type: "text" as const, text };
}

const slidedScript: CallResponseScript = {
  ...script,
  cues: script.cues.map((cue) => ({ ...cue, slide: textSlide("The Magus") })),
};

function lexicalState(children: unknown[]) {
  return {
    root: {
      type: "root",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children,
    },
  };
}

const paragraphState = lexicalState([
  {
    type: "paragraph",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [
      {
        type: "text",
        version: 1,
        text: "Mercury rules Beth",
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  },
]);

const gradedQuizState = lexicalState([
  {
    type: "quiz",
    version: 1,
    data: [
      { id: "choice-1", answer: "Mercury", correct: true },
      { id: "choice-2", answer: "Venus", correct: false },
    ],
  },
]);

function withSlide(
  slide: NonNullable<CallResponseScript["cues"][number]["slide"]>,
  responseOnly = false,
): CallResponseScript {
  return {
    ...script,
    cues: script.cues.map((cue) =>
      responseOnly && cue.kind !== "response" ? cue : { ...cue, slide },
    ),
  };
}

async function runWithFakeMic(
  getUserMedia: () => Promise<MediaStream>,
  play: () => Promise<void>,
) {
  const restore: Array<() => void> = [];
  restore.push(
    replaceProperty(window, "AudioContext", FakeAudioContext),
    replaceProperty(globalThis, "MediaRecorder", FakeMediaRecorder),
    replaceProperty(window, "speechSynthesis", {
      speak: () => undefined,
      cancel: () => undefined,
    }),
    replaceProperty(navigator.mediaDevices, "getUserMedia", getUserMedia),
  );
  try {
    await play();
  } finally {
    restore.reverse().forEach((restoreProperty) => restoreProperty());
  }
}

const fakeMicStream = async () =>
  ({ getTracks: () => [{ stop: () => undefined }] }) as unknown as MediaStream;

function ThreeCuePractice() {
  return (
    <UnitContext.Provider value={unitContext}>
      <CallResponsePlayer blockId="magus-card" script={script} />
    </UnitContext.Provider>
  );
}

const meta = {
  title: "✏️ Lesson Editor/Content Blocks/Call Response Player",
  component: CallResponsePlayer,
  parameters: { layout: "centered" },
  decorators: [
    (Story: React.ComponentType) => (
      <UnitContext.Provider value={unitContext}>
        <Story />
      </UnitContext.Provider>
    ),
  ],
} satisfies Meta<typeof CallResponsePlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { blockId: "magus-card", script },
};

export const ThreeCuePracticeStory: Story = {
  args: { blockId: "magus-card", script },
  render: () => <ThreeCuePractice />,
  play: async ({ canvasElement }) => {
    const restore: Array<() => void> = [];
    const fakeStream = {
      getTracks: () => [{ stop: () => undefined }],
    } as MediaStream;
    const fakeSpeech = { speak: () => undefined, cancel: () => undefined };
    restore.push(
      replaceProperty(window, "AudioContext", FakeAudioContext),
      replaceProperty(globalThis, "MediaRecorder", FakeMediaRecorder),
      replaceProperty(window, "speechSynthesis", fakeSpeech),
      replaceProperty(navigator.mediaDevices, "getUserMedia", async () => fakeStream),
    );

    try {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Continue" }),
      );
      await waitFor(() =>
        expect(
          canvas.getByRole("button", { name: "Finish response" }),
        ).toBeInTheDocument(),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Finish response" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Continue" }),
      );
      await waitFor(() =>
        expect(canvas.getByRole("status")).toHaveTextContent(
          "Call and response complete.",
        ),
      );
    } finally {
      restore.reverse().forEach((restoreProperty) => restoreProperty());
    }
  },
};

export const Arming: Story = {
  args: { blockId: "magus-card", script },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(
      () => new Promise<MediaStream>(() => undefined),
      async () => {
        const canvas = within(canvasElement);
        await userEvent.click(
          canvas.getByRole("button", { name: "Start call and response" }),
        );
        await expect(await canvas.findByRole("status")).toHaveTextContent(
          "Preparing microphone",
        );
      },
    );
  },
};

export const PromptWithTextSlide: Story = {
  args: { blockId: "magus-card", script: slidedScript },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(fakeMicStream, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await expect(await canvas.findByTestId("call-response-slide")).toHaveTextContent(
        "The Magus",
      );
      await expect(canvas.getByText("The Magus. Number?")).toBeInTheDocument();
      await expect(
        canvas.queryByRole("progressbar", { name: "Microphone activity" }),
      ).not.toBeInTheDocument();
    });
  },
};

export const ResponseWindow: Story = {
  args: { blockId: "magus-card", script: slidedScript },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(fakeMicStream, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Continue" }),
      );
      await expect(
        await canvas.findByText("Your response: number"),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("progressbar", { name: "Microphone activity" }),
      ).toBeInTheDocument();
      await expect(canvas.getByTestId("call-response-slide")).toHaveTextContent(
        "The Magus",
      );
    });
  },
};

export const AnswerCue: Story = {
  args: { blockId: "magus-card", script },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(fakeMicStream, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Continue" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Finish response" }),
      );
      await expect(await canvas.findByText("Number: I.")).toBeInTheDocument();
      await expect(
        canvas.queryByRole("progressbar", { name: "Microphone activity" }),
      ).not.toBeInTheDocument();
    });
  },
};

export const PermissionDenied: Story = {
  args: { blockId: "magus-card", script },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(
      async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
      async () => {
        const canvas = within(canvasElement);
        await userEvent.click(
          canvas.getByRole("button", { name: "Start call and response" }),
        );
        await expect(
          await canvas.findByText(
            "Microphone access is required for spoken responses.",
          ),
        ).toBeInTheDocument();
        await expect(
          canvas.getByRole("button", { name: "Retry" }),
        ).toBeInTheDocument();
      },
    );
  },
};

export const LexicalSlide: Story = {
  args: { blockId: "magus-card", script: withSlide({ type: "lexical", state: paragraphState }) },
  play: async ({ canvasElement }) => {
    await runWithFakeMic(fakeMicStream, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await expect(
        await canvas.findByText("Mercury rules Beth", {}, { timeout: 10_000 }),
      ).toBeInTheDocument();
    });
  },
};

const gradedSaveGrade = fn();

export const GradedSlideDuringResponse: Story = {
  args: {
    blockId: "magus-card",
    script: withSlide({ type: "lexical", state: gradedQuizState, graded: true }, true),
  },
  decorators: [
    (Story: React.ComponentType) => (
      <UnitContext.Provider
        value={{ ...unitContext, saveGrade: gradedSaveGrade }}
      >
        <Story />
      </UnitContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    gradedSaveGrade.mockClear();
    await runWithFakeMic(fakeMicStream, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Start call and response" }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Continue" }),
      );
      await expect(
        await canvas.findByText("Your response: number"),
      ).toBeInTheDocument();
      await userEvent.click(
        await canvas.findByLabelText("Mercury", {}, { timeout: 10_000 }),
      );
      await waitFor(() => expect(gradedSaveGrade).toHaveBeenCalled());
      const saved = gradedSaveGrade.mock.calls.at(-1)?.[0] as {
        "magus-card": {
          cues: Record<string, { slide?: { complete: boolean; accuracy: number } }>;
        };
      };
      await expect(
        saved["magus-card"].cues["magus-number-response"]?.slide,
      ).toMatchObject({ complete: true, accuracy: 100 });
    });
  },
};
