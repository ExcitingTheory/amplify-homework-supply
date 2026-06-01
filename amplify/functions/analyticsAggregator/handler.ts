/**
 * Analytics Aggregator Handler
 *
 * Consumes Kinesis records (engagement events + Web Vitals),
 * aggregates them by scope (platform, section, unit, squad, page, geo),
 * and upserts AnalyticsSummary records via the AppSync GraphQL API.
 */

import type { KinesisStreamEvent } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { env } from "$amplify/env/analyticsAggregator";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.API_ENDPOINT,
        defaultAuthMode: "iam",
        region: process.env.AWS_REGION,
      },
    },
  },
  { ssr: false },
);

const client = generateClient();

// ============================================================================
// Types
// ============================================================================

interface EnrichedEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  userRole?: string;
  sectionId?: string;
  squadId?: string;
  unitId?: string;
  path?: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
  geo?: {
    country: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

interface WebVitalEvent {
  type: "web-vital";
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  path: string;
  timestamp: string;
  geo?: {
    country: string;
    region?: string;
    city?: string;
  };
}

interface ScopeAccumulator {
  dailyActiveUsers: Set<string>;
  totalPageViews: number;
  totalSessions: Set<string>;
  totalEngagedTimeMs: number;
  gradesSubmitted: number;
  workbooksStarted: number;
  workbooksCompleted: number;
  studentChatMessagesSent: number;
  instructorChatMessagesSent: number;
  documentsAnalyzed: number;
  accuracySum: number;
  accuracyCount: number;
  // Web Vitals arrays for p75 calculation
  lcpValues: number[];
  inpValues: number[];
  ttfbValues: number[];
  fcpValues: number[];
  clsValues: number[];
}

// ============================================================================
// Handler
// ============================================================================

export const handler = async (event: KinesisStreamEvent): Promise<void> => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Decode Kinesis records
  const records: (EnrichedEvent | WebVitalEvent)[] = [];
  for (const record of event.Records) {
    try {
      const payload = Buffer.from(record.kinesis.data, "base64").toString(
        "utf-8",
      );
      records.push(JSON.parse(payload));
    } catch {
      // Skip malformed records
    }
  }

  // Separate engagement events from web vitals
  const engagementEvents: EnrichedEvent[] = [];
  const vitalEvents: WebVitalEvent[] = [];

  for (const record of records) {
    if ("type" in record && record.type === "web-vital") {
      vitalEvents.push(record as WebVitalEvent);
    } else {
      engagementEvents.push(record as EnrichedEvent);
    }
  }

  // Accumulate by scope
  const scopes = new Map<string, ScopeAccumulator>();

  function getScope(scope: string, scopeId: string): ScopeAccumulator {
    const key = `${scope}#${scopeId}`;
    if (!scopes.has(key)) {
      scopes.set(key, {
        dailyActiveUsers: new Set(),
        totalPageViews: 0,
        totalSessions: new Set(),
        totalEngagedTimeMs: 0,
        gradesSubmitted: 0,
        workbooksStarted: 0,
        workbooksCompleted: 0,
        studentChatMessagesSent: 0,
        instructorChatMessagesSent: 0,
        documentsAnalyzed: 0,
        accuracySum: 0,
        accuracyCount: 0,
        lcpValues: [],
        inpValues: [],
        ttfbValues: [],
        fcpValues: [],
        clsValues: [],
      });
    }
    return scopes.get(key)!;
  }

  // Process engagement events
  for (const evt of engagementEvents) {
    // Always accumulate to platform scope
    const platform = getScope("platform", "all");
    if (evt.userId) platform.dailyActiveUsers.add(evt.userId);
    if (evt.sessionId) platform.totalSessions.add(evt.sessionId);

    // Section scope
    const sectionId = evt.sectionId || evt.attributes?.sectionId;
    if (sectionId) {
      const section = getScope("section", sectionId);
      if (evt.userId) section.dailyActiveUsers.add(evt.userId);
      if (evt.sessionId) section.totalSessions.add(evt.sessionId);
      processEvent(evt, section);
    }

    // Unit scope
    const unitId = evt.unitId || evt.attributes?.unitId;
    if (unitId) {
      const unit = getScope("unit", unitId);
      processEvent(evt, unit);
    }

    // Squad scope
    const squadId = evt.squadId || evt.attributes?.squadId;
    if (squadId) {
      const squad = getScope("squad", squadId);
      processEvent(evt, squad);
    }

    // Geo scope
    if (evt.geo?.country && evt.geo.country !== "unknown") {
      const geo = getScope("geo", evt.geo.country);
      if (evt.userId) geo.dailyActiveUsers.add(evt.userId);
      processEvent(evt, geo);
    }

    processEvent(evt, platform);
  }

  // Process web vitals
  for (const vital of vitalEvents) {
    // Page scope
    const page = getScope("page", vital.path);
    addVital(vital, page);

    // Platform perf
    const platform = getScope("platform", "all");
    addVital(vital, platform);

    // Geo perf
    if (vital.geo?.country && vital.geo.country !== "unknown") {
      const geo = getScope("geo", vital.geo.country);
      addVital(vital, geo);
    }
  }

  // Write aggregated records to DynamoDB via GraphQL
  const mutations: Promise<unknown>[] = [];
  for (const [key, acc] of scopes.entries()) {
    const [scope, scopeId] = key.split("#");
    mutations.push(upsertSummary(today, scope, scopeId, acc));
  }

  await Promise.allSettled(mutations);
};

// ============================================================================
// Helpers
// ============================================================================

function processEvent(evt: EnrichedEvent, acc: ScopeAccumulator): void {
  switch (evt.name) {
    case "pageView":
      acc.totalPageViews++;
      break;
    case "engagedTimeUpdate":
      acc.totalEngagedTimeMs += evt.metrics?.engagedTimeMs || 0;
      break;
    case "gradeSubmitted":
      acc.gradesSubmitted++;
      if (evt.metrics?.accuracy != null) {
        acc.accuracySum += evt.metrics.accuracy;
        acc.accuracyCount++;
      }
      break;
    case "workbookStarted":
    case "sectionWorkbookStarted":
      acc.workbooksStarted++;
      break;
    case "workbookCompleted":
      acc.workbooksCompleted++;
      if (evt.metrics?.accuracy != null) {
        acc.accuracySum += evt.metrics.accuracy;
        acc.accuracyCount++;
      }
      break;
    case "chatMessageSent": {
      const role = evt.userRole || evt.attributes?.role;
      if (role === "Instructor" || role === "Admin") {
        acc.instructorChatMessagesSent++;
      } else {
        acc.studentChatMessagesSent++;
      }
      break;
    }
    case "documentAnalyzed":
      acc.documentsAnalyzed++;
      break;
  }
}

function addVital(vital: WebVitalEvent, acc: ScopeAccumulator): void {
  switch (vital.name) {
    case "LCP":
      acc.lcpValues.push(vital.value);
      break;
    case "INP":
      acc.inpValues.push(vital.value);
      break;
    case "TTFB":
      acc.ttfbValues.push(vital.value);
      break;
    case "FCP":
      acc.fcpValues.push(vital.value);
      break;
    case "CLS":
      acc.clsValues.push(vital.value);
      break;
  }
}

function p75(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.75) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}

async function upsertSummary(
  date: string,
  scope: string,
  scopeId: string,
  acc: ScopeAccumulator,
): Promise<void> {
  const input: Record<string, unknown> = {
    date,
    scope,
    scopeId,
    dailyActiveUsers: acc.dailyActiveUsers.size,
    totalPageViews: acc.totalPageViews,
    totalSessions: acc.totalSessions.size,
    totalEngagedTimeMs: acc.totalEngagedTimeMs,
    avgEngagedTimeMs:
      acc.dailyActiveUsers.size > 0
        ? Math.round(acc.totalEngagedTimeMs / acc.dailyActiveUsers.size)
        : undefined,
    gradesSubmitted: acc.gradesSubmitted,
    avgAccuracy:
      acc.accuracyCount > 0
        ? Math.round((acc.accuracySum / acc.accuracyCount) * 100) / 100
        : undefined,
    workbooksStarted: acc.workbooksStarted,
    workbooksCompleted: acc.workbooksCompleted,
    studentChatMessagesSent: acc.studentChatMessagesSent,
    instructorChatMessagesSent: acc.instructorChatMessagesSent,
    documentsAnalyzed: acc.documentsAnalyzed,
  };

  // Add perf metrics if we have samples
  const perfSamples =
    acc.lcpValues.length +
    acc.inpValues.length +
    acc.ttfbValues.length +
    acc.fcpValues.length +
    acc.clsValues.length;

  if (perfSamples > 0) {
    input.p75LCP = p75(acc.lcpValues);
    input.p75INP = p75(acc.inpValues);
    input.p75TTFB = p75(acc.ttfbValues);
    input.p75FCP = p75(acc.fcpValues);
    input.p75CLS =
      acc.clsValues.length > 0
        ? Math.round(p75(acc.clsValues)! * 1000) / 1000
        : undefined;
    input.perfSampleCount = perfSamples;
  }

  // Set parent references based on scope
  if (scope === "section") input.sectionId = scopeId;
  if (scope === "unit") input.unitId = scopeId;
  if (scope === "squad") input.squadId = scopeId;
  if (scope === "geo") {
    const parts = scopeId.split("/");
    input.country = parts[0];
    if (parts[1]) input.region = parts[1];
  }

  // Use create mutation — the aggregator creates a new record per batch window.
  // The frontend queries by date + scope for daily rollups.
  try {
    await client.graphql({
      query: CREATE_ANALYTICS_SUMMARY,
      variables: { input },
    });
  } catch (err) {
    console.error(
      `[AnalyticsAggregator] Failed to write ${scope}/${scopeId}:`,
      err,
    );
  }
}

// ============================================================================
// GraphQL
// ============================================================================

const CREATE_ANALYTICS_SUMMARY = /* GraphQL */ `
  mutation CreateAnalyticsSummary($input: CreateAnalyticsSummaryInput!) {
    createAnalyticsSummary(input: $input) {
      id
      date
      scope
      scopeId
    }
  }
`;
