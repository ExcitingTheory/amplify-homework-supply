import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { routing } from "../../src/i18n/routing";
import Providers from "../providers";
import IntlProviderClient from "./IntlProviderClient";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Async server component that loads messages and renders the full provider tree.
 * Placed inside Suspense so getMessages() doesn't block the initial shell.
 */
async function LocaleContent({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const messages = await getMessages();
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") || undefined;

  return (
    <IntlProviderClient locale={locale} messages={messages}>
      <Providers nonce={nonce}>{children}</Providers>
    </IntlProviderClient>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // No outer Suspense here: PPR isn't enabled in next.config.mjs, so this
  // boundary added no streaming benefit and instead raced with dev-mode HMR,
  // intermittently rendering IntlProviderClient/Providers as undefined.
  return <LocaleContent locale={locale}>{children}</LocaleContent>;
}
