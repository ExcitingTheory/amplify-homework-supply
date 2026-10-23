import { createHash } from "node:crypto";

export function assertSourcePdfSha256(
  pdfBytes: Uint8Array,
  expectedSha256: string,
): string {
  const actualSha256 = createHash("sha256").update(pdfBytes).digest("hex");

  if (actualSha256 !== expectedSha256.toLowerCase()) {
    throw new Error(
      `Source PDF SHA-256 mismatch: expected ${expectedSha256}, received ${actualSha256}`,
    );
  }

  return actualSha256;
}
