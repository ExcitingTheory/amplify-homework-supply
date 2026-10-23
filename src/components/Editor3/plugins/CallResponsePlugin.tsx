import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  DecoratorNode,
  createCommand,
  type LexicalCommand,
  type LexicalEditor,
  type NodeKey,
  type SerializedLexicalNode,
} from "lexical";
import {
  Autocomplete,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UnitContext from "../../../context/unitContext";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import type {
  CallResponseResponseCue,
  CallResponseScript,
} from "../../../utils/callResponse/buildCallResponseScript";
import { isCallResponseScript } from "../../../utils/callResponse/buildCallResponseScript";
import {
  TTS_VOICES,
  appendQuestionCues,
  questionCardKey,
  type AuthoringQuestion,
} from "../../../utils/callResponse/authoring";
import { generateCueAudio } from "../../../utils/callResponse/generateCueAudio";
import { computeResponseWindow } from "../../../utils/callResponse/responseWindow";
import CallResponsePlayer from "../components/CallResponsePlayer";

interface VoiceFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function VoiceField({ label, value, onChange }: VoiceFieldProps) {
  const voices: string[] = TTS_VOICES.includes(value as (typeof TTS_VOICES)[number])
    ? [...TTS_VOICES]
    : [value, ...TTS_VOICES];
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
    >
      {voices.map((voice) => (
        <MenuItem key={voice} value={voice}>
          {voice}
        </MenuItem>
      ))}
    </TextField>
  );
}

function ResponseTimingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(event) =>
        onChange(event.target.value === "" ? 0 : Number(event.target.value))
      }
      inputProps={{ min: 0, step: 100 }}
      fullWidth
    />
  );
}

function CallResponseEditor({
  editor,
  nodeKey,
  script,
}: {
  editor: LexicalEditor;
  nodeKey: NodeKey;
  script: CallResponseScript;
}) {
  const t = useTranslations("common");
  const { questionBank } = React.useContext(UnitContext);
  const [draft, setDraft] = useState(script);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<
    AuthoringQuestion[]
  >([]);
  const [audioProgress, setAudioProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const questionOptions = React.useMemo(
    () =>
      Object.values((questionBank ?? {}) as Record<string, AuthoringQuestion>)
        .filter((question) => question.prompt && question.answer)
        .sort((left, right) =>
          (questionCardKey(left) ?? "").localeCompare(
            questionCardKey(right) ?? "",
          ),
        ),
    [questionBank],
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const cueCounter = useRef(0);

  useEffect(() => {
    setDraft(script);
  }, [script]);

  useEffect(() => {
    setAdvancedJson(JSON.stringify(draft, null, 2));
  }, [draft]);

  const updateVoice = (voice: "narrator" | "answer", value: string) => {
    setDraft((current) => ({
      ...current,
      voices: { ...current.voices, [voice]: value },
    }));
    setError(null);
  };

  const updateTextCue = (index: number, text: string) => {
    setDraft((current) => ({
      ...current,
      cues: current.cues.map((cue, cueIndex) =>
        cueIndex === index && cue.kind !== "response"
          ? { ...cue, text }
          : cue,
      ),
    }));
    setError(null);
  };

  const updateResponseCue = (
    index: number,
    updates: Partial<Omit<CallResponseResponseCue, "id" | "kind">>,
  ) => {
    setDraft((current) => ({
      ...current,
      cues: current.cues.map((cue, cueIndex) =>
        cueIndex === index && cue.kind === "response"
          ? { ...cue, ...updates }
          : cue,
      ),
    }));
    setError(null);
  };

  const addQuestionTriplet = () => {
    cueCounter.current += 1;
    const cueID = `${draft.cardKey}-custom-${Date.now().toString(36)}-${cueCounter.current}`;
    const slide = { type: "text" as const, text: draft.title };
    setDraft((current) => ({
      ...current,
      cues: [
        ...current.cues,
        {
          id: `${cueID}-prompt`,
          kind: "prompt",
          text: "Question?",
          slide,
        },
        {
          id: `${cueID}-response`,
          kind: "response",
          expected: "Expected answer",
          accept: [],
          field: "custom",
          ...computeResponseWindow("Expected answer"),
          slide,
        },
        {
          id: `${cueID}-answer`,
          kind: "answer",
          text: "Answer.",
          slide,
        },
      ],
    }));
    setError(null);
  };

  const addSelectedQuestions = () => {
    setDraft((current) => appendQuestionCues(current, selectedQuestions));
    setSelectedQuestions([]);
    setError(null);
  };

  const generateAudio = async () => {
    setError(null);
    setAudioProgress({ completed: 0, total: 0 });
    try {
      const withAudio = await generateCueAudio(getAmplifyClient(), draft, {
        onProgress: (completed, total) =>
          setAudioProgress({ completed, total }),
      });
      setDraft(withAudio);
    } catch (audioError) {
      setError(
        audioError instanceof Error
          ? audioError.message
          : t("callResponse.authoring.audioFailed"),
      );
    } finally {
      setAudioProgress(null);
    }
  };

  const removeCue = (index: number) => {
    setDraft((current) => ({
      ...current,
      cues: current.cues.filter((_, cueIndex) => cueIndex !== index),
    }));
    setError(null);
  };

  const applyAdvancedJson = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(advancedJson);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : t("callResponse.authoring.invalidJson"),
      );
      return;
    }
    if (!isCallResponseScript(parsed)) {
      setError(t("callResponse.authoring.invalidScript"));
      return;
    }
    setDraft(parsed);
    setError(null);
  };

  const save = () => {
    if (!isCallResponseScript(draft)) {
      setError("Check that every cue, voice, and response timing is valid");
      return;
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof CallResponseNode)) {
        throw new Error("Call-response node no longer exists");
      }
      node.setScript(draft);
    });
    setError(null);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1">
        {t("callResponse.authoring.title")}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <VoiceField
          label={t("callResponse.authoring.promptVoice")}
          value={draft.voices.narrator}
          onChange={(voice) => updateVoice("narrator", voice)}
        />
        <VoiceField
          label={t("callResponse.authoring.answerVoice")}
          value={draft.voices.answer}
          onChange={(voice) => updateVoice("answer", voice)}
        />
      </Stack>
      {draft.cues.map((cue, index) => (
        <Stack
          key={cue.id}
          spacing={1}
          sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle2">
              {t("callResponse.authoring.cueNumber", {
                number: index + 1,
                kind: t(`callResponse.authoring.kinds.${cue.kind}`),
              })}
            </Typography>
            <Button
              color="error"
              size="small"
              onClick={() => removeCue(index)}
              aria-label={t("callResponse.authoring.removeCue", {
                kind: t(`callResponse.authoring.kinds.${cue.kind}`),
                number: index + 1,
              })}
            >
              {t("callResponse.authoring.remove")}
            </Button>
          </Stack>
          {cue.kind === "response" ? (
            <>
              <TextField
                label={t("callResponse.authoring.expectedResponse")}
                value={cue.expected}
                onChange={(event) =>
                  updateResponseCue(index, { expected: event.target.value })
                }
                fullWidth
              />
              <TextField
                label={t("callResponse.authoring.acceptedAlternatives")}
                value={cue.accept.join(", ")}
                onChange={(event) =>
                  updateResponseCue(index, {
                    accept: event.target.value
                      .split(",")
                      .map((answer) => answer.trim())
                      .filter(Boolean),
                  })
                }
                fullWidth
              />
              <TextField
                label={t("callResponse.authoring.responseField")}
                value={cue.field}
                onChange={(event) =>
                  updateResponseCue(index, { field: event.target.value })
                }
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <ResponseTimingField
                  label={t("callResponse.authoring.minimumResponse")}
                  value={cue.minMs}
                  onChange={(minMs) => updateResponseCue(index, { minMs })}
                />
                <ResponseTimingField
                  label={t("callResponse.authoring.maximumResponse")}
                  value={cue.maxMs}
                  onChange={(maxMs) => updateResponseCue(index, { maxMs })}
                />
                <ResponseTimingField
                  label={t("callResponse.authoring.silenceToFinish")}
                  value={cue.silenceEndMs}
                  onChange={(silenceEndMs) =>
                    updateResponseCue(index, { silenceEndMs })
                  }
                />
              </Stack>
            </>
          ) : (
            <TextField
              label={t(
                cue.kind === "prompt"
                  ? "callResponse.authoring.promptText"
                  : "callResponse.authoring.answerText",
              )}
              value={cue.text}
              onChange={(event) => updateTextCue(index, event.target.value)}
              multiline
              fullWidth
            />
          )}
        </Stack>
      ))}
      <Button onClick={addQuestionTriplet} variant="outlined">
        {t("callResponse.authoring.addQuestionResponse")}
      </Button>
      <Autocomplete
        multiple
        options={questionOptions}
        value={selectedQuestions}
        onChange={(_event, value) => setSelectedQuestions(value)}
        groupBy={(question) =>
          questionCardKey(question) ??
          t("callResponse.authoring.ungroupedQuestions")
        }
        getOptionLabel={(question) => question.prompt ?? question.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("callResponse.authoring.generateFromQuestions")}
          />
        )}
      />
      <Button
        onClick={addSelectedQuestions}
        variant="outlined"
        disabled={selectedQuestions.length === 0}
      >
        {t("callResponse.authoring.addSelectedQuestions")}
      </Button>
      <Button
        onClick={() => void generateAudio()}
        variant="outlined"
        disabled={audioProgress !== null || draft.cues.length === 0}
      >
        {audioProgress
          ? t("callResponse.authoring.generatingAudio", {
              completed: audioProgress.completed,
              total: audioProgress.total,
            })
          : t("callResponse.authoring.generateAudio")}
      </Button>
      <Button onClick={() => setShowPreview((visible) => !visible)}>
        {t(
          showPreview
            ? "callResponse.authoring.hidePreview"
            : "callResponse.authoring.preview",
        )}
      </Button>
      {showPreview && isCallResponseScript(draft) && (
        <CallResponsePlayer blockId={nodeKey} script={draft} preview />
      )}
      <Button
        onClick={() => {
          setAdvancedJson(JSON.stringify(draft, null, 2));
          setShowAdvanced((visible) => !visible);
        }}
        variant="text"
      >
        {t(
          showAdvanced
            ? "callResponse.authoring.hideAdvanced"
            : "callResponse.authoring.advancedJson",
        )}
      </Button>
      {showAdvanced && (
        <>
          <TextField
            label={t("callResponse.authoring.advancedJson")}
            value={advancedJson}
            onChange={(event) => setAdvancedJson(event.target.value)}
            multiline
            minRows={8}
            fullWidth
          />
          <Button onClick={applyAdvancedJson} variant="outlined">
            {t("callResponse.authoring.applyJson")}
          </Button>
        </>
      )}
      {error && (
        <Typography role="alert" color="error">
          {error}
        </Typography>
      )}
      <Button onClick={save} variant="contained">
        {t("callResponse.authoring.saveScript")}
      </Button>
    </Stack>
  );
}

export class CallResponseNode extends DecoratorNode<React.ReactElement> {
  __script: CallResponseScript;

  static getType(): string {
    return "call-response";
  }

  static clone(node: CallResponseNode): CallResponseNode {
    return new CallResponseNode(node.__script, node.__key);
  }

  static importJSON(serializedNode: SerializedLexicalNode): CallResponseNode {
    if (
      !("script" in serializedNode) ||
      !isCallResponseScript(serializedNode.script)
    ) {
      throw new Error("Invalid call-response node data");
    }
    return new CallResponseNode(serializedNode.script);
  }

  constructor(script: CallResponseScript, key?: NodeKey) {
    super(key);
    if (!isCallResponseScript(script)) {
      throw new Error("CallResponseNode requires a valid script");
    }
    this.__script = script;
  }

  exportJSON() {
    return {
      type: "call-response",
      version: 1 as const,
      script: JSON.parse(JSON.stringify(this.__script)) as CallResponseScript,
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-call-response", "true");
    return element;
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.__script.title;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  setScript(script: CallResponseScript): void {
    this.getWritable().__script = script;
  }

  decorate(editor: LexicalEditor, config: { theme: Record<string, any> }) {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    };
    return (
      <BlockWithAlignableContents
        className={className}
        nodeKey={this.getKey()}
        format=""
      >
        {editor.isEditable() ? (
          <CallResponseEditor
            editor={editor}
            nodeKey={this.getKey()}
            script={this.__script}
          />
        ) : (
          <CallResponsePlayer blockId={this.getKey()} script={this.__script} />
        )}
      </BlockWithAlignableContents>
    );
  }
}

export const INSERT_CALL_RESPONSE_COMMAND: LexicalCommand<
  CallResponseScript | undefined
> = createCommand("INSERT_CALL_RESPONSE_COMMAND");

export function createEmptyCallResponseScript(): CallResponseScript {
  return {
    cardKey: `custom-${Date.now().toString(36)}`,
    title: "Call and response",
    voices: { narrator: "alloy", answer: "nova" },
    cues: [],
  };
}

export function $createCallResponseNode(
  script: CallResponseScript,
): CallResponseNode {
  return new CallResponseNode(script);
}

export function $isCallResponseNode(
  node: unknown,
): node is CallResponseNode {
  return node instanceof CallResponseNode;
}

export default function CallResponsePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([CallResponseNode])) {
      throw new Error(
        "CallResponsePlugin: CallResponseNode not registered on editor",
      );
    }
    return editor.registerCommand(
      INSERT_CALL_RESPONSE_COMMAND,
      (script) => {
        $insertNodeToNearestRoot(
          $createCallResponseNode(script ?? createEmptyCallResponseScript()),
        );
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}
