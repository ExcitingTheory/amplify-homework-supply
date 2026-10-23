import type {
  CallResponseScript,
} from "./buildCallResponseScript";
import { computeResponseWindow } from "./responseWindow";

export interface AuthoringQuestion {
  id: string;
  prompt?: string | null;
  answer?: string | null;
  metadata?: string | null;
}

export interface AudioRequest {
  cacheKey: string;
  text: string;
  voice: string;
  cueIds: string[];
}

export const TTS_VOICES = [
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
] as const;

function parseMetadata(
  metadata: string | null | undefined,
): { field?: string; accept: string[]; card?: string } {
  if (!metadata) return { accept: [] };
  try {
    const parsed: unknown = JSON.parse(metadata);
    if (parsed === null || typeof parsed !== "object") return { accept: [] };
    const record = parsed as Record<string, unknown>;
    return {
      field: typeof record.field === "string" ? record.field : undefined,
      card: typeof record.card === "string" ? record.card : undefined,
      accept: Array.isArray(record.accept)
        ? record.accept.filter(
            (answer): answer is string => typeof answer === "string",
          )
        : [],
    };
  } catch {
    return { accept: [] };
  }
}

export function questionCardKey(question: AuthoringQuestion): string | null {
  return parseMetadata(question.metadata).card ?? null;
}

/** Appends one prompt, response, and answer cue per question that has both parts. */
export function appendQuestionCues(
  script: CallResponseScript,
  questions: AuthoringQuestion[],
): CallResponseScript {
  const existingIds = new Set(script.cues.map((cue) => cue.id));
  const slide = { type: "text" as const, text: script.title };
  const cues = [...script.cues];
  for (const question of questions) {
    const prompt = question.prompt?.trim();
    const answer = question.answer?.trim();
    if (!prompt || !answer) continue;
    const baseId = `${script.cardKey}-q-${question.id}`;
    if (existingIds.has(`${baseId}-prompt`)) continue;
    const metadata = parseMetadata(question.metadata);
    cues.push(
      { id: `${baseId}-prompt`, kind: "prompt", text: prompt, slide },
      {
        id: `${baseId}-response`,
        kind: "response",
        expected: answer,
        accept: metadata.accept,
        field: metadata.field ?? "question",
        ...computeResponseWindow(answer),
        slide,
      },
      { id: `${baseId}-answer`, kind: "answer", text: answer, slide },
    );
  }
  return { ...script, cues };
}

export async function audioCacheKey(
  voice: string,
  text: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${voice}\0${text}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** Distinct (voice, text) pairs lacking audio, so a repeated "Planet?" is generated once. */
export async function collectAudioRequests(
  script: CallResponseScript,
): Promise<AudioRequest[]> {
  const requests = new Map<string, AudioRequest>();
  for (const cue of script.cues) {
    if (cue.kind === "response" || cue.audioFileID) continue;
    const voice =
      cue.kind === "prompt" ? script.voices.narrator : script.voices.answer;
    const cacheKey = await audioCacheKey(voice, cue.text);
    const existing = requests.get(cacheKey);
    if (existing) existing.cueIds.push(cue.id);
    else requests.set(cacheKey, { cacheKey, text: cue.text, voice, cueIds: [cue.id] });
  }
  return [...requests.values()];
}

export function attachAudioFiles(
  script: CallResponseScript,
  fileIdsByCueId: Record<string, string>,
): CallResponseScript {
  return {
    ...script,
    cues: script.cues.map((cue) =>
      cue.kind !== "response" && fileIdsByCueId[cue.id]
        ? { ...cue, audioFileID: fileIdsByCueId[cue.id] }
        : cue,
    ),
  };
}
