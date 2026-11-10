// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("native vocabulary runtime smoke diagnostics", () => {
  it("supplies the handler and JSON invocation headers expected by the runtime client", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "native-runtime-smoke-"));
    directories.push(directory);
    writeFileSync(path.join(directory, "docker"), `#!${process.execPath}
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pidFile = path.join(__dirname, "container.pid");
if (process.argv[2] === "stop") {
  process.kill(Number(fs.readFileSync(pidFile, "utf8")), "SIGTERM");
} else {
  fs.writeFileSync(pidFile, String(process.pid));
  const args = process.argv.slice(3);
  const env = Object.fromEntries(args.flatMap((arg, index) =>
    arg === "-e" ? [args[index + 1].split(/=(.*)/s, 2)] : []));
  assert.equal(env._HANDLER, "handler.handler");
  for (const key of ["AWS_LAMBDA_FUNCTION_NAME", "AWS_LAMBDA_FUNCTION_VERSION",
    "AWS_LAMBDA_FUNCTION_MEMORY_SIZE", "AWS_LAMBDA_LOG_GROUP_NAME", "AWS_LAMBDA_LOG_STREAM_NAME"]) {
    assert(env[key], "Missing runtime context: " + key);
  }
  const endpoint = args.find(arg => arg.startsWith("AWS_LAMBDA_RUNTIME_API="));
  const port = endpoint.split(":").at(-1);
  const base = "http://127.0.0.1:" + port + "/2018-06-01/runtime/invocation/";
  const keepAlive = setInterval(() => {}, 1000);
  (async () => {
    const response = await fetch(base + "next");
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.deepEqual(await response.json(), { manifestKey: "invalid" });
    await fetch(base + "runtime-smoke/error", {
      method: "POST",
      body: JSON.stringify({ errorMessage: "Invalid native vocabulary artifact key" }),
    });
  })().catch(error => {
    console.error(error);
    clearInterval(keepAlive);
    process.exitCode = 1;
  });
}
`, { mode: 0o755 });

    const result = spawnSync(process.execPath, ["scripts/native-vocabulary-runtime-smoke.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}` },
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Lambda runtime dispatched the invocation");
  });

  it("reports startup stderr without trying to stop an already exited container", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "native-runtime-smoke-"));
    directories.push(directory);
    writeFileSync(path.join(directory, "docker"), `#!/bin/sh
if [ "$1" = "run" ]; then
  echo "runtime entrypoint failed" >&2
  exit 42
fi
echo "cleanup should not run" >&2
exit 1
`, { mode: 0o755 });

    const result = spawnSync(process.execPath, ["scripts/native-vocabulary-runtime-smoke.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}` },
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Container exited 42: runtime entrypoint failed");
    expect(result.stderr).not.toContain("cleanup should not run");
  });
});
