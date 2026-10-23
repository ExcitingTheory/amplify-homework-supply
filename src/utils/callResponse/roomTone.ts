export const ROOM_TONE_DBFS = -50;

export function dbfsToGain(dbfs: number): number {
  return 10 ** (dbfs / 20);
}

/** Paul Kellet's economy pink-noise filter, normalised to [-1, 1]. */
export function generatePinkNoise(
  length: number,
  random: () => number = Math.random,
): Float32Array {
  const samples = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    samples[index] = pink * 0.11;
  }
  return samples;
}

export interface RoomTone {
  start: () => void;
  stop: () => void;
}

/** Looping pink noise at about -50 dBFS, synthesised with Web Audio. */
export function createRoomTone(audioContext: AudioContext): RoomTone {
  const seconds = 2;
  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * seconds,
    audioContext.sampleRate,
  );
  buffer.copyToChannel(
    generatePinkNoise(buffer.length) as Float32Array<ArrayBuffer>,
    0,
  );
  const gain = audioContext.createGain();
  gain.gain.value = dbfsToGain(ROOM_TONE_DBFS);
  gain.connect(audioContext.destination);
  let source: AudioBufferSourceNode | null = null;

  return {
    start() {
      if (source) return;
      source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
    },
    stop() {
      if (!source) return;
      source.stop();
      source.disconnect();
      source = null;
    },
  };
}
