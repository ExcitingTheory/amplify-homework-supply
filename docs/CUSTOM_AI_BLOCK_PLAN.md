# Custom AI Block Plan

## Overview

A new graded Lexical editor block type (`custom-ai`) that provides instructor-customizable AI-graded exercises with security guardrails. Unlike `custom-answer` which uses simple question/answer matching, `custom-ai` processes student input through OpenAI with instructor-defined grading criteria while enforcing an immutable interface and strict security boundaries.

## Goals

- [ ] Create a new `custom-ai` block type with immutable UI interface
- [ ] Support 4 input modes: text, audio, image, drawing
- [ ] Allow instructors to define custom grading criteria/rubric per block
- [ ] Build a secure API route with guardrails against prompt injection, character-breaking, and memory leakage
- [ ] Grade submissions similarly to `custom-answer` but via AI evaluation
- [ ] Register as a graded block in the rubric system
- [ ] Full test coverage (unit, integration, Storybook)

## Non-Goals

- Custom output UI beyond the existing feedback display pattern
- Real-time streaming feedback (uses single-shot grading)
- Instructor-editable system prompts (the system prompt is hardcoded for security)
- Student-to-student data sharing through the AI

## Architecture

### Security Model

The block enforces multiple security layers:

1. **Immutable System Prompt**: The system prompt is hardcoded in the API route - instructors cannot modify it. They can only set grading criteria (rubric text) and input mode.
2. **Input Sanitization**: Student input is sanitized before being sent to the AI. HTML tags, script injection attempts, and prompt injection patterns are stripped.
3. **Output Schema Enforcement**: The AI response must conform to a strict JSON schema (`{correct: boolean, score: number, feedback: string}`). Non-conforming responses are rejected.
4. **Memory Isolation**: The API route has NO access to user memories, other students' data, or cross-session context. Each grading call is stateless.
5. **Character Lock**: The system prompt explicitly forbids the AI from roleplaying, revealing system instructions, or breaking character as a grading assistant.
6. **Rate Limiting**: Auth-gated, one submission per question per request.
7. **Content Filtering**: Responses are checked for PII leakage patterns before returning to the client.

### Components Affected

#### New Files
- `app/api/grade-ai/route.ts` - Secure AI grading API route
- `src/components/Editor3/plugins/CustomAIPlugin.tsx` - Lexical node + plugin
- `src/components/Editor3/nodes/CustomAINode/CustomAIEditor.tsx` - Instructor editor
- `src/components/Editor3/nodes/CustomAINode/CustomAIComponent.tsx` - Student-facing component
- `src/components/Editor3/nodes/CustomAINode/security.ts` - Input sanitization and output validation
- `test/unit/custom-ai-security.test.ts` - Security unit tests
- `test/unit/custom-ai-grading.test.ts` - Grading logic unit tests
- `test/integration/custom-ai-block.test.tsx` - Integration tests
- `src/components/Editor3/plugins/CustomAIPlugin.stories.tsx` - Storybook stories

#### Modified Files
- `src/components/Editor3/editorConfig.ts` - Register `CustomAINode`
- `src/context/unitContext.jsx` - Add `custom-ai` to `gradedBlockTypes`
- `app/api/_shared/blockTools.ts` - Add `insert_custom_ai` tool
- `src/components/Editor3/plugins/ToolBarPlugin.jsx` - Add insert button

### Data Flow

```
Instructor creates block:
  → Sets input mode (text/audio/image/drawing)
  → Writes grading criteria/rubric
  → Selects question(s) from question bank

Student sees block:
  → Sees question prompt (from Question model)
  → Selects available input method
  → Submits answer

Grading flow:
  Student input → sanitize() → POST /api/grade-ai
    → validateAuth()
    → sanitizeInput(studentAnswer)
    → buildSecurePrompt(criteria, question, answer)
    → OpenAI gpt-4o-mini (temperature=0.1)
    → validateOutputSchema(response)
    → filterPII(response)
    → return {correct, score, feedback}
  → CustomAIComponent updates grade data
  → saveGrade() via UnitContext
```

### API Route: `/api/grade-ai`

```typescript
POST /api/grade-ai
Headers: Authorization (Amplify session cookie)

Request Body:
{
  questionId: string,       // Question model ID
  question: string,         // Question prompt text
  answer: string,           // Student's text answer OR transcript OR image description
  inputMode: "text" | "audio" | "image" | "drawing",
  criteria: string,         // Instructor's grading criteria
  imageData?: string,       // Base64 image for image/drawing modes
  audioUrl?: string,        // S3 URL for audio mode
}

Response:
{
  correct: boolean,
  score: number,      // 0-100
  feedback: string,   // Max 500 chars
}
```

### Serialized Node Format (Lexical JSON)

```json
{
  "type": "custom-ai",
  "version": 1,
  "ids": ["question-id-1", "question-id-2"],
  "inputMode": "text",
  "criteria": "Grade based on understanding of photosynthesis...",
  "allowedInput": ["text", "audio"],
  "format": ""
}
```

### Grade Data Structure

Same pattern as `custom-answer` in `Grade.data`:

```json
{
  "block-node-key": {
    "complete": true,
    "accuracy": 0.85,
    "userResponse": "Student's answer text",
    "feedback": "AI feedback text",
    "score": 85
  }
}
```

## User Stories

1. As an **instructor**, I want to create AI-graded exercises with custom criteria so students get immediate feedback on open-ended responses.
2. As an **instructor**, I want to choose what input modes (text, audio, image, drawing) students can use for each exercise.
3. As a **student**, I want to submit answers in my preferred format and receive AI feedback.
4. As an **admin**, I want confidence that the AI cannot leak student data, instructor notes, or system prompts.
5. As a **student**, I want to see clear feedback explaining why my answer was scored as it was.

## Dependencies

- `@ai-sdk/openai` (already installed)
- `ai` SDK (already installed)
- `zod` (already installed)
- Existing components: `PlainTextAnswerInput`, `AudioAutoSubmitWrapper`, `SketchPad`, `AudioWaveformPlayer`

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Prompt injection in student answers | Input sanitization + hardcoded system prompt + output schema validation |
| AI reveals grading criteria to students | System prompt explicitly forbids this; criteria are in system context only |
| Cross-student data leakage | Stateless API - no session/memory across calls |
| AI generates inappropriate content | Temperature=0.1, max 500 char feedback, content filtering |
| Expensive API calls | Rate limiting via auth, gpt-4o-mini for text, gpt-4o only for images |

## Success Criteria

- Block can be inserted, configured (input mode + criteria), and saved
- Student can submit answers in all 4 input modes
- AI grades with reproducible accuracy (temperature=0.1)
- All security tests pass (prompt injection, character break, memory leak)
- Grading integrates with existing rubric/grade calculation
- Zero console errors in Storybook and browser
- Unit test coverage ≥ 90% on security and grading logic
