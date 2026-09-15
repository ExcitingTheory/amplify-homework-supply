---
description: Proportionate TypeScript development workflow with focused tests and validation
tags: [typescript, testing, feature-development, workflow]
---

# TypeScript Feature Development Workflow v2

Use a plan only for multi-file, user-facing, architectural, or multi-session work. Fix small, localized bugs directly.

1. Establish one local hypothesis from the owning code path and a nearby test or call site. For external APIs, verify the installed version and consult Context7 before coding.
2. For substantial work, create a concise plan with goals, affected surfaces, risks, and acceptance checks. Create a separate test plan only when it prevents real ambiguity.
3. Work one small item at a time. Add focused tests with logic changes; add stories for user-facing component states; use versioned components only for a genuine rewrite or incompatible migration.
4. Immediately after each substantive edit, run the smallest relevant test, typecheck, or lint check. Repair failures before broadening scope.
5. On feature completion, run a proportionate gate: touched tests and typecheck first; Storybook, E2E, build, and crawl only when the change affects those surfaces or the user asks for full verification.
6. Report changed files, validation results, and remaining risks concisely. Do not generate repetitive TODO tables or audit documents unless requested.