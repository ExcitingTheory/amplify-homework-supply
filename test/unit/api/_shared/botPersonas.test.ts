/**
 * Tests for bot persona configuration and model resolution chain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Amplify server client
const mockPlatformSettingsList = vi.fn();
const mockSectionGet = vi.fn();

vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: vi.fn(() => ({
    models: {
      PlatformSettings: {
        list: mockPlatformSettingsList,
      },
      Section: {
        get: mockSectionGet,
      },
    },
  })),
}));

import {
  resolvePersona,
  filterToolsByPersona,
  buildPersonaSystemMessage,
  resolveAgentConfig,
} from "../../../../app/api/_shared/botPersonas";

describe("botPersonas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolvePersona", () => {
    it("returns Kai for students", () => {
      const persona = resolvePersona(["Learners"]);
      expect(persona.name).toBe("Kai");
    });

    it("returns Sage for instructors", () => {
      const persona = resolvePersona(["Instructors"]);
      expect(persona.name).toBe("Sage");
    });

    it("returns Sage for admins", () => {
      const persona = resolvePersona(["Admins"]);
      expect(persona.name).toBe("Sage");
    });

    it("allows explicit persona override for privileged users", () => {
      const persona = resolvePersona(["Instructors"], "kai");
      expect(persona.name).toBe("Kai");
    });

    it("prevents learner from escalating to Sage via explicit override", () => {
      // A Learner supplying "sage" in the request body must NOT receive Sage tools
      const persona = resolvePersona(["Learners"], "sage");
      expect(persona.name).toBe("Kai");
    });

    it("prevents unauthenticated caller from escalating to Sage", () => {
      const persona = resolvePersona([], "sage");
      expect(persona.name).toBe("Kai");
    });

    it("allows Moderators to use explicit override", () => {
      const persona = resolvePersona(["Moderators"], "kai");
      expect(persona.name).toBe("Kai");
    });
  });

  describe("filterToolsByPersona", () => {
    it("only returns allowed tools", () => {
      const persona = resolvePersona(["Learners"]); // Kai
      const tools = {
        semantic_search: { description: "search" },
        get_section_analytics: { description: "analytics" },
        search_content: { description: "client search" },
      };
      const filtered = filterToolsByPersona(tools, persona);
      expect(filtered).toHaveProperty("semantic_search");
      expect(filtered).toHaveProperty("search_content");
      expect(filtered).not.toHaveProperty("get_section_analytics");
    });

    it("includes analytics tools for Sage", () => {
      const persona = resolvePersona(["Instructors"]); // Sage
      const tools = {
        get_section_analytics: { description: "analytics" },
        get_student_list: { description: "roster" },
      };
      const filtered = filterToolsByPersona(tools, persona);
      expect(filtered).toHaveProperty("get_section_analytics");
      expect(filtered).toHaveProperty("get_student_list");
    });
  });

  describe("buildPersonaSystemMessage", () => {
    it("includes unit name in system message", () => {
      const persona = resolvePersona(["Learners"]);
      const msg = buildPersonaSystemMessage(persona, {
        unit: { id: "u1", name: "Lesson 1", description: "First lesson" },
      });
      expect(msg).toContain("Current Unit: Lesson 1");
      expect(msg).toContain("Description: First lesson");
    });

    it("includes course outline with current marker", () => {
      const persona = resolvePersona(["Learners"]);
      const msg = buildPersonaSystemMessage(persona, {
        unit: { id: "u2" },
        courseOutline: [
          { unitId: "u1", name: "Lesson 1", number: 1 },
          { unitId: "u2", name: "Lesson 2", number: 2 },
        ],
      });
      expect(msg).toContain("Lesson 1");
      expect(msg).toContain("Lesson 2");
      expect(msg).toContain("← CURRENT");
    });

    it("includes grade status for Kai", () => {
      const persona = resolvePersona(["Learners"]);
      const msg = buildPersonaSystemMessage(persona, {
        grade: { complete: false, percentComplete: 50 },
      });
      expect(msg).toContain("In Progress");
      expect(msg).toContain("50%");
    });
  });

  describe("resolveAgentConfig", () => {
    it("returns defaults when no platform settings exist", async () => {
      mockPlatformSettingsList.mockResolvedValue({ data: [] });
      const persona = resolvePersona(["Learners"]);
      const config = await resolveAgentConfig(persona);

      expect(config.model).toBe("gpt-4o");
      expect(config.temperature).toBe(0.7);
      expect(config.maxOutputTokens).toBe(2000);
      expect(config.maxSteps).toBe(5);
      expect(config.searchThreshold).toBe(0.3);
      expect(config.memoryEnabled).toBe(true);
      expect(config.enforceTokenBudget).toBe(true);
    });

    it("applies platform settings overrides", async () => {
      mockPlatformSettingsList.mockResolvedValue({
        data: [
          {
            id: "ps-1",
            defaultAIModel: "gpt-4.1",
            kaiModel: "gpt-4.1-mini",
            kaiTemperature: 0.5,
            kaiMaxTokens: 1500,
            agentMaxSteps: 3,
            searchThreshold: 0.4,
            memoryEnabled: false,
          },
        ],
      });

      const persona = resolvePersona(["Learners"]);
      const config = await resolveAgentConfig(persona);

      expect(config.model).toBe("gpt-4.1-mini");
      expect(config.temperature).toBe(0.5);
      expect(config.maxOutputTokens).toBe(1500);
      expect(config.maxSteps).toBe(3);
      expect(config.searchThreshold).toBe(0.4);
      expect(config.memoryEnabled).toBe(false);
    });

    it("applies section aiConfig overrides on top of platform", async () => {
      mockPlatformSettingsList.mockResolvedValue({
        data: [
          {
            id: "ps-1",
            kaiModel: "gpt-4o",
            kaiTemperature: 0.7,
          },
        ],
      });
      mockSectionGet.mockResolvedValue({
        data: {
          id: "section-1",
          aiConfig: JSON.stringify({
            kaiModel: "gpt-4.1-nano",
            kaiTemperature: 0.3,
            memoryEnabled: false,
          }),
        },
      });

      const persona = resolvePersona(["Learners"]);
      const config = await resolveAgentConfig(persona, "section-1");

      expect(config.model).toBe("gpt-4.1-nano");
      expect(config.temperature).toBe(0.3);
      expect(config.memoryEnabled).toBe(false);
    });

    it("clamps temperature to safe range", async () => {
      mockPlatformSettingsList.mockResolvedValue({
        data: [{ id: "ps-1", kaiTemperature: 5.0 }],
      });

      const persona = resolvePersona(["Learners"]);
      const config = await resolveAgentConfig(persona);

      expect(config.temperature).toBeLessThanOrEqual(1.5);
    });

    it("clamps maxSteps to safe range", async () => {
      mockPlatformSettingsList.mockResolvedValue({
        data: [{ id: "ps-1", agentMaxSteps: 100 }],
      });

      const persona = resolvePersona(["Learners"]);
      const config = await resolveAgentConfig(persona);

      expect(config.maxSteps).toBeLessThanOrEqual(10);
    });

    it("resolves Sage config separately from Kai", async () => {
      mockPlatformSettingsList.mockResolvedValue({
        data: [
          {
            id: "ps-1",
            kaiModel: "gpt-4o-mini",
            sageModel: "gpt-4o",
            kaiTemperature: 0.5,
            sageTemperature: 0.9,
          },
        ],
      });

      const kai = resolvePersona(["Learners"]);
      const sage = resolvePersona(["Instructors"]);

      const kaiConfig = await resolveAgentConfig(kai);
      const sageConfig = await resolveAgentConfig(sage);

      expect(kaiConfig.model).toBe("gpt-4o-mini");
      expect(sageConfig.model).toBe("gpt-4o");
      expect(kaiConfig.temperature).toBe(0.5);
      expect(sageConfig.temperature).toBe(0.9);
    });
  });
});
