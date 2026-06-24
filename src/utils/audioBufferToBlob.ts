/**
 * @fileoverview WAV encoder utility for RecordingStudio3
 *
 * Converts an AudioBuffer to a WAV Blob. WAV is trivially encodable
 * (no external dependencies) and lossless. The resulting blob is typically
 * re-encoded downstream by MediaConvert or the browser's MediaRecorder.
 */

/**
 * Encode an AudioBuffer as a WAV or WebM Blob.
 *
 * For 'audio/wav': Writes raw PCM into a WAV container (lossless, no deps).
 * For 'audio/webm': Uses MediaRecorder on an AudioContext to encode (lossy).
 *
 * @param buffer - The AudioBuffer to encode
 * @param mimeType - Target MIME type
 * @returns Encoded Blob
 */
export async function audioBufferToBlob(
  buffer: AudioBuffer,
  mimeType: 'audio/wav' | 'audio/webm' = 'audio/wav',
): Promise<Blob> {
  if (mimeType === 'audio/wav') {
    return encodeWav(buffer);
  }

  // WebM via MediaRecorder
  return encodeViaMediaRecorder(buffer, mimeType);
}

/**
 * Encode AudioBuffer as WAV (PCM 16-bit).
 * Pure function — no browser APIs other than ArrayBuffer/DataView.
 */
function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = buffer.length;
  const dataSize = numFrames * blockAlign;

  // WAV header is 44 bytes
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size (PCM = 16)
  view.setUint16(20, 1, true); // audio format (PCM = 1)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels and write 16-bit PCM samples
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/** Write an ASCII string into a DataView at the given offset. */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encode AudioBuffer via MediaRecorder (for WebM or other supported formats).
 * Creates a temporary AudioContext, plays the buffer through it, and records.
 */
async function encodeViaMediaRecorder(
  buffer: AudioBuffer,
  mimeType: string,
): Promise<Blob> {
  const ctx = new AudioContext({ sampleRate: buffer.sampleRate });
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const dest = ctx.createMediaStreamDestination();
  source.connect(dest);

  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      ctx.close();
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.onerror = (e) => {
      ctx.close();
      reject(e);
    };

    recorder.start();
    source.start(0);

    // Stop recording after buffer duration + small margin
    const durationMs = (buffer.length / buffer.sampleRate) * 1000 + 100;
    setTimeout(() => {
      recorder.stop();
      source.stop();
    }, durationMs);
  });
}
