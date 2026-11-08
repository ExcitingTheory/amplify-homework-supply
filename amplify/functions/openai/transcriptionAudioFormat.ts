export interface TranscriptionAudioFormat {
  extension: string;
  mimeType: string;
}

const formatsByMimeType = new Map<string, TranscriptionAudioFormat>([
  ["audio/flac", { extension: "flac", mimeType: "audio/flac" }],
  ["audio/m4a", { extension: "m4a", mimeType: "audio/mp4" }],
  ["audio/mp4", { extension: "mp4", mimeType: "audio/mp4" }],
  ["audio/mpeg", { extension: "mp3", mimeType: "audio/mpeg" }],
  ["audio/mpga", { extension: "mpga", mimeType: "audio/mpeg" }],
  ["audio/ogg", { extension: "ogg", mimeType: "audio/ogg" }],
  ["audio/wav", { extension: "wav", mimeType: "audio/wav" }],
  ["audio/webm", { extension: "webm", mimeType: "audio/webm" }],
  ["audio/x-m4a", { extension: "m4a", mimeType: "audio/mp4" }],
  ["audio/x-wav", { extension: "wav", mimeType: "audio/wav" }],
]);

const formatsByExtension = new Map<string, TranscriptionAudioFormat>([
  ["flac", { extension: "flac", mimeType: "audio/flac" }],
  ["m4a", { extension: "m4a", mimeType: "audio/mp4" }],
  ["mp3", { extension: "mp3", mimeType: "audio/mpeg" }],
  ["mp4", { extension: "mp4", mimeType: "audio/mp4" }],
  ["mpeg", { extension: "mpeg", mimeType: "audio/mpeg" }],
  ["mpga", { extension: "mpga", mimeType: "audio/mpeg" }],
  ["oga", { extension: "oga", mimeType: "audio/ogg" }],
  ["ogg", { extension: "ogg", mimeType: "audio/ogg" }],
  ["wav", { extension: "wav", mimeType: "audio/wav" }],
  ["webm", { extension: "webm", mimeType: "audio/webm" }],
]);

export function getTranscriptionAudioFormat(
  contentType: string | null,
  audioUrl: string,
): TranscriptionAudioFormat {
  const mimeType = contentType?.split(";", 1)[0].trim().toLowerCase();
  const formatFromMimeType = mimeType
    ? formatsByMimeType.get(mimeType)
    : undefined;
  if (formatFromMimeType) return formatFromMimeType;

  const extension = /\.([a-z0-9]+)$/i
    .exec(new URL(audioUrl).pathname)?.[1]
    ?.toLowerCase();
  const formatFromExtension = extension
    ? formatsByExtension.get(extension)
    : undefined;
  if (formatFromExtension) return formatFromExtension;

  throw new Error(
    `Unsupported audio format for transcription: ${mimeType || "unknown"}`,
  );
}
