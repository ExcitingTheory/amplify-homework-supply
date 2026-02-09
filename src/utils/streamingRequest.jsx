/**
 * Streaming Request Utility
 * 
 * Handles authenticated streaming requests to AWS API Gateway + Lambda
 * with support for:
 * - Authenticated users (idToken) 
 * - Unauthenticated/guest users (accessToken)
 * - Automatic token refresh on expiration
 * - AWS Signature Version 4 signing for API Gateway
 * - Native fetch for proper streaming support (Amplify's post() buffers)
 * - Graceful error handling for malformed chunks
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';

/**
 * Wrap a ReadableStream to gracefully handle parsing errors
 * Drops malformed chunks and continues processing
 */
function createRobustStream(originalStream) {
    const reader = originalStream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        // Flush any remaining buffer
                        if (buffer.trim()) {
                            try {
                                controller.enqueue(new TextEncoder().encode(buffer));
                            } catch (error) {
                                console.warn('[StreamingRequest] Dropped final buffer chunk due to error:', error.message);
                            }
                        }
                        controller.close();
                        break;
                    }
                    
                    // Decode chunk
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Process complete lines (SSE format: "data: {...}\n\n" or AI SDK format: "0:{...}\n")
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            // Validate the line can be processed
                            // For AI SDK data stream protocol, lines should start with "0:" or be SSE format
                            if (line.startsWith('0:')) {
                                // AI SDK format - validate JSON
                                const jsonStr = line.slice(2);
                                JSON.parse(jsonStr); // Validate it's parseable
                                controller.enqueue(new TextEncoder().encode(line + '\n'));
                            } else if (line.startsWith('data:') || line.startsWith('event:')) {
                                // SSE format - pass through
                                controller.enqueue(new TextEncoder().encode(line + '\n'));
                            } else if (line.trim().startsWith('{') || line.trim().startsWith('[')) {
                                // Looks like JSON - validate it
                                JSON.parse(line.trim());
                                controller.enqueue(new TextEncoder().encode(line + '\n'));
                            } else {
                                // Unknown format - try to pass through
                                controller.enqueue(new TextEncoder().encode(line + '\n'));
                            }
                        } catch (error) {
                            // Log and drop malformed chunk
                            console.warn('[StreamingRequest] Dropped malformed chunk:', {
                                error: error.message,
                                chunk: line.substring(0, 100), // First 100 chars for debugging
                                chunkLength: line.length,
                            });
                            // Continue processing - don't throw
                        }
                    }
                }
            } catch (error) {
                console.error('[StreamingRequest] Stream processing error:', error);
                controller.error(error);
            }
        },
        
        cancel() {
            reader.cancel();
        }
    });
}

/**
 * Create a streaming request with automatic auth handling
 * 
 * @param {string} apiName - The API name from Amplify config (e.g., 'completions')
 * @param {string} path - The API path (e.g., '/chat')
 * @param {object} body - Request body to send
 * @returns {Promise<Response>} - Native fetch Response with streaming body
 */
export async function createStreamingRequest(apiName, path, body) {
    const makeRequest = async (forceRefresh = false) => {
        try {
            // Force refresh auth if requested
            if (forceRefresh) {
                await fetchAuthSession({ forceRefresh: true });
            }
            
            console.log('[StreamingRequest] Making streaming request:', {
                apiName,
                path,
                bodySize: JSON.stringify(body).length,
            });
            
            // Use Amplify's post() which automatically handles AWS SigV4 signing
            const restOperation = post({
                apiName,
                path,
                options: {
                    body,
                },
            });
            
            // Get the response - Amplify handles auth and signing
            const response = await restOperation.response;
            
            console.log('[StreamingRequest] Response received:', {
                statusCode: response.statusCode,
                hasBody: !!response.body,
            });
            
            // If we get 401/403, token might be expired - retry once with refresh
            if ((response.statusCode === 401 || response.statusCode === 403) && !forceRefresh) {
                console.warn('[StreamingRequest] Auth error, retrying with token refresh...');
                return makeRequest(true);
            }
            
            if (response.statusCode < 200 || response.statusCode >= 300) {
                // Try to read error body
                let errorText = 'Unknown error';
                try {
                    const reader = response.body.getReader();
                    const { value } = await reader.read();
                    errorText = new TextDecoder().decode(value);
                } catch (e) {
                    console.warn('[StreamingRequest] Could not read error body:', e);
                }
                console.error('[StreamingRequest] Error response:', errorText);
                throw new Error(`API request failed: ${response.statusCode} - ${errorText}`);
            }
            
            // Wrap the response stream with error handling
            const robustStream = createRobustStream(response.body);
            
            // Return Web API Response for AI SDK compatibility
            return new Response(robustStream, {
                status: response.statusCode,
                statusText: response.statusCode === 200 ? 'OK' : 'Error',
                headers: new Headers({
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                }),
            });
        } catch (error) {
            console.error('[StreamingRequest] Error making request:', error);
            throw error;
        }
    };
    
    return makeRequest(false);
}

/**
 * Create a fetch function compatible with AI SDK's transport
 * 
 * @param {string} apiName - The API name from Amplify config
 * @param {string} path - The API path
 * @param {object} contextData - Additional context to include in requests
 * @returns {Function} - Fetch function compatible with AI SDK
 */
export function createAISDKFetch(apiName, path, contextData = {}) {
    return async (url, options) => {
        console.log('[StreamingRequest] AI SDK fetch called');
        
        try {
            // Parse the request body from AI SDK
            const requestBody = options.body ? JSON.parse(options.body) : {};
            
            // Merge with context data
            const bodyWithContext = {
                ...requestBody,
                context: contextData,
            };
            
            return await createStreamingRequest(apiName, path, bodyWithContext);
        } catch (error) {
            console.error('[StreamingRequest] Error in AI SDK fetch:', error);
            throw error;
        }
    };
}
