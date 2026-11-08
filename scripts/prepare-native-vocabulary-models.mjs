import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { download: { type: "boolean" } } });
const source = resolve(".native-vocabulary-models/source");
const languages = ["es", "fr", "de", "pt", "it", "zh-hans", "ja", "ar"];

function docker(args) {
  const result = spawnSync("docker", args, { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker ${args[0]} failed (exit ${result.status})`);
  return result.stdout.trim();
}

async function validate(directory) {
  await access(join(directory, "resources.json"));
  for (const language of languages) await access(join(directory, language));
}

async function main() {
  try {
    await access(source);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(resolve(".native-vocabulary-models"), { recursive: true });
    const staging = await mkdtemp(resolve(".native-vocabulary-models/preparing-"));
    try {
      if (values.download) {
        docker([
          "run", "--rm", "--entrypoint", "/bin/sh",
          "--mount", `type=bind,source=${staging},target=/models`,
          "--mount", `type=bind,source=${resolve("amplify/functions/nativeVocabulary/download_models.py")},target=/download_models.py,readonly`,
          "-e", "STANZA_RESOURCES_DIR=/models", "homework-native-vocabulary:local",
          "-c", "env -u LD_LIBRARY_PATH python3.12 /download_models.py",
        ]);
      } else {
        const container = docker(["create", "homework-native-vocabulary:with-models-v1"]);
        try {
          docker(["cp", `${container}:/opt/stanza_resources/.`, staging]);
        } finally {
          docker(["rm", container]);
        }
      }
      await validate(staging);
      await rename(staging, source);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
  await validate(source);
  console.info(`Model source ready: ${source}`);
}

main().catch((error) => {
  console.error(error);
  console.error("For a fresh download, build the runtime image, then run npm run native-vocabulary:models:prepare -- --download.");
  process.exitCode = 1;
});
