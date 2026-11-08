import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("aws-amplify/storage", () => ({
  uploadData: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import { uploadStudentSubmission } from "../../src/utils/userSubmissionStorage";

describe("uploadStudentSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAuthSession).mockResolvedValue({
      identityId: "us-east-1:identity-id",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: "user-pool-sub",
      username: "student",
    });
  });

  it("uses the identity-pool identity in the private storage path", async () => {
    const file = new Blob(["audio"], { type: "audio/webm" });
    vi.mocked(uploadData).mockReturnValue({
      result: Promise.resolve({
        path: "private/us-east-1:identity-id/user-submissions/grade-1/question-1/file.webm",
      }),
    } as never);

    const result = await uploadStudentSubmission({
      file,
      gradeId: "grade-1",
      nodeKey: "question-1",
      fileType: "webm",
    });

    expect(uploadData).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(
          /^private\/us-east-1:identity-id\/user-submissions\/grade-1\/question-1\/grade-1_question-1_\d+\.webm$/,
        ),
        data: file,
        options: { contentType: "audio/webm" },
      }),
    );
    expect(result.metadata.userId).toBe("user-pool-sub");
  });

  it("does not upload when no identity-pool identity is available", async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({});

    await expect(
      uploadStudentSubmission({
        file: new Blob(["audio"], { type: "audio/webm" }),
        gradeId: "grade-1",
        nodeKey: "question-1",
        fileType: "webm",
      }),
    ).rejects.toThrow(/identity ID is unavailable/i);

    expect(uploadData).not.toHaveBeenCalled();
  });
});
