# Document Analysis Workflow Plan

Status: **Implementation in progress (local only)**. Workflow orchestration, progress/cancellation, page-level verification and repair, moderation gating, bounded synthesis, token accounting, shared DynamoDB-backed provider limits, and operational alarms are implemented in source. Final `ParsedContent` persistence splits the result by page into chunk records, so a large document no longer risks an oversized AppSync/DynamoDB item. The Amplify project TypeScript check and focused unit tests pass; the repository-wide typecheck currently fails on unrelated app/editor/gamification errors. CDK synthesis/assertion tests, failed-page redrive, deployed sandbox acceptance, and runtime verification remain incomplete. No deployment has been performed.

Move document analysis out of the single `documentAnalysis` Lambda invocation and into an AWS Step Functions workflow that fans out over pages (Distributed Map), runs a verified multi-pass pipeline per page, and then fans back in to aggregate. The goals: no document is bounded by one 15-minute Lambda, failed pages retry independently, every fact is checked against its source, and documents running at the same time share capacity fairly.

Decision log: always use the workflow (2026-10-19); verify every page with an independent pass (2026-10-19); Claude Sonnet as the verifier when available (2026-10-20); paragraph-aligned segments of about 3,500 characters (2026-10-20); **Step Functions for orchestration (2026-10-20)**. The earlier SQS design is kept in Appendix A.

## 1. Current State (verified against source; synthesis/runtime unverified)

| Aspect | Today | Source |
|---|---|---|
| Entry points | S3 EventBridge and `analyzeDocument` start executions; `cancelDocumentAnalysis` stops the active execution; media approval remains a separate resolver | `amplify/backend.ts`, `amplify/functions/documentAnalysis/handler.ts` |
| Compute and fan-out | One workflow Lambda handles workflow tasks (900 s, 1536 MB); Standard Step Functions with a Distributed Map capped at 10 pages per execution. Shared DynamoDB-backed token buckets and concurrency leases now enforce per-provider RPM, TPM, and concurrency limits across concurrent documents | `documentAnalysisWorkflow/resource.ts`, `amplify/backend.ts`, `documentAnalysisWorkflow/providerRateLimiter.ts` |
| Extraction | Paged formats and all text formats use page inputs stored in S3; long text is segmented, not clipped at 100,000 characters. Standard and exhaustive profiles are supported | `documentAnalysis/analysis.ts`, `documentAnalysisWorkflow/handler.ts` |
| Verification | Extracted page candidates receive a deterministic source check and independent model verification; repair output receives a second verification. Final page persistence rechecks source evidence. Direct questions/vocabulary are retained only when prompt/answer or term/definition occur in extracted source text | `analysis.ts`, `documentAnalysisWorkflow/handler.ts` |
| Document synthesis | Compact verified facts are reduced in bounded 32,000-character batches; every partial/final synthesis is independently verified before reuse. The final result is stored as page chunks (see "ParsedContent chunking") | `documentAnalysisWorkflow/handler.ts`, `documentAnalysis/analysis.ts` |
| Moderation | Source text and aggregate content are moderated before `ParsedContent` persistence. Flagged results remain reviewable by Owners/Admins/Instructors but the review UI and import utilities block imports; this is not a server-enforced guard on direct Word/Question mutations | `documentAnalysisWorkflow/handler.ts`, `src/utils/parsedContentModeration.ts` |
| Usage accounting | Per-model prompt/completion/total token counts are stored on a run-id-keyed `AgentJob`; no token-price table is maintained, so `estimatedCost` is intentionally not populated | `documentAnalysisWorkflow/handler.ts`, `amplify/data/resource.ts` |
| `ParsedContent` access | Owners and Admins have full access; Instructors have read access; Learners have no model-level read grant | `amplify/data/resource.ts` |
| Cancellation and progress | Cancellation stops the recorded execution; page tasks check the active run before model calls. A 15-second progress poller updates `Document.metadata.analysis` | `amplify/functions/documentAnalysis/handler.ts`, `amplify/backend.ts`, `documentAnalysisWorkflow/handler.ts` |
| Failed-page handling | Page tasks retry independently and the Map records tolerated failures. Standard completion retains available results and lists failed pages; exhaustive completion fails the document. A supported operator redrive path that reruns only failed pages is not implemented | `amplify/backend.ts`, `documentAnalysisWorkflow/handler.ts` |
| Operational signals | State-machine failures, Lambda errors/throttles/duration, and model HTTP 429 events have CloudWatch alarm definitions. Alarm actions/notifications and synthesized resource behavior have not been verified | `amplify/backend.ts`, `documentAnalysisWorkflow/handler.ts`, `analysis.ts` |
| Persistence idempotency | `ParsedContent` chunks have ids derived from the document id, so a re-run overwrites them and removes leftovers (see **ParsedContent chunking**); `AgentJob` uses `responseId = runId` and updates an existing record on retry. No deploy-time or runtime duplicate-execution test has been run | `documentAnalysisWorkflow/handler.ts` |
| Provider limits | Shared DynamoDB token buckets and expiring concurrency leases enforce OpenAI and Anthropic RPM/TPM/concurrency settings. Admins can edit the limits; demo mode clamps them to 5 RPM, 20,000 TPM, and 1 concurrent request. Source changes are local and have not been synthesized or deployed | `documentAnalysisWorkflow/providerRateLimiter.ts`, `amplify/backend.ts`, `app/[locale]/admin/settings/page.tsx` |
| Legacy inline helper | The resolver routes active analysis to Step Functions, but the old inline implementation remains as unreachable code and should be removed | `amplify/functions/documentAnalysis/handler.ts` |
| Infrastructure validation | Amplify TypeScript passes; CDK synthesis/assertions, sandbox deployment, and runtime acceptance are still outstanding | `amplify/backend.ts` |

`docs/FILE_PROCESSING_PIPELINE.md` §4 also describes behavior (one `ParsedContent` per page, per-record embeddings) that does not match the current handler; update it as part of this work.

## 2. Goals and Non-Goals

**Goals**

1. No whole-document wall-clock ceiling; each page has its own Lambda budget.
2. Independent retry of failed pages; completed pages are never recomputed or lost.
3. Bounded, configurable concurrency against OpenAI and Anthropic rate limits, with fairness between concurrent documents.
4. Observable progress (`n / total pages`) for the UI and the seed.
5. Real cancellation: once a run is cancelled, no new model calls start.
6. A reduce step that produces document-level summaries, objectives, and concepts from page results.
7. One code path for every document and profile; the inline analysis path is retired.
8. Every extracted fact is verified against its source page before it reaches `ParsedContent`.
9. No silent truncation: non-paged formats are chunked into segments shaped like pages.

**Non-goals (this plan)**

- Changing text extraction (`textExtraction.ts`, `officeExtraction.ts`, `epubExtraction.ts`, edu formats).
- Rewriting the extraction prompt itself (verification and repair are separate passes; see §6.9).
- Removing `resumeState` from the schema (schema change; deferred, see §8).

## 3. Proposed Architecture

```
S3 upload (EventBridge) / analyzeDocument mutation
        │
        ▼
documentAnalysis (entry Lambda, existing)
  - resolve File/Document (unchanged lookup + auth)
  - stop any running execution for this document (superseded)
  - runId = uuid; StartExecution(name = runId, input = {runId, documentId, fileId, s3Key, profile})
  - Document.status = "analyzing", metadata.analysis = {runId, executionArn, state: "preparing"}
        │
        ▼
DocumentAnalysisWorkflow (Step Functions, STANDARD)
  Prepare                 (Lambda: extract text, segment, write pages + manifest + directContent to S3)
  Parallel
  ├─ Branch A: PageMap    (Distributed Map, ItemReader = S3 manifest, MaxConcurrency = 3,
  │                        ToleratedFailurePercentage = 100, ResultWriter = S3, child = STANDARD)
  │     per page:
  │       Extract (+check)                     Lambda: pageStep{step:"extract"}
  │       Choice: text layer sparse? ── yes ─▶ Vision (+check)   Lambda: pageStep{step:"vision"}
  │       Verify                               Lambda: verifyClaude
  │         Catch(any after retries) ──────▶ Verify (OpenAI)     Lambda: pageStep{step:"verify"}
  │       Choice: suspect/unsupported/omissions? ── yes ─▶ Repair (+check)  Lambda: pageStep{step:"repair"}
  │       WriteResult                          (inside the last step; output = {page, resultKey})
  └─ Branch B: ProgressPoller (loop: Wait 15 s → Lambda progress → Choice(map run done?))
  Aggregate               (Lambda: merge, dedupe, directContent, synthesis, failure policy)
  Moderate                (Lambda: existing moderation logic, per document)
  Embed                   (Lambda: existing embeddings logic, verified facts only)
  Finalize                (Lambda: ParsedContent, AgentJob, Document terminal status)
  Catch (any) → MarkFailed (Lambda: Document.status = "failed", metadata.analysis.error)
```

Run state lives in the execution itself plus S3. There is **no run table, no counters, no claim logic and no aggregate queue**: the Map state does fan-in natively, and `Parallel` waits for both branches.

### 3.1 Why Step Functions (and not SQS or direct async invokes)

| Option | Decision | Reason |
|---|---|---|
| `InvocationType: Event` per page | Rejected | No backpressure against OpenAI; fixed 2 retries; failures are easy to lose. |
| SQS + hand-written worker | Superseded (Appendix A) | Workable, but per-pass retries, the conditional passes, vendor fallback, fan-in counters, cancellation and fairness all have to be written by hand inside one long worker. |
| **Step Functions (Standard + Distributed Map)** | **Chosen and implemented in source** | Per-state `Retry`/`Catch`, conditional passes, native fan-in, `StopExecution` cancellation, a per-execution concurrency limit, and page-level execution history. A supported workflow redrive path has not been implemented or tested. |

Transition count depends on conditional vision/repair and retry branches. No current AWS Step Functions cost estimate is maintained here; check current regional pricing and expected page volume before rollout.

### 3.2 Concurrency model and fairness

Only the per-execution limit is currently configured:

| Limit | Mechanism | Purpose |
|---|---|---|
| **Per execution** | Distributed Map `MaxConcurrency: 3` | Limits concurrent page items in one execution. |
| **Account-wide** | None | Concurrent documents multiply the page concurrency; this can exceed model vendor quotas. Lambda throttling is retried, but no independent OpenAI/Anthropic concurrency caps or fairness guarantee exist yet. |

The workflow uses a shared Lambda for both OpenAI and Anthropic calls, so separate per-vendor reserved-concurrency settings require splitting model work into distinct functions (or a shared rate limiter). This is an unresolved implementation decision, not an existing guarantee.

### 3.3 Stack placement

- **Placement:** define the state machine and the new Lambdas in the **data** stack (`resourceGroupName: "data"`, and `Stack.of(backend.documentAnalysisHandler.resources.lambda)` for the CDK constructs). The entry Lambda needs the state machine ARN and the state machine needs the Lambda ARNs, so separate stacks would create a cross-stack dependency cycle.
- **Budget:** current synthesized data-stack resource count has not been verified. The implemented workflow uses a shared task Lambda; re-check nested-stack size during an authorized synthesis.
- **Bootstrap:** confirm the phased bootstrap in `scripts/deploy-bootstrap.mjs` places these resources in a phase where the referenced tables already exist.

## 4. Implemented Components

| Component | Location | Current behavior |
|---|---|---|
| Entry and cancellation | `amplify/functions/documentAnalysis/handler.ts` | Keeps S3 EventBridge and GraphQL entry points; starts, supersedes, and stops workflow executions. The unreachable inline implementation has not yet been removed. |
| Workflow task Lambda | `amplify/functions/documentAnalysisWorkflow/` | Handles prepare, extract, verify, repair, vision, progress, aggregate, moderation, finalize, and failure modes in a shared 900-second Lambda. |
| Shared analysis code | `amplify/functions/documentAnalysis/analysis.ts` | Segmentation, extraction, deterministic checks, verification filtering, and bounded synthesis helpers. |
| State machine | `amplify/backend.ts` (data stack) | Standard workflow, Distributed Map (`MaxConcurrency: 3`, tolerated failure percentage 100), retries, S3 ResultWriter, 15-second progress polling, moderation, embeddings, finalization, and ERROR-only logs without execution data. |
| Usage and persistence | `amplify/functions/documentAnalysisWorkflow/handler.ts` | Aggregates model token usage and upserts one `AgentJob` per document/run using `responseId = runId`; no token-price estimate is currently recorded. |
| Moderation/import behavior | `src/utils/parsedContentModeration.ts` and review/import utilities | Stores moderation status and blocks normal review UI/import utility paths for flagged documents. Direct model mutations are not guarded by this client-side check. |
| Operational signals | `amplify/backend.ts` | Source defines state-machine failure, Lambda error/throttle/duration, and model-rate-limit alarms. Synthesis and alert routing have not been verified. |

## 5. Contracts

### 5.1 S3 layout (shared cache and run state)

```
private/{identityId}/documents/{documentId}/analysis/{runId}/
  manifest.json            [{ "page": 1, "inputKey": ".../pages/0001.json" }, ...]   ← Map ItemReader
  pages/0001.json          { pageNumber, text, prevTail, nextHead, sourceFormat, profile }
  results/0001.json        { page, facts, vocabulary, suspect, verification, tokens }
  direct-content.json      edu-format directContent (optional)
  map-output/              ← Map ResultWriter (SUCCEEDED / FAILED item manifests)
```

`prevTail`/`nextHead` are capped (e.g. 1,500 characters each). State payloads carry only keys and small flags, because of the 256 KB state-payload limit.

### 5.2 Execution input and per-step contracts

```json
// Execution input (name = runId)
{ "v": 1, "runId": "uuid", "documentId": "uuid", "fileId": "uuid", "identityId": "…",
  "s3Key": "…", "profile": "standard" | "exhaustive" }

// Map item → page step
{ "runId": "…", "page": 12, "inputKey": "…/pages/0012.json", "profile": "…" }

// Every page step returns
{ "page": 12, "resultKey": "…/results/0012.json",
  "sparseText": false, "needsRepair": true, "verifierModel": "claude-sonnet-5-5" }
```

Each step reads `resultKey`, updates it in place, and returns the flags the next `Choice` needs. Step errors use **named error types** so that `Retry`/`Catch` can target them: `RateLimited`, `ModelTimeout`, `InvalidModelOutput`, `PermanentInputError`.

### 5.3 Document progress mirror

Stored under the existing `Document.metadata` JSON field — **no schema change**:

```json
{ "analysis": { "runId": "uuid", "executionArn": "arn:…", "mode": "workflow",
  "state": "preparing|analyzing|aggregating|completed|failed|cancelled",
  "totalPages": 54, "done": 37, "failed": 1, "updatedAt": "…",
  "quality": { "supported": 0, "unsupported": 0, "omissionsFound": 0, "repaired": 0 } } }
```

There's **a single writer per execution**: the progress poller (branch B) and then `Finalize`. Branch B calls `ListMapRuns(executionArn)` → `DescribeMapRun` → `itemCounts`, and writes `done`/`failed` every 15 s. Because only one writer exists, the `_version` conflicts from the SQS design go away; the writer still re-reads `_version` before each update, following the repo's Lambda versioning rule.

## 6. Behavior Details

### 6.1 Routing: always orchestrate

**Decision (2026-10-19): every document and every profile runs through the workflow.** There is no page threshold and no inline analysis path.

- **Paged formats** (PDF, and PPTX slides if the extractor exposes them): one Map item per page.
- **Non-paged formats** (DOCX, TXT, MD, RTF, EPUB, CSV, …): the Prepare step segments the extracted text into synthetic pages (algorithm below), numbered `pageNumber` from 1. This removes today's 100,000-character truncation.

  **Segmentation (decision 2026-10-20: target an acceptable average size, cut on the nearest paragraph boundary):**
  - **Target:** `SEGMENT_TARGET_CHARS = 3500`, about one printed PDF page (roughly 900 tokens). This keeps synthetic pages comparable to real ones, so the extract and verify prompts, the omission rates and the per-page budgets mean the same thing for both.
  - **Paragraphs:** split on paragraph boundaries (blank lines; headings start a new paragraph), then greedily add paragraphs to the current segment. When the next paragraph would cross the target, cut **before or after it, whichever leaves the segment closer to 3,500 characters**.
  - **Bounds:** min 0.5× (1,750) and max 1.5× (5,250). A short tail merges into the previous segment. A single paragraph longer than the maximum is split at the nearest sentence boundary, and only falls back to a hard cut at the maximum if it contains no sentence boundary.
  - **Invariant:** joining the segments back together reproduces the normalized source text exactly. This is unit-tested (no characters lost or duplicated).
- **Direct-content edu formats** (QTI, GIFT, IMS CC, SCORM): Prepare writes structured `directContent` to S3. Aggregate keeps a direct question/vocabulary entry only when its prompt/answer or term/definition exactly matches a page result that passed verification; otherwise it uses the verified page result. Direct summaries/objectives are not trusted as model-verified output. Any remaining text is segmented like the non-paged formats.
- **Cost of the decision:** a one-page document now pays workflow overhead (a few seconds of state transitions and Lambda starts) instead of running inline. This is accepted in exchange for one code path, verification on every document, and uniform progress reporting.
- **Rollout:** all active analysis entry points use the workflow; no workflow-mode flag is present. The old inline helper remains unreachable and is pending removal.

### 6.2 Idempotency

- **Duplicate starts:** the execution name is `runId`. A duplicate `StartExecution` with the same name returns the existing execution, or `ExecutionAlreadyExists`, which is treated as success.
- **Page results:** keys are deterministic per `(runId, page)`, so a retried step overwrites its own object and nothing else.
- **Re-runs:** a new `analyzeDocument` creates a new `runId`. The entry Lambda first calls `StopExecution` on the previous `executionArn` stored in `Document.metadata.analysis`.
- **`Finalize`:** saves the result as `ParsedContent` page chunks (created, overwritten, or removed as needed; see **ParsedContent chunking**). `AgentJob` is looked up by document ID and `responseId = runId` before update/create. These operations are source-level retry guards; concurrent duplicate-execution behavior has not been runtime-tested.

### 6.3 Concurrency and rate limits

**Implemented limit: `MaxConcurrency` 3 per execution Map.** No account-wide or per-vendor reserved concurrency is set. All model calls use one Lambda, so OpenAI and Anthropic capacity cannot be independently bounded yet.

- The historical starting-cap proposal of 5 is not deployed or validated and must not be treated as a known safe account limit.
- **Implemented retry policy:** Prepare retries selected transient errors up to 3 times; page extraction retries up to 4 times; verification and repair retry up to 3 times, with 2-second exponential backoff. Anthropic verification falls back to OpenAI after its retry/catch path. These settings do not currently use full jitter.
- **In-Lambda 429 handling:** the analysis helper retries OpenAI 429s with bounded exponential waits (up to four retries); Step Functions also retries selected model/rate-limit errors.
- **Concurrency:** no reserved-concurrency ramp rule is active. Set account-wide and per-vendor caps only after the account's vendor RPM/TPM limits and desired throughput have been confirmed.

### 6.3a Shared caching

**Lambda instances do not share `/tmp`.** Each concurrent execution environment has its own `/tmp` (512 MB by default, configurable up to 10 GB). It survives only when AWS reuses that same warm instance for a later invocation. Two pass Lambdas running at the same time never see each other's files.

- **Shared cache:** S3. Prepare writes each page's input to `…/analysis/{runId}/pages/`, so pass Lambdas never download or re-parse the original upload.
- **Per-instance cache in `/tmp`** (an optional optimization): for the vision pass (§6.9), cache the source PDF at `/tmp/{runId}.pdf`, so a warm vision Lambda that handles several pages from the same run downloads it once. Always check the file exists before using it, and evict by `runId` when space runs low.
- **Shared filesystem (EFS):** rejected. It requires putting the pass Lambdas in a VPC, which then needs NAT for the OpenAI calls. That adds cost and moving parts for a cache that S3 already provides.

Fairness between documents is handled by orchestration, not caching (§3.2).

### 6.4 Cross-page context

Neighbor tails/heads are passed as read-only context; prompts must instruct "extract only facts whose source text appears on the target page". Validation already rejects facts with an invalid `page`.

### 6.5 Failure policy

- **Tolerating page failures:** the Map uses `ToleratedFailurePercentage: 100`, so the workflow proceeds to aggregation after page failures. Page result objects are inspected against the S3 input manifest; missing or incomplete results count as failures.
- **Where the policy is applied:** in `Aggregate`, which reads each expected page result key:
  - `exhaustive`: any failed page → `Document.status = "failed"`, with `metadata.analysis.failedPages = [...]`. Completed page results stay in S3.
  - `standard`: aggregate the available pages; `status = "completed"`, with the failed pages listed (today these are dropped silently by `allSettled`; now they're visible).
- **Redrive gap:** although Step Functions supports redrive for eligible executions, the current tolerated-failure path does not expose or verify a supported operation that reruns only failed pages. The listed failed page numbers and S3 artifacts are retained for diagnosis; safe redrive is not implemented.
- **Failures outside the Map** (Prepare, Aggregate, Finalize): a top-level `Catch` → `MarkFailed`.

### 6.6 Cancellation and re-runs

- **Cancel:** `cancelDocumentAnalysis` calls `StopExecution(executionArn)`, then sets `Document.status = "cancelled"` and `metadata.analysis.state = "cancelled"`.
- **What stops:** stopping the parent stops its Map Run and the child executions, so **no new states, and therefore no new model calls, start**. Lambda invocations already in flight run to completion (Lambda can't be interrupted), but their outputs go nowhere.
- **Re-run:** a new `analyzeDocument` stops the previous execution (§6.2), then starts a new one with a new `runId`.

### 6.7 Aggregation

1. Read expected per-page result objects from the S3 manifest; absent/incomplete objects become `failedPages`.
2. Keep structured questions/vocabulary only when they match facts that passed page-level verification; unmatched direct entries cannot override verified results.
3. Synthesize summaries/objectives/concepts from compact verified questions/vocabulary in bounded 32,000-character batches, independently verifying each partial/final synthesis before recursively reducing it.
4. Moderate combined source and aggregate content before persistence; then run embeddings for the persisted results.
5. Save `ParsedContent` as page chunks and upsert a run-id-keyed `AgentJob`. Per-model token counts are stored; `estimatedCost` is not populated because no maintained pricing source/configuration exists.
6. Apply the failure policy (§6.5), then update terminal `Document` status.

### 6.8 Cleanup

- **S3:** a lifecycle rule on the `…/analysis/` prefix expires objects after 14 days. Failed runs remain inspectable during this window; it is not a verified redrive guarantee.
- **Execution history:** Step Functions keeps it for 90 days after an execution closes. No action is needed, and there's no table to expire.

### 6.9 Per-page pipeline and verification

**Decision (2026-10-19): verify every page with at least one independent pass.**

Recommended pipeline: **2 model passes on every page, plus a deterministic check, plus at most one conditional repair pass.** A third full pass on every page costs about 50% more and, in typical extraction work, finds little that verification plus targeted repair don't already catch.

| # | Pass | Runs when | Tool | Output |
|---|---|---|---|---|
| 1 | **Extract** | Always | Existing `analyzeExhaustivePage` prompt (`gpt-4o`, JSON) for exhaustive; existing batch prompt adapted to one page for standard | Candidate facts, vocabulary, questions |
| 2 | **Deterministic check** | Always (no model call; runs inside the same Lambda invocation as passes 1, 4 and 5, to save state transitions) | New pure function in `analysis.ts` | Each fact's `sourceText` must appear in the page text after whitespace/Unicode normalization; `page` must equal the target page; the `answer` must appear in `sourceText`, or be flagged as inferred; duplicates are collapsed. Facts that fail are moved to a `suspect` list instead of being silently dropped |
| 3 | **LLM verify** | Always | A separate prompt that gets only the page text and the candidate list, not the extractor's reasoning. The model is chosen as described in **Verifier model selection** below | For each fact: `supported` / `unsupported` / `partially_supported`, plus a list of **omissions** (facts on the page that are missing from the list) |
| 4 | **Repair** | Only when pass 3 reports omissions or unsupported facts, or pass 2's suspect list is non-empty | Extraction prompt run again, restricted to the flagged spans and omissions | Replacement or added facts go through deterministic checks and a post-repair OpenAI verifier before final persistence |
| 5 | **Vision** | Only when the text layer is sparse (e.g. under about 200 characters on a page whose rendered image has content) or the page has many tables/figures | Render the page to an image (the PDF→WebP path already exists in `documentThumbnail`) → `gpt-4o` vision with the same extraction schema, using the `processImageUrl` pattern from the `openai` function | Facts for scanned pages and diagrams, then passes 2–3 |

Per-page result fields added to the S3 result object: `verification: { supported, unsupported, partial, omissionsFound, repaired, verifierModel, passes: [...] }` and `tokens` per pass. The aggregator sums them into `Document.metadata.analysis.quality` so the extraction rate and the verify-rejection rate can be watched over time, per verifier model.

**ParsedContent chunking**

A long document's result does not fit in one DynamoDB item (the Thoth deck is about 1,600 questions, roughly 500 KB), so it is stored as several `ParsedContent` records, split by page. Code: `amplify/functions/shared/parsedContentChunks.ts`, mirrored for the client in `src/utils/parsedContentChunks.ts`.

- **Split.** Vocabulary and questions are packed in page order into chunks of at most 200 KiB of serialized JSON. A page stays whole when it fits; a page larger than a chunk is split entry by entry. Summaries, objectives, concepts and pending media always live in chunk 0, the primary record. Entries with no page sort first.
- **Fields.** `chunkIndex` and `chunkCount` on `ParsedContent`; unset means a single record. `documentID` and `fileID` are on every chunk.
- **Ids.** `{documentID}-chunk-{n}`. Saving again overwrites the same ids, then removes chunks beyond the new count, so a reader never sees the document empty.
- **Reading.** Chunks are listed through the `Document.parsedContent` or `File.parsedContent` relationship (an indexed query, not a table scan) and merged into one record: chunk 0's fields, every list concatenated in chunk order, and a `chunks` array that says which chunk holds which entries. The import utilities, agent tool and embeddings handler all read the merged record.
- **Review screens.** `QuestionsReview2` and `VocabularyReview2` use `useDocumentParsedContent` (`src/utils/parsedContentChunkSync.ts`). It loads chunk 0 by its deterministic id and then the remaining chunks one at a time, so content appears straight away and a thin progress bar shows while later pages arrive. It follows only this document's create, update and delete events and applies a chunk only when its `_version` is newer, so duplicate or stale events change nothing. After the first load the screens dispatch `CONTENT_UPDATED`, which never shows the loading state and keeps the user's selection (new entries are auto-selected only while the content has not been imported). Records saved before chunking have no chunk id and are listed through the relationship instead.
- **Editing.** Import and edit utilities address an entry by its index in the merged list and write only the chunk that holds it. The Yjs adapter re-splits the shared document and writes only the chunks whose content changed.
- **Not covered.** Chunk writes are separate requests, so a failure part-way leaves a mix of old and new chunks until the next successful save; finalize runs again on retry. `Document.status` is set to `completed` only after finalize.

**Images in documents (pass 5 and embedded-image description)**

- **PDF and PPTX pages:** `prepare` marks a page `needsVision` when its text layer is under 200 characters or it has content images (PDF: raster images of at least 120 px on both sides from the page operator list; PPTX: `p:pic` and `c:chart`). Image-only pages are kept in the manifest rather than dropped. At most `DOCUMENT_VISION_MAX_PAGES` (default 30) pages per document qualify, sparse pages first. The state machine routes `needsVision` pages through `documentThumbnail` `renderPage` (pdfjs + `@napi-rs/canvas`, 1600 px WebP, converted PDF cached in `/tmp` per run) and then the vision step.
- **Vision output is merged into the page text.** The model returns a `pageText` transcription (including descriptions of figures and tables). It is appended to the page input under a `[Visual content]` marker, so the deterministic source check, the verifier, and repair all read it. Without this, facts quoted from an image never match the text layer and are dropped. The verifier sees the transcription, not the image.
- **DOCX, XLSX, ODF, EPUB and course packages** have no page mapping, so their visuals are read instead of rendered:
  - **Raster images** are described (`DOCUMENT_IMAGE_MODEL`, default `gpt-4o-mini`). Duplicates and images under `DOCUMENT_IMAGE_MIN_BYTES` (8 KB) are skipped and at most `DOCUMENT_IMAGE_MAX` (20) are described. In DOCX and ODT/ODP the extractor leaves a `⟦IMG:…⟧` marker where each image sits, and the description replaces it in place. Other formats get an `[Embedded images]` block at the end. Decorative images are dropped. Described EPUB and course-package media also keep the description as alt text.
  - **Charts and SmartArt** (`word|xl|ppt/charts`, `diagrams`) are read from their XML as text (title, axes, series, values; diagram text), with no model call. In PPTX they are attached to the slide that references them; in DOCX and XLSX they go in a `[Charts and diagrams]` block at the end.
  - **SVG** images contribute their title, description, and text labels the same way.
  - **EMF, WMF, TIFF and BMP** cannot be read by the vision model, so `prepare` converts each one (up to `DOCUMENT_IMAGE_CONVERT_MAX`, default 10, and above the minimum size) to PNG with the `documentThumbnail` Lambda (`convertImage` mode: sharp for TIFF, the canvas decoder for BMP, LibreOffice for EMF/WMF and the rest, with the blank page margin cropped and the long side capped at 2000 px). The PNG keeps the original image's marker, so its description lands in the same place. An image that fails to convert is skipped. The same conversion applies to EPUB, IMS CC and SCORM package media: those formats are now extracted from the package, converted, and staged as `<name>.<ext>.png` (keeping the original's description) in place of the original, which browsers cannot display. Originals that are not converted (over the cap, too small, or failed) are not staged.
- **Rate limiting** counts an inline base64 image as a fixed 1,500 tokens instead of its encoded size.
- Token usage for image descriptions is written to `prepare-usage.json` under the run folder and added to the job's per-model totals by `aggregate`.
- XLSX and ODS images are described but not placed (they are anchored to cells).

**Verifier model selection (decision 2026-10-20: use Claude Sonnet when an Anthropic configuration is available)**

| Condition | Verifier | Why |
|---|---|---|
| Anthropic key configured | **Claude Sonnet**, model ID from `VERIFIER_ANTHROPIC_MODEL`, default `claude-sonnet-5-5` | Another vendor's model makes errors less correlated with the `gpt-4o` extractor, which is the point of an independent check |
| No Anthropic key | `gpt-4o-mini` (`VERIFIER_OPENAI_MODEL`) | Always available through the existing `OPENAI_API_KEY`; same vendor but a different model and prompt |
| Anthropic call fails permanently on a page (non-retryable 4xx, or retries exhausted) | Fall back to the OpenAI verifier for that page and record `verifierModel` | A verifier outage must not fail the document |

Model ID notes (checked against the Anthropic models overview on 2026-10-20):
- **Sonnet 5** (`claude-sonnet-5`) is a legacy model and still available.
- **Sonnet 5.5** (`claude-sonnet-5-5`) is the current Sonnet, at the same $2 / $10 per million input / output tokens and with a newer knowledge cutoff, so it's the default.
- Setting `VERIFIER_ANTHROPIC_MODEL=claude-sonnet-5` pins Sonnet 5 if wanted.
- Claude model IDs are pinned snapshots, so verdicts stay reproducible until the variable is changed.
- Re-check the ID before Phase 4, because models get retired.

**Telling whether Anthropic is "available"**
- **Secret:** keep the key in SSM at the same path convention Amplify uses for secrets (`ANTHROPIC_API_KEY`). The Claude verify Lambda reads it **optionally** at cold start with `GetParameter`, handling `ParameterNotFound`, instead of declaring it with Amplify's `secret()`. Verify during Phase 4 whether `secret()` fails at cold start when the parameter is missing. If it does, keep the optional read; if it doesn't, `secret()` is simpler.
- **IAM:** the workflow Lambda gets `ssm:GetParameter` on that single parameter ARN. For a customer-managed SecureString key, set `ANTHROPIC_API_KEY_KMS_KEY_ARN` so the workflow Lambda also gets `kms:Decrypt` on that key only.
- **Network:** no VPC change is needed, because the pass Lambdas already call OpenAI over the public internet.
- **Dependency:** `@anthropic-ai/sdk` 0.71.2 is installed but declared only in the root `package.json`. Add it to `amplify/package.json` so the function bundles it explicitly. This needs permission and an install run by you.
- **Output format:** structured JSON verdicts use Claude tool use with a schema that matches the OpenAI verifier, so the deterministic recheck and the aggregator never branch on which vendor produced the verdict.
- **Rate limits:** Anthropic requests count against a separate vendor limit, but the current implementation shares one Lambda across OpenAI and Anthropic calls. Separate per-vendor concurrency caps are not enforced (§6.3).
- **Cost:** each verify pass sends the page text (about 900 tokens) plus the candidate facts, and gets back short verdicts. At Sonnet's rate that's roughly $0.005–0.01 per page. Record actual usage in `AgentJob` per vendor.

**Tools that already exist and are worth running**

| Tool | Where | Use in this pipeline | Recommendation |
|---|---|---|---|
| Structured extraction (`gpt-4o`) | `documentAnalysis/analysis.ts` | Pass 1 | Yes (exists) |
| Page rendering (PDF → image) | `documentThumbnail` | Pass 5 input | Yes, when the text layer is sparse; move the render helper into `functions/shared/` |
| Vision analysis (`processImageUrl` / `verifyImageUrl`) | `openai` function | Pass 5 | Yes, when the text layer is sparse |
| Moderation (`omni-moderation-latest`) | `moderation` function | Screens page text (and images when pass 5 runs) before content reaches learners | Yes. Run it **once per document in the aggregator**, not per page, using combined text chunks. It's cheap and keeps the per-page path short |
| Embeddings (`text-embedding-3-small`) | `embeddings` function | Fact and page vectors for semantic search | Yes, but **after aggregation**. Only verified, deduplicated facts get embedded, so rejected facts don't pay for vectors |
| `verifyShortAnswer` / `verifyDefinition` | `openai` function | These grade a learner's answer against an expected answer | No. They're the wrong shape for checking a source against an extraction; use the dedicated pass 3 prompt |
| Transcription (Whisper) | `openai` function | Embedded audio/video in EPUB/SCORM | Later. Out of scope until media extraction exists |

**Gates before increasing passes:** if pass 3's omission rate stays above 5% of facts after repair on the Thoth ground truth, consider a second independent verifier (majority vote) for the exhaustive profile only. Otherwise stay at 2 passes plus a conditional repair.

## 7. Observability

- **Execution history:** Distributed Map child executions provide page-level history; redrive behavior is not yet supported or runtime-verified.
- **Logs:** state-machine logging is `ERROR` with `includeExecutionData: false`. The Lambda also logs rate-limit marker events for metric filtering; no guarantee is made that every log is free of sensitive provider error content until reviewed at runtime.
- **Tracing:** X-Ray tracing is enabled on the state machine. The workflow Lambda receives the `PHOENIX_COLLECTOR_ENDPOINT` secret; connected per-page trace propagation has not been validated.
- **CloudWatch alarms:** source defines alarms for state-machine failures, workflow Lambda errors/throttles/duration, and logged OpenAI/Anthropic HTTP 429s. They have no configured notification actions and their synthesized resources have not been verified.
- **Usage:** per-model prompt/completion/total token counts are aggregated into the run's `AgentJob`. Estimated cost is not populated.

## 8. Schema and Permission Impact

| Change | Requires | Phase |
|---|---|---|
| Workflow Lambda, state machine, IAM, alarms and S3 lifecycle rule in `backend.ts` | Synthesis/deployment validation; deployment not performed | 1–3 |
| `Document.metadata.analysis` progress | None (existing `a.json()` field) | 2 |
| `ParsedContent` Owner/Admin full, Instructor read ACL; Learner read removed | Schema deployment required; not deployed | Access policy |
| Store `ANTHROPIC_API_KEY` in sandbox/branch SSM | User-managed; never committed | 4 (optional) |
| Deprecate `Document.resumeState` | Comment-only now; removal is a schema change requiring explicit permission | Later |
| `retryFailedPages(documentId)` mutation or another safe redrive mechanism | Not implemented; avoid schema change unless necessary | 5 |

**IAM summary:**
- **Entry Lambda:** `states:StartExecution` and `states:StopExecution` on the state machine.
- **State machine role:** invokes the workflow Lambda and page-rendering handler; CDK synthesis is required to verify generated permissions for Map children, ItemReader, and ResultWriter.
- **Workflow Lambda:** `states:ListMapRuns` and `states:DescribeMapRun`; optional `ssm:GetParameter` on the configured verifier parameter and `kms:Decrypt` on the explicitly configured customer-managed key.

The SQS design's `@aws-sdk/client-sqs` and `@aws-sdk/client-dynamodb` are **no longer needed**.

## 9. Rollout Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 | Refactor `analysis.ts`; segmentation, deterministic checks, and unit tests | **Source/tests complete for focused helpers:** Thoth baseline comparison and end-to-end extraction quality remain. |
| 1 | State machine, IAM, alarms, lifecycle | **Source implemented:** synthesis/assertions and sandbox validation remain; no deployment performed. |
| 2 | Entry, Prepare, page Map, progress | **Source implemented:** large-file, retry, cancellation, and runtime output checks remain. |
| 3 | Aggregate, moderation, embeddings, finalization, usage records | **Source implemented:** run-keyed `AgentJob` records include tokens; maintained pricing/cost estimation is intentionally absent. `ParsedContent`-size limits and runtime idempotency remain unverified. |
| 4 | Independent verification, fallback, repair, quality metrics | **Source implemented:** verifier paths typecheck; model quality regression remains untested. |
| 5 | Vision, UI/seed progress, failed-page redrive | **Partially implemented:** vision/progress are in source; a safe failed-page redrive path and deployed runtime checks remain. |

## 10. Testing Strategy

- **Unit** (`npm run test:unit`):
  - segmentation of non-paged text (boundaries, no lost characters, stable page numbers);
  - deterministic check (normalization, a page mismatch, an answer missing from `sourceText`);
  - computing the repair and sparse-text flags;
  - page input builder with neighbor-context caps;
  - mapping error names (`RateLimited` vs `PermanentInputError`);
  - verified-entry filtering, exact direct-content matching, bounded synthesis batching, and moderation gating;
  - progress writer (single writer, re-reads `_version`).
- **State machine definition:** CDK assertion tests are not yet present; add tests for `Retry`/`Catch`, Map settings, logging, alarms, IAM scope, and lifecycle after establishing an allowed local synthesis/test path.
- **State-level tests (sandbox):** the Step Functions `TestState` API, with mocked inputs for the `Choice` and `Catch` paths (Claude failure → OpenAI fallback, repair branch, vision branch).
- **Integration (sandbox):**
  - the Thoth deck end to end;
  - forced 429s (vendor) and forced throttles (after a concurrency cap is configured);
  - forced step crash (retried, one result);
  - cancel mid-run (no new states; `AgentJob` count stops growing);
  - redrive after an injected page failure (only that page reruns).
- **Quality regression:** run `test/integration/thoth/scoreExtraction` on inline vs workflow output; the workflow must not score lower.
- **Load:**
  - a synthetic 200-page PDF; confirm in-flight workflow Lambda invocations and vendor requests remain within configured limits;
  - 3 documents at once (1, 20 and 200 pages); confirm the 1-page document isn't starved.

## 11. Open Questions

1. ~~Default page threshold~~ Resolved 2026-10-19: every document runs through the workflow (§6.1).
2. ~~Standard vs exhaustive queuing~~ Resolved 2026-10-19: both profiles run through the workflow (§6.1).
3. Per-provider RPM/TPM/concurrency settings are now enforced through a shared limiter. Verify actual provider-tier compatibility, fairness, and latency under concurrent documents after deployment (§3.2).
4. Cross-document limits now share DynamoDB state; validate fairness and latency under concurrent documents after deployment (§3.2). `/tmp` is per instance; S3 is the shared cache (§6.3a).
5. ~~Extra passes / verifier model~~ Resolved 2026-10-20: extract + deterministic check + independent LLM verify + conditional repair; vision only when the text layer is sparse. Verifier is Claude Sonnet (`claude-sonnet-5-5` by default, configurable) when an Anthropic key is configured, otherwise `gpt-4o-mini` (§6.9).
6. ~~Segment size~~ Resolved 2026-10-20: target 3,500 characters, cut on the nearest paragraph boundary, bounded at 0.5–1.5× (§6.1). Tune the target against the verify-omission rate.
7. ~~Step Functions~~ Resolved 2026-10-20: adopted for orchestration from Phase 1 (§3). The SQS design is kept in Appendix A.
8. Whether to split the shared workflow Lambda by vendor remains open; the centralized per-vendor limiter is implemented locally.
9. Whether `analyzeDocument` should accept a `profile` argument (schema change), or keep reading it from `File.settings.analysisProfile` as today.

## 12. Acceptance Criteria

- [x] All active document-analysis entry points use the Step Functions workflow; long text is segmented instead of clipped at 100,000 characters.
- [x] Page questions and vocabulary are deterministically checked and independently verified; post-repair output is verified again. Aggregate synthesis output receives its own verifier pass, and direct structured question/vocabulary entries can only retain structure when they match a verified result.
- [x] Source and aggregate content are moderated before persistence; flagged content is visible for review but normal import paths block it.
- [x] Model token usage is aggregated by returned model ID and stored in a run-id-keyed `AgentJob`.
- [x] Shared per-provider RPM, TPM, and concurrency limits are configured in Platform Settings and enforced by DynamoDB-backed token buckets and leases; demo mode caps limits at 5 RPM, 20,000 TPM, and 1 concurrent request.
- [x] Source defines state-machine failure, Lambda error/throttle/duration, and model-rate-limit alarms.
- [ ] CDK synthesis/assertions and deployed acceptance for 200-page processing, cancellation, progress, retries, moderation, embeddings, and idempotency.
- [ ] Safe failed-page redrive that preserves successful page outputs.
- [ ] Remove the unreachable inline implementation.
- [ ] Verify provider-tier compatibility, limiter fairness, and latency under concurrent documents in a deployed environment.
- [x] ~~Reject final `ParsedContent` payloads larger than a 300 KiB serialized safety budget.~~ Superseded: finalize splits the result into chunks instead of rejecting it.
- [x] Chunk `ParsedContent` by page so a long document fits DynamoDB's item limit (see **ParsedContent chunking**).
- [ ] Configure a maintained model-price source before populating `AgentJob.estimatedCost`.
- [ ] Compare workflow output against the Thoth ground-truth baseline; verify synthesized summaries/objectives/concepts are populated only when supported.

## Appendix A. Superseded SQS design (archived 2026-10-20)

Kept for reference. It was replaced by Step Functions because per-pass retries, conditional passes, vendor fallback, fan-in counters, cancellation and fairness all had to be written by hand. §3.1 explains the decision.

### A.3. Proposed Architecture

```
S3 upload / analyzeDocument mutation
        │
        ▼
documentAnalysis (planner, existing Lambda)
  1. extract pages (unchanged); non-paged formats → segment into pages (§6.1)
  2. create run row in AnalysisRuns table (runId, totalPages, status=running)
  3. write page inputs to S3   …/analysis/{runId}/pages/{0001}.json
  4. SendMessageBatch → DocumentAnalysisPageQueue (1 msg per page), always
  5. Document.status = "analyzing", metadata.analysis = {runId, totalPages, done: 0}
        │
        ▼
DocumentAnalysisPageQueue (SQS standard)        ──maxReceiveCount──▶ PageDLQ
        │  batchSize 1, maxConcurrency N
        ▼
documentAnalysisPageWorker (new Lambda)
  1. load run; if status != running → ack and exit (cancel/superseded)
  2. if page item already recorded → ack and exit (idempotent redelivery)
  3. page pipeline (§6.9): extract → deterministic check → LLM verify
     → repair (only if needed) → [vision when the text layer is sparse]
  4. write result → S3 …/analysis/{runId}/results/{0001}.json
  5. TransactWriteItems: put page item (attribute_not_exists) + ADD run.completedPages 1
  6. conditional claim: completedPages + failedPages = totalPages
                        AND attribute_not_exists(aggregationClaimedAt)
     winner → send message to DocumentAnalysisAggregateQueue
  7. throttled progress mirror → Document.metadata.analysis.done
        │
        ▼
DocumentAnalysisAggregateQueue (SQS)            ──maxReceiveCount──▶ AggregateDLQ
        │  batchSize 1
        ▼
documentAnalysisAggregator (new Lambda)
  1. read all page results from S3
  2. dedupe vocabulary/questions (reuse dedupeVocabulary/toQuestion)
  3. document-level synthesis pass (summaries, objectives, concepts)
  4. create ParsedContent, AgentJob cost records
  5. Document.status = completed | failed (per failure policy, §6.5)
  6. run.status = completed; schedule S3 cleanup (lifecycle rule)
```

#### A.3.1 Why SQS (not direct async invoke, not Step Functions)

| Option | Decision | Reason |
|---|---|---|
| `InvocationType: Event` per page | Rejected | No backpressure against OpenAI; fixed 2 retries; no per-page DLQ visibility. |
| **SQS + Lambda event source mapping** | **Chosen** | `maxConcurrency` caps OpenAI pressure; per-message retry and DLQ; repo already uses `aws-sqs` and DLQ conventions. |
| Step Functions Distributed Map | Deferred | Strong fit for orchestration and aggregation, but adds a new service and IAM surface; revisit if multi-stage pipelines grow (§11). |

#### A.3.2 Why a CDK-defined run table instead of Amplify models

Fan-in needs an **atomic increment** and a **single-winner claim**. Amplify Data updates go through AppSync with `_version` optimistic locking; N concurrent workers updating one `Document` would conflict and retry-storm. A plain DynamoDB table (created in CDK, accessed with `@aws-sdk/client-dynamodb`) gives `ADD`, conditional writes, and `TransactWriteItems` without any GraphQL schema change. `Document` remains the user-facing record and receives throttled progress mirrors only.

### A.4. Components

| Component | Type | Location (proposed) | Notes |
|---|---|---|---|
| Planner | Existing Lambda | `amplify/functions/documentAnalysis/handler.ts` | Extract, segment, enqueue. The inline analysis code is removed once Phase 3 passes. |
| `documentAnalysisPageWorker` | New Lambda | `amplify/functions/documentAnalysisPageWorker/` | Timeout 600 s (sized for up to 4 sequential model calls plus 429 backoff), memory 1024 MB (headroom for page rendering), `OPENAI_API_KEY` secret. Queue visibility timeout 3600 s (6 × the worker timeout). |
| `documentAnalysisAggregator` | New Lambda | `amplify/functions/documentAnalysisAggregator/` | Timeout 900 s; may run hierarchical synthesis for very large documents. |
| `DocumentAnalysisPageQueue` + DLQ | SQS | `backend.ts`, same stack as the worker | Visibility timeout ≥ 6 × worker timeout (AWS guidance for Lambda ESM). |
| `DocumentAnalysisAggregateQueue` + DLQ | SQS | `backend.ts` | Decouples aggregation from worker lifetime; retries independently. |
| `DocumentAnalysisRuns` table | DynamoDB (CDK) | `backend.ts` | On-demand billing; TTL on `expiresAt`. |
| Shared analysis code | Module | `amplify/functions/documentAnalysis/analysis.ts` | Export page-level and reduce functions so planner, worker, and aggregator share prompts and validation. |

Stack placement: keep the queues, table, worker, and aggregator in the same resource group as `documentAnalysisHandler` (`data`) to avoid new cross-stack references. Verify against the phased bootstrap in `scripts/deploy-bootstrap.mjs` before deploying.

#### A.5.1 Page message (`DocumentAnalysisPageQueue`)

```json
{
  "v": 1,
  "runId": "uuid",
  "documentId": "uuid",
  "fileId": "uuid",
  "page": 12,
  "totalPages": 54,
  "profile": "exhaustive",
  "inputKey": "private/{identityId}/documents/{documentId}/analysis/{runId}/pages/0012.json",
  "traceparent": "00-…"
}
```

Page text lives in S3, not the message (SQS 256 KB limit). The page input object includes `text`, `pageNumber`, and neighbor context (`prevTail`, `nextHead`, each capped, e.g. 1,500 chars).

#### A.5.2 Run table items

| PK | SK | Attributes |
|---|---|---|
| `RUN#{runId}` | `META` | `documentId`, `status` (`running`/`cancelled`/`completed`/`failed`), `totalPages`, `completedPages`, `failedPages`, `profile`, `createdAt`, `aggregationClaimedAt?`, `expiresAt` |
| `RUN#{runId}` | `PAGE#0012` | `state` (`done`/`failed`), `resultKey`, `attempts`, `error?`, `tokens?` |

GSI not required; workers always know `runId`.

#### A.6.2 Idempotency (SQS is at-least-once)

- Result keys are deterministic per `(runId, page)`; overwriting is harmless.
- Counting is guarded by `TransactWriteItems` with `attribute_not_exists(SK)` on the page item, so redelivery never double-counts.
- Aggregation claim is a conditional update on `aggregationClaimedAt`; only one worker enqueues aggregation.
- Aggregator checks `run.status` and existing `ParsedContent` for the run before writing (guards aggregate-queue redelivery).

#### A.6.3 Concurrency and rate limits

**Starting point: `maxConcurrency: 5` on the page worker's event source mapping.**

- **Why 5:** today's code already runs 5 concurrent `gpt-4o` calls per document (`MAX_PARALLEL_BATCHES = 5`) without 429 storms, so 5 is a level we know works on the current account. The passes within a page run sequentially, so 5 workers means at most about 5 OpenAI calls in flight.
- **Event source mapping settings:** `batchSize: 1`, `reportBatchItemFailures: true`. Set the worker's reserved concurrency to the same value, so a misconfiguration can't exceed it. The minimum allowed `maxConcurrency` is 2.
- **Ramp rule:** double the value (5 → 10 → 20) only after a week in which the 429-retry rate stays under 1% of calls and DLQ depth stays at 0. Step back down if the 429 rate exceeds 5%.
- **Upper bound to sanity-check against the OpenAI tier:** `maxConcurrency ≈ (0.7 × TPM limit) / (tokens per call × calls per minute per worker)`. As a rough guide, a page costs about 3–6k tokens per pass and each worker makes about 3–4 calls a minute. The tier limits come from the OpenAI dashboard; they are not stored in the repo.
- Keep the existing in-call 429 backoff. After `MAX_RATE_LIMIT_RETRIES`, throw so SQS redelivers after the visibility timeout instead of the worker burning Lambda time.

#### A.6.5 Failure policy

- Worker detects final attempt via `ApproximateReceiveCount >= maxReceiveCount - 1`, records `PAGE#n state=failed`, increments `failedPages`, and acks so fan-in can still complete. The DLQ remains a backstop for poison messages (unparseable body, missing input object).
- Aggregation outcome:
  - `exhaustive`: any failed page → `Document.status = "failed"` with `metadata.analysis.failedPages = [...]` (preserves current semantics, but completed pages are retained for a later retry).
  - `standard`: aggregate available pages; `status = "completed"` with failed pages listed (matches today's silent `allSettled` behavior but now visible).

#### A.6.6 Cancellation and re-runs

- `cancelDocumentAnalysis` sets `run.status = cancelled` (conditional on `running`) and `Document.status = "cancelled"`.
- Workers check run status before OpenAI calls; queued messages drain as no-ops.
- A new `analyzeDocument` call creates a new `runId` and marks prior runs `superseded`; stale workers exit at step 1.
