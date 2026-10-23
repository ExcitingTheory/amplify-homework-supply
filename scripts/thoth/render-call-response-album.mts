import { createHash, createHmac } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Amplify } from "aws-amplify";
import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import { downloadData, uploadData } from "aws-amplify/storage";
import type { Schema } from "../../amplify/data/resource";
import type {
  CallResponseScript,
} from "../../src/utils/callResponse/buildCallResponseScript";
import { buildCallResponseScript, isCallResponseScript } from "../../src/utils/callResponse/buildCallResponseScript";
import type { ThothGroundTruth } from "../../test/integration/thoth/scoreExtraction";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const groundTruthPath = join(
  repositoryRoot,
  "test/fixtures/thoth/thoth-ground-truth.json",
);
const manifestPath = join(
  repositoryRoot,
  "test/fixtures/thoth/audio-manifest.json",
);
const seedDataPath = join(repositoryRoot, "test/integration/seed-data.json");
const outputsPath = join(repositoryRoot, "amplify_outputs.json");

interface AudioCue {
  id: string;
  text: string;
  voice: string;
  cacheKey: string;
}

interface PlannedCard {
  cardKey: string;
  title: string;
  script: CallResponseScript;
  audioCues: AudioCue[];
}

interface ManifestAudio {
  id: string;
  path: string;
  text: string;
  voice: string;
}

interface ManifestTrack {
  id: string;
  path: string;
  title: string;
  durationMs: number;
}

interface AudioManifest {
  version: 1;
  generatedAt: string | null;
  cues: Record<string, ManifestAudio>;
  tracks: Record<string, ManifestTrack>;
  fullAlbum?: { filename: string; durationMs: number };
}

interface AudioGenerationClient {
  models: {
    File: {
      get(input: { id: string }): Promise<{
        data?: { path?: string | null; description?: string | null } | null;
        errors?: readonly unknown[];
      }>;
    };
  };
  mutations: {
    generateAudioFile(input: {
      phrase: string;
      voice: string;
      model: string;
    }): Promise<{
      data?: { id?: string | null; path?: string | null } | null;
      errors?: readonly unknown[];
    }>;
  };
}

function cacheKey(voice: string, text: string): string {
  return createHash("sha256").update(`${voice}\0${text}`).digest("hex");
}

export function buildAlbumPlan(
  groundTruth: ThothGroundTruth,
): PlannedCard[] {
  return groundTruth.cards.map((card) => {
    const script = buildCallResponseScript(card, groundTruth.vocabulary);
    const audioCues = script.cues.flatMap((cue) => {
      if (cue.kind === "response") return [];
      const voice =
        cue.kind === "prompt" ? script.voices.narrator : script.voices.answer;
      return [{
        id: cue.id,
        text: cue.text,
        voice,
        cacheKey: cacheKey(voice, cue.text),
      }];
    });
    return { cardKey: card.key, title: card.title, script, audioCues };
  });
}

export function deduplicateAudioCues(cards: PlannedCard[]): AudioCue[] {
  const unique = new Map<string, AudioCue>();
  for (const card of cards) {
    for (const cue of card.audioCues) {
      if (!unique.has(cue.cacheKey)) unique.set(cue.cacheKey, cue);
    }
  }
  return [...unique.values()];
}

export function selectAlbumCards(
  cards: PlannedCard[],
  cardKey?: string,
): PlannedCard[] {
  if (!cardKey) return cards;
  const selected = cards.filter((card) => card.cardKey === cardKey);
  if (selected.length === 0) {
    throw new Error(`Unknown Thoth card key: ${cardKey}`);
  }
  return selected;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function getSeededUserPassword(username: string): string {
  const seed = process.env.TEST_USER_PASSWORD_SEED;
  if (!seed) {
    throw new Error(
      "Set THOTH_AUDIO_PASSWORD or TEST_USER_PASSWORD_SEED to sign in as the seeded instructor",
    );
  }
  const digest = createHmac("sha256", seed).update(username).digest("base64url");
  return `Dev!${digest}a1!`;
}

async function readManifest(): Promise<AudioManifest> {
  try {
    const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      (parsed as AudioManifest).version !== 1 ||
      typeof (parsed as AudioManifest).cues !== "object" ||
      typeof (parsed as AudioManifest).tracks !== "object"
    ) {
      throw new Error("Thoth audio manifest has an unsupported shape");
    }
    return parsed as AudioManifest;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: 1, generatedAt: null, cues: {}, tracks: {} };
    }
    throw error;
  }
}

async function writeManifest(manifest: AudioManifest): Promise<void> {
  manifest.generatedAt = new Date().toISOString();
  const temporaryPath = `${manifestPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporaryPath, manifestPath);
}

async function downloadAudio(path: string): Promise<Uint8Array> {
  const result = await downloadData({ path }).result;
  return new Uint8Array(await (await result.body.blob()).arrayBuffer());
}

function visitCallResponseScripts(
  content: unknown,
  visitScript: (script: CallResponseScript) => void,
): void {
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value === null || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (node.type === "call-response") {
      if (!isCallResponseScript(node.script)) {
        throw new Error("Seeded unit contains an invalid call-response script");
      }
      visitScript(node.script);
    }
    Object.values(node).forEach(visit);
  };
  visit(content);
}

export function prepareAlbumUnitUpdates(
  units: Array<{ unitId: string; content: unknown }>,
  cards: PlannedCard[],
): Array<{ unitId: string; content: unknown }> {
  const planByCard = new Map(cards.map((card) => [card.cardKey, card]));
  const found = new Set<string>();
  const updates = units.filter(({ unitId, content }) => {
    let selected = false;
    visitCallResponseScripts(content, (script) => {
      const card = planByCard.get(script.cardKey);
      if (!card) return;
      const spokenCues = script.cues.flatMap((cue) =>
        cue.kind === "response" ? [] : [{
          id: cue.id,
          text: cue.text,
          voice: cue.kind === "prompt" ? script.voices.narrator : script.voices.answer,
        }],
      );
      if (
        spokenCues.length !== card.audioCues.length ||
        spokenCues.some((cue, index) => {
          const planned = card.audioCues[index];
          return !planned || cue.id !== planned.id ||
            cue.text !== planned.text || cue.voice !== planned.voice;
        })
      ) {
        throw new Error(
          `Seeded call-response speech differs from the audio plan for ${script.cardKey} in unit ${unitId}; refresh the seed before generating TTS`,
        );
      }
      found.add(script.cardKey);
      selected = true;
    });
    return selected;
  });
  const missing = cards.map((card) => card.cardKey).filter((key) => !found.has(key));
  if (missing.length > 0) {
    throw new Error(`No seeded call-response nodes found for: ${missing.join(", ")}`);
  }
  return updates;
}

function attachCueFiles(
  content: unknown,
  planByCard: Map<string, PlannedCard>,
  manifest: AudioManifest,
): void {
  visitCallResponseScripts(content, (script) => {
    const card = planByCard.get(script.cardKey);
    if (card) {
      delete script.albumTrackFileID;
      const cueFiles = new Map(
        card.audioCues.map((cue) => [
          cue.id,
          manifest.cues[cue.cacheKey]?.id,
        ]),
      );
      for (const cue of script.cues) {
        if (cue.kind === "response") continue;
        const audioFileID = cueFiles.get(cue.id);
        if (!audioFileID) {
          throw new Error(`Missing audio manifest entry for ${cue.id}`);
        }
        cue.audioFileID = audioFileID;
      }
    }
  });
}

async function waitForGeneratedAudio(
  client: AudioGenerationClient,
  fileId: string,
  expectedPath: string,
): Promise<void> {
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const { data, errors } = await client.models.File.get({ id: fileId });
    if (errors?.length) {
      throw new Error(
        `Unable to check generated audio ${fileId}: ${JSON.stringify(errors)}`,
      );
    }
    if (!data) {
      throw new Error(
        `Generated audio File ${fileId} was not found. Preserve the cached S3 object and restore its File record; TTS will not be regenerated automatically.`,
      );
    }
    if (data.path !== expectedPath) {
      throw new Error(`Generated audio File ${fileId} has an unexpected S3 path`);
    }
    if (data.description?.startsWith("Error:")) {
      throw new Error(`TTS generation failed: ${data.description}`);
    }
    if (data.description === "Generated audio - completed") {
      const bytes = await downloadAudio(expectedPath);
      const hasId3Header =
        bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
      const hasMpegFrameHeader =
        bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0;
      if (!hasId3Header && !hasMpegFrameHeader) {
        throw new Error(`Generated audio File ${fileId} is not a valid MP3`);
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for generated audio ${fileId}`);
}

export async function ensureAudioCue(
  client: AudioGenerationClient,
  cue: AudioCue,
  manifest: AudioManifest,
  persistManifest: (manifest: AudioManifest) => Promise<void> = writeManifest,
): Promise<ManifestAudio> {
  const existing = manifest.cues[cue.cacheKey];
  if (existing) {
    if (existing.text !== cue.text || existing.voice !== cue.voice) {
      throw new Error(`Audio manifest cache-key mismatch for cue ${cue.id}`);
    }
    await waitForGeneratedAudio(client, existing.id, existing.path);
    return existing;
  }

  const { data, errors } = await client.mutations.generateAudioFile({
    phrase: cue.text,
    voice: cue.voice,
    model: "tts-1",
  });
  if (errors?.length || !data?.id || !data.path) {
    throw new Error(
      `Unable to start TTS for ${cue.id}: ${JSON.stringify(errors)}`,
    );
  }
  const generated: ManifestAudio = {
    id: data.id,
    path: data.path,
    text: cue.text,
    voice: cue.voice,
  };
  manifest.cues[cue.cacheKey] = generated;
  await persistManifest(manifest);
  await waitForGeneratedAudio(client, generated.id, generated.path);
  return generated;
}

async function uploadUnitContent(
  identityId: string,
  unitId: string,
  content: string,
): Promise<void> {
  await Promise.all([
    uploadData({
      path: `protected/${identityId}/units/${unitId}/draft.json`,
      data: content,
      options: { contentType: "application/json" },
    }).result,
    uploadData({
      path: `protected/units/${unitId}/published.json`,
      data: content,
      options: { contentType: "application/json" },
    }).result,
  ]);
}

async function renderAlbum(cards: PlannedCard[]): Promise<void> {
  if (cards.length === 0) throw new Error("Select at least one Thoth card");
  const manifest = await readManifest();
  const seedData = JSON.parse(await readFile(seedDataPath, "utf8"));
  const units = seedData?.thoth?.units as Record<string, string> | undefined;
  const instructor = seedData?.users?.instructor1 as
    | { username?: string; sub?: string }
    | undefined;
  if (!units || !instructor?.username || !instructor.sub) {
    throw new Error("Run the Thoth seed before rendering the audio album");
  }
  const unitIds = Object.values(units);
  if (
    unitIds.length === 0 ||
    unitIds.some((unitId) => typeof unitId !== "string" || unitId.length === 0)
  ) {
    throw new Error("Seed Thoth units before rendering and attaching album tracks");
  }
  const outputs = JSON.parse(await readFile(outputsPath, "utf8"));
  Amplify.configure(outputs);
  const username = process.env.THOTH_AUDIO_USERNAME ?? instructor.username;
  const password =
    process.env.THOTH_AUDIO_PASSWORD ?? getSeededUserPassword(username);
  if (username !== instructor.username) {
    throw new Error("Thoth album generation must use the seeded instructor1 account");
  }
  const authentication = await signIn({ username, password });
  try {
    if (!authentication.isSignedIn) {
      throw new Error(
        `Instructor sign-in requires ${authentication.nextStep.signInStep}; complete authentication before generating audio`,
      );
    }
    const session = await fetchAuthSession();
    const owner = requireString(session.userSub, "Authenticated user sub");
    const identityId = requireString(session.identityId, "Authenticated identity ID");
    if (owner !== instructor.sub) {
      throw new Error("Signed-in account does not own the seeded Thoth units");
    }
    const client = generateClient<Schema>({ authMode: "userPool" });
    const unitsToCheck: Array<{ unitId: string; content: unknown }> = [];
    for (const unitId of unitIds) {
      const path = `protected/${identityId}/units/${unitId}/draft.json`;
      const content = JSON.parse(
        new TextDecoder().decode(await downloadAudio(path)),
      ) as unknown;
      unitsToCheck.push({ unitId, content });
    }
    const unitContentUpdates = prepareAlbumUnitUpdates(unitsToCheck, cards);
    const cues = deduplicateAudioCues(cards);
    for (const cue of cues) await ensureAudioCue(client, cue, manifest);

    const planByCard = new Map(cards.map((card) => [card.cardKey, card]));
    for (const { content } of unitContentUpdates) {
      attachCueFiles(content, planByCard, manifest);
    }
    await Promise.all(
      unitContentUpdates.map(({ unitId, content }) =>
        uploadUnitContent(identityId, unitId, JSON.stringify(content)),
      ),
    );
    await writeManifest(manifest);
    console.log(
      `Verified ${cues.length} unique OpenAI TTS cues and attached playlist audio to ${cards.length} Thoth cards. Response silence is controlled by playlist timing.`,
    );
  } finally {
    await signOut();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let cardKey: string | undefined;
  const seen = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--card") {
      if (seen.has(arg)) throw new Error("Specify --card only once");
      seen.add(arg);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--card requires a card key");
      }
      cardKey = value;
      index += 1;
    } else if (arg === "--execute" || arg === "--local-preview") {
      if (seen.has(arg)) throw new Error(`Specify ${arg} only once`);
      seen.add(arg);
    } else {
      throw new Error(`Unknown option or argument: ${arg}`);
    }
  }
  const groundTruth = JSON.parse(
    await readFile(groundTruthPath, "utf8"),
  ) as ThothGroundTruth;
  const cards = selectAlbumCards(buildAlbumPlan(groundTruth), cardKey);
  const cues = deduplicateAudioCues(cards);
  if (process.argv.includes("--local-preview")) {
    throw new Error(
      "Local speech generation is not supported; Thoth playlists use the authenticated OpenAI TTS mutation",
    );
  }
  if (process.argv.includes("--execute")) {
    if (process.env.THOTH_AUDIO_CONFIRM !== "1") {
      throw new Error(
        "Set THOTH_AUDIO_CONFIRM=1 to authorize paid OpenAI TTS generation and seeded unit updates",
      );
    }
    await renderAlbum(cards);
    return;
  }
  console.log(
    `Dry run: ${cards.length} card(s), ${cues.length} unique TTS cues${cardKey ? ` for ${cardKey}` : ""}. Use --execute with THOTH_AUDIO_CONFIRM=1 to generate speech through the app's OpenAI TTS mutation, store files in S3, and update seeded units.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
