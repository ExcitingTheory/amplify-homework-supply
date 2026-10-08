"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { onError, getMessageFallback } from "../../src/i18n/errorHandling";

/**
 * Client-side wrapper around NextIntlClientProvider.
 *
 * `onError`/`getMessageFallback` must be imported here (inside a Client
 * Component module) rather than passed in as props from the Server
 * Component layout. Passing plain functions as props across the
 * server/client boundary fails during static prerendering with
 * "Event handlers cannot be passed to Client Component props" — functions
 * aren't serializable in the RSC payload. Importing them directly in this
 * client module avoids that boundary crossing entirely.
 */
export default function IntlProviderClient({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={onError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}
