import type { CallResponseScript } from "./buildCallResponseScript";
import { attachAudioFiles, collectAudioRequests } from "./authoring";

interface FileRecord {
  id?: string | null;
  path?: string | null;
  description?: string | null;
}

export interface AudioGenerationClient {
  mutations: {
    generateAudioFile(input: {
      phrase: string;
      voice: string;
      model: string;
    }): Promise<{ data?: FileRecord | null; errors?: readonly unknown[] }>;
  };
  models: {
    File: {
      get(input: {
        id: string;
      }): Promise<{ data?: FileRecord | null; errors?: readonly unknown[] }>;
    };
  };
}

export interface GenerateCueAudioOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  onProgress?: (completed: number, total: number) => void;
}

const COMPLETED_DESCRIPTION = "Generated audio - completed";

async function waitForFile(
  client: AudioGenerationClient,
  fileId: string,
  pollIntervalMs: number,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, errors } = await client.models.File.get({ id: fileId });
    if (errors?.length) {
      throw new Error(`Unable to check generated audio ${fileId}`);
    }
    if (!data) throw new Error(`Generated audio File ${fileId} was not found`);
    if (data.description?.startsWith("Error:")) {
      throw new Error(`TTS generation failed: ${data.description}`);
    }
    if (data.description === COMPLETED_DESCRIPTION) return;
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Timed out waiting for generated audio ${fileId}`);
}

/**
 * Generates TTS for every prompt/answer cue without audio. Identical text and
 * voice is generated once and shared across cues. Response cues never get audio.
 */
export async function generateCueAudio(
  client: AudioGenerationClient,
  script: CallResponseScript,
  options: GenerateCueAudioOptions = {},
): Promise<CallResponseScript> {
  const { pollIntervalMs = 1000, timeoutMs = 120_000, onProgress } = options;
  const requests = await collectAudioRequests(script);
  const fileIdsByCueId: Record<string, string> = {};
  let completed = 0;
  onProgress?.(completed, requests.length);

  for (const request of requests) {
    const { data, errors } = await client.mutations.generateAudioFile({
      phrase: request.text,
      voice: request.voice,
      model: "tts-1",
    });
    if (errors?.length || !data?.id) {
      throw new Error(`Unable to start TTS for "${request.text}"`);
    }
    await waitForFile(client, data.id, pollIntervalMs, timeoutMs);
    for (const cueId of request.cueIds) fileIdsByCueId[cueId] = data.id;
    completed += 1;
    onProgress?.(completed, requests.length);
  }

  return attachAudioFiles(script, fileIdsByCueId);
}
