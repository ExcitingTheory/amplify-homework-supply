import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { created } = vi.hoisted(() => ({ created: vi.fn() }));

vi.mock("y-websocket", () => ({
  WebsocketProvider: class {
    wsconnected = false;
    synced = false;
    listeners = new Map<string, (...args: unknown[]) => void>();

    constructor() {
      created(this);
    }

    on(name: string, listener: (...args: unknown[]) => void) {
      this.listeners.set(name, listener);
    }

    emit(name: string, value: unknown) {
      this.listeners.get(name)?.(value);
    }

    destroy() {}
  },
}));

import { useWorkbookCollaboration } from "../workbookHooks";

describe("workbook connection status", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    created.mockReset();
  });

  it("tracks the replacement socket after corrupt-state recovery", () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_YJS_WS_URL", "wss://localhost:3001");

    const { result, unmount } = renderHook(() =>
      useWorkbookCollaboration({
        gradeId: "grade-1",
        user: { username: "student", role: "student" },
      }),
    );
    const first = created.mock.calls[0][0];
    act(() => {
      first.emit("status", { status: "connected" });
      first.emit("sync", true);
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isSynced).toBe(true);

    act(() => first.emit("connection-close", { code: 4000 }));
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isSynced).toBe(false);

    act(() => vi.advanceTimersByTime(1000));
    const replacement = created.mock.calls[1][0];
    act(() => {
      replacement.emit("status", { status: "connected" });
      replacement.emit("sync", true);
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isSynced).toBe(true);

    const provider = result.current.provider;
    unmount();
    provider?.destroy();
  });
});
