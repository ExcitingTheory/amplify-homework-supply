import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import AuthContext, { AuthProvider } from "../authContext";

const hub = vi.hoisted(() => ({
  listener: undefined as undefined | ((data: { payload: Record<string, unknown> }) => void),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
  fetchUserAttributes: vi.fn(),
}));
vi.mock("aws-amplify/utils", () => ({
  Hub: {
    listen: (_channel: string, listener: typeof hub.listener) => {
      hub.listener = listener;
      return () => { hub.listener = undefined; };
    },
  },
}));
vi.mock("../../utils/authSessionRecovery", () => ({
  clearLocalAuthData: vi.fn(),
  signOutAndClearLocalAuthData: vi.fn(),
}));

const token = (value: string) => ({ payload: { "cognito:groups": ["Instructors"] }, toString: () => value });
const session = (value: string) => ({
  identityId: "identity",
  tokens: { idToken: token(value), accessToken: token(`access-${value}`) },
});

function Probe({ onRender }: { onRender: (state: Record<string, unknown>) => void }) {
  const state = React.useContext(AuthContext) as Record<string, unknown>;
  onRender(state);
  return <div data-testid="state">{state.user ? "signed-in" : state.isLoading ? "loading" : "signed-out"}</div>;
}

async function renderSignedIn() {
  const states: Record<string, unknown>[] = [];
  vi.mocked(fetchAuthSession).mockResolvedValue(session("id-1") as never);
  vi.mocked(fetchUserAttributes).mockResolvedValue({ sub: "user" });
  render(<AuthProvider><Probe onRender={(state) => states.push(state)} /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("signed-in"));
  vi.mocked(fetchUserAttributes).mockClear();
  states.length = 0;
  return states;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("updates the session for a burst of token refreshes without GetUser or a loading state", async () => {
    const states = await renderSignedIn();
    vi.mocked(fetchAuthSession).mockResolvedValue(session("id-2") as never);

    await act(async () => {
      for (let i = 0; i < 15; i += 1) hub.listener?.({ payload: { event: "tokenRefresh" } });
    });

    await waitFor(() => {
      const latest = states.at(-1) as { session: { idToken: { toString: () => string } } };
      expect(latest.session.idToken.toString()).toBe("id-2");
    });
    expect(fetchUserAttributes).not.toHaveBeenCalled();
    expect(fetchAuthSession).toHaveBeenCalledTimes(2);
    expect(states.every((state) => state.isLoading === false && state.user)).toBe(true);
  });

  it("keeps the signed-in user when Cognito throttles", async () => {
    await renderSignedIn();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const throttled = Object.assign(new Error("Rate exceeded"), { name: "TooManyRequestsException" });
    vi.mocked(fetchUserAttributes).mockRejectedValue(throttled);

    await act(async () => {
      hub.listener?.({ payload: { event: "signedIn" } });
      hub.listener?.({ payload: { event: "tokenRefresh_failure", data: { error: throttled } } });
    });

    await waitFor(() => expect(fetchUserAttributes).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("signed-in"));
  });
});
