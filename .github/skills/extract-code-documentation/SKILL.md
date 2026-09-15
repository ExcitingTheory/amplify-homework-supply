---
name: extract-code-documentation
description: Generate only requested translation metadata using existing scripts
---

# Extract Code Documentation

Choose one existing script from the request: full usage discovery, placeholder repair, or missing-metadata generation. Limit it to requested namespaces where supported.

1. Confirm the target locale, namespaces, and whether the operation writes files.
2. Verify required credentials without exposing them.
3. Run the selected script once; do not duplicate its discovery or AI prompt work in chat.
4. Validate only changed JSON/cache files and report processed, changed, and failed counts.

Do not convert locale data formats, regenerate complete metadata, or inspect all components unless explicitly requested.