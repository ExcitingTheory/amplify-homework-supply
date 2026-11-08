import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const { auth, clearLocalAuthData, authEvents } = vi.hoisted(() => ({
  auth: { error: "" },
  clearLocalAuthData: vi.fn(),
  authEvents: {
    handler: undefined as ((event: { payload: { event: string } }) => void) | undefined,
  },
}));

vi.mock("@aws-amplify/ui-react", () => ({
  useAuthenticator: () => auth,
  Authenticator: {
    SignIn: { Footer: () => <button>Forgot your password?</button> },
  },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: async () => ({ tokens: { accessToken: { payload: {} }, idToken: {} } }),
  fetchUserAttributes: async () => ({ sub: "test-user" }),
}));
vi.mock("aws-amplify/utils", () => ({
  Hub: {
    listen: (_channel: string, handler: typeof authEvents.handler) => {
      authEvents.handler = handler;
      return () => { authEvents.handler = undefined; };
    },
  },
}));
vi.mock("@/utils/authSessionRecovery", () => ({
  clearLocalAuthData,
  signInWithAuthRecovery: vi.fn(),
  signOutAndClearLocalAuthData: vi.fn(),
}));

import { SignInFooter } from "../AmplifyAuthenticator";
import AuthContext, { AuthProvider } from "../../context/authContext";

beforeEach(() => {
  vi.restoreAllMocks();
  clearLocalAuthData.mockReset();
  auth.error = "";
});

function CurrentAuthState() {
  const { user, isLoading } = React.useContext(AuthContext);
  return <span>{isLoading ? "Loading" : user ? "Signed in" : "Signed out"}</span>;
}

describe("sign-in recovery action", () => {
  it("cleans auth storage when any Amplify sign-out event occurs", async () => {
    render(<AuthProvider><CurrentAuthState /></AuthProvider>);
    await screen.findByText("Signed in");
    act(() => authEvents.handler!({ payload: { event: "signedOut" } }));
    expect(clearLocalAuthData).toHaveBeenCalledOnce();
    expect(screen.getByText("Signed out")).toBeInTheDocument();
  });

  it("offers a targeted reset only for the recovery error and retains password reset", () => {
    auth.error = "Incorrect username or password.";
    const { rerender } = render(<SignInFooter />);
    expect(screen.queryByRole("button", { name: "authenticator.resetAuthData" })).toBeNull();
    expect(screen.getByRole("button", { name: "Forgot your password?" })).toBeInTheDocument();
    auth.error = "authenticator.recoveryRequired";
    rerender(<SignInFooter />);
    expect(screen.getByRole("button", { name: "authenticator.resetAuthData" })).toBeInTheDocument();
    expect(screen.getByText("authenticator.resetAuthDataDescription")).toBeInTheDocument();
  });

  it("cleans authentication data before reloading to reset the in-memory challenge", () => {
    auth.error = "authenticator.recoveryRequired";
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => {
      expect(clearLocalAuthData).toHaveBeenCalledOnce();
    });
    render(<SignInFooter />);
    fireEvent.click(screen.getByRole("button", { name: "authenticator.resetAuthData" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows a retryable failure and does not reload if cleanup fails", () => {
    auth.error = "authenticator.recoveryRequired";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => {});
    clearLocalAuthData.mockImplementation(() => { throw new Error("Storage blocked"); });
    render(<SignInFooter />);
    fireEvent.click(screen.getByRole("button", { name: "authenticator.resetAuthData" }));
    expect(screen.getByRole("alert")).toHaveTextContent("authenticator.resetAuthDataFailed");
    expect(screen.getByRole("button", { name: "authenticator.resetAuthData" })).toBeEnabled();
    expect(reload).not.toHaveBeenCalled();
  });
});
