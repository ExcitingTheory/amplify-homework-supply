# Custom AI Block Test Plan

## Test Strategy Overview

Testing prioritizes security (prompt injection, data leakage) and grading correctness. All security tests are unit-level for fast feedback. Integration tests verify the full component lifecycle. Storybook stories cover all visual states.

## 1. Unit Tests

**Location:** `test/unit/`
**Framework:** Vitest

| Test ID | Description | File | Status |
| ------- | ----------- | ---- | ------ |
| UT-001 | sanitizeInput strips HTML tags | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-002 | sanitizeInput strips script injection | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-003 | sanitizeInput detects prompt injection patterns | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-004 | sanitizeInput preserves legitimate content | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-005 | validateOutputSchema accepts valid response | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-006 | validateOutputSchema rejects malformed response | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-007 | validateOutputSchema clamps score to 0-100 | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-008 | validateOutputSchema truncates long feedback | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-009 | filterPII removes email addresses | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-010 | filterPII removes phone numbers | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| UT-011 | buildSecurePrompt includes criteria | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |
| UT-012 | buildSecurePrompt blocks character-break | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |
| UT-013 | buildSecurePrompt blocks memory reveal | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |
| UT-014 | CustomAINode serialization round-trip | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |
| UT-015 | CustomAINode importJSON/exportJSON | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |

## 2. Integration Tests

**Location:** `test/integration/`
**Framework:** Vitest + React Testing Library

| Test ID | Description | File | Status |
| ------- | ----------- | ---- | ------ |
| IT-001 | CustomAIEditor renders with question selector | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |
| IT-002 | CustomAIEditor saves criteria and input mode | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |
| IT-003 | CustomAIComponent renders question prompts | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |
| IT-004 | CustomAIComponent submits text and shows feedback | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |
| IT-005 | CustomAIComponent marks block complete when done | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |
| IT-006 | Grade calculation includes custom-ai blocks | `test/integration/custom-ai-block.test.tsx` | ⬜ Not Started |

## 3. Component Storybook Stories

**Location:** `src/components/Editor3/plugins/`
**Framework:** Storybook 8

| Story ID | Component | Variants | File | Status |
| -------- | --------- | -------- | ---- | ------ |
| CS-001 | CustomAIPlugin | Editor: Default, With Questions, With Criteria | `CustomAIPlugin.stories.tsx` | ⬜ Not Started |
| CS-002 | CustomAIPlugin | Student: Text Input | `CustomAIPlugin.stories.tsx` | ⬜ Not Started |
| CS-003 | CustomAIPlugin | Student: Audio Input | `CustomAIPlugin.audio-drawing.stories.tsx` | ⬜ Not Started |
| CS-004 | CustomAIPlugin | Student: Drawing Input | `CustomAIPlugin.audio-drawing.stories.tsx` | ⬜ Not Started |
| CS-005 | CustomAIPlugin | Student: Completed State | `CustomAIPlugin.stories.tsx` | ⬜ Not Started |
| CS-006 | CustomAIPlugin | Student: With Feedback | `CustomAIPlugin.stories.tsx` | ⬜ Not Started |

## 4. API Tests

**Location:** `test/unit/`
**Framework:** Vitest

| Test ID | Description | Endpoint | File | Status |
| ------- | ----------- | -------- | ---- | ------ |
| AI-001 | Rejects unauthenticated requests | POST /api/grade-ai | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| AI-002 | Rejects invalid request body | POST /api/grade-ai | `test/unit/custom-ai-security.test.ts` | ⬜ Not Started |
| AI-003 | Handles OpenAI API errors gracefully | POST /api/grade-ai | `test/unit/custom-ai-grading.test.ts` | ⬜ Not Started |

## 5. Browser Runtime Validation

**Framework:** Manual / Chrome DevTools

| Check ID | Page/Route | Console Errors | Status |
| -------- | ---------- | -------------- | ------ |
| BV-001 | Editor with custom-ai block | ⬜ | ⬜ Not Started |
| BV-002 | Workbook with custom-ai block | ⬜ | ⬜ Not Started |

## Test Data Requirements

- Mock questions in `.storybook/__mocks__/ui-data/` for custom-ai stories
- Mock grade data with custom-ai block entries
- Security test fixtures (prompt injection strings, malformed outputs)
