import OpenAI from 'openai';

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // This API endpoint is disabled - use Amplify backend functions instead
  return new Response(
    JSON.stringify({ 
      error: 'This API endpoint is not available. Use Amplify backend functions for embeddings.',
      details: 'Frontend does not handle OpenAI API keys for security reasons.'
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
