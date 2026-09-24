# App Router Guide

- Keep route files server components by default. Move hooks, browser APIs, forms, and subscriptions into the smallest practical client leaf.
- Do not server-prefetch data already owned by a real-time context; that duplicates fetching and can create hydration races.
- This repository uses Next.js 15 `middleware.ts` for locale routing, authentication checks, CSP nonces, rewrites, and redirects.
- Use classic route caching (`force-static`, `revalidate`, and explicit cache helpers) rather than Next 16 Cache Components or `'use cache'` directives.
- Cache published immutable content by a version argument. Do not cache live editor content by ID alone.
- A hook-using component imported by a server component must declare its own `'use client'` boundary.
- Preserve locale behavior: default-locale routes are internally rewritten; non-default locales use a visible prefix. Use the established `next-intl` helpers and existing route patterns.
- For authenticated server pages, follow nearby `getServerClient()` and Cognito group-check patterns rather than inventing another auth path.

Validate the touched route with the narrowest app typecheck or relevant route test before a full build.
