import type {
  GTVocab,
  ThothCard,
  ThothGroundTruth,
} from "../../test/integration/thoth/scoreExtraction";

export type ThothUnitKey =
  | "orientation"
  | "trumps"
  | "small"
  | "courts"
  | "glossary"
  | "aces"
  | "counterchange"
  | "colourScales";

interface ThothUnitSpec {
  key: ThothUnitKey;
  name: string;
  description: string;
  references?: readonly string[];
  vocabSets?: readonly string[];
  groups?: readonly ThothCard["group"][];
  princessCourts?: boolean;
  cards?: readonly string[];
  smallRanks?: readonly string[];
}

export const THOTH_UNIT_SPECS: readonly ThothUnitSpec[] = [
  {
    key: "orientation",
    name: "Orientation: Reading These Cards",
    description: "How to read the correspondences and symbols used in the deck.",
    references: [
      "ref-reading-these-cards",
      "ref-four-suits-worlds",
      "ref-numbers-tree",
      "ref-sephiroth",
      "ref-colour-scales",
      "ref-chakras-overlay",
      "ref-zodiac-ring-transitions",
    ],
    vocabSets: [
      "sephiroth",
      "worlds",
      "planets",
      "signs",
      "elements",
      "other",
    ],
  },
  {
    key: "trumps",
    name: "The Trumps (22 paths)",
    description: "The twenty-two Trumps and their paths through the Tree of Life.",
    references: ["ref-trumps-paths-counterchange"],
  },
  {
    key: "small",
    name: "The Small Cards (36 decans)",
    description: "The numbered cards arranged by their zodiacal decans.",
    references: ["ref-36-decans"],
  },
  {
    key: "courts",
    name: "The Court Cards (16)",
    description: "Court ranks, elemental character, and zodiacal spans.",
    references: [
      "ref-court-family",
      "ref-court-person-force-idea",
      "ref-significator",
    ],
  },
  {
    key: "glossary",
    name: "Glossary & Symbols",
    description: "Glossary terms and the symbols used throughout the deck.",
    references: [
      "ref-glyphs",
      "ref-planets",
      "ref-signs",
      "ref-elements",
      "ref-four-worlds",
      "ref-glossary-qabalah",
      "ref-glossary-astrology",
      "ref-glossary-tarot",
      "ref-glossary-colour-chakra",
    ],
  },
  {
    key: "aces",
    name: "Special: The Four Aces",
    description: "The roots of the elements and their Princesses.",
    groups: ["ace"],
    princessCourts: true,
  },
  {
    key: "counterchange",
    name: "Special: Counterchange (Emperor ↔ Star)",
    description: "The Emperor and Star correspondence counterchange.",
    cards: ["trump-iv-the-emperor", "trump-xvii-the-star"],
    references: ["ref-trumps-paths-counterchange"],
  },
  {
    key: "colourScales",
    name: "Special: Shared Colour Scales",
    description: "Shared Queen-scale colour patterns in the numbered cards.",
    smallRanks: ["02", "10"],
    references: ["ref-colour-scales"],
  },
];

export interface BuildUnitContentOptions {
  wordIDsByTerm?: Record<string, string>;
  questionIDsByCardField?: Record<string, string>;
  callResponseBlock?: (card: ThothCard) => SerializedLexicalNode;
  zodiacRingImageID?: string;
}

export interface SerializedLexicalNode {
  type: string;
  version: number;
  [key: string]: unknown;
}

export interface BuiltThothUnit {
  key: ThothUnitKey;
  name: string;
  description: string;
  cards: ThothCard[];
  wordIDs: string[];
  questionIDs: string[];
  content: { root: SerializedLexicalNode };
}

const normalise = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function textNode(text: string): SerializedLexicalNode {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
  };
}

function heading(text: string, tag: "h1" | "h2" | "h3"): SerializedLexicalNode {
  return {
    type: "heading",
    version: 1,
    tag,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [textNode(text)],
  };
}

function paragraph(text: string): SerializedLexicalNode {
  return {
    type: "paragraph",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [textNode(text)],
  };
}

function cardTitleNumber(card: ThothCard): number {
  const number = card.facts.find((fact) => fact.field === "number")?.value;
  if (!number) return Number.POSITIVE_INFINITY;
  const romanValues: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
  };
  const canonical = number.toUpperCase();
  if (/^\d+$/.test(canonical)) return Number(canonical);
  let total = 0;
  let previous = 0;
  for (const character of [...canonical].reverse()) {
    const current = romanValues[character] ?? 0;
    total += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }
  return total;
}

function selectedCards(
  groundTruth: ThothGroundTruth,
  spec: ThothUnitSpec,
): ThothCard[] {
  const selected = groundTruth.cards.filter((card) => {
    if (spec.cards?.includes(card.key)) return true;
    if (spec.references?.includes(card.key)) return true;
    if (spec.groups?.includes(card.group)) return true;
    if (spec.princessCourts) {
      return card.group === "court" && card.key.includes("princess");
    }
    if (spec.smallRanks && card.group === "small") {
      return spec.smallRanks.some((rank) => card.key.endsWith(`-${rank}`));
    }
    if (spec.key === "trumps") return card.group === "trump";
    if (spec.key === "small") return card.group === "small";
    if (spec.key === "courts") return card.group === "court";
    if (spec.key === "glossary") {
      return card.group === "reference" && card.key.includes("glossary");
    }
    return false;
  });

  return selected.sort((a, b) => {
    if (a.group === "reference" || b.group === "reference") {
      return a.group === b.group ? a.title.localeCompare(b.title) : 1;
    }
    return cardTitleNumber(a) - cardTitleNumber(b);
  });
}

function vocabularyForUnit(
  cards: ThothCard[],
  vocabulary: GTVocab[],
  spec: ThothUnitSpec,
): GTVocab[] {
  if (spec.key === "glossary") {
    return vocabulary.filter(
      (entry) =>
        entry.set === "glossary" ||
        [
          "planets",
          "signs",
          "elements",
          "worlds",
          "hebrewLetters",
        ].includes(entry.set),
    );
  }

  const terms = new Set(
    cards.flatMap((card) => [
      card.title,
      card.subtitle,
      ...card.facts.flatMap((fact) => [fact.value, ... (fact.accept ?? [])]),
    ]).map(normalise),
  );

  return vocabulary.filter((entry) => {
    if (spec.vocabSets?.includes(entry.set)) return true;
    return (
      terms.has(normalise(entry.term)) ||
      (entry.aliases ?? []).some((alias) => terms.has(normalise(alias)))
    );
  });
}

function questionKey(cardKey: string, field: string): string {
  return `${cardKey}::${field}`;
}

function buildCardNodes(
  cards: ThothCard[],
  questionIDsByCardField: Record<string, string>,
  callResponseBlock?: (card: ThothCard) => SerializedLexicalNode,
): SerializedLexicalNode[] {
  const nodes: SerializedLexicalNode[] = [];
  for (const card of cards) {
    if (card.group !== "reference") {
      nodes.push(heading(card.title, "h3"));
      if (card.subtitle) nodes.push(paragraph(card.subtitle));
    } else {
      nodes.push(heading(card.title, "h2"));
    }

    const cardQuestions = card.facts
      .map((fact) => questionIDsByCardField[questionKey(card.key, fact.field)])
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    if (cardQuestions.length > 0) {
      nodes.push({
        type: "quiz",
        version: 1,
        data: cardQuestions,
      });
    }
    if (callResponseBlock) {
      nodes.push(callResponseBlock(card));
    }
  }
  return nodes;
}

export function buildThothUnits(
  groundTruth: ThothGroundTruth,
  options: BuildUnitContentOptions = {},
): BuiltThothUnit[] {
  return THOTH_UNIT_SPECS.map((spec) => {
    const cards = selectedCards(groundTruth, spec);
    const vocabulary = vocabularyForUnit(cards, groundTruth.vocabulary, spec);
    const wordIDs = vocabulary
      .map((entry) => options.wordIDsByTerm?.[entry.term])
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const questionIDs = [
      ...new Set(
        cards.flatMap((card) =>
          card.facts
            .map(
              (fact) =>
                options.questionIDsByCardField?.[
                  questionKey(card.key, fact.field)
                ],
            )
            .filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            ),
        ),
      ),
    ];
    if (spec.key === "courts") {
      const birthdayQuestion = Object.entries(
        options.questionIDsByCardField ?? {},
      ).find(([key]) => key.endsWith("::birthday"))?.[1];
      if (birthdayQuestion) questionIDs.push(birthdayQuestion);
    }

    const children: SerializedLexicalNode[] = [
      heading(spec.name, "h1"),
      paragraph(spec.description),
      ...buildCardNodes(
        cards,
        options.questionIDsByCardField ?? {},
        options.callResponseBlock,
      ),
    ];

    for (const wordID of wordIDs) {
      children.push({ type: "word-block", version: 1, wordID, format: "" });
    }

    if (spec.key === "orientation" && questionIDs.length > 0) {
      children.push({
        type: "quiz",
        version: 1,
        data: questionIDs.filter((_, index) => {
          const card = cards.find((candidate) =>
            candidate.facts.some(
              (fact) =>
                fact.field.startsWith("sephira") &&
                options.questionIDsByCardField?.[
                  questionKey(candidate.key, fact.field)
                ] === questionIDs[index],
            ),
          );
          return Boolean(card);
        }),
      });
    }

    if (spec.key === "courts") {
      const birthdayQuestion = Object.entries(
        options.questionIDsByCardField ?? {},
      ).find(([key]) => key.endsWith("::birthday"))?.[1];
      if (birthdayQuestion) {
        children.push({
          type: "custom-answer",
          version: 1,
          ids: [birthdayQuestion],
          allowedInput: ["text"],
          promptMethod: ["text"],
          format: "",
        });
      }
    }

    if (spec.key === "glossary" && wordIDs.length > 0) {
      children.push({
        type: "meaning-association",
        version: 1,
        wordIDs,
        enabledModes: ["learn", "easy", "hard"],
        promptFor: "definition",
        showAudio: false,
        showPronunciation: false,
      });
    }

    if (spec.key === "orientation" && options.zodiacRingImageID) {
      children.push({
        type: "image",
        version: 1,
        src: options.zodiacRingImageID,
        altText: "Zodiac ring and transitions",
        maxWidth: 1000,
      });
    }

    return {
      key: spec.key,
      name: spec.name,
      description: spec.description,
      cards,
      wordIDs,
      questionIDs,
      content: {
        root: {
          type: "root",
          version: 1,
          direction: "ltr",
          format: "",
          indent: 0,
          children,
        },
      },
    };
  });
}

export function buildThothUnitContent(
  key: ThothUnitKey,
  groundTruth: ThothGroundTruth,
  options: BuildUnitContentOptions = {},
): BuiltThothUnit {
  const unit = buildThothUnits(groundTruth, options).find(
    (candidate) => candidate.key === key,
  );
  if (!unit) throw new Error(`Unknown Thoth unit: ${key}`);
  return unit;
}
