import { describe, expect, it } from "vitest";
import { isConditionalCheckFailure } from "../shared/concurrency";

describe("isConditionalCheckFailure", () => {
  it("detects AppSync errors that carry the exception name only in errorType", () => {
    const err = {
      data: { updateAssignment: null },
      errors: [
        {
          errorType: "DynamoDB:ConditionalCheckFailedException",
          message:
            "The conditional request failed (Service: DynamoDb, Status Code: 400)",
        },
      ],
    };
    expect(isConditionalCheckFailure(err)).toBe(true);
  });

  it("detects the conflict when it is not the first error", () => {
    const err = {
      errors: [
        { errorType: "Other", message: "unrelated" },
        { errorType: "DynamoDB:ConditionalCheckFailedException", message: "x" },
      ],
    };
    expect(isConditionalCheckFailure(err)).toBe(true);
  });

  it("detects plain Error messages", () => {
    expect(
      isConditionalCheckFailure(new Error("ConditionalCheckFailedException")),
    ).toBe(true);
  });

  it("ignores unrelated failures", () => {
    expect(
      isConditionalCheckFailure({
        errors: [{ errorType: "Unauthorized", message: "Not Authorized" }],
      }),
    ).toBe(false);
    expect(isConditionalCheckFailure(undefined)).toBe(false);
  });
});
