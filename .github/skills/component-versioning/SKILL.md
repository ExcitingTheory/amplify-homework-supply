---
name: component-versioning
description: Create a versioned component copy with bounded evidence and focused validation
---

# Component Versioning

Use only for a rewrite, incompatible API change, or major migration. Confirm the source component and requested target version; auto-detect the next suffix only when the request omits it.

1. Inspect the component, its story if present, and immediate import/export patterns.
2. Create the versioned component and optional story without changing consumers unless requested.
3. Update only self-references, exported component names, and display names in the new files.
4. Create a short parity checklist from observable props, user states, and integrations; do not infer unverified features.
5. Run the skill's focused test or a targeted typecheck. Report created paths and unresolved parity items only.

Stop if the destination exists, the source is not a component, or permission is not granted.