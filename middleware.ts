import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import outputs from "./amplify_outputs.json";

const LOCALES = ["en", "es", "fr", "de", "ja", "zh"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

const PUBLIC_ROUTES = ["/privacy", "/offline"];

function isAuthenticated(request: NextRequest): boolean {
  const clientId = outputs.auth?.user_pool_client_id;
  if (!clientId) return false;

  const lastAuthUserKey = `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`;
  const lastAuthUser = request.cookies.get(lastAuthUserKey);

  if (lastAuthUser?.value) return true;

  const allCookies = request.cookies.getAll();
  return allCookies.some(
    (c) =>
      c.name.startsWith("CognitoIdentityServiceProvider.") &&
      c.name.endsWith(".LastAuthUser") &&
      c.value.length > 0,
  );
}

function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

function getPathWithoutLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (
    cookieLocale &&
    LOCALES.includes(cookieLocale as (typeof LOCALES)[number])
  ) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((part) => {
        const [lang, q] = part.trim().split(";q=");
        return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1.0 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of preferred) {
      const exact = LOCALES.find((l) => l === lang);
      if (exact) return exact;
      const prefix = LOCALES.find((l) => lang.startsWith(`${l}-`));
      if (prefix) return prefix;
    }
  }

  return DEFAULT_LOCALE;
}

function addRequestHeaders(
  response: NextResponse,
  locale: string,
  nonce: string,
  cspHeader: string,
): NextResponse {
  response.headers.set("x-locale", locale);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const nonce = crypto.randomUUID();
  const unsafeEval =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${unsafeEval}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://*.amazonaws.com https://*.cloudfront.net`,
    `media-src 'self' blob: https://*.amazonaws.com https://*.cloudfront.net`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com wss://*.amazonaws.com https://*.cloudfront.net https://api.openai.com wss://localhost:*`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");

  if (pathnameLocale === DEFAULT_LOCALE) {
    const cleanUrl = new URL(pathWithoutLocale || "/", request.url);
    cleanUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(cleanUrl);
    return addRequestHeaders(response, DEFAULT_LOCALE, nonce, cspHeader);
  }

  if (pathnameLocale) {
    if (!isPublicRoute(pathWithoutLocale) && pathWithoutLocale !== "/") {
      if (!isAuthenticated(request)) {
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("returnUrl", pathname);
        const response = NextResponse.redirect(loginUrl);
        return addRequestHeaders(response, pathnameLocale, nonce, cspHeader);
      }
    }
    return addRequestHeaders(
      NextResponse.next(),
      pathnameLocale,
      nonce,
      cspHeader,
    );
  }

  if (!isPublicRoute(pathWithoutLocale) && pathWithoutLocale !== "/") {
    if (!isAuthenticated(request)) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      return addRequestHeaders(response, DEFAULT_LOCALE, nonce, cspHeader);
    }
  }

  const detectedLocale = detectLocale(request);
  if (detectedLocale !== DEFAULT_LOCALE) {
    const redirectUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(redirectUrl);
    return addRequestHeaders(response, detectedLocale, nonce, cspHeader);
  }

  const rewriteUrl = new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url);
  rewriteUrl.search = request.nextUrl.search;
  return addRequestHeaders(
    NextResponse.rewrite(rewriteUrl),
    DEFAULT_LOCALE,
    nonce,
    cspHeader,
  );
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
