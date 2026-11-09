// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { nativeVocabularyImageCode } from "../../amplify/functions/nativeVocabulary/imageCode";
import { resolveNativeVocabularyImage } from "../../scripts/resolve-native-vocabulary-image.mjs";

const digest = `sha256:${"a".repeat(64)}`;
const commit = "b".repeat(40);

describe("commit-pinned native vocabulary deployment", () => {
  it("resolves only the current commit's ECR tag and propagates publication failures", () => {
    const run = vi.fn().mockReturnValue(`${digest}\n`);
    expect(resolveNativeVocabularyImage({ AWS_COMMIT_ID: commit }, run)).toBe(digest);
    expect(run).toHaveBeenCalledWith("aws", expect.arrayContaining([
      "describe-images", "--image-ids", `imageTag=${commit}`,
    ]), expect.anything());
    run.mockImplementation(() => { throw new Error("ImageNotFoundException"); });
    expect(() => resolveNativeVocabularyImage({ AWS_COMMIT_ID: commit }, run))
      .toThrow("ImageNotFoundException");
  });

  it("rejects absent commits and invalid registry responses instead of using latest", () => {
    const run = vi.fn().mockReturnValue("None\n");
    expect(() => resolveNativeVocabularyImage({}, run)).toThrow("AWS_COMMIT_ID");
    expect(run).not.toHaveBeenCalled();
    expect(() => resolveNativeVocabularyImage({ AWS_COMMIT_ID: commit }, run)).toThrow("no valid image digest");
  });

  it("synthesizes an ECR digest without adding a Docker build asset", () => {
    const app = new App();
    const stack = new Stack(app, "ImageTest", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    new DockerImageFunction(stack, "native-vocabulary-container", {
      code: nativeVocabularyImageCode(stack, {
        AWS_APP_ID: "test",
        NATIVE_VOCABULARY_IMAGE_DIGEST: digest,
      }),
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Code: { ImageUri: `123456789012.dkr.ecr.us-east-1.amazonaws.com/homework-native-vocabulary@${digest}` },
      PackageType: "Image",
    });
    const assembly = app.synth();
    const manifest = assembly.artifacts.find((artifact) => artifact.id === `${stack.artifactId}.assets`);
    expect(manifest?.contents.dockerImages ?? {}).toEqual({});
  });

  it("fails closed in Amplify without a digest or with a mutable image tag", () => {
    const stack = new Stack(new App(), "InvalidImage");
    expect(() => nativeVocabularyImageCode(stack, { AWS_APP_ID: "test" }))
      .toThrow("require NATIVE_VOCABULARY_IMAGE_DIGEST");
    expect(() => nativeVocabularyImageCode(stack, { NATIVE_VOCABULARY_IMAGE_DIGEST: "latest" }))
      .toThrow("immutable sha256");
  });
});
