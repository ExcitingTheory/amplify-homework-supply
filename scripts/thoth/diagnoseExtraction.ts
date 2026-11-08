import { readFile, writeFile } from "node:fs/promises";
import {
  diagnoseExtraction, passesGate, scoreExtractionByContent, type ExtractionInput, type ThothGroundTruth,
} from "../../test/integration/thoth/scoreExtraction";

async function main() {
  const [capturePath, outputPath] = process.argv.slice(2);
  if (!capturePath) throw new Error("Usage: npx tsx scripts/thoth/diagnoseExtraction.ts <capture.json> [report.json]");
  const groundTruth: ThothGroundTruth = JSON.parse(await readFile("test/fixtures/thoth/thoth-ground-truth.json", "utf8"));
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  if (capture.sourceSha256 !== groundTruth.source.sha256) throw new Error("Capture source SHA does not match the benchmark");
  if (!Array.isArray(capture.questionsJSON) || !Array.isArray(capture.vocabularyJSON)) {
    throw new Error("Capture must contain questionsJSON and vocabularyJSON arrays");
  }
  const extracted: ExtractionInput = { questions: capture.questionsJSON, words: capture.vocabularyJSON };
  const report = diagnoseExtraction(groundTruth, extracted);
  const content = scoreExtractionByContent(groundTruth, extracted);
  const summary = {
    capture: capturePath, sourceSha256: capture.sourceSha256, questions: extracted.questions.length,
    strictFactRecall: report.strict.factRecall, strictVocabRecall: report.strict.vocabRecall,
    passesStrictGate: passesGate(report.strict), missingFacts: report.strict.missingFacts.length,
    bestCandidateMismatchCounts: report.counts,
    content: {
      totalFacts: content.totalFacts, counts: content.counts, anchoredRecall: content.anchoredRecall,
      answeredRecall: content.answeredRecall, sourcedRecall: content.sourcedRecall,
    },
    note: "Diagnostic counts overlap and do not award recall credit or establish semantic equivalence.",
  };
  if (outputPath) await writeFile(outputPath, `${JSON.stringify({ ...summary, ...report, contentMisses: content.misses }, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
