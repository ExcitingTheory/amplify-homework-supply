/**
 * Assistant Editor Handler for Gen 2
 * 
 * Manages OpenAI Assistant threads and conversations:
 * - initAssistantEditor: Create new Assistant
 * - updateAssistantEditor: Update Assistant instructions
 * - deleteAssistantEditor: Delete Assistant and thread
 * - useAssistantEditor: Use existing Assistant
 * - chatAssistantThread: Send message to thread
 * 
 * Reference: amplify/backend/function/openai-${env}/
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
  // AppSync provides identity in event.identity, not requestContext
  const userId = event.identity?.sub || event.identity?.username;
  
  if (!userId) {
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId };
}

export const handler: Handler = async (event: any, context: any) => {
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};

  if (!operationName) {
    console.error('[Assistant Handler] No operation name found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unable to determine operation name from event');
  }

  // Require authentication for all operations
  const { userId } = requireAuth(event, context);

  console.log(`[Assistant Handler] ${operationName}`, args);

  try {
    switch (operationName) {
      case 'initAssistantEditor':
        return await handleInitAssistantEditor(args);
      case 'updateAssistantEditor':
        return await handleUpdateAssistantEditor(args);
      case 'deleteAssistantEditor':
        return await handleDeleteAssistantEditor(args);
      case 'useAssistantEditor':
        return await handleUseAssistantEditor(args);
      case 'chatAssistantThread':
        return await handleChatAssistantThread(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[Assistant Handler Error] ${operationName}:`, error);
    throw error;
  }
};

async function handleInitAssistantEditor(args: any): Promise<string> {
  const { model = 'gpt-4o', additionalInstructions = '' } = args;
  const openai = await getOpenAI();
  
  try {
    // Create new assistant
    const assistant = await openai.beta.assistants.create({
      name: 'Content Editor Assistant',
      model,
      instructions: `You are an expert educational content editor. ${additionalInstructions}`,
      tools: [
        {
          type: 'code_interpreter',
        },
        {
          type: 'retrieval',
        },
      ],
    });
    
    // Create thread for conversation
    const thread = await openai.beta.threads.create();
    
    return JSON.stringify({
      assistantId: assistant.id,
      threadId: thread.id,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Init Assistant Error]:', error);
    throw error;
  }
}

async function handleUpdateAssistantEditor(args: any): Promise<string> {
  const { assistantId, additionalInstructions = '', model } = args;
  const openai = await getOpenAI();
  
  try {
    const updateData: any = {};
    if (additionalInstructions) {
      updateData.instructions = `You are an expert educational content editor. ${additionalInstructions}`;
    }
    if (model) {
      updateData.model = model;
    }
    
    const updated = await openai.beta.assistants.update(assistantId, updateData);
    
    return JSON.stringify({
      assistantId: updated.id,
      model: updated.model,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Update Assistant Error]:', error);
    throw error;
  }
}

async function handleDeleteAssistantEditor(args: any): Promise<string> {
  const { assistantId, threadId } = args;
  const openai = await getOpenAI();
  
  try {
    // Delete thread
    if (threadId) {
      await openai.beta.threads.del(threadId);
    }
    
    // Delete assistant
    await openai.beta.assistants.del(assistantId);
    
    return JSON.stringify({
      assistantId,
      threadId,
      deleted: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Delete Assistant Error]:', error);
    throw error;
  }
}

async function handleUseAssistantEditor(args: any): Promise<string> {
  const { threadInstructions = '', assistantId, threadId } = args;
  const openai = await getOpenAI();
  
  try {
    // Verify assistant exists
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    // Verify thread exists
    let thread: any = null;
    if (threadId) {
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      // Create new thread if not provided
      thread = await openai.beta.threads.create();
    }
    
    // Load thread messages to get context length
    const messages = await openai.beta.threads.messages.list(thread.id);
    const contextLength = messages.data.reduce((sum: number, msg: any) => {
      if (msg.content[0]?.type === 'text') {
        return sum + msg.content[0].text.value.length;
      }
      return sum;
    }, 0);
    
    return JSON.stringify({
      assistantId: assistant.id,
      assistantName: assistant.name,
      threadId: thread.id,
      ready: true,
      contextLength,
      messageCount: messages.data.length,
      threadInstructionsApplied: threadInstructions.length > 0,
    });
  } catch (error) {
    console.error('[Use Assistant Error]:', error);
    throw error;
  }
}

async function handleChatAssistantThread(args: any): Promise<string> {
  const { assistantId, threadId, messages: messagesStr } = args;
  const openai = await getOpenAI();
  
  try {
    const messages = typeof messagesStr === 'string' ? JSON.parse(messagesStr) : messagesStr;
    
    // Use existing thread or create new one
    let thread: any;
    if (threadId) {
      console.log('[Chat Assistant] Using existing thread:', threadId);
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      console.log('[Chat Assistant] Creating new thread');
      thread = await openai.beta.threads.create();
    }
    
    // Add messages to thread
    console.log('[Chat Assistant] Adding', messages.length, 'messages to thread');
    for (const message of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role || 'user',
        content: message.content,
      });
    }
    
    // Run assistant
    console.log('[Chat Assistant] Running assistant');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    
    // Poll for completion with timeout
    let completedRun = run;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    
    while (completedRun.status !== 'completed' && completedRun.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`[Chat Assistant] Still running... status: ${completedRun.status} (${attempts}s elapsed)`);
      }
    }
    
    if (completedRun.status === 'failed') {
      console.error('[Chat Assistant] Run failed:', completedRun.last_error);
      throw new Error(`Assistant run failed: ${completedRun.last_error?.message}`);
    }
    
    if (completedRun.status !== 'completed') {
      console.warn('[Chat Assistant] Run timed out');
      return JSON.stringify({
        success: false,
        threadId: thread.id,
        runId: run.id,
        status: completedRun.status,
        message: 'Assistant run timed out. Please check status later.',
      });
    }
    
    // Get messages from thread
    console.log('[Chat Assistant] Retrieving thread messages');
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    
    // Extract assistant's last message
    const assistantMessages = threadMessages.data.filter((msg: any) => msg.role === 'assistant');
    const lastMessage = assistantMessages[0];
    
    if (!lastMessage) {
      console.error('[Chat Assistant] No assistant message found');
      return JSON.stringify({
        success: false,
        threadId: thread.id,
        message: 'No response from assistant',
      });
    }
    
    let responseContent = '';
    for (const content of lastMessage.content) {
      if (content.type === 'text') {
        responseContent += content.text.value;
      }
    }
    
    console.log('[Chat Assistant] Chat complete');
    return JSON.stringify({
      success: true,
      threadId: thread.id,
      runId: run.id,
      response: responseContent,
      status: 'completed',
      messageCount: threadMessages.data.length,
    });
  } catch (error) {
    console.error('[Chat Assistant Error]:', error);
    throw error;
  }
}