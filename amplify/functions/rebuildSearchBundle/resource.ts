import { defineFunction } from "@aws-amplify/backend";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lockedPackageVersion } from "../shared/lockedPackageVersion";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// onnxruntime-node and sharp are native modules that esbuild cannot bundle;
// install them next to the bundle at the version the root lockfile pins.
const ONNXRUNTIME_VERSION = lockedPackageVersion("onnxruntime-node");
const SHARP_VERSION = lockedPackageVersion("sharp");

/**
 * Rebuild Search Bundle Lambda
 *
 * Assembles embedding bundles for client-side semantic search:
 * - search-index/unit/{unitId}.json                         (per unit)
 * - search-index/section/{sectionId}.json                   (per section)
 * - private/{identityId}/search-index/instructor.json       (per instructor)
 * - admin/search-index/platform.json                        (all instructors)
 *
 * Triggered by:
 * - publishUnit (source "unit-publish"): the unit's bundle plus the merged
 *   bundle of each section assigning it
 * - S3 embedding-file changes via SQS (incremental update of the affected
 *   instructor/platform bundles; see backend.ts and applyEmbeddingChanges)
 * - A nightly EventBridge schedule (source "platform-reindex") that reconciles
 *   everything from the per-item files
 * - scripts/rebuild-search-bundles.ts (manual reindex)
 *
 * Unit and section bundles have no client storage rule on purpose: they are
 * served by /api/search-bundle, which checks enrollment/ownership first.
 *
 * Reads per-item embedding files from S3, generates any missing vectors with
 * MiniLM (384D) running locally, and writes bundles with IVF/HNSW pre-indexing
 * for larger item counts. It uses the same provider-style resource as the
 * embeddings Lambda so the native ONNX runtime stays out of the esbuild bundle.
 */
export const rebuildSearchBundleHandler = defineFunction(
  (scope) =>
    new NodejsFunction(scope, "rebuild-search-bundle-lambda", {
      entry: join(__dirname, "handler.ts"),
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(900),
      memorySize: 2048,
      bundling: {
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
        minify: true,
        sourceMap: true,
        externalModules: ["onnxruntime-node", "onnxruntime-common", "sharp"],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cd "${outputDir}" && echo '{"type":"module"}' > package.json && npm install --cpu=x64 --os=linux --libc=glibc --ignore-scripts onnxruntime-node@${ONNXRUNTIME_VERSION} sharp@${SHARP_VERSION} && rm -rf node_modules/onnxruntime-node/bin/napi-v3/darwin node_modules/onnxruntime-node/bin/napi-v3/win32 node_modules/onnxruntime-node/bin/napi-v3/linux/arm64`,
          ],
        },
      },
    }),
  { resourceGroupName: "data" },
);
