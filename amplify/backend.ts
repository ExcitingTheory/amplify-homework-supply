import { defineBackend } from "@aws-amplify/backend";
import * as cdk from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";

import {
  RestApi,
  LambdaIntegration,
  CfnMethod,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnDataSource } from "aws-cdk-lib/aws-appsync";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { CfnBucket } from "aws-cdk-lib/aws-s3";
import { Stream, StreamEncryption } from "aws-cdk-lib/aws-kinesis";
import { KinesisEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
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
import { imageProcessHandler } from "./functions/imageProcess/resource";
import { documentThumbnailHandler } from "./functions/documentThumbnail/resource";
import {
  websocketHandler,
  WebSocketApiConstruct,
} from "./custom/websocket/resource";
import { MediaConvertConstruct } from "./custom/mediaConvert/resource";
import { MediaCDNConstruct } from "./custom/mediaCDN/resource";
import {
  computeModelComponents,
  modelNameFromStackId,
} from "./custom/dataStackWaveOrder/resource";
import { CfKeyRotationConstruct } from "./custom/cfKeyRotation/resource";
import { ApplySyncConfigConstruct } from "./custom/applySyncConfig/resource";
import { gamificationHandler } from "./functions/gamification/resource";
import { peerReviewAIHandler } from "./functions/peerReviewAI/resource";
import { generatePracticeDrillHandler } from "./functions/generatePracticeDrill/resource";
import { streakResetCronHandler } from "./functions/streakResetCron/resource";
import { notificationCronHandler } from "./functions/notificationCron/resource";
import { leaderboardStreamHandler } from "./functions/leaderboardStream/resource";
import { analyticsAggregatorHandler } from "./functions/analyticsAggregator/resource";
import { publishUnitHandler } from "./functions/publishUnit/resource";
import { rebuildNgramIndexHandler } from "./functions/rebuildNgramIndex/resource";
import { collaboratorHandler } from "./functions/collaborator/resource";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

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
  imageProcessHandler,
  documentThumbnailHandler,
  websocketHandler,
  gamificationHandler,
  peerReviewAIHandler,
  generatePracticeDrillHandler,
  streakResetCronHandler,
  notificationCronHandler,
  leaderboardStreamHandler,
  analyticsAggregatorHandler,
  publishUnitHandler,
  rebuildNgramIndexHandler,
  collaboratorHandler,
});

const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;
const apiId = backend.data.resources.cfnResources.cfnGraphqlApi.attrApiId;

// Throttle concurrent nested-stack creation to avoid AppSync 429 rate limits,
// without risking circular dependencies: only chain nested stacks whose
// models fall in different relation-graph connected components (see
// computeModelComponents). CDK never infers a cross-stack dependency
// between such models, so an artificial dependency between them can never
// conflict with one it infers automatically from a real relation.
const dataNestedStacks = dataStack.node
  .findAll()
  .filter(
    (c): c is cdk.NestedStack =>
      cdk.NestedStack.isNestedStack(c) && c.nestedStackParent === dataStack,
  );

// Generalizes the isolated-model throttle to the FULL model graph: two
// stacks are only ever chained together if their models fall in different
// connected components (no relation path between them at all), which makes
// it impossible for the artificial edge to conflict with a real CDK-
// inferred cross-stack dependency in either direction.
const modelComponents = computeModelComponents();
const modeledStacks = dataNestedStacks
  .filter((s) => modelNameFromStackId(s.node.id) !== null)
  .sort((a, b) => a.node.path.localeCompare(b.node.path));

// The large schema is still exceeding the AppSync control-plane burst budget.
// Keep the safe cross-component-only rule, but default to a much stricter
// cadence so the stack creates in a near-serial stream instead of a broad
// wave that triggers the 429s.
const WAVE_SIZE = Math.max(1, Number(process.env.AMPLIFY_MODEL_WAVE_SIZE || 1));
for (let i = WAVE_SIZE; i < modeledStacks.length; i++) {
  const currentModel = modelNameFromStackId(modeledStacks[i].node.id)!;
  const priorModel = modelNameFromStackId(
    modeledStacks[i - WAVE_SIZE].node.id,
  )!;
  if (modelComponents.get(currentModel) !== modelComponents.get(priorModel)) {
    modeledStacks[i].addDependency(modeledStacks[i - WAVE_SIZE]);
  }
}

// Nested-stack-level throttling above isn't enough on its own — AppSync
// itself rate-limits (429s) the individual CreateResolver/CreateFunction
// control-plane calls when hundreds fire concurrently within a short
// window (observed Sept 2026: dozens of AWS::AppSync::Resolver and
// AWS::AppSync::FunctionConfiguration resources hitting CREATE_IN_PROGRESS
// in the same second). Apply the identical cross-component-only wave
// throttle one level deeper, directly to these two resource types, since
// they're what's actually being throttled by the AppSync API. Keep the
// default at a strict one-step serialization so the create burst is spread
// out as much as possible without creating circular dependency conflicts.
function findOwningModel(resource: cdk.CfnResource): string | null {
  for (const scope of resource.node.scopes) {
    if (dataNestedStacks.includes(scope as cdk.NestedStack)) {
      return modelNameFromStackId(scope.node.id);
    }
  }
  return null;
}

function findOwningStack(resource: cdk.CfnResource): cdk.NestedStack | null {
  for (const scope of resource.node.scopes) {
    if (dataNestedStacks.includes(scope as cdk.NestedStack)) {
      return scope as cdk.NestedStack;
    }
  }
  return null;
}

const appSyncControlPlaneResources = dataStack.node
  .findAll()
  .filter(
    (c): c is cdk.CfnResource =>
      cdk.CfnResource.isCfnResource(c) &&
      (c.cfnResourceType === "AWS::AppSync::Resolver" ||
        c.cfnResourceType === "AWS::AppSync::FunctionConfiguration"),
  )
  .map((resource) => ({ resource, modelName: findOwningModel(resource) }))
  .filter(
    (entry): entry is { resource: cdk.CfnResource; modelName: string } =>
      entry.modelName !== null,
  )
  .sort((a, b) => a.resource.node.path.localeCompare(b.resource.node.path));

const RESOLVER_WAVE_SIZE = Math.max(
  1,
  Number(process.env.AMPLIFY_RESOLVER_WAVE_SIZE || 1),
);
for (let i = RESOLVER_WAVE_SIZE; i < appSyncControlPlaneResources.length; i++) {
  const current = appSyncControlPlaneResources[i];
  const prior = appSyncControlPlaneResources[i - RESOLVER_WAVE_SIZE];
  if (
    modelComponents.get(current.modelName) !==
    modelComponents.get(prior.modelName)
  ) {
    current.resource.addDependency(prior.resource);
  }
}

// The cross-component wave throttle above can only chain resources whose
// owning models fall in DIFFERENT relation components — so a single model's
// own resolvers/functions (all in one component, one nested stack) are never
// throttled against each other and previously fired every CreateResolver/
// CreateFunction call for that model concurrently (e.g. AssistantChat's
// `owner` + `embedding` field resolvers, Document's `writableGroups`
// resolver, etc. all hitting the AppSync control plane in the same instant —
// the exact resources still 429ing). Serialize same-typed control-plane
// resources WITHIN each nested stack so each stack contributes at most one
// in-flight create at a time instead of ~N. This is the safest possible
// lever against the 429s: it adds NO cross-stack edges (cannot conflict with
// the relation-inferred nested-stack dependencies CDK creates) and only
// chains resources of the SAME type (Resolver↔Resolver, Function↔Function),
// which never depend on one another, so it is provably acyclic.
const INTRA_STACK_WAVE_SIZE = Math.max(
  1,
  Number(process.env.AMPLIFY_INTRA_STACK_WAVE_SIZE || 1),
);
const intraStackGroups = new Map<string, cdk.CfnResource[]>();
for (const { resource } of appSyncControlPlaneResources) {
  const stack = findOwningStack(resource);
  if (!stack) continue;
  const key = `${stack.node.path}::${resource.cfnResourceType}`;
  const group = intraStackGroups.get(key);
  if (group) {
    group.push(resource);
  } else {
    intraStackGroups.set(key, [resource]);
  }
}
for (const group of intraStackGroups.values()) {
  group.sort((a, b) => a.node.path.localeCompare(b.node.path));
  for (let i = INTRA_STACK_WAVE_SIZE; i < group.length; i++) {
    group[i].addDependency(group[i - INTRA_STACK_WAVE_SIZE]);
  }
}

// The shared NONE_DS AppSync data source (used by pipeline "init"/auth
// FunctionConfigurations that don't hit a real backend) lives directly on
// the core data stack, but is referenced by name — not Ref/GetAtt — from
// FunctionConfiguration resources scattered across nearly every per-model
// nested stack. CDK can't infer a delete-order dependency from a plain
// string reference, so CloudFormation can attempt to delete NONE_DS while a
// sibling nested stack still has an in-flight FunctionConfiguration
// pointing at it, causing a recurring DELETE_FAILED: "Data source is still
// in use by functions: [...]" (observed repeatedly Sept 2026). Force every
// nested stack that owns an AppSync Resolver/FunctionConfiguration to
// depend on NONE_DS so CloudFormation always tears those stacks down FIRST
// (reverse dependency order on delete) before removing NONE_DS itself.
const noneDataSource = dataStack.node
  .findAll()
  .find(
    (c): c is CfnDataSource =>
      c instanceof CfnDataSource && c.name === "NONE_DS",
  );
// Skip if absent (e.g. a reduced-model bootstrap phase never created it) —
// with no NONE_DS, there's nothing for a FunctionConfiguration to reference.
if (noneDataSource) {
  const stacksOwningAppSyncFunctions = new Set(
    appSyncControlPlaneResources
      .map(({ resource }) => findOwningStack(resource))
      .filter((s): s is cdk.NestedStack => s !== null),
  );
  for (const stack of stacksOwningAppSyncFunctions) {
    stack.nestedStackResource?.addDependency(noneDataSource);
  }
}

// Conflict detection applied post-deployment by Custom Resource with rate-limited batching
const syncConfigCR = new ApplySyncConfigConstruct(
  dataStack,
  "ApplySyncConfig",
  {
    apiId,
    region: dataStack.region,
  },
);
syncConfigCR.node.addDependency(backend.data.resources.graphqlApi);

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

// Grant Cognito permissions to collaborator handler for instructor search
const collaboratorCognitoPolicy = new Policy(
  backend.collaboratorHandler.resources.lambda.stack,
  "CollaboratorHandlerCognitoPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: [
          "cognito-idp:ListUsersInGroup",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminListGroupsForUser",
        ],
        resources: [backend.auth.resources.userPool.userPoolArn],
      }),
    ],
  },
);
backend.collaboratorHandler.resources.lambda.role?.attachInlinePolicy(
  collaboratorCognitoPolicy,
);
backend.collaboratorHandler.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);

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

// Grant Embeddings handler S3 access for storing embedding vectors
backend.embeddingsHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.embeddingsHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  }),
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

// ==========================================================================
// CfKeyRotation — generates RSA key pair and writes to SSM before CloudFront
// ==========================================================================
const cfKeyRotation = new CfKeyRotationConstruct(dataStack, "CfKeyRotation");

// ==========================================================================
// MediaCDN — CloudFront distribution in front of S3 with OAC
// ==========================================================================

const mediaCDN = new MediaCDNConstruct(dataStack, "MediaCDN", {
  bucket: backend.storage.resources.bucket,
  cfPublicKeyPem: cfKeyRotation.publicKeyPem,
});

// Ensure key pair is written to SSM before the distribution is created/updated
mediaCDN.node.addDependency(cfKeyRotation);

// -------------------------------------------------------------------------
// CloudFront OAC bucket policy — allow CloudFront service principal to read
// from the S3 bucket. This is added here (not inside MediaCDNConstruct)
// because the bucket lives in the storage stack and the distribution lives
// in the data stack. Using just the service principal (without a SourceArn
// condition referencing the distribution) avoids creating a circular
// dependency between the two nested stacks.
// -------------------------------------------------------------------------
backend.storage.resources.bucket.addToResourcePolicy(
  new PolicyStatement({
    sid: "AllowCloudFrontServicePrincipalReadOnly",
    actions: ["s3:GetObject"],
    principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
    resources: [backend.storage.resources.bucket.arnForObjects("*")],
  }),
);

// Export CDN domain so Next.js and the frontend can construct stable CDN URLs
backend.addOutput({
  custom: {
    CLOUDFRONT: {
      domain: mediaCDN.distribution.distributionDomainName,
      distributionId: mediaCDN.distribution.distributionId,
    },
  },
});

// Grant sectionHandler S3 read via IAM role policy only (no bucket policy modification).
// Using addToRolePolicy instead of bucket.grantRead() avoids a storage→data cross-stack
// reference which would create a circular dependency between the two nested stacks.
backend.sectionHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [`${backend.storage.resources.bucket.bucketArn}/private/*`],
  }),
);
backend.sectionHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.sectionHandler.addEnvironment(
  "CDN_DOMAIN",
  mediaCDN.distribution.distributionDomainName,
);

// Grant sectionHandler SSM read so it can fetch the CF private key and key pair ID at runtime
const sectionHandlerSSMPolicy = new Policy(
  backend.sectionHandler.resources.lambda.stack,
  "SectionHandlerSSMPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${dataStack.region}:${dataStack.account}:parameter/homework-supply/cloudfront/*`,
        ],
      }),
    ],
  },
);
backend.sectionHandler.resources.lambda.role?.attachInlinePolicy(
  sectionHandlerSSMPolicy,
);

// ==========================================================================
// publishUnit — Phase 6: copies media, rewrites Lexical JSON, writes published.json
// ==========================================================================

// Full S3 read/write: reads from private/* (draft) and writes to protected/units/*
// Using addToRolePolicy instead of bucket.grantReadWrite() avoids a storage→data
// cross-stack reference which would create a circular dependency between nested stacks.
backend.publishUnitHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject", "s3:PutObject", "s3:CopyObject", "s3:ListBucket"],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  }),
);

// AppSync access to query Unit and update publishedContentVersion + publishedAt
const publishUnitAppSyncPolicy = new Policy(
  backend.publishUnitHandler.resources.lambda.stack,
  "PublishUnitAppSyncPolicy",
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
backend.publishUnitHandler.resources.lambda.role?.attachInlinePolicy(
  publishUnitAppSyncPolicy,
);

backend.publishUnitHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.publishUnitHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

// ==========================================================================
// rebuildNgramIndex — Phase 6: scans published units, writes ngrams/v1.json
// ==========================================================================

// Read all published unit JSON + write ngrams index under protected/units/
backend.rebuildNgramIndexHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [
      `${backend.storage.resources.bucket.bucketArn}/protected/units/*`,
    ],
  }),
);
backend.rebuildNgramIndexHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObject"],
    resources: [
      `${backend.storage.resources.bucket.bucketArn}/protected/units/ngrams/*`,
    ],
  }),
);

const rebuildNgramAppSyncPolicy = new Policy(
  backend.rebuildNgramIndexHandler.resources.lambda.stack,
  "RebuildNgramAppSyncPolicy",
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
backend.rebuildNgramIndexHandler.resources.lambda.role?.attachInlinePolicy(
  rebuildNgramAppSyncPolicy,
);

backend.rebuildNgramIndexHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.rebuildNgramIndexHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

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

// generatePracticeDrill — S3 access for reading published unit content
backend.generatePracticeDrillHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.generatePracticeDrillHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.generatePracticeDrillHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`],
  }),
);

// gamification — S3 access for reading published unit content
backend.gamificationHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.gamificationHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`],
  }),
);

// ---------------------------------------------------------------------------
// Image Processing — EventBridge rule for image/document uploads
// ---------------------------------------------------------------------------

new events.Rule(dataStack, "S3ImageUploadRule", {
  description:
    "Routes S3 image/PDF uploads to imageProcess handler via EventBridge",
  eventPattern: {
    source: ["aws.s3"],
    detailType: ["Object Created"],
    detail: {
      bucket: {
        name: [backend.storage.resources.bucket.bucketName],
      },
      object: {
        key: events.Match.anyOf(
          events.Match.suffix(".jpg"),
          events.Match.suffix(".jpeg"),
          events.Match.suffix(".png"),
          events.Match.suffix(".gif"),
          events.Match.suffix(".webp"),
          events.Match.suffix(".avif"),
          events.Match.suffix(".tiff"),
          events.Match.suffix(".bmp"),
          events.Match.suffix(".pdf"),
        ),
      },
    },
  },
  targets: [
    new targets.LambdaFunction(backend.imageProcessHandler.resources.lambda),
  ],
});

// Environment variables for imageProcess
backend.imageProcessHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.imageProcessHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);

// S3 read/write access for downloading source files and uploading processed variants
backend.imageProcessHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  }),
);

// AppSync GraphQL access (to query/update File records)
const imageProcessAppSyncPolicy = new Policy(
  backend.imageProcessHandler.resources.lambda.stack,
  "ImageProcessAppSyncPolicy",
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
backend.imageProcessHandler.resources.lambda.role?.attachInlinePolicy(
  imageProcessAppSyncPolicy,
);

// ---------------------------------------------------------------------------
// Document Thumbnail Lambda (LibreOffice layer for office documents)
// ---------------------------------------------------------------------------

// EventBridge rule for document uploads (office docs + edu formats — for thumbnail generation)
new events.Rule(dataStack, "S3DocumentUploadRule", {
  description:
    "Routes S3 office/edu document uploads to documentThumbnail handler via EventBridge",
  eventPattern: {
    source: ["aws.s3"],
    detailType: ["Object Created"],
    detail: {
      bucket: {
        name: [backend.storage.resources.bucket.bucketName],
      },
      object: {
        key: events.Match.anyOf(
          events.Match.suffix(".doc"),
          events.Match.suffix(".docx"),
          events.Match.suffix(".xls"),
          events.Match.suffix(".xlsx"),
          events.Match.suffix(".ppt"),
          events.Match.suffix(".pptx"),
          events.Match.suffix(".odt"),
          events.Match.suffix(".ods"),
          events.Match.suffix(".odp"),
          events.Match.suffix(".rtf"),
          events.Match.suffix(".epub"),
          events.Match.suffix(".txt"),
          events.Match.suffix(".md"),
          events.Match.suffix(".csv"),
          events.Match.suffix(".imscc"),
          events.Match.suffix(".qti"),
          events.Match.suffix(".gift"),
          events.Match.suffix(".zip"),
        ),
      },
    },
  },
  targets: [
    new targets.LambdaFunction(
      backend.documentThumbnailHandler.resources.lambda,
    ),
  ],
});

// EventBridge rule for document analysis (auto-analyze on upload)
new events.Rule(dataStack, "S3DocumentAnalysisRule", {
  description:
    "Routes S3 document/edu uploads to documentAnalysis handler for auto-analysis",
  eventPattern: {
    source: ["aws.s3"],
    detailType: ["Object Created"],
    detail: {
      bucket: {
        name: [backend.storage.resources.bucket.bucketName],
      },
      object: {
        key: events.Match.anyOf(
          events.Match.suffix(".pdf"),
          events.Match.suffix(".doc"),
          events.Match.suffix(".docx"),
          events.Match.suffix(".xls"),
          events.Match.suffix(".xlsx"),
          events.Match.suffix(".ppt"),
          events.Match.suffix(".pptx"),
          events.Match.suffix(".odt"),
          events.Match.suffix(".ods"),
          events.Match.suffix(".odp"),
          events.Match.suffix(".txt"),
          events.Match.suffix(".md"),
          events.Match.suffix(".csv"),
          events.Match.suffix(".epub"),
          events.Match.suffix(".rtf"),
          events.Match.suffix(".imscc"),
          events.Match.suffix(".qti"),
          events.Match.suffix(".gift"),
          events.Match.suffix(".zip"),
        ),
      },
    },
  },
  targets: [
    new targets.LambdaFunction(
      backend.documentAnalysisHandler.resources.lambda,
    ),
  ],
});

// Environment variables for documentThumbnail
backend.documentThumbnailHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.documentThumbnailHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);

// S3 read/write access
backend.documentThumbnailHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  }),
);

// AppSync GraphQL access (to query/update File records)
const documentThumbnailAppSyncPolicy = new Policy(
  backend.documentThumbnailHandler.resources.lambda.stack,
  "DocumentThumbnailAppSyncPolicy",
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
backend.documentThumbnailHandler.resources.lambda.role?.attachInlinePolicy(
  documentThumbnailAppSyncPolicy,
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
 *
 * Requires Unit/HomeworkRoom/Section/Notification tables to exist, which
 * isn't guaranteed during an early bootstrap phase (see
 * filterSchemaForBootstrapPhase above) — skip wiring until a phase that
 * includes all of them (always true for the final, unfiltered deploy).
 */
const unitTableForWebsocket = backend.data.resources.tables["Unit"];
const homeworkRoomTableForWebsocket =
  backend.data.resources.tables["HomeworkRoom"];
const sectionTableForWebsocket = backend.data.resources.tables["Section"];
const notificationTableForWebsocket =
  backend.data.resources.tables["Notification"];

if (
  unitTableForWebsocket &&
  homeworkRoomTableForWebsocket &&
  sectionTableForWebsocket &&
  notificationTableForWebsocket
) {
  const websocketApi = new WebSocketApiConstruct(dataStack, "WebSocketApi", {
    unitTable: unitTableForWebsocket,
    homeworkRoomTable: homeworkRoomTableForWebsocket,
    sectionTable: sectionTableForWebsocket,
    notificationTable: notificationTableForWebsocket,
    websocketLambda: backend.websocketHandler.resources.lambda,
  });

  // Set environment variables for Lambda
  backend.websocketHandler.addEnvironment(
    "CONNECTIONS_TABLE_NAME",
    websocketApi.connectionsTable.tableName,
  );
  backend.websocketHandler.addEnvironment(
    "UNIT_TABLE_NAME",
    unitTableForWebsocket.tableName,
  );
  backend.websocketHandler.addEnvironment(
    "HOMEWORK_ROOM_TABLE_NAME",
    homeworkRoomTableForWebsocket.tableName,
  );
  backend.websocketHandler.addEnvironment(
    "SECTION_TABLE_NAME",
    sectionTableForWebsocket.tableName,
  );
  backend.websocketHandler.addEnvironment(
    "NOTIFICATION_TABLE_NAME",
    notificationTableForWebsocket.tableName,
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
}

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
// Leaderboard Stream Handler — DynamoDB Stream on StudentXPLog
// ==========================================================================

backend.leaderboardStreamHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const leaderboardStreamAppSyncPolicy = new Policy(
  backend.leaderboardStreamHandler.resources.lambda.stack,
  "LeaderboardStreamAppSyncPolicy",
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
backend.leaderboardStreamHandler.resources.lambda.role?.attachInlinePolicy(
  leaderboardStreamAppSyncPolicy,
);

// Connect DynamoDB Stream from StudentXPLog table to the leaderboard stream handler
// (StudentXPLog may not exist yet during an early bootstrap phase — see
// filterSchemaForBootstrapPhase above — skip until it's actually deployed).
const studentXPLogTable = backend.data.resources.tables["StudentXPLog"];
if (studentXPLogTable) {
  const leaderboardStreamLambda =
    backend.leaderboardStreamHandler.resources.lambda;

  leaderboardStreamLambda.addEventSource(
    new DynamoEventSource(studentXPLogTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 25,
      maxBatchingWindow: cdk.Duration.seconds(10), // Wait up to 10s to batch records
      retryAttempts: 3,
      bisectBatchOnError: true,
      filters: [
        lambda.FilterCriteria.filter({
          eventName: lambda.FilterRule.isEqual("INSERT"),
        }),
      ],
    }),
  );

  // Grant the stream handler read access to the StudentXPLog table stream
  studentXPLogTable.grantStreamRead(leaderboardStreamLambda);
}

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

// ==========================================================================
// Notification Cron Handler — IAM + env config
// ==========================================================================

backend.notificationCronHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const notificationCronAppSyncPolicy = new Policy(
  backend.notificationCronHandler.resources.lambda.stack,
  "NotificationCronAppSyncPolicy",
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
backend.notificationCronHandler.resources.lambda.role?.attachInlinePolicy(
  notificationCronAppSyncPolicy,
);

// ==========================================================================
// Analytics — Kinesis stream + Aggregator Lambda (in data stack to avoid circular deps)
// ==========================================================================

// Kinesis stream for buffered analytics events and Web Vitals
const analyticsStream = new Stream(dataStack, "AnalyticsStream", {
  streamName: "homework-supply-analytics",
  shardCount: 1,
  encryption: StreamEncryption.MANAGED,
  retentionPeriod: cdk.Duration.days(7),
});

// Aggregator Lambda — consumes Kinesis batches, writes to AnalyticsSummary DynamoDB table
const aggregatorLambda = backend.analyticsAggregatorHandler.resources.lambda;

// Grant the aggregator access to the GraphQL API for writing AnalyticsSummary records
const analyticsAppSyncPolicy = new Policy(
  dataStack,
  "AnalyticsAggregatorAppSyncPolicy",
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
aggregatorLambda.role?.attachInlinePolicy(analyticsAppSyncPolicy);

// Add API endpoint env var so Lambda can call GraphQL
backend.analyticsAggregatorHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

// Wire Kinesis as event source for the aggregator
aggregatorLambda.addEventSource(
  new KinesisEventSource(analyticsStream, {
    batchSize: 100,
    maxBatchingWindow: cdk.Duration.minutes(5),
    startingPosition: StartingPosition.LATEST,
  }),
);

// Output the stream name so API routes can find it
backend.addOutput({
  custom: {
    AnalyticsStream: {
      name: analyticsStream.streamName,
      region: dataStack.region,
    },
  },
});
