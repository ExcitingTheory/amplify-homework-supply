import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/plugin", () => ({
  default: () => (config: unknown) => config,
}));
vi.mock("@next/bundle-analyzer", () => ({
  default: () => (config: unknown) => config,
}));

const platformDescriptor = Object.getOwnPropertyDescriptor(
  process,
  "platform",
)!;
const archDescriptor = Object.getOwnPropertyDescriptor(process, "arch")!;

afterEach(() => {
  Object.defineProperty(process, "platform", platformDescriptor);
  Object.defineProperty(process, "arch", archDescriptor);
});

describe("standalone native runtime tracing", () => {
  it.each([
    ["darwin", "x64"],
    ["darwin", "arm64"],
    ["linux", "x64"],
    ["linux", "arm64"],
    ["win32", "x64"],
  ])("retains ONNX native binaries for %s/%s", async (platform, arch) => {
    vi.resetModules();
    Object.defineProperty(process, "platform", { value: platform });
    Object.defineProperty(process, "arch", { value: arch });
    const config = (await import("../../next.config.mjs")).default;
    expect(config.outputFileTracingIncludes["/*"]).toContain(
      `./node_modules/onnxruntime-node/bin/napi-v3/${platform}/${arch}/*`,
    );
    const excluded = config.outputFileTracingExcludes["/*"];
    expect(excluded).not.toContain(
      `./node_modules/**/onnxruntime-node/bin/napi-v3/${platform}/**`,
    );
    expect(excluded).not.toContain(
      `./node_modules/**/onnxruntime-node/bin/napi-v3/${platform}/${arch}/**`,
    );
    if (platform === "linux" && arch === "x64") {
      expect(excluded).toContain(
        "./node_modules/**/onnxruntime-node/bin/napi-v3/darwin/**",
      );
      expect(excluded).toContain(
        "./node_modules/**/onnxruntime-node/bin/napi-v3/win32/**",
      );
      expect(excluded).toContain(
        "./node_modules/**/onnxruntime-node/bin/napi-v3/linux/arm64/**",
      );
    }
    expect(excluded).toContain("./node_modules/**/onnxruntime-web/**");
  });
});
