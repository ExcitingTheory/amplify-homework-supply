export function resolveRetryEnabled(
  unitOverride?: boolean | null,
  sectionDefault?: boolean | null,
): boolean {
  return unitOverride ?? sectionDefault ?? true;
}
