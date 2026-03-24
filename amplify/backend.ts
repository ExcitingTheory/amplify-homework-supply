import { defineBackend } from '@aws-amplify/backend';
import { Stack, Aspects, IAspect } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import { CfnResolver, CfnDataSource } from 'aws-cdk-lib/aws-appsync';
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
 * CDK Aspect to configure AppSync conflict detection on DynamoDB resolvers
 * This enables _version, _lastChangedAt, and _deleted fields for optimistic concurrency control
 */
class AppSyncConflictDetectionAspect implements IAspect {
  private dynamoDbDataSources = new Set<string>();
  
  visit(node: IConstruct): void {
    // First pass: collect all DynamoDB data source logical IDs
    if (node instanceof CfnDataSource) {
      const dataSource = node as CfnDataSource;
      if (dataSource.type === 'AMAZON_DYNAMODB') {
        const logicalId = Stack.of(node).getLogicalId(dataSource);
        this.dynamoDbDataSources.add(logicalId);
        
        // Enable versioning on DynamoDB data source using property override
        // This preserves existing properties like awsRegion and tableName
        dataSource.addPropertyOverride('DynamoDBConfig.Versioned', true);
        console.log(`[ConflictDetectionAspect] Enabled versioning on data source: ${logicalId}`);
      }
    }
    
    // Second pass: configure resolvers that use DynamoDB data sources
    if (node instanceof CfnResolver) {
      const resolver = node as CfnResolver;
      
      // Check resolver properties without using names
      // Only apply to resolvers that have:
      // 1. A dataSourceName (not a pipeline or local resolver)
      // 2. typeName is Mutation or Query (not a field resolver, not Subscription)
      // 3. No code/runtime property (those indicate Lambda resolvers)
      
      const hasDataSource = resolver.dataSourceName !== undefined && resolver.dataSourceName !== null;
      const isOperation = resolver.typeName === 'Mutation' || resolver.typeName === 'Query';
      const isNotLambda = !resolver.code && !resolver.runtime;
      const isNotPipeline = !resolver.pipelineConfig;
      
      if (hasDataSource && isOperation && isNotLambda && isNotPipeline) {
        // Apply syncConfig for conflict detection
        resolver.syncConfig = {
          conflictDetection: 'VERSION',
          conflictHandler: 'AUTOMERGE',
        };
        console.log(`[ConflictDetectionAspect] Applied syncConfig to: ${resolver.typeName}.${resolver.fieldName}`);
      }
    }
  }
}

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

// Enable conflict detection and resolution for AppSync API
// This enables _version, _lastChangedAt, and _deleted fields per AWS AppSync documentation
// https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-sync.html

// Apply Aspect to configure both data sources and resolvers
// The Aspect uses construct properties (not names) to determine which resolvers to configure
const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;
Aspects.of(dataStack).add(new AppSyncConflictDetectionAspect());
console.log('[Amplify Backend] Applied ConflictDetectionAspect to data stack');

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

// Grant section handler permission to call AppSync GraphQL API
const sectionHandlerAppSyncPolicy = new Policy(
  backend.sectionHandler.resources.lambda.stack,
  'SectionHandlerAppSyncPolicy',
  {
    statements: [
      new PolicyStatement({
        actions: ['appsync:GraphQL'],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  }
);

backend.sectionHandler.resources.lambda.role?.attachInlinePolicy(sectionHandlerAppSyncPolicy);

// Set environment variables for section handler
backend.sectionHandler.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
backend.sectionHandler.addEnvironment('API_ENDPOINT', backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl);

// Set API_ENDPOINT for handlers that need GraphQL access
backend.embeddingsHandler.addEnvironment('API_ENDPOINT', backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl);
backend.documentAnalysisHandler.addEnvironment('API_ENDPOINT', backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl);
backend.openaiHandler.addEnvironment('API_ENDPOINT', backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl);

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

// Grant OpenAI handler permission to call AppSync GraphQL API for File management
const openaiAppSyncPolicy = new Policy(
  backend.openaiHandler.resources.lambda.stack,
  'OpenAIAppSyncPolicy',
  {
    statements: [
      new PolicyStatement({
        actions: ['appsync:GraphQL'],
        resources: [`${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`],
      }),
    ],
  }
);

backend.openaiHandler.resources.lambda.role?.attachInlinePolicy(openaiAppSyncPolicy);

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

// Use data stack to avoid creating separate StreamApiStack (which causes circular deps)
const apiStack = dataStack;

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
 * Created on data stack since websocketHandler is also on data stack
 */
const websocketApi = new WebSocketApiConstruct(dataStack, 'WebSocketApi', {
  unitTable: backend.data.resources.tables['Unit'],
  websocketLambda: backend.websocketHandler.resources.lambda,
});

// Set environment variables for Lambda
backend.websocketHandler.addEnvironment('CONNECTIONS_TABLE_NAME', websocketApi.connectionsTable.tableName);
backend.websocketHandler.addEnvironment('UNIT_TABLE_NAME', backend.data.resources.tables['Unit'].tableName);

// Export WebSocket endpoint using CFN intrinsic functions to construct URL at deploy time
backend.addOutput({
  custom: {
    WEBSOCKET_API: {
      apiId: websocketApi.api.apiId,
      stageName: websocketApi.stage.stageName,
      region: Stack.of(websocketApi).region,
    },
  },
});
