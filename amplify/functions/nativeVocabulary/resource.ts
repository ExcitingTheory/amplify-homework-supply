import { defineFunction } from "@aws-amplify/backend";
import { Duration, Size } from "aws-cdk-lib";
import { Architecture, DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { fileURLToPath } from "node:url";

export const nativeVocabularyHandler = defineFunction((scope) => new DockerImageFunction(
  scope, "native-vocabulary-container", {
    code: DockerImageCode.fromImageAsset(fileURLToPath(new URL("../../../", import.meta.url)), {
      file: "amplify/functions/nativeVocabulary/Dockerfile",
      platform: Platform.LINUX_AMD64,
      exclude: ["node_modules", ".git", ".next", "test-results", ".env*", ".amplify", ".native-vocabulary-models"],
    }),
    architecture: Architecture.X86_64,
    timeout: Duration.seconds(840),
    memorySize: 3072,
    ephemeralStorageSize: Size.mebibytes(4096),
  },
), { resourceGroupName: "data" });
