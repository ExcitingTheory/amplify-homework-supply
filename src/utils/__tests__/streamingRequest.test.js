/**
 * Unit tests for streamingRequest.jsx
 * Tests authenticated streaming with AWS SigV4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS Amplify modules
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

vi.mock('aws-amplify/api', () => ({
  post: vi.fn(),
}));

vi.mock('aws-amplify', () => ({
  Amplify: {
    getConfig: vi.fn(() => ({
      API: {
        REST: {
          completions: {
            endpoint: 'https://api.example.com',
          },
        },
      },
    })),
  },
}));

import {
  createStreamingRequest,
  createAISDKFetch,
} from '../streamingRequest.jsx';
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';

describe('streamingRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: { toString: () => 'mock-id-token' },
        accessToken: { toString: () => 'mock-access-token' },
      },
      identityId: 'us-east-1:mock-identity',
    });
  });
  
  describe('createStreamingRequest', () => {
    it('should make authenticated streaming request', async () => {
      const apiName = 'completions';
      const path = '/chat';
      const body = { messages: [{ role: 'user', content: 'Hello' }] };
      
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"response": "Hi"}\n'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const response = await createStreamingRequest(apiName, path, body);
      
      expect(post).toHaveBeenCalledWith({
        apiName,
        path,
        options: {
          body,
        },
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
    
    it('should handle malformed chunks gracefully', async () => {
      const apiName = 'completions';
      const path = '/complete';
      const body = { prompt: 'test' };
      
      // Create stream with malformed JSON
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:{"valid": "json"}\n'));
          controller.enqueue(new TextEncoder().encode('0:{invalid json}\n')); // Malformed
          controller.enqueue(new TextEncoder().encode('0:{"more": "valid"}\n'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const response = await createStreamingRequest(apiName, path, body);
      
      // Stream should continue despite malformed chunk
      expect(response.status).toBe(200);
      
      // Read all chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        allText += decoder.decode(value);
      }
      
      // Should contain valid chunks but not malformed one
      expect(allText).toContain('{"valid": "json"}');
      expect(allText).toContain('{"more": "valid"}');
    });
    
    it('should retry with token refresh on 401 error', async () => {
      const apiName = 'completions';
      const path = '/chat';
      const body = { messages: [] };
      
      const successStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:{"success": true}\n'));
          controller.close();
        },
      });
      
      // First call returns 401, second succeeds
      vi.mocked(post)
        .mockReturnValueOnce({
          response: Promise.resolve({
            statusCode: 401,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('Unauthorized'));
                controller.close();
              },
            }),
          }),
        })
        .mockReturnValueOnce({
          response: Promise.resolve({
            statusCode: 200,
            body: successStream,
          }),
        });
      
      const response = await createStreamingRequest(apiName, path, body);
      
      // Should have called fetchAuthSession with forceRefresh
      expect(fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true });
      
      // Should have made two requests
      expect(post).toHaveBeenCalledTimes(2);
      
      // Final response should be successful
      expect(response.status).toBe(200);
    });
    
    it('should handle non-200 responses', async () => {
      const apiName = 'completions';
      const path = '/chat';
      const body = { messages: [] };
      
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Internal server error'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 500,
          body: errorStream,
        }),
      });
      
      await expect(createStreamingRequest(apiName, path, body)).rejects.toThrow(
        /API request failed: 500/
      );
    });
    
    it('should parse SSE format correctly', async () => {
      const apiName = 'completions';
      const path = '/stream';
      const body = {};
      
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: message\n'));
          controller.enqueue(new TextEncoder().encode('data: {"chunk": 1}\n'));
          controller.enqueue(new TextEncoder().encode('\n'));
          controller.enqueue(new TextEncoder().encode('data: {"chunk": 2}\n'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const response = await createStreamingRequest(apiName, path, body);
      
      expect(response.status).toBe(200);
      
      // Verify stream contains SSE data
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        allText += decoder.decode(value);
      }
      
      expect(allText).toContain('event: message');
      expect(allText).toContain('data: {"chunk": 1}');
    });
    
    it('should parse AI SDK format correctly', async () => {
      const apiName = 'completions';
      const path = '/complete';
      const body = { prompt: 'test' };
      
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:{"type":"text","value":"Hello"}\n'));
          controller.enqueue(new TextEncoder().encode('0:{"type":"text","value":" world"}\n'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const response = await createStreamingRequest(apiName, path, body);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let allText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        allText += decoder.decode(value);
      }
      
      // Should contain both AI SDK formatted chunks
      expect(allText).toContain('0:{"type":"text","value":"Hello"}');
      expect(allText).toContain('0:{"type":"text","value":" world"}');
    });
    
    it('should handle errors during stream processing', async () => {
      const apiName = 'completions';
      const path = '/chat';
      const body = {};
      
      // Create stream that throws error mid-stream
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:{"start": true}\n'));
          controller.error(new Error('Stream error'));
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: errorStream,
        }),
      });
      
      const response = await createStreamingRequest(apiName, path, body);
      const reader = response.body.getReader();
      
      // Should be able to read initial chunk
      const { done: done1, value: value1 } = await reader.read();
      expect(done1).toBe(false);
      expect(value1).toBeDefined();
      
      // Next read should propagate error
      await expect(reader.read()).rejects.toThrow('Stream error');
    });
  });
  
  describe('createAISDKFetch', () => {
    it('should create fetch function compatible with AI SDK', async () => {
      const apiName = 'completions';
      const path = '/chat';
      const contextData = {
        unitId: 'unit-123',
        files: ['file1', 'file2'],
      };
      
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:{"response": "test"}\n'));
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const fetchFn = createAISDKFetch(apiName, path, contextData);
      
      // AI SDK will call this with request body
      const requestBody = JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      
      const response = await fetchFn('mock-url', { body: requestBody });
      
      // Should merge context with request body
      expect(post).toHaveBeenCalledWith({
        apiName,
        path,
        options: {
          body: {
            messages: [{ role: 'user', content: 'Hello' }],
            context: contextData,
          },
        },
      });
      
      expect(response.status).toBe(200);
    });
    
    it('should handle empty request body from AI SDK', async () => {
      const apiName = 'completions';
      const path = '/complete';
      
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 200,
          body: mockStream,
        }),
      });
      
      const fetchFn = createAISDKFetch(apiName, path);
      
      await fetchFn('mock-url', {});
      
      expect(post).toHaveBeenCalledWith({
        apiName,
        path,
        options: {
          body: {
            context: {},
          },
        },
      });
    });
    
    it('should propagate errors from createStreamingRequest', async () => {
      const apiName = 'completions';
      const path = '/chat';
      
      vi.mocked(post).mockReturnValue({
        response: Promise.resolve({
          statusCode: 500,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('Error'));
              controller.close();
            },
          }),
        }),
      });
      
      const fetchFn = createAISDKFetch(apiName, path);
      
      await expect(
        fetchFn('mock-url', { body: JSON.stringify({}) })
      ).rejects.toThrow(/API request failed: 500/);
    });
  });
});
