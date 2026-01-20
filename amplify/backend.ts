import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  PayloadFormatVersion,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
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
});

// Wbesocket API for lambdba realtime function

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

const apiStack = backend.createStack('stream-api-stack');

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

// IAM policy for API access
const apiPolicy = new Policy(apiStack, 'StreamApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        `${httpApi.arnForExecuteApi('*', '/chat')}`,
        `${httpApi.arnForExecuteApi('*', '/content-completion')}`,
        `${httpApi.arnForExecuteApi('*', '/suggest-blocks')}`,
      ],
    }),
  ],
});

// Attach policy to authenticated role
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);

// IAM policies for self-invoking Lambdas
// Lambda functions need to be able to invoke themselves asynchronously
const lambdaStack = backend.createStack('lambda-permissions-stack');

// embeddings function self-invoke
// Policy allows the embeddings Lambda to invoke itself (and all versions/qualifiers with wildcard)
const embeddingsSelfInvokePolicy = new Policy(lambdaStack, 'EmbeddingsSelfInvokePolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [
        // Include function ARN and all versions/qualifiers (denoted by :*)
        `${backend.embeddingsHandler.resources.lambda.functionArn}`,
        `${backend.embeddingsHandler.resources.lambda.functionArn}:*`,
      ],
    }),
  ],
});

// openai function self-invoke
const openaiSelfInvokePolicy = new Policy(lambdaStack, 'OpenaiSelfInvokePolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [
        `${backend.openaiHandler.resources.lambda.functionArn}`,
        `${backend.openaiHandler.resources.lambda.functionArn}:*`,
      ],
    }),
  ],
});

// documentAnalysis function self-invoke
const documentAnalysisSelfInvokePolicy = new Policy(lambdaStack, 'DocumentAnalysisSelfInvokePolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['lambda:InvokeFunction'],
      resources: [
        `${backend.documentAnalysisHandler.resources.lambda.functionArn}`,
        `${backend.documentAnalysisHandler.resources.lambda.functionArn}:*`,
      ],
    }),
  ],
});

// Attach policies to Lambda execution roles
// The assumed-role ARN pattern (arn:aws:sts::account:assumed-role/RoleName/FunctionName)
// uses the role's identity-based policies to allow actions
backend.embeddingsHandler.resources.lambda.role?.attachInlinePolicy(embeddingsSelfInvokePolicy);
backend.openaiHandler.resources.lambda.role?.attachInlinePolicy(openaiSelfInvokePolicy);
backend.documentAnalysisHandler.resources.lambda.role?.attachInlinePolicy(documentAnalysisSelfInvokePolicy);

// Export API endpoint
backend.addOutput({
  custom: {
    STREAM_API: {
      endpoint: httpApi.url,
      region: Stack.of(httpApi).region,
      apiName: httpApi.httpApiName,
    },
  },
});
