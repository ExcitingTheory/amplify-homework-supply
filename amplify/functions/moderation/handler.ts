/**
 * Moderation Handler for Gen 2
 * 
 * Handles:
 * - moderateContent: Check content with OpenAI moderation API
 * 
 * Reference: amplify/backend/function/moderation-${env}/
 */

import type { Handler } from 'aws-lambda';

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

/**
 * Authorization check utility
 * Verifies user is authenticated
 */
function requireAuth(event: any, context: any) {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId };
}

export const handler: Handler = async (event: any, context: any) => {
  const operationName = context?.['x-operation-name'] || event.info?.fieldName;
  const args = event.arguments || {};
  
  // Require authentication for all operations
  const { userId } = requireAuth(event, context);

  console.log(`[Moderation Handler] ${operationName}`, args);

  try {
    switch (operationName) {
      case 'moderateContent':
        return await handleModerateContent(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[Moderation Handler Error] ${operationName}:`, error);
    throw error;
  }
};

async function handleModerateContent(args: any): Promise<any> {
  const { content } = args;
  const openai = await getOpenAI();
  
  try {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Moderate Content Error]:', error);
    throw error;
  }
}