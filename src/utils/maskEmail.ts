/**
 * Hides the middle of an email's local part, keeping the first and last
 * characters and the domain: "alice@example.com" → "a…e@example.com".
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  const local = at === -1 ? email : email.slice(0, at);
  const domain = at === -1 ? "" : email.slice(at);
  if (!local) return email;
  const masked =
    local.length <= 2
      ? `${local[0]}…`
      : `${local[0]}…${local[local.length - 1]}`;
  return `${masked}${domain}`;
}
