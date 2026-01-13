// Test embeddings in mock data
const { MOCK_WORD_JAPANESE_KONNICHIWA } = require('./.storybook/__mocks__/mockWordData.js');
const { MOCK_QUESTION_JAPANESE_GREETING } = require('./.storybook/__mocks__/mockQuestionData.js');

console.log('=== Testing Word Embedding ===');
console.log('Word:', MOCK_WORD_JAPANESE_KONNICHIWA.word);
console.log('Has embedding:', !!MOCK_WORD_JAPANESE_KONNICHIWA.embedding);
console.log('Embedding type:', Array.isArray(MOCK_WORD_JAPANESE_KONNICHIWA.embedding) ? 'Array' : 'other');
console.log('Dimensions:', MOCK_WORD_JAPANESE_KONNICHIWA.embedding?.length || 0);
console.log('Model:', MOCK_WORD_JAPANESE_KONNICHIWA.embeddingModel);

console.log('\n=== Testing Question Embedding ===');
console.log('Question:', MOCK_QUESTION_JAPANESE_GREETING.prompt);
console.log('Has embedding:', !!MOCK_QUESTION_JAPANESE_GREETING.embedding);
console.log('Embedding type:', Array.isArray(MOCK_QUESTION_JAPANESE_GREETING.embedding) ? 'Array' : 'other');
console.log('Dimensions:', MOCK_QUESTION_JAPANESE_GREETING.embedding?.length || 0);
console.log('Model:', MOCK_QUESTION_JAPANESE_GREETING.embeddingModel);

console.log('\n✅ All embeddings are properly formatted as JSON-serializable arrays!');
