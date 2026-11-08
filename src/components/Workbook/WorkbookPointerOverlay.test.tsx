import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { WorkbookCollaborationProvider } from "../../yjs/WorkbookCollaborationProvider";
import { WorkbookPointerOverlay } from "./WorkbookPointerOverlay";

function provider(username: string) {
  return new WorkbookCollaborationProvider({
    gradeId: "grade-1",
    user: { username, role: "student", displayName: username },
    connect: false,
    persistence: false,
    autoSyncToGrade: false,
  });
}

function share(
  from: WorkbookCollaborationProvider,
  to: WorkbookCollaborationProvider,
) {
  const source = from.getAwareness();
  applyAwarenessUpdate(
    to.getAwareness(),
    encodeAwarenessUpdate(source, [source.clientID]),
    "test",
  );
}

describe("WorkbookPointerOverlay", () => {
  afterEach(() => vi.useRealTimers());

  it("shares pointer positions with other participants and clears them on leave", () => {
    vi.useFakeTimers();
    const alice = provider("Alice");
    const bob = provider("Bob");
    const containerRef = React.createRef<HTMLDivElement>();
    const view = render(
      <div ref={containerRef} style={{ paddingLeft: 20, paddingTop: 10 }}>
        <WorkbookPointerOverlay provider={alice} containerRef={containerRef} />
      </div>,
    );
    const container = containerRef.current!;
    Object.defineProperties(container, {
      scrollWidth: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 100 },
    });
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
      new DOMRect(10, 20, 400, 300),
    );

    act(() => {
      fireEvent.pointerMove(container, {
        clientX: 125,
        clientY: 128,
        pointerType: "mouse",
      });
      vi.advanceTimersByTime(20);
      share(alice, bob);
    });
    expect(
      bob.getAwareness().getStates().get(alice.getAwareness().clientID)
        ?.pointer,
    ).toEqual({ x: 0.25, y: 0.2 });

    act(() => {
      bob.getAwareness().setLocalStateField("pointer", { x: 0.5, y: 0.25 });
      share(bob, alice);
    });
    expect(screen.getByText("Bob")).toBeTruthy();
    const marker = screen.getByText("Bob").parentElement!;
    expect(getComputedStyle(marker).left).toBe("190px");
    expect(getComputedStyle(marker).top).toBe("147.5px");

    Object.defineProperty(container, "scrollTop", {
      configurable: true,
      value: 200,
    });
    act(() => fireEvent.scroll(container));
    expect(getComputedStyle(marker).top).toBe("47.5px");

    act(() => {
      bob.getAwareness().setLocalStateField("pointer", { x: -1, y: 0.25 });
      share(bob, alice);
    });
    expect(screen.queryByText("Bob")).toBeNull();

    act(() => {
      bob.getAwareness().setLocalStateField("pointer", null);
      share(bob, alice);
    });
    act(() => fireEvent.pointerLeave(container));
    expect(alice.getAwareness().getLocalState()?.pointer).toBeNull();
    view.unmount();
    alice.destroy();
    bob.destroy();
  });
});
