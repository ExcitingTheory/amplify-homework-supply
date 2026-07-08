/**
 * OfflineTools — Simulated tool implementations for offline AI chat.
 *
 * These run locally against IndexedDB-cached data, giving the offline model
 * the same information that online tools (semantic_search, recall_memory, etc.)
 * would provide — without needing the model to call them via function calling.
 *
 * Two usage modes:
 * 1. **Pre-fetch augmentation**: Before prompting, analyze the user message and
 *    inject relevant search results into the context (no model cooperation needed).
 * 2. **ReAct loop**: Parse `<tool_call>` blocks from model output, execute locally,
 *    and re-prompt with results (requires model to follow ReAct format).
 */

import {
  getCachedUnit,
  getCachedWordsForUnit,
  getCachedQuestionsForUnit,
  getCachedFilesForUnit,
  getRecordsByIndex,
  getAllRecords,
  type CachedUnit,
  type CachedWord,
  type CachedQuestion,
  type CachedGrade,
} from "./OfflineDataStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolResult {
  tool: string;
  query?: string;
  results: string;
}

export interface AugmentedContext {
  /** Relevant vocabulary matched from the user's message */
  relevantVocabulary: CachedWord[];
  /** Relevant questions matched from the user's message */
  relevantQuestions: CachedQuestion[];
  /** Grade progress information */
  gradeInfo?: string;
  /** Raw text to inject as "search results" into the prompt */
  searchResults: string;
}

// ── Pre-fetch Augmentation ────────────────────────────────────────────────────

/**
 * Analyze the user's message and pre-fetch relevant data from IndexedDB.
 * This runs BEFORE the model sees the message, injecting relevant context
 * so the model doesn't need tool-calling capabilities.
 */
export async function augmentContextFromMessage(
  userMessage: string,
  unitId: string,
): Promise<AugmentedContext> {
  const lowerMsg = userMessage.toLowerCase();
  const words = lowerMsg.split(/\s+/).filter((w) => w.length > 2);

  // Fetch all cached data for this unit
  const [allWords, allQuestions] = await Promise.all([
    getCachedWordsForUnit(unitId),
    getCachedQuestionsForUnit(unitId),
  ]);

  // Score vocabulary by relevance to the user's message
  const scoredWords = allWords
    .map((w) => {
      let score = 0;
      const phraseLower = w.phrase.toLowerCase();
      const defLower = w.definition.toLowerCase();

      // Exact phrase match in message
      if (lowerMsg.includes(phraseLower)) score += 10;
      // Word overlap with phrase
      words.forEach((word) => {
        if (phraseLower.includes(word)) score += 3;
        if (defLower.includes(word)) score += 1;
      });
      return { word: w, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Score questions by relevance
  const scoredQuestions = allQuestions
    .map((q) => {
      let score = 0;
      const promptLower = q.prompt.toLowerCase();
      const answerLower = q.answer.toLowerCase();

      if (lowerMsg.includes(promptLower.slice(0, 30))) score += 10;
      words.forEach((word) => {
        if (promptLower.includes(word)) score += 2;
        if (answerLower.includes(word)) score += 1;
      });
      return { question: q, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Build search results text
  let searchResults = "";

  if (scoredWords.length > 0) {
    searchResults += "## Relevant Vocabulary\n";
    for (const { word } of scoredWords) {
      searchResults += `- **${word.phrase}**: ${word.definition}\n`;
    }
  }

  if (scoredQuestions.length > 0) {
    searchResults += "\n## Related Practice Questions\n";
    for (const { question } of scoredQuestions) {
      searchResults += `- Q: ${question.prompt}\n  A: ${question.answer}\n`;
    }
  }

  // Fetch grade info
  let gradeInfo: string | undefined;
  try {
    const grades = await getRecordsByIndex<CachedGrade>(
      "grades",
      "unitId",
      unitId,
    );
    const latest = grades.sort((a, b) => b.savedAt - a.savedAt)[0];
    if (latest) {
      gradeInfo = `Current grade: ${latest.accuracy != null ? `${Math.round(latest.accuracy)}% accuracy` : "in progress"}, ${latest.complete ? "completed" : `${latest.percentComplete ?? 0}% complete`}`;
    }
  } catch {
    // Grades store may not exist
  }

  return {
    relevantVocabulary: scoredWords.map((s) => s.word),
    relevantQuestions: scoredQuestions.map((s) => s.question),
    gradeInfo,
    searchResults,
  };
}

// ── ReAct Loop Tool Execution ─────────────────────────────────────────────────

/**
 * Tool definitions available in the ReAct loop.
 * The model is prompted to emit these in <tool_call> blocks.
 */
export const TOOL_DEFINITIONS = `
Available tools (use ONLY when you need to look up specific information):

<tool name="search_vocabulary" description="Search unit vocabulary for a word or concept">
  <param name="query">The word or concept to search for</param>
</tool>

<tool name="search_questions" description="Find practice questions related to a topic">
  <param name="query">The topic to find questions about</param>
</tool>

<tool name="get_progress" description="Get the student's current grade progress">
</tool>

<tool name="get_unit_content" description="Get a section of the unit content">
  <param name="query">What content to look for</param>
</tool>

To use a tool, output EXACTLY this format on its own line:
<tool_call name="tool_name"><param name="param_name">value</param></tool_call>

After receiving tool results, continue your response to the student.
Do NOT use tools unless you need specific information not already in context.
`;

/**
 * Parse tool calls from model output.
 * Returns the text before the tool call and the parsed call.
 */
export function parseToolCall(
  output: string,
): {
  textBefore: string;
  toolName: string;
  params: Record<string, string>;
} | null {
  const toolCallRegex = /<tool_call\s+name="([^"]+)">([\s\S]*?)<\/tool_call>/;
  const match = output.match(toolCallRegex);

  if (!match) return null;

  const textBefore = output.slice(0, match.index).trim();
  const toolName = match[1];
  const paramsStr = match[2];

  // Parse params
  const params: Record<string, string> = {};
  const paramRegex = /<param\s+name="([^"]+)">([^<]*)<\/param>/g;
  let paramMatch;
  while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
    params[paramMatch[1]] = paramMatch[2].trim();
  }

  return { textBefore, toolName, params };
}

/**
 * Execute a tool call locally against IndexedDB.
 */
export async function executeToolCall(
  toolName: string,
  params: Record<string, string>,
  unitId: string,
): Promise<string> {
  switch (toolName) {
    case "search_vocabulary": {
      const query = (params.query || "").toLowerCase();
      const allWords = await getCachedWordsForUnit(unitId);
      const matches = allWords
        .filter(
          (w) =>
            w.phrase.toLowerCase().includes(query) ||
            w.definition.toLowerCase().includes(query),
        )
        .slice(0, 8);

      if (matches.length === 0) {
        return `No vocabulary found matching "${params.query}".`;
      }
      return matches.map((w) => `• ${w.phrase}: ${w.definition}`).join("\n");
    }

    case "search_questions": {
      const query = (params.query || "").toLowerCase();
      const allQuestions = await getCachedQuestionsForUnit(unitId);
      const matches = allQuestions
        .filter(
          (q) =>
            q.prompt.toLowerCase().includes(query) ||
            q.answer.toLowerCase().includes(query),
        )
        .slice(0, 5);

      if (matches.length === 0) {
        return `No questions found matching "${params.query}".`;
      }
      return matches
        .map((q) => `Q: ${q.prompt}\nA: ${q.answer}`)
        .join("\n---\n");
    }

    case "get_progress": {
      try {
        const grades = await getRecordsByIndex<CachedGrade>(
          "grades",
          "unitId",
          unitId,
        );
        const latest = grades.sort((a, b) => b.savedAt - a.savedAt)[0];
        if (!latest) return "No grade data available for this unit.";
        return [
          `Status: ${latest.complete ? "Completed" : "In Progress"}`,
          latest.accuracy != null
            ? `Accuracy: ${Math.round(latest.accuracy)}%`
            : null,
          latest.percentComplete != null
            ? `Progress: ${Math.round(latest.percentComplete)}%`
            : null,
        ]
          .filter(Boolean)
          .join("\n");
      } catch {
        return "Grade data unavailable offline.";
      }
    }

    case "get_unit_content": {
      const unit = await getCachedUnit(unitId);
      if (!unit?.data) return "Unit content not available offline.";
      const query = (params.query || "").toLowerCase();
      // Return a relevant section of the unit content
      const lines = unit.data.split("\n");
      const relevant = lines.filter((line) =>
        line.toLowerCase().includes(query),
      );
      if (relevant.length > 0) {
        return relevant.slice(0, 10).join("\n");
      }
      // If no match, return first 500 chars
      return unit.data.slice(0, 500) + (unit.data.length > 500 ? "..." : "");
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

/**
 * Build the ReAct-aware system prompt addition.
 * Only added when using WebLLM/Chrome AI (not heuristic).
 */
export function getReActPromptSection(): string {
  return `\n\n## Tool Usage (ReAct)
You can look up information using tools. ${TOOL_DEFINITIONS}
IMPORTANT: Only use tools when you genuinely need to look up information not already provided in context. Most questions can be answered directly from the vocabulary and content above.
If you use a tool, STOP your response immediately after the <tool_call> tag. You will receive the results and can then continue.`;
}
