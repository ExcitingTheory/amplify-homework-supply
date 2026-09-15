import { describe, expect, it } from "vitest";
import {
  getSettingsErrorMessage,
  validatePasswordChange,
} from "../settingsValidation";

describe("settingsValidation", () => {
  it("accepts a strong password change", () => {
    const result = validatePasswordChange({
      oldPassword: "CurrentPass1!",
      newPassword: "NewPass1!",
      confirmNewPassword: "NewPass1!",
    });

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("requires a stronger password and matching confirmation", () => {
    const shortResult = validatePasswordChange({
      oldPassword: "CurrentPass1!",
      newPassword: "short",
      confirmNewPassword: "short",
    });

    expect(shortResult.isValid).toBe(false);
    expect(shortResult.message).toMatch(/at least 8 characters|minimum 8/i);

    const mismatchResult = validatePasswordChange({
      oldPassword: "CurrentPass1!",
      newPassword: "NewPass1!",
      confirmNewPassword: "NewPass2!",
    });

    expect(mismatchResult.isValid).toBe(false);
    expect(mismatchResult.message).toMatch(/match/i);
  });

  it("normalizes common auth errors into readable messages", () => {
    expect(
      getSettingsErrorMessage({ message: "Incorrect username or password." }),
    ).toBe("Incorrect username or password.");
    expect(
      getSettingsErrorMessage({ message: "Invalid password format" }),
    ).toBe(
      "Password must be at least 8 characters and include letters, numbers, and symbols.",
    );
    expect(
      getSettingsErrorMessage({
        message: "CodeMismatchException: Invalid code provided",
      }),
    ).toBe("The confirmation code is incorrect. Please try again.");
  });
});
