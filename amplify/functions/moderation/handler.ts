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
function requireAuth(event: any) {
  // AppSync provides identity in event.identity, not requestContext
  const userId = event.identity?.sub;
  const username = event.identity?.username;
  
  if (!userId) {
    console.error('[Moderation Handler] No user identity found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any, context: any) => {
  // Extract operation name from AppSync event
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};
  
  if (!operationName) {
    console.error('[Moderation Handler] No operation name found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unable to determine operation name from event');
  }
  
  // Require authentication for all operations
  const { userId } = requireAuth(event);

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
      model: response.model || 'text-moderation-latest', // Model is on response, not result
    };
  } catch (error) {
    console.error('[Moderate Content Error]:', error);
    throw error;
  }
}