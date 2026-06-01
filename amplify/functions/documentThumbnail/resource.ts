import { defineFunction } from "@aws-amplify/backend";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Document Thumbnail Lambda function resource
 *
 * Uses a LibreOffice Lambda layer to convert documents (Word, Excel, PowerPoint,
 * ODF, etc.) to PDF, then renders page 1 as a WebP thumbnail via Sharp.
 *
 * Handles:
 * - processDocumentThumbnail(fileID) GraphQL mutation — explicit document processing
 * - S3 EventBridge events — auto-triggers on document uploads
 *
 * Output: protected/{identityId}/{fileId}/thumbnail.webp
 *
 * LibreOffice layer: shelfio/libreoffice-lambda-layer (public ARN)
 *
 * Uses the provider overload of defineFunction for full CDK bundling control,
 * which allows externalizing sharp and installing its Linux-native binaries.
 */
export const documentThumbnailHandler = defineFunction(
  (scope) => {
    const libreofficeLayer = LayerVersion.fromLayerVersionArn(
      scope,
      "libreoffice-layer",
      "arn:aws:lambda:us-east-1:764866452798:layer:libreoffice-brotli:1",
    );

    return new NodejsFunction(scope, "documentThumbnail-lambda", {
      entry: join(__dirname, "handler.ts"),
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(300),
      memorySize: 1536,
      layers: [libreofficeLayer],
      bundling: {
        format: OutputFormat.ESM,
        banner:
          'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
        minify: true,
        sourceMap: true,
        externalModules: ["sharp", "libreoffice"],
        loader: { ".node": "file" },
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cd "${outputDir}" && echo '{"type":"module"}' > package.json && npm install --cpu=x64 --os=linux --libc=glibc sharp`,
          ],
        },
      },
    });
  },
  { resourceGroupName: "data" },
);
