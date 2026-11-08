/**
 * Choosing an audio format for recordings.
 *
 * Browsers cannot encode MP3 from `MediaRecorder`, so asking for one would
 * mean shipping a WASM encoder. They already produce well-compressed audio in
 * containers every current browser can play, so the useful choice is which of
 * those to ask for — and, importantly, not to re-encode the result as WAV,
 * which is lossless, uncompressed and roughly twenty times larger.
 *
 * Order of preference:
 *  1. AAC in MP4  — plays everywhere, including Safari and iOS.
 *  2. Opus in WebM — Chrome, Firefox and Edge; better quality per byte.
 *  3. Whatever the browser offers, as a last resort.
 *
 * All of these are accepted by OpenAI transcription.
 */

/** Containers to ask `MediaRecorder` for, best first. */
const PREFERRED_TYPES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

/** Extension for a recording, by container. */
const EXTENSIONS: Array<[RegExp, string]> = [
  [/^audio\/mp4|^audio\/aac|^audio\/x-m4a/, "m4a"],
  [/^audio\/mpeg|^audio\/mp3/, "mp3"],
  [/^audio\/webm/, "webm"],
  [/^audio\/ogg/, "ogg"],
  [/^audio\/wav|^audio\/x-wav/, "wav"],
];

/**
 * The best recording type this browser supports, or undefined to let
 * `MediaRecorder` pick its own default.
 */
export function preferredRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_TYPES.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
}

/**
 * The file extension matching a recording's container.
 *
 * A stored name that disagrees with the bytes misleads anything that trusts
 * it, so this is derived from the blob's own type rather than assumed.
 */
export function extensionForMimeType(mimeType: string | null | undefined): string {
  const type = (mimeType ?? "").split(";")[0].trim().toLowerCase();
  return EXTENSIONS.find(([pattern]) => pattern.test(type))?.[1] ?? "webm";
}
