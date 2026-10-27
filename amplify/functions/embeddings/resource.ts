import { defineFunction } from "@aws-amplify/backend";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lockedPackageVersion } from "../shared/lockedPackageVersion";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The Lambda installs onnxruntime-node separately (it is externalized from the
// bundle), so pin it to the exact version the root lockfile resolved.
const ONNXRUNTIME_VERSION = lockedPackageVersion("onnxruntime-node");
// transformers.js imports sharp when it loads (for image pipelines), and sharp
// cannot be bundled: its native binary is a separate optional package.
const SHARP_VERSION = lockedPackageVersion("sharp");

/**
 * Embeddings Lambda function resource
 *
 * Handles:
 * - Generate text embeddings (single and batch) using MiniLM 384D
 * - Create embeddings for semantic search (offline-compatible)
 * - Support vector database operations
 *
 * Authorization: All authenticated users (documents they own)
 * Cognito Operations: getUser
 *
 * Uses the provider overload of defineFunction so onnxruntime-node can be
 * kept out of the esbuild bundle. It loads its native addon through a
 * computed require path, which esbuild cannot bundle; bundling it makes
 * `listSupportedBackends` undefined and crashes the function at init.
 * onnxruntime-common is externalized too so transformers and the native
 * addon share one Tensor class. sharp is externalized for the same reason as
 * the native addon: transformers loads it at import time.
 */

export const embeddingsHandler = defineFunction(
  (scope) =>
    new NodejsFunction(scope, "embeddings-lambda", {
      entry: join(__dirname, "handler.ts"),
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(300),
      memorySize: 1024,
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
          // --ignore-scripts skips onnxruntime-node's postinstall, which
          // downloads ~300MB of unused CUDA providers on linux/x64. The
          // package already ships the CPU binaries; drop the other platforms.
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cd "${outputDir}" && echo '{"type":"module"}' > package.json && npm install --cpu=x64 --os=linux --libc=glibc --ignore-scripts onnxruntime-node@${ONNXRUNTIME_VERSION} sharp@${SHARP_VERSION} && rm -rf node_modules/onnxruntime-node/bin/napi-v3/darwin node_modules/onnxruntime-node/bin/napi-v3/win32 node_modules/onnxruntime-node/bin/napi-v3/linux/arm64`,
          ],
        },
      },
    }),
  { resourceGroupName: "data" },
);
