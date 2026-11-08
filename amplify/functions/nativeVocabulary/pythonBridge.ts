import { PythonShell } from "python-shell";
import type { VocabularySourcePage } from "../documentAnalysis/vocabularySelection.js";
import { sourceDefinitions } from "../documentAnalysis/vocabularyGlossary.js";
import { chunkVocabularyPage, NATIVE_SELECTOR_VERSION, parseCandidates, type VocabularyLanguage } from "./protocol.js";

interface BridgeOptions {
  script?: string;
  pythonPath?: string;
  timeoutMs?: number;
  modelDirectory?: string;
}

export async function runNativeSelection(
  pages: AsyncIterable<VocabularySourcePage>,
  language: VocabularyLanguage,
  options: BridgeOptions = {},
) {
  const shell = new PythonShell(options.script ?? "/var/task/worker.py", {
    mode: "text", pythonPath: options.pythonPath ?? "/usr/bin/python3.12", pythonOptions: ["-u"],
    env: {
      PATH: process.env.PATH, LANG: "C.UTF-8", HOME: "/tmp",
      STANZA_RESOURCES_DIR: options.modelDirectory ?? process.env.STANZA_RESOURCES_DIR,
      OMP_NUM_THREADS: "1", MKL_NUM_THREADS: "1",
    },
  });
  let pending: { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void } | undefined;
  let failure: Error | undefined;
  let outputBytes = 0;
  let stderrBytes = 0;
  let pythonFailureType: string | undefined;
  const fail = (message: string) => {
    failure ??= new Error(message);
    pending?.reject(failure);
    pending = undefined;
    shell.kill("SIGKILL");
  };
  shell.on("error", () => fail("Native vocabulary process failed to start or communicate"));
  shell.on("pythonError", () => fail(`Native vocabulary Python processing failed${pythonFailureType ? ` (${pythonFailureType})` : ""}`));
  shell.on("stderr", (line: string) => {
    const match = line.match(/^Native vocabulary worker failed: ([A-Za-z][A-Za-z0-9_]*)$/);
    if (match) pythonFailureType = match[1];
  });
  shell.stdin.on("error", () => fail("Native vocabulary stdin failed"));
  shell.stdout.on("data", (data: Buffer | string) => {
    outputBytes += Buffer.byteLength(data);
    if (outputBytes > 32 * 1024 * 1024) fail("Native vocabulary output exceeds byte limit");
  });
  shell.stderr.on("data", (data: Buffer | string) => {
    stderrBytes += Buffer.byteLength(data);
    if (stderrBytes > 64 * 1024) fail("Native vocabulary diagnostics exceed byte limit");
  });
  shell.on("message", (line: string) => {
    try {
      const value: unknown = JSON.parse(line);
      if (!pending || !value || typeof value !== "object" || Array.isArray(value)) {
        fail("Invalid or unsolicited native vocabulary response");
        return;
      }
      const waiting = pending;
      pending = undefined;
      waiting.resolve(value as Record<string, unknown>);
    } catch {
      fail("Native vocabulary returned malformed JSON");
    }
  });
  const closed = new Promise<void>((resolve) => {
    shell.childProcess.once("close", (code, signal) => {
      if (code !== 0 || signal || pending) fail("Native vocabulary process exited before successful completion");
      resolve();
    });
  });
  const timer = setTimeout(() => fail("Native vocabulary processing timed out"), options.timeoutMs ?? 720_000);
  const request = (message: object) => new Promise<Record<string, unknown>>((resolve, reject) => {
    if (failure) return reject(failure);
    pending = { resolve, reject };
    shell.send(JSON.stringify(message));
  });
  try {
    const ready = await request({ type: "start", language });
    if (ready.type !== "ready" || ready.version !== NATIVE_SELECTOR_VERSION) {
      throw new Error("Native vocabulary worker version mismatch");
    }
    let chunks = 0;
    let splitSentences = 0;
    const glossary: ReturnType<typeof sourceDefinitions> = [];
    for await (const page of pages) {
      glossary.push(...sourceDefinitions([page]));
      for (const chunk of chunkVocabularyPage(page, language)) {
        if (chunk.splitSentence) splitSentences += 1;
        const ack = await request({ type: "chunk", page: page.pageNumber, text: chunk.text });
        chunks += 1;
        if (ack.type !== "chunk" || ack.index !== chunks) throw new Error("Native vocabulary chunk acknowledgement mismatch");
      }
    }
    const definitions = new Map<string, typeof glossary[number]>();
    for (const entry of glossary) {
      const key = entry.term.normalize("NFKC").toLowerCase();
      if (!definitions.has(key)) definitions.set(key, entry);
    }
    const uniqueGlossary = [...definitions.values()];
    const result = await request({ type: "finish", glossary: uniqueGlossary });
    if (result.type !== "result" || result.version !== NATIVE_SELECTOR_VERSION || result.chunks !== chunks) {
      throw new Error("Native vocabulary result metadata mismatch");
    }
    const candidates = parseCandidates(result.candidates);
    shell.end((error) => { if (error) fail("Native vocabulary Python process failed"); });
    await closed;
    if (failure) throw failure;
    return { version: NATIVE_SELECTOR_VERSION, language, chunks, splitSentences, candidates };
  } catch (error) {
    shell.kill("SIGKILL");
    await closed;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
