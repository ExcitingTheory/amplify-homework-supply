import { defineFunction } from "@aws-amplify/backend";
import { Duration, Size } from "aws-cdk-lib";
import { Architecture, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { nativeVocabularyImageCode } from "./imageCode";

export const nativeVocabularyHandler = defineFunction((scope) => new DockerImageFunction(
  scope, "native-vocabulary-container", {
    code: nativeVocabularyImageCode(scope),
    architecture: Architecture.X86_64,
    timeout: Duration.seconds(840),
    memorySize: 3072,
    ephemeralStorageSize: Size.mebibytes(4096),
  },
), { resourceGroupName: "data" });
