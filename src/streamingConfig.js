/**
 * Streaming configuration
 * Run `amplify status` after deployment to get the Function URL from outputs
 * Then update CHAT_STREAM_FUNCTION_URL below
 */

export const streamingConfig = {
  // Set to true to use Lambda Function URL (requires AWS_IAM signing)
  // Set to false to use API Gateway /chat endpoint
  USE_FUNCTION_URL: false,
  
  // Lambda Function URL - get this from `amplify status` or CloudFormation outputs
  // Example: https://abc123.lambda-url.us-east-1.on.aws/
  CHAT_STREAM_FUNCTION_URL: process.env.NEXT_PUBLIC_CHAT_STREAM_URL || null,
  
  // API Gateway endpoint (default)
  API_NAME: 'completions',
  API_PATH: '/chat',
};

/**
 * Helper to get the correct endpoint based on configuration
 * @param {Object} amplifyConfig - Amplify configuration object
 * @returns {string} The endpoint URL to use
 */
export function getChatEndpoint(amplifyConfig) {
  if (streamingConfig.USE_FUNCTION_URL && streamingConfig.CHAT_STREAM_FUNCTION_URL) {
    return streamingConfig.CHAT_STREAM_FUNCTION_URL;
  }
  
  // Default to API Gateway
  const api = amplifyConfig.aws_cloud_logic_custom?.find(
    a => a.name === streamingConfig.API_NAME
  );
  return api ? `${api.endpoint}${streamingConfig.API_PATH}` : null;
}
