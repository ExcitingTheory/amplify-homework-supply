# Amplify Gen 1 → Gen 2 Migration Plan

**Status:** Planning Phase  
**Target Timeline:** 4-6 weeks  
**Priority:** High (enables Yjs WebSocket API Gateway integration)

## Why Gen 2?

- **Code-first TypeScript** - Matches Yjs provider architecture
- **Per-developer cloud sandboxes** - Isolated backend per dev (8X faster deployments)
- **API Gateway WebSocket** - Native first-class support for real-time sync
- **Type safety** - Frontend/backend types unified in TypeScript
- **Git-based environments** - Zero-config staging/production from branches
- **Unified console** - Single place for data browser, auth, storage, functions

## Migration Strategy

### Phase A: Gen 2 Backend Setup (Week 1)
- [ ] Initialize Gen 2 backend structure (`amplify/backend.ts`, `amplify/data/resource.ts`)
- [ ] Set up TypeScript-first data schema (replaces `schema.graphql`)
- [ ] Configure Cognito auth in `amplify/auth/resource.ts`
- [ ] Create AppSync GraphQL API (replaces Gen 1 GraphQL)
- [ ] Test local sandbox deployment

### Phase B: Data Model Migration (Week 2)
- [ ] Convert GraphQL schema → TypeScript data models
  - Unit, Assignment, Grade, Section, Word, Question, File, Document, ParsedContent
- [ ] Preserve `@auth` rules (owner, groups, public)
- [ ] Auto-generate client types (no separate codegen step)
- [ ] Test schema in sandbox

### Phase C: Auth & API Gateway WebSocket (Week 3)
- [ ] Set up Cognito in Gen 2 auth resource
- [ ] Create API Gateway WebSocket API via CDK custom resource
- [ ] Build Lambda message handler for Yjs sync events:
  - `$connect` - Client connects, load Y.Doc snapshot from DynamoDB
  - `$disconnect` - Clean up client
  - `$default` - Route Y.updates, broadcast to room, persist
  - `sendMessage` - Direct message routing
- [ ] Integrate SyncAdapter with WebSocket Lambda events
- [ ] Test real-time sync in sandbox

### Phase D: Lambda Functions Migration (Week 3-4)
- [ ] Convert Amplify Gen 1 Lambda functions to Gen 2 format
  - ChatStream → Streaming chat via WebSocket
  - SuggestBlocks → WebSocket message handler
  - AnalyzeDocument → WebSocket message handler
  - Others: generateEmbedding, openaiWebhook, etc.
- [ ] Update OpenAI integration for Gen 2
- [ ] Test all Lambda handlers

### Phase E: Frontend Integration (Week 4-5)
- [ ] Install `@aws-amplify/backend` (Gen 2 client)
- [ ] Replace Amplify Gen 1 client initialization
- [ ] Update DataStore calls → New Amplify client
  - `client.models.Unit.list()` instead of `DataStore.query(Unit)`
- [ ] Wire Yjs provider to WebSocket API Gateway
- [ ] Update Auth context to use Gen 2 auth
- [ ] Update storage calls for S3

### Phase F: Testing & Cleanup (Week 5-6)
- [ ] E2E tests in sandbox environment
- [ ] Performance testing (Yjs sync latency, DynamoDB cost)
- [ ] Decommission Gen 1 backend
- [ ] Deploy to staging environment
- [ ] Deploy to production
- [ ] Rollback plan ready

## Gen 1 ↔ Gen 2 Mapping

| Gen 1 | Gen 2 | Location |
|-------|-------|----------|
| `amplify/backend/api/japanese5/schema.graphql` | `amplify/data/resource.ts` | TypeScript data models |
| `amplify/backend/api/java/resources/` | `amplify/backend.ts` | Imported resources |
| DataStore subscription | `client.models.Unit.observeQuery()` | Real-time via AppSync |
| Cognito config (CLI) | `amplify/auth/resource.ts` | Code-first auth |
| REST Lambda functions | CDK custom resources in `amplify/custom/` | AWS CDK constructs |
| Studio console | TypeScript files + Amplify console | Code + unified UI |
| `amplify push` | Git branch → auto-deploy | Automatic on commit |

## Key Decisions Made

1. **Keep Yjs locally, persist to DynamoDB** - SyncAdapter remains unchanged, just uses new Gen 2 GraphQL client
2. **API Gateway WebSocket** - Replaces persistent WebSocket server Lambda with event-driven architecture
3. **Phased migration** - Keep Gen 1 running while building Gen 2 in parallel, cut over all at once
4. **Shared auth** - Single Cognito pool, but configured in Gen 2 code

## New Architecture Post-Gen 2

```
┌─────────────────────────────────────────────┐
│          Frontend (Next.js)                  │
│  ┌───────────────────────────────────────┐  │
│  │  Yjs Provider + React Hooks           │  │
│  │  - Y.Doc locally + IndexedDB          │  │
│  │  - Sync via API Gateway WebSocket     │  │
│  └───────────────────────────────────────┘  │
│              ↓                               │
│  Gen 2 Amplify Client (generateClient)      │
│  - GraphQL queries/mutations                │
│  - Real-time subscriptions (AppSync)        │
└─────────────────────────────────────────────┘
              ↓               ↓
┌──────────────────────┐  ┌──────────────────┐
│ API Gateway          │  │  AppSync         │
│ WebSocket API        │  │  GraphQL API     │
│ ┌────────────────┐   │  │ ┌──────────────┐ │
│ │$connect event  │   │  │ │List, Create, │ │
│ │$default event  │   │  │ │Update, Delete│ │
│ │$disconnect     │   │  │ └──────────────┘ │
│ └────────────────┘   │  │       ↓          │
│        ↓             │  │    DynamoDB      │
│ Lambda Handler       │  │    (DynamoDB)    │
│ (Yjs broadcast)      │  └──────────────────┘
│        ↓             │
│ DynamoDB            │
│ (Y.Doc snapshots)   │
└──────────────────────┘
```

## Files to Create/Modify

```
amplify/
  backend.ts                    # Main Gen 2 backend config (NEW)
  data/
    resource.ts                 # TypeScript data schema (NEW)
  auth/
    resource.ts                 # Auth config (NEW)
  custom/
    websocket/
      resource.ts               # WebSocket API CDK (NEW)
  functions/
    yjsSync/
      handler.ts                # Refactored for WebSocket events (MODIFY)
      
src/
  lib/
    gen2Client.ts               # Initialize Gen 2 client (NEW)
```

## Rollback Plan

If Gen 2 has issues:
1. Keep Gen 1 running in `team-provider-info.json`
2. Switch frontend env var: `AMPLIFY_ENV=gen1`
3. Revert Amplify client import in pages
4. Keep DataStore calls in place as fallback

Timeline: 15 minutes to restore Gen 1 operation

## Cost Considerations

- **Gen 1** - Per-model DataStore subscription (now: ~$40/month for 5 models)
- **Gen 2** - Per-message AppSync charges + WebSocket connect/disconnect
  - Estimate: $60-80/month (higher throughput, more messages)
  - WebSocket: $0.25 per million messages (cheap at scale)
- **Sandbox** - Free per-developer cloud environment (Gen 2 only)

## Next Step

Start **Phase A: Gen 2 Backend Setup**
1. Check Gen 2 Amplify CLI version
2. Create initial `amplify/backend.ts`
3. Set up `amplify/data/resource.ts` with schema skeleton
4. Test `amplify sandbox` deployment

Ready to proceed?
