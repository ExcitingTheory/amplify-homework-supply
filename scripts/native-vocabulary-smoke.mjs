import { build } from "esbuild";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

await mkdir(".native-vocabulary-models", { recursive: true });
const directory = await mkdtemp(resolve(".native-vocabulary-models/smoke-"));
try {
  const outfile = join(directory, "smoke.cjs");
  const cache = join(directory, "cache");
  await mkdir(cache);
  await chmod(cache, 0o777);
  await build({
    entryPoints: ["amplify/functions/nativeVocabulary/smoke.ts"], outfile,
    bundle: true, platform: "node", target: "node22", format: "cjs",
  });
  const result = spawnSync("docker", [
    "run", "--rm", "--user", "1000:1000", "--memory", "3g",
    "--network", "none", "--read-only",
    "--mount", `type=bind,source=${cache},target=/tmp`,
    "--mount", `type=bind,source=${outfile},target=/var/task/smoke.cjs,readonly`,
    "--mount", `type=bind,source=${resolve(process.env.STANZA_MODEL_FIXTURES ?? ".native-vocabulary-models/releases")},target=/model-fixtures,readonly`,
    "--entrypoint", "node", process.env.NATIVE_VOCABULARY_IMAGE ?? "homework-native-vocabulary:local", "/var/task/smoke.cjs",
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true });
}
