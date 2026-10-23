import type {
  GTVocab,
  ThothCard,
} from "../../../test/integration/thoth/scoreExtraction";
import { computeResponseWindow } from "./responseWindow";

export interface CallResponseTextSlide {
  type: "text";
  text: string;
}

/** Read-only Lexical content; `graded` routes nested block grades into the cue grade. */
export interface CallResponseLexicalSlide {
  type: "lexical";
  state: Record<string, unknown>;
  graded?: boolean;
}

export type CallResponseSlide =
  | CallResponseTextSlide
  | CallResponseLexicalSlide;

export interface CallResponsePromptCue {
  id: string;
  kind: "prompt" | "answer";
  text: string;
  audioFileID?: string;
  slide?: CallResponseSlide;
}

export interface CallResponseResponseCue {
  id: string;
  kind: "response";
  expected: string;
  accept: string[];
  field: string;
  minMs: number;
  maxMs: number;
  silenceEndMs: number;
  slide?: CallResponseSlide;
}

export interface CallResponseScript {
  cardKey: string;
  title: string;
  voices: { narrator: string; answer: string };
  albumTrackFileID?: string;
  cues: Array<CallResponsePromptCue | CallResponseResponseCue>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isCallResponseSlide(value: unknown): value is CallResponseSlide {
  if (!isRecord(value)) return false;
  if (value.type === "text") {
    return typeof value.text === "string" && Boolean(value.text.trim());
  }
  return (
    value.type === "lexical" &&
    isRecord(value.state) &&
    isRecord(value.state.root) &&
    (value.graded === undefined || typeof value.graded === "boolean")
  );
}

export function isCallResponseScript(
  value: unknown,
): value is CallResponseScript {
  if (!isRecord(value) || !isRecord(value.voices) || !Array.isArray(value.cues)) {
    return false;
  }
  if (
    typeof value.cardKey !== "string" ||
    !value.cardKey.trim() ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.voices.narrator !== "string" ||
    !value.voices.narrator.trim() ||
    typeof value.voices.answer !== "string" ||
    !value.voices.answer.trim() ||
    (value.albumTrackFileID !== undefined &&
      typeof value.albumTrackFileID !== "string")
  ) {
    return false;
  }

  const cueIDs = new Set<string>();
  return value.cues.every((cue) => {
    if (
      !isRecord(cue) ||
      typeof cue.id !== "string" ||
      !cue.id.trim() ||
      cueIDs.has(cue.id) ||
      (cue.slide !== undefined && !isCallResponseSlide(cue.slide))
    ) {
      return false;
    }
    cueIDs.add(cue.id);
    if (cue.kind === "prompt" || cue.kind === "answer") {
      return typeof cue.text === "string" && Boolean(cue.text.trim());
    }
    if (
      cue.kind !== "response" ||
      typeof cue.expected !== "string" ||
      !cue.expected.trim() ||
      typeof cue.field !== "string" ||
      !cue.field.trim() ||
      !Array.isArray(cue.accept) ||
      !cue.accept.every((answer) => typeof answer === "string") ||
      typeof cue.minMs !== "number" ||
      !Number.isFinite(cue.minMs) ||
      cue.minMs <= 0 ||
      typeof cue.maxMs !== "number" ||
      !Number.isFinite(cue.maxMs) ||
      cue.maxMs < cue.minMs ||
      typeof cue.silenceEndMs !== "number" ||
      !Number.isFinite(cue.silenceEndMs) ||
      cue.silenceEndMs < 0 ||
      cue.silenceEndMs > cue.maxMs
    ) {
      return false;
    }
    return true;
  });
}

const GLOSSARY_CARD_SETS: Record<string, string[]> = {
  "ref-glossary-qabalah": ["sephiroth", "worlds", "hebrewLetters"],
  "ref-glossary-astrology": ["planets", "signs", "elements"],
  "ref-glossary-tarot": ["glossary"],
  "ref-glossary-colour-chakra": ["other"],
};

const FIELD_ORDER = [
  /^(number|rank|suit|title)$/i,
  /(planet|element|sign|decan)/i,
  /(hebrew|letter)/i,
  /(path|tree|seph|join|connect)/i,
  /(zodiac|date|degree|span)/i,
  /(court|rank)/i,
  /(colour|color|scale|chakra)/i,
];

function fieldLabel(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fieldOrder(field: string): number {
  const index = FIELD_ORDER.findIndex((pattern) => pattern.test(field));
  return index === -1 ? FIELD_ORDER.length : index;
}

export function buildCallResponseScript(
  card: ThothCard,
  vocabulary: GTVocab[] = [],
): CallResponseScript {
  const glossarySets = GLOSSARY_CARD_SETS[card.key];
  const facts = glossarySets
    ? []
    : card.facts
        .map((fact, index) => ({ fact, index }))
        .filter(({ fact }) => !fact.sourceDefect)
        .sort(
          (left, right) =>
            fieldOrder(left.fact.field) - fieldOrder(right.fact.field) ||
            left.index - right.index,
        );
  const cues: CallResponseScript["cues"] = [];

  for (const { fact } of facts) {
    const label = fieldLabel(fact.field);
    const cueID = `${card.key}-${fact.field}`;
    const slide = { type: "text" as const, text: card.title };
    cues.push(
      {
        id: `${cueID}-prompt`,
        kind: "prompt",
        text: `${card.title}. ${label}?`,
        slide,
      },
      {
        id: `${cueID}-response`,
        kind: "response",
        expected: fact.value,
        accept: [...(fact.accept ?? [])],
        field: fact.field,
        ...computeResponseWindow(fact.value),
        slide,
      },
      {
        id: `${cueID}-answer`,
        kind: "answer",
        text: `${label}: ${fact.value}.`,
        slide,
      },
    );
  }

  if (glossarySets) {
    const slide = { type: "text" as const, text: card.title };
    const glossaryEntries = vocabulary.filter((entry) =>
      glossarySets.includes(entry.set),
    );
    for (const [index, entry] of glossaryEntries.entries()) {
      const cueID = `${card.key}-glossary-${index}`;
      cues.push(
        {
          id: `${cueID}-prompt`,
          kind: "prompt",
          text: entry.term,
          slide,
        },
        {
          id: `${cueID}-response`,
          kind: "response",
          expected: entry.definition,
          accept: [],
          field: `glossary:${entry.set}`,
          ...computeResponseWindow(entry.definition),
          slide,
        },
        {
          id: `${cueID}-answer`,
          kind: "answer",
          text: entry.definition,
          slide,
        },
      );
    }
  }

  return {
    cardKey: card.key,
    title: card.title,
    voices: { narrator: "alloy", answer: "nova" },
    cues,
  };
}
