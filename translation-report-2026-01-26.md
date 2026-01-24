# Translation Report

**Date**: 2026-01-26T07:44:21.133Z
**Cache Directory**: 2026-01-26
**Source**: English (en)
**Targets**: Japanese, Spanish, French, Chinese (Simplified), German
**Runmode**: Provable (with cryptographic verification)

## Summary

- **Total keys translated**: 235
- **Languages processed**: 5
- **Translation consistency rate**: 53% (exact 3/3 model agreement)
- **Cross-validation accuracy**: 91%

## Translation Consensus by Language

### Japanese (ja)

- **Exact matches (3/3)**: 19 (40%)
- **2/3 consensus**: 15 (32%)
- **No consensus**: 13 (28%)
- **Total keys**: 47

#### Namespaces

| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |
|-----------|------|-------------|---------------|---------------|
| auth | 9 | 7 | 2 | 0 |
| chat | 6 | 5 | 1 | 0 |
| common | 6 | 0 | 0 | 6 |
| editor | 3 | 0 | 0 | 3 |
| errors | 5 | 1 | 1 | 3 |
| grades | 8 | 5 | 3 | 0 |
| units | 10 | 1 | 8 | 1 |

### Spanish (es)

- **Exact matches (3/3)**: 24 (51%)
- **2/3 consensus**: 9 (19%)
- **No consensus**: 14 (30%)
- **Total keys**: 47

#### Namespaces

| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |
|-----------|------|-------------|---------------|---------------|
| auth | 9 | 2 | 5 | 2 |
| chat | 6 | 5 | 1 | 0 |
| common | 6 | 0 | 0 | 6 |
| editor | 3 | 0 | 0 | 3 |
| errors | 5 | 0 | 2 | 3 |
| grades | 8 | 8 | 0 | 0 |
| units | 10 | 9 | 1 | 0 |

### French (fr)

- **Exact matches (3/3)**: 26 (55%)
- **2/3 consensus**: 8 (17%)
- **No consensus**: 13 (28%)
- **Total keys**: 47

#### Namespaces

| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |
|-----------|------|-------------|---------------|---------------|
| auth | 9 | 8 | 0 | 1 |
| chat | 6 | 1 | 5 | 0 |
| common | 6 | 0 | 0 | 6 |
| editor | 3 | 0 | 0 | 3 |
| errors | 5 | 2 | 0 | 3 |
| grades | 8 | 6 | 2 | 0 |
| units | 10 | 9 | 1 | 0 |

### Chinese (Simplified) (zh)

- **Exact matches (3/3)**: 29 (62%)
- **2/3 consensus**: 5 (11%)
- **No consensus**: 13 (28%)
- **Total keys**: 47

#### Namespaces

| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |
|-----------|------|-------------|---------------|---------------|
| auth | 9 | 8 | 1 | 0 |
| chat | 6 | 5 | 1 | 0 |
| common | 6 | 0 | 0 | 6 |
| editor | 3 | 0 | 0 | 3 |
| errors | 5 | 1 | 0 | 4 |
| grades | 8 | 6 | 2 | 0 |
| units | 10 | 9 | 1 | 0 |

### German (de)

- **Exact matches (3/3)**: 27 (57%)
- **2/3 consensus**: 7 (15%)
- **No consensus**: 13 (28%)
- **Total keys**: 47

#### Namespaces

| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |
|-----------|------|-------------|---------------|---------------|
| auth | 9 | 9 | 0 | 0 |
| chat | 6 | 3 | 2 | 1 |
| common | 6 | 0 | 0 | 6 |
| editor | 3 | 0 | 0 | 3 |
| errors | 5 | 2 | 0 | 3 |
| grades | 8 | 6 | 2 | 0 |
| units | 10 | 7 | 3 | 0 |

## Cross-Validation Reverse Translation Results

*Each model's translation is verified by the OTHER two models to ensure accuracy.*

### Japanese (ja)

- **Overall accuracy**: 7/9 keys (78%)
- **Claude's translations verified by GPT & Gemini**: 7/9 (78%)
- **GPT's translations verified by Claude & Gemini**: 8/9 (89%)
- **Gemini's translations verified by Claude & GPT**: 7/9 (78%)

#### ⚠️ Keys with Cross-Validation Issues

| Namespace | Key | Original | Issue |
|-----------|-----|----------|-------|
| auth | `email` | "Email" | Claude, GPT, Gemini failed |
| auth | `forgot_password` | "Forgot Password?" | Claude, Gemini failed |

### Spanish (es)

- **Overall accuracy**: 8/9 keys (89%)
- **Claude's translations verified by GPT & Gemini**: 8/9 (89%)
- **GPT's translations verified by Claude & Gemini**: 8/9 (89%)
- **Gemini's translations verified by Claude & GPT**: 9/9 (100%)

#### ⚠️ Keys with Cross-Validation Issues

| Namespace | Key | Original | Issue |
|-----------|-----|----------|-------|
| auth | `forgot_password` | "Forgot Password?" | Claude, GPT failed |

### French (fr)

- **Overall accuracy**: 8/9 keys (89%)
- **Claude's translations verified by GPT & Gemini**: 9/9 (100%)
- **GPT's translations verified by Claude & Gemini**: 9/9 (100%)
- **Gemini's translations verified by Claude & GPT**: 8/9 (89%)

#### ⚠️ Keys with Cross-Validation Issues

| Namespace | Key | Original | Issue |
|-----------|-----|----------|-------|
| auth | `email` | "Email" | Gemini failed |

### Chinese (Simplified) (zh)

- **Overall accuracy**: 9/9 keys (100%)
- **Claude's translations verified by GPT & Gemini**: 9/9 (100%)
- **GPT's translations verified by Claude & Gemini**: 9/9 (100%)
- **Gemini's translations verified by Claude & GPT**: 9/9 (100%)

### German (de)

- **Overall accuracy**: 9/9 keys (100%)
- **Claude's translations verified by GPT & Gemini**: 9/9 (100%)
- **GPT's translations verified by Claude & Gemini**: 9/9 (100%)
- **Gemini's translations verified by Claude & GPT**: 9/9 (100%)

## Human Review Required

70 item(s) require human review:

| Language | Namespace | Key Path | Reason |
|----------|-----------|----------|--------|
| Japanese | auth | `email` | Cross-validation failed: Claude: Semantic drift detected Semantic drift detected; GPT:  Semantic drift detected; Gemini:  Semantic drift detected |
| Japanese | auth | `forgot_password` | Cross-validation failed: Claude: Semantic drift detected ; Gemini:  Semantic drift detected |
| Japanese | common | `app` | No model consensus |
| Japanese | common | `actions` | No model consensus |
| Japanese | common | `navigation` | No model consensus |
| Japanese | common | `status` | No model consensus |
| Japanese | common | `time` | No model consensus |
| Japanese | common | `common` | No model consensus |
| Japanese | editor | `toolbar` | No model consensus |
| Japanese | editor | `blocks` | No model consensus |
| Japanese | editor | `placeholders` | No model consensus |
| Japanese | errors | `auth` | No model consensus |
| Japanese | errors | `validation` | No model consensus |
| Japanese | errors | `file` | No model consensus |
| Japanese | units | `no_units` | No model consensus |
| Spanish | auth | `forgot_password` | No model consensus |
| Spanish | auth | `reset_password` | No model consensus |
| Spanish | auth | `forgot_password` | Cross-validation failed: Claude: Semantic drift detected ; GPT: Semantic drift detected  |
| Spanish | common | `app` | No model consensus |
| Spanish | common | `actions` | No model consensus |
| Spanish | common | `navigation` | No model consensus |
| Spanish | common | `status` | No model consensus |
| Spanish | common | `time` | No model consensus |
| Spanish | common | `common` | No model consensus |
| Spanish | editor | `toolbar` | No model consensus |
| Spanish | editor | `blocks` | No model consensus |
| Spanish | editor | `placeholders` | No model consensus |
| Spanish | errors | `auth` | No model consensus |
| Spanish | errors | `validation` | No model consensus |
| Spanish | errors | `file` | No model consensus |
| French | auth | `email` | No model consensus |
| French | auth | `email` | Cross-validation failed: Gemini: Semantic drift detected Semantic drift detected |
| French | common | `app` | No model consensus |
| French | common | `actions` | No model consensus |
| French | common | `navigation` | No model consensus |
| French | common | `status` | No model consensus |
| French | common | `time` | No model consensus |
| French | common | `common` | No model consensus |
| French | editor | `toolbar` | No model consensus |
| French | editor | `blocks` | No model consensus |
| French | editor | `placeholders` | No model consensus |
| French | errors | `auth` | No model consensus |
| French | errors | `validation` | No model consensus |
| French | errors | `file` | No model consensus |
| Chinese (Simplified) | common | `app` | No model consensus |
| Chinese (Simplified) | common | `actions` | No model consensus |
| Chinese (Simplified) | common | `navigation` | No model consensus |
| Chinese (Simplified) | common | `status` | No model consensus |
| Chinese (Simplified) | common | `time` | No model consensus |
| Chinese (Simplified) | common | `common` | No model consensus |
| Chinese (Simplified) | editor | `toolbar` | No model consensus |
| Chinese (Simplified) | editor | `blocks` | No model consensus |
| Chinese (Simplified) | editor | `placeholders` | No model consensus |
| Chinese (Simplified) | errors | `network` | No model consensus |
| Chinese (Simplified) | errors | `auth` | No model consensus |
| Chinese (Simplified) | errors | `validation` | No model consensus |
| Chinese (Simplified) | errors | `file` | No model consensus |
| German | chat | `chat_with_ai` | No model consensus |
| German | common | `app` | No model consensus |
| German | common | `actions` | No model consensus |
| German | common | `navigation` | No model consensus |
| German | common | `status` | No model consensus |
| German | common | `time` | No model consensus |
| German | common | `common` | No model consensus |
| German | editor | `toolbar` | No model consensus |
| German | editor | `blocks` | No model consensus |
| German | editor | `placeholders` | No model consensus |
| German | errors | `auth` | No model consensus |
| German | errors | `validation` | No model consensus |
| German | errors | `file` | No model consensus |

## Files Updated

- ✅ `public/locales/ja/auth.json` (9 keys)
- ✅ `public/locales/ja/chat.json` (6 keys)
- ✅ `public/locales/ja/common.json` (6 keys)
- ✅ `public/locales/ja/editor.json` (3 keys)
- ✅ `public/locales/ja/errors.json` (5 keys)
- ✅ `public/locales/ja/grades.json` (8 keys)
- ✅ `public/locales/ja/units.json` (10 keys)
- ✅ `public/locales/es/auth.json` (9 keys)
- ✅ `public/locales/es/chat.json` (6 keys)
- ✅ `public/locales/es/common.json` (6 keys)
- ✅ `public/locales/es/editor.json` (3 keys)
- ✅ `public/locales/es/errors.json` (5 keys)
- ✅ `public/locales/es/grades.json` (8 keys)
- ✅ `public/locales/es/units.json` (10 keys)
- ✅ `public/locales/fr/auth.json` (9 keys)
- ✅ `public/locales/fr/chat.json` (6 keys)
- ✅ `public/locales/fr/common.json` (6 keys)
- ✅ `public/locales/fr/editor.json` (3 keys)
- ✅ `public/locales/fr/errors.json` (5 keys)
- ✅ `public/locales/fr/grades.json` (8 keys)
- ✅ `public/locales/fr/units.json` (10 keys)
- ✅ `public/locales/zh/auth.json` (9 keys)
- ✅ `public/locales/zh/chat.json` (6 keys)
- ✅ `public/locales/zh/common.json` (6 keys)
- ✅ `public/locales/zh/editor.json` (3 keys)
- ✅ `public/locales/zh/errors.json` (5 keys)
- ✅ `public/locales/zh/grades.json` (8 keys)
- ✅ `public/locales/zh/units.json` (10 keys)
- ✅ `public/locales/de/auth.json` (9 keys)
- ✅ `public/locales/de/chat.json` (6 keys)
- ✅ `public/locales/de/common.json` (6 keys)
- ✅ `public/locales/de/editor.json` (3 keys)
- ✅ `public/locales/de/errors.json` (5 keys)
- ✅ `public/locales/de/grades.json` (8 keys)
- ✅ `public/locales/de/units.json` (10 keys)

## Cryptographic Verification

All translations include cryptographic proof:

- **SHA-256 fingerprints** for each model's output
- **Request IDs** from Anthropic, OpenAI, and Google APIs
- **Timestamps** showing parallel execution
- **Proof documents** stored in `.translation-cache/2026-01-26/`

Run `npx tsx scripts/verify-translations.ts` to re-verify at any time.

