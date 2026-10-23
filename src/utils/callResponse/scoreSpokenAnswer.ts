import { doubleMetaphone } from "./doubleMetaphone";

export type SpokenAnswerMatch =
  | "exact"
  | "numeric"
  | "token"
  | "phonetic"
  | "none";

export interface SpokenAnswerScore {
  score: number;
  correct: boolean;
  match: SpokenAnswerMatch;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  oh: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  twentyone: 21,
  twentytwo: 22,
};

function normalise(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function romanValue(value: string): number | null {
  if (!/^[ivxlcdm]+$/i.test(value)) return null;
  const values: Record<string, number> = {
    i: 1,
    v: 5,
    x: 10,
    l: 50,
    c: 100,
    d: 500,
    m: 1000,
  };
  let total = 0;
  let previous = 0;
  for (const letter of [...value.toLowerCase()].reverse()) {
    const current = values[letter]!;
    total += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }
  return total > 0 && total <= 3999 ? total : null;
}

function numericValue(value: string): number | null {
  const cleaned = normalise(value);
  if (/^\d+$/.test(cleaned)) return Number(cleaned);
  const roman = romanValue(cleaned.replaceAll(" ", ""));
  if (roman !== null) return roman;
  const compact = cleaned.replaceAll(" ", "");
  if (compact in NUMBER_WORDS) return NUMBER_WORDS[compact]!;
  const parts = cleaned.split(" ");
  if (
    parts.length === 2 &&
    parts[0] === "twenty" &&
    (parts[1] === "one" || parts[1] === "two")
  ) {
    return 20 + NUMBER_WORDS[parts[1]]!;
  }
  return null;
}

function levenshteinDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0]!;
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = row[rightIndex]!;
      row[rightIndex] = Math.min(
        row[rightIndex]! + 1,
        row[rightIndex - 1]! + 1,
        diagonal +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[right.length]!;
}

function similarity(left: string, right: string): number {
  if (left === right) return 1;
  const longest = Math.max(left.length, right.length);
  return longest === 0
    ? 1
    : 1 - levenshteinDistance(left, right) / longest;
}

function tokenSetRatio(left: string, right: string): number {
  const leftTokens = new Set(normalise(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalise(right).split(" ").filter(Boolean));
  const common = [...leftTokens].filter((token) => rightTokens.has(token));
  const uniqueLeft = [...leftTokens].filter((token) => !rightTokens.has(token));
  const uniqueRight = [...rightTokens].filter((token) => !leftTokens.has(token));
  const shared = common.sort().join(" ");
  const combinedLeft = [...common, ...uniqueLeft].sort().join(" ");
  const combinedRight = [...common, ...uniqueRight].sort().join(" ");
  return Math.max(
    similarity(shared, combinedLeft),
    similarity(shared, combinedRight),
    similarity(combinedLeft, combinedRight),
  );
}

function phoneticMatch(left: string, right: string): boolean {
  const leftWords = normalise(left).split(" ").filter(Boolean);
  const rightWords = normalise(right).split(" ").filter(Boolean);
  if (leftWords.length !== rightWords.length) return false;

  return leftWords.every((word, index) => {
    const otherWord = rightWords[index]!;
    if (word === otherWord) return true;
    if (word.length < 5 || otherWord.length < 5) return false;
    const leftCodes = doubleMetaphone(word).filter(Boolean);
    const rightCodes = doubleMetaphone(otherWord).filter(Boolean);
    return leftCodes.some((code) => rightCodes.includes(code));
  });
}

export function scoreSpokenAnswer(
  transcript: string,
  expected: string,
  accept: string[] = [],
): SpokenAnswerScore {
  const normalizedTranscript = normalise(transcript);
  const alternatives = [expected, ...accept].filter(Boolean);
  if (!normalizedTranscript || alternatives.length === 0) {
    return { score: 0, correct: false, match: "none" };
  }

  if (alternatives.some((answer) => normalise(answer) === normalizedTranscript)) {
    return { score: 100, correct: true, match: "exact" };
  }

  const spokenNumber = numericValue(normalizedTranscript);
  if (
    spokenNumber !== null &&
    alternatives.some((answer) => numericValue(answer) === spokenNumber)
  ) {
    return { score: 100, correct: true, match: "numeric" };
  }

  const tokenScore = Math.max(
    ...alternatives.map((answer) => tokenSetRatio(answer, transcript)),
  );
  if (tokenScore >= 0.9) {
    return {
      score: Math.round(tokenScore * 100),
      correct: true,
      match: "token",
    };
  }

  if (
    normalizedTranscript.replaceAll(" ", "").length >= 5 &&
    alternatives.some((answer) => phoneticMatch(transcript, answer))
  ) {
    return { score: 85, correct: false, match: "phonetic" };
  }

  return {
    score: Math.round(tokenScore * 100),
    correct: false,
    match: "none",
  };
}
