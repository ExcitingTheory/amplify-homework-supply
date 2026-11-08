import { afterEach, describe, expect, it, vi } from "vitest";
import { createEditor } from "lexical";
import { scrollToEditorNode } from "../scrollToEditorNode";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("editor navigation scrolling", () => {
  it.each([
    { paneTop: 160, menuBottom: 120, expectedTop: 480 },
    { paneTop: 60, menuBottom: 140, expectedTop: 500 },
  ])("aligns below the menu without double-counting the pane offset ($paneTop)", ({
    paneTop, menuBottom, expectedTop,
  }) => {
    const pane = document.createElement("div");
    const wrapper = document.createElement("div");
    const block = document.createElement("h2");
    pane.style.overflowY = "auto";
    wrapper.style.overflowY = "auto";
    wrapper.append(block);
    pane.append(wrapper);
    document.body.append(pane);
    Object.defineProperties(pane, {
      clientHeight: { value: 600 },
      scrollHeight: { value: 2000 },
    });
    pane.scrollTop = 40;
    vi.spyOn(pane, "getBoundingClientRect").mockReturnValue(new DOMRect(0, paneTop, 800, 600));
    vi.spyOn(block, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 600, 800, 40));
    const scrollPane = vi.spyOn(pane, "scrollTo");
    const scrollWrapper = vi.spyOn(wrapper, "scrollTo");
    const scrollPage = vi.spyOn(window, "scrollTo");
    const editor = createEditor();
    vi.spyOn(editor, "getElementByKey").mockReturnValue(block);

    scrollToEditorNode(editor, "heading", menuBottom);

    expect(scrollPane).toHaveBeenCalledWith({ top: expectedTop, behavior: "smooth" });
    expect(scrollPage).not.toHaveBeenCalled();
    expect(scrollWrapper).not.toHaveBeenCalled();
  });

  it("uses the current menu height when the document itself scrolls", () => {
    const block = document.createElement("h2");
    document.body.append(block);
    vi.spyOn(block, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 600, 800, 40));
    const scroll = vi.spyOn(window, "scrollTo");
    const editor = createEditor();
    vi.spyOn(editor, "getElementByKey").mockReturnValue(block);

    scrollToEditorNode(editor, "heading", 120);
    expect(scroll).toHaveBeenLastCalledWith({ top: 480, behavior: "smooth" });
    scrollToEditorNode(editor, "heading", 200);
    expect(scroll).toHaveBeenLastCalledWith({ top: 400, behavior: "smooth" });
  });
});
