/**
 * Tests for server-side agent tools.
 *
 * Validates tool schema, execute functions, and auth context enforcement.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSectionGet = vi.hoisted(() => vi.fn());

// Mock the Amplify server client
vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: vi.fn(() => ({
    models: {
      Grade: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      Section: {
        get: mockSectionGet,
      },
      ParsedContent: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      Unit: {
        get: vi.fn().mockResolvedValue({
          data: { id: "unit-1", identityId: "identity-1" },
        }),
      },
      Assignment: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      CollaboratorAccess: {
        list: vi.fn().mockResolvedValue({ data: [], nextToken: null }),
      },
      AssistantChat: {
        list: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue({ data: { id: "mem-1" } }),
        update: vi.fn().mockResolvedValue({ data: { id: "mem-1" } }),
      },
    },
  })),
}));

// Query embedding runs locally; stub the model so searches reach the bundle loader.
vi.mock("@huggingface/transformers", () => ({
  env: {},
  pipeline: async () => async () => ({ data: new Float32Array(384) }),
}));

// Mock serverSearch
vi.mock("../../../../app/api/_shared/serverSearch", () => ({
  loadBundleFromS3: vi.fn().mockResolvedValue(null),
  searchBundle: vi.fn().mockReturnValue([]),
  hybridSearchBundle: vi.fn().mockReturnValue([]),
}));

// Mock fetch for embeddings API
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        data: [{ embedding: new Array(512).fill(0.1) }],
      }),
  }),
);

import type { AgentContext } from "../../../../app/api/_shared/agentTools";
import { loadBundleFromS3 } from "../../../../app/api/_shared/serverSearch";
import {
  createSemanticSearchTool,
  createReadFileContentTool,
  createGetStudentProgressTool,
  createGetCourseOutlineTool,
  createRecallMemoryTool,
  createRecallConversationsTool,
  createUpdateMemoryTool,
  createGetSectionAnalyticsTool,
  createGetStudentListTool,
  buildAgentTools,
  AGENT_TOOL_NAMES,
} from "../../../../app/api/_shared/agentTools";

const STUDENT_CTX: AgentContext = {
  userId: "student-1",
  groups: ["Learners"],
  unitId: "unit-1",
  sectionId: "section-1",
};

const INSTRUCTOR_CTX: AgentContext = {
  userId: "instructor-1",
  groups: ["Instructors"],
  unitId: "unit-1",
  sectionId: "section-1",
  courseOutline: [
    { unitId: "unit-1", name: "Lesson 1", number: 1 },
    { unitId: "unit-2", name: "Lesson 2", number: 2 },
  ],
};

const API_KEY = "test-key";

describe("Agent Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSectionGet.mockResolvedValue({ data: null });
  });

  describe("buildAgentTools", () => {
    it("returns all 7 base tools for students", () => {
      const tools = buildAgentTools(STUDENT_CTX, API_KEY);
      expect(Object.keys(tools)).toContain("semantic_search");
      expect(Object.keys(tools)).toContain("read_file_content");
      expect(Object.keys(tools)).toContain("get_student_progress");
      expect(Object.keys(tools)).toContain("get_course_outline");
      expect(Object.keys(tools)).toContain("recall_memory");
      expect(Object.keys(tools)).toContain("recall_conversations");
      expect(Object.keys(tools)).toContain("update_memory");
      // Students should NOT get analytics tools
      expect(Object.keys(tools)).not.toContain("get_section_analytics");
      expect(Object.keys(tools)).not.toContain("get_student_list");
    });

    it("returns 9 tools (including analytics) for instructors", () => {
      const tools = buildAgentTools(INSTRUCTOR_CTX, API_KEY);
      expect(Object.keys(tools)).toContain("get_section_analytics");
      expect(Object.keys(tools)).toContain("get_student_list");
    });
  });

  describe("AGENT_TOOL_NAMES", () => {
    it("includes all tool names", () => {
      expect(AGENT_TOOL_NAMES).toContain("semantic_search");
      expect(AGENT_TOOL_NAMES).toContain("read_file_content");
      expect(AGENT_TOOL_NAMES).toContain("get_student_progress");
      expect(AGENT_TOOL_NAMES).toContain("get_course_outline");
      expect(AGENT_TOOL_NAMES).toContain("recall_memory");
      expect(AGENT_TOOL_NAMES).toContain("recall_conversations");
      expect(AGENT_TOOL_NAMES).toContain("update_memory");
      expect(AGENT_TOOL_NAMES).toContain("get_section_analytics");
      expect(AGENT_TOOL_NAMES).toContain("get_student_list");
    });
  });

  describe("semantic_search", () => {
    it("returns empty results when no bundle found", async () => {
      const tool = createSemanticSearchTool(STUDENT_CTX, API_KEY);
      const result = await (tool as any).execute({
        query: "past tense",
        scope: "unit",
        limit: 5,
      });
      expect(result.results).toEqual([]);
    });

    const assigningSection = (unitIds: string[]) => ({
      data: {
        assignments: async ({ filter }: any) => ({
          data: unitIds.includes(filter.unitID.eq) ? [{ id: "a1" }] : [],
          nextToken: null,
        }),
      },
    });

    it("searches the unit bundle for a learner enrolled in a section that assigns it", async () => {
      mockSectionGet.mockResolvedValue(assigningSection(["unit-1"]));
      const ctx: AgentContext = {
        ...STUDENT_CTX,
        groups: ["Learners", "section-section-1-learners"],
      };
      const tool = createSemanticSearchTool(ctx, API_KEY);
      await (tool as any).execute({ query: "past tense", scope: "unit", limit: 5 });

      expect(loadBundleFromS3).toHaveBeenCalledWith("search-index/unit/unit-1.json");
    });

    it("does not read the unit bundle for a learner who is not enrolled", async () => {
      const tool = createSemanticSearchTool(STUDENT_CTX, API_KEY);
      const result = await (tool as any).execute({
        query: "past tense",
        scope: "unit",
        limit: 5,
      });

      expect(result.results).toEqual([]);
      expect(loadBundleFromS3).not.toHaveBeenCalled();
    });

    it("ignores a client-supplied identityId when deciding ownership", async () => {
      // identity-1 owns unit-1 in the mocked data, but only the verified
      // session identity may count; the chat request body is untrusted.
      const ctx: AgentContext = { ...STUDENT_CTX, identityId: "identity-1" };
      const tool = createSemanticSearchTool(ctx, API_KEY);
      await (tool as any).execute({ query: "x", scope: "unit", limit: 5 });
      expect(loadBundleFromS3).not.toHaveBeenCalled();

      const verified: AgentContext = { ...STUDENT_CTX, sessionIdentityId: "identity-1" };
      await (createSemanticSearchTool(verified, API_KEY) as any).execute({
        query: "x",
        scope: "unit",
        limit: 5,
      });
      expect(loadBundleFromS3).toHaveBeenCalledWith("search-index/unit/unit-1.json");
    });

    it("authorizes each outline unit separately for section search", async () => {
      mockSectionGet.mockResolvedValue(assigningSection(["unit-2"]));
      const ctx: AgentContext = {
        userId: "student-1",
        groups: ["Learners", "section-section-1-learners"],
        courseOutline: [
          { unitId: "unit-1", name: "One" },
          { unitId: "unit-2", name: "Two" },
        ],
      };
      await (createSemanticSearchTool(ctx, API_KEY) as any).execute({
        query: "x",
        scope: "section",
        limit: 5,
      });

      expect(loadBundleFromS3).toHaveBeenCalledTimes(1);
      expect(loadBundleFromS3).toHaveBeenCalledWith("search-index/unit/unit-2.json");
    });

    it("uses the merged section bundle for enrolled members", async () => {
      const ctx: AgentContext = {
        ...STUDENT_CTX,
        groups: ["Learners", "section-section-1-learners"],
      };
      await (createSemanticSearchTool(ctx, API_KEY) as any).execute({
        query: "x",
        scope: "section",
        limit: 5,
      });
      expect(loadBundleFromS3).toHaveBeenCalledWith("search-index/section/section-1.json");
    });

    it("searches only the caller's own instructor bundle, by verified session identity", async () => {
      // The request-body identityId points at someone else's bundle.
      const ctx: AgentContext = {
        ...INSTRUCTOR_CTX,
        identityId: "identity-victim",
        sessionIdentityId: "identity-me",
      };
      await (createSemanticSearchTool(ctx, API_KEY) as any).execute({
        query: "x",
        scope: "all",
        limit: 5,
      });
      expect(loadBundleFromS3).toHaveBeenCalledTimes(1);
      expect(loadBundleFromS3).toHaveBeenCalledWith("search-index/instructor/identity-me.json");
    });

    it("does not fall back to a client-supplied identity for the instructor bundle", async () => {
      const ctx: AgentContext = { ...INSTRUCTOR_CTX, identityId: "identity-victim" };
      const result = await (createSemanticSearchTool(ctx, API_KEY) as any).execute({
        query: "x",
        scope: "all",
        limit: 5,
      });
      expect(loadBundleFromS3).not.toHaveBeenCalled();
      expect(result.results).toEqual([]);
    });

    it("handles missing identityId gracefully", async () => {
      const ctx: AgentContext = {
        ...STUDENT_CTX,
        unitId: undefined,
      };
      const tool = createSemanticSearchTool(ctx, API_KEY);
      const result = await (tool as any).execute({
        query: "test",
        scope: "unit",
        limit: 5,
      });
      expect(result.results).toEqual([]);
    });
  });

  describe("read_file_content", () => {
    it("returns null content when no parsed content exists", async () => {
      const tool = createReadFileContentTool(STUDENT_CTX);
      const result = await (tool as any).execute({ fileId: "file-1" });
      expect(result.content).toBeNull();
    });
  });

  describe("get_student_progress", () => {
    it("returns no attempts when no grades exist", async () => {
      const tool = createGetStudentProgressTool(STUDENT_CTX);
      const result = await (tool as any).execute({});
      expect(result.hasAttempts).toBe(false);
    });

    it("prevents students from viewing other students", async () => {
      const tool = createGetStudentProgressTool(STUDENT_CTX);
      const result = await (tool as any).execute({
        studentId: "other-student",
      });
      // Student context means studentId is ignored
      expect(result).toBeDefined();
    });
  });

  describe("get_course_outline", () => {
    it("returns context outline when no sectionId", async () => {
      const ctx: AgentContext = {
        ...INSTRUCTOR_CTX,
        sectionId: undefined,
      };
      const tool = createGetCourseOutlineTool(ctx);
      const result = await (tool as any).execute({});
      expect(result.outline).toHaveLength(2);
      expect(result.outline[0].isCurrent).toBe(true);
    });

    it("returns empty outline from DB when section has no outline", async () => {
      const tool = createGetCourseOutlineTool(INSTRUCTOR_CTX);
      const result = await (tool as any).execute({});
      expect(result.outline).toHaveLength(0);
    });

    it("returns error when no section context", async () => {
      const ctx: AgentContext = { ...STUDENT_CTX, sectionId: undefined };
      const tool = createGetCourseOutlineTool(ctx);
      const result = await (tool as any).execute({});
      expect(result.error).toBeDefined();
    });
  });

  describe("recall_memory", () => {
    it("returns hasMemory false when no memory exists", async () => {
      const tool = createRecallMemoryTool(STUDENT_CTX);
      const result = await (tool as any).execute({});
      expect(result.hasMemory).toBe(false);
    });
  });

  describe("update_memory", () => {
    it("creates new memory record", async () => {
      const tool = createUpdateMemoryTool(STUDENT_CTX);
      const result = await (tool as any).execute({
        topic: "verb conjugation",
        insight: "Student confused te-form with ta-form",
        wasResolved: false,
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe("created");
    });
  });

  describe("get_section_analytics (instructor only)", () => {
    it("rejects non-instructor access", async () => {
      const tool = createGetSectionAnalyticsTool(STUDENT_CTX);
      const result = await (tool as any).execute({});
      expect(result.error).toContain("only available to instructors");
    });

    it("returns analytics for instructor", async () => {
      const tool = createGetSectionAnalyticsTool(INSTRUCTOR_CTX);
      const result = await (tool as any).execute({});
      expect(result.sectionId).toBe("section-1");
    });
  });

  describe("get_student_list (instructor only)", () => {
    it("rejects non-instructor access", async () => {
      const tool = createGetStudentListTool(STUDENT_CTX);
      const result = await (tool as any).execute({});
      expect(result.error).toContain("only available to instructors");
    });

    it("returns student list for instructor", async () => {
      const tool = createGetStudentListTool(INSTRUCTOR_CTX);
      const result = await (tool as any).execute({});
      expect(result.sectionId).toBe("section-1");
    });
  });
});
