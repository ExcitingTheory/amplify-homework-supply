import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ subscribe: vi.fn() }));

vi.mock("../../utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      Section: {
        observeQuery: () => ({ subscribe: mocks.subscribe }),
      },
    },
  }),
}));

import AuthContext from "../authContext";
import { SectionProvider } from "../sectionContext";

describe("Section subscription errors", () => {
  beforeEach(() => {
    mocks.subscribe.mockReset();
    mocks.subscribe.mockReturnValue({ unsubscribe: vi.fn() });
  });

  afterEach(() => vi.restoreAllMocks());

  function emitError(error: unknown) {
    render(
      <AuthContext.Provider value={{ user: { id: "user-1" }, isLoading: false }}>
        <SectionProvider>
          <div />
        </SectionProvider>
      </AuthContext.Provider>,
    );
    act(() => mocks.subscribe.mock.calls.at(-1)?.[0].error(error));
  }

  it("reports nested Amplify error messages instead of an opaque object", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = {
      type: "onCreate",
      error: { errors: [{ message: "Not authorized to subscribe to Section" }] },
    };

    emitError(error);

    expect(log).toHaveBeenCalledWith(
      "[SectionContext] Section observeQuery: Not authorized to subscribe to Section",
      error,
    );
  });

  it("does not silently classify an empty error as harmless", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    emitError({});

    expect(log).toHaveBeenCalledWith(
      "[SectionContext] Section observeQuery: Subscription failed without error details",
      {},
    );
  });

  it("recognizes duplicated operations inside Amplify's error wrapper", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitError({
      type: "onUpdate",
      error: new Error("DuplicatedOperationError"),
    });

    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "[SectionContext] Section observeQuery: transient DuplicatedOperationError (safe to ignore)",
    );
  });
});
