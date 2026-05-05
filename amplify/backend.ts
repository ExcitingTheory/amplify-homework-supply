import { defineBackend } from "@aws-amplify/backend";
import { Stack, Aspects, IAspect } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { CfnResolver, CfnDataSource } from "aws-cdk-lib/aws-appsync";
import {
  RestApi,
  LambdaIntegration,
  CfnMethod,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { CfnBucket } from "aws-cdk-lib/aws-s3";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { chatStreamHandler } from "./functions/chatStream/resource";
import { contentCompletionStreamHandler } from "./functions/contentCompletionStream/resource";
import { suggestBlocksStreamHandler } from "./functions/suggestBlocksStream/resource";
import { openaiHandler } from "./functions/openai/resource";
import { sectionHandler } from "./functions/section/resource";
import { documentAnalysisHandler } from "./functions/documentAnalysis/resource";
import { embeddingsHandler } from "./functions/embeddings/resource";

import { moderationHandler } from "./functions/moderation/resource";
import { mediaConvertHandler } from "./functions/mediaConvert/resource";
import {
  websocketHandler,
  WebSocketApiConstruct,
} from "./custom/websocket/resource";
import { MediaConvertConstruct } from "./custom/mediaConvert/resource";
import { gamificationHandler } from "./functions/gamification/resource";
import { peerReviewAIHandler } from "./functions/peerReviewAI/resource";
import { streakResetCronHandler } from "./functions/streakResetCron/resource";

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
      if (dataSource.type === "AMAZON_DYNAMODB") {
        const logicalId = Stack.of(node).getLogicalId(dataSource);
        this.dynamoDbDataSources.add(logicalId);

        // Enable versioning on DynamoDB data source using property override
        // This preserves existing properties like awsRegion and tableName
        dataSource.addPropertyOverride("DynamoDBConfig.Versioned", true);
        console.log(
          `[ConflictDetectionAspect] Enabled versioning on data source: ${logicalId}`,
        );
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

      const hasDataSource =
        resolver.dataSourceName !== undefined &&
        resolver.dataSourceName !== null;
      const isOperation =
        resolver.typeName === "Mutation" || resolver.typeName === "Query";
      const isNotLambda = !resolver.code && !resolver.runtime;
      const isNotPipeline = !resolver.pipelineConfig;

      if (hasDataSource && isOperation && isNotLambda && isNotPipeline) {
        // Apply syncConfig for conflict detection
        resolver.syncConfig = {
          conflictDetection: "VERSION",
          conflictHandler: "AUTOMERGE",
        };
        console.log(
          `[ConflictDetectionAspect] Applied syncConfig to: ${resolver.typeName}.${resolver.fieldName}`,
        );
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
  moderationHandler,
  mediaConvertHandler,
  websocketHandler,
  gamificationHandler,
  peerReviewAIHandler,
  streakResetCronHandler,
});

// Enable conflict detection and resolution for AppSync API
// This enables _version, _lastChangedAt, and _deleted fields per AWS AppSync documentation
// https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-sync.html

// Apply Aspect to configure both data sources and resolvers
// The Aspect uses construct properties (not names) to determine which resolvers to configure
const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;
Aspects.of(dataStack).add(new AppSyncConflictDetectionAspect());
console.log("[Amplify Backend] Applied ConflictDetectionAspect to data stack");

// Grant Cognito permissions to section handler via IAM policy (not via auth.access() to avoid circular dependency)
const cognitoPolicy = new Policy(
  backend.sectionHandler.resources.lambda.stack,
  "SectionHandlerCognitoPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:ListUsersInGroup",
          "cognito-idp:GetGroup",
          "cognito-idp:ListGroups",
          "cognito-idp:ListUsers",
          "cognito-idp:CreateGroup",
          "cognito-idp:DeleteGroup",
        ],
        resources: [backend.auth.resources.userPool.userPoolArn],
      }),
    ],
  },
);

backend.sectionHandler.resources.lambda.role?.attachInlinePolicy(cognitoPolicy);

// Grant section handler permission to call AppSync GraphQL API
const sectionHandlerAppSyncPolicy = new Policy(
  backend.sectionHandler.resources.lambda.stack,
  "SectionHandlerAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);

backend.sectionHandler.resources.lambda.role?.attachInlinePolicy(
  sectionHandlerAppSyncPolicy,
);

// Set environment variables for section handler
backend.sectionHandler.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.sectionHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

// Set API_ENDPOINT for handlers that need GraphQL access
backend.embeddingsHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.documentAnalysisHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.openaiHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

// Grant Document Analysis handler permission to call AppSync GraphQL API
const documentAnalysisAppSyncPolicy = new Policy(
  backend.documentAnalysisHandler.resources.lambda.stack,
  "DocumentAnalysisAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.documentAnalysisHandler.resources.lambda.role?.attachInlinePolicy(
  documentAnalysisAppSyncPolicy,
);

// Grant Embeddings handler permission to call AppSync GraphQL API
const embeddingsAppSyncPolicy = new Policy(
  backend.embeddingsHandler.resources.lambda.stack,
  "EmbeddingsAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.embeddingsHandler.resources.lambda.role?.attachInlinePolicy(
  embeddingsAppSyncPolicy,
);

// Grant OpenAI handler permission to invoke itself for async operations (audio generation)
const openaiSelfInvokePolicy = new Policy(
  backend.openaiHandler.resources.lambda.stack,
  "OpenAISelfInvokePolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [backend.openaiHandler.resources.lambda.functionArn],
      }),
    ],
  },
);

backend.openaiHandler.resources.lambda.role?.attachInlinePolicy(
  openaiSelfInvokePolicy,
);

// Grant OpenAI handler permission to call AppSync GraphQL API for File management
const openaiAppSyncPolicy = new Policy(
  backend.openaiHandler.resources.lambda.stack,
  "OpenAIAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);

backend.openaiHandler.resources.lambda.role?.attachInlinePolicy(
  openaiAppSyncPolicy,
);

// Grant Embeddings handler permission to invoke itself for async operations if needed
const embeddingsSelfInvokePolicy = new Policy(
  backend.embeddingsHandler.resources.lambda.stack,
  "EmbeddingsSelfInvokePolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [backend.embeddingsHandler.resources.lambda.functionArn],
      }),
    ],
  },
);

backend.embeddingsHandler.resources.lambda.role?.attachInlinePolicy(
  embeddingsSelfInvokePolicy,
);

// ==========================================================================
// MediaConvert — HLS transcoding pipeline
// ==========================================================================

// CDK construct: MediaConvert service role + EventBridge completion rule
const mediaConvert = new MediaConvertConstruct(dataStack, "MediaConvert", {
  bucket: backend.storage.resources.bucket,
  handlerLambda: backend.mediaConvertHandler.resources.lambda,
});

// S3 event notifications via EventBridge — avoids circular dependency between storage and data stacks.
// Instead of bucket.addEventNotification (which creates storage → data cross-stack ref),
// we enable EventBridge on the bucket and create a rule in the data stack (one-way data → storage).
const cfnBucket = backend.storage.resources.bucket.node
  .defaultChild as CfnBucket;
cfnBucket.addPropertyOverride(
  "NotificationConfiguration.EventBridgeConfiguration",
  {
    EventBridgeEnabled: true,
  },
);

new events.Rule(dataStack, "S3VideoUploadRule", {
  description:
    "Routes S3 video uploads to MediaConvert handler via EventBridge",
  eventPattern: {
    source: ["aws.s3"],
    detailType: ["Object Created"],
    detail: {
      bucket: {
        name: [backend.storage.resources.bucket.bucketName],
      },
      object: {
        key: [{ prefix: "protected/" }],
      },
    },
  },
  targets: [
    new targets.LambdaFunction(backend.mediaConvertHandler.resources.lambda),
  ],
});

// Environment variables
backend.mediaConvertHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.mediaConvertHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.mediaConvertHandler.addEnvironment(
  "MEDIACONVERT_ROLE_ARN",
  mediaConvert.mediaConvertRole.roleArn,
);

// AppSync GraphQL access (to update File records)
const mediaConvertAppSyncPolicy = new Policy(
  backend.mediaConvertHandler.resources.lambda.stack,
  "MediaConvertAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.mediaConvertHandler.resources.lambda.role?.attachInlinePolicy(
  mediaConvertAppSyncPolicy,
);

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

// Create REST API with Cognito authorization (REST API supports streaming invocations)
const restApi = new RestApi(apiStack, "StreamRestApi", {
  restApiName: "homeworkSupplyStreamApi",
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
  deployOptions: {
    stageName: "prod",
  },
});

// Cognito User Pool authorizer for REST API
const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(
  apiStack,
  "StreamApiCognitoAuth",
  {
    cognitoUserPools: [backend.auth.resources.userPool],
    identitySource: "method.request.header.Authorization",
  },
);

// Lambda integrations (standard proxy — we'll override to streaming below)
const chatStreamIntegration = new LambdaIntegration(
  backend.chatStreamHandler.resources.lambda,
  { proxy: true },
);

const contentCompletionIntegration = new LambdaIntegration(
  backend.contentCompletionStreamHandler.resources.lambda,
  { proxy: true },
);

const suggestBlocksIntegration = new LambdaIntegration(
  backend.suggestBlocksStreamHandler.resources.lambda,
  { proxy: true },
);

// Add resources and methods
const chatResource = restApi.root.addResource("chat");
const chatMethod = chatResource.addMethod("POST", chatStreamIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
});

const contentCompletionResource =
  restApi.root.addResource("content-completion");
const contentCompletionMethod = contentCompletionResource.addMethod(
  "POST",
  contentCompletionIntegration,
  {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuthorizer,
  },
);

const suggestBlocksResource = restApi.root.addResource("suggest-blocks");
const suggestBlocksMethod = suggestBlocksResource.addMethod(
  "POST",
  suggestBlocksIntegration,
  {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuthorizer,
  },
);

// Override L1 integrations to use Lambda response streaming invocation path
// This matches the Gen 1 pattern: /response-streaming-invocations + responseTransferMode: STREAM
const streamingOverrides: Array<{
  method: typeof chatMethod;
  lambdaArn: string;
}> = [
  {
    method: chatMethod,
    lambdaArn: backend.chatStreamHandler.resources.lambda.functionArn,
  },
  {
    method: contentCompletionMethod,
    lambdaArn:
      backend.contentCompletionStreamHandler.resources.lambda.functionArn,
  },
  {
    method: suggestBlocksMethod,
    lambdaArn: backend.suggestBlocksStreamHandler.resources.lambda.functionArn,
  },
];

for (const { method, lambdaArn } of streamingOverrides) {
  const cfnMethod = method.node.defaultChild as CfnMethod;
  cfnMethod.addPropertyOverride("Integration.Uri", {
    "Fn::Join": [
      "",
      [
        "arn:aws:apigateway:",
        { Ref: "AWS::Region" },
        ":lambda:path/2021-11-15/functions/",
        lambdaArn,
        "/response-streaming-invocations",
      ],
    ],
  });
  cfnMethod.addPropertyOverride("Integration.ResponseTransferMode", "STREAM");
}

// Export API endpoint in Amplify custom outputs
backend.addOutput({
  custom: {
    homeworkSupplyStreamApi: {
      endpoint: restApi.url,
      region: Stack.of(restApi).region,
    },
    STREAM_API: {
      endpoint: restApi.url,
      region: Stack.of(restApi).region,
      apiName: "homeworkSupplyStreamApi",
    },
  },
});

/**
 * WebSocket API for real-time collaboration
 *
 * Uses custom CDK construct for WebSocket infrastructure
 * Created on data stack since websocketHandler is also on data stack
 */
const websocketApi = new WebSocketApiConstruct(dataStack, "WebSocketApi", {
  unitTable: backend.data.resources.tables["Unit"],
  homeworkRoomTable: backend.data.resources.tables["HomeworkRoom"],
  websocketLambda: backend.websocketHandler.resources.lambda,
});

// Set environment variables for Lambda
backend.websocketHandler.addEnvironment(
  "CONNECTIONS_TABLE_NAME",
  websocketApi.connectionsTable.tableName,
);
backend.websocketHandler.addEnvironment(
  "UNIT_TABLE_NAME",
  backend.data.resources.tables["Unit"].tableName,
);
backend.websocketHandler.addEnvironment(
  "HOMEWORK_ROOM_TABLE_NAME",
  backend.data.resources.tables["HomeworkRoom"].tableName,
);

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

// ==========================================================================
// Gamification Handler — IAM + env config
// ==========================================================================

backend.gamificationHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const gamificationAppSyncPolicy = new Policy(
  backend.gamificationHandler.resources.lambda.stack,
  "GamificationAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.gamificationHandler.resources.lambda.role?.attachInlinePolicy(
  gamificationAppSyncPolicy,
);

// ==========================================================================
// Peer Review AI Handler — IAM + env config
// ==========================================================================

backend.peerReviewAIHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const peerReviewAIAppSyncPolicy = new Policy(
  backend.peerReviewAIHandler.resources.lambda.stack,
  "PeerReviewAIAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.peerReviewAIHandler.resources.lambda.role?.attachInlinePolicy(
  peerReviewAIAppSyncPolicy,
);

// ==========================================================================
// Streak Reset Cron Handler — IAM + env config
// ==========================================================================

backend.streakResetCronHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const streakResetCronAppSyncPolicy = new Policy(
  backend.streakResetCronHandler.resources.lambda.stack,
  "StreakResetCronAppSyncPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["appsync:GraphQL"],
        resources: [
          `${backend.data.resources.cfnResources.cfnGraphqlApi.attrArn}/*`,
        ],
      }),
    ],
  },
);
backend.streakResetCronHandler.resources.lambda.role?.attachInlinePolicy(
  streakResetCronAppSyncPolicy,
);
