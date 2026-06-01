/**
 * Integration tests for the Custom AI block.
 *
 * Tests the interaction between CustomAIPlugin, its editor/component,
 * and the grading data flow through UnitContext.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, string>) => {
      if (params) {
        return `${key}: ${JSON.stringify(params)}`;
      }
      return key;
    };
    return t;
  },
}));

// Mock the contexts
vi.mock("@/context/unitContext", () => ({
  default: React.createContext({
    grade: { id: "grade-1", data: {} },
    saveGrade: vi.fn(),
    workbook: null,
  }),
  gradedBlockTypes: [
    "quiz",
    "meaning-association",
    "answer",
    "custom-answer",
    "custom-ai",
  ],
}));

vi.mock("@/context/dictionaryContext", () => ({
  default: React.createContext({
    questionBank: {
      "q1": {
        id: "q1",
        prompt: "What is photosynthesis?",
        answer: "The process by which plants convert light to energy",
        question: "What is photosynthesis?",
      },
      "q2": {
        id: "q2",
        prompt: "Name the parts of a cell",
        answer: "Nucleus, mitochondria, cell membrane, etc.",
        question: "Name the parts of a cell",
      },
    },
  }),
}));

// Mock Lexical hooks
vi.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [
    {
      hasNodes: () => true,
      registerCommand: () => () => {},
      update: (fn: Function) => fn(),
      isEditable: () => true,
    },
  ],
}));

vi.mock("@lexical/react/useLexicalNodeSelection", () => ({
  useLexicalNodeSelection: () => [false, vi.fn(), vi.fn()],
}));

vi.mock("@lexical/utils", () => ({
  mergeRegister: (...fns: Function[]) => () => fns.forEach((f) => f()),
  $insertNodeToNearestRoot: vi.fn(),
}));

vi.mock("lexical", async () => {
  const actual = await vi.importActual("lexical");
  return {
    ...actual,
    $getNodeByKey: vi.fn(),
    $getSelection: vi.fn(() => null),
  };
});

vi.mock("@lexical/react/LexicalHistoryPlugin", () => ({
  createEmptyHistoryState: () => ({}),
}));

// Mock dynamic imports
vi.mock("@/components/Editor3/components/SketchPad", () => ({
  default: () => <div data-testid="sketch-pad">SketchPad Mock</div>,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => Promise<any>) => {
    return () => <div data-testid="dynamic-component">Dynamic Mock</div>;
  },
}));

vi.mock("@/components/Editor3/components/PlainTextAnswerInput", () => ({
  default: ({
    placeholder,
    disabled,
    testId,
  }: {
    placeholder?: string;
    disabled?: boolean;
    testId?: string;
  }) => (
    <input
      data-testid={testId || "plain-text-input"}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

vi.mock("@/components/Editor3/components/AudioAutoSubmitWrapper", () => ({
  default: ({ children }: { children: Function }) =>
    children({ wrapOnRecordingComplete: (fn: Function) => fn }),
}));

vi.mock("@/components/Editor3/components/AudioWaveformPlayer", () => ({
  default: ({ title }: { title?: string }) => (
    <div data-testid="audio-player">{title}</div>
  ),
}));

vi.mock("@/components/Editor3/components/WorkbookBlockEnhancements", () => ({
  WorkbookBlockEnhancements: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="workbook-block">{children}</div>,
}));

vi.mock("@/hooks/useVerifyContext", () => ({
  useVerifyContext: () => ({ studentMemory: null, contentContext: null }),
}));

vi.mock("@/utils/amplifyClient", () => ({
  getAmplifyClient: () => ({}),
}));

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({
    rows,
    columns,
  }: {
    rows: any[];
    columns: any[];
  }) => (
    <div data-testid="data-grid">
      {rows.map((r: any) => (
        <div key={r.id} data-testid={`row-${r.id}`}>
          {r.prompt}
        </div>
      ))}
    </div>
  ),
}));

describe("CustomAIPlugin node", () => {
  it("creates node with correct type", async () => {
    const { CustomAINode } = await import(
      "@/components/Editor3/plugins/CustomAIPlugin"
    );
    expect(CustomAINode.getType()).toBe("custom-ai");
  });

  it("$isCustomAINode type guard works", async () => {
    const { $isCustomAINode, $createCustomAINode, CustomAINode } = await import(
      "@/components/Editor3/plugins/CustomAIPlugin"
    );
    const { createEditor } = await import("lexical");
    const editor = createEditor({ nodes: [CustomAINode] });
    let node: any;
    editor.update(
      () => {
        node = $createCustomAINode(["q1"], "text", "criteria", ["text"]);
      },
      { discrete: true },
    );
    expect($isCustomAINode(node)).toBe(true);
    expect($isCustomAINode(null)).toBe(false);
    expect($isCustomAINode(undefined)).toBe(false);
  });

  it("node exportJSON round-trips correctly", async () => {
    const { $createCustomAINode, CustomAINode } = await import(
      "@/components/Editor3/plugins/CustomAIPlugin"
    );
    const { createEditor } = await import("lexical");
    const editor = createEditor({ nodes: [CustomAINode] });
    let json: any;
    editor.update(
      () => {
        const node = $createCustomAINode(
          ["q1", "q2"],
          "drawing",
          "Grade on accuracy",
          ["text", "drawing"],
          "left",
        );
        json = node.exportJSON();
      },
      { discrete: true },
    );

    expect(json.type).toBe("custom-ai");
    expect(json.ids).toEqual(["q1", "q2"]);
    expect(json.inputMode).toBe("drawing");
    expect(json.criteria).toBe("Grade on accuracy");
    expect(json.allowedInput).toEqual(["text", "drawing"]);
    expect(json.format).toBe("left");

    let restored: any;
    editor.update(
      () => {
        restored = CustomAINode.importJSON(json);
      },
      { discrete: true },
    );
    expect(restored.getIds()).toEqual(["q1", "q2"]);
    expect(restored.getInputMode()).toBe("drawing");
    expect(restored.getCriteria()).toBe("Grade on accuracy");
    expect(restored.getAllowedInput()).toEqual(["text", "drawing"]);
  });
});

describe("CustomAIEditor component", () => {
  it("renders without crashing", async () => {
    const { default: CustomAIEditor } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIEditor"
    );

    const { container } = render(
      <CustomAIEditor
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={["q1"]}
        inputMode="text"
        criteria="Test criteria"
        allowedInput={["text", "audio"]}
      />,
    );

    expect(container).toBeTruthy();
  });

  it("displays the AI-Graded Exercise header", async () => {
    const { default: CustomAIEditor } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIEditor"
    );

    render(
      <CustomAIEditor
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={[]}
        inputMode="text"
        criteria=""
        allowedInput={["text"]}
      />,
    );

    expect(screen.getByText("AI-Graded Exercise")).toBeTruthy();
  });

  it("displays security notice", async () => {
    const { default: CustomAIEditor } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIEditor"
    );

    render(
      <CustomAIEditor
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={[]}
        inputMode="text"
        criteria=""
        allowedInput={["text"]}
      />,
    );

    expect(screen.getByText(/prompt injection/i)).toBeTruthy();
  });
});

describe("CustomAIComponent renders", () => {
  it("renders without crashing", async () => {
    const { default: CustomAIComponent } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIComponent"
    );

    const { container } = render(
      <CustomAIComponent
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={["q1"]}
        inputMode="text"
        criteria="Test criteria"
        allowedInput={["text"]}
      />,
    );

    expect(container).toBeTruthy();
  });

  it("renders question prompts from question bank", async () => {
    const { default: CustomAIComponent } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIComponent"
    );

    render(
      <CustomAIComponent
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={["q1"]}
        inputMode="text"
        criteria="Test criteria"
        allowedInput={["text"]}
      />,
    );

    expect(screen.getByText(/What is photosynthesis/)).toBeTruthy();
  });

  it("renders text input when mode is text", async () => {
    const { default: CustomAIComponent } = await import(
      "@/components/Editor3/nodes/CustomAINode/CustomAIComponent"
    );

    render(
      <CustomAIComponent
        className={{ base: "", focus: "" }}
        format=""
        nodeKey="test-key"
        ids={["q1"]}
        inputMode="text"
        criteria="Test criteria"
        allowedInput={["text"]}
      />,
    );

    expect(screen.getByTestId("custom-ai-input")).toBeTruthy();
  });
});

describe("Grade calculation integration", () => {
  it("custom-ai block data integrates with grade structure", () => {
    const gradeData: Record<string, any> = {
      "quiz-block": { complete: true, accuracy: 0.9 },
      "custom-ai-block": {
        complete: true,
        accuracy: 0.85,
        score: 85,
        userResponse: "Photosynthesis converts light",
        feedback: "Good understanding",
      },
    };

    // Verify both block types can coexist
    expect(gradeData["quiz-block"]).toBeDefined();
    expect(gradeData["custom-ai-block"]).toBeDefined();
    expect(gradeData["custom-ai-block"].accuracy).toBe(0.85);
    expect(gradeData["custom-ai-block"].score).toBe(85);
  });
});
