---
description: Compact acceptance prompts for the feature-development-cycle skill
tags: [testing, workflow, feature-development-cycle, qa]
---

# Feature Development Cycle Test Prompts v2

Use one prompt per scenario. Verify only the listed observable behavior; do not require generated documents or broad suites for a trivial bug fix.

| Scenario | Prompt | Expected result |
|---|---|---|
| New feature | `Build a student progress dashboard with XP, completed assignments, and a streak.` | Proportionate plan and test approach; production-change confirmation. |
| Vague request | `The leaderboard page needs work.` | Clarifying question or a bounded assumption before work. |
| Resume | `Resume aria-label localization.` | Finds existing artifacts and continues from the next unfinished item. |
| Rewrite | `Rewrite RecordingStudio as RecordingStudio3.` | Versioning strategy and parity criteria. |
| Implementation | `Start the XP calculation utils.` | Focused code and colocated tests; targeted validation. |
| Completion | `Check whether notifications is done.` | Plan-to-code audit; run only necessary checks when audit is complete. |
| Browser check | `Crawl the changed pages for console errors.` | Tests changed routes and reports runtime exceptions. |
| Cleanup | `Clean up the verified gamification feature.` | Confirms completion and requests deletion approval. |
| Parallel work | `Pause dark mode and start offline support.` | Retains dark-mode context; starts a separate bounded flow. |
| Small bug | `Fix the null grade-subscription error.` | Direct fix and narrow regression test, without full-cycle artifacts. |

Pass when behavior matches the expected result and no disproportionate documentation, search, or validation is triggered.