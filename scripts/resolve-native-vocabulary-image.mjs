import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function resolveNativeVocabularyImage(env = process.env, run = execFileSync) {
  const commit = env.AWS_COMMIT_ID;
  if (!commit || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error("AWS_COMMIT_ID must identify the full commit built by the native vocabulary image workflow.");
  }
  const repository = env.NATIVE_VOCABULARY_IMAGE_REPOSITORY ?? "homework-native-vocabulary";
  const digest = run("aws", [
    "ecr", "describe-images",
    "--region", env.AWS_REGION || env.AWS_DEFAULT_REGION || "us-east-1",
    "--repository-name", repository,
    "--image-ids", `imageTag=${commit}`,
    "--query", "imageDetails[0].imageDigest",
    "--output", "text",
  ], { encoding: "utf8", env: { ...env, AWS_PAGER: "" }, stdio: ["ignore", "pipe", "inherit"] }).trim();
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`ECR returned no valid image digest for ${repository}:${commit}. Publish the image before deploying.`);
  }
  return digest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(resolveNativeVocabularyImage());
}
