import React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ScrollHintContainer from "../ScrollHintContainer";

function renderWithMetrics(metrics: {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
}) {
  const view = render(
    <ScrollHintContainer>
      <div>content</div>
    </ScrollHintContainer>,
  );
  const scroller = screen.getByText("content").parentElement!.parentElement!;
  Object.defineProperty(scroller, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(scroller, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
  return { ...view, scroller };
}

const visible = (id: string) =>
  screen.getByTestId(id).getAttribute("data-visible");

describe("ScrollHintContainer", () => {
  it("shows no arrows when content fits", () => {
    const { scroller } = renderWithMetrics({
      scrollHeight: 300,
      clientHeight: 300,
      scrollTop: 0,
    });
    act(() => {
      fireEvent.scroll(scroller);
    });
    expect(visible("scroll-hint-up")).toBe("false");
    expect(visible("scroll-hint-down")).toBe("false");
  });

  it("shows only the down arrow at the top", () => {
    const { scroller } = renderWithMetrics({
      scrollHeight: 900,
      clientHeight: 300,
      scrollTop: 0,
    });
    act(() => {
      fireEvent.scroll(scroller);
    });
    expect(visible("scroll-hint-up")).toBe("false");
    expect(visible("scroll-hint-down")).toBe("true");
  });

  it("shows both arrows in the middle", () => {
    const { scroller } = renderWithMetrics({
      scrollHeight: 900,
      clientHeight: 300,
      scrollTop: 200,
    });
    act(() => {
      fireEvent.scroll(scroller);
    });
    expect(visible("scroll-hint-up")).toBe("true");
    expect(visible("scroll-hint-down")).toBe("true");
  });

  it("shows only the up arrow at the bottom", () => {
    const { scroller } = renderWithMetrics({
      scrollHeight: 900,
      clientHeight: 300,
      scrollTop: 600,
    });
    act(() => {
      fireEvent.scroll(scroller);
    });
    expect(visible("scroll-hint-up")).toBe("true");
    expect(visible("scroll-hint-down")).toBe("false");
  });

  it("scrolls by a page on click without bubbling to the drawer wrapper", () => {
    const onWrapperClick = vi.fn();
    render(
      <div onClick={onWrapperClick}>
        <ScrollHintContainer>
          <div>content</div>
        </ScrollHintContainer>
      </div>,
    );
    const scroller = screen.getByText("content").parentElement!.parentElement!;
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 500,
    });
    const scrollBy = vi.fn();
    scroller.scrollBy = scrollBy;

    fireEvent.click(screen.getByTestId("scroll-hint-down"));

    expect(scrollBy).toHaveBeenCalledWith({ top: 400, behavior: "smooth" });
    expect(onWrapperClick).not.toHaveBeenCalled();
  });
});
