/**
 * Mock aws-amplify/api for Storybook
 * Supports both GraphQL (legacy) and REST API (new)
 */

import { simulateDocumentAnalysis } from './aws-amplify-data.js';
import { 
  mockContentCompletion, 
  mockSuggestBlocks,
  mockChat,
} from '../../test/mocks/responses/index.js';

/**
 * Mock REST API post() function with streaming support
 */
export const post = ({ apiName, path, options }) => {
  console.log('[Mock REST API] POST:', { apiName, path, body: options?.body });
  
  let responsePromise;
  
  // Route to appropriate handler
  if (path === '/complete') {
    responsePromise = handleContentCompletion(options?.body).then(result => result.response);
  } else if (path === '/suggest-blocks') {
    responsePromise = handleSuggestBlocks(options?.body).then(result => result.response);
  } else if (path === '/chat') {
    responsePromise = handleChat(options?.body).then(result => result.response);
  } else {
    // Default handler
    responsePromise = Promise.resolve({
      statusCode: 404,
      body: {
        text: () => Promise.resolve(JSON.stringify({ error: 'Not found' })),
      },
    });
  }
  
  return {
    response: responsePromise,
  };
};

/**
 * Handle /complete endpoint - Streaming content completion
 */
async function handleContentCompletion(body) {
  const { prompt, context } = body || {};
  
  console.log('[Mock] Content completion request:', { prompt: prompt?.substring(0, 50) });
  
  // Select appropriate mock response based on prompt content
  let completionText = mockContentCompletion.standardJapanese;
  
  if (prompt && prompt.length > 100) {
    completionText = mockContentCompletion.longCompletion;
  } else if (prompt?.includes('verb') || prompt?.includes('動詞')) {
    completionText = mockContentCompletion.technicalContent;
  } else if (prompt?.includes('hiragana') || prompt?.includes('ひらがな')) {
    completionText = mockContentCompletion.withKanji;
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Create readable stream for streaming response
  const stream = createMockStream(completionText, 50); // 50ms chunks
  
  return {
    response: Promise.resolve({
      statusCode: 200,
      body: stream,
    }),
  };
}

/**
 * Handle /suggest-blocks endpoint - JSON response
 */
async function handleSuggestBlocks(body) {
  const { unitStructure, currentContext } = body || {};
  
  console.log('[Mock] Block suggestions request:', { 
    blocks: unitStructure?.length, 
    context: currentContext?.position 
  });
  
  // Select appropriate mock based on structure
  let mockData = mockSuggestBlocks.afterHeading;
  
  const blockCount = unitStructure?.length || 0;
  const lastBlock = unitStructure?.[blockCount - 1];
  
  if (blockCount === 0) {
    mockData = mockSuggestBlocks.emptyLesson;
  } else if (lastBlock?.type === 'heading') {
    mockData = mockSuggestBlocks.afterHeading;
  } else if (lastBlock?.type === 'paragraph' && blockCount <= 2) {
    mockData = mockSuggestBlocks.afterExplanation;
  } else if (lastBlock?.type === 'paragraph' && blockCount > 2) {
    mockData = mockSuggestBlocks.afterMultipleExplanations;
  } else if (lastBlock?.type === 'quiz') {
    mockData = mockSuggestBlocks.afterQuiz;
  } else if (lastBlock?.type?.includes('answer')) {
    mockData = mockSuggestBlocks.afterPractice;
  } else if (blockCount > 5) {
    mockData = mockSuggestBlocks.complexLesson;
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    response: Promise.resolve({
      statusCode: 200,
      body: {
        text: () => Promise.resolve(JSON.stringify(mockData)),
      },
    }),
  };
}

/**
 * Handle /chat endpoint - Streaming chat
 */
async function handleChat(body) {
  const { messages } = body || {};
  
  console.log('[Mock] Chat request:', { 
    messageCount: messages?.length,
    lastMessage: messages?.[messages?.length - 1]?.content?.substring(0, 50)
  });
  
  const lastMessage = messages?.[messages?.length - 1];
  let response = mockChat.standardResponse;
  
  if (lastMessage?.content?.toLowerCase().includes('help')) {
    response = mockChat.helpWithUnit;
  } else if (lastMessage?.content?.toLowerCase().includes('vocabulary')) {
    response = mockChat.vocabularyAssistance;
  } else if (lastMessage?.content?.toLowerCase().includes('question')) {
    response = mockChat.questionGeneration;
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const stream = createMockStream(response, 30);
  
  return {
    response: Promise.resolve({
      statusCode: 200,
      body: stream,
    }),
  };
}

/**
 * Create a mock ReadableStream that chunks text
 */
function createMockStream(text, chunkDelay = 50) {
  const encoder = new TextEncoder();
  let position = 0;
  const chunkSize = 10; // characters per chunk
  
  return new ReadableStream({
    async start(controller) {
      while (position < text.length) {
        await new Promise(resolve => setTimeout(resolve, chunkDelay));
        
        const chunk = text.substring(position, position + chunkSize);
        controller.enqueue(encoder.encode(chunk));
        position += chunkSize;
      }
      controller.close();
    },
  });
}

/**
 * Legacy GraphQL support for existing components
 */
export const generateClient = () => ({
  graphql: async ({ query, variables }) => {
    console.log('Mock GraphQL call:', { query, variables });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock image generation
    if (query.includes('generateImageFile')) {
      console.log('[Mock API] Generating image file:', variables);
      return {
        data: {
          generateImageFile: {
            path: `/story-mocks/animals-10008941_1280.jpg`,
            mimeType: 'image/png',
            size: 250000,
            name: `generated-${variables.phrase?.slice(0, 20) || 'image'}.png`,
          }
        }
      };
    }
    
    // Mock content moderation
    if (query.includes('ModerateContent')) {
      console.log('[Mock API] Moderating content:', variables.content?.substring(0, 100));
      return {
        data: {
          moderateContent: {
            flagged: false,
            categories: {},
            categoryScores: {},
            model: 'mock-moderation-v1',
            error: null
          }
        }
      };
    }
    
    // Mock audio generation
    if (query.includes('generateAudioFile')) {
      console.log('[Mock API] Generating audio file:', variables);
      return {
        data: {
          generateAudioFile: {
            path: `/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
            mimeType: 'audio/mpeg',
            size: 150000,
            name: `generated-${variables.phrase?.slice(0, 20) || 'audio'}.mp3`,
          }
        }
      };
    }
    
    // Mock response for assistant editor initialization
    if (query.includes('initAssistantEditor')) {
      return {
        data: {
          initAssistantEditor: JSON.stringify({
            assistantId: 'mock-assistant-id',
            threadId: 'mock-thread-id'
          })
        }
      };
    }
    
    // Mock response for assistant editor usage
    if (query.includes('useAssistantEditor')) {
      return {
        data: {
          useAssistantEditor: JSON.stringify({
            required_action: {
              submit_tool_outputs: {
                tool_calls: []
              }
            }
          })
        }
      };
    }
    
    // Mock listSectionStudents query
    if (query.includes('listSectionStudents')) {
      console.log('[Mock API] Listing section students:', variables);
      return {
        data: {
          listSectionStudents: [
            {
              id: 'student-alice-sub',
              email: 'alice@example.com',
              name: 'Alice Johnson'
            },
            {
              id: 'student-bob-sub',
              email: 'bob@example.com',
              name: 'Bob Smith'
            },
            {
              id: 'student-carol-sub',
              email: 'carol@example.com',
              name: 'Carol Williams'
            },
            {
              id: 'student-dave-sub',
              email: 'dave@example.com',
              name: 'Dave Brown'
            }
          ]
        }
      };
    }
    
    // Mock chat response
    if (query.includes('chat')) {
      return {
        data: {
          chat: JSON.stringify({
            id: 'mock-chat-id',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4o',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'This is a mock response from the assistant.'
              },
              finish_reason: 'stop'
            }]
          })
        }
      };
    }
    
    // Mock image verification
    if (query.includes('verifyImage')) {
      console.log('[Mock API] Verifying image:', variables);
      return {
        data: {
          verifyImage: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  answer: true,
                  reason: 'Your drawing correctly shows the expected concept!',
                  score: 0.85
                })
              }
            }]
          })
        }
      };
    }
    
    // Mock Document analysis
    if (query.includes('analyzeDocument')) {
      console.log('[Mock API] Analyzing Document:', variables);
      
      // Trigger status progression simulation
      simulateDocumentAnalysis(variables.documentID);
      
      // Immediate response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        data: {
          analyzeDocument: {
            success: true,
            documentID: variables.documentID,
            responseId: `mock-response-${Date.now()}`,
            pageCount: Math.floor(Math.random() * 50) + 10,
            message: 'Document analysis started successfully. Watch the status badge update in real-time!'
          }
        }
      };
    }
    
    // Mock Document analysis cancellation
    if (query.includes('cancelDocumentAnalysis')) {
      console.log('[Mock API] Cancelling Document analysis:', variables);
      
      // Trigger cancellation in mock
      const { cancelDocumentAnalysis } = await import('./aws-amplify-data.js');
      cancelDocumentAnalysis(variables.documentID);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        data: {
          cancelDocumentAnalysis: {
            success: true,
            documentID: variables.documentID,
            message: 'Analysis cancelled successfully'
          }
        }
      };
    }
    
    // Default mock response
    return {
      data: {}
    };
  }
});
