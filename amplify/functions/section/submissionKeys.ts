/**
 * A submission key an instructor may get a signed URL for: it must sit under
 * the grade owner's private prefix (private/{identityId}/) and contain no
 * "." or ".." path segments.
 */
export function isAllowedSubmissionKey(
  key: unknown,
  expectedPrefix: string,
): key is string {
  return (
    typeof key === "string" &&
    expectedPrefix.length > 0 &&
    key.startsWith(expectedPrefix) &&
    !key.split("/").some((part) => part === ".." || part === ".")
  );
}
