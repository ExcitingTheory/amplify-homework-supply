/**
 * @fileoverview Non-destructive audio processing for RecordingStudio3
 *
 * Applies audio filters to a raw recording and uploads the processed result
 * alongside the original. The raw file is never modified — only a processed
 * sibling is created/overwritten. This allows re-encoding with different
 * settings at any time.
 *
 * S3 path convention:
 *   Raw:       protected/{identityId}/takes/{dialogueId}-{slotId}_{version}.webm
 *   Processed: protected/{identityId}/takes/{dialogueId}-{slotId}_{version}_processed.wav
 */

import { uploadData, getUrl } from "aws-amplify/storage";
import { applyAudioFilters } from "./applyAudioFilters";
import { audioBufferToBlob } from "./audioBufferToBlob";

/**
 * Derive the processed file path from a raw file path.
 * Replaces the extension with `_processed.wav`.
 */
export function getProcessedPath(rawPath) {
  // Remove extension and append _processed.wav
  const lastDot = rawPath.lastIndexOf(".");
  if (lastDot === -1) return `${rawPath}_processed.wav`;
  return `${rawPath.slice(0, lastDot)}_processed.wav`;
}

/**
 * Process a raw audio file with the given filters and upload the result.
 *
 * @param {string} rawPath - S3 path to the raw recording
 * @param {Set<string>|string[]} filters - Filter names to apply (from AudioFilterPanel)
 * @param {object} [options]
 * @param {string} [options.processedPath] - Override output path (default: derived from rawPath)
 * @returns {Promise<{ processedPath: string, size: number }>}
 */
export async function processAndUploadTake(rawPath, filters, options = {}) {
  const filterSet =
    filters instanceof Set ? filters : new Set(filters);

  // If no filters, there's nothing to process
  if (filterSet.size === 0) {
    return { processedPath: null, size: 0 };
  }

  // Fetch the raw audio from S3
  const { url } = await getUrl({ path: rawPath });
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch raw audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // Decode to AudioBuffer
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Apply filters
  const processedBuffer = await applyAudioFilters(audioBuffer, filterSet);

  // Encode to WAV blob
  const processedBlob = await audioBufferToBlob(processedBuffer, "audio/wav");

  // Upload processed file alongside raw
  const outputPath = options.processedPath || getProcessedPath(rawPath);

  const result = await uploadData({
    path: outputPath,
    data: processedBlob,
    options: {
      contentType: "audio/wav",
    },
  }).result;

  return {
    processedPath: result.path,
    size: processedBlob.size,
  };
}
