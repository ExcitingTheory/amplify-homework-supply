
// @ts-expect-error next-intl types mismatch under bundler resolution
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ViewTransition } from 'react';
import { routing } from '../../src/i18n/routing';
import Providers from '../providers';

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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <Suspense>
          <ViewTransition>{children}</ViewTransition>
        </Suspense>
      </Providers>
    </NextIntlClientProvider>
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

  return (
    <Suspense fallback={null}>
      <LocaleContent locale={locale}>{children}</LocaleContent>
    </Suspense>
  );
}
