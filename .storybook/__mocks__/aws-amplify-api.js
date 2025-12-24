/**
 * Mock aws-amplify/api for Storybook
 */

export const generateClient = () => ({
  graphql: async ({ query, variables }) => {
    console.log('Mock GraphQL call:', { query, variables });
    
    // Mock response based on query
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
