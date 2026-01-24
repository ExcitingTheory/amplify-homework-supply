/**
 * @fileoverview Storybook stories for ContentPreview component
 * 
 * Demonstrates AI-generated content preview with:
 * - Multiple content types (explanations, examples, practice, quizzes)
 * - Preview and raw view modes
 * - Markdown rendering with Lexical
 * - Copy to clipboard functionality
 * - Insert into editor workflows
 * - Regeneration capabilities
 * 
 * @module ChatSidebar/ContentPreview.stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ContentPreview from './ContentPreview';

const meta: Meta<typeof ContentPreview> = {
  title: 'ChatSidebar/ContentPreview',
  component: ContentPreview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContentPreview>;

const sampleMarkdownExplanation = `## Japanese Particles: は, が, を

Japanese particles are essential grammatical markers that define the relationship between words in a sentence.

### は (wa) - Topic Marker

The particle **は** marks the topic of the sentence - what you're talking about.

**Examples:**
- 私**は**学生です (Watashi **wa** gakusei desu) - "I am a student"
- これ**は**本です (Kore **wa** hon desu) - "This is a book"

### が (ga) - Subject Marker

The particle **が** marks the grammatical subject, often emphasizing new information or contrast.

**Examples:**
- 犬**が**います (Inu **ga** imasu) - "There is a dog"
- 誰**が**来ますか (Dare **ga** kimasu ka) - "Who is coming?"

### を (wo/o) - Direct Object Marker

The particle **を** marks the direct object - what the action is being performed on.

**Examples:**
- 本**を**読みます (Hon **wo** yomimasu) - "I read a book"
- コーヒー**を**飲みます (Koohii **wo** nomimasu) - "I drink coffee"

### Key Takeaways

1. **は (wa)** = Topic marker ("as for...")
2. **が (ga)** = Subject marker (who/what does the action)
3. **を (wo)** = Object marker (what receives the action)
`;

const sampleMarkdownPractice = `### Practice: Hiragana Reading

Read the following words and provide their romaji pronunciation:

1. **さくら**
   - Answer: sakura (cherry blossom)

2. **ともだち**
   - Answer: tomodachi (friend)

3. **がっこう**
   - Answer: gakkou (school)

4. **せんせい**
   - Answer: sensei (teacher)

5. **べんきょう**
   - Answer: benkyou (study)

### Challenge Words

6. **りょうり**
   - Answer: ryouri (cooking)

7. **しゅくだい**
   - Answer: shukudai (homework)
`;

const sampleMarkdownQuiz = `### Quiz: Verb Conjugation

**Question 1:** What is the past tense of 食べる (taberu - to eat)?

A) 食べます  
B) 食べた  
C) 食べて  
D) 食べない

**Answer:** B) 食べた (tabeta)

---

**Question 2:** Convert する (suru - to do) to the negative form:

**Answer:** しない (shinai)

---

**Question 3:** What is the て-form of 行く (iku - to go)?

A) 行いて  
B) 行って  
C) 行きて  
D) 行った

**Answer:** B) 行って (itte)

---

**Question 4:** Fill in the blank: 昨日、映画___見ました。

**Answer:** を (wo) - direct object marker
`;

const sampleMarkdownVocabulary = `### Vocabulary: Food and Dining

| Japanese | Reading | English | Example |
|----------|---------|---------|---------|
| ご飯 | ごはん (gohan) | rice, meal | ご飯を食べます |
| パン | ぱん (pan) | bread | パンが好きです |
| 肉 | にく (niku) | meat | 肉を買います |
| 魚 | さかな (sakana) | fish | 魚は美味しいです |
| 野菜 | やさい (yasai) | vegetables | 野菜を食べましょう |
| 果物 | くだもの (kudamono) | fruit | 果物が好きです |
| 水 | みず (mizu) | water | 水を飲みます |
| お茶 | おちゃ (ocha) | tea | お茶をください |
| 美味しい | おいしい (oishii) | delicious | とても美味しいです |
| まずい | まずい (mazui) | not tasty | あまりまずくない |

### Usage Tips

- Use **が好き** to say you like something
- Use **を食べます** to say you eat something
- Use **をください** to request something
`;

export const ExplanationContent: Story = {
  args: {
    contentType: 'explanation',
    topic: 'Japanese Particles',
    generatedContent: sampleMarkdownExplanation,
    format: 'markdown',
    onInsert: (content, format) => console.log('Insert:', { content, format }),
    onCopy: () => console.log('Copied to clipboard'),
    onRegenerate: () => console.log('Regenerate requested'),
    showInsertButton: true,
  },
};

export const PracticeExercises: Story = {
  args: {
    contentType: 'practice',
    topic: 'Hiragana Reading',
    generatedContent: sampleMarkdownPractice,
    format: 'markdown',
    onInsert: (content) => console.log('Insert:', content),
    showInsertButton: true,
  },
};

export const QuizContent: Story = {
  args: {
    contentType: 'quiz',
    topic: 'Verb Conjugation',
    generatedContent: sampleMarkdownQuiz,
    format: 'markdown',
    onInsert: (content) => console.log('Insert:', content),
    showInsertButton: true,
  },
};

export const VocabularySection: Story = {
  args: {
    contentType: 'vocabulary_section',
    topic: 'Food and Dining',
    generatedContent: sampleMarkdownVocabulary,
    format: 'markdown',
    onInsert: (content) => console.log('Insert:', content),
    showInsertButton: true,
  },
};

export const CompactView: Story = {
  args: {
    contentType: 'example',
    topic: 'Polite Speech',
    generatedContent: '## Example\n\nです/ます form is used for polite speech.',
    format: 'markdown',
    compact: true,
    onInsert: (content) => console.log('Insert:', content),
  },
};

export const RawViewMode: Story = {
  args: {
    contentType: 'custom',
    topic: 'Grammar Notes',
    generatedContent: sampleMarkdownExplanation,
    format: 'markdown',
    onInsert: (content) => console.log('Insert:', content),
  },
  play: async ({ canvasElement }) => {
    // Automatically switch to raw view
    const rawTab = canvasElement.querySelector('[value="raw"]') as HTMLElement;
    if (rawTab) rawTab.click();
  },
};

export const WithoutInsertButton: Story = {
  args: {
    contentType: 'summary',
    topic: 'Lesson Review',
    generatedContent: '## Summary\n\n- Particles は, が, を\n- Verb conjugation basics\n- Common vocabulary',
    format: 'markdown',
    showInsertButton: false,
  },
};

export const MultipleContentCards: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ContentPreview
        contentType="explanation"
        topic="Particles"
        generatedContent="## Particles\n\nParticles mark grammatical relationships."
        format="markdown"
        onInsert={(c) => console.log('Insert 1:', c)}
      />
      <ContentPreview
        contentType="practice"
        topic="Conjugation"
        generatedContent="### Practice\n\n1. 食べる → 食べた"
        format="markdown"
        onInsert={(c) => console.log('Insert 2:', c)}
      />
      <ContentPreview
        contentType="quiz"
        topic="Vocabulary"
        generatedContent="**Q:** What does こんにちは mean?\n\n**A:** Hello"
        format="markdown"
        onInsert={(c) => console.log('Insert 3:', c)}
      />
    </div>
  ),
};
