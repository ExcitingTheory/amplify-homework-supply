---
agent: agent
description: Token-efficient i18n translation workflow with optional multi-model verification
---

# i18n Translation Workflow v2

Translate only the requested namespaces and languages. Use `.github/skills/multi-model-ai-translation/SKILL.md` for execution details.

1. Confirm source, targets, namespaces, and mode. Default to missing keys only; use `fake` unless the user explicitly requests and authorizes paid provider calls.
2. Inspect the selected source and target locale files plus their metadata only. Report missing metadata as a blocker; do not scan all components or namespaces unless requested.
3. Preserve JSON shape, placeholders, and non-translated metadata. Batch work by namespace and target language.
4. Run the selected translation script once per requested batch. Do not simulate other models manually when the script supports the mode.
5. Run verification only for changed batches. Report consensus and reverse-translation exceptions only, not per-key successes.
6. Validate the changed JSON and run the narrowest existing translation check. Stop on failures.

Report changed files, key counts, and only keys needing human review. Never expose or request API keys in chat.