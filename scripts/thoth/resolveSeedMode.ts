export type ThothSeedMode = "live" | "snapshot" | "off";

export function resolveThothSeedMode(
  requestedMode: string | undefined,
  hasSnapshot: boolean,
): ThothSeedMode {
  if (requestedMode === undefined || requestedMode === "") {
    return hasSnapshot ? "snapshot" : "live";
  }
  if (
    requestedMode === "live" ||
    requestedMode === "snapshot" ||
    requestedMode === "off"
  ) {
    return requestedMode;
  }
  throw new Error(
    `Invalid SEED_THOTH_MODE "${requestedMode}"; expected live, snapshot, or off`,
  );
}
