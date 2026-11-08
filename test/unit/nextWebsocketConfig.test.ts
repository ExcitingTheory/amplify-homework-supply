import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function websocketUrl(override: string) {
  return execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'const { default: config } = await import("./next.config.mjs"); console.log(config.env.NEXT_PUBLIC_YJS_WS_URL)',
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_YJS_WS_URL: override,
      },
    },
  ).trim();
}

describe("development WebSocket configuration", () => {
  it("uses the local TLS server even when cloud outputs exist", () => {
    expect(websocketUrl("")).toBe("wss://localhost:3001");
  });

  it("honors an explicit endpoint", () => {
    expect(websocketUrl("wss://example.test/socket")).toBe(
      "wss://example.test/socket",
    );
  });
});
