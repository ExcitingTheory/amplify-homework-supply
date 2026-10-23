import { describe, expect, it } from "vitest";
import {
  callResponseSessionReducer,
  getCallResponseCueState,
  initialCallResponseSession,
} from "../../src/components/Editor3/hooks/useCallResponseSession";

const cues = [
  { id: "prompt", kind: "prompt", text: "The Magus. Number?" },
  {
    id: "response",
    kind: "response",
    expected: "I",
    accept: ["one"],
    field: "number",
    minMs: 2500,
    maxMs: 8000,
    silenceEndMs: 700,
  },
  { id: "answer", kind: "answer", text: "Number: I." },
] as const;

describe("call-response session state", () => {
  it("moves through arming, prompt, response, answer, and done", () => {
    let session = callResponseSessionReducer(initialCallResponseSession, {
      type: "START",
    });
    expect(session.state).toBe("Arming");

    session = callResponseSessionReducer(session, {
      type: "ARMED",
      firstCueState: getCallResponseCueState(cues[0])!,
    });
    expect(session).toMatchObject({ state: "Prompt", cueIndex: 0 });

    session = callResponseSessionReducer(session, {
      type: "ADVANCE",
      nextCueState: getCallResponseCueState(cues[1]),
    });
    expect(session).toMatchObject({ state: "Response", cueIndex: 1 });

    session = callResponseSessionReducer(session, { type: "PAUSE" });
    expect(session).toMatchObject({
      state: "Paused",
      previousState: "Response",
    });
    session = callResponseSessionReducer(session, { type: "RESUME" });
    expect(session).toMatchObject({ state: "Response", previousState: null });

    session = callResponseSessionReducer(session, {
      type: "ADVANCE",
      nextCueState: getCallResponseCueState(cues[2]),
    });
    expect(session).toMatchObject({ state: "Answer", cueIndex: 2 });
    session = callResponseSessionReducer(session, {
      type: "ADVANCE",
      nextCueState: null,
    });
    expect(session).toMatchObject({ state: "Done", cueIndex: 3 });
  });

  it("routes permission failures to a recoverable state", () => {
    const denied = callResponseSessionReducer(initialCallResponseSession, {
      type: "DENIED",
    });
    expect(denied.state).toBe("PermissionDenied");
    expect(
      callResponseSessionReducer(denied, { type: "RESET" }),
    ).toEqual(initialCallResponseSession);
  });
});
