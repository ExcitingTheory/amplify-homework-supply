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
import * as logs from "aws-cdk-lib/aws-logs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Alarm, ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import { CfnBucket } from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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
import { documentAnalysisWorkflowHandler } from "./functions/documentAnalysisWorkflow/resource";
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
import { gradeRollupStreamHandler } from "./functions/gradeRollupStream/resource";
import { analyticsAggregatorHandler } from "./functions/analyticsAggregator/resource";
import { publishUnitHandler } from "./functions/publishUnit/resource";
import { rebuildNgramIndexHandler } from "./functions/rebuildNgramIndex/resource";
import { collaboratorHandler } from "./functions/collaborator/resource";
import { recycleBinHandler } from "./functions/recycleBin/resource";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  DynamoEventSource,
  SqsDlq,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Queue } from "aws-cdk-lib/aws-sqs";

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
  documentAnalysisWorkflowHandler,
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
  gradeRollupStreamHandler,
  analyticsAggregatorHandler,
  publishUnitHandler,
  rebuildNgramIndexHandler,
  collaboratorHandler,
  recycleBinHandler,
});

const dataStack = backend.data.resources.cfnResources.cfnGraphqlApi.stack;
const apiId = backend.data.resources.cfnResources.cfnGraphqlApi.attrApiId;
const documentAnalysisLimiterTable = new dynamodb.Table(
  dataStack,
  "DocumentAnalysisProviderRateLimiter",
  {
    partitionKey: {
      name: "id",
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    encryption: dynamodb.TableEncryption.AWS_MANAGED,
    pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    timeToLiveAttribute: "expiresAt",
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
);

// Tag every resource in every stack of this app (Tags.of on the App root
// cascades to all child stacks/constructs) so deployed AWS resources can be
// traced back to the owning repo and, eventually, the business customer.
const app = dataStack.node.root as cdk.App;
cdk.Tags.of(app).add("repo", "ExcitingTheory/amplify-homework-supply");
// Business customer identifier — storage location (env var vs config vs
// something else) not yet decided. Once decided, source the value below
// instead of process.env.CUSTOMER_ID.
if (process.env.CUSTOMER_ID) {
  cdk.Tags.of(app).add("customer-id", process.env.CUSTOMER_ID);
}

// DynamoDB tables default to RemovalPolicy.DESTROY with no point-in-time
// recovery, so deleting the stack permanently destroys all table data with
// no backup path. Deletion protection is opt-in only: it requires BOTH the
// master feature flag AND the current branch/account to be on the explicit
// allowlist below, so it can never be silently enabled everywhere. Set via
// Amplify Console app/branch environment variables, not committed here.
const deletionProtectionFeatureFlag =
  process.env.AMPLIFY_ENABLE_DELETION_PROTECTION === "true";
const deletionProtectionAllowlist = (
  process.env.AMPLIFY_DELETION_PROTECTION_ALLOWLIST || ""
)
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const currentBranch = process.env.AWS_BRANCH || "";
const currentAccountAlias =
  process.env.AMPLIFY_ACCOUNT_ALIAS || dataStack.account;
const isAllowlistedEnvironment =
  deletionProtectionAllowlist.includes(currentBranch) ||
  deletionProtectionAllowlist.includes(currentAccountAlias);

if (deletionProtectionFeatureFlag && isAllowlistedEnvironment) {
  for (const table of Object.values(
    backend.data.resources.cfnResources.amplifyDynamoDbTables,
  )) {
    table.deletionProtectionEnabled = true;
    table.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
  }
  console.log(
    `[backend] Deletion protection enabled for DynamoDB tables (branch=${currentBranch}, account=${currentAccountAlias}).`,
  );
}

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
    modeledStacks[i].addStackDependency(modeledStacks[i - WAVE_SIZE]);
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
    current.resource.addResourceDependency(prior.resource);
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
//
// Unlike the cross-component throttle (which legitimately needs "owning
// model" to check component membership), this only needs "owning nested
// stack" — so it must NOT reuse the model-filtered `appSyncControlPlaneResources`
// list. Inspecting the synthesized cdk.out confirmed two large SHARED nested
// stacks outside any per-model stack — `ConnectionStack` (128
// FunctionConfigurations backing relation/auth pipeline resolvers, several
// referencing NONE_DS) and `FunctionDirectiveStack` (132 custom
// query/mutation Lambda-invoke functions) — neither matches the
// `<Model>.NestedStack` naming pattern `modelNameFromStackId` expects, so
// both were SILENTLY EXCLUDED from every throttle above, leaving ~260
// AppSync control-plane resources creating/deleting with zero serialization.
const allControlPlaneResources = dataStack.node
  .findAll()
  .filter(
    (c): c is cdk.CfnResource =>
      cdk.CfnResource.isCfnResource(c) &&
      (c.cfnResourceType === "AWS::AppSync::Resolver" ||
        c.cfnResourceType === "AWS::AppSync::FunctionConfiguration"),
  )
  .sort((a, b) => a.node.path.localeCompare(b.node.path));

const INTRA_STACK_WAVE_SIZE = Math.max(
  1,
  Number(process.env.AMPLIFY_INTRA_STACK_WAVE_SIZE || 1),
);
const intraStackGroups = new Map<string, cdk.CfnResource[]>();
for (const resource of allControlPlaneResources) {
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
    group[i].addResourceDependency(group[i - INTRA_STACK_WAVE_SIZE]);
  }
}

// The shared NONE_DS AppSync data source (used by pipeline "init"/auth
// FunctionConfigurations that don't hit a real backend) lives directly on
// the core data stack, but is referenced by name — not Ref/GetAtt — from
// FunctionConfiguration resources scattered across nearly every nested
// stack — including the SHARED `ConnectionStack` (confirmed via cdk.out:
// its relation/auth pipeline functions reference NONE_DS by a cross-stack
// `Ref`, e.g. `Unitassignmentsauth0Function`), not just per-model ones. CDK
// can't infer a delete-order dependency from a plain string/Ref-to-name
// reference used inside a VTL/JS resolver, so CloudFormation can attempt to
// delete NONE_DS while a sibling nested stack still has an in-flight
// FunctionConfiguration pointing at it, causing a recurring DELETE_FAILED:
// "Data source is still in use by functions: [...]" (observed repeatedly
// Sept 2026, including on `ConnectionStack` which the model-scoped-only
// version of this fix never covered). Force every nested stack that owns
// an AppSync Resolver/FunctionConfiguration — ANY nested stack, not just
// per-model ones — to depend on NONE_DS so CloudFormation always tears
// those stacks down FIRST (reverse dependency order on delete) before
// removing NONE_DS itself.
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
    allControlPlaneResources
      .map((resource) => findOwningStack(resource))
      .filter((s): s is cdk.NestedStack => s !== null),
  );
  for (const stack of stacksOwningAppSyncFunctions) {
    stack.nestedStackResource?.addResourceDependency(noneDataSource);
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

backend.documentAnalysisHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.documentAnalysisHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects("protected/*"),
    ],
  }),
);
backend.documentAnalysisHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects(
        "private/*/documents/*",
      ),
      backend.storage.resources.bucket.arnForObjects(
        "protected/*/pending-media/*",
      ),
      backend.storage.resources.bucket.arnForObjects("protected/*/files/*"),
    ],
  }),
);
backend.documentAnalysisHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:DeleteObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects(
        "protected/*/pending-media/*",
      ),
    ],
  }),
);

const workflowLambda = backend.documentAnalysisWorkflowHandler.resources.lambda;
backend.documentAnalysisWorkflowHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.documentAnalysisWorkflowHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.documentAnalysisWorkflowHandler.addEnvironment(
  "DOCUMENT_ANALYSIS_LIMITER_TABLE",
  documentAnalysisLimiterTable.tableName,
);
backend.documentAnalysisWorkflowHandler.addEnvironment(
  "DOCUMENT_ANALYSIS_DEMO_MODE",
  process.env.DOCUMENT_ANALYSIS_DEMO_MODE === "true" ? "true" : "false",
);
documentAnalysisLimiterTable.grantReadWriteData(workflowLambda);
// Images a vision model cannot read (EMF, WMF, TIFF, BMP) are converted to PNG
// by the thumbnail Lambda, which has sharp, canvas, and the LibreOffice layer.
backend.documentAnalysisWorkflowHandler.addEnvironment(
  "DOCUMENT_THUMBNAIL_FUNCTION_NAME",
  backend.documentThumbnailHandler.resources.lambda.functionName,
);
backend.documentThumbnailHandler.resources.lambda.grantInvoke(workflowLambda);

const workflowAppSyncPolicy = new Policy(
  workflowLambda.stack,
  "DocumentAnalysisWorkflowAppSyncPolicy",
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
workflowLambda.role?.attachInlinePolicy(workflowAppSyncPolicy);
workflowLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects("public/*"),
      backend.storage.resources.bucket.arnForObjects("protected/*"),
      backend.storage.resources.bucket.arnForObjects("private/*"),
    ],
  }),
);
// Without s3:ListBucket, S3 reports a missing object as AccessDenied instead of
// NoSuchKey, which breaks the aggregate step's "page result not found" handling.
workflowLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:ListBucket"],
    resources: [backend.storage.resources.bucket.bucketArn],
  }),
);
workflowLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects(
        "private/*/documents/*/analysis/*",
      ),
      backend.storage.resources.bucket.arnForObjects(
        "private/*/documents/*/extracted-text.txt",
      ),
      backend.storage.resources.bucket.arnForObjects(
        "protected/*/pending-media/*",
      ),
    ],
  }),
);
workflowLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObjectTagging"],
    resources: [
      backend.storage.resources.bucket.arnForObjects(
        "private/*/documents/*/analysis/*",
      ),
    ],
  }),
);

const workflowInvoke = (
  id: string,
  workflowMode: string,
  fields: Record<string, unknown> = {},
) =>
  new tasks.LambdaInvoke(dataStack, id, {
    lambdaFunction: workflowLambda,
    payload: sfn.TaskInput.fromObject({
      workflowMode,
      runId: sfn.JsonPath.stringAt("$.runId"),
      documentId: sfn.JsonPath.stringAt("$.documentId"),
      fileId: sfn.JsonPath.stringAt("$.fileId"),
      identityId: sfn.JsonPath.stringAt("$.identityId"),
      s3Key: sfn.JsonPath.stringAt("$.s3Key"),
      profile: sfn.JsonPath.stringAt("$.profile"),
      executionArn: sfn.JsonPath.executionId,
      ...fields,
    }),
    payloadResponseOnly: true,
    resultPath: "$",
  });

const transientModelErrors = [
  "RateLimited",
  "ModelTimeout",
  "VerifierResponseError",
  "ProviderLimitError",
  "Lambda.ServiceException",
  "Lambda.AWSLambdaException",
  "Lambda.SdkClientException",
  "States.Timeout",
];
const prepareTask = workflowInvoke("PrepareDocumentAnalysis", "prepare").addRetry({
  errors: transientModelErrors,
  interval: cdk.Duration.seconds(2),
  backoffRate: 2,
  maxAttempts: 3,
});

// The task output replaces the state, so the key that the render step reads
// next ($.imageKey) must be echoed back through the extract step.
const extractTask = workflowInvoke("ExtractAnalysisPage", "extract", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
  imageKey: sfn.JsonPath.stringAt("$.imageKey"),
}).addRetry({
  errors: transientModelErrors,
  interval: cdk.Duration.seconds(2),
  backoffRate: 2,
  maxAttempts: 4,
});
const verifyOpenAITask = workflowInvoke("VerifyAnalysisPageWithOpenAI", "verifyOpenAI", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
}).addRetry({
  errors: transientModelErrors,
  interval: cdk.Duration.seconds(2),
  backoffRate: 2,
  maxAttempts: 3,
});
const verifyRepairedTask = workflowInvoke(
  "VerifyRepairedAnalysisPage",
  "verifyOpenAI",
  {
    page: sfn.JsonPath.numberAt("$.page"),
    inputKey: sfn.JsonPath.stringAt("$.inputKey"),
    resultKey: sfn.JsonPath.stringAt("$.resultKey"),
  },
).addRetry({
  errors: transientModelErrors,
  interval: cdk.Duration.seconds(2),
  backoffRate: 2,
  maxAttempts: 3,
});
const repairTask = workflowInvoke("RepairAnalysisPage", "repair", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
}).addRetry({
  errors: transientModelErrors,
  interval: cdk.Duration.seconds(2),
  backoffRate: 2,
  maxAttempts: 3,
});
const writePageResultTask = workflowInvoke("WriteAnalysisPageResult", "writeResult", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
});
const repairChoice = new sfn.Choice(dataStack, "PageNeedsRepair")
  .when(
    sfn.Condition.and(
      sfn.Condition.booleanEquals("$.needsRepair", true),
      sfn.Condition.booleanEquals("$.repaired", false),
    ),
    repairTask.next(verifyRepairedTask.next(writePageResultTask)),
  )
  .otherwise(writePageResultTask);
verifyOpenAITask.next(repairChoice);
const verificationChoice = new sfn.Choice(dataStack, "AnthropicVerifierAvailable")
  .when(sfn.Condition.booleanEquals("$.available", false), verifyOpenAITask)
  .otherwise(repairChoice);
const verifyAnthropicTask = workflowInvoke("VerifyAnalysisPageWithAnthropic", "verify", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
})
  .addRetry({
    errors: transientModelErrors,
    interval: cdk.Duration.seconds(2),
    backoffRate: 2,
    maxAttempts: 3,
  })
  .addCatch(verifyOpenAITask, {
    errors: ["States.ALL"],
    resultPath: "$.verificationError",
  })
  .next(verificationChoice);

const renderPageTask = new tasks.LambdaInvoke(dataStack, "RenderSparseAnalysisPage", {
  lambdaFunction: backend.documentThumbnailHandler.resources.lambda,
  payload: sfn.TaskInput.fromObject({
    workflowMode: "renderPage",
    s3Key: sfn.JsonPath.stringAt("$.s3Key"),
    pageNumber: sfn.JsonPath.numberAt("$.page"),
    outputKey: sfn.JsonPath.stringAt("$.imageKey"),
    runId: sfn.JsonPath.stringAt("$.runId"),
  }),
  payloadResponseOnly: true,
  resultPath: "$.rendered",
});
const visionTask = workflowInvoke("AnalyzeSparsePageVision", "vision", {
  page: sfn.JsonPath.numberAt("$.page"),
  inputKey: sfn.JsonPath.stringAt("$.inputKey"),
  resultKey: sfn.JsonPath.stringAt("$.resultKey"),
  imageKey: sfn.JsonPath.stringAt("$.rendered.imageKey"),
});
const sparseTextChoice = new sfn.Choice(dataStack, "PageTextIsSparse")
  .when(
    sfn.Condition.booleanEquals("$.needsVision", true),
    renderPageTask.next(visionTask).next(verifyAnthropicTask),
  )
  .otherwise(verifyAnthropicTask);

// ResultWriterV2 is only honoured when this feature flag is on, and a stack
// that already has children cannot take new context, so the map lives in its
// own scope.
const documentPagesScope = new Construct(dataStack, "DocumentPagesScope");
documentPagesScope.node.setContext(
  "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2",
  true,
);
const documentPages = new sfn.DistributedMap(documentPagesScope, "DocumentPages", {
  // Pages per document. The shared provider limiter caps real model load.
  maxConcurrency: 10,
  itemReader: new sfn.S3JsonItemReader({
    bucket: backend.storage.resources.bucket,
    key: sfn.JsonPath.stringAt("$.manifestKey"),
  }),
  itemSelector: {
    "runId.$": "$.runId",
    "documentId.$": "$.documentId",
    "fileId.$": "$.fileId",
    "identityId.$": "$.identityId",
    "s3Key.$": "$.s3Key",
    "profile.$": "$.profile",
    "executionArn.$": "$$.Execution.Id",
    "page.$": "$$.Map.Item.Value.page",
    "inputKey.$": "$$.Map.Item.Value.inputKey",
    "resultKey.$": "$$.Map.Item.Value.resultKey",
    "imageKey.$": "$$.Map.Item.Value.imageKey",
  },
  resultWriterV2: new sfn.ResultWriterV2({
    bucket: backend.storage.resources.bucket,
    prefix: "document-analysis-map-output",
  }),
  toleratedFailurePercentage: 100,
});
documentPages.itemProcessor(extractTask.next(sparseTextChoice), {
  mode: sfn.ProcessorMode.DISTRIBUTED,
  executionType: sfn.ProcessorType.STANDARD,
});

const progressWait = new sfn.Wait(dataStack, "WaitForPageProgress", {
  time: sfn.WaitTime.duration(cdk.Duration.seconds(15)),
});
const progressTask = workflowInvoke("ReportDocumentAnalysisProgress", "progress", {
  totalPages: sfn.JsonPath.numberAt("$.totalPages"),
});
const progressDone = new sfn.Pass(dataStack, "ProgressPollingComplete");
const progressChoice = new sfn.Choice(dataStack, "PageMapHasFinished")
  .when(sfn.Condition.booleanEquals("$.mapDone", false), progressWait)
  .otherwise(progressDone);
const progressPoller = progressWait.next(progressTask).next(progressChoice);
const mapAndProgress = new sfn.Parallel(dataStack, "MapPagesAndReportProgress", {
  resultPath: "$.parallelResults",
})
  .branch(documentPages)
  .branch(progressPoller);

const aggregateTask = workflowInvoke("AggregateDocumentAnalysis", "aggregate", {
  manifestKey: sfn.JsonPath.stringAt("$.manifestKey"),
  directContentKey: sfn.JsonPath.stringAt("$.directContentKey"),
  pendingMediaKey: sfn.JsonPath.stringAt("$.pendingMediaKey"),
  baseKey: sfn.JsonPath.stringAt("$.baseKey"),
  totalPages: sfn.JsonPath.numberAt("$.totalPages"),
});
const moderateTask = workflowInvoke("ModerateDocumentAnalysis", "moderate", {
  aggregateKey: sfn.JsonPath.stringAt("$.aggregateKey"),
  // The Lambda echoes its payload as the next state, so finalize needs this here.
  pendingMediaKey: sfn.JsonPath.stringAt("$.pendingMediaKey"),
});
const finalizeTask = workflowInvoke("FinalizeDocumentAnalysis", "finalize", {
  aggregateKey: sfn.JsonPath.stringAt("$.aggregateKey"),
  pendingMediaKey: sfn.JsonPath.stringAt("$.pendingMediaKey"),
});
const embedTask = new tasks.LambdaInvoke(dataStack, "EmbedParsedDocument", {
  lambdaFunction: backend.embeddingsHandler.resources.lambda,
  payload: sfn.TaskInput.fromObject({
    workflowMode: "generateEmbeddingsForAnalysis",
    fileID: sfn.JsonPath.stringAt("$.fileId"),
  }),
  payloadResponseOnly: true,
  resultPath: "$.embeddingResult",
}).addRetry({
  errors: [
    "Lambda.ServiceException",
    "Lambda.AWSLambdaException",
    "Lambda.SdkClientException",
    "States.TaskFailed",
    "States.Timeout",
  ],
  interval: cdk.Duration.seconds(5),
  backoffRate: 2,
  maxAttempts: 2,
});
const completeTask = workflowInvoke("CompleteDocumentAnalysis", "complete", {
  aggregateKey: sfn.JsonPath.stringAt("$.aggregateKey"),
});
const analysisPipeline = prepareTask
  .next(mapAndProgress)
  .next(aggregateTask)
  .next(moderateTask)
  .next(finalizeTask)
  .next(embedTask)
  .next(completeTask);
const markWorkflowFailedTask = workflowInvoke("MarkDocumentAnalysisFailed", "markFailed", {
  error: sfn.JsonPath.objectAt("$.workflowError"),
});
const workflowDefinition = new sfn.Parallel(dataStack, "DocumentAnalysisWorkflow")
  .branch(analysisPipeline)
  .addCatch(markWorkflowFailedTask.next(
    new sfn.Fail(dataStack, "DocumentAnalysisFailed", {
      error: "DocumentAnalysisFailed",
      cause: "The document analysis workflow failed",
    }),
  ), {
    errors: ["States.ALL"],
    resultPath: "$.workflowError",
  });

const workflowLogGroup = new logs.LogGroup(dataStack, "DocumentAnalysisWorkflowLogs", {
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
// A static name lets IAM policies on the workflow Lambda build execution ARNs
// without referencing the state machine resource, which would create a
// Lambda -> role policy -> state machine -> Lambda dependency cycle.
const documentAnalysisStateMachineName = `DocAnalysis-${cdk.Names.uniqueResourceName(
  dataStack,
  { maxLength: 60, separator: "-" },
)}`;
const documentAnalysisStateMachine = new sfn.StateMachine(
  dataStack,
  "DocumentAnalysisStateMachine",
  {
    stateMachineName: documentAnalysisStateMachineName,
    definitionBody: sfn.DefinitionBody.fromChainable(workflowDefinition),
    stateMachineType: sfn.StateMachineType.STANDARD,
    logs: {
      destination: workflowLogGroup,
      level: sfn.LogLevel.ERROR,
      includeExecutionData: false,
    },
    tracingEnabled: true,
  },
);
backend.documentAnalysisHandler.addEnvironment(
  "DOCUMENT_ANALYSIS_WORKFLOW_ARN",
  documentAnalysisStateMachine.stateMachineArn,
);
documentAnalysisStateMachine.grantStartExecution(
  backend.documentAnalysisHandler.resources.lambda,
);
// Step Functions ARNs separate the resource type with a colon
// (arn:...:execution:NAME:RUN_ID), unlike formatArn's default slash form.
const stepFunctionsArn = (
  resource: "execution" | "mapRun",
  resourceName: string,
) =>
  dataStack.formatArn({
    service: "states",
    resource,
    resourceName,
    arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
  });
backend.documentAnalysisHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["states:StopExecution"],
    resources: [
      stepFunctionsArn("execution", `${documentAnalysisStateMachineName}:*`),
    ],
  }),
);
workflowLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["states:ListMapRuns", "states:DescribeMapRun"],
    resources: [
      stepFunctionsArn("execution", `${documentAnalysisStateMachineName}:*`),
      stepFunctionsArn("mapRun", `${documentAnalysisStateMachineName}/*`),
    ],
  }),
);

const verifierParameterName = process.env.ANTHROPIC_API_KEY_PARAMETER;
if (verifierParameterName) {
  const parameterArn = verifierParameterName.startsWith("arn:")
    ? verifierParameterName
    : dataStack.formatArn({
        service: "ssm",
        resource: "parameter",
        resourceName: verifierParameterName.replace(/^\/+/, ""),
      });
  workflowLambda.addToRolePolicy(
    new PolicyStatement({
      actions: ["ssm:GetParameter"],
      resources: [parameterArn],
    }),
  );
}
const verifierKmsKeyArn = process.env.ANTHROPIC_API_KEY_KMS_KEY_ARN;
if (verifierParameterName && verifierKmsKeyArn) {
  workflowLambda.addToRolePolicy(
    new PolicyStatement({
      actions: ["kms:Decrypt"],
      resources: [verifierKmsKeyArn],
    }),
  );
}

new Alarm(dataStack, "DocumentAnalysisWorkflowFailures", {
  metric: documentAnalysisStateMachine.metricFailed({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 0,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

// Lambda creates its log group lazily on first invoke, so the metric filter
// would fail with "log group does not exist" on a fresh deploy. Create it here.
const workflowLambdaLogGroup = new logs.LogGroup(
  dataStack,
  "DocumentAnalysisWorkflowLambdaLogGroup",
  {
    logGroupName: `/aws/lambda/${workflowLambda.functionName}`,
    retention: logs.RetentionDays.ONE_MONTH,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  },
);
const modelRateLimitMetric = new logs.MetricFilter(
  dataStack,
  "DocumentAnalysisModelRateLimits",
  {
    logGroup: workflowLambdaLogGroup,
    filterPattern: logs.FilterPattern.literal("MODEL_RATE_LIMITED"),
    metricNamespace: "DocumentAnalysis/Workflow",
    metricName: "ModelRateLimited",
    metricValue: "1",
    defaultValue: 0,
  },
).metric({
  period: cdk.Duration.minutes(5),
  statistic: "Sum",
});

new Alarm(dataStack, "DocumentAnalysisWorkflowLambdaErrors", {
  metric: workflowLambda.metricErrors({ period: cdk.Duration.minutes(5) }),
  threshold: 0,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

new Alarm(dataStack, "DocumentAnalysisWorkflowLambdaThrottles", {
  metric: workflowLambda.metricThrottles({ period: cdk.Duration.minutes(5) }),
  threshold: 0,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

new Alarm(dataStack, "DocumentAnalysisWorkflowLambdaDuration", {
  metric: workflowLambda.metricDuration({
    period: cdk.Duration.minutes(5),
    statistic: "Maximum",
  }),
  threshold: cdk.Duration.minutes(12).toMilliseconds(),
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

new Alarm(dataStack, "DocumentAnalysisWorkflowModelRateLimits", {
  metric: modelRateLimitMetric,
  threshold: 0,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
});

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

backend.openaiHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.openaiHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects("public/audio/*"),
      backend.storage.resources.bucket.arnForObjects("public/images/*"),
    ],
  }),
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

// Stack-qualified so sandbox and branch deployments never collide on the same
// SSM parameter names. `dataStack` is a NestedStack, whose `stackName` is an
// unresolved deploy-time token (CloudFormation assigns nested stack physical
// names at deploy time) — walk up to the root (non-nested) stack instead,
// whose name is a literal string known at synth time.
function getRootStackName(stack: cdk.Stack): string {
  let current: cdk.Stack = stack;
  while (cdk.NestedStack.isNestedStack(current) && current.nestedStackParent) {
    current = current.nestedStackParent;
  }
  return current.stackName;
}
const cfSsmPrefix = `/homework-supply/${getRootStackName(dataStack)}/cloudfront`;

const cfKeyRotation = new CfKeyRotationConstruct(dataStack, "CfKeyRotation", {
  ssmPrefix: cfSsmPrefix,
});

// ==========================================================================
// MediaCDN — CloudFront distribution in front of S3 with OAC
// ==========================================================================

const mediaCDN = new MediaCDNConstruct(dataStack, "MediaCDN", {
  bucket: backend.storage.resources.bucket,
  cfPublicKeyPem: cfKeyRotation.publicKeyPem,
  ssmPrefix: cfSsmPrefix,
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
      // Lets server-side Next.js routes (not CDK-managed Lambdas) resolve the
      // same stack-qualified SSM path this environment's signing keys live under.
      ssmPrefix: cfSsmPrefix,
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
backend.sectionHandler.addEnvironment("CF_SSM_PREFIX", cfSsmPrefix);

// Grant sectionHandler SSM read so it can fetch the CF private key and key pair ID at runtime
const sectionHandlerSSMPolicy = new Policy(
  backend.sectionHandler.resources.lambda.stack,
  "SectionHandlerSSMPolicy",
  {
    statements: [
      new PolicyStatement({
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${dataStack.region}:${dataStack.account}:parameter${cfSsmPrefix}/*`,
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
cfnBucket.addPropertyOverride("LifecycleConfiguration.Rules", [
  {
    Id: "DocumentAnalysisMapArtifactsExpiry",
    Status: "Enabled",
    Prefix: "document-analysis-map-output/",
    ExpirationInDays: 14,
  },
  {
    Id: "DocumentAnalysisTemporaryArtifactsExpiry",
    Status: "Enabled",
    TagFilters: [{ Key: "analysis-run", Value: "true" }],
    ExpirationInDays: 14,
  },
]);

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

// Page renders and converted images for document analysis are tagged so the
// lifecycle rule expires them; tagging needs its own permission.
backend.documentThumbnailHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObjectTagging"],
    resources: [
      backend.storage.resources.bucket.arnForObjects(
        "private/*/documents/*/analysis/*",
      ),
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

  // Batches that exhaust retryAttempts land here instead of silently vanishing —
  // the handler now rethrows every non-permanent failure (was previously swallowed).
  const leaderboardStreamDlq = new Queue(
    leaderboardStreamLambda.stack,
    "LeaderboardStreamDlq",
    { retentionPeriod: cdk.Duration.days(14) },
  );

  leaderboardStreamLambda.addEventSource(
    new DynamoEventSource(studentXPLogTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 25,
      maxBatchingWindow: cdk.Duration.seconds(10), // Wait up to 10s to batch records
      retryAttempts: 3,
      bisectBatchOnError: true,
      onFailure: new SqsDlq(leaderboardStreamDlq),
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
// Grade Rollup Stream Handler — DynamoDB Stream on Grade
// ==========================================================================

backend.gradeRollupStreamHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);

const gradeRollupStreamAppSyncPolicy = new Policy(
  backend.gradeRollupStreamHandler.resources.lambda.stack,
  "GradeRollupStreamAppSyncPolicy",
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
backend.gradeRollupStreamHandler.resources.lambda.role?.attachInlinePolicy(
  gradeRollupStreamAppSyncPolicy,
);

// Recycle bin: calls the data API with its own role and writes permanent-delete
// archives to the storage bucket under private/archives/.
backend.recycleBinHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
backend.recycleBinHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
const recycleBinAppSyncPolicy = new Policy(
  backend.recycleBinHandler.resources.lambda.stack,
  "RecycleBinAppSyncPolicy",
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
backend.recycleBinHandler.resources.lambda.role?.attachInlinePolicy(
  recycleBinAppSyncPolicy,
);
backend.recycleBinHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:PutObject", "s3:GetObject"],
    resources: [
      backend.storage.resources.bucket.arnForObjects("private/archives/*"),
    ],
  }),
);
backend.recycleBinHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:ListBucket"],
    resources: [backend.storage.resources.bucket.bucketArn],
    conditions: { StringLike: { "s3:prefix": ["private/archives/*"] } },
  }),
);

// Connect DynamoDB Stream from Grade to the rollup stream handler (Grade is a
// foundational model present in every bootstrap phase, so no existence guard needed).
const gradeTable = backend.data.resources.tables["Grade"];
if (gradeTable) {
  const gradeRollupStreamLambda =
    backend.gradeRollupStreamHandler.resources.lambda;

  // Batches that exhaust retryAttempts land here instead of silently vanishing —
  // the handler rethrows every non-permanent failure, so this is where to look
  // when a student's grade stopped showing up in the rollup.
  const gradeRollupDlq = new Queue(
    gradeRollupStreamLambda.stack,
    "GradeRollupStreamDlq",
    { retentionPeriod: cdk.Duration.days(14) },
  );

  gradeRollupStreamLambda.addEventSource(
    new DynamoEventSource(gradeTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 25,
      maxBatchingWindow: cdk.Duration.seconds(10),
      retryAttempts: 3,
      bisectBatchOnError: true,
      onFailure: new SqsDlq(gradeRollupDlq),
      filters: [
        lambda.FilterCriteria.filter({
          eventName: lambda.FilterRule.isEqual("INSERT"),
        }),
      ],
    }),
  );

  gradeTable.grantStreamRead(gradeRollupStreamLambda);
}

// ==========================================================================
// Peer Review AI Handler — IAM + env config
// ==========================================================================

backend.peerReviewAIHandler.addEnvironment(
  "API_ENDPOINT",
  backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
);
// Reads published unit content (protected/units/{unitId}/published.json) for @kai context
backend.peerReviewAIHandler.addEnvironment(
  "STORAGE_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.peerReviewAIHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`],
  }),
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
// No explicit streamName — stream names are unique per AWS account+region, so a
// hardcoded name collides between the personal sandbox stack and the branch/
// pipeline stack. CDK auto-generates a unique name; consumers read the actual
// name from the AnalyticsStream custom output below (amplify_outputs.json).
const analyticsStream = new Stream(dataStack, "AnalyticsStream", {
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
