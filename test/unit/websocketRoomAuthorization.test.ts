import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { APIGatewayProxyWebsocketEventV2, Context } from "aws-lambda";

const { send, post } = vi.hoisted(() => ({ send: vi.fn(), post: vi.fn() }));

vi.mock("@aws-sdk/client-dynamodb", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@aws-sdk/client-dynamodb")>()),
  DynamoDBClient: class {},
}));

vi.mock("@aws-sdk/client-apigatewaymanagementapi", () => ({
  ApiGatewayManagementApiClient: class {
    send = post;
  },
  PostToConnectionCommand: class {
    constructor(public input: { ConnectionId: string; Data: string }) {}
  },
}));

vi.mock("@aws-sdk/lib-dynamodb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/lib-dynamodb")>();
  return {
    ...actual,
    DynamoDBDocumentClient: { from: () => ({ send }) },
  };
});

import { handler } from "../../amplify/custom/websocket/handler";

function message(unitId: string, userId: string, action = "ping") {
  const event = {
    requestContext: {
      connectionId: "connection-1",
      routeKey: "$default",
      domainName: "example.com",
      stage: "test",
      authorizer: { claims: { sub: userId } },
    },
    body: JSON.stringify({ action, unitId }),
  } as APIGatewayProxyWebsocketEventV2;
  return handler(event, {} as Context, () => {});
}

describe("WebSocket room authorization", () => {
  beforeEach(() => {
    send.mockReset();
    post.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("checks access independently for each room", async () => {
    send
      .mockResolvedValueOnce({ Items: [{ owner: "student-a" }] })
      .mockResolvedValueOnce({ Items: [{ owner: "student-b" }] });

    expect(await message("unit-a", "student-a")).toMatchObject({
      statusCode: 200,
    });
    expect(await message("unit-b", "student-a")).toMatchObject({
      statusCode: 403,
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("rechecks peer-review invitations after access is removed", async () => {
    send
      .mockResolvedValueOnce({
        Items: [{ ownerId: "owner", invitedUserIds: ["reviewer"] }],
      })
      .mockResolvedValueOnce({
        Items: [{ ownerId: "owner", invitedUserIds: [] }],
      });

    expect(await message("review-room", "reviewer")).toMatchObject({
      statusCode: 200,
    });
    expect(await message("review-room", "reviewer")).toMatchObject({
      statusCode: 403,
    });
  });

  it.each(["presence", "sync", "chat"])(
    "does not deliver review %s to revoked or stale room connections",
    async (action) => {
      vi.stubEnv("HOMEWORK_ROOM_TABLE_NAME", "rooms");
      vi.stubEnv("CONNECTIONS_TABLE_NAME", "connections");
      const records: Record<
        string,
        { connectionId: string; unitId: string; userId: string }
      > = {
        approved: {
          connectionId: "approved",
          unitId: "review-room",
          userId: "approved-user",
        },
        revoked: {
          connectionId: "revoked",
          unitId: "review-room",
          userId: "revoked-user",
        },
        moved: {
          connectionId: "moved",
          unitId: "review-another",
          userId: "approved-user",
        },
      };
      const room = { ownerId: "owner", invitedUserIds: ["approved-user"] };
      send.mockImplementation(async ({ input }) => {
        if (input.TableName === "rooms") {
          expect(input.ConsistentRead).toBe(true);
          return { Items: [room] };
        }
        if (input.IndexName === "UnitIdIndex") {
          return { Items: Object.values(records) };
        }
        if (input.Key?.connectionId) {
          expect(input.ConsistentRead).toBe(true);
          return { Item: records[input.Key.connectionId] };
        }
        return {};
      });

      expect(await message("review-room", "owner", action)).toMatchObject({
        statusCode: 200,
      });
      expect(post).toHaveBeenCalledTimes(1);
      expect(post.mock.calls[0][0].input.ConnectionId).toBe("approved");
    },
  );
});
