import { describe, expect, it } from "vitest";
import { describeGraphQLError } from "../../amplify/functions/documentAnalysisWorkflow/graphqlError";

describe("describeGraphQLError", () => {
  it("returns real errors untouched", () => {
    const error = new Error("boom");
    expect(describeGraphQLError(error)).toBe(error);
  });

  it("turns Amplify's { data, errors } rejection into a readable Error", () => {
    const rejection = {
      data: null,
      errors: [
        {
          errorType: "Unauthorized",
          message: "Not Authorized to access listParsedContents on type Query",
          path: ["listParsedContents"],
        },
        { message: "second problem" },
      ],
    };
    const error = describeGraphQLError(rejection);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      "GraphQL request failed: Unauthorized: Not Authorized to access listParsedContents on type Query (at listParsedContents); second problem",
    );
    expect(error.cause).toBe(rejection);
  });

  it("serialises other thrown values instead of printing [object Object]", () => {
    expect(describeGraphQLError({ code: 7 }).message).toBe(
      'GraphQL request failed: {"code":7}',
    );
    expect(describeGraphQLError("nope").message).toBe(
      'GraphQL request failed: "nope"',
    );
  });
});
