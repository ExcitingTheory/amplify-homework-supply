/**
 * @fileoverview Utility to load and transform chat data from JSON files
 * Converts the JSON chat message data into the format expected by AssistantChat model
 */

import chatBot20 from "./ui-data/chat-bot-2.0.json";
import chatBot21 from "./ui-data/chat-bot-2.1.json";
import chatBot23 from "./ui-data/chat-bot-2.3.json";
import chatUnitEditor from "./ui-data/chat-unit-editor.json";
import chatDashboard from "./ui-data/chat-dashboard.json";
import chatSections from "./ui-data/chat-sections.json";
import chatWorkbook from "./ui-data/chat-workbook.json";
import chatRecordingStudio from "./ui-data/chat-recording-studio.json";
import chatDictionarySearch from "./ui-data/chat-dictionary-search.json";

/**
 * Helper to build an AssistantChat model object
 */
function createAssistantChat({
  id,
  messages,
  threadInstructions = "You are a helpful Japanese language learning assistant.",
  model = "gpt-4o",
  owner = "mock-user-sub",
}) {
  return {
    id,
    owner,
    model,
    threadId: `thread-${id}`,
    threadInstructions,
    additionalInstructions: null,
    moderationFlag: false,
    messages,
    draft: "",
    archived: false,
    inputTokens: "150",
    outputTokens: "350",
    createdAt: new Date("2024-01-26T10:00:00Z").toISOString(),
    updatedAt: new Date("2024-01-26T10:15:00Z").toISOString(),
    _version: 1,
    _deleted: null,
    _lastChangedAt: Date.now(),
  };
}

/**
 * Default AssistantChat with full 5-block conversation
 */
const allChatData = createAssistantChat({
  id: "mock-assistant-chat-1",
  messages: chatBot23,
});

/**
 * Page-specific AssistantChat mock instances
 */
const unitEditorChatData = createAssistantChat({
  id: "mock-chat-unit-editor",
  messages: chatUnitEditor,
  threadInstructions:
    "You are Sage, a curriculum design assistant helping instructors create interactive lessons with quiz, matching, translation, listening, and rich text blocks.",
});

const dashboardChatData = createAssistantChat({
  id: "mock-chat-dashboard",
  messages: chatDashboard,
  threadInstructions:
    "You are Sage, an executive teaching assistant providing class overviews, guided tour triggers, and actionable instructor recommendations.",
});

const sectionsChatData = createAssistantChat({
  id: "mock-chat-sections",
  messages: chatSections,
  threadInstructions:
    "You are an administrative course assistant helping manage class sections, enrollments, join codes, and assignment scheduling.",
});

const workbookChatData = createAssistantChat({
  id: "mock-chat-workbook",
  messages: chatWorkbook,
  threadInstructions:
    "You are Kai, a patient student tutor who uses Socratic hints without giving answers away and launches adaptive practice drills.",
});

const recordingStudioChatData = createAssistantChat({
  id: "mock-chat-recording-studio",
  messages: chatRecordingStudio,
  threadInstructions:
    "You are an audio production assistant helping generate dialogue scripts and vocabulary pronunciation guides for Recording Studio 3.",
});

const dictionarySearchChatData = createAssistantChat({
  id: "mock-chat-dictionary-search",
  messages: chatDictionarySearch,
  threadInstructions:
    "You are a vocabulary and assessment assistant helping curate dictionary words, question bank items, and semantic searches.",
});

export {
  allChatData,
  unitEditorChatData,
  dashboardChatData,
  sectionsChatData,
  workbookChatData,
  recordingStudioChatData,
  dictionarySearchChatData,
  chatBot20,
  chatBot21,
  chatBot23,
  chatUnitEditor,
  chatDashboard,
  chatSections,
  chatWorkbook,
  chatRecordingStudio,
  chatDictionarySearch,
};
