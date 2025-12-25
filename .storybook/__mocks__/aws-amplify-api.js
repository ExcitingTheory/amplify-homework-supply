/**
 * Mock aws-amplify/api for Storybook
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
            path: `protected/images/generated-${Date.now()}.png`,
            mimeType: 'image/png',
            size: 250000,
            name: `generated-${variables.phrase?.slice(0, 20) || 'image'}.png`,
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
            path: `protected/audio/generated-${Date.now()}.mp3`,
            mimeType: 'audio/mpeg',
            size: 150000,
            name: `generated-${variables.phrase?.slice(0, 20) || 'audio'}.mp3`,
            waveformData: JSON.stringify([0.3, 0.5, 0.7, 0.9, 0.7, 0.5, 0.3, 0.2]),
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
    
    // Default mock response
    return {
      data: {}
    };
  }
});
