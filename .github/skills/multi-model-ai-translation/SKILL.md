---
name: multi-model-ai-translation
description: Bounded multi-model translation with exception-only review
---

# Multi-Model AI Translation

Use `fake` mode by default. Use `provable` mode only with explicit user approval for provider cost and a configured environment.

1. Confirm source, targets, scope, placeholders, and whether reverse verification is required.
2. Submit a batch once through existing scripts; never manually simulate provider outputs or send secrets through chat.
3. Preserve structured data and placeholders. Choose exact consensus or majority output; flag no-consensus and semantic-drift entries.
4. Verify only the translated batch, then report files, counts, cost when applicable, and exception keys.

Do not emit full model outputs, proof payloads, or per-key success tables unless the user requests an audit artifact.