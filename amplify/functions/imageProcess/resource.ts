import { defineFunction } from "@aws-amplify/backend";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Image Processing Lambda function resource
 *
 * Handles:
 * - processFileImage(fileID) GraphQL mutation — explicit image processing
 * - S3 EventBridge events — auto-triggers on image uploads
 *
 * Generates responsive image variants using Sharp:
 * - thumbnail (150px wide, WebP)
 * - small (320px wide, WebP)
 * - medium (640px wide, WebP)
 * - large (1280px wide, WebP)
 *
 * Output path: protected/{identityId}/{fileId}/thumbnail.webp
 * Also handles PDF first-page thumbnail generation.
 *
 * Uses the provider overload of defineFunction for full CDK bundling control,
 * which allows externalizing sharp and installing its Linux-native binaries.
 */
export const imageProcessHandler = defineFunction(
  (scope) =>
    new NodejsFunction(scope, "imageProcess-lambda", {
      entry: join(__dirname, "handler.ts"),
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(120),
      memorySize: 1024,
      bundling: {
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
        minify: true,
        sourceMap: true,
        externalModules: ["sharp"],
        loader: { ".node": "file" },
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cd "${outputDir}" && echo '{"type":"module"}' > package.json && npm install --cpu=x64 --os=linux --libc=glibc sharp`,
          ],
        },
      },
    }),
  { resourceGroupName: "data" },
);
