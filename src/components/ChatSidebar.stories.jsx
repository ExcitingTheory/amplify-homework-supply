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
import { seedMockAssistantChats } from '../../.storybook/__mocks__/aws-amplify-data';
import { allChatData } from '../../.storybook/__mocks__/chatDataLoader';
import { create } from 'domain';

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
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <DemoBanner
          title="💬 AI Chat Assistant"
          description="Get help with content creation, translation, and teaching ideas"
        />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const GettingStarted = {
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
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
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'translation-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'How do you say "good morning" in Japanese?' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: '"Good morning" in Japanese is:\n\n**おはようございます** (ohayou gozaimasu)\n\nThis is the polite form used in most situations. For casual situations with friends or family, you can just say:\n\n**おはよう** (ohayou)\n\nThe pronunciation breaks down as:\n- お (o) + はよう (hayou) + ございます (gozaimasu)\n\nWould you like to practice the pronunciation or learn other greetings?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
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
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const ContentCreation = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'content-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Help me create a beginner lesson about Japanese greetings' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: 'I\'d be happy to help you create a beginner lesson about Japanese greetings! Here\'s a structured lesson plan:\n\n## Lesson: Basic Japanese Greetings\n\n### Learning Objectives\nStudents will be able to:\n1. Recognize and pronounce 5 basic Japanese greetings\n2. Understand when to use formal vs casual greetings\n3. Respond appropriately to common greetings\n\n### Vocabulary\n1. **おはようございます** (ohayou gozaimasu) - Good morning (polite)\n2. **こんにちは** (konnichiwa) - Hello/Good afternoon\n3. **こんばんは** (konbanwa) - Good evening\n4. **さようなら** (sayounara) - Goodbye\n5. **ありがとうございます** (arigatou gozaimasu) - Thank you (polite)\n\n### Activities\n1. **Listening Practice**: Play audio of each greeting\n2. **Pronunciation Drill**: Students repeat after teacher\n3. **Role Play**: Practice greeting scenarios\n4. **Quiz**: Match greetings to situations\n\nWould you like me to generate quiz questions or create practice dialogues for this lesson?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
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
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const WithFileAttachments = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'file-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'I uploaded a PDF document about Japanese culture. Can you analyze it?' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: 'I\'ve received your PDF document about Japanese culture. I can help you analyze it in several ways:\n\n**What I can do with your PDF:**\n1. **Extract vocabulary** - Find Japanese words and create study lists\n2. **Generate questions** - Create comprehension questions based on the content\n3. **Summarize** - Provide a summary of key topics covered\n4. **Create lessons** - Use the content to build lesson plans\n5. **Find related content** - Suggest additional resources that complement the document\n\nWhat would you like me to help you with first?'
              }]
            }
          ],
          files: [] // Could add mock file data here
        }
      ]);
      return <Story />;
    }
  ],
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates file attachment handling. The user uploaded a PDF and the AI acknowledged it for analysis.',
      },
    },
  },
};

export const QuizGenerator = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'quiz-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Generate 3 multiple choice questions about hiragana characters' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: 'Here are 3 multiple choice questions about hiragana:\n\n**Question 1:** Which hiragana character represents the sound "ka"?\nA) き (ki)\nB) か (ka)\nC) く (ku)\nD) け (ke)\n\n**Answer:** B) か (ka)\n\n**Question 2:** What sound does the hiragana "す" make?\nA) shi\nB) su\nC) sa\nD) se\n\n**Answer:** B) su\n\n**Question 3:** Which of these is the correct hiragana for "n"?\nA) ん\nB) を\nC) ね\nD) に\n\n**Answer:** A) ん\n\nWould you like me to generate more questions or create questions about a different topic?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
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

**💡 Use with:** Export generated questions to the [Editor](?path=/docs/components-editor--empty-editor-text-formatting) with \`/quiz\` command
        `,
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const GrammarExplainer = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'grammar-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Explain the difference between the particles は (wa) and が (ga)' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: 'Great question! The particles は (wa) and が (ga) are often confusing for learners. Here\'s the key difference:\n\n### は (wa) - Topic Marker\nMarks what you\'re talking **about**. It sets the topic of the sentence.\n\n**Example:**\n私**は**学生です。(Watashi **wa** gakusei desu.)\n"As for me, (I) am a student."\n\n### が (ga) - Subject Marker\nMarks the grammatical **subject** doing the action or being described.\n\n**Example:**\n誰**が**来ましたか？(Dare **ga** kimashita ka?)\n"Who came?" (Who is the subject that came?)\n\n### Key Differences:\n1. **は** = "Speaking of X..." (topic)\n2. **が** = "X does/is..." (subject)\n\n### Common Pattern:\n私**は**猫**が**好きです。(Watashi **wa** neko **ga** suki desu.)\n"As for me, cats are likeable." = "I like cats."\n- 私は = topic (speaking of me)\n- 猫が = subject (cats are what is liked)\n\nWould you like more examples or practice sentences?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
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
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const ConversationHistory = {
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
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

export const ToolCallSearch = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'search-tool-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Search for content about hiragana' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [
                { type: 'text', text: 'I\'ll search for content about hiragana in your materials.' },
                {
                  type: 'tool-search_content',
                  toolCallId: 'call_search_123',
                  state: 'output-available',
                  input: {
                    query: 'hiragana',
                    type: 'all',
                    limit: 10
                  },
                  output: {
                    success: true,
                    query: 'hiragana',
                    results: [
                      {
                        type: 'word',
                        id: 'word-1',
                        similarity: 0.95,
                        phrase: 'ひらがな',
                        phonetic: 'hiragana',
                        definition: 'Japanese syllabary used for native words'
                      },
                      {
                        type: 'question',
                        id: 'q-1',
                        similarity: 0.88,
                        prompt: 'What is hiragana used for in Japanese writing?',
                        answer: 'Hiragana is used for native Japanese words, grammatical particles, and verb endings.'
                      },
                      {
                        type: 'file',
                        id: 'file-1',
                        similarity: 0.82,
                        name: 'Hiragana Chart.pdf',
                        description: 'Complete hiragana character chart with stroke order'
                      }
                    ]
                  }
                }
              ]
            },
            {
              id: 'msg3',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: 'I found **3 results** about hiragana:\n\n1. **Vocabulary**: ひらがな (hiragana) - Japanese syllabary used for native words\n2. **Question**: Practice question about hiragana usage\n3. **File**: Hiragana Chart.pdf with stroke order diagrams\n\nWould you like me to help you create a lesson using these materials?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
### 🔍 Tool Call Example: Content Search

Demonstrates the **search_content** tool in action. When users ask to search for content, the AI:

1. Executes a semantic search using embeddings
2. Shows the search query and parameters
3. Displays results with similarity scores
4. Formats findings in natural language

**Features shown:**
- Tool execution indicator
- Search parameters (query, type, limit)
- Results with type badges (word/question/file)
- Similarity scores
- Natural language summary

**Try asking:**
- \"Find vocabulary about colors\"
- \"Search for grammar questions\"
- \"Look for files containing audio\"
        `,
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const ToolCallCreateUnit = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'create-unit-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Create a new unit called "Katakana Basics" with a 20 minute timer' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [
                { type: 'text', text: 'I\'ll create a new unit for you.' },
                {
                  type: 'tool-create_unit',
                  toolCallId: 'call_create_456',
                  state: 'output-available',
                  input: {
                    name: 'Katakana Basics',
                    description: 'Introduction to katakana syllabary',
                    timeLimitSeconds: 1200
                  },
                  output: {
                    success: true,
                    unitId: 'unit-new-123',
                    name: 'Katakana Basics',
                    message: 'Unit created successfully with 20 minute timer'
                  }
                }
              ]
            },
            {
              id: 'msg3',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: '✅ Created **"Katakana Basics"** unit with a **20-minute timer**.\n\nThe unit is ready for you to add content. Would you like me to:\n- Generate a lesson outline?\n- Add vocabulary words?\n- Create practice questions?'
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
### ➕ Tool Call Example: Create Unit

Shows the **create_unit** tool creating a new learning unit with a timer.

**Process:**
1. AI parses user request for unit name and timer
2. Converts "20 minutes" to seconds (1200)
3. Creates unit in DataStore
4. Confirms with unit ID and details

**Features:**
- Input validation (name, timer)
- Success confirmation
- Follow-up suggestions

**Related tools:**
- create_section - Create class sections
- create_assignment - Assign units to sections
- add_timer_to_unit - Add/update timers
        `,
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const ToolCallGenerateContent = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'generate-content-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Generate practice exercises about Japanese particles' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [
                { type: 'text', text: 'I\'ll generate practice exercises for Japanese particles.' },
                {
                  type: 'tool-generate_unit_content',
                  toolCallId: 'call_gen_789',
                  state: 'output-available',
                  input: {
                    contentType: 'practice',
                    topic: 'Japanese particles (は, が, を, に, で)',
                    instructions: 'Create 5 fill-in-the-blank exercises'
                  },
                  output: {
                    success: true,
                    contentType: 'practice',
                    template: 'markdown'
                  }
                }
              ]
            },
            {
              id: 'msg3',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: `Here are practice exercises for Japanese particles:\n\n## Practice: Japanese Particles\n\n### Exercise 1\nFill in the blank with the correct particle:\n\n私___学生です。(I am a student)\n\n**Answer:** は (wa) - topic marker\n\n### Exercise 2\n本___読みます。(I read a book)\n\n**Answer:** を (wo) - object marker\n\n### Exercise 3\n学校___行きます。(I go to school)\n\n**Answer:** に (ni) - destination marker\n\n### Exercise 4\n誰___来ましたか？(Who came?)\n\n**Answer:** が (ga) - subject marker\n\n### Exercise 5\n図書館___勉強します。(I study at the library)\n\n**Answer:** で (de) - location of action marker\n\n---\n\n**💡 Tip:** Copy this content and paste it into your unit editor. The markdown will automatically convert to formatted content.`
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
### ✨ Tool Call Example: Generate Content

Demonstrates **generate_unit_content** tool creating educational materials.

**Content Generation Flow:**
1. User requests specific content type
2. AI calls tool with parameters
3. Tool returns template structure
4. AI generates actual markdown content
5. User can copy/paste into editor

**Content Types Available:**
- **explanation** - Educational text with key points
- **practice** - Interactive exercises (shown here)
- **quiz** - Questions with answers
- **example** - Demonstrations with explanations
- **summary** - Concise overviews
- **vocabulary** - Structured word lists

**Markdown Features:**
- Headings (##, ###)
- **Bold** text
- Lists and numbering
- Code blocks for examples
- Horizontal rules (---)

**Try asking:**
- "Generate a quiz about verb conjugation"
- "Create an explanation of Japanese honorifics"
- "Make a vocabulary section for food words"
        `,
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};

export const ToolCallMultiStep = {
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: 'multistep-chat',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful Japanese language learning assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: 'msg1',
              role: 'user',
              parts: [{ type: 'text', text: 'Create a section "Spring 2026 Japanese 101" and assign the Hiragana unit to it, due next Friday' }]
            },
            {
              id: 'msg2',
              role: 'assistant',
              parts: [
                { type: 'text', text: 'I\'ll create the section and assignment for you.' },
                {
                  type: 'tool-create_section',
                  toolCallId: 'call_sec_001',
                  state: 'output-available',
                  input: {
                    name: 'Spring 2026 Japanese 101',
                    description: 'Beginner Japanese language course for Spring 2026',
                    learner: 'spring2026-jp101'
                  },
                  output: {
                    success: true,
                    sectionId: 'section-abc-123',
                    name: 'Spring 2026 Japanese 101',
                    joinCode: 'JP101-S26'
                  }
                }
              ]
            },
            {
              id: 'msg3',
              role: 'assistant',
              parts: [
                { type: 'text', text: 'Section created. Now creating the assignment...' },
                {
                  type: 'tool-create_assignment',
                  toolCallId: 'call_assign_002',
                  state: 'output-available',
                  input: {
                    unitId: 'unit-hiragana-456',
                    sectionId: 'section-abc-123',
                    dueDate: '2026-01-31T17:00:00.000Z',
                    learner: 'spring2026-jp101'
                  },
                  output: {
                    success: true,
                    assignmentId: 'assign-xyz-789',
                    message: 'Assignment created and learner group added to unit'
                  }
                }
              ]
            },
            {
              id: 'msg4',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: `✅ **All done!**\n\n**Created:**\n- Section: "Spring 2026 Japanese 101" (Join Code: JP101-S26)\n- Assignment: Hiragana unit due Friday, January 31, 2026 at 5:00 PM\n\nStudents can now join using the code **JP101-S26** and will see the Hiragana assignment in their workbook.\n\n**Next steps:**\n- Share the join code with students\n- Add more units to the course\n- Set up grading preferences`
              }]
            }
          ]
        }
      ]);
      return <Story />;
    }
  ],
  parameters: {
    docs: {
      description: {
        story: `
### 🔗 Tool Call Example: Multi-Step Workflow

Demonstrates **multiple tools working together** to accomplish a complex task.

**Workflow:**
1. **create_section** - Creates new class section with join code
2. **create_assignment** - Assigns existing unit to new section
3. Automatic learner group management

**Features Shown:**
- Sequential tool execution
- Context passing between tools
- Join code generation
- Date parsing ("next Friday" → ISO 8601)
- Comprehensive confirmation message

**Real-World Use Cases:**
- "Create a section and add 3 units to it"
- "Make a new unit, add vocabulary, and create an assignment"
- "Search for content and create a lesson from it"

**Available Management Tools:**
- create_section, list_sections
- create_unit, update_unit, list_units
- create_assignment, delete_assignment
- create_vocabulary_word, create_question
        `,
      },
    },
  },
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
};
