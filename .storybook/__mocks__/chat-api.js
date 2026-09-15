/**
 * Mock chat API for Storybook
 * Simulates streaming responses and tool block responses from the AI assistant
 */

/**
 * Extract text content from a message object.
 * Supports both AI SDK v6 format (message.parts) and legacy format (message.content).
 */
export function getMessageText(message) {
  if (!message) return "";
  // AI SDK v6: parts-based messages
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  // Legacy: content string
  if (typeof message.content === "string") {
    return message.content;
  }
  return "";
}

/**
 * Generate a full assistant message object including tool calls & preview blocks when requested
 */
export function generateMockAssistantMessage(userText = "", context = {}) {
  const content = userText.toLowerCase();
  const id = `msg-asst-${Date.now()}`;

  // 1. Quiz creation request
  if (content.includes("quiz") || content.includes("multiple choice")) {
    return {
      id,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "I'll create an interactive multiple-choice quiz testing Japanese greeting scenarios.",
        },
        {
          type: "step-start",
          toolCall: "insert_quiz",
          toolCallId: `call_quiz_${Date.now()}`,
        },
        {
          type: "tool-insert_quiz",
          toolCallId: `call_quiz_${Date.now()}`,
          state: "output-available",
          input: {
            topic: "Japanese greetings",
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
                id: "q1-a",
                answer: "こんにちは (konnichiwa)",
                question:
                  "Which greeting is used when meeting someone at 2:00 PM?",
                correct: true,
              },
              {
                id: "q1-b",
                answer: "おはようございます (ohayou gozaimasu)",
                question:
                  "Which greeting is used when meeting someone at 2:00 PM?",
                correct: false,
              },
              {
                id: "q2-a",
                answer: "おはよう (ohayou)",
                question: 'Which is the casual form of "good morning"?',
                correct: true,
              },
              {
                id: "q2-b",
                answer: "さようなら (sayounara)",
                question: 'Which is the casual form of "good morning"?',
                correct: false,
              },
            ],
            preview: {
              title: "Japanese Greetings Quiz",
              questionCount: 2,
              totalPoints: 2,
              questions: [
                {
                  prompt:
                    "Which greeting is used when meeting someone at 2:00 PM?",
                  type: "multiple_choice",
                },
                {
                  prompt: 'Which is the casual form of "good morning"?',
                  type: "multiple_choice",
                },
              ],
            },
            message: "Quiz block ready to insert",
          },
        },
        {
          type: "text",
          text: 'I have generated a 2-question quiz. Click "Insert into Editor" to add it to your lesson!',
        },
      ],
    };
  }

  // 2. Meaning Association / Matching request
  if (
    content.includes("matching") ||
    content.includes("meaning association") ||
    content.includes("match")
  ) {
    return {
      id,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "I'll create a vocabulary matching exercise with 3 difficulty modes.",
        },
        {
          type: "step-start",
          toolCall: "insert_meaning_association",
          toolCallId: `call_meaning_${Date.now()}`,
        },
        {
          type: "tool-insert_meaning_association",
          toolCallId: `call_meaning_${Date.now()}`,
          state: "output-available",
          input: {
            wordIDs: ["word-aka", "word-ao", "word-midori", "word-kiiro"],
            enabledModes: ["learn", "easy", "hard"],
          },
          output: {
            success: true,
            action: "insert_editor_block",
            blockType: "meaning-association",
            blockData: ["word-aka", "word-ao", "word-midori", "word-kiiro"],
            preview: {
              wordCount: 4,
              instructions:
                "Match each Japanese color word with its English meaning",
              modes: ["learn", "easy", "hard"],
            },
            message: "Meaning association block ready to insert",
          },
        },
        {
          type: "text",
          text: "Done! Students can practice in Learn (flashcards), Easy (drag & drop), or Hard (timed) modes.",
        },
      ],
    };
  }

  // 3. Translation / Answer block request
  if (
    content.includes("answer block") ||
    content.includes("translation practice") ||
    content.includes("translate")
  ) {
    return {
      id,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "I'll create an answer block where students provide translations.",
        },
        {
          type: "step-start",
          toolCall: "insert_answer_block",
          toolCallId: `call_answer_${Date.now()}`,
        },
        {
          type: "tool-insert_answer_block",
          toolCallId: `call_answer_${Date.now()}`,
          state: "output-available",
          input: {
            wordIDs: ["word-ohayou", "word-konnichiwa", "word-sayounara"],
            mode: "translate",
          },
          output: {
            success: true,
            action: "insert_editor_block",
            blockType: "answer",
            blockData: ["word-ohayou", "word-konnichiwa", "word-sayounara"],
            preview: {
              wordCount: 3,
              mode: "translate",
              inputMethods: ["text", "audio", "writing"],
            },
            message: "Answer block ready to insert",
          },
        },
        {
          type: "text",
          text: "Created! Students can type, record audio, or draw their answers.",
        },
      ],
    };
  }

  // 4. Custom answer / Listening request
  if (
    content.includes("listening") ||
    content.includes("custom answer") ||
    content.includes("audio prompt")
  ) {
    return {
      id,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "I'll create a listening comprehension block with audio prompts.",
        },
        {
          type: "step-start",
          toolCall: "insert_custom_answer",
          toolCallId: `call_custom_${Date.now()}`,
        },
        {
          type: "tool-insert_custom_answer",
          toolCallId: `call_custom_${Date.now()}`,
          state: "output-available",
          input: {
            questionIDs: ["q-listen-1", "q-listen-2"],
            allowedInput: ["text"],
            promptMethod: ["audio"],
          },
          output: {
            success: true,
            action: "insert_editor_block",
            blockType: "custom-answer",
            blockData: ["q-listen-1", "q-listen-2"],
            preview: {
              questionCount: 2,
              prompt: "Listen to the audio and transcribe what you hear",
              inputMethods: ["text"],
              promptMethods: ["audio"],
            },
            message: "Custom answer block ready to insert",
          },
        },
        {
          type: "text",
          text: "Done! Students will listen to the audio clips and transcribe the phrases in hiragana.",
        },
      ],
    };
  }

  // 5. Search request
  if (
    content.includes("search") ||
    content.includes("find") ||
    content.includes("lookup")
  ) {
    return {
      id,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "I'll search your materials library.",
        },
        {
          type: "step-start",
          toolCall: "search_content",
          toolCallId: `call_search_${Date.now()}`,
        },
        {
          type: "tool-search_content",
          toolCallId: `call_search_${Date.now()}`,
          state: "output-available",
          input: { query: userText, type: "all", limit: 3 },
          output: {
            success: true,
            query: userText,
            results: [
              {
                type: "word",
                id: "word-1",
                similarity: 0.95,
                phrase: "こんにちは",
                phonetic: "konnichiwa",
                definition: "Hello / Good afternoon",
              },
              {
                type: "question",
                id: "q-1",
                similarity: 0.88,
                prompt: "What is hiragana used for?",
                answer: "Native Japanese words and particles.",
              },
            ],
          },
        },
        {
          type: "text",
          text: "Found 2 matching items in your library!",
        },
      ],
    };
  }

  // Default text response
  return {
    id,
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `I understand you're asking about: "${userText}"\n\nBased on your current context:\n- Unit: ${context?.unit?.name || "Selected Unit"}\n- Vocabulary: ${context?.dictionary?.length || 0} entries\n- Questions: ${context?.questionBank?.length || 0} items\n\nHow can I help you with your curriculum or exercises?`,
      },
    ],
  };
}

// Simulate streaming response
export const mockChatAPI = async (messages, context) => {
  console.log("[Mock Chat API] Received:", { messages, context });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  const lastMessage = messages[messages.length - 1];
  const text = getMessageText(lastMessage);
  const assistantMessage = generateMockAssistantMessage(text, context);

  return getMessageText(assistantMessage);
};

// Simulate streaming text response
export const streamMockResponse = async (text, onChunk) => {
  const words = text.split(" ");

  for (let i = 0; i < words.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    onChunk(words[i] + " ");
  }
};
