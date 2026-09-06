---
description: Quick checklist for choosing the right MCP server during ad-hoc development tasks in this repo
tags: [mcp, routing, github, nextjs, browser, docs]
---

# MCP Tool Routing Checklist

Use this checklist to quickly select the best MCP server for the current task.

## 1) GitHub state and collaboration

Use: `io.github.github/github-mcp-server`

Choose this when you need:

- Issue or pull request details, comments, reviews, or status checks
- Branch, commit, release, and repository metadata
- Search across GitHub issues/PRs/repositories

## 2) Next.js app diagnostics (framework-aware)

Use: `io.github.vercel/next-devtools-mcp`

Choose this when you need:

- Next.js runtime diagnostics, route insights, or server-side app context
- Next.js-specific debugging before generic browser-level debugging
- Information best sourced from the running Next.js dev server

## 3) Browser behavior and end-to-end interaction

Use: `microsoft/playwright-mcp`

Choose this when you need:

- Reproducible user flows (click/type/navigate)
- Functional UI verification in a real browser
- End-to-end validation beyond static code inspection

## 4) Browser internals (console/network/performance)

Use: `io.github.ChromeDevTools/chrome-devtools-mcp`

Choose this when you need:

- JavaScript console errors/warnings
- Network request/response debugging
- Performance bottlenecks and frontend runtime traces

## 5) External library/framework documentation

Use: `io.github.upstash/context7`

Choose this when you need:

- Accurate, up-to-date docs before implementing code changes
- API references for Next.js, Amplify Gen 2, Storybook, Lexical, MUI, Playwright, or Vitest
- Confirmation of modern syntax/behavior instead of relying on memory

## Tie-Breaker Rules

- If task is repo/PR/issue management: choose GitHub MCP first.
- If task is specifically Next.js runtime/routes: choose Next DevTools MCP first.
- If task is UI behavior reproduction: choose Playwright MCP first.
- If task is browser internals (console/network/perf): choose Chrome DevTools MCP first.
- If task is "how should this API/framework be used": choose Context7 first.

## Escalation Pattern (Fast Path)

1. Start with the most specific MCP for the task category.
2. If missing required detail, escalate to the complementary MCP:
   - Next.js issue: Next DevTools → Playwright/Chrome DevTools
   - UI issue: Playwright → Chrome DevTools
   - Implementation uncertainty: Any MCP → Context7
3. Avoid parallel MCP usage unless one tool clearly lacks needed capability.

## Anti-Patterns

- Don't use browser MCPs for tasks that are purely GitHub metadata/workflow.
- Don't skip Context7 when implementation depends on external API semantics.
- Don't default to "whatever is available"; pick the most specific tool first.
