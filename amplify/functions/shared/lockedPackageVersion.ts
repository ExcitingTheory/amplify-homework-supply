import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Resolves the exact version of a package from the root package-lock.json.
 *
 * Lambdas that keep a native module out of the esbuild bundle install it
 * separately at build time; reading the lockfile keeps that install on the
 * same version the rest of the repo resolved.
 */
export function lockedPackageVersion(name: string): string {
  const lockPath = join(repoRoot, "package-lock.json");
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const version = lock.packages?.[`node_modules/${name}`]?.version;
  if (!version) {
    throw new Error(`${name} not found in ${lockPath}`);
  }
  return version;
}

/** Absolute path of a directory under the repo's public/ folder. */
export function publicAssetDir(...segments: string[]): string {
  return join(repoRoot, "public", ...segments);
}
