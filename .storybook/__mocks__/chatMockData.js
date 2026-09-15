/**
 * Mock Chat SSE (Server-Sent Events) Data for Storybook
 *
 * Follows Vercel AI SDK Stream Protocol
 * Reference: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 *
 * Provides realistic mock chat messages and streaming event inputs including:
 * - Multi-turn conversations with Socratic tutoring and assistant reasoning
 * - Full block generation responses (quiz, meaning-association, answer, custom-answer, content, recording-script)
 * - Various tool call streaming events (search_content, create_section, create_assignment, start_tour, start_practice_drill)
 * - Page-specific mock streaming inputs for Editor, Dashboard, Sections, Workbook, and Recording Studio
 */

import {
  allChatData,
  chatBot23,
  chatUnitEditor,
  chatDashboard,
  chatSections,
  chatWorkbook,
  chatRecordingStudio,
  chatDictionarySearch,
} from "./chatDataLoader";

/**
 * Helper to create SSE-formatted data line
 */
export function createSSEDataLine(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Helper to create complete SSE stream from events
 */
export function createSSEStream(events) {
  return events.map((event) => createSSEDataLine(event)).join("");
}

/**
 * Convert message parts to AI SDK stream events
 * Simulates how the AI SDK streams text chunks, tool calls, and tool outputs
 */
export function messageToStreamEvents(message) {
  const events = [];
  if (!message || !message.parts) return events;

  for (const part of message.parts) {
    if (part.type === "text") {
      const words = (part.text || "").split(" ");
      for (let i = 0; i < words.length; i++) {
        events.push({
          type: "text-delta",
          textDelta: i === 0 ? words[i] : " " + words[i],
        });
      }
    } else if (part.type === "step-start") {
      events.push({
        type: "step-start",
        ...(part.toolCall ? { toolCall: part.toolCall } : {}),
        ...(part.toolCallId ? { toolCallId: part.toolCallId } : {}),
      });
    } else if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      const toolName = part.type.replace(/^tool-/, "");
      const toolCallId = part.toolCallId || `call_${toolName}_${Date.now()}`;

      // 1. Tool Call Initiation
      events.push({
        type: "tool-call",
        toolCallId,
        toolName,
        args: part.input || {},
      });

      // 2. Tool Arguments Streaming
      events.push({
        type: "tool-args-delta",
        toolCallId,
        argsTextDelta: JSON.stringify(part.input || {}),
      });

      // 3. Tool Result Output (if completed)
      if (part.state === "output-available" || part.output) {
        events.push({
          type: "tool-result",
          toolCallId,
          toolName,
          args: part.input || {},
          result: part.output || {},
        });
      }
    }
  }

  // Finish event at end of turn
  events.push({ type: "finish", finishReason: "stop" });
  return events;
}

/**
 * Convert a full multi-turn conversation into an array of streaming event turns
 */
export function conversationToStreamEvents(messages) {
  if (!Array.isArray(messages)) return [];
  const conversationEvents = [];

  messages.forEach((msg, idx) => {
    const turnEvents = messageToStreamEvents(msg);
    conversationEvents.push({
      messageIndex: idx,
      role: msg.role,
      messageId: msg.id,
      events: turnEvents,
      rawMessage: msg,
    });
  });

  return conversationEvents;
}

// ==================== PAGE-SPECIFIC CONVERSATION STREAMS ====================

/**
 * 1. Unit Editor Page Stream:
 * Comprehensive curriculum building with 5 block types + semantic search
 */
export const MOCK_STREAM_UNIT_EDITOR =
  conversationToStreamEvents(chatUnitEditor);

/**
 * 2. Dashboard Page Stream:
 * Class performance overview, metric summaries, and guided tour launch tool
 */
export const MOCK_STREAM_DASHBOARD = conversationToStreamEvents(chatDashboard);

/**
 * 3. Sections & Management Page Stream:
 * Section creation with join codes, assignment scheduling, and roster verification
 */
export const MOCK_STREAM_SECTIONS = conversationToStreamEvents(chatSections);

/**
 * 4. Workbook / Student Learner Page Stream:
 * Socratic tutor Kai with progress lookups and practice drill launch
 */
export const MOCK_STREAM_WORKBOOK = conversationToStreamEvents(chatWorkbook);

/**
 * 5. Recording Studio Page Stream:
 * Multi-track dialogue audio script generator and vocabulary pronunciation presets
 */
export const MOCK_STREAM_RECORDING_STUDIO =
  conversationToStreamEvents(chatRecordingStudio);

/**
 * 6. Dictionary & Question Bank Page Stream:
 * Word creation, question bank addition, and semantic search
 */
export const MOCK_STREAM_DICTIONARY_SEARCH =
  conversationToStreamEvents(chatDictionarySearch);

// ==================== BLOCK-SPECIFIC STREAMING SAMPLES ====================

/**
 * Quiz block creation stream
 */
export const MOCK_STREAM_QUIZ_BLOCK = [
  {
    type: "step-start",
    toolCall: "insert_quiz",
    toolCallId: "call_quiz_mock_001",
  },
  {
    type: "text-delta",
    textDelta:
      "I'll create an interactive multiple-choice quiz testing Japanese greeting scenarios.",
  },
  {
    type: "tool-call",
    toolCallId: "call_quiz_mock_001",
    toolName: "insert_quiz",
    args: { topic: "greetings", count: 3, questionType: "multiple_choice" },
  },
  {
    type: "tool-result",
    toolCallId: "call_quiz_mock_001",
    toolName: "insert_quiz",
    args: { topic: "greetings", count: 3 },
    result: {
      success: true,
      action: "insert_editor_block",
      blockType: "quiz",
      blockData: [
        {
          id: "q1",
          question: "Which greeting is used at 2:00 PM?",
          answer: "こんにちは (konnichiwa)",
          correct: true,
        },
        {
          id: "q2",
          question: "Casual form of good morning?",
          answer: "おはよう (ohayou)",
          correct: true,
        },
      ],
      preview: { title: "Greetings Quiz", questionCount: 2, totalPoints: 2 },
      message: "Quiz block ready to insert",
    },
  },
  {
    type: "text-delta",
    textDelta:
      '\n\nQuiz generated! Click "Insert into Editor" to add it to your lesson.',
  },
  { type: "finish", finishReason: "stop" },
];

/**
 * Meaning association (matching) block creation stream
 */
export const MOCK_STREAM_MEANING_ASSOCIATION_BLOCK = [
  {
    type: "step-start",
    toolCall: "insert_meaning_association",
    toolCallId: "call_meaning_mock_001",
  },
  {
    type: "text-delta",
    textDelta: "I'll build a drag-and-drop vocabulary matching exercise.",
  },
  {
    type: "tool-call",
    toolCallId: "call_meaning_mock_001",
    toolName: "insert_meaning_association",
    args: {
      wordIDs: ["word-aka", "word-ao", "word-midori", "word-kiiro"],
      enabledModes: ["learn", "easy", "hard"],
    },
  },
  {
    type: "tool-result",
    toolCallId: "call_meaning_mock_001",
    toolName: "insert_meaning_association",
    args: { wordIDs: ["word-aka", "word-ao", "word-midori", "word-kiiro"] },
    result: {
      success: true,
      action: "insert_editor_block",
      blockType: "meaning-association",
      blockData: ["word-aka", "word-ao", "word-midori", "word-kiiro"],
      preview: {
        wordCount: 4,
        instructions: "Match Japanese color terms with English definitions",
        modes: ["learn", "easy", "hard"],
      },
      message: "Meaning association block ready to insert",
    },
  },
  {
    type: "text-delta",
    textDelta:
      "\n\nMatching exercise ready with Learn, Easy, and Hard difficulty modes!",
  },
  { type: "finish", finishReason: "stop" },
];

/**
 * Answer block creation stream
 */
export const MOCK_STREAM_ANSWER_BLOCK = [
  {
    type: "step-start",
    toolCall: "insert_answer_block",
    toolCallId: "call_answer_mock_001",
  },
  {
    type: "text-delta",
    textDelta:
      "I'll create an answer block where students provide written or spoken translations.",
  },
  {
    type: "tool-call",
    toolCallId: "call_answer_mock_001",
    toolName: "insert_answer_block",
    args: {
      wordIDs: ["word-ohayou", "word-konnichiwa"],
      mode: "translate",
      allowedInput: ["text", "audio"],
    },
  },
  {
    type: "tool-result",
    toolCallId: "call_answer_mock_001",
    toolName: "insert_answer_block",
    args: { wordIDs: ["word-ohayou", "word-konnichiwa"] },
    result: {
      success: true,
      action: "insert_editor_block",
      blockType: "answer",
      blockData: ["word-ohayou", "word-konnichiwa"],
      preview: {
        wordCount: 2,
        mode: "translate",
        inputMethods: ["text", "audio"],
      },
      message: "Answer block ready to insert",
    },
  },
  {
    type: "text-delta",
    textDelta:
      "\n\nAnswer block created! Students can respond via keyboard or microphone.",
  },
  { type: "finish", finishReason: "stop" },
];

/**
 * Custom answer block creation stream
 */
export const MOCK_STREAM_CUSTOM_ANSWER_BLOCK = [
  {
    type: "step-start",
    toolCall: "insert_custom_answer",
    toolCallId: "call_custom_mock_001",
  },
  {
    type: "text-delta",
    textDelta: "I'll create an audio listening comprehension block.",
  },
  {
    type: "tool-call",
    toolCallId: "call_custom_mock_001",
    toolName: "insert_custom_answer",
    args: {
      questionIDs: ["q-listen-1", "q-listen-2"],
      allowedInput: ["text"],
      promptMethod: ["audio"],
    },
  },
  {
    type: "tool-result",
    toolCallId: "call_custom_mock_001",
    toolName: "insert_custom_answer",
    args: { questionIDs: ["q-listen-1", "q-listen-2"] },
    result: {
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
    type: "text-delta",
    textDelta: "\n\nListening exercise created with audio prompts!",
  },
  { type: "finish", finishReason: "stop" },
];

/**
 * Rich Lexical content block creation stream
 */
export const MOCK_STREAM_CONTENT_BLOCK = [
  {
    type: "step-start",
    toolCall: "insert_content_block",
    toolCallId: "call_content_mock_001",
  },
  {
    type: "text-delta",
    textDelta: "Generating formatted introductory lesson content...",
  },
  {
    type: "tool-call",
    toolCallId: "call_content_mock_001",
    toolName: "insert_content_block",
    args: { contentType: "lesson", topic: "Japanese Etiquette" },
  },
  {
    type: "tool-result",
    toolCallId: "call_content_mock_001",
    toolName: "insert_content_block",
    args: { contentType: "lesson", topic: "Japanese Etiquette" },
    result: {
      success: true,
      action: "insert_editor_block",
      blockType: "content",
      blockData: {
        root: {
          children: [
            {
              type: "heading",
              tag: "h2",
              direction: "ltr",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "text",
                  text: "Japanese Greetings & Etiquette",
                  version: 1,
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                },
              ],
            },
            {
              type: "paragraph",
              direction: "ltr",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "text",
                  text: "Aisatsu (挨拶) is essential for expressing gratitude and respect.",
                  version: 1,
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                },
              ],
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
        title: "Japanese Greetings & Etiquette",
        contentType: "lesson",
        nodeCount: 2,
        excerpt: "Aisatsu is essential for expressing gratitude...",
      },
      message: "Content block ready to insert",
    },
  },
  {
    type: "text-delta",
    textDelta: "\n\nLesson content formatted and ready for the editor!",
  },
  { type: "finish", finishReason: "stop" },
];

/**
 * Recording Studio script generation stream
 */
export const MOCK_STREAM_RECORDING_SCRIPT_BLOCK = [
  {
    type: "step-start",
    toolCall: "generate_recording_script",
    toolCallId: "call_rs_mock_001",
  },
  {
    type: "text-delta",
    textDelta: "Creating dialogue recording tracks for Recording Studio 3...",
  },
  {
    type: "tool-call",
    toolCallId: "call_rs_mock_001",
    toolName: "generate_recording_script",
    args: { preset: "conversation", scenario: "Ordering ramen" },
  },
  {
    type: "tool-result",
    toolCallId: "call_rs_mock_001",
    toolName: "generate_recording_script",
    args: { preset: "conversation" },
    result: {
      success: true,
      preset: "conversation",
      scriptData: {
        metadata: { title: "Ramen Shop Dialogue", preset: "conversation" },
        tracks: [
          {
            label: "Server",
            text: "いらっしゃいませ！何名様ですか？",
            phonetic: "Irasshaimase! Nan-mei sama desu ka?",
            voice: "native-female",
          },
          {
            label: "Customer",
            text: "一人です。ラーメンをお願いします。",
            phonetic: "Hitori desu. Raamen o onegaishimasu.",
            voice: "learner-male",
          },
        ],
      },
      lockedTracks: [0],
      preview: {
        trackCount: 2,
        preset: "conversation",
        estimatedDuration: "15s",
      },
      warnings: [],
    },
  },
  {
    type: "text-delta",
    textDelta:
      "\n\nRecording script generated! Open Recording Studio 3 to start tracking.",
  },
  { type: "finish", finishReason: "stop" },
];

// ==================== LEGACY EXPORTS FOR COMPATIBILITY ====================

const lastMessage = chatBot23?.[chatBot23.length - 1];
export const MOCK_CHAT_HIRAGANA_SEARCH = lastMessage
  ? messageToStreamEvents(lastMessage)
  : [];

const firstMessage = chatBot23?.[0];
export const MOCK_CHAT_USER_QUERY = firstMessage
  ? messageToStreamEvents(firstMessage)
  : [];

export const MOCK_CHAT_JAPANESE_RESPONSE = [
  { type: "text-delta", textDelta: "こんにちは" },
  { type: "text-delta", textDelta: "！\n\n" },
  {
    type: "text-delta",
    textDelta:
      '"こんにちは" (konnichiwa) means "Hello" or "Good afternoon" in Japanese.',
  },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_DICTIONARY_LOOKUP = [
  { type: "text-delta", textDelta: "Let me look that up..." },
  {
    type: "tool-call",
    toolCallId: "call_dict_001",
    toolName: "search_dictionary",
    args: { query: "水" },
  },
  {
    type: "tool-result",
    toolCallId: "call_dict_001",
    toolName: "search_dictionary",
    args: { query: "水" },
    result: {
      word: "水",
      phonetic: "mizu",
      definition: "Water; cold water; fluid",
    },
  },
  { type: "text-delta", textDelta: '\n\nFound it! 水 (mizu) means "water".' },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_QUESTION_SEARCH = [
  { type: "text-delta", textDelta: "I'll search for biology questions..." },
  {
    type: "tool-call",
    toolCallId: "call_q_001",
    toolName: "search_questions",
    args: { query: "photosynthesis", limit: 2 },
  },
  {
    type: "tool-result",
    toolCallId: "call_q_001",
    toolName: "search_questions",
    args: { query: "photosynthesis", limit: 2 },
    result: {
      questions: [
        {
          id: "q-bio-1",
          prompt: "What is photosynthesis?",
          answer: "Energy conversion process",
        },
      ],
      count: 1,
    },
  },
  { type: "text-delta", textDelta: "\n\nFound 1 biology question." },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_MULTIPLE_TOOLS = [
  { type: "text-delta", textDelta: "Checking dictionary and questions..." },
  {
    type: "tool-call",
    toolCallId: "call_multi_001",
    toolName: "search_dictionary",
    args: { query: "光合成" },
  },
  {
    type: "tool-result",
    toolCallId: "call_multi_001",
    toolName: "search_dictionary",
    args: { query: "光合成" },
    result: {
      word: "光合成",
      phonetic: "kōgōsei",
      definition: "Photosynthesis",
    },
  },
  {
    type: "tool-call",
    toolCallId: "call_multi_002",
    toolName: "search_questions",
    args: { query: "photosynthesis" },
  },
  {
    type: "tool-result",
    toolCallId: "call_multi_002",
    toolName: "search_questions",
    args: { query: "photosynthesis" },
    result: { questions: [{ id: "q1", prompt: "What is photosynthesis?" }] },
  },
  {
    type: "text-delta",
    textDelta: "\n\nFound vocabulary and question results.",
  },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_FILE_ANALYSIS = [
  { type: "text-delta", textDelta: "Analyzing the uploaded image..." },
  {
    type: "tool-call",
    toolCallId: "call_file_001",
    toolName: "analyze_image",
    args: { fileId: "diagram-1" },
  },
  {
    type: "tool-result",
    toolCallId: "call_file_001",
    toolName: "analyze_image",
    args: { fileId: "diagram-1" },
    result: {
      description: "Water cycle diagram with evaporation and precipitation.",
    },
  },
  {
    type: "text-delta",
    textDelta: "\n\nThis image illustrates the water cycle.",
  },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_AUDIO_TRANSCRIPTION = [
  { type: "text-delta", textDelta: "Transcribing audio clip..." },
  {
    type: "tool-call",
    toolCallId: "call_audio_001",
    toolName: "transcribe_audio",
    args: { fileId: "audio-1" },
  },
  {
    type: "tool-result",
    toolCallId: "call_audio_001",
    toolName: "transcribe_audio",
    args: { fileId: "audio-1" },
    result: { text: "こんにちは", language: "ja", confidence: 0.98 },
  },
  {
    type: "text-delta",
    textDelta: '\n\nThe audio transcribed: "こんにちは" (Hello).',
  },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_TOOL_ERROR = [
  { type: "text-delta", textDelta: "Searching..." },
  {
    type: "tool-call",
    toolCallId: "call_err_001",
    toolName: "search_dictionary",
    args: { query: "xyz123" },
  },
  {
    type: "tool-result",
    toolCallId: "call_err_001",
    toolName: "search_dictionary",
    args: { query: "xyz123" },
    result: { error: "No matching records found" },
  },
  {
    type: "text-delta",
    textDelta: "\n\nI couldn't find that item in the dictionary.",
  },
  { type: "finish", finishReason: "stop" },
];

export const MOCK_CHAT_CANCELED = [
  { type: "text-delta", textDelta: "Starting response..." },
  { type: "finish", finishReason: "cancel" },
];

// ==================== STREAM REGISTRY ====================

export const PAGE_CHAT_STREAMS = {
  UNIT_EDITOR: MOCK_STREAM_UNIT_EDITOR,
  DASHBOARD: MOCK_STREAM_DASHBOARD,
  SECTIONS: MOCK_STREAM_SECTIONS,
  WORKBOOK: MOCK_STREAM_WORKBOOK,
  RECORDING_STUDIO: MOCK_STREAM_RECORDING_STUDIO,
  DICTIONARY_SEARCH: MOCK_STREAM_DICTIONARY_SEARCH,
};

export const BLOCK_TOOL_STREAMS = {
  QUIZ: MOCK_STREAM_QUIZ_BLOCK,
  MEANING_ASSOCIATION: MOCK_STREAM_MEANING_ASSOCIATION_BLOCK,
  ANSWER: MOCK_STREAM_ANSWER_BLOCK,
  CUSTOM_ANSWER: MOCK_STREAM_CUSTOM_ANSWER_BLOCK,
  CONTENT: MOCK_STREAM_CONTENT_BLOCK,
  RECORDING_SCRIPT: MOCK_STREAM_RECORDING_SCRIPT_BLOCK,
};

export const MOCK_CHAT_STREAMS = {
  PAGES: PAGE_CHAT_STREAMS,
  BLOCKS: BLOCK_TOOL_STREAMS,
  FROM_CHAT_DATA: {
    HIRAGANA_SEARCH: MOCK_CHAT_HIRAGANA_SEARCH,
    USER_QUERY: MOCK_CHAT_USER_QUERY,
  },
  SIMPLE: {
    JAPANESE: MOCK_CHAT_JAPANESE_RESPONSE,
  },
  TOOLS: {
    DICTIONARY: MOCK_CHAT_DICTIONARY_LOOKUP,
    QUESTIONS: MOCK_CHAT_QUESTION_SEARCH,
    MULTIPLE: MOCK_CHAT_MULTIPLE_TOOLS,
    FILE_ANALYSIS: MOCK_CHAT_FILE_ANALYSIS,
    AUDIO: MOCK_CHAT_AUDIO_TRANSCRIPTION,
  },
  ERRORS: {
    TOOL_ERROR: MOCK_CHAT_TOOL_ERROR,
    CANCELED: MOCK_CHAT_CANCELED,
  },
  ALL: [
    ...MOCK_CHAT_HIRAGANA_SEARCH,
    ...MOCK_CHAT_JAPANESE_RESPONSE,
    ...MOCK_CHAT_DICTIONARY_LOOKUP,
    ...MOCK_CHAT_QUESTION_SEARCH,
    ...MOCK_CHAT_MULTIPLE_TOOLS,
    ...MOCK_CHAT_FILE_ANALYSIS,
    ...MOCK_CHAT_AUDIO_TRANSCRIPTION,
    ...MOCK_CHAT_TOOL_ERROR,
    ...MOCK_CHAT_CANCELED,
  ],
};

export default MOCK_CHAT_STREAMS;
