/**
 * Mock responses for contentCompletion REST API
 * 
 * These mocks simulate AI-powered text completions for the Editor3
 * AIContentCompletionPlugin. Each mock represents a different scenario
 * to test UI behavior, timing, and edge cases.
 */

/**
 * Standard Japanese language lesson completion
 * Use case: Default happy path, typical educational content
 */
export const standardJapanese = ' It consists of 46 basic characters used for native Japanese words and grammatical elements.';

/**
 * Long completion with multiple sentences
 * Use case: Test UI with longer content, ensure wrapping works
 */
export const longCompletion = ' Each character represents a syllable sound, making it a phonetic writing system. Unlike kanji, hiragana characters do not carry meaning on their own but are combined to form words. Students typically learn hiragana first because it provides the foundation for reading and writing Japanese.';

/**
 * Short, concise completion
 * Use case: Test minimal content display
 */
export const shortCompletion = ' Let\'s practice!';

/**
 * Technical linguistic content with Japanese terms
 * Use case: Test rendering of mixed Latin/Japanese text
 */
export const technicalContent = ' These are called 五段動詞 (godan doushi) and follow a predictable u-vowel conjugation pattern. When conjugating to negative form, the final u-sound changes to an a-sound and ない is added.';

/**
 * Conversational, friendly tone
 * Use case: Test different writing styles
 */
export const conversational = ' Pretty cool, right? This makes it easier for beginners because you can read anything once you know the basic characters. Try practicing the first row: あいうえお.';

/**
 * Completion with kanji and explanations
 * Use case: Test complex character rendering
 */
export const withKanji = ' The characters are: あ (a), い (i), う (u), え (e), お (o). These five characters form the foundation of the Japanese syllabary and are the first ones students traditionally learn.';

/**
 * Empty completion (edge case)
 * Use case: Test handling of no suggestion
 */
export const empty = '';

/**
 * Very long completion to test scrolling/wrapping
 * Use case: Stress test UI with extensive content
 */
export const veryLong = ' Hiragana characters evolved from Chinese cursive script and were initially called "onnade" or "women\'s hand" because they were primarily used by women in classical Japanese literature. Each of the 46 basic hiragana characters represents a mora (a unit of sound) in the Japanese language. The characters can be modified with diacritical marks called dakuten (゛) and handakuten (゜) to create additional sounds. For example, は (ha) becomes ば (ba) with dakuten and ぱ (pa) with handakuten. Learning hiragana is typically the first step for Japanese language students because it allows them to write any Japanese word phonetically, even if they don\'t know the kanji.';

/**
 * Completion with special characters and formatting
 * Use case: Test Unicode and special character handling
 */
export const withSpecialChars = ' Example: おはよう（ohayou）→ "Good morning" • こんにちは（konnichiwa）→ "Hello" • ありがとう（arigatou）→ "Thank you" 😊';

/**
 * Slow response simulation
 * Use case: Test loading states and user patience
 */
export const slowResponse = standardJapanese; // Same content, just delayed in mock

/**
 * Error response
 * Use case: Test error handling
 */
export const error = null; // Will trigger error in mock

/**
 * Network timeout simulation
 * Use case: Test timeout handling
 */
export const networkTimeout = null; // Will trigger timeout in mock

// Default export with all variations for easy access
export default {
  standardJapanese,
  longCompletion,
  shortCompletion,
  technicalContent,
  conversational,
  withKanji,
  empty,
  veryLong,
  withSpecialChars,
  slowResponse,
  error,
  networkTimeout,
};
