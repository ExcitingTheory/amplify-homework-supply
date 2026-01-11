// Local test script for chatStream function
// Run with: NODE_ENV="test" node test-local.js

// Mock the awslambda API
global.awslambda = {
  streamifyResponse: (handlerFn) => {
    return async (event, context) => {
      const chunks = [];
      
      const mockResponseStream = {
        write: (chunk) => {
          chunks.push(chunk);
          process.stdout.write(chunk);
        },
        end: () => {
          console.log('\n\n=== Stream ended ===');
          console.log(`Total chunks: ${chunks.length}`);
        },
        setContentType: (type) => console.log(`Content-Type: ${type}`),
        setCacheControl: (value) => console.log(`Cache-Control: ${value}`),
        setConnection: (value) => console.log(`Connection: ${value}`),
        setHeader: (key, value) => console.log(`${key}: ${value}`),
      };
      
      await handlerFn(event, mockResponseStream, context);
    };
  },
  HttpResponseStream: {
    from: (responseStream, metadata) => {
      // Return the same stream - pass through
      return responseStream;
    }
  }
};

// Mock SSM for local testing - set to actual API key in test mode
// process.env.OPENAI_API_KEY = 'sk-your-actual-api-key-here'; // Replace with your real key
process.env.IS_LOCAL = 'true';
process.env.AWS_REGION = 'us-east-1';

// Import the handler
import('./src/index.js').then(async (module) => {
  const { handler } = module;
  
  const testEvent = {
    body: JSON.stringify({
      messages: [{
    "parts": [
        {
            "type": "text",
            "text": "test"
        }
    ],
    "id": "cX9l55QFe6mHrYM9",
    "role": "user",
    "_logged": true
}],
      context: {
        unit: {
          id: 'unit-123',
          title: 'Sample Unit'
        },
        files: [
          { id: 'file-1', name: 'Document.pdf' }
        ],
        questionBank: [
          { id: 'q1', question: 'What is 2+2?' }
        ],
        dictionary: [
          { term: 'Ecosystem', definition: 'A biological community...' }
        ],
        sections: [
          { id: 'sec-1', title: 'Introduction' }
        ]
      }
    } ),
    requestContext: { requestId: 'test-123' }
  };
  
  const testContext = {
    awsRequestId: 'test-123',
    functionName: 'chatStream-test'
  };
  
  console.log('=== Starting test ===\n');
  
  try {
    await handler(testEvent, testContext);
  } catch (error) {
    console.error('Error:', error);
  }
}).catch(err => {
  console.error('Failed to load handler:', err);
});