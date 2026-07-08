import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import outputs from "./amplify_outputs.json";

const LOCALES = ["en", "es", "fr", "de", "ja", "zh"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Routes that do not require authentication.
 * These are accessible without a valid Cognito session.
 */
const PUBLIC_ROUTES = ["/privacy", "/offline"];

/**
 * Check if the request has a valid Amplify/Cognito auth session
 * by looking for the LastAuthUser cookie (always small, never chunked).
 */
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

/**
 * Detect locale from the pathname prefix.
 * Returns the locale if found, or null if no locale prefix is present.
 */
function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

/**
 * Strip locale prefix from pathname for route matching.
 */
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

/**
 * Detect the preferred locale from cookie or Accept-Language header.
 */
function detectLocale(request: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (
    cookieLocale &&
    LOCALES.includes(cookieLocale as (typeof LOCALES)[number])
  ) {
    return cookieLocale;
  }

  // 2. Parse Accept-Language header
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
      // Exact match (e.g., "en", "es")
      const exact = LOCALES.find((l) => l === lang);
      if (exact) return exact;
      // Prefix match (e.g., "en-US" → "en")
      const prefix = LOCALES.find((l) => lang.startsWith(`${l}-`));
      if (prefix) return prefix;
    }
  }

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = getLocaleFromPathname(pathname);
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  // Generate a per-request CSP nonce
  const nonce = crypto.randomUUID();

  /**
   * Build Content-Security-Policy with per-request nonce.
   * Allows inline scripts/styles only if they carry the matching nonce.
   */
  // In development, React dev tools require eval() for callstack reconstruction.
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

  // If URL has the default locale prefix explicitly (e.g., /en/units),
  // redirect to the unprefixed version for clean URLs (localePrefix: 'as-needed')
  if (pathnameLocale === DEFAULT_LOCALE) {
    const cleanUrl = new URL(pathWithoutLocale || "/", request.url);
    cleanUrl.search = request.nextUrl.search;
    return NextResponse.redirect(cleanUrl);
  }

  // If URL already has a non-default locale prefix, let it through
  // (rewrite to ensure [locale] segment is populated)
  if (pathnameLocale) {
    // Auth check for non-public routes
    if (!isPublicRoute(pathWithoutLocale) && pathWithoutLocale !== "/") {
      if (!isAuthenticated(request)) {
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("returnUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    const response = NextResponse.next();
    response.headers.set("x-nonce", nonce);
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  // No locale in URL — detect and handle
  const detectedLocale = detectLocale(request);

  // Auth check for non-public routes
  if (!isPublicRoute(pathWithoutLocale) && pathWithoutLocale !== "/") {
    if (!isAuthenticated(request)) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (detectedLocale !== DEFAULT_LOCALE) {
    // Non-default locale: redirect to prefixed URL (e.g., /es/units)
    const redirectUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // Default locale: rewrite internally to /en/... so [locale] segment resolves,
  // but the browser URL stays clean (no /en/ prefix)
  const rewriteUrl = new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url);
  rewriteUrl.search = request.nextUrl.search;
  const rewriteResponse = NextResponse.rewrite(rewriteUrl);
  rewriteResponse.headers.set("x-nonce", nonce);
  rewriteResponse.headers.set("Content-Security-Policy", cspHeader);
  return rewriteResponse;
}

function isPublicRoute(pathWithoutLocale: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`),
  );
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
