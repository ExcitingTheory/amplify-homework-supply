---
name: semantic-file-search
description: Focused code discovery using one query and limited evidence reads
---

# Semantic File Search

Start with a single natural-language query and an explicit scope when one is known.

1. Return the smallest ranked result set that answers the request.
2. Expand with one exact search only when semantic results are ambiguous.
3. Read only the top relevant files or snippets needed to answer the question.
4. State confidence and the nearest next search when no direct match exists.

Do not enumerate the repository, run overlapping search strategies by default, or provide relevance-score explanations unless requested.