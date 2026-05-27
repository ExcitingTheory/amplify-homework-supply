import { defineFunction } from "@aws-amplify/backend";

/**
 * Analytics Aggregator Lambda
 *
 * Triggered by Kinesis stream (homework-supply-analytics) in 5-minute batch windows.
 * Processes engagement events and Web Vitals, then writes aggregated records
 * to the AnalyticsSummary DynamoDB table via GraphQL mutations.
 *
 * Scope levels:
 * - platform: site-wide rollup
 * - section: per-class metrics
 * - unit: per-workbook metrics
 * - squad: per-squad metrics
 * - page: per-route Web Vitals
 * - geo: per-country/region metrics
 */
export const analyticsAggregatorHandler = defineFunction({
  timeoutSeconds: 300, // 5 min — processes up to 5 min of batched events
  memoryMB: 512,
  resourceGroupName: "data",
  environment: {
    API_ENDPOINT: "",
  },
});
