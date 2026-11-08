/**
 * Generates the spoken answer the learner demo records through Chromium's
 * fake microphone, and stores it as a committed fixture.
 *
 * Chromium's `--use-file-for-fake-audio-capture` only accepts 16-bit PCM WAV,
 * which is what OpenAI returns for `response_format: "wav"`, so the file is
 * written straight from the API with no conversion step.
 *
 * Usage:
 *   node scripts/demos/generate-spoken-answer.mjs [--voice nova] [--force]
 *
 * Needs OPENAI_API_KEY (read from .env.local when present). The file is left
 * alone if it already exists unless --force is passed, so a demo run never
 * pays for audio it already has.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// Kept under test/mocks so it survives a sandbox teardown and a cleaned
// test-results/, and so a demo run never has to pay for the audio twice.
const outputPath = resolve(projectRoot, "test/mocks/biology-spoken-answer.wav");

/** What the learner says out loud; it is graded, so it answers the question. */
const ANSWER =
  "Chloroplasts are the organelles in plant cells where photosynthesis takes place. " +
  "They contain chlorophyll, a green pigment that absorbs light energy from the sun. " +
  "That energy is used to convert carbon dioxide and water into glucose, " +
  "releasing oxygen as a by-product.";

/** A clear, unhurried voice suits a narrated product demo. */
const DEFAULT_VOICE = "nova";
const MODEL = "gpt-4o-mini-tts";

function readEnvFile(name) {
  const path = resolve(projectRoot, name);
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
      })
      .filter(([key]) => key),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const voiceIndex = args.indexOf("--voice");
  const voice = voiceIndex >= 0 ? args[voiceIndex + 1] : DEFAULT_VOICE;

  if (existsSync(outputPath) && !force) {
    console.log(`Spoken answer already present: ${outputPath} (--force to replace)`);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || readEnvFile(".env.local").OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required; set it in the environment or .env.local");
  }

  console.log(`Generating the spoken answer with ${MODEL} (${voice})...`);
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice,
      input: ANSWER,
      response_format: "wav",
      instructions: "Speak as a student explaining an answer: unhurried, clear and natural.",
    }),
  });

  if (!response.ok) {
    throw new Error(`Speech request failed: ${response.status} ${await response.text()}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  // Chromium silently falls back to a beep if the file is not RIFF/WAVE.
  if (audio.subarray(0, 4).toString("ascii") !== "RIFF") {
    throw new Error("Speech response was not a WAV file; check response_format");
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, audio);
  console.log(`Wrote ${outputPath} (${(audio.length / 1024).toFixed(0)} KB)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
