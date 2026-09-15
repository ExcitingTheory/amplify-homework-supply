import { describe, it, expect } from "vitest";
import {
  BUILT_IN_TIMING_PATTERNS,
  resolveTimingWindow,
  getAssignmentWindowState,
  shouldFlagLateSubmission,
} from "../assignmentTiming";

describe("assignmentTiming", () => {
  it("includes the standard built-in timing presets", () => {
    expect(BUILT_IN_TIMING_PATTERNS.map((pattern) => pattern.id)).toEqual([
      "class-start",
      "class-end",
      "end-of-day",
      "end-of-week",
    ]);
  });

  it("resolves the class-start pattern from the meeting schedule", () => {
    const meetingDate = new Date(2026, 8, 8, 12, 0, 0);
    const schedule = [{ dayOfWeek: 2, startTime: "09:00", endTime: "10:30" }];

    const window = resolveTimingWindow(
      BUILT_IN_TIMING_PATTERNS[0],
      meetingDate,
      schedule,
    );

    expect(window.availableFrom.getHours()).toBe(9);
    expect(window.availableFrom.getMinutes()).toBe(0);
    expect(window.availableUntil.getHours()).toBe(23);
    expect(window.availableUntil.getMinutes()).toBe(59);
  });

  it("resolves the class-end pattern to the meeting end time", () => {
    const meetingDate = new Date(2026, 8, 8, 12, 0, 0);
    const schedule = [{ dayOfWeek: 2, startTime: "09:00", endTime: "10:30" }];

    const window = resolveTimingWindow(
      BUILT_IN_TIMING_PATTERNS[1],
      meetingDate,
      schedule,
    );

    expect(window.availableFrom.getHours()).toBe(10);
    expect(window.availableFrom.getMinutes()).toBe(30);
    expect(window.availableUntil.getHours()).toBe(23);
    expect(window.availableUntil.getMinutes()).toBe(59);
  });

  it("marks an assignment as locked before opening and late after closing", () => {
    const locked = getAssignmentWindowState({
      unlockDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      allowLateCompletion: true,
    });

    const late = getAssignmentWindowState({
      unlockDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      allowLateCompletion: true,
    });

    expect(locked.state).toBe("locked");
    expect(late.state).toBe("late");
  });

  it("treats dropped late submissions as closed for review and reporting", () => {
    const dropped = getAssignmentWindowState({
      availableFrom: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      allowLateCompletion: true,
      lateStatus: "DROPPED",
    });

    expect(dropped.state).toBe("closed");
    expect(dropped.isLate).toBe(false);
  });

  it("flags a completed submission for instructor review when it arrives after the due window", () => {
    const lateAssignment = {
      availableFrom: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      allowLateCompletion: true,
      lateStatus: null,
    };

    expect(shouldFlagLateSubmission(lateAssignment)).toBe(true);
    expect(
      shouldFlagLateSubmission({ ...lateAssignment, lateStatus: "KEPT" }),
    ).toBe(false);
    expect(
      shouldFlagLateSubmission({
        ...lateAssignment,
        allowLateCompletion: false,
      }),
    ).toBe(false);
  });
});
