---
description: Token-efficient Storybook validation workflow for changed stories and mocks
tags: [storybook, testing, mock-data, validation, components]
---

# Storybook Testing Workflow v2

Audit the requested or changed stories first. Use `.github/skills/storybook-audit/SKILL.md` for repository commands and diagnostic details.

1. Identify changed story, component, and mock files from the request or diff. Do not inventory all stories unless explicitly asked for a full audit.
2. Read each story and its component interface, then validate only the mocks and providers it consumes. Treat existing UI-data mocks as the runtime-format baseline.
3. Run the narrowest applicable story test. For a full Storybook request, run `npm run storybook:run:with-logs`, then mock and prop validation only when the first result implicates them.
4. Use browser inspection only to reproduce a rendering, interaction, accessibility, or layout defect that static or test output cannot explain.
5. Report failures by story with root cause and affected file. Omit successful-story detail.

Do not create inventories, result documents, scripts, or install packages unless the user asks.