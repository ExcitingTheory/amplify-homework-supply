/**
 * Mock responses for chat REST API endpoint
 * Used in Storybook to simulate AI chat conversations
 * 
 * Format: Plain text strings or objects matching the Lambda response structure
 */

// Standard chat responses (plain text for streaming)
export const standardResponse = "Hi! I'm Kai, your teaching assistant. I'm here to help you with curriculum development and educational content creation. I can assist with creating content, searching through your files and vocabulary, managing class sections, and more. What would you like to work on today?";

export const helpWithUnit = "I'd be happy to help with your unit! Based on the current context, I can see you're working on a Japanese language unit. Here are some things I can do:\n\n1. Generate new content sections\n2. Create practice questions\n3. Add vocabulary words\n4. Organize your files\n\nWhat specific aspect would you like to focus on?";

export const vocabularyAssistance = "I can help you with vocabulary! Currently, your dictionary has several Japanese words. Would you like me to:\n\n- Add new vocabulary words\n- Create practice questions from existing vocabulary\n- Organize words by theme or difficulty\n- Generate example sentences\n\nWhat would be most helpful?";

export const questionGeneration = "I'll create some practice questions for you based on your current vocabulary:\n\n1. **Multiple Choice**: What does '食べる' (taberu) mean?\n   - A) To drink\n   - B) To eat ✓\n   - C) To sleep\n   - D) To walk\n\n2. **Fill in the blank**: The particle used to mark the direct object is ___.\n   (Answer: を - wo)\n\n3. **Translation**: How do you say 'I go to school' in Japanese?\n   (Answer: 学校に行きます - gakkou ni ikimasu)\n\nWould you like me to generate more questions or modify these?";

export const contentSuggestion = "Based on your current unit about Japanese verbs, I suggest adding these sections:\n\n1. **Introduction to Verb Groups**\n   - Explain the three verb groups (godan, ichidan, irregular)\n   - Provide examples of each type\n\n2. **Present Tense Conjugation**\n   - Show conjugation patterns\n   - Include practice exercises\n\n3. **Common Verbs Practice**\n   - List 20 most common verbs\n   - Create flashcard-style review\n\nWould you like me to generate content for any of these sections?";

// Tool calling responses (these include special markers for tool calls)
export const searchToolCall = "Let me search through your content for that.\n__TOOL_CALLS__:" + JSON.stringify({
  type: 'tool_calls',
  tool_calls: [{
    id: 'call_1',
    type: 'function',
    function: {
      name: 'search_content',
      arguments: JSON.stringify({
        query: 'particle usage',
        contentType: 'all',
      }),
    },
  }],
});

export const createSectionToolCall = "I'll create that section for you.\n__TOOL_CALLS__:" + JSON.stringify({
  type: 'tool_calls',
  tool_calls: [{
    id: 'call_2',
    type: 'function',
    function: {
      name: 'create_section',
      arguments: JSON.stringify({
        name: 'Japanese 101 - Spring 2026',
        description: 'Introductory Japanese language course',
      }),
    },
  }],
});

export const generateContentToolCall = "I'll generate that unit content for you.\n__TOOL_CALLS__:" + JSON.stringify({
  type: 'tool_calls',
  tool_calls: [{
    id: 'call_3',
    type: 'function',
    function: {
      name: 'generate_unit_content',
      arguments: JSON.stringify({
        topic: 'Japanese verb conjugation',
        level: 'intermediate',
      }),
    },
  }],
});

export const multipleToolCalls = "I'll search for existing content and then create a new section.\n__TOOL_CALLS__:" + JSON.stringify({
  type: 'tool_calls',
  tool_calls: [
    {
      id: 'call_4a',
      type: 'function',
      function: {
        name: 'search_content',
        arguments: JSON.stringify({
          query: 'verb conjugation',
          contentType: 'all',
        }),
      },
    },
    {
      id: 'call_4b',
      type: 'function',
      function: {
        name: 'create_section',
        arguments: JSON.stringify({
          name: 'Advanced Japanese',
          description: 'Advanced language topics',
        }),
      },
    },
  ],
});

// Long response
export const longResponse = "Let me provide a comprehensive overview of Japanese language learning:\n\n**Writing Systems**\nJapanese uses three writing systems: Hiragana (ひらがな), Katakana (カタカナ), and Kanji (漢字). Hiragana is used for native Japanese words and grammatical elements, Katakana for foreign words and emphasis, and Kanji for content words.\n\n**Grammar Structure**\nJapanese grammar follows a Subject-Object-Verb (SOV) order, unlike English's SVO. For example:\n- English: I eat sushi\n- Japanese: 私は寿司を食べます (watashi wa sushi wo tabemasu)\n  - Subject: 私は (watashi wa - I)\n  - Object: 寿司を (sushi wo - sushi)\n  - Verb: 食べます (tabemasu - eat)\n\n**Particles**\nParticles are essential grammatical markers:\n- は (wa): Topic marker\n- が (ga): Subject marker\n- を (wo): Object marker\n- に (ni): Direction/time\n- で (de): Location of action/means\n- と (to): With/and\n\n**Verb Conjugation**\nVerbs conjugate based on:\n1. Tense (present/past)\n2. Politeness (casual/polite)\n3. Affirmative/negative\n\nWould you like me to elaborate on any of these topics?";

// Error cases (return error strings for mock error handling)
export const errorResponse = "Error: Failed to generate chat response";
export const networkTimeout = "Error: Network request timeout";
export const invalidContext = "Error: Invalid context provided";

// Empty/minimal responses
export const emptyResponse = "";
export const shortResponse = "Sure, I can help with that!";

// Special characters and formatting
export const withKanjiAndFormatting = "Here's a breakdown of the word 食べる (taberu):\n\n**Kanji**: 食\n**Reading**: た-べる (ta-be-ru)\n**Meaning**: to eat\n**Type**: Ichidan verb (る-verb)\n\n**Conjugations**:\n- Present/Future: 食べます (tabemasu) - polite\n- Past: 食べました (tabemashita) - polite\n- Negative: 食べません (tabemasen) - polite\n- Te-form: 食べて (tabete)\n\n**Example Sentences**:\n1. 私は朝ご飯を食べます。\n   (Watashi wa asagohan wo tabemasu.)\n   I eat breakfast.\n\n2. 昨日何を食べましたか？\n   (Kinou nani wo tabemashita ka?)\n   What did you eat yesterday?";

// Export all mocks
export default {
  standardResponse,
  helpWithUnit,
  vocabularyAssistance,
  questionGeneration,
  contentSuggestion,
  searchToolCall,
  createSectionToolCall,
  generateContentToolCall,
  multipleToolCalls,
  longResponse,
  errorResponse,
  networkTimeout,
  invalidContext,
  emptyResponse,
  shortResponse,
  withKanjiAndFormatting,
};
