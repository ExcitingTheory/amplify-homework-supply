---
name: console-crawl-audit
description: Scope-aware runtime crawl with targeted log inspection
---

# Console Crawl Audit

Confirm the affected routes and roles first. Crawl changed routes by default; crawl all roles and routes only for schema/context changes, a release check, or an explicit request.

1. Verify only the required runtime prerequisites without printing credentials or secrets.
2. Run `npm run crawl:with-logs` once for the selected scope.
3. Read the crawl result and inspect backend, Next.js, or collaboration logs only when the crawl identifies a related issue.
4. Group exceptions by route and role; classify console errors, rerender loops, subscription churn, request failures, and expected development noise.
5. Report counts, root causes, and actionable locations. Do not report clean pages individually.

Do not kill processes, dump complete logs, or claim a broad health verdict from a partial crawl.