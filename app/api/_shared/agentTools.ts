/**
 * Server-Side Agent Tools
 *
 * Tools with `execute` functions that run on the server during multi-step
 * agent loops. These tools enable RAG (retrieval-augmented generation),
 * student progress queries, and course navigation.
 *
 * All tools validate auth context before accessing data.
 */

import { tool } from "ai";
import { z } from "zod";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { pipeline, env } from "@huggingface/transformers";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "../../actions/embedding-constants";
import {
  loadBundleFromS3,
  searchBundle,
  hybridSearchBundle,
} from "./serverSearch";

const tracer = trace.getTracer("agent-tools", "1.0.0");

// --- Types ---

export interface AgentContext {
  userId: string;
  groups: string[];
  identityId?: string;
  unitId?: string;
  sectionId?: string;
  locale?: string;
  courseOutline?: Array<{
    unitId: string;
    name: string;
    number?: number;
    summary?: string;
    vocabularyCount?: number;
    questionCount?: number;
    fileCount?: number;
  }>;
}

// Cache resolved identityId for the duration of the request
let _resolvedIdentityId: string | null | undefined;

/**
 * Wrap a tool execute function with an OpenTelemetry span.
 * Spans appear in Phoenix under the "agent-tools" tracer.
 */
function withToolSpan<TParams, TResult>(
  toolName: string,
  fn: (params: TParams) => Promise<TResult>,
): (params: TParams) => Promise<TResult> {
  return async (params: TParams) => {
    return tracer.startActiveSpan(`tool.${toolName}`, async (span) => {
      span.setAttribute("tool.name", toolName);
      span.setAttribute("tool.parameters", JSON.stringify(params));
      try {
        const result = await fn(params);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  };
}

/**
 * Resolve the identityId for search bundle paths.
 * Falls back to looking up the unit owner's identityId from the database.
 */
async function resolveIdentityId(ctx: AgentContext): Promise<string | null> {
  if (ctx.identityId) return ctx.identityId;
  if (_resolvedIdentityId !== undefined) return _resolvedIdentityId;

  if (ctx.unitId) {
    try {
      const { getServerClient } = await import("@/utils/amplifyServerClient");
      const client = getServerClient();
      const { data: unit } = await (client as any).models.Unit.get(
        { id: ctx.unitId },
        { selectionSet: ["id", "identityId"] },
      );
      _resolvedIdentityId = unit?.identityId ?? null;
      return _resolvedIdentityId as string | null;
    } catch {
      _resolvedIdentityId = null;
      return null;
    }
  }

  _resolvedIdentityId = null;
  return null;
}

/**
 * Resolve search bundle paths for shared (collaborator) units.
 * Queries CollaboratorAccess for the current user, then builds bundle paths
 * using each shared unit's owner identityId.
 */
async function resolveSharedBundlePaths(ctx: AgentContext): Promise<string[]> {
  try {
    const { getServerClient } = await import("@/utils/amplifyServerClient");
    const client = getServerClient();

    // Find all units shared with this user
    const { data: grants } = await (
      client as any
    ).models.CollaboratorAccess.list({
      filter: { collaboratorId: { eq: ctx.userId } },
      selectionSet: ["id", "unitID"],
    });

    if (!grants || grants.length === 0) return [];

    // Fetch the unit identityIds to build S3 paths
    const paths: string[] = [];
    for (const grant of grants) {
      try {
        const { data: unit } = await (client as any).models.Unit.get(
          { id: grant.unitID },
          { selectionSet: ["id", "identityId"] },
        );
        if (unit?.identityId) {
          paths.push(
            `protected/${unit.identityId}/search-index/unit/${unit.id}.json`,
          );
        }
      } catch {
        // Skip units that can't be fetched
      }
    }

    return paths;
  } catch (error) {
    console.warn("[resolveSharedBundlePaths] Error:", error);
    return [];
  }
}

// --- Embedding Helper ---

// Singleton translation cache per locale
const translationCache: Record<string, Record<string, any>> = {};

/**
 * Load agent tool translations for the given locale.
 * Falls back to English if the locale file is unavailable.
 */
async function getAgentTranslations(
  locale: string = "en",
): Promise<(key: string) => string> {
  if (!translationCache[locale]) {
    try {
      translationCache[locale] = (
        await import(`../../../public/locales/${locale}/agentTools.json`)
      ).default;
    } catch {
      if (locale !== "en") {
        try {
          translationCache[locale] = (
            await import(`../../../public/locales/en/agentTools.json`)
          ).default;
        } catch {
          translationCache[locale] = {};
        }
      } else {
        translationCache[locale] = {};
      }
    }
  }

  const messages = translationCache[locale];

  return (key: string): string => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) {
      value = value?.[part];
    }
    return typeof value === "string" ? value : key;
  };
}

// Singleton pipeline cached across requests in the same server instance
let agentEmbeddingPipeline: any = null;

async function getAgentEmbeddingPipeline() {
  if (agentEmbeddingPipeline) return agentEmbeddingPipeline;
  env.allowLocalModels = false;
  agentEmbeddingPipeline = await pipeline(
    "feature-extraction",
    EMBEDDING_MODEL,
    { dtype: "q8" },
  );
  return agentEmbeddingPipeline;
}

async function embedQuery(text: string, _apiKey: string): Promise<number[]> {
  const pipe = await getAgentEmbeddingPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array).slice(0, EMBEDDING_DIMENSIONS);
}

// --- Tool Factories ---
// Each function returns a tool({ ... }) with execute bound to the request context.

export function createSemanticSearchTool(ctx: AgentContext, apiKey: string) {
  return tool({
    description:
      "Search course content using semantic similarity. Returns relevant units, vocabulary words, questions, and documents ranked by relevance. Use this to find specific information before answering questions about course material.",
    inputSchema: z.object({
      query: z.string().describe("The search query text"),
      scope: z
        .enum(["unit", "section", "all", "shared", "platform"])
        .default("unit")
        .describe(
          "Search scope: 'unit' for current unit only, 'section' for all units in the section, 'all' for everything owned by user, 'shared' for collaborator units, 'platform' for admin platform-wide search",
        ),
      limit: z
        .number()
        .default(5)
        .describe("Maximum number of results to return"),
    }),
    execute: async ({
      query,
      scope,
      limit,
    }: {
      query: string;
      scope: string;
      limit: number;
    }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const queryEmbedding = await embedQuery(query, apiKey);
        const identityId = await resolveIdentityId(ctx);

        if (!identityId) {
          return {
            results: [],
            message: t("semanticSearch.noIdentity"),
          };
        }

        // Determine which bundles to search
        const bundlePaths: string[] = [];
        if (scope === "unit" && ctx.unitId) {
          bundlePaths.push(
            `protected/${identityId}/search-index/unit/${ctx.unitId}.json`,
          );
        } else if (scope === "section" && ctx.courseOutline) {
          for (const entry of ctx.courseOutline) {
            bundlePaths.push(
              `protected/${identityId}/search-index/unit/${entry.unitId}.json`,
            );
          }
        } else if (scope === "shared") {
          // Search collaborator units — load bundles for each shared unit
          const sharedBundles = await resolveSharedBundlePaths(ctx);
          bundlePaths.push(...sharedBundles);
        } else if (
          scope === "platform" &&
          ctx.groups.some((g) => g === "Admins")
        ) {
          // Admin-only: platform-wide search bundle
          bundlePaths.push(`private/platform/search-index/platform.json`);
        } else {
          bundlePaths.push(
            `private/${identityId}/search-index/instructor.json`,
          );
        }

        if (bundlePaths.length === 0) {
          return {
            results: [],
            message: t("semanticSearch.noIndex"),
          };
        }

        // Load and search bundles
        const allResults: Array<{
          id: string;
          type: string;
          title: string;
          preview?: string;
          score: number;
          unitId?: string;
        }> = [];

        for (const path of bundlePaths) {
          const bundle = await loadBundleFromS3(path);
          if (!bundle) continue;

          const results = hybridSearchBundle(
            queryEmbedding,
            query,
            bundle,
            limit,
            0.3,
          );
          for (const r of results) {
            allResults.push({
              id: r.item.id,
              type: r.item.type,
              title: r.item.title,
              preview: r.item.meta.preview?.substring(0, 500),
              score: Math.round(r.score * 100) / 100,
              unitId: r.item.meta.unitId,
            });
          }
        }

        // Sort by score, deduplicate by id, truncate
        const seen = new Set<string>();
        const deduplicated = allResults
          .sort((a, b) => b.score - a.score)
          .filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          })
          .slice(0, limit);

        return {
          results: deduplicated,
          totalMatched: deduplicated.length,
        };
      } catch (error: any) {
        console.error("[semantic_search] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return {
          results: [],
          error: t("semanticSearch.error"),
        };
      }
    },
  });
}

export function createReadFileContentTool(
  ctx: AgentContext,
  toolResultBudget?: number,
) {
  // Budget in characters (4 chars ≈ 1 token); default 6000 chars
  const charLimit = toolResultBudget ? toolResultBudget * 4 : 6000;

  return tool({
    description:
      "Read the extracted text content of a file (PDF transcript, document summary, etc.). Use after semantic_search finds a relevant file to get its full content.",
    inputSchema: z.object({
      fileId: z.string().describe("The file ID to read content from"),
    }),
    execute: async ({ fileId }: { fileId: string }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        // Fetch ParsedContent for this file (contains extracted text)
        const { data: parsedContents } = await (
          client as any
        ).models.ParsedContent.list({
          filter: { fileID: { eq: fileId } },
          limit: 1,
        });

        if (!parsedContents?.length) {
          return {
            content: null,
            message: t("readFileContent.noContent"),
          };
        }

        const parsed = parsedContents[0];
        const result: Record<string, any> = { fileId };

        if (parsed.fullText) {
          result.fullText = parsed.fullText.substring(0, charLimit);
          if (parsed.fullText.length > charLimit) {
            result.truncated = true;
            result.totalLength = parsed.fullText.length;
          }
        }

        if (parsed.summariesJSON) {
          try {
            result.summaries = JSON.parse(parsed.summariesJSON);
          } catch {
            // ignore parse errors
          }
        }

        if (parsed.vocabularyJSON) {
          try {
            const vocab = JSON.parse(parsed.vocabularyJSON);
            result.extractedVocabulary = Array.isArray(vocab)
              ? vocab.slice(0, 20)
              : vocab;
          } catch {
            // ignore parse errors
          }
        }

        return result;
      } catch (error: any) {
        console.error("[read_file_content] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { content: null, error: t("readFileContent.error") };
      }
    },
  });
}

export function createGetStudentProgressTool(ctx: AgentContext) {
  return tool({
    description:
      "Get the student's grade progress for the current unit or a specific unit. Shows completion status, accuracy, and attempt count.",
    inputSchema: z.object({
      unitId: z
        .string()
        .optional()
        .describe("Unit ID to check progress for. Defaults to current unit."),
      studentId: z
        .string()
        .optional()
        .describe(
          "Student ID (instructors only). Omit to get the current user's progress.",
        ),
    }),
    execute: async ({
      unitId,
      studentId,
    }: {
      unitId?: string;
      studentId?: string;
    }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        // Students can only see their own progress
        const isInstructor = ctx.groups.some(
          (g) => g === "Instructors" || g === "Admins" || g === "Moderators",
        );

        const targetUserId = isInstructor && studentId ? studentId : ctx.userId;
        const targetUnitId = unitId || ctx.unitId;

        if (!targetUnitId) {
          return { error: t("studentProgress.noUnit") };
        }

        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        const { data: grades } = await (client as any).models.Grade.list({
          filter: {
            unitID: { eq: targetUnitId },
            owner: { contains: targetUserId },
          },
          limit: 10,
        });

        if (!grades?.length) {
          return {
            unitId: targetUnitId,
            hasAttempts: false,
            message: t("studentProgress.noGrades"),
          };
        }

        const validGrades = grades.filter((g: any) => g != null);
        const completed = validGrades.filter((g: any) => g.complete);
        const inProgress = validGrades.find((g: any) => !g.complete);

        return {
          unitId: targetUnitId,
          hasAttempts: true,
          totalAttempts: validGrades.length,
          completedAttempts: completed.length,
          currentAttempt: inProgress
            ? {
                complete: false,
                accuracy: inProgress.accuracy || 0,
                percentComplete: inProgress.percentComplete || 0,
              }
            : null,
          bestAccuracy: completed.length
            ? Math.max(...completed.map((g: any) => g.accuracy || 0))
            : null,
          latestAccuracy: completed.length
            ? completed.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0]?.accuracy || 0
            : null,
        };
      } catch (error: any) {
        console.error("[get_student_progress] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { error: t("studentProgress.error") };
      }
    },
  });
}

export function createGetCourseOutlineTool(ctx: AgentContext) {
  return tool({
    description:
      "Get the full course outline showing all chapters/units in the section with summaries, vocabulary counts, and the current unit marked. Use to understand course structure and progression.",
    inputSchema: z.object({
      sectionId: z
        .string()
        .optional()
        .describe(
          "Section ID to get outline for. Defaults to current section.",
        ),
    }),
    execute: async ({ sectionId }: { sectionId?: string }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const targetSectionId = sectionId || ctx.sectionId;

        if (!targetSectionId) {
          // Fall back to context courseOutline if available
          if (ctx.courseOutline?.length) {
            return {
              source: "context",
              currentUnitId: ctx.unitId,
              outline: ctx.courseOutline.map((entry) => ({
                ...entry,
                isCurrent: entry.unitId === ctx.unitId,
              })),
            };
          }
          return { error: t("courseOutline.noSection") };
        }

        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        const { data: section } = await (client as any).models.Section.get(
          { id: targetSectionId },
          {
            selectionSet: ["id", "name", "courseOutline"],
          },
        );

        if (!section?.courseOutline) {
          return {
            sectionId: targetSectionId,
            sectionName: section?.name,
            outline: [],
            message: t("courseOutline.noOutline"),
          };
        }

        const outline = Array.isArray(section.courseOutline)
          ? section.courseOutline
          : typeof section.courseOutline === "string"
            ? JSON.parse(section.courseOutline)
            : [];

        return {
          sectionId: targetSectionId,
          sectionName: section.name,
          currentUnitId: ctx.unitId,
          outline: outline.map((entry: any) => ({
            ...entry,
            isCurrent: entry.unitId === ctx.unitId,
          })),
        };
      } catch (error: any) {
        console.error("[get_course_outline] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { error: t("courseOutline.error") };
      }
    },
  });
}

/**
 * Options for building agent tools.
 */
export interface BuildAgentToolsOptions {
  /** Max tokens per tool result (used to truncate large responses). */
  toolResultBudget?: number;
}

/**
 * Build all server-side agent tools for a request, bound to auth context.
 * Each tool's execute function is wrapped with an OTel span for Phoenix tracing.
 */
export function buildAgentTools(
  ctx: AgentContext,
  apiKey: string,
  options?: BuildAgentToolsOptions,
): Record<string, ReturnType<typeof tool>> {
  const tools: Record<string, any> = {
    semantic_search: createSemanticSearchTool(ctx, apiKey),
    read_file_content: createReadFileContentTool(
      ctx,
      options?.toolResultBudget,
    ),
    get_student_progress: createGetStudentProgressTool(ctx),
    get_course_outline: createGetCourseOutlineTool(ctx),
    recall_memory: createRecallMemoryTool(ctx),
    recall_conversations: createRecallConversationsTool(ctx, apiKey),
    update_memory: createUpdateMemoryTool(ctx),
  };

  // Instructor-only analytics tools
  const isInstructor = ctx.groups.some(
    (g) => g === "Instructors" || g === "Admins" || g === "Moderators",
  );
  if (isInstructor) {
    tools.get_section_analytics = createGetSectionAnalyticsTool(ctx);
    tools.get_student_list = createGetStudentListTool(ctx);
  }

  // Wrap each tool's execute with an OTel span for Phoenix trace visibility
  for (const [name, t] of Object.entries(tools)) {
    const originalExecute = (t as any).execute;
    if (typeof originalExecute === "function") {
      (t as any).execute = withToolSpan(name, originalExecute);
    }
  }

  return tools;
}

/** Agent tool names for persona filtering */
export const AGENT_TOOL_NAMES = [
  "semantic_search",
  "read_file_content",
  "get_student_progress",
  "get_course_outline",
  "recall_memory",
  "recall_conversations",
  "update_memory",
  "get_section_analytics",
  "get_student_list",
];

// ─── Memory Tools ─────────────────────────────────────────────────────────────

export function createRecallMemoryTool(ctx: AgentContext) {
  return tool({
    description:
      "Recall conversation memory for this student/unit. Returns the rolling summary of past conversations, accumulated learning insights, and topics previously discussed. Use this when a student says 'what did we talk about last time?' or when you want to personalize your response based on their history.",
    inputSchema: z.object({
      unitId: z
        .string()
        .optional()
        .describe("Unit ID to recall memory for. Defaults to current unit."),
    }),
    execute: async ({ unitId }: { unitId?: string }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        const targetUnitId = unitId || ctx.unitId;

        // Look for a memory record for this user + unit
        const filter: Record<string, any> = {
          type: { eq: "memory" },
        };
        if (targetUnitId) {
          filter.unitID = { eq: targetUnitId };
        }

        const { data: memories } = await (
          client as any
        ).models.AssistantChat.list({
          filter,
          limit: 5,
        });

        if (!memories?.length) {
          return {
            hasMemory: false,
            message: t("recallMemory.noHistory"),
          };
        }

        // Find the best match (prefer unit-scoped, then section-scoped)
        const memory =
          memories.find(
            (m: any) => m?.unitID === targetUnitId && m?.type === "memory",
          ) || memories.find((m: any) => m?.type === "memory");

        if (!memory) {
          return {
            hasMemory: false,
            message: t("recallMemory.noMemory"),
          };
        }

        const result: Record<string, any> = {
          hasMemory: true,
          unitId: memory.unitID,
          sectionId: memory.sectionID,
        };

        if (memory.summary) {
          result.summary = memory.summary;
        }

        if (memory.insights) {
          try {
            result.insights =
              typeof memory.insights === "string"
                ? JSON.parse(memory.insights)
                : memory.insights;
          } catch {
            // ignore
          }
        }

        if (memory.topicsDiscussed) {
          try {
            result.topicsDiscussed =
              typeof memory.topicsDiscussed === "string"
                ? JSON.parse(memory.topicsDiscussed)
                : memory.topicsDiscussed;
          } catch {
            // ignore
          }
        }

        return result;
      } catch (error: any) {
        console.error("[recall_memory] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { hasMemory: false, error: t("recallMemory.error") };
      }
    },
  });
}

export function createUpdateMemoryTool(ctx: AgentContext) {
  return tool({
    description:
      "Record a learning insight or topic discussed during this conversation. Use this when the student demonstrates understanding of a concept, reveals a misconception, or when you want to note a topic for future reference. Do NOT call this every turn — only when there is a genuinely noteworthy insight to remember.",
    inputSchema: z.object({
      topic: z
        .string()
        .describe("Short topic label (e.g., 'past tense conjugation')"),
      insight: z
        .string()
        .describe(
          "What was learned or observed (e.g., 'Student confused te-form with ta-form but self-corrected after hint')",
        ),
      wasResolved: z
        .boolean()
        .default(false)
        .describe("Whether the student resolved their confusion on this topic"),
    }),
    execute: async ({
      topic,
      insight,
      wasResolved,
    }: {
      topic: string;
      insight: string;
      wasResolved: boolean;
    }) => {
      try {
        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        const targetUnitId = ctx.unitId;

        // Find or create memory record for this user + unit
        const filter: Record<string, any> = {
          type: { eq: "memory" },
        };
        if (targetUnitId) {
          filter.unitID = { eq: targetUnitId };
        }

        const { data: existing } = await (
          client as any
        ).models.AssistantChat.list({
          filter,
          limit: 5,
        });

        const memory = existing?.find(
          (m: any) => m?.unitID === targetUnitId && m?.type === "memory",
        );

        const now = new Date().toISOString();
        const newInsight = {
          topic,
          insight,
          wasResolved,
          updatedAt: now,
        };

        if (memory) {
          // Update existing memory record
          let insights: any[] = [];
          try {
            insights =
              typeof memory.insights === "string"
                ? JSON.parse(memory.insights)
                : memory.insights || [];
          } catch {
            insights = [];
          }

          // Replace existing insight for same topic, or append
          const existingIdx = insights.findIndex((i: any) => i.topic === topic);
          if (existingIdx >= 0) {
            insights[existingIdx] = newInsight;
          } else {
            insights.push(newInsight);
          }

          // Keep only last 20 insights
          if (insights.length > 20) {
            insights = insights.slice(-20);
          }

          // Update topics discussed
          let topicsDiscussed: any[] = [];
          try {
            topicsDiscussed =
              typeof memory.topicsDiscussed === "string"
                ? JSON.parse(memory.topicsDiscussed)
                : memory.topicsDiscussed || [];
          } catch {
            topicsDiscussed = [];
          }

          const topicIdx = topicsDiscussed.findIndex(
            (t: any) => t.topic === topic,
          );
          if (topicIdx >= 0) {
            topicsDiscussed[topicIdx] = {
              ...topicsDiscussed[topicIdx],
              lastDiscussedAt: now,
              depth: (topicsDiscussed[topicIdx].depth || 0) + 1,
              wasResolved,
            };
          } else {
            topicsDiscussed.push({
              topic,
              lastDiscussedAt: now,
              depth: 1,
              wasResolved,
            });
          }

          await (client as any).models.AssistantChat.update({
            id: memory.id,
            insights: JSON.stringify(insights),
            topicsDiscussed: JSON.stringify(topicsDiscussed),
            _version: memory._version,
          });

          return {
            success: true,
            action: "updated",
            topic,
            totalInsights: insights.length,
          };
        } else {
          // Create new memory record
          await (client as any).models.AssistantChat.create({
            type: "memory",
            unitID: targetUnitId || undefined,
            sectionID: ctx.sectionId || undefined,
            insights: JSON.stringify([newInsight]),
            topicsDiscussed: JSON.stringify([
              {
                topic,
                lastDiscussedAt: now,
                depth: 1,
                wasResolved,
              },
            ]),
          });

          return {
            success: true,
            action: "created",
            topic,
            totalInsights: 1,
          };
        }
      } catch (error: any) {
        console.error("[update_memory] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { success: false, error: t("updateMemory.error") };
      }
    },
  });
}

// ─── Conversation Recall Tool ─────────────────────────────────────────────────

export function createRecallConversationsTool(
  ctx: AgentContext,
  apiKey: string,
) {
  return tool({
    description:
      "Search past conversation summaries to recall what was previously discussed with this student across different units and sessions. Use when the student references something from a previous session or when you need context about past interactions.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "What to search for in past conversations (topic, concept, question)",
        ),
      limit: z
        .number()
        .default(3)
        .describe("Maximum number of past conversations to return"),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        // Fetch memory records for this user/section
        const filter: Record<string, any> = {
          type: { eq: "memory" },
        };
        if (ctx.sectionId) {
          filter.sectionID = { eq: ctx.sectionId };
        }

        const { data: memories } = await (
          client as any
        ).models.AssistantChat.list({
          filter,
          limit: 50,
          selectionSet: [
            "id",
            "unitID",
            "sectionID",
            "summary",
            "topicsDiscussed",
            "insights",
            "embedding",
            "updatedAt",
          ],
        });

        if (!memories?.length) {
          return {
            conversations: [],
            message: t("recallConversations.noHistory"),
          };
        }

        const validMemories = memories.filter(
          (m: any) => m != null && (m.summary || m.topicsDiscussed),
        );

        if (!validMemories.length) {
          return {
            conversations: [],
            message: t("recallConversations.noSummaries"),
          };
        }

        // If embeddings are available, use semantic similarity
        const memoriesWithEmbeddings = validMemories.filter(
          (m: any) =>
            m.embedding && Array.isArray(m.embedding) && m.embedding.length > 0,
        );

        let ranked: Array<{ memory: any; score: number }>;

        if (memoriesWithEmbeddings.length > 0) {
          const queryEmbedding = await embedQuery(query, apiKey);

          ranked = memoriesWithEmbeddings.map((m: any) => {
            const emb = m.embedding as number[];
            let dot = 0,
              normA = 0,
              normB = 0;
            for (
              let i = 0;
              i < Math.min(queryEmbedding.length, emb.length);
              i++
            ) {
              dot += queryEmbedding[i] * emb[i];
              normA += queryEmbedding[i] ** 2;
              normB += emb[i] ** 2;
            }
            const score =
              normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
            return { memory: m, score };
          });

          ranked.sort((a, b) => b.score - a.score);
        } else {
          // Fallback: keyword matching
          const queryLower = query.toLowerCase();
          const queryTerms = queryLower
            .split(/\s+/)
            .filter((t: string) => t.length > 2);

          ranked = validMemories.map((m: any) => {
            const text =
              `${m.summary || ""} ${m.topicsDiscussed || ""}`.toLowerCase();
            const matches = queryTerms.filter((t: string) =>
              text.includes(t),
            ).length;
            const score =
              queryTerms.length > 0 ? matches / queryTerms.length : 0;
            return { memory: m, score };
          });

          ranked.sort((a, b) => b.score - a.score);
        }

        const topResults = ranked.slice(0, limit).filter((r) => r.score > 0.1);

        const conversations = topResults.map((r) => {
          const m = r.memory;
          const result: Record<string, any> = {
            unitId: m.unitID,
            score: Math.round(r.score * 100) / 100,
          };

          if (m.summary) result.summary = m.summary;

          if (m.topicsDiscussed) {
            try {
              result.topics =
                typeof m.topicsDiscussed === "string"
                  ? JSON.parse(m.topicsDiscussed)
                  : m.topicsDiscussed;
            } catch {
              // ignore
            }
          }

          if (m.insights) {
            try {
              result.insights =
                typeof m.insights === "string"
                  ? JSON.parse(m.insights)
                  : m.insights;
            } catch {
              // ignore
            }
          }

          if (m.updatedAt) result.lastUpdated = m.updatedAt;

          return result;
        });

        return {
          conversations,
          totalSearched: validMemories.length,
        };
      } catch (error: any) {
        console.error("[recall_conversations] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return {
          conversations: [],
          error: t("recallConversations.error"),
        };
      }
    },
  });
}

// ─── Instructor Analytics Tools ───────────────────────────────────────────────

export function createGetSectionAnalyticsTool(ctx: AgentContext) {
  return tool({
    description:
      "Get aggregated analytics for a class section: average accuracy, completion rates, common struggles, and grade distributions. Instructor-only.",
    inputSchema: z.object({
      sectionId: z
        .string()
        .optional()
        .describe("Section ID. Defaults to current section."),
    }),
    execute: async ({ sectionId }: { sectionId?: string }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const isInstructor = ctx.groups.some(
          (g) => g === "Instructors" || g === "Admins" || g === "Moderators",
        );
        if (!isInstructor) {
          return { error: t("sectionAnalytics.instructorOnly") };
        }

        const targetSectionId = sectionId || ctx.sectionId;
        if (!targetSectionId) {
          return {
            error: t("sectionAnalytics.noSection"),
          };
        }

        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        // Get assignments for the section to find unit IDs
        const { data: assignments } = await (
          client as any
        ).models.Assignment.list({
          filter: { sectionID: { eq: targetSectionId } },
          limit: 50,
        });

        const validAssignments = (assignments || []).filter(
          (a: any) => a != null && a.unitID,
        );

        if (!validAssignments.length) {
          return {
            sectionId: targetSectionId,
            message: t("sectionAnalytics.noAssignments"),
            totalAssignments: 0,
          };
        }

        // Fetch grades for all assigned units
        const unitIds = [
          ...new Set(validAssignments.map((a: any) => a.unitID)),
        ];
        const allGrades: any[] = [];

        for (const unitId of unitIds.slice(0, 10)) {
          // Cap at 10 units for performance
          const { data: grades } = await (client as any).models.Grade.list({
            filter: { unitID: { eq: unitId } },
            limit: 100,
          });
          const valid = (grades || []).filter((g: any) => g != null);
          allGrades.push(...valid.map((g: any) => ({ ...g, unitID: unitId })));
        }

        if (!allGrades.length) {
          return {
            sectionId: targetSectionId,
            totalAssignments: validAssignments.length,
            totalGrades: 0,
            message: t("sectionAnalytics.noGrades"),
          };
        }

        // Compute analytics
        const completed = allGrades.filter((g: any) => g.complete);
        const accuracies = completed
          .map((g: any) => g.accuracy)
          .filter((a: any) => a != null && a > 0);
        const avgAccuracy = accuracies.length
          ? Math.round(
              accuracies.reduce((s: number, v: number) => s + v, 0) /
                accuracies.length,
            )
          : null;

        // Struggles: units with lowest avg accuracy
        const unitAccuracies: Record<
          string,
          { total: number; count: number; unitName?: string }
        > = {};
        for (const g of completed) {
          if (g.accuracy == null) continue;
          if (!unitAccuracies[g.unitID]) {
            unitAccuracies[g.unitID] = { total: 0, count: 0 };
          }
          unitAccuracies[g.unitID].total += g.accuracy;
          unitAccuracies[g.unitID].count += 1;
        }

        const unitAvgs = Object.entries(unitAccuracies)
          .map(([unitId, data]) => ({
            unitId,
            avgAccuracy: Math.round(data.total / data.count),
            attempts: data.count,
          }))
          .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

        // Unique students
        const uniqueStudents = new Set(
          allGrades.map((g: any) => g.owner).filter(Boolean),
        );

        return {
          sectionId: targetSectionId,
          totalAssignments: validAssignments.length,
          totalGrades: allGrades.length,
          completedGrades: completed.length,
          uniqueStudents: uniqueStudents.size,
          averageAccuracy: avgAccuracy,
          completionRate: allGrades.length
            ? Math.round((completed.length / allGrades.length) * 100)
            : 0,
          lowestPerformingUnits: unitAvgs.slice(0, 3),
          highestPerformingUnits: unitAvgs.slice(-3).reverse(),
        };
      } catch (error: any) {
        console.error("[get_section_analytics] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { error: t("sectionAnalytics.error") };
      }
    },
  });
}

export function createGetStudentListTool(ctx: AgentContext) {
  return tool({
    description:
      "Get a list of students in a section with their progress summary (grade count, average accuracy, latest activity). Instructor-only.",
    inputSchema: z.object({
      sectionId: z
        .string()
        .optional()
        .describe("Section ID. Defaults to current section."),
      unitId: z
        .string()
        .optional()
        .describe("Filter to a specific unit's grades."),
    }),
    execute: async ({
      sectionId,
      unitId,
    }: {
      sectionId?: string;
      unitId?: string;
    }) => {
      try {
        const t = await getAgentTranslations(ctx.locale);
        const isInstructor = ctx.groups.some(
          (g) => g === "Instructors" || g === "Admins" || g === "Moderators",
        );
        if (!isInstructor) {
          return { error: t("studentList.instructorOnly") };
        }

        const targetSectionId = sectionId || ctx.sectionId;
        if (!targetSectionId) {
          return { error: t("studentList.noSection") };
        }

        const { getServerClient } = await import("@/utils/amplifyServerClient");
        const client = getServerClient();

        // Get assignments for the section
        const { data: assignments } = await (
          client as any
        ).models.Assignment.list({
          filter: { sectionID: { eq: targetSectionId } },
          limit: 50,
        });

        const validAssignments = (assignments || []).filter(
          (a: any) => a != null && a.unitID,
        );

        const unitIds = unitId
          ? [unitId]
          : [...new Set(validAssignments.map((a: any) => a.unitID))];

        // Fetch grades grouped by student
        const studentMap: Record<
          string,
          {
            grades: number;
            completed: number;
            totalAccuracy: number;
            accuracyCount: number;
            latestAt: string;
          }
        > = {};

        for (const uid of unitIds.slice(0, 10)) {
          const { data: grades } = await (client as any).models.Grade.list({
            filter: { unitID: { eq: uid } },
            limit: 200,
          });

          for (const g of (grades || []).filter((g: any) => g != null)) {
            const student = g.owner || "unknown";
            if (!studentMap[student]) {
              studentMap[student] = {
                grades: 0,
                completed: 0,
                totalAccuracy: 0,
                accuracyCount: 0,
                latestAt: "",
              };
            }
            const s = studentMap[student];
            s.grades += 1;
            if (g.complete) s.completed += 1;
            if (g.accuracy != null && g.accuracy > 0) {
              s.totalAccuracy += g.accuracy;
              s.accuracyCount += 1;
            }
            if (g.createdAt && g.createdAt > s.latestAt) {
              s.latestAt = g.createdAt;
            }
          }
        }

        const students = Object.entries(studentMap)
          .map(([studentId, data]) => ({
            studentId,
            totalGrades: data.grades,
            completedGrades: data.completed,
            avgAccuracy: data.accuracyCount
              ? Math.round(data.totalAccuracy / data.accuracyCount)
              : null,
            lastActivity: data.latestAt || null,
          }))
          .sort((a, b) => (a.avgAccuracy ?? 0) - (b.avgAccuracy ?? 0));

        return {
          sectionId: targetSectionId,
          unitFilter: unitId || "all",
          totalStudents: students.length,
          students: students.slice(0, 50), // Cap at 50
        };
      } catch (error: any) {
        console.error("[get_student_list] Error:", error);
        const t = await getAgentTranslations(ctx.locale);
        return { error: t("studentList.error") };
      }
    },
  });
}
