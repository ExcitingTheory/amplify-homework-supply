/**
 * CloudFormation Custom Resource handler that enables DynamoDB versioning and
 * applies syncConfig to AppSync resolvers with exponential backoff + jitter.
 */
import {
  AppSyncClient,
  ListResolversCommand,
  UpdateResolverCommand,
  ListDataSourcesCommand,
  UpdateDataSourceCommand,
} from "@aws-sdk/client-appsync";
import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse,
} from "aws-lambda";

const client = new AppSyncClient({});

const BATCH_SIZE = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;
const MAX_RETRIES = 8;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredDelay(attempt: number): number {
  const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  return exponential * (0.5 + Math.random() * 0.5);
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 429 && attempt < MAX_RETRIES) {
        const delay = jitteredDelay(attempt);
        console.log(
          `[${label}] 429 — retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`,
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`${label}: exhausted retries`);
}

interface DynamoDataSource {
  name: string;
  description?: string;
  serviceRoleArn?: string;
  tableName?: string;
  region?: string;
  useCallerCredentials?: boolean;
  versioned?: boolean;
}

async function getDynamoDataSources(
  apiId: string,
): Promise<DynamoDataSource[]> {
  const sources: DynamoDataSource[] = [];
  let nextToken: string | undefined;
  do {
    const resp = await retryWithBackoff(
      () =>
        client.send(
          new ListDataSourcesCommand({ apiId, nextToken, maxResults: 25 }),
        ),
      "listDataSources",
    );
    for (const ds of resp.dataSources ?? []) {
      if (ds.type === "AMAZON_DYNAMODB" && ds.name) {
        sources.push({
          name: ds.name,
          description: ds.description,
          serviceRoleArn: ds.serviceRoleArn,
          tableName: ds.dynamodbConfig?.tableName,
          region: ds.dynamodbConfig?.awsRegion,
          useCallerCredentials: ds.dynamodbConfig?.useCallerCredentials,
          versioned: ds.dynamodbConfig?.versioned,
        });
      }
    }
    nextToken = resp.nextToken;
  } while (nextToken);
  return sources;
}

async function enableVersioning(
  apiId: string,
  sources: DynamoDataSource[],
): Promise<number> {
  const unversioned = sources.filter((s) => !s.versioned);
  console.log(
    `${unversioned.length}/${sources.length} data sources need versioning`,
  );

  let enabled = 0;
  for (const ds of unversioned) {
    await retryWithBackoff(
      () =>
        client.send(
          new UpdateDataSourceCommand({
            apiId,
            name: ds.name,
            type: "AMAZON_DYNAMODB",
            description: ds.description,
            serviceRoleArn: ds.serviceRoleArn,
            dynamodbConfig: {
              tableName: ds.tableName!,
              awsRegion: ds.region!,
              useCallerCredentials: ds.useCallerCredentials,
              versioned: true,
            },
          }),
        ),
      `versionDS(${ds.name})`,
    );
    enabled++;
    await sleep(BASE_DELAY_MS + Math.random() * BASE_DELAY_MS);
  }
  return enabled;
}

interface ResolverTarget {
  typeName: string;
  fieldName: string;
  dataSourceName: string;
  requestMappingTemplate?: string;
  responseMappingTemplate?: string;
  kind?: string;
  code?: string;
  runtime?: { name?: string };
}

async function getResolversNeedingSyncConfig(
  apiId: string,
  dynamoSources: Set<string>,
): Promise<ResolverTarget[]> {
  const targets: ResolverTarget[] = [];

  for (const typeName of ["Mutation", "Query"]) {
    let nextToken: string | undefined;
    do {
      const resp = await retryWithBackoff(
        () =>
          client.send(
            new ListResolversCommand({
              apiId,
              typeName,
              nextToken,
              maxResults: 25,
            }),
          ),
        `listResolvers(${typeName})`,
      );
      for (const r of resp.resolvers ?? []) {
        if (
          r.dataSourceName &&
          dynamoSources.has(r.dataSourceName) &&
          r.kind !== "PIPELINE" &&
          !r.code &&
          !r.runtime?.name &&
          !r.syncConfig
        ) {
          targets.push({
            typeName: r.typeName!,
            fieldName: r.fieldName!,
            dataSourceName: r.dataSourceName,
            requestMappingTemplate: r.requestMappingTemplate,
            responseMappingTemplate: r.responseMappingTemplate,
            kind: r.kind,
          });
        }
      }
      nextToken = resp.nextToken;
    } while (nextToken);
  }
  return targets;
}

async function applySyncConfig(
  apiId: string,
): Promise<{ versioned: number; resolvers: number }> {
  const dynamoSources = await getDynamoDataSources(apiId);
  console.log(`Found ${dynamoSources.length} DynamoDB data sources`);

  // Step 1: Enable versioning on all DynamoDB data sources
  const versioned = await enableVersioning(apiId, dynamoSources);
  console.log(`Enabled versioning on ${versioned} data sources`);

  // Step 2: Apply syncConfig to DynamoDB-backed resolvers
  const sourceNames = new Set(dynamoSources.map((s) => s.name));
  const resolvers = await getResolversNeedingSyncConfig(apiId, sourceNames);
  console.log(`Found ${resolvers.length} resolvers needing syncConfig`);

  let applied = 0;
  for (let i = 0; i < resolvers.length; i += BATCH_SIZE) {
    const batch = resolvers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((r) =>
        retryWithBackoff(
          () =>
            client.send(
              new UpdateResolverCommand({
                apiId,
                typeName: r.typeName,
                fieldName: r.fieldName,
                dataSourceName: r.dataSourceName,
                requestMappingTemplate: r.requestMappingTemplate,
                responseMappingTemplate: r.responseMappingTemplate,
                kind: r.kind as "UNIT" | "PIPELINE" | undefined,
                syncConfig: {
                  conflictDetection: "VERSION",
                  conflictHandler: "AUTOMERGE",
                },
              }),
            ),
          `update(${r.typeName}.${r.fieldName})`,
        ),
      ),
    );

    applied += batch.length;
    console.log(`Applied syncConfig: ${applied}/${resolvers.length}`);

    if (i + BATCH_SIZE < resolvers.length) {
      await sleep(BASE_DELAY_MS + Math.random() * BASE_DELAY_MS);
    }
  }
  return { versioned, resolvers: applied };
}

export async function handler(
  event: CloudFormationCustomResourceEvent,
): Promise<CloudFormationCustomResourceResponse> {
  const apiId = event.ResourceProperties.ApiId;
  console.log(`Event: ${event.RequestType}, ApiId: ${apiId}`);

  const physicalResourceId = `appsync-sync-config-${apiId}`;

  if (event.RequestType === "Delete") {
    return {
      Status: "SUCCESS",
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    };
  }

  try {
    const result = await applySyncConfig(apiId);
    return {
      Status: "SUCCESS",
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: {
        DataSourcesVersioned: result.versioned,
        ResolversConfigured: result.resolvers,
      },
    };
  } catch (err) {
    console.error("Failed to apply syncConfig:", err);
    return {
      Status: "FAILED",
      Reason: String(err),
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    };
  }
}
