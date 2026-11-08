import { runNativeSelection } from "./pythonBridge.js";
import type { VocabularyLanguage } from "./protocol.js";
import { ensureStanzaModels, modelPrefix, releaseName } from "./modelAssets.js";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { join } from "node:path";
import { S3Client } from "@aws-sdk/client-s3";

const samples: Array<{ language: VocabularyLanguage; term: string; definition: string; sentence: string }> = [
  { language: "es", term: "Membrana", definition: "Una capa que rodea la célula.", sentence: "La membrana regula el transporte." },
  { language: "fr", term: "Membrane", definition: "Une couche qui entoure la cellule.", sentence: "La membrane régule le transport." },
  { language: "de", term: "Membran", definition: "Eine Schicht, die die Zelle umgibt.", sentence: "Die Membran reguliert den Transport." },
  { language: "pt", term: "Membrana", definition: "Uma camada que envolve a célula.", sentence: "A membrana regula o transporte." },
  { language: "it", term: "Membrana", definition: "Uno strato che circonda la cellula.", sentence: "La membrana regola il trasporto." },
  { language: "zh", term: "细胞膜", definition: "包围细胞的一层薄膜。", sentence: "细胞膜控制物质运输。" },
  { language: "ja", term: "細胞膜", definition: "細胞を囲む薄い膜。", sentence: "細胞膜は物質の輸送を制御する。" },
  { language: "ar", term: "الغشاء", definition: "طبقة تحيط بالخلية.", sentence: "ينظم الغشاء نقل المواد." },
];

async function main() {
  try {
    await access("/opt/stanza_resources");
    throw new Error("Smoke image must not contain baked-in Stanza models");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  let requests: string[] = [];
  let activeLanguage: VocabularyLanguage = "es";
  // Exercise the real SDK's serialization/stream handling with a network-free object fixture.
  const s3 = new S3Client({
    region: "us-east-1", credentials: { accessKeyId: "fixture", secretAccessKey: "fixture" },
    requestHandler: {
      async handle(request: { path: string }) {
        const key = decodeURIComponent(request.path).replace(/^\//, "");
        if (!key.startsWith(modelPrefix(activeLanguage))) throw new Error("Smoke requested another language");
        requests.push(key);
        const path = join("/model-fixtures", releaseName(activeLanguage), key.slice(modelPrefix(activeLanguage).length));
        return { response: { statusCode: 200, headers: { "content-length": String((await stat(path)).size) },
          body: createReadStream(path) } };
      },
    },
  });
  for (const sample of samples) {
    activeLanguage = sample.language;
    requests = [];
    const modelDirectory = await ensureStanzaModels(s3, "fixture-bucket", sample.language);
    if (requests.length < 2) throw new Error("Smoke did not exercise a cold S3 model download");
    const coldRequests = requests.length;
    if (await ensureStanzaModels(s3, "fixture-bucket", sample.language) !== modelDirectory ||
        requests.length !== coldRequests) throw new Error("Verified model cache was not reused");
    const text = `${sample.term} - ${sample.definition}\n${sample.sentence} `.repeat(450);
    async function* pages() { yield { pageNumber: 3, text }; }
    const result = await runNativeSelection(pages(), sample.language, { timeoutMs: 120_000, modelDirectory });
    const explicit = result.candidates.find(({ term }) => term === sample.term);
    if (result.chunks < 2 || explicit?.sourceDefinition !== sample.definition ||
        explicit.page !== 3 || !text.includes(explicit.sourceText)) {
      throw new Error(`Native smoke validation failed for ${sample.language}`);
    }
    console.info(`${sample.language}: ${result.chunks} chunks, ${result.candidates.length} grounded candidates; ${coldRequests} S3 reads, verified warm cache`);
  }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
