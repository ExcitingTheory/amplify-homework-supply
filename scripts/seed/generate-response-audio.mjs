#!/usr/bin/env node
/**
 * Generates the student answer recordings the seed uploads
 * (test/mocks/student-responses/*.webm|*.m4a).
 *
 * Each clip is encoded the way the app records a spoken answer (see
 * speechRecorderOptions in src/utils/audioRecordingFormat.ts): mono Opus at
 * 16 kbps in WebM (Chrome, Firefox) or mono AAC at 24 kbps in MP4 (Safari).
 *
 * Speech comes from espeak-ng by default, so the clips can be regenerated
 * offline. Pass --tts openai for natural voices (gpt-4o-mini-tts; needs
 * OPENAI_API_KEY). The biology answer reuses test/mocks/biology-spoken-answer.wav
 * (see scripts/demos/generate-spoken-answer.mjs), whose wording is known.
 *
 * Requires ffmpeg (with libopus) and, for the default engine, espeak-ng.
 *
 *   node scripts/seed/generate-response-audio.mjs [--tts espeak|openai] [--force]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(root, "test/mocks/student-responses");

/** Every clip, what it says (the seeded transcript), and its format. */
export const CLIPS = [
  { file: "sayonara-chrome.webm", lang: "ja", text: "さようなら", format: "webm" },
  { file: "sayonara-casual-safari.m4a", lang: "ja", text: "さよなら", format: "m4a" },
  { file: "biology-first-try.webm", lang: "en", text: "Um, it happens in the...", format: "webm" },
  { file: "biology-chloroplast-answer.webm", source: "test/mocks/biology-spoken-answer.wav", format: "webm" },
  { file: "quiet-room.webm", noise: 1.6, format: "webm" },
];

const ENCODE = {
  webm: ["-ac", "1", "-ar", "48000", "-c:a", "libopus", "-b:a", "16k", "-application", "voip"],
  m4a: ["-ac", "1", "-ar", "24000", "-c:a", "aac", "-b:a", "24k", "-movflags", "+faststart"],
};

function readEnvKey(name) {
  if (process.env[name]) return process.env[name];
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return undefined;
  const line = readFileSync(path, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

async function speak(clip, engine, wavPath) {
  if (engine === "openai") {
    const apiKey = readEnvKey("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "nova", input: clip.text, response_format: "wav" }),
    });
    if (!response.ok) throw new Error(`TTS failed: ${response.status} ${await response.text()}`);
    writeFileSync(wavPath, Buffer.from(await response.arrayBuffer()));
    return;
  }
  const voice = clip.lang === "ja" ? "ja+f3" : "en-us+f3";
  execFileSync("espeak-ng", ["-v", voice, "-s", "135", "-w", wavPath, clip.text]);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const engine = args.includes("--tts") ? args[args.indexOf("--tts") + 1] : "espeak";
  const work = mkdtempSync(join(tmpdir(), "hs-audio-"));

  for (const clip of CLIPS) {
    const out = join(outDir, clip.file);
    if (existsSync(out) && !force) {
      console.log(`skip ${clip.file} (exists; --force to regenerate)`);
      continue;
    }
    let input;
    if (clip.source) {
      input = ["-i", resolve(root, clip.source)];
    } else if (clip.noise) {
      // A recording where the student said nothing: quiet room tone.
      input = ["-f", "lavfi", "-i", `anoisesrc=color=pink:amplitude=0.004:duration=${clip.noise}:seed=7`];
    } else {
      const wav = join(work, `${clip.file}.wav`);
      await speak(clip, engine, wav);
      // A short lead-in and tail, like a real recording.
      input = ["-i", wav, "-af", "adelay=250|250,apad=pad_dur=0.3"];
    }
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, ...ENCODE[clip.format], out]);
    console.log(`wrote ${clip.file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
