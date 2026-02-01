# Custom Markdown Syntax for Editor Blocks

This document describes the custom markdown syntax for inserting interactive blocks in the Homework Supply editor.

## Overview

The editor supports special markdown syntax that converts to interactive custom blocks. This allows AI assistants and users to create rich content using simple text syntax.

## Syntax Reference

### Quiz Block

Creates an interactive multiple-choice quiz with checkboxes.

**Markdown:**
```markdown
:::quiz[q1,q2,q3]
```

**Parameters:**
- `q1,q2,q3` - Comma-separated list of question IDs

**Example:**
```markdown
:::quiz[q-hiragana-1,q-hiragana-2,q-hiragana-3]
```

**Renders as:** Interactive quiz with 3 questions, students select answers via checkboxes, automatic grading.

---

### Answer Block

Creates a free-form answer exercise with multiple input methods.

**Markdown:**
```markdown
:::answer[word-1,word-2,word-3]
mode=translate
```

**Parameters:**
- `[...]` - Comma-separated word IDs
- `mode` - Optional: `translate`, `definition`, or `freeform`

**Example:**
```markdown
:::answer[word-konnichiwa,word-arigatou,word-sayounara]
mode=translate
```

**Renders as:** Answer block with 3 Japanese words, students can type, speak, or write translations.

---

### Meaning Association Block

Creates a drag-and-drop vocabulary matching exercise.

**Markdown:**
```markdown
:::meaning[word-1,word-2,word-3,word-4]
modes=learn,easy,hard
```

**Parameters:**
- `[...]` - Comma-separated word IDs (must have at least 4 words)
- `modes` - Optional: Comma-separated list of enabled modes (`learn`, `easy`, `hard`)

**Example:**
```markdown
:::meaning[word-aka,word-ao,word-midori,word-kiiro]
modes=learn,easy
```

**Renders as:** Matching exercise with Learn mode (flashcards) and Easy mode (drag-drop). Hard mode disabled.

---

### Custom Answer Block

Creates exercises with custom question prompts and flexible input/output methods.

**Markdown:**
```markdown
:::custom-answer[q-1,q-2]
input=text,audio
prompt=audio
```

**Parameters:**
- `[...]` - Comma-separated question IDs
- `input` - Input methods: `text`, `audio`, `writing`
- `prompt` - Prompt methods: `text`, `audio`

**Example:**
```markdown
:::custom-answer[q- listen-1,q-listen-2]
input=text
prompt=audio
```

**Renders as:** Audio listening comprehension - students hear questions and type answers.

---

## Alternative Syntax: JSON Code Blocks

For complex configurations, use JSON in code blocks:

### Quiz with Full Data

```markdown
```quiz
{
  "questions": [
    {
      "id": "q1",
      "answer": "か (ka)",
      "question": "Which hiragana represents 'ka'?",
      "correct": true
    },
    {
      "id": "q2",
      "answer": "き (ki)",
      "question": "Which hiragana represents 'ka'?",
      "correct": false
    }
  ]
}
` ``
```

This allows embedding full question data without requiring a separate question bank.

---

## Integration with AI Tools

The AI assistant can use these markdown blocks when generating content:

**User Request:**
> "Create a quiz about Japanese colors"

**AI Response with Markdown:**
```markdown
# Japanese Colors Quiz

Test your knowledge of Japanese color words!

:::quiz[q-color-1,q-color-2,q-color-3,q-color-4]

The quiz includes:
- 赤 (aka) - red
- 青 (ao) - blue
- 緑 (midori) - green
- 黄色 (kiiro) - yellow
```

**Result:** The `:::quiz[...]` block automatically converts to an interactive QuizNode with checkboxes and grading.

---

## Usage in Code

### 1. Enable Custom Transformers

In [src/components/Editor3/index.js](../src/components/Editor3/index.js):

```javascript
import { TRANSFORMERS } from '@lexical/markdown';
import { CUSTOM_BLOCK_TRANSFORMERS } from './utils/customMarkdownTransformers';

// Combine default and custom transformers
const ALL_TRANSFORMERS = [...TRANSFORMERS, ...CUSTOM_BLOCK_TRANSFORMERS];

// Use in MarkdownShortcutPlugin
<MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
```

### 2. Export to Markdown

```javascript
import { $convertToMarkdownString } from '@lexical/markdown';

editor.update(() => {
  const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
  console.log(markdown);
  // Output includes:
  // :::quiz[q1,q2,q3]
  // :::meaning[word-1,word-2,word-3,word-4]
});
```

### 3. Import from Markdown

```javascript
import { $convertFromMarkdownString } from '@lexical/markdown';

editor.update(() => {
  const markdownText = `
# My Lesson

:::quiz[q1,q2,q3]

Practice vocabulary:

:::answer[word-1,word-2]
mode=translate
  `;
  
  $convertFromMarkdownString(markdownText, ALL_TRANSFORMERS);
});
```

---

## Benefits

✅ **AI-Friendly**: Simple syntax AI can generate
✅ **Human-Readable**: Easy to read and understand
✅ **Copy-Paste**: Works in plain text environments
✅ **Version Control**: Git-friendly text format
✅ **Interoperable**: Can be shared across platforms
✅ **Extensible**: Easy to add new block types

---

## Example: Complete Lesson in Markdown

```markdown
# Introduction to Hiragana

## Learning Objectives
- Recognize basic hiragana characters
- Understand phonetic pronunciation
- Practice reading simple words

## Vocabulary

Match the hiragana characters with their sounds:

:::meaning[word-a,word-i,word-u,word-e]
modes=learn,easy,hard

## Reading Practice

Translate these greetings:

:::answer[word-konnichiwa,word-arigatou]
mode=translate

## Quiz

Test your knowledge:

:::quiz[q-hira-1,q-hira-2,q-hira-3,q-hira-4,q-hira-5]

## Listening Comprehension

Listen to the audio and type what you hear:

:::custom-answer[q-audio-1,q-audio-2]
input=text
prompt=audio
```

When pasted into the editor, this creates a complete interactive lesson with multiple exercise types!

---

## Implementation Status

- [ ] Create custom transformers file
- [ ] Integrate with MarkdownShortcutPlugin
- [ ] Update Editor3/index.js to use combined transformers
- [ ] Test import/export functionality
- [ ] Document in AI assistant prompts
- [ ] Add to Storybook examples

## See Also

- [Lexical Markdown Documentation](https://lexical.dev/docs/concepts/serialization#markdown)
- [Editor Block Types](./EDITOR_SURFACES_AND_DEDUPLICATION_PLAN.md)
- [AI Assistant Tools](./CHATBOT_TOOLS.md)
