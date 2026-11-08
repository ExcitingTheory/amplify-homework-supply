import { describe, expect, it } from "vitest";
import {
  isConditionalCheckFailure,
  toReadableError,
  versionGuard,
} from "../shared/concurrency";

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

describe("versionGuard", () => {
  it("guards rows that already have a _version with an eq condition", () => {
    expect(versionGuard(3)).toEqual({
      nextVersion: 4,
      condition: { _version: { eq: 3 } },
    });
  });

  it("treats version 0 as a real version", () => {
    expect(versionGuard(0)).toEqual({
      nextVersion: 1,
      condition: { _version: { eq: 0 } },
    });
  });

  it.each([null, undefined])(
    "guards rows missing _version (%s) with attributeExists: false",
    (missing) => {
      expect(versionGuard(missing)).toEqual({
        nextVersion: 1,
        condition: { _version: { attributeExists: false } },
      });
    },
  );
});

describe("toReadableError", () => {
  it("serializes AppSync error payloads instead of '[object Object]'", () => {
    const payload = {
      errors: [{ errorType: "DynamoDB:ConditionalCheckFailedException" }],
    };
    const err = toReadableError(payload, "rollup failed");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("rollup failed");
    expect(err.message).toContain("ConditionalCheckFailedException");
    expect((err as Error & { cause?: unknown }).cause).toBe(payload);
  });

  it("returns existing Error instances unchanged", () => {
    const original = new Error("boom");
    expect(toReadableError(original, "ctx")).toBe(original);
  });
});
