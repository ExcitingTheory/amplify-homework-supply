import { Repository } from "aws-cdk-lib/aws-ecr";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { DockerImageCode } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import { fileURLToPath } from "node:url";

export function nativeVocabularyImageCode(scope: Construct, env: NodeJS.ProcessEnv = process.env): DockerImageCode {
  const digest = env.NATIVE_VOCABULARY_IMAGE_DIGEST;
  if (digest !== undefined) {
    if (!/^sha256:[a-f0-9]{64}$/.test(digest)) {
      throw new Error("NATIVE_VOCABULARY_IMAGE_DIGEST must be an immutable sha256 image digest.");
    }
    const repository = Repository.fromRepositoryName(
      scope, "native-vocabulary-image",
      env.NATIVE_VOCABULARY_IMAGE_REPOSITORY ?? "homework-native-vocabulary",
    );
    return DockerImageCode.fromEcr(repository, { tagOrDigest: digest });
  }
  if (env.AWS_APP_ID) {
    throw new Error("Amplify pipeline builds require NATIVE_VOCABULARY_IMAGE_DIGEST. Run the deployment wrapper after publishing the commit's image.");
  }
  return DockerImageCode.fromImageAsset(fileURLToPath(new URL("../../../", import.meta.url)), {
    file: "amplify/functions/nativeVocabulary/Dockerfile",
    platform: Platform.LINUX_AMD64,
    exclude: ["node_modules", ".git", ".next", "test-results", ".env*", ".amplify", ".native-vocabulary-models"],
  });
}
