const MAX_WORDS = 20;
const MAX_QUESTIONS = 12;
const MAX_FILES = 12;
const MAX_REFERENCE_COUNT = 12;

type ResourceRecord = Record<string, unknown> & { id?: string };

export interface SuggestionReferenceMap {
  [reference: string]: string;
}

export interface SuggestionResources {
  vocabulary: Array<{
    ref: string;
    phrase: string;
    pronunciation?: string;
    definition?: string;
  }>;
  questions: Array<{
    ref: string;
    prompt: string;
    choices?: string[];
    difficulty?: string;
  }>;
  files: Array<{
    ref: string;
    name: string;
    description?: string;
    summary?: string;
    mimeType?: string;
  }>;
}

export interface SuggestionReferenceCatalog {
  resources: SuggestionResources;
  idByReference: SuggestionReferenceMap;
  fileById: Record<string, ResourceRecord>;
  questionById: Record<string, ResourceRecord>;
}

function valuesByRelevance(
  records: Record<string, ResourceRecord> | undefined,
  query: string,
  limit: number,
  label: (record: ResourceRecord) => string,
): ResourceRecord[] {
  const queryTerms = query
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1);

  return Object.values(records ?? {})
    .filter((record) => record && typeof record.id === "string")
    .map((record) => {
      const text = Object.values(record)
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLocaleLowerCase();
      const score = queryTerms.reduce(
        (total, term) => total + (text.includes(term) ? 1 : 0),
        0,
      );
      return { record, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || label(a.record).localeCompare(label(b.record)),
    )
    .slice(0, limit)
    .map(({ record }) => record);
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : undefined;
}

/**
 * Selects bounded, unit-scoped resources for the prompt and keeps their real
 * IDs in a separate client-side map so they are never sent to the model.
 */
export function buildSuggestionReferenceCatalog(
  dictionary: Record<string, ResourceRecord> | undefined,
  questionBank: Record<string, ResourceRecord> | undefined,
  files: Record<string, ResourceRecord> | undefined,
  query: string,
): SuggestionReferenceCatalog {
  const selectedWords = valuesByRelevance(
    dictionary,
    query,
    MAX_WORDS,
    (word) => String(word.phrase ?? ""),
  );
  const selectedQuestions = valuesByRelevance(
    questionBank,
    query,
    MAX_QUESTIONS,
    (question) => String(question.prompt ?? ""),
  );
  const selectedFiles = valuesByRelevance(files, query, MAX_FILES, (file) =>
    String(file.name ?? ""),
  );
  const idByReference: SuggestionReferenceMap = {};
  const fileById: Record<string, ResourceRecord> = {};
  const questionById: Record<string, ResourceRecord> = {};

  const vocabulary = selectedWords.map((word, index) => {
    const ref = `w${index + 1}`;
    idByReference[ref] = word.id!;
    return {
      ref,
      phrase: optionalText(word.phrase, 120) ?? "",
      pronunciation: optionalText(word.pronunciation, 120),
      definition: optionalText(word.definition, 300),
    };
  });
  const questions = selectedQuestions.map((question, index) => {
    const ref = `q${index + 1}`;
    idByReference[ref] = question.id!;
    questionById[question.id!] = question;
    const choices = Array.isArray(question.choices)
      ? question.choices
          .filter((choice): choice is string => typeof choice === "string")
          .slice(0, 8)
          .map((choice) => choice.slice(0, 160))
      : undefined;
    return {
      ref,
      prompt: optionalText(question.prompt, 300) ?? "",
      choices,
      difficulty: optionalText(question.difficulty, 40),
    };
  });
  const availableFiles = selectedFiles.map((file, index) => {
    const ref = `f${index + 1}`;
    idByReference[ref] = file.id!;
    fileById[file.id!] = file;
    return {
      ref,
      name: optionalText(file.name, 160) ?? "",
      description: optionalText(file.description, 300),
      summary: optionalText(file.summary, 500),
      mimeType: optionalText(file.mimeType, 100),
    };
  });

  return {
    resources: { vocabulary, questions, files: availableFiles },
    idByReference,
    fileById,
    questionById,
  };
}

const SUGGESTION_BLOCK_LINE =
  /^[ \t]{0,3}(?:[-+*][ \t]+|\d{1,9}[.)][ \t]+)?:::(quiz|answer|meaning|custom-answer|call-response|word|playlist|conversation-playlist|pdf|image|file|youtube)(?:\[([^\]\r\n]*)\]|\{([^{}\r\n]*)\})(\{[^{}\r\n]*\})?[ \t]*$/;

export function mapUnfencedSuggestionLines(
  markdown: string,
  transform: (line: string, index: number) => string,
): string {
  let fence: { marker: string; length: number } | null = null;
  return markdown.split(/(\r?\n)/).map((part, index) => {
    if (index % 2 === 1) return part;
    const fenceMatch = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(part);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) {
        fence = { marker, length: fenceMatch[1].length };
      } else if (fence.marker === marker && fenceMatch[1].length >= fence.length) {
        fence = null;
      }
      return part;
    }
    if (fence) return part;
    return transform(part, index / 2);
  }).join("");
}

export function normalizeSuggestionBlockLines(markdown: string): string {
  return mapUnfencedSuggestionLines(markdown, (part) => {
    const match = SUGGESTION_BLOCK_LINE.exec(part);
    return match
      ? `:::${match[1]}[${match[2] ?? match[3]}]${match[4] ?? ""}`
      : part;
  });
}

const WORD_OR_MEANING_LINE =
  /^[ \t]*:::(word|meaning)\[[^\]\r\n]*\](?:\{[^}\r\n]*\})?[ \t]*$/;

/**
 * Learners should meet vocabulary before being asked to match its meaning, so
 * meaning-association blocks that precede generated word cards are moved to
 * follow the last word card.
 */
export function placeMeaningAfterWordBlocks(markdown: string): string {
  markdown = normalizeSuggestionBlockLines(markdown);
  const lines = markdown.split(/\r?\n/);
  const kinds: Array<string | null> = lines.map(() => null);
  mapUnfencedSuggestionLines(markdown, (line, index) => {
    kinds[index] = WORD_OR_MEANING_LINE.exec(line)?.[1] ?? null;
    return line;
  });
  const lastWord = kinds.lastIndexOf("word");
  const moved = new Set(
    kinds.flatMap((kind, index) =>
      kind === "meaning" && index < lastWord ? [index] : [],
    ),
  );
  if (moved.size === 0) return markdown;

  const output: string[] = [];
  lines.forEach((line, index) => {
    if (moved.has(index)) return;
    // Drop the blank separator left behind by a moved block.
    if (
      !line.trim() &&
      moved.has(index - 1) &&
      (output.length === 0 || !output[output.length - 1].trim())
    ) {
      return;
    }
    output.push(line);
    if (index === lastWord) {
      for (const movedIndex of moved) output.push("", lines[movedIndex]);
    }
  });
  return output.join("\n");
}

/**
 * Resolves the model-facing qN/wN/fN tokens into real IDs before Markdown
 * parsing. Invalid or stale references fail rather than creating broken nodes.
 */
export function resolveSuggestionReferences(
  markdown: string,
  idByReference: SuggestionReferenceMap,
  fileById: Record<string, ResourceRecord> = {},
  questionById: Record<string, ResourceRecord> = {},
): string {
  return mapUnfencedSuggestionLines(
    normalizeSuggestionBlockLines(markdown),
    (line) => resolveSuggestionLine(line, idByReference, fileById, questionById),
  );
}

function resolveSuggestionLine(
  line: string,
  idByReference: SuggestionReferenceMap,
  fileById: Record<string, ResourceRecord>,
  questionById: Record<string, ResourceRecord>,
): string {
  const removedAliases = line.match(
    /(^|\r?\n)[ \t]*:::(?:vocab|match|response)\[[^\]\r\n]*\][ \t]*(?=\r?\n|$)/,
  );
  if (removedAliases) {
    throw new Error("Unsupported AI block code; use the canonical block type");
  }
  const youtubeLines = line.match(
    /(^|\r?\n)[ \t]*:::youtube\[([^\]\r\n]*)\][ \t]*(?=\r?\n|$)/g,
  );
  if (
    youtubeLines?.some((line) => {
      const videoId = line.match(/:::youtube\[([^\]\r\n]*)\]/)?.[1]?.trim();
      return !videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId);
    })
  ) {
    throw new Error("Invalid YouTube video ID in AI completion");
  }

  const expectedPrefix: Record<string, string> = {
    quiz: "q",
    answer: "w",
    meaning: "w",
    "custom-answer": "q",
    "call-response": "q",
    word: "w",
    playlist: "f",
    "conversation-playlist": "f",
    pdf: "f",
    image: "f",
    file: "f",
  };
  const singleReferenceBlocks = new Set(["word", "pdf", "image", "file"]);

  return line.replace(
    /(^|\r?\n)([ \t]*:::((?:quiz|answer|meaning|custom-answer|call-response|word|playlist|conversation-playlist|pdf|image|file))\[([^\]\r\n]*)\](?:\{[^}\r\n]*\})?[ \t]*)(?=\r?\n|$)/g,
    (
      _fullMatch,
      lineBreak: string,
      command: string,
      type: string,
      refs: string,
    ) => {
      const tokens = refs.split(",").map((ref: string) => ref.trim());
      if (
        tokens.length === 0 ||
        tokens.length > MAX_REFERENCE_COUNT ||
        (singleReferenceBlocks.has(type) && tokens.length !== 1) ||
        tokens.some(
          (token: string) =>
            !new RegExp(`^${expectedPrefix[type]}[1-9]\\d*$`).test(token) ||
            typeof idByReference[token] !== "string",
        )
      ) {
        throw new Error(`Invalid ${type} reference in AI completion`);
      }

      const ids = tokens.map((token: string) => idByReference[token]);
      if (type === "pdf" || type === "image") {
        const file = fileById[ids[0]];
        const expectedMime = type === "pdf" ? "application/pdf" : "image/";
        if (
          !file ||
          typeof file.mimeType !== "string" ||
          (type === "pdf"
            ? file.mimeType !== expectedMime
            : !file.mimeType.startsWith(expectedMime)) ||
          typeof file.path !== "string" ||
          typeof file.identityId !== "string"
        ) {
          throw new Error(`Invalid ${type} file reference in AI completion`);
        }
      }
      if (type === "playlist" || type === "conversation-playlist") {
        const invalidFile = ids.some((id) => {
          const mimeType = fileById[id]?.mimeType;
          return (
            typeof mimeType !== "string" ||
            (type === "conversation-playlist"
              ? !mimeType.startsWith("audio/")
              : !(
                  mimeType.startsWith("audio/") || mimeType.startsWith("video/")
                ))
          );
        });
        if (invalidFile) {
          throw new Error(`Invalid ${type} file reference in AI completion`);
        }
      }
      if (type === "call-response") {
        const incompleteQuestion = ids.some((id) => {
          const question = questionById[id];
          return (
            typeof question?.prompt !== "string" ||
            !question.prompt.trim() ||
            typeof question.answer !== "string" ||
            !question.answer.trim()
          );
        });
        if (incompleteQuestion) {
          throw new Error(
            "Invalid call-response question reference in AI completion",
          );
        }
      }
      return `${lineBreak}${command.replace(refs, ids.join(","))}`;
    },
  );
}
