import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  PayloadFormatVersion,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
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

// Grant Cognito permissions to section handler via IAM policy (not via auth.access() to avoid circular dependency)
const cognitoPolicy = new Policy(backend.sectionHandler.resources.lambda.stack, 'SectionHandlerCognitoPolicy', {
  statements: [
    new PolicyStatement({
      actions: [
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminListGroupsForUser',
        'cognito-idp:ListUsersInGroup',
        'cognito-idp:GetGroup',
        'cognito-idp:ListGroups',
        'cognito-idp:ListUsers',
        'cognito-idp:CreateGroup',
        'cognito-idp:DeleteGroup',
      ],
      resources: [backend.auth.resources.userPool.userPoolArn],
    }),
  ],
});

backend.sectionHandler.resources.lambda.role?.attachInlinePolicy(cognitoPolicy);

// Set USER_POOL_ID environment variable for section handler
backend.sectionHandler.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Grant OpenAI handler permission to invoke itself for async operations (audio generation)
const openaiSelfInvokePolicy = new Policy(backend.openaiHandler.resources.lambda.stack, 'OpenAISelfInvokePolicy', {
  statements: [
    new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [backend.openaiHandler.resources.lambda.functionArn],
    }),
  ],
});

backend.openaiHandler.resources.lambda.role?.attachInlinePolicy(openaiSelfInvokePolicy);

// Grant Embeddings handler permission to invoke itself for async operations if needed
const embeddingsSelfInvokePolicy = new Policy(backend.embeddingsHandler.resources.lambda.stack, 'EmbeddingsSelfInvokePolicy', {
  statements: [
    new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [backend.embeddingsHandler.resources.lambda.functionArn],
    }),
  ],
});

backend.embeddingsHandler.resources.lambda.role?.attachInlinePolicy(embeddingsSelfInvokePolicy);

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

// Create streaming API on its own stack to avoid cross-stack cycles with data/auth/storage
const apiStack = backend.createStack('StreamApiStack');

// Create Cognito User Pool authorizer for HTTP API
const httpAuthorizer = new HttpUserPoolAuthorizer(
  'StreamApiAuthorizer',
  backend.auth.resources.userPool,
  {
    userPoolClients: [backend.auth.resources.userPoolClient],
    identitySource: ['$request.header.Authorization'],
  }
);

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

// Routes with Cognito User Pool authorization
httpApi.addRoutes({
  path: '/chat',
  methods: [HttpMethod.POST],
  integration: chatStreamIntegration,
  authorizer: httpAuthorizer,
});

httpApi.addRoutes({
  path: '/content-completion',
  methods: [HttpMethod.POST],
  integration: contentCompletionIntegration,
  authorizer: httpAuthorizer,
});

httpApi.addRoutes({
  path: '/suggest-blocks',
  methods: [HttpMethod.POST],
  integration: suggestBlocksIntegration,
  authorizer: httpAuthorizer,
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
