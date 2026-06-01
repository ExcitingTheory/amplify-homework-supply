# Analytics Implementation Plan

> Pinpoint was never deployed. This is a greenfield implementation using **Kinesis + Lambda + DynamoDB** for analytics with **Web Vitals** for performance monitoring.

---

## What We're Building

- **Engagement analytics**: segmented by section, unit, squad, workbook vs review
- **Chat analytics**: student vs instructor message counts
- **Geolocation segmentation**: country/region/city from CloudFront headers (free)
- **Performance monitoring**: Web Vitals (LCP, INP, CLS, TTFB, FCP) per page, section, and platform
- **Rankings**: most/least engaged sections, squads, units
- **Page analytics**: views, dwell time, bounce rate per route

---

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────────────────┐
│  Browser    │     │  Kinesis Stream  │     │  Aggregator Lambda               │
│             │     │                  │     │  (5-min batch window)            │
│ • events    │────▶│  • engagement    │────▶│                                  │
│ • vitals    │     │  • web vitals    │     │  Computes per scope:             │
│             │     │  • page views    │     │  • platform (site-wide)          │
└─────────────┘     │  • geo metadata  │     │  • section (per class)           │
                    └─────────────────┘     │  • unit (per workbook)           │
                                            │  • squad (per group)             │
                                            │  • page (per URL, perf only)     │
                                            │  • geo (per country/region)      │
                                            └──────────────┬───────────────────┘
                                                           │
                                                           ▼
                                                 ┌──────────────────┐
                                                 │ AnalyticsSummary │
                                                 │ (multi-scope)    │
                                                 └────────┬─────────┘
                                                          │
                                              ┌───────────┼───────────┐
                                              ▼           ▼           ▼
                                     ┌──────────────┐ ┌──────────┐ ┌──────────┐
                                     │Admin Dashboard│ │Instructor│ │API/Reports│
                                     └──────────────┘ └──────────┘ └──────────┘
```

---

## Data Model: `AnalyticsSummary` (Multi-Scope Single Table)

One model, multiple records per day at different scope levels:

```
┌──────────┬────────────┬─────────────────┬──────────────────────────────────────┐
│ scope    │ scopeId    │ Typical query   │ Contains                             │
├──────────┼────────────┼─────────────────┼──────────────────────────────────────┤
│ platform │ "all"      │ Site overview   │ Engagement + perf + rollups          │
│ section  │ sec_abc    │ Per-class view  │ Engagement + perf + squad/unit ranks │
│ unit     │ unit_xyz   │ Per-workbook    │ Engagement metrics for that unit     │
│ squad    │ squad_1    │ Per-squad       │ Squad engagement + accuracy          │
│ page     │ /workbook  │ Per-route perf  │ Web Vitals only                      │
│ geo      │ US/CA      │ Per-region      │ Engagement + perf by location        │
└──────────┴────────────┴─────────────────┴──────────────────────────────────────┘
```

### Schema

```typescript
AnalyticsSummary: a
  .model({
    _version: a.integer(),
    _lastChangedAt: a.timestamp(),
    _deleted: a.boolean(),
    // ─── Dimension keys ───
    date: a.date().required(),           // YYYY-MM-DD
    scope: a.string().required(),        // "platform" | "section" | "unit" | "squad" | "page" | "geo"
    scopeId: a.string().required(),      // ID of the scoped entity (or "all" / URL path / "US" / "US/CA")
    sectionId: a.string(),              // Parent section (for unit/squad/section records)
    unitId: a.string(),                 // Set when scope = "unit"
    squadId: a.string(),                // Set when scope = "squad"
    isWorkbook: a.boolean(),            // true = workbook content
    isReview: a.boolean(),              // true = peer review content
    // ─── Geolocation ───
    country: a.string(),                // ISO 3166-1 alpha-2 (e.g., "US", "JP", "BR")
    region: a.string(),                 // Region/state (e.g., "California", "Tokyo")
    city: a.string(),                   // City name (optional, for page/perf scope)
    // ─── User activity ───
    dailyActiveUsers: a.integer().default(0),
    totalPageViews: a.integer().default(0),
    totalSessions: a.integer().default(0),
    avgSessionDurationMs: a.integer(),
    // ─── Engagement ───
    totalEngagedTimeMs: a.integer().default(0),
    avgEngagedTimeMs: a.integer(),
    // ─── Academic ───
    gradesSubmitted: a.integer().default(0),
    avgAccuracy: a.float(),
    workbooksStarted: a.integer().default(0),
    workbooksCompleted: a.integer().default(0),
    // ─── Chat (split by role) ───
    studentChatMessagesSent: a.integer().default(0),
    instructorChatMessagesSent: a.integer().default(0),
    // ─── AI usage ───
    documentsAnalyzed: a.integer().default(0),
    // ─── Performance (Web Vitals p75) ───
    p75LCP: a.integer(),               // Largest Contentful Paint (ms)
    p75INP: a.integer(),               // Interaction to Next Paint (ms)
    p75TTFB: a.integer(),              // Time to First Byte (ms)
    p75FCP: a.integer(),               // First Contentful Paint (ms)
    p75CLS: a.float(),                 // Cumulative Layout Shift (score)
    perfSampleCount: a.integer(),      // Number of measurements
    // ─── JSON Rollups (on platform/section records) ───
    topPages: a.json(),                // [{ path, views, avgTimeMs }]
    slowestPages: a.json(),            // [{ path, p75LCP, p75INP, sampleCount }]
    topUnits: a.json(),                // [{ unitId, name, completions, avgAccuracy, engagedTimeMs }]
    bottomUnits: a.json(),             // [{ unitId, name, completions, avgAccuracy, engagedTimeMs }]
    topSquads: a.json(),               // [{ squadId, name, xp, avgAccuracy, completions }]
    bottomSquads: a.json(),            // [{ squadId, name, xp, avgAccuracy, completions }]
    topCountries: a.json(),            // [{ country, sessions, avgEngagedTimeMs, p75LCP }]
  })
  .secondaryIndexes((index) => [
    index("date").sortKeys(["scope"]).name("byDate"),
    index("sectionId").sortKeys(["scope"]).name("bySection"),
    index("scope").sortKeys(["date"]).name("byScope"),
    index("country").sortKeys(["date"]).name("byCountry"),
  ])
  .authorization((allow) => [
    allow.group("Admins"),
    allow.group("Instructors").to(["read"]),
  ]),
```

### Query Patterns

| Question | Query |
|----------|-------|
| Most engaged sections today | `byScope(scope="section", date="2026-05-25")` → sort by `totalEngagedTimeMs` |
| Squad rankings in Section A | `bySection(sectionId="sec_abc")` → filter `scope="squad"` |
| Unit completion rates | `byScope(scope="unit", date="2026-05-25")` → read `workbooksCompleted` |
| Slowest pages | `byScope(scope="page", date="2026-05-25")` → sort by `p75LCP` |
| Student vs instructor chat | Any scope record → compare `studentChatMessagesSent` vs `instructorChatMessagesSent` |
| Users by country | `byCountry(country="US", date="2026-05-25")` |
| Performance by region | `byScope(scope="geo", date="2026-05-25")` → filter country → read perf fields |
| Where are students slowest? | `byCountry(country="BR")` → read `p75LCP`, `p75TTFB` |
| Platform overview | `byScope(scope="platform", date="2026-05-25")` |

---

## Geolocation: Free via CloudFront Headers

Since the app runs on AWS Amplify (CloudFront-backed), geo data is available in request headers at zero cost — no GeoIP database or third-party service needed.

### Available Headers (CloudFront → Next.js)

| Header | Value | Example |
|--------|-------|---------|
| `CloudFront-Viewer-Country` | ISO 3166-1 alpha-2 | `US`, `JP`, `BR` |
| `CloudFront-Viewer-Country-Region-Name` | Region/state name | `California`, `Tokyo` |
| `CloudFront-Viewer-City` | City name | `San Francisco` |
| `CloudFront-Viewer-Latitude` | Lat coordinate | `37.7749` |
| `CloudFront-Viewer-Longitude` | Lng coordinate | `-122.4194` |
| `CloudFront-Viewer-Time-Zone` | IANA timezone | `America/Los_Angeles` |

### Extraction in API Routes

```typescript
// app/api/analytics/route.ts
export async function POST(request: Request) {
  const headers = request.headers;

  const geo = {
    country: headers.get("CloudFront-Viewer-Country") || "unknown",
    region: headers.get("CloudFront-Viewer-Country-Region-Name") || undefined,
    city: headers.get("CloudFront-Viewer-City") || undefined,
    timezone: headers.get("CloudFront-Viewer-Time-Zone") || undefined,
  };

  // Attach geo to every event in the batch before writing to Kinesis
  const events = await request.json();
  const enrichedEvents = events.map((event) => ({ ...event, geo }));

  await writeToKinesis(enrichedEvents);
  return new Response(null, { status: 204 });
}
```

### Geo Scope Records

The aggregator creates `scope="geo"` records keyed by country (and optionally country/region):

| date | scope | scopeId | country | region | dailyActiveUsers | p75LCP |
|------|-------|---------|---------|--------|------------------|--------|
| 2026-05-25 | geo | US | US | — | 142 | 980 |
| 2026-05-25 | geo | US/California | US | California | 45 | 850 |
| 2026-05-25 | geo | JP | JP | — | 28 | 1400 |
| 2026-05-25 | geo | BR | BR | — | 15 | 2100 |

**Use cases:**
- CDN optimization: "Brazil has 2x higher TTFB — add CloudFront edge there"
- Engagement patterns: "Japanese students study at 22:00–01:00 local time"
- Performance budgets per region: "Target p75 LCP < 1500ms for all countries"
- Content localization priority: "Most non-US users are in Japan → prioritize JP translations"

### Privacy Considerations

- No precise coordinates stored in DynamoDB (only country/region/city aggregates)
- Individual lat/lng from CloudFront headers used only for per-request Kinesis events, then discarded by aggregator
- City-level data only on `scope="page"` perf records (for CDN analysis), not on user activity records
- Compliant with GDPR: aggregated location data is not PII when not linked to individual users

---

## Client-Side Implementation

### Event Collection (`src/utils/analytics.ts`)

Rewrite to buffer events and flush to API route (which forwards to Kinesis):

```typescript
const buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

interface AnalyticsEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  userRole?: "Admin" | "Instructor" | "Learner";
  sectionId?: string;
  squadId?: string;
  unitId?: string;
  path?: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
}

export function trackEvent(
  name: string,
  attrs?: Record<string, string>,
  metrics?: Record<string, number>
) {
  buffer.push({
    name,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    attributes: attrs,
    metrics,
  });
  if (buffer.length >= 20) flush();
}

export function flush() {
  if (buffer.length === 0) return;
  const events = [...buffer];
  buffer.length = 0;
  navigator.sendBeacon("/api/analytics", JSON.stringify(events));
}

// Flush on page hide (reliable even on tab close)
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  // Flush every 30s
  flushTimer = setInterval(flush, 30_000);
}

// ─── Convenience functions (unchanged API for consumers) ───

export function trackPageView(path: string) {
  trackEvent("page_view", { path });
}

export function trackChatMessageSent(role: string, sectionId?: string) {
  trackEvent("chat_message_sent", { role, ...(sectionId && { sectionId }) });
}

export function trackWorkbookCompleted(unitId: string, sectionId?: string, accuracy?: number) {
  trackEvent("workbook_completed", { unitId, ...(sectionId && { sectionId }) }, { ...(accuracy != null && { accuracy }) });
}

export function trackEngagedTime(durationMs: number, unitId?: string, sectionId?: string) {
  trackEvent("engaged_time", { ...(unitId && { unitId }), ...(sectionId && { sectionId }) }, { durationMs });
}
```

### Web Vitals (`instrumentation-client.ts`)

```typescript
import { onLCP, onINP, onCLS, onTTFB, onFCP } from "web-vitals";

function sendMetric(metric) {
  navigator.sendBeacon(
    "/api/vitals",
    JSON.stringify({
      type: "web-vital",
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    })
  );
}

onLCP(sendMetric);
onINP(sendMetric);
onCLS(sendMetric);
onTTFB(sendMetric);
onFCP(sendMetric);
```

**Browser support:**

| Metric | Chrome | Firefox | Safari |
|--------|--------|---------|--------|
| CLS | ✅ | ❌ (Chromium-only) | ❌ |
| FCP | ✅ | ✅ | ✅ |
| INP | ✅ | ✅ | ✅ |
| LCP | ✅ | ✅ | ✅ |
| TTFB | ✅ | ✅ | ✅ |

### API Routes

**`app/api/analytics/route.ts`** — receives buffered events, enriches with geo headers, writes to Kinesis
**`app/api/vitals/route.ts`** — receives Web Vitals beacons, enriches with geo headers, writes to Kinesis

Both authenticate the request and extract CloudFront geo headers before forwarding.

---

## Infrastructure (`amplify/backend.ts`)

```typescript
import { Stream, StreamEncryption } from "aws-cdk-lib/aws-kinesis";
import { Duration } from "aws-cdk-lib";

// Analytics Kinesis Stream
const analyticsStream = new Stream(analyticsStack, "AnalyticsStream", {
  streamName: "homework-supply-analytics",
  shardCount: 1,
  encryption: StreamEncryption.MANAGED,
  retentionPeriod: Duration.days(7),
});

// Aggregator Lambda (triggered by Kinesis)
const aggregatorFn = new Function(analyticsStack, "AnalyticsAggregator", {
  // ... standard Lambda config
  events: [
    new KinesisEventSource(analyticsStream, {
      batchSize: 100,
      maxBatchingWindow: Duration.minutes(5),
      startingPosition: StartingPosition.LATEST,
    }),
  ],
});
```

---

## Event Metadata

Every event carries context for segmentation. Geo is added server-side:

```typescript
// Client-side event (sent to /api/analytics)
interface ClientEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  userRole?: "Admin" | "Instructor" | "Learner";
  sectionId?: string;
  squadId?: string;
  unitId?: string;
  path?: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
}

// Enriched event (after API route adds geo, before Kinesis)
interface EnrichedEvent extends ClientEvent {
  geo: {
    country: string;       // "US"
    region?: string;       // "California"
    city?: string;         // "San Francisco"
    timezone?: string;     // "America/Los_Angeles"
  };
}
```

The aggregator uses:
- `userRole` to split `studentChatMessagesSent` vs `instructorChatMessagesSent`
- `geo.country` + `geo.region` to create `scope="geo"` records
- `sectionId`, `unitId`, `squadId` to create respective scope records

---

## What to Remove (Pinpoint Cleanup)

| File | Action |
|------|--------|
| `amplify/backend.ts` | Remove `CfnApp` Pinpoint resource + output |
| `app/providers.tsx` | Remove `Analytics: { Pinpoint: {...} }` from `Amplify.configure()`, remove `initAnalytics()` call |
| `src/utils/analytics.ts` | Rewrite — remove all `aws-amplify/analytics` imports |
| `src/hooks/useAnalyticsSegmentation.ts` | Remove (user attributes now sent as event metadata) |
| `docs/PINPOINT_MIGRATION.md` | Remove (replaced by this doc) |

## What to Add

| File | Action |
|------|--------|
| `amplify/data/resource.ts` | Update `AnalyticsSummary` schema (scope, geo, perf, chat split fields) |
| `amplify/backend.ts` | Add Kinesis stream + aggregator Lambda |
| `amplify/functions/analyticsAggregator/` | New Lambda — consumes Kinesis, writes AnalyticsSummary |
| `app/api/analytics/route.ts` | New — receives event batches, enriches with geo, forwards to Kinesis |
| `app/api/vitals/route.ts` | New — receives Web Vitals beacons, enriches with geo, forwards to Kinesis |
| `instrumentation-client.ts` | Add `web-vitals` collection |
| `src/utils/analytics.ts` | Rewrite with buffer + flush pattern |
| `package.json` | Add `@aws-sdk/client-kinesis`, `web-vitals` |

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Kinesis (1 shard, 7-day retention) | ~$15 |
| Aggregator Lambda (invoked per batch) | ~$1–3 |
| DynamoDB (AnalyticsSummary writes) | Included in existing table |
| Web Vitals library | $0 (client-side, 2KB) |
| CloudFront geo headers | $0 (included with CloudFront) |
| **Total** | **~$16–18/mo** |

---

## References

- [AWS Pinpoint Migration Guide](https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html)
- [Amazon Kinesis Developer Guide](https://docs.aws.amazon.com/streams/latest/dev/introduction.html)
- [web-vitals library (Google)](https://github.com/GoogleChrome/web-vitals)
- [CloudFront Geo Headers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html)
- [Amazon Connect Outbound Campaigns](https://aws.amazon.com/connect/outbound/) (if engagement/outreach needed later)
