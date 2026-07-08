import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ContentPreview } from './ContentPreview';

const meta: Meta<typeof ContentPreview> = {
  title: '💬 AI Assistant/Components/Content Preview',
  component: ContentPreview,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ContentPreview>;

const sampleMarkdown = `# Welcome to the Unit

This is a **practice exercise** about vocabulary.

## Instructions

1. Read each word carefully
2. Match the word to its definition
3. Check your answers

> Remember: practice makes perfect!

| Word | Definition |
|------|-----------|
| Ubiquitous | Present everywhere |
| Ephemeral | Short-lived |
`;

export const MarkdownFormat: Story = {
  args: {
    contentType: 'lesson',
    topic: 'Vocabulary Practice',
    generatedContent: sampleMarkdown,
    format: 'markdown',
    onInsert: fn(),
    onRegenerate: fn(),
    onCopy: fn(),
    showInsertButton: true,
  },
};

export const Compact: Story = {
  args: {
    ...MarkdownFormat.args,
    compact: true,
  },
};

export const NoActions: Story = {
  args: {
    contentType: 'quiz',
    topic: 'Multiple Choice Quiz',
    generatedContent: '## Quiz\n\nWhat is the capital of France?\n\n- [ ] London\n- [x] Paris\n- [ ] Berlin',
    format: 'markdown',
    showInsertButton: false,
  },
};

export const HTMLFormat: Story = {
  args: {
    contentType: 'explanation',
    topic: 'Grammar Rules',
    generatedContent: '<h2>Subject-Verb Agreement</h2><p>The subject and verb must agree in <strong>number</strong>.</p><ul><li>Singular subjects take singular verbs</li><li>Plural subjects take plural verbs</li></ul>',
    format: 'html',
    onInsert: fn(),
    onCopy: fn(),
    showInsertButton: true,
  },
};

export const LongContent: Story = {
  args: {
    contentType: 'lesson',
    topic: 'Extended Reading Passage',
    generatedContent: Array(10).fill('This is a paragraph of generated content that demonstrates how the preview handles longer text. ').join('\n\n'),
    format: 'markdown',
    onInsert: fn(),
    onRegenerate: fn(),
    onCopy: fn(),
    showInsertButton: true,
  },
};
