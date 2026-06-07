/**
 * Mock moderateContent utility for Storybook/Vitest
 * Prevents real OpenAI API calls during testing.
 */

export async function moderateContent() {
  return {
    flagged: false,
    categories: {},
    categoryScores: {},
    model: 'omni-moderation-latest',
    error: null,
  };
}

export async function moderateContentWithPersist() {
  return {
    flagged: false,
    categories: {},
    categoryScores: {},
    model: 'omni-moderation-latest',
    error: null,
  };
}
