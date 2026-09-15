---
name: mock-data-validator
description: Validate a specified Storybook mock against its consuming component
---

# Mock Data Validator

Require a component or story target. Locate its consumed mocks and providers, then run the existing validator where possible.

1. Read the component's public props and the exact mock values used by the selected story.
2. Compare required fields, nesting, nullability, callbacks, and provider values.
3. Report only mismatches with source locations and a concrete correction.
4. Re-run the targeted validator or story test after a fix.

Do not inventory unrelated mocks or infer runtime data shapes when a current UI-data mock exists.