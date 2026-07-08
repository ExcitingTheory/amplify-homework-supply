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

import React from "react";
import { expect } from "storybook/test";
import { within, waitFor } from "storybook/test";
import { userEvent } from "storybook/test";
import ChatSidebar from "./ChatSidebar";
import { UnitProvider } from "../context/unitContext";
import FilesContext from "../context/fileContext";
import { TabProvider } from "../context/tabContext";
import { DemoBanner } from "@storybook-components/DemoBanner";
import {
  seedMockAssistantChats,
  seedMockWords,
  seedMockQuestions,
} from "@storybook-mocks/aws-amplify-data";
import { allChatData } from "@storybook-mocks/chatDataLoader";

export default {
  title: "💬 AI Assistant/Chat Sidebar",
  component: ChatSidebar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
# AI Chat Assistants

There are two AI assistants, each tailored to a different role:

**Kai — Student Tutor**
Kai is patient and encouraging. Rather than giving answers directly, Kai asks guiding questions and offers hints to help students reach understanding on their own. Kai knows the current lesson, vocabulary list, and the student's progress.

**Sage — Teaching Assistant**
Sage helps instructors build and improve content. Sage can generate quiz questions, suggest vocabulary, analyse student performance, and insert content blocks directly into the lesson editor.

---

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

**Example questions (Sage — instructor):**
- "Help me create a lesson about Japanese seasons"
- "Generate 5 quiz questions about hiragana"
- "Which students are struggling with particles?"

**Example questions (Kai — student):**
- "I don't understand this question, can you give me a hint?"
- "What does this vocabulary word mean in context?"
- "Can you explain the difference between は and が?"
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: "600px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <DemoBanner
          title="💬 AI Chat Assistant"
          description="Get help with content creation, translation, and teaching ideas"
        />
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            minHeight: 0,
          }}
        >
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
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: "getting-started-chat",
          model: "gpt-4",
          threadInstructions: "You are a helpful teaching assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [],
        },
      ]);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify chat input is visible
    const chatInput = await canvas.findByPlaceholderText(/ask me anything/i, {
      timeout: 5000,
    });
    expect(chatInput).toBeInTheDocument();

    // Type a message
    await userEvent.type(
      chatInput,
      "Help me create a Japanese greeting lesson",
    );

    // Find and click send button
    const sendButton = canvas.getByRole("button", { name: /send/i });
    await userEvent.click(sendButton);

    // Verify message appears in chat (input should be cleared)
    await waitFor(
      () => {
        expect(chatInput.value).toBe("");
      },
      { timeout: 3000 },
    );
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for messages to render
    await waitFor(
      () => {
        const messages = canvasElement.querySelectorAll(
          '[data-role="assistant"]',
        );
        expect(messages.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 5000 },
    );

    // Verify the translation response is visible
    expect(canvas.getByText(/ohayou gozaimasu/i)).toBeInTheDocument();
    expect(canvas.getByText(/polite form/i)).toBeInTheDocument();
  },
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: "translation-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: 'How do you say "good morning" in Japanese?',
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: '"Good morning" in Japanese is:\n\n**おはようございます** (ohayou gozaimasu)\n\nThis is the polite form used in most situations. For casual situations with friends or family, you can just say:\n\n**おはよう** (ohayou)\n\nThe pronunciation breaks down as:\n- お (o) + はよう (hayou) + ございます (gozaimasu)\n\nWould you like to practice the pronunciation or learn other greetings?',
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for content block preview to render
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(
          /Basic Japanese Greetings|insert_content_block|quiz/i,
        );
      },
      { timeout: 10000 },
    );
  },
  decorators: [
    (Story) => {
      // Seed words for the answer block
      seedMockWords([
        {
          id: "word-ohayou",
          phrase: "おはようございます",
          phonetic: "ohayou gozaimasu",
          definition: "Good morning (polite)",
          owner: "mock-user",
        },
        {
          id: "word-konnichiwa",
          phrase: "こんにちは",
          phonetic: "konnichiwa",
          definition: "Hello/Good afternoon",
          owner: "mock-user",
        },
        {
          id: "word-konbanwa",
          phrase: "こんばんは",
          phonetic: "konbanwa",
          definition: "Good evening",
          owner: "mock-user",
        },
        {
          id: "word-sayounara",
          phrase: "さようなら",
          phonetic: "sayounara",
          definition: "Goodbye",
          owner: "mock-user",
        },
        {
          id: "word-arigatou",
          phrase: "ありがとうございます",
          phonetic: "arigatou gozaimasu",
          definition: "Thank you (polite)",
          owner: "mock-user",
        },
      ]);

      seedMockAssistantChats([
        {
          id: "content-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Help me create a beginner lesson about Japanese greetings with interactive exercises",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I'll create a complete lesson with an introduction, vocabulary practice, and a quiz. Let me generate the content blocks for you.",
                },
                {
                  type: "step-start",
                  toolCall: "insert_content_block",
                  toolCallId: "call_content_greetings_001",
                },
                {
                  type: "tool-insert_content_block",
                  toolCallId: "call_content_greetings_001",
                  state: "output-available",
                  input: {
                    contentType: "lesson",
                    topic: "Basic Japanese Greetings",
                    instructions:
                      "Create an introductory lesson about Japanese greetings",
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "content",
                    blockData: {
                      root: {
                        children: [
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Basic Japanese Greetings",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h2",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Learning Objectives",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h3",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "By the end of this lesson, students will be able to recognize and pronounce 5 basic Japanese greetings, understand when to use formal vs casual forms, and respond appropriately in common greeting scenarios.",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Key Vocabulary",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h3",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "おはようございます",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: " (ohayou gozaimasu) — Good morning. Used until about 10-11am. The casual form おはよう is used with friends and family.",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "こんにちは",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: " (konnichiwa) — Hello / Good afternoon. The most versatile greeting, used from late morning to early evening.",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "こんばんは",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: " (konbanwa) — Good evening. Used after sunset.",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "さようなら",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: " (sayounara) — Goodbye. More formal; casual alternatives include じゃあね (jaa ne) or またね (mata ne).",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "ありがとうございます",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: " (arigatou gozaimasu) — Thank you (polite). Casual: ありがとう (arigatou).",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "root",
                        version: 1,
                      },
                    },
                    preview: {
                      title: "Basic Japanese Greetings",
                      contentType: "lesson",
                      nodeCount: 9,
                      excerpt:
                        "Introduction to 5 essential Japanese greetings with pronunciation and usage context",
                    },
                    message: "Lesson content ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "Now let me add a vocabulary matching exercise and a quiz.",
                },
                {
                  type: "step-start",
                  toolCall: "insert_meaning_association",
                  toolCallId: "call_meaning_greetings_001",
                },
                {
                  type: "tool-insert_meaning_association",
                  toolCallId: "call_meaning_greetings_001",
                  state: "output-available",
                  input: {
                    wordIDs: [
                      "word-ohayou",
                      "word-konnichiwa",
                      "word-konbanwa",
                      "word-sayounara",
                      "word-arigatou",
                    ],
                    enabledModes: ["learn", "easy", "hard"],
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "meaning-association",
                    blockData: [
                      "word-ohayou",
                      "word-konnichiwa",
                      "word-konbanwa",
                      "word-sayounara",
                      "word-arigatou",
                    ],
                    preview: {
                      wordCount: 5,
                      instructions:
                        "Match each Japanese greeting with its English meaning",
                      modes: ["learn", "easy", "hard"],
                    },
                    message: "Meaning association block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg4",
              role: "assistant",
              parts: [
                {
                  type: "step-start",
                  toolCall: "insert_quiz",
                  toolCallId: "call_quiz_greetings_001",
                },
                {
                  type: "tool-insert_quiz",
                  toolCallId: "call_quiz_greetings_001",
                  state: "output-available",
                  input: {
                    topic: "Japanese greetings usage",
                    count: 3,
                    questionType: "multiple_choice",
                    difficulty: "beginner",
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "quiz",
                    blockData: [
                      {
                        id: "gq1-a",
                        answer: "こんにちは",
                        question: "Which greeting would you use at 2pm?",
                        correct: true,
                      },
                      {
                        id: "gq1-b",
                        answer: "おはようございます",
                        question: "Which greeting would you use at 2pm?",
                        correct: false,
                      },
                      {
                        id: "gq1-c",
                        answer: "こんばんは",
                        question: "Which greeting would you use at 2pm?",
                        correct: false,
                      },
                      {
                        id: "gq1-d",
                        answer: "さようなら",
                        question: "Which greeting would you use at 2pm?",
                        correct: false,
                      },
                      {
                        id: "gq2-a",
                        answer: "おはよう",
                        question: 'Which is the CASUAL form of "good morning"?',
                        correct: true,
                      },
                      {
                        id: "gq2-b",
                        answer: "おはようございます",
                        question: 'Which is the CASUAL form of "good morning"?',
                        correct: false,
                      },
                      {
                        id: "gq2-c",
                        answer: "こんにちは",
                        question: 'Which is the CASUAL form of "good morning"?',
                        correct: false,
                      },
                      {
                        id: "gq2-d",
                        answer: "こんばんは",
                        question: 'Which is the CASUAL form of "good morning"?',
                        correct: false,
                      },
                      {
                        id: "gq3-a",
                        answer: "ありがとうございます",
                        question: "How do you politely thank your teacher?",
                        correct: true,
                      },
                      {
                        id: "gq3-b",
                        answer: "ありがとう",
                        question: "How do you politely thank your teacher?",
                        correct: false,
                      },
                      {
                        id: "gq3-c",
                        answer: "さようなら",
                        question: "How do you politely thank your teacher?",
                        correct: false,
                      },
                      {
                        id: "gq3-d",
                        answer: "こんにちは",
                        question: "How do you politely thank your teacher?",
                        correct: false,
                      },
                    ],
                    preview: {
                      title: "Japanese Greetings Quiz",
                      questionCount: 3,
                      totalPoints: 3,
                      questions: [
                        {
                          prompt: "Which greeting would you use at 2pm?",
                          type: "multiple_choice",
                        },
                        {
                          prompt: 'Which is the CASUAL form of "good morning"?',
                          type: "multiple_choice",
                        },
                        {
                          prompt: "How do you politely thank your teacher?",
                          type: "multiple_choice",
                        },
                      ],
                    },
                    message: "Quiz block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg5",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: 'Your lesson is ready! I\'ve created 3 interactive blocks:\n\n1. **Content Block** — Lesson introduction with vocabulary explanations\n2. **Meaning Association** — Drag-and-drop matching exercise (5 words, 3 modes)\n3. **Quiz** — 3 multiple choice questions testing greeting usage\n\nClick "Insert into Editor" on each block to add them to your unit in order. The blocks use the actual editor components your students will interact with!',
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for PDF acknowledgment message
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(
          /PDF|document|Japanese culture/i,
        );
      },
      { timeout: 10000 },
    );

    // Verify AI's analysis options are shown
    expect(canvas.getByText(/Extract vocabulary/i)).toBeInTheDocument();
  },
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: "file-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "I uploaded a PDF document about Japanese culture. Can you analyze it?",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I've received your PDF document about Japanese culture. I can help you analyze it in several ways:\n\n**What I can do with your PDF:**\n1. **Extract vocabulary** - Find Japanese words and create study lists\n2. **Generate questions** - Create comprehension questions based on the content\n3. **Summarize** - Provide a summary of key topics covered\n4. **Create lessons** - Use the content to build lesson plans\n5. **Find related content** - Suggest additional resources that complement the document\n\nWhat would you like me to help you with first?",
                },
              ],
            },
          ],
          files: [], // Could add mock file data here
        },
      ]);
      return <Story />;
    },
  ],
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story:
          "Demonstrates file attachment handling. The user uploaded a PDF and the AI acknowledged it for analysis.",
      },
    },
  },
};

export const QuizGenerator = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for tool call preview to render
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(/quiz|hiragana/i);
      },
      { timeout: 10000 },
    );

    // Verify quiz-related content appeared
    expect(canvasElement.textContent).toMatch(/hiragana|quiz|question/i);
  },
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: "quiz-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Generate 3 multiple choice questions about hiragana characters",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "step-start" },
                {
                  type: "text",
                  text: "I'll create a quiz block with 3 multiple choice questions about hiragana characters.",
                },
                {
                  type: "tool-insert_quiz",
                  toolCallId: "call_quiz_456",
                  state: "output-available",
                  input: {
                    topic: "hiragana characters",
                    count: 3,
                    questionType: "multiple_choice",
                    difficulty: "beginner",
                    includeExplanations: true,
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "quiz",
                    blockData: [
                      // Question 1: Which hiragana character represents "ka"?
                      {
                        id: "q1-a",
                        answer: "き (ki)",
                        question:
                          'Which hiragana character represents the sound "ka"?',
                        correct: false,
                      },
                      {
                        id: "q1-b",
                        answer: "か (ka)",
                        question:
                          'Which hiragana character represents the sound "ka"?',
                        correct: true,
                      },
                      {
                        id: "q1-c",
                        answer: "く (ku)",
                        question:
                          'Which hiragana character represents the sound "ka"?',
                        correct: false,
                      },
                      {
                        id: "q1-d",
                        answer: "け (ke)",
                        question:
                          'Which hiragana character represents the sound "ka"?',
                        correct: false,
                      },
                      // Question 2: What sound does す make?
                      {
                        id: "q2-a",
                        answer: "shi",
                        question: 'What sound does the hiragana "す" make?',
                        correct: false,
                      },
                      {
                        id: "q2-b",
                        answer: "su",
                        question: 'What sound does the hiragana "す" make?',
                        correct: true,
                      },
                      {
                        id: "q2-c",
                        answer: "sa",
                        question: 'What sound does the hiragana "す" make?',
                        correct: false,
                      },
                      {
                        id: "q2-d",
                        answer: "se",
                        question: 'What sound does the hiragana "す" make?',
                        correct: false,
                      },
                      // Question 3: Correct hiragana for "n"?
                      {
                        id: "q3-a",
                        answer: "ん",
                        question:
                          'Which of these is the correct hiragana for "n"?',
                        correct: true,
                      },
                      {
                        id: "q3-b",
                        answer: "を",
                        question:
                          'Which of these is the correct hiragana for "n"?',
                        correct: false,
                      },
                      {
                        id: "q3-c",
                        answer: "ね",
                        question:
                          'Which of these is the correct hiragana for "n"?',
                        correct: false,
                      },
                      {
                        id: "q3-d",
                        answer: "に",
                        question:
                          'Which of these is the correct hiragana for "n"?',
                        correct: false,
                      },
                    ],
                    preview: {
                      title: "Hiragana Characters Quiz",
                      questionCount: 3,
                      totalPoints: 3,
                      questions: [
                        {
                          prompt:
                            'Which hiragana character represents the sound "ka"?',
                          type: "multiple_choice",
                        },
                        {
                          prompt: 'What sound does the hiragana "す" make?',
                          type: "multiple_choice",
                        },
                        {
                          prompt:
                            'Which of these is the correct hiragana for "n"?',
                          type: "multiple_choice",
                        },
                      ],
                    },
                    message: "Quiz block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I've created a quiz with 3 multiple choice questions about hiragana characters. You can select your answers by clicking the checkboxes. The quiz will automatically grade your responses!",
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: `
### ❓ Quiz Block Insertion

Demonstrates the **insert_quiz** tool creating interactive quiz blocks directly in the editor.

**What This Shows:**
- AI generates quiz questions with the \`insert_quiz\` tool
- Block preview displays question count, points, and sample questions
- User can approve to insert into editor or reject
- Questions include explanations for learning

**Block Features:**
- 📝 Multiple choice format
- ✓ Correct answer marking
- 💡 Explanations for each question
- 📊 Point values and scoring

**Create Questions:**
- "Generate 10 multiple choice questions about Japanese particles"
- "Make 5 fill-in-the-blank exercises for Japanese verbs"
- "Create quiz about hiragana characters with explanations"

**Customization:**
- "Make them easier for beginners"
- "Add hints for each question"
- "Include explanations for correct answers"
- "Focus on practical, conversational Japanese"

**Block Types Available:**
- \`insert_quiz\` - Multiple choice, fill-in, true/false questions
- \`insert_answer_block\` - Free-form text input exercises
- \`insert_meaning_association\` - Vocabulary matching games
- \`insert_custom_answer\` - Specific answer validation

**The tool generates:**
- ✅ Interactive preview with question details
- ✅ Approve/Reject buttons for user control
- ✅ Structured blockData ready for editor insertion
- ✅ Question explanations and point values
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

export const AnswerBlockGenerator = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for answer block content to render
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(
          /greetings|answer|block|insert/i,
        );
      },
      { timeout: 15000 },
    );
  },
  decorators: [
    (Story) => {
      // Seed mock words for answer block
      seedMockWords([
        {
          id: "word-1",
          phrase: "こんにちは",
          phonetic: "konnichiwa",
          definition: "Hello/Good afternoon",
          owner: "mock-user",
        },
        {
          id: "word-2",
          phrase: "ありがとう",
          phonetic: "arigatou",
          definition: "Thank you",
          owner: "mock-user",
        },
        {
          id: "word-3",
          phrase: "さようなら",
          phonetic: "sayounara",
          definition: "Goodbye",
          owner: "mock-user",
        },
      ]);

      seedMockAssistantChats([
        {
          id: "answer-block-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Create an answer block where students translate 3 basic Japanese greetings",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "step-start" },
                {
                  type: "text",
                  text: "I'll create an answer block with 3 Japanese greeting words for translation practice.",
                },
                {
                  type: "tool-insert_answer_block",
                  toolCallId: "call_answer_789",
                  state: "output-available",
                  input: {
                    wordIDs: ["word-1", "word-2", "word-3"],
                    mode: "translate",
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "answer",
                    blockData: ["word-1", "word-2", "word-3"],
                    preview: {
                      wordCount: 3,
                      mode: "translate",
                      inputMethods: ["text", "audio", "writing"],
                    },
                    message: "Answer block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I've created an answer block with 3 Japanese greetings. Students can type their translations, record audio, or write them out!",
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: `
### ✍️ Answer Block Insertion

Demonstrates the **insert_answer_block** tool creating interactive answer exercises.

**What This Shows:**
- AI generates answer block with word IDs
- Students can respond via text, audio, or handwriting
- AI verification of answers
- Progress tracking

**Block Features:**
- 📝 Multiple input methods (text/audio/writing)
- ✓ AI-powered answer verification
- 💡 Hints and corrections
- 📊 Progress tracking

**Create Exercises:**
- "Make an answer block for vocabulary translation"
- "Create a short answer exercise about Japanese verbs"
- "Generate definition practice for 5 words"

**Input Methods:**
- **Text**: Type answers directly
- **Audio**: Record spoken answers
- **Writing**: Draw answers with stylus/mouse

**The tool generates:**
- ✅ Interactive input with multiple methods
- ✅ AI verification via ChatGPT
- ✅ Progress bar and completion tracking
- ✅ Flexible answer checking
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

export const MeaningAssociationGenerator = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for meaning association content to render
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(
          /color|words|meaning|association/i,
        );
      },
      { timeout: 15000 },
    );
  },
  decorators: [
    (Story) => {
      // Seed mock words for meaning association
      seedMockWords([
        {
          id: "word-1",
          phrase: "赤",
          phonetic: "aka",
          definition: "red",
          owner: "mock-user",
        },
        {
          id: "word-2",
          phrase: "青",
          phonetic: "ao",
          definition: "blue",
          owner: "mock-user",
        },
        {
          id: "word-3",
          phrase: "緑",
          phonetic: "midori",
          definition: "green",
          owner: "mock-user",
        },
        {
          id: "word-4",
          phrase: "黄色",
          phonetic: "kiiro",
          definition: "yellow",
          owner: "mock-user",
        },
      ]);

      seedMockAssistantChats([
        {
          id: "meaning-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Create a matching exercise for Japanese color words",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "step-start" },
                {
                  type: "text",
                  text: "I'll create a meaning association exercise where students match Japanese color words with their definitions.",
                },
                {
                  type: "tool-insert_meaning_association",
                  toolCallId: "call_meaning_101",
                  state: "output-available",
                  input: {
                    wordIDs: ["word-1", "word-2", "word-3", "word-4"],
                    enabledModes: ["learn", "easy", "hard"],
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "meaning-association",
                    blockData: ["word-1", "word-2", "word-3", "word-4"],
                    preview: {
                      wordCount: 4,
                      instructions:
                        "Match each Japanese word with its English meaning",
                      modes: ["learn", "easy", "hard"],
                    },
                    message: "Meaning association block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I've created a meaning association exercise with 4 color words. Students can practice in Learn mode (flashcards), Easy mode (drag-and-drop), or Hard mode (timed challenge)!",
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: `
### 🔗 Meaning Association Block

Demonstrates the **insert_meaning_association** tool creating drag-and-drop vocabulary matching exercises.

**What This Shows:**
- AI generates matching exercise with word IDs
- Three difficulty modes (Learn, Easy, Hard)
- Drag-and-drop interaction
- Automatic scoring

**Block Features:**
- 📚 **Learn Mode**: Flashcard-style review
- 🎯 **Easy Mode**: Drag phrases to match definitions
- ⚡ **Hard Mode**: Timed challenge with shuffled options
- 📊 Progress tracking and completion

**Create Exercises:**
- "Make a matching exercise for Japanese particles"
- "Create vocabulary matching for food words"
- "Generate a drag-and-drop exercise for verbs"

**Difficulty Modes:**
- **Learn**: Review one word at a time with definitions visible
- **Easy**: Drag Japanese words to match English definitions
- **Hard**: Timed matching with randomized positions

**The tool generates:**
- ✅ Interactive drag-and-drop interface
- ✅ Configurable difficulty modes
- ✅ Real-time feedback and scoring
- ✅ Progress tracking across modes
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

export const CustomAnswerGenerator = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for tool call preview
    await waitFor(
      () => {
        expect(canvasElement.textContent).toMatch(
          /question|custom.answer|Listen/i,
        );
      },
      { timeout: 10000 },
    );
  },
  decorators: [
    (Story) => {
      // Seed mock questions for custom answer block
      seedMockQuestions([
        {
          id: "q-1",
          prompt: "Listen and type what you hear",
          answer: "おはよう",
          phonetic: "ohayou",
          audioKey:
            "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          owner: "mock-user",
        },
        {
          id: "q-2",
          prompt: "Listen and type what you hear",
          answer: "おやすみ",
          phonetic: "oyasumi",
          audioKey:
            "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          owner: "mock-user",
        },
      ]);

      seedMockAssistantChats([
        {
          id: "custom-answer-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Create questions where students listen to Japanese audio and type what they hear",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "step-start" },
                {
                  type: "text",
                  text: "I'll create a custom answer block with audio-based questions where students transcribe what they hear.",
                },
                {
                  type: "tool-insert_custom_answer",
                  toolCallId: "call_custom_202",
                  state: "output-available",
                  input: {
                    questionIDs: ["q-1", "q-2"],
                    allowedInput: ["text"],
                    promptMethod: ["audio"],
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "custom-answer",
                    blockData: ["q-1", "q-2"],
                    preview: {
                      questionCount: 2,
                      prompt: "Listen to the audio and type what you hear",
                      answerCount: 2,
                      caseSensitive: false,
                      allowMultipleAttempts: true,
                      inputMethods: ["text"],
                      promptMethods: ["audio"],
                    },
                    message: "Custom answer block ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I've created a listening comprehension exercise with 2 questions. Students will hear audio prompts and type their answers!",
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: `
### 🎯 Custom Answer Block

Demonstrates the **insert_custom_answer** tool creating exercises with specific answer validation.

**What This Shows:**
- AI generates custom questions from question bank
- Flexible input/output methods
- Specific answer checking
- Multiple attempts support

**Block Features:**
- 🎧 **Audio Prompts**: Questions presented as audio
- 📝 **Text Input**: Type answers
- ✏️ **Writing Input**: Draw answers
- 🎤 **Audio Input**: Speak answers
- ✓ Exact answer matching with AI verification

**Create Exercises:**
- "Make listening comprehension questions"
- "Create audio-to-text transcription practice"
- "Generate questions with specific correct answers"

**Input/Output Combinations:**
- **Audio → Text**: Listen and type
- **Text → Audio**: Read and speak
- **Audio → Audio**: Listen and repeat
- **Text → Writing**: Read and write

**The tool generates:**
- ✅ Configurable prompt and input methods
- ✅ Specific answer validation
- ✅ Multiple attempt support
- ✅ Real-time feedback
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for grammar explanation
    await waitFor(
      () => {
        expect(
          canvas.getByText(/は \(wa\) - Topic Marker/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify examples are shown
    expect(canvas.getByText(/が \(ga\) - Subject Marker/i)).toBeInTheDocument();
  },
  decorators: [
    (Story) => {
      seedMockAssistantChats([
        {
          id: "grammar-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Explain the difference between the particles は (wa) and が (ga)",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: 'Great question! The particles は (wa) and が (ga) are often confusing for learners. Here\'s the key difference:\n\n### は (wa) - Topic Marker\nMarks what you\'re talking **about**. It sets the topic of the sentence.\n\n**Example:**\n私**は**学生です。(Watashi **wa** gakusei desu.)\n"As for me, (I) am a student."\n\n### が (ga) - Subject Marker\nMarks the grammatical **subject** doing the action or being described.\n\n**Example:**\n誰**が**来ましたか？(Dare **ga** kimashita ka?)\n"Who came?" (Who is the subject that came?)\n\n### Key Differences:\n1. **は** = "Speaking of X..." (topic)\n2. **が** = "X does/is..." (subject)\n\n### Common Pattern:\n私**は**猫**が**好きです。(Watashi **wa** neko **ga** suki desu.)\n"As for me, cats are likeable." = "I like cats."\n- 私は = topic (speaking of me)\n- 猫が = subject (cats are what is liked)\n\nWould you like more examples or practice sentences?',
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
      // Seed mock words used by the tool calls in the conversation
      seedMockWords([
        {
          id: "word-aka",
          phrase: "赤",
          phonetic: "aka",
          definition: "red",
          owner: "mock-user",
        },
        {
          id: "word-ao",
          phrase: "青",
          phonetic: "ao",
          definition: "blue",
          owner: "mock-user",
        },
        {
          id: "word-midori",
          phrase: "緑",
          phonetic: "midori",
          definition: "green",
          owner: "mock-user",
        },
        {
          id: "word-kiiro",
          phrase: "黄色",
          phonetic: "kiiro",
          definition: "yellow",
          owner: "mock-user",
        },
        {
          id: "word-konnichiwa",
          phrase: "こんにちは",
          phonetic: "konnichiwa",
          definition: "Hello/Good afternoon",
          owner: "mock-user",
        },
        {
          id: "word-arigatou",
          phrase: "ありがとう",
          phonetic: "arigatou",
          definition: "Thank you",
          owner: "mock-user",
        },
        {
          id: "word-sayounara",
          phrase: "さようなら",
          phonetic: "sayounara",
          definition: "Goodbye",
          owner: "mock-user",
        },
      ]);

      seedMockQuestions([
        {
          id: "q-listen-1",
          prompt: "Listen and type what you hear",
          answer: "おはよう",
          phonetic: "ohayou",
          owner: "mock-user",
        },
        {
          id: "q-listen-2",
          prompt: "Listen and type what you hear",
          answer: "おやすみ",
          phonetic: "oyasumi",
          owner: "mock-user",
        },
      ]);

      // allChatData is a complete AssistantChat object with messages from chat-bot-2.3.json
      seedMockAssistantChats([allChatData]);

      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
          id: "search-tool-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                { type: "text", text: "Search for content about hiragana" },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I'll search for content about hiragana in your materials.",
                },
                {
                  type: "tool-search_content",
                  toolCallId: "call_search_123",
                  state: "output-available",
                  input: {
                    query: "hiragana",
                    type: "all",
                    limit: 10,
                  },
                  output: {
                    success: true,
                    query: "hiragana",
                    results: [
                      {
                        type: "word",
                        id: "word-1",
                        similarity: 0.95,
                        phrase: "ひらがな",
                        phonetic: "hiragana",
                        definition: "Japanese syllabary used for native words",
                      },
                      {
                        type: "question",
                        id: "q-1",
                        similarity: 0.88,
                        prompt:
                          "What is hiragana used for in Japanese writing?",
                        answer:
                          "Hiragana is used for native Japanese words, grammatical particles, and verb endings.",
                      },
                      {
                        type: "file",
                        id: "file-1",
                        similarity: 0.82,
                        name: "Hiragana Chart.pdf",
                        description:
                          "Complete hiragana character chart with stroke order",
                      },
                    ],
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I found **3 results** about hiragana:\n\n1. **Vocabulary**: ひらがな (hiragana) - Japanese syllabary used for native words\n2. **Question**: Practice question about hiragana usage\n3. **File**: Hiragana Chart.pdf with stroke order diagrams\n\nWould you like me to help you create a lesson using these materials?",
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
          id: "create-unit-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: 'Create a new unit called "Katakana Basics" with a 20 minute timer',
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "text", text: "I'll create a new unit for you." },
                {
                  type: "tool-create_unit",
                  toolCallId: "call_create_456",
                  state: "output-available",
                  input: {
                    name: "Katakana Basics",
                    description: "Introduction to katakana syllabary",
                    timeLimitSeconds: 1200,
                  },
                  output: {
                    success: true,
                    unitId: "unit-new-123",
                    name: "Katakana Basics",
                    message: "Unit created successfully with 20 minute timer",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: '✅ Created **"Katakana Basics"** unit with a **20-minute timer**.\n\nThe unit is ready for you to add content. Would you like me to:\n- Generate a lesson outline?\n- Add vocabulary words?\n- Create practice questions?',
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
          id: "generate-content-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Generate practice exercises about Japanese particles",
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                { type: "step-start" },
                {
                  type: "text",
                  text: "I'll create practice exercises about Japanese particles that you can insert into your unit.",
                },
                {
                  type: "tool-insert_content_block",
                  toolCallId: "call_gen_789",
                  state: "output-available",
                  input: {
                    contentType: "practice",
                    topic: "Japanese particles (は, が, を, に, で)",
                    instructions: "Create 5 fill-in-the-blank exercises",
                  },
                  output: {
                    success: true,
                    action: "insert_editor_block",
                    blockType: "content",
                    blockData: {
                      root: {
                        children: [
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Practice: Japanese Particles",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h2",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Exercise 1",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h3",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Fill in the blank with the correct particle:",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "私___学生です。(I am a student)",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Answer: ",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "は (wa) - topic marker",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Exercise 2",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "heading",
                            version: 1,
                            tag: "h3",
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "本___読みます。(I read a book)",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                          {
                            children: [
                              {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Answer: ",
                                type: "text",
                                version: 1,
                              },
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "を (wo) - object marker",
                                type: "text",
                                version: 1,
                              },
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                          },
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "root",
                        version: 1,
                      },
                    },
                    preview: {
                      title: "Practice: Japanese Particles",
                      contentType: "practice",
                      nodeCount: 8,
                      excerpt:
                        "Fill-in-the-blank exercises for Japanese particles は, が, を, に, で",
                    },
                    message: "Content ready to insert",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: 'I\'ve created practice exercises for Japanese particles. Click "Insert into Editor" to add them to your unit!',
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: `
### ✨ Content Block Insertion

Demonstrates **insert_content_block** tool creating insertable educational content.

**What This Shows:**
- AI generates formatted content as Lexical editor JSON
- Preview shows rendered content
- Click "Insert into Editor" to add to unit
- No copy-paste required

**Content Types Available:**
- **explanation** - Educational text with key points
- **practice** - Interactive exercises (shown here)
- **example** - Demonstrations with explanations
- **summary** - Concise overviews
- **vocabulary** - Structured word lists

**Block Features:**
- 📝 Rich text formatting (headings, bold, lists)
- ✨ Proper Lexical editor structure
- 🎯 Direct insertion into editor
- 📄 Preview before inserting

**Create Content:**
- "Generate practice exercises for Japanese verbs"
- "Create an explanation of particle usage"
- "Make vocabulary examples with sentences"

**The tool generates:**
- ✅ Formatted Lexical editor JSON
- ✅ Visual preview of content
- ✅ Insert/Reject buttons
- ✅ Seamless editor integration
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
          id: "multistep-chat",
          model: "gpt-4",
          threadInstructions:
            "You are a helpful Japanese language learning assistant.",
          draft: "",
          archived: false,
          owner: "mock-user-sub",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [
            {
              id: "msg1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: 'Create a section "Spring 2026 Japanese 101" and assign the Hiragana unit to it, due next Friday',
                },
              ],
            },
            {
              id: "msg2",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I'll create the section and assignment for you.",
                },
                {
                  type: "tool-create_section",
                  toolCallId: "call_sec_001",
                  state: "output-available",
                  input: {
                    name: "Spring 2026 Japanese 101",
                    description:
                      "Beginner Japanese language course for Spring 2026",
                    learner: "spring2026-jp101",
                  },
                  output: {
                    success: true,
                    sectionId: "section-abc-123",
                    name: "Spring 2026 Japanese 101",
                    joinCode: "JP101-S26",
                  },
                },
              ],
            },
            {
              id: "msg3",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "Section created. Now creating the assignment...",
                },
                {
                  type: "tool-create_assignment",
                  toolCallId: "call_assign_002",
                  state: "output-available",
                  input: {
                    unitId: "unit-hiragana-456",
                    sectionId: "section-abc-123",
                    dueDate: "2026-01-31T17:00:00.000Z",
                    learner: "spring2026-jp101",
                  },
                  output: {
                    success: true,
                    assignmentId: "assign-xyz-789",
                    message:
                      "Assignment created and learner group added to unit",
                  },
                },
              ],
            },
            {
              id: "msg4",
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: `✅ **All done!**\n\n**Created:**\n- Section: "Spring 2026 Japanese 101" (Join Code: JP101-S26)\n- Assignment: Hiragana unit due Friday, January 31, 2026 at 5:00 PM\n\nStudents can now join using the code **JP101-S26** and will see the Hiragana assignment in their workbook.\n\n**Next steps:**\n- Share the join code with students\n- Add more units to the course\n- Set up grading preferences`,
                },
              ],
            },
          ],
        },
      ]);
      return <Story />;
    },
  ],
  parameters: {
    initializeMockData: false,
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
