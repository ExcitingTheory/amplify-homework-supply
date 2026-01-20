/**
 * @fileoverview Storybook stories for ChatSidebar component
 * Demonstrates AI chat assistant for content creation and teaching support
 * 
 * The AI assistant helps educators:
 * - Get content ideas and lesson plans
 * - Search with natural language queries
 * - Do administrative tasks with natural language commands
 * - Translate text between languages and input modes
 * - Check grammar and pronunciation in multiple languages
 * - Generate quiz questions
 * - Answer questions about instructional topics
 * 
 * Note: All AWS services are mocked via webpack aliases in .storybook/main.js
 */

import React from 'react';
import ChatSidebar from './ChatSidebar';
import { UnitProvider } from '../context/unitContext';
import FilesContext from '../context/fileContext';
import { TabProvider } from '../context/tabContext';
import { DemoBanner } from '../../.storybook/components/DemoBanner';
import { allChatData } from '../../.storybook/__mocks__/chatDataLoader';
import { seedMockAssistantChats } from '../../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: '💬 AI Assistant/Chat Sidebar',
  component: ChatSidebar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# AI Chat Assistant

Your intelligent teaching assistant that helps you create better content, faster.

**What the AI can help with:**
- 💡 **Content Ideas** - Get suggestions for lessons, activities, and exercises
- 🌐 **Translation** - Translate between Japanese, English, and other languages
- ✍️ **Grammar Help** - Check and explain Japanese grammar
- ❓ **Quiz Generation** - Create questions based on your content
- 📚 **Vocabulary** - Find related words and example sentences
- 🎯 **Lesson Planning** - Structure your teaching materials
**Use AI with other tools:**
- [📝 Editor](?path=/docs/components-editor--empty-editor-text-formatting) - Create lessons with AI suggestions
- [🎙️ Recording Studio](?path=/docs/🎙️-recording-audio-recording-studio--coffee-shop-dialogue) - Generate dialogue scripts
- [📚 Workbook](?path=/docs/components-workbook--empty-workbook) - Design student exercises
**How to use:**
1. Type your question in the chat box
2. Press Enter or click Send
3. The AI will respond with helpful information
4. Ask follow-up questions to dig deeper
5. Use suggested actions when available

**Example questions:**
- "Help me create a lesson about Japanese seasons"
- "Translate 'good morning' to Japanese with pronunciation"
- "Generate 5 quiz questions about hiragana"
- "Explain the difference between は and が particles"
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <DemoBanner
          title="💬 AI Chat Assistant"
          description="Get help with content creation, translation, and teaching ideas"
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const GettingStarted = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: `
### 🌟 Getting Started with the AI Assistant

Start a conversation with your AI teaching assistant. The chat is empty and ready for your first question!

**Try asking:**

**For Content Ideas:**
- "Help me create a beginner lesson about Japanese greetings"
- "What activities can I use to teach hiragana?"
- "Give me ideas for a cultural lesson about Japanese festivals"

**For Translation:**
- "How do you say 'thank you very much' in Japanese?"
- "Translate 'I love learning Japanese' with pronunciation"
- "What's the difference between ありがとう and ありがとうございます?"

**For Quiz Questions:**
- "Generate 5 multiple choice questions about basic Japanese greetings"
- "Create practice questions for counting in Japanese"
- "Make quiz questions about Japanese sentence structure"

**For Grammar Help:**
- "Explain how to use the particle を"
- "When should I use です vs だ?"
- "How do Japanese adjectives conjugate?"

**Tips for better responses:**
- Be specific about your level (beginner, intermediate, advanced)
- Mention the age group you're teaching
- Ask follow-up questions to refine the content
- Request examples when helpful

**🚀 Quick Links:**
- [Translation Helper](?path=/docs/-ai-assistant-chat--translation-helper) - Focused translation tool
- [Content Creation](?path=/docs/-ai-assistant-chat--content-creation) - Generate lesson content
- [Quiz Generator](?path=/docs/-ai-assistant-chat--quiz-generator) - Create practice questions
- [Grammar Help](?path=/docs/-ai-assistant-chat--grammar-explainer) - Japanese grammar assistance
        `,
      },
    },
  },
};

export const TranslationHelper = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: `
### 🌐 Translation & Language Help

Use the AI as your translation assistant for creating bilingual content.

**What you can do:**
- 📝 Translate words, phrases, and sentences
- 🔊 Get pronunciation guides (romaji)
- 📖 Learn multiple ways to say the same thing
- 🎓 Understand cultural context
- ✏️ Check if your Japanese is natural

**Example prompts:**
- "Translate 'I would like to order coffee' to Japanese"
- "How do you write 'spring' in kanji?"
- "What's a polite way to say 'goodbye' in Japanese?"
- "Give me 3 ways to say 'delicious' in Japanese"
- "Is '日本語を勉強しています' correct?"

**Pro tips:**
- Ask for both formal and casual versions
- Request romaji for pronunciation
- Get kanji with furigana readings
- Ask about cultural appropriateness
- Learn when to use different levels of politeness
        `,
      },
    },
  },
};

export const ContentCreation = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: `
### ✨ Content Creation Assistant

Let the AI help you brainstorm and create engaging lesson materials.

**Lesson Planning:**
- "Create an outline for a 30-minute lesson about Japanese food vocabulary"
- "Design a week-long unit on Japanese grammar basics"
- "What should I include in a lesson about Japanese writing systems?"

**Activity Ideas:**
- "Suggest 5 interactive activities for teaching Japanese verbs"
- "Give me game ideas to practice hiragana"
- "How can I make grammar practice more engaging?"

**Dialogue Creation:**
- "Write a simple conversation at a Japanese restaurant"
- "Create a dialogue between two students introducing themselves"
- "Make a phone conversation example in Japanese"

**Vocabulary Lists:**
- "List 20 common Japanese food words with translations"
- "Give me essential travel phrases for Japan"
- "Create a vocabulary set about Japanese school life"

**The AI will:**
- ✅ Structure content appropriately for your learners
- ✅ Include cultural notes and context
- ✅ Suggest progression and scaffolding
- ✅ Provide example sentences and usage
- ✅ Offer variations for different skill levels
        `,
      },
    },
  },
};

export const WithFileAttachments = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates file attachment handling. The user uploaded a PDF and the AI acknowledged it for analysis.',
      },
    },
  },
};

export const QuizGenerator = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: `
### ❓ Quiz & Assessment Generator

Generate quiz questions, practice exercises, and assessments automatically.

**Create Questions:**
- "Generate 10 multiple choice questions about Japanese particles"
- "Make 5 fill-in-the-blank exercises for Japanese verbs"
- "Create true/false questions about Japanese culture"

**Different Question Types:**
- Multiple choice with distractors
- Short answer questions
- Translation exercises
- Matching activities
- Listening comprehension prompts

**Customization:**
- "Make them easier for beginners"
- "Add hints for each question"
- "Include explanations for correct answers"
- "Focus on practical, conversational Japanese"

**Example request:**
"Generate 5 quiz questions about basic Japanese greetings. Include:
- Multiple choice format
- 4 answer options each
- One correct answer
- Difficulty: beginner
- Include both formal and informal greetings"

**The AI provides:**
- ✅ Well-formatted questions
- ✅ Plausible wrong answers
- ✅ Answer keys
- ✅ Difficulty appropriate content
- ✅ Explanations when requested

**💡 Use with:** Add generated questions to the [Editor](?path=/docs/components-editor--empty-editor-text-formatting) with \`/quiz\` command
        `,
      },
    },
  },
};

export const GrammarExplainer = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: `
### 📚 Japanese Grammar Helper

Get clear explanations of Japanese grammar concepts with examples.

**Ask about:**
- "Explain the は (wa) particle with examples"
- "What's the difference between は and が?"
- "How do I conjugate ru-verbs in past tense?"
- "When do I use です vs だ?"
- "Explain Japanese adjective conjugation"

**Request examples:**
- "Give me 5 example sentences using the particle に"
- "Show me how to use ～たい form"
- "Examples of polite vs casual Japanese"

**Get comparisons:**
- "Difference between これ, それ, and あれ?"
- "When to use を vs に vs で?"
- "Compare ～ている and ～てある"

**Learning tips:**
- Start with one concept at a time
- Ask for examples at your level
- Request practice exercises
- Ask "why" to understand deeper
- Get memory tricks and mnemonics

**The AI explains:**
- ✅ Clear, simple language
- ✅ Multiple examples
- ✅ Common mistakes to avoid
- ✅ Usage in real contexts
- ✅ Practice suggestions
        `,
      },
    },
  },
};

export const ConversationHistory = {
  decorators: [
    (Story) => {
      // Seed mock assistant chat with conversation history from ui-data
      // These are real messages extracted from the working component
      seedMockAssistantChats([
        {
          id: 'chat-with-history',
          model: 'gpt-4',
          messages: allChatData, // Already in parts format from ui-data, leave as JSON
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          _version: 1,
        }
      ]);
      
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
### 💾 Conversation History

See an example of an ongoing conversation with the AI. This shows how the AI remembers context and builds on previous messages.

**Benefits of conversation context:**
- 📝 AI remembers what you talked about
- 🔄 You can ask follow-up questions
- 📊 Refine and improve responses
- 💡 Build on previous ideas
- 🎯 Get progressively better suggestions

**Example conversation flow:**

1. **You:** "Help me create a lesson about seasons"
2. **AI:** *[Provides lesson outline]*
3. **You:** "Make it simpler for beginners"
4. **AI:** *[Adjusts complexity down]*
5. **You:** "Add some vocabulary words"
6. **AI:** *[Adds vocabulary to the lesson]*

The AI understands "it", "that", and "this" in your questions because it remembers the context!
        `,
      },
    },
  },
};
