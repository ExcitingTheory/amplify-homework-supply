// Shared next-intl onError/getMessageFallback so missing keys are logged in a
// consistent, greppable format from both server (request.ts) and client
// (NextIntlClientProvider in layout.tsx) translation calls.

export function onError(error: { code?: string; message: string }): void {
  if (error.code === "MISSING_MESSAGE") {
    console.error(`[i18n] ${error.message}`);
    return;
  }
  console.error(error);
}

export function getMessageFallback({
  namespace,
  key,
}: {
  namespace?: string;
  key: string;
}): string {
  return [namespace, key].filter(Boolean).join(".");
}
