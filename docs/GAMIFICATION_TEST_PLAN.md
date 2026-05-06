# Gamification Improvements Test Plan

## Test Strategy Overview

Incremental testing approach: each phase gets unit tests, storybook stories with interaction tests, and integration tests before moving to the next phase. Browser validation after each phase is wired to the page.

## 1. Unit Tests

**Location:** `src/components/Gamification/__tests__/`
**Framework:** Vitest + React Testing Library

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| UT-001 | SectionSelector renders sections dropdown | `SectionSelector.test.tsx` | ⬜ Not Started |
| UT-002 | SectionSelector calls onSectionChange on selection | `SectionSelector.test.tsx` | ⬜ Not Started |
| UT-003 | SectionSelector shows empty state when no sections | `SectionSelector.test.tsx` | ⬜ Not Started |
| UT-004 | BossBattleForm validates required fields | `BossBattleForm.test.tsx` | ⬜ Not Started |
| UT-005 | BossBattleForm calls onSubmit with correct data | `BossBattleForm.test.tsx` | ⬜ Not Started |
| UT-006 | BossBattleProgress renders progress bar correctly | `BossBattleProgress.test.tsx` | ⬜ Not Started |
| UT-007 | BossBattleProgress shows deadline countdown | `BossBattleProgress.test.tsx` | ⬜ Not Started |
| UT-008 | SkillForm validates required fields | `SkillForm.test.tsx` | ⬜ Not Started |
| UT-009 | SkillForm multi-unit autocomplete works | `SkillForm.test.tsx` | ⬜ Not Started |
| UT-010 | InstructorGamificationPanel section filtering | `InstructorGamificationPanel.test.tsx` | ⬜ Not Started |

## 2. Integration Tests

**Location:** `src/components/Gamification/__tests__/`
**Framework:** Vitest + React Testing Library

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| IT-001 | Panel filters data by selected section | `InstructorGamificationPanel.integration.test.tsx` | ⬜ Not Started |
| IT-002 | Section change updates all child components | `InstructorGamificationPanel.integration.test.tsx` | ⬜ Not Started |
| IT-003 | Boss battle CRUD flow (create, display, delete) | `BossBattle.integration.test.tsx` | ⬜ Not Started |
| IT-004 | Skill CRUD with units and prerequisites | `SkillTree.integration.test.tsx` | ⬜ Not Started |

## 3. Component Storybook Stories

**Location:** `src/components/Gamification/*.stories.tsx`
**Framework:** Storybook 8

| Story ID | Component | Variants | File | Status |
|----------|-----------|----------|------|--------|
| CS-001 | SectionSelector | Default, Empty, Single Section, Many Sections | `SectionSelector.stories.tsx` | ⬜ Not Started |
| CS-002 | InstructorGamificationPanel | With Section Selector, Filtered Data, Empty State | `InstructorGamificationPanel.stories.tsx` | ⬜ Not Started |
| CS-003 | BossBattleForm | Default, Pre-filled (Edit mode) | `BossBattleForm.stories.tsx` | ⬜ Not Started |
| CS-004 | BossBattleProgress | Active (50%), Near Complete, Expired Deadline | `BossBattleProgress.stories.tsx` | ⬜ Not Started |
| CS-005 | SkillForm | Default, With Units, With Prerequisites | `SkillForm.stories.tsx` | ⬜ Not Started |

## 4. Interaction Storybook Tests

**Location:** `src/components/Gamification/*.stories.tsx` (play functions)
**Framework:** Storybook Interactions + Testing Library

| Test ID | Component | Interaction | File | Status |
|---------|-----------|-------------|------|--------|
| IX-001 | SectionSelector | Select section from dropdown | `SectionSelector.stories.tsx` | ⬜ Not Started |
| IX-002 | BossBattleForm | Fill form and submit | `BossBattleForm.stories.tsx` | ⬜ Not Started |
| IX-003 | BossBattleForm | Submit with missing required field (validation) | `BossBattleForm.stories.tsx` | ⬜ Not Started |
| IX-004 | InstructorGamificationPanel | Change section, verify data filters | `InstructorGamificationPanel.stories.tsx` | ⬜ Not Started |
| IX-005 | SkillForm | Add skill with multiple units | `SkillForm.stories.tsx` | ⬜ Not Started |

## 5. API Integration Tests

**Location:** `amplify/functions/__tests__/`
**Framework:** Vitest

| Test ID | Description | Endpoint/Query | File | Status |
|---------|-------------|----------------|------|--------|
| AI-001 | evaluateSkillsForUnit handler | `evaluateSkillsForUnit` mutation | `gamification-skillEvaluation.test.ts` | ⬜ Not Started |
| AI-002 | generateSkillTree sets unitIds | `generateSkillTree` mutation | `gamification-generateSkillTree.test.ts` | ⬜ Not Started (update existing) |
| AI-003 | checkEasterEggs SCHEDULE trigger | `checkEasterEggs` mutation | `gamification-easterEgg.test.ts` | ⬜ Not Started (update existing) |
| AI-004 | checkEasterEggs ACHIEVEMENT trigger | `checkEasterEggs` mutation | `gamification-easterEgg.test.ts` | ⬜ Not Started |
| AI-005 | contributeToChallenge with cohort filter | `contributeToChallenge` mutation | `gamification-guildChallenge.test.ts` | ⬜ Not Started (update existing) |

## 6. Build Verification

| Check | Command | Status |
|-------|---------|--------|
| Next.js build | `npm run build` | ⬜ Not Started |
| Storybook build | `npm run build-storybook` | ⬜ Not Started |
| TypeScript check | `npx tsc --noEmit` | ⬜ Not Started |
| Unit tests pass | `npx vitest run` | ⬜ Not Started |

## Test Data Requirements

- Mock sections array (3+ sections with IDs, names, descriptions)
- Mock skills with unit IDs and prerequisites
- Mock group challenges with progress data
- Mock easter eggs with various trigger types

---

_Created: May 2026_
