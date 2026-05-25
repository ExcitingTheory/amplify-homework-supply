import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEngagedTime } from "./useEngagedTime";

describe("useEngagedTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: document visible, window focused
    Object.defineProperty(document, "hidden", { value: false, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with initial time and inactive", () => {
    const { result } = renderHook(() => useEngagedTime({ initialMs: 5000 }));
    expect(result.current.engagedTimeMs).toBe(5000);
    expect(result.current.isActive).toBe(false);
  });

  it("starts accumulating on user interaction", () => {
    const { result } = renderHook(() => useEngagedTime());

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    expect(result.current.isActive).toBe(true);

    // Advance 5 ticks (5 seconds)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.engagedTimeMs).toBe(5000);
  });

  it("pauses after reading window expires with no interaction", () => {
    const { result } = renderHook(() =>
      useEngagedTime({ readingWindow: 10_000 }),
    );

    // Start tracking
    act(() => {
      document.dispatchEvent(new Event("keydown"));
    });
    expect(result.current.isActive).toBe(true);

    // Advance past reading window (10s + some tick time)
    act(() => {
      vi.advanceTimersByTime(11_000);
    });

    expect(result.current.isActive).toBe(false);
    // Should have accumulated ~10s before window expired
    expect(result.current.engagedTimeMs).toBeGreaterThanOrEqual(10_000);
    expect(result.current.engagedTimeMs).toBeLessThanOrEqual(11_000);
  });

  it("pauses when document becomes hidden", () => {
    const { result } = renderHook(() => useEngagedTime());

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Hide the tab
    act(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.isActive).toBe(false);
    const timeAtPause = result.current.engagedTimeMs;

    // Time should not accumulate while hidden
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.engagedTimeMs).toBe(timeAtPause);
  });

  it("pauses when window loses focus", () => {
    const { result } = renderHook(() => useEngagedTime());

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(result.current.isActive).toBe(false);
    const timeAtPause = result.current.engagedTimeMs;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.engagedTimeMs).toBe(timeAtPause);
  });

  it("calls onPersist periodically while active", () => {
    const onPersist = vi.fn();
    renderHook(() => useEngagedTime({ onPersist, persistInterval: 5000 }));

    // Start tracking
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    // Advance past persist interval
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onPersist).toHaveBeenCalledWith(expect.any(Number));
    expect(onPersist.mock.calls[0][0]).toBeGreaterThan(0);
  });

  it("calls onPersist when deactivating", () => {
    const onPersist = vi.fn();
    renderHook(() => useEngagedTime({ onPersist }));

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Trigger deactivation via blur
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(onPersist).toHaveBeenCalledWith(expect.any(Number));
  });

  it("does not track when enabled is false", () => {
    const { result } = renderHook(() => useEngagedTime({ enabled: false }));

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    expect(result.current.isActive).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.engagedTimeMs).toBe(0);
  });

  it("manual pause/resume works", () => {
    const { result } = renderHook(() => useEngagedTime());

    // Start
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current.isActive).toBe(true);

    // Manual pause
    act(() => {
      result.current.pause();
    });
    expect(result.current.isActive).toBe(false);

    const timeAtPause = result.current.engagedTimeMs;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.engagedTimeMs).toBe(timeAtPause);

    // Manual resume
    act(() => {
      result.current.resume();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.engagedTimeMs).toBeGreaterThan(timeAtPause);
  });

  it("reset clears accumulated time", () => {
    const { result } = renderHook(() => useEngagedTime({ initialMs: 10_000 }));

    act(() => {
      result.current.reset();
    });

    expect(result.current.engagedTimeMs).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("reset with new initial value", () => {
    const { result } = renderHook(() => useEngagedTime());

    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.reset(20_000);
    });

    expect(result.current.engagedTimeMs).toBe(20_000);
  });

  it("resumes accumulating from existing time after interaction resumes", () => {
    const { result } = renderHook(() => useEngagedTime({ initialMs: 10_000 }));

    act(() => {
      document.dispatchEvent(new Event("keydown"));
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.engagedTimeMs).toBe(13_000);
  });

  it("resumes automatically when window regains focus", () => {
    const { result } = renderHook(() => useEngagedTime());

    // Start tracking
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current.isActive).toBe(true);

    // Blur window
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current.isActive).toBe(false);

    // Focus window again — should auto-resume
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current.isActive).toBe(true);
  });

  it("resumes automatically when tab becomes visible again", () => {
    const { result } = renderHook(() => useEngagedTime());

    // Start tracking
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    // Hide tab
    act(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.isActive).toBe(false);

    // Show tab again — should auto-resume
    act(() => {
      Object.defineProperty(document, "hidden", {
        value: false,
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.isActive).toBe(true);
  });

  it("reading window resets on each interaction", () => {
    const { result } = renderHook(() =>
      useEngagedTime({ readingWindow: 10_000 }),
    );

    // Start
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    // Advance 8s (still within window)
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(result.current.isActive).toBe(true);

    // Interact again — resets the 10s window
    act(() => {
      document.dispatchEvent(new Event("scroll"));
    });

    // Advance another 8s (still within NEW window)
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(result.current.isActive).toBe(true);

    // Advance past the window
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.isActive).toBe(false);
  });
});
