/**
 * Suggest Blocks Stream HTTP API Handler for Gen 2
 * 
 * REST API endpoint for streaming block suggestions:
 * - POST /suggest-blocks - Analyze unit and suggest next block types
 * 
 * Features:
 * - Pedagogical content analysis
 * - JSON-formatted block suggestions
 * - Learning flow assessment
 * - Block type recommendations with reasoning
 * 
 * Reference: amplify/backend/function/suggestBlocksStream/
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');
    const OpenAI = (await import('openai')).default;
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}


interface BlockSuggestion {
  type: 'heading' | 'paragraph' | 'quiz' | 'meaning-association' | 'answer' | 'custom-answer';
  label: string;
  icon: string;
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SuggestBlocksResponse {
  suggestions: BlockSuggestion[];
  overallAssessment: string;
}

/**
 * HTTP API Handler for POST /suggest-blocks
 */
export const handler: APIGatewayProxyHandlerV2 = async (event): Promise<any> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { unitStructure, currentContext } = body;

    if (!unitStructure) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'unitStructure is required' }),
      };
    }

    const openai = await getOpenAI();

    // Build system message for pedagogical analysis
    const systemMessage = `You are an expert educational content designer specializing in Japanese language instruction.

Analyze the provided lesson structure and suggest the next logical block types that would best serve the pedagogical progression.

For each suggestion:
1. Consider what content already exists
2. Identify gaps in the learning sequence
3. Recommend block types that build on previous content
4. Prioritize suggestions based on pedagogical importance

Provide your response as JSON with this exact structure:
{
  "suggestions": [
    {
      "type": "heading|paragraph|quiz|meaning-association|answer|custom-answer",
      "label": "Short descriptive label",
      "icon": "📝|📖|❓|🔗|✍️|💭",
      "reasoning": "Clear pedagogical explanation (2-3 sentences)",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "overallAssessment": "Brief analysis of the lesson's current state and learning flow"
}`;

    const userMessage = `Unit Structure:\n${JSON.stringify(unitStructure, null, 2)}\n\nCurrent Context:\n${JSON.stringify(currentContext || {}, null, 2)}`;

    console.log('[SuggestBlocks] Analyzing unit structure');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const result: SuggestBlocksResponse = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[SuggestBlocks] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
    };
  }
};
