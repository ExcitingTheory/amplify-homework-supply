/**
 * Turning a recorded answer into text the AI can grade.
 *
 * The graders read text, so a spoken answer has to be transcribed before it
 * reaches them; sending the file's path instead marks every spoken answer
 * wrong, however good the answer was.
 */
import { getAmplifyClient } from "./amplifyClient";
import getCachedUrl from "./getCachedUrl";

/** Whisper reads the recording; the graders then read its text. */
const TRANSCRIPTION_MODEL = "whisper-1";

export interface TranscribeOptions {
  client?: { queries: { transcribeUrl: (input: Record<string, unknown>) => Promise<any> } };
  resolveUrl?: (path: string) => Promise<string | null>;
}

/**
 * The words spoken in a stored recording.
 *
 * Throws rather than returning an empty string: a silent failure here would be
 * graded as an empty answer, which looks like the learner said nothing.
 */
export async function transcribeSubmission(
  audioPath: string,
  { client, resolveUrl = getCachedUrl }: TranscribeOptions = {},
): Promise<string> {
  if (!audioPath) throw new Error("Cannot transcribe without an audio path");

  const audioUrl = await resolveUrl(audioPath);
  if (!audioUrl) throw new Error(`Unable to create a URL for ${audioPath}`);

  const data = client ?? getAmplifyClient();
  // transcribeUrl takes only the URL and the model; see amplify/data/resource.ts.
  const response = await data.queries.transcribeUrl({
    audioUrl,
    model: TRANSCRIPTION_MODEL,
  });

  if (response?.errors?.length) {
    throw new Error(
      `Transcription failed: ${response.errors
        .map((error: { message?: string }) => error.message)
        .join("; ")}`,
    );
  }

  const transcript = typeof response?.data === "string" ? response.data.trim() : "";
  if (!transcript) {
    throw new Error("Transcription returned no speech");
  }
  return transcript;
}
