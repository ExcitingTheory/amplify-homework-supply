---
name: docblock-backfill
description: Bounded docblock audit and backfill for explicitly requested files
---

# Docblock Backfill

Operate on the requested file or directory only. Default to dry-run and report proposed changes before writing.

1. Run the relevant existing script for validation, sync, or backfill; do not manually recreate its parsing logic.
2. Read only reported files with missing or stale headers.
3. Apply minimal headers or metadata sync changes, preserving actual exports and public behavior.
4. Re-run the same scoped validation and report counts plus exceptions.

Do not scan the entire repository, generate reports, or modify locale metadata unless explicitly requested.