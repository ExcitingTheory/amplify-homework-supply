---
description: Minimal MCP routing rules for ad-hoc development tasks
tags: [mcp, routing, github, nextjs, browser, docs]
---

# MCP Tool Routing v2

Choose one first tool based on the task's evidence source:

| Need | First choice |
|---|---|
| GitHub issue, PR, review, branch, or release state | GitHub MCP |
| Next.js route or server diagnostic | Next DevTools MCP |
| Reproducible UI interaction | Playwright MCP |
| Browser console, network, or performance detail | Chrome DevTools MCP |
| Current library, framework, SDK, CLI, or cloud API documentation | Context7 |

Use the most specific tool first. Escalate only when it lacks needed evidence: Next DevTools to browser tools; Playwright to Chrome DevTools; any implementation uncertainty to Context7. Do not parallelize overlapping MCP investigations.