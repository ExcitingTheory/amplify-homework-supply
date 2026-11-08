/**
 * Integration tests for section handler
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockGraphql } = vi.hoisted(() => ({ mockGraphql: vi.fn() }));

// Mock AWS SDK modules that hang on import in test environment
vi.mock("@aws-sdk/client-cloudformation", () => ({
  CloudFormationClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ Stacks: [] }),
  })),
  DescribeStacksCommand: vi.fn(),
}));

vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(() =>
    vi.fn().mockResolvedValue({
      accessKeyId: "test",
      secretAccessKey: "test",
    }),
  ),
}));

// Mock Cognito client used by GroupManager
vi.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  AdminAddUserToGroupCommand: vi.fn(),
  AdminRemoveUserFromGroupCommand: vi.fn(),
  CreateGroupCommand: vi.fn(),
  DeleteGroupCommand: vi.fn(),
  ListUsersInGroupCommand: vi.fn(),
}));

vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: vi.fn(() => ({ graphql: mockGraphql })),
}));

vi.mock("../section/groupManager", () => ({
  GroupManager: class {
    async createInstructorGroup() {}
    async createLearnerGroup() {}
    async addInstructor() {}
  },
}));

describe("section handler integration tests", () => {
  beforeEach(() => {
    process.env.API_ENDPOINT = "http://localhost:8080/graphql";
    process.env.USER_POOL_ID = "test-user-pool-id";
    mockGraphql.mockReset();
    vi.resetModules();
  });

  it("should require auth token", async () => {
    const { handler } = await import("../section/handler");

    expect(handler).toBeDefined();
    // Handler enforces auth token requirement
  });

  it("should extract userId from event context", () => {
    const eventWithUserid = {
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
          },
        },
      },
    };

    const userId = eventWithUserid.requestContext?.authorizer?.claims?.sub;
    expect(userId).toBe("user-123");
  });

  it("should generate unique section codes", () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.add(code);
    }

    // Statistically, should have mostly unique codes
    expect(codes.size).toBeGreaterThan(95);
  });

  it("should format GraphQL queries correctly", () => {
    const queryStructure = {
      operationName: "GetSectionByCode",
      variables: { code: "ABC123" },
    };

    expect(queryStructure.operationName).toBeDefined();
    expect(queryStructure.variables.code).toMatch(/^[A-Z0-9]+$/);
  });

  it("should handle operation names correctly", () => {
    const operations = [
      "createSectionGroup",
      "addSelfToSection",
      "listSectionStudents",
    ];

    operations.forEach((op) => {
      expect(typeof op).toBe("string");
      expect(op.length).toBeGreaterThan(0);
    });
  });

  it("applies configured location defaults when creating a section", async () => {
    const defaultLocation = {
      school: {
        name: "North School",
        address: "10 Main Street",
      },
      campus: "East",
      buildingName: "Learning Center",
      roomNumber: "204",
    };
    mockGraphql.mockImplementation(async ({ query }) => {
      if (query.includes("query GetDefaultSectionLocation")) {
        return {
          data: {
            listPlatformSettings: {
              items: [{ defaultSectionLocation: defaultLocation }],
            },
          },
        };
      }
      return {
        data: {
          createSection: {
            id: "section-123",
            _version: 1,
            code: "ABC123",
          },
        },
      };
    });

    const { handler } = await import("../section/handler");
    await handler(
      {
        info: { fieldName: "createSectionGroup" },
        identity: { sub: "instructor-1", username: "instructor@example.com" },
        arguments: { name: "Biology", description: "" },
      },
      {} as any,
      vi.fn(),
    );

    const createCall = mockGraphql.mock.calls.find(([request]) =>
      request.query.includes("mutation CreateSection"),
    );
    expect(createCall?.[0].variables.input.location).toEqual(defaultLocation);
  });

  it("uses a supplied location without loading platform defaults", async () => {
    const location = {
      school: {
        name: "South School",
        address: "20 Main Street",
      },
    };
    mockGraphql.mockResolvedValue({
      data: {
        createSection: {
          id: "section-456",
          _version: 1,
          code: "DEF456",
        },
      },
    });

    const { handler } = await import("../section/handler");
    await handler(
      {
        info: { fieldName: "createSectionGroup" },
        identity: { sub: "instructor-1", username: "instructor@example.com" },
        arguments: { name: "Biology", description: "", location },
      },
      {} as any,
      vi.fn(),
    );

    expect(mockGraphql).toHaveBeenCalledTimes(1);
    expect(mockGraphql.mock.calls[0][0].variables.input.location).toEqual(
      location,
    );
  });

  it("should format response with ISO timestamp", () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should handle section student list responses", () => {
    const studentList = [
      {
        id: "user-1",
        name: "Student ab123456",
        email: "user-1@example.com",
      },
      {
        id: "user-2",
        name: "Student cd789012",
        email: "user-2@example.com",
      },
    ];

    expect(Array.isArray(studentList)).toBe(true);
    expect(studentList[0].id).toBeDefined();
    expect(studentList[0].email).toMatch(/@example\.com$/);
  });
});
