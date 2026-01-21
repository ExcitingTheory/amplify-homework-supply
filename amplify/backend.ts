import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  PayloadFormatVersion,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { chatStreamHandler } from './functions/chatStream/resource';
import { contentCompletionStreamHandler } from './functions/contentCompletionStream/resource';
import { suggestBlocksStreamHandler } from './functions/suggestBlocksStream/resource';
import { openaiHandler } from './functions/openai/resource';
import { sectionHandler } from './functions/section/resource';
import { documentAnalysisHandler } from './functions/documentAnalysis/resource';
import { embeddingsHandler } from './functions/embeddings/resource';
import { aiHandler } from './functions/ai/resource';
import { assistantHandler } from './functions/assistant/resource';
import { moderationHandler } from './functions/moderation/resource';
import { websocketHandler, WebSocketApiConstruct } from './custom/websocket/resource';

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend/ to learn how to build backends with Amplify.
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/data-modeling/ to learn more about modeling your data with the Data category.
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth/authentication/ to learn more about Amplify authentication.
 * @see https://docs.amplify.aws/gen2/build-a-backend/storage/manage-files/ to learn more about Amplify storage.
 */

export const backend = defineBackend({
  auth,
  data,
  storage,
  chatStreamHandler,
  contentCompletionStreamHandler,
  suggestBlocksStreamHandler,
  openaiHandler,
  sectionHandler,
  documentAnalysisHandler,
  embeddingsHandler,
  aiHandler,
  assistantHandler,
  moderationHandler,
  websocketHandler,
});

// Note: Cognito permissions for section handler are granted via inline policy in the function's execution role
// This avoids circular dependency between auth and data stacks

/**
 * HTTP API for streaming endpoints
 * 
 * Provides REST API routes for real-time streaming operations:
 * - POST /chat - AI chat with tools and streaming responses
 * - POST /content-completion - Stream content completion suggestions
 * - POST /suggest-blocks - Get block type suggestions (JSON)
 * 
 * All endpoints require Cognito User Pool authentication via Bearer token
 */

// Create streaming API on the data stack to avoid circular dependency
// (auth stack has sectionHandler which would create auth -> streaming -> auth cycle)
const apiStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;

// HTTP API with Cognito authorization
const httpApi = new HttpApi(apiStack, 'StreamHttpApi', {
  apiName: 'homeworkSupplyStreamApi',
  corsPreflight: {
    allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
    allowOrigins: ['*'], // Restrict to your domain in production
    allowHeaders: ['*'],
  },
  createDefaultStage: true,
  disableExecuteApiEndpoint: false,
});

// Lambda integrations with response streaming
const chatStreamIntegration = new HttpLambdaIntegration(
  'ChatStreamIntegration',
  backend.chatStreamHandler.resources.lambda,
  {
    payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
  }
);

const contentCompletionIntegration = new HttpLambdaIntegration(
  'ContentCompletionIntegration',
  backend.contentCompletionStreamHandler.resources.lambda,
  {
    payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
  }
);

const suggestBlocksIntegration = new HttpLambdaIntegration(
  'SuggestBlocksIntegration',
  backend.suggestBlocksStreamHandler.resources.lambda,
  {
    payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
  }
);

// Routes (Bearer token auth validated in handler)
httpApi.addRoutes({
  path: '/chat',
  methods: [HttpMethod.POST],
  integration: chatStreamIntegration,
});

httpApi.addRoutes({
  path: '/content-completion',
  methods: [HttpMethod.POST],
  integration: contentCompletionIntegration,
});

httpApi.addRoutes({
  path: '/suggest-blocks',
  methods: [HttpMethod.POST],
  integration: suggestBlocksIntegration,
});

// Export API endpoint in Amplify custom outputs
backend.addOutput({
  custom: {
    homeworkSupplyStreamApi: {
      endpoint: httpApi.url,
      region: Stack.of(httpApi).region,
    },
    STREAM_API: {
      endpoint: httpApi.url,
      region: Stack.of(httpApi).region,
      apiName: 'homeworkSupplyStreamApi',
    },
  },
});

/**
 * WebSocket API for real-time collaboration
 * 
 * Uses custom CDK construct for WebSocket infrastructure
 */
const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;

const websocketApi = new WebSocketApiConstruct(dataStack, 'WebSocketApi', {
  unitTable: backend.data.resources.tables['Unit'],
  websocketLambda: backend.websocketHandler.resources.lambda,
});

// Set environment variables for Lambda
backend.websocketHandler.addEnvironment('CONNECTIONS_TABLE_NAME', websocketApi.connectionsTable.tableName);
backend.websocketHandler.addEnvironment('UNIT_TABLE_NAME', backend.data.resources.tables['Unit'].tableName);

// Export WebSocket endpoint
backend.addOutput({
  custom: {
    WEBSOCKET_API: {
      endpoint: websocketApi.stage.url,
      region: Stack.of(websocketApi).region,
      apiId: websocketApi.api.apiId,
      stageName: websocketApi.stage.stageName,
    },
  },
});
