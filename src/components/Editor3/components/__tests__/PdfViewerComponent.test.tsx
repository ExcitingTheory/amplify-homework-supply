import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PdfViewerComponent, { DARK_PAGES_STORAGE_KEY } from "../PdfViewerComponent";
import getCachedUrl from "../../../../utils/getCachedUrl";

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ width, scale = 1 }: { width: number; scale?: number }) => (
    <div className="react-pdf__Page" data-testid="pdf-page" data-width={width * scale}>PDF page</div>
  ),
  pdfjs: { GlobalWorkerOptions: {} },
}));
vi.mock("../../../../utils/getCachedUrl", () => ({ default: vi.fn() }));
vi.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [
    { registerCommand: () => () => {} },
  ],
}));
const selection = vi.hoisted(() => ({ isSelected: false }));
const scheme = vi.hoisted(() => ({ mode: "system", systemMode: "light" }));
vi.mock("@mui/material/styles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mui/material/styles")>()),
  useColorScheme: () => scheme,
}));
vi.mock("@lexical/react/useLexicalNodeSelection", () => ({
  useLexicalNodeSelection: () => [selection.isSelected, () => {}, () => {}],
}));

afterEach(() => {
  cleanup();
  selection.isSelected = false;
  scheme.mode = "system";
  scheme.systemMode = "light";
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PdfViewerComponent", () => {
  const props = {
    path: "public/sample.pdf",
    identityId: "identity",
    filename: "sample.pdf",
    nodeKey: "node",
  };

  it("spans the available width while loading and loaded", async () => {
    let resolveUrl: (url: string) => void = () => {
      throw new Error("PDF URL promise was not initialized");
    };
    vi.mocked(getCachedUrl).mockReturnValue(
      new Promise<string>((resolve) => { resolveUrl = resolve; }),
    );
    const { container } = render(<PdfViewerComponent {...props} />);
    expect(container.firstElementChild).toHaveStyle({ width: "100%" });
    expect(container.firstElementChild).not.toHaveStyle({ maxWidth: "672px" });

    resolveUrl("https://example.com/sample.pdf");
    await screen.findByText("PDF page");
    expect(container.firstElementChild).toHaveStyle({ width: "100%" });
    expect(container.firstElementChild).not.toHaveStyle({ maxWidth: "672px" });
  });

  it("spans the available width in the error state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getCachedUrl).mockRejectedValue(new Error("Unavailable"));
    const { container } = render(<PdfViewerComponent {...props} />);
    await screen.findByText("Failed to load PDF");
    expect(container.firstElementChild).toHaveStyle({ width: "100%" });
    expect(container.firstElementChild).not.toHaveStyle({ maxWidth: "672px" });

  });

  it("uses a single zoom factor and sizes the frame to the rendered page", async () => {
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const user = userEvent.setup();
    const { container } = render(<PdfViewerComponent {...props} />);
    const page = await screen.findByTestId("pdf-page");
    const frame = container.querySelector("[data-pdf-page-frame]");
    expect(page).toHaveAttribute("data-width", "600");
    expect(frame).toHaveStyle({ width: "600px" });

    await user.click(screen.getByRole("button", { name: "pdfViewerComponent.zoomIn" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(page).toHaveAttribute("data-width", "750");
    expect(frame).toHaveStyle({ width: "750px" });

    await user.click(screen.getByRole("button", { name: "pdfViewerComponent.zoomOut" }));
    expect(page).toHaveAttribute("data-width", "600");
    expect(frame).toHaveStyle({ width: "600px" });
  });

  it("fits a resized editor without imposing a fixed page height", async () => {
    let resize: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: typeof resize) { resize = callback; }
      observe() {}
      disconnect = disconnect;
    });
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const { container, unmount } = render(<PdfViewerComponent {...props} />);
    const page = await screen.findByTestId("pdf-page");
    if (!resize) throw new Error("Viewer resize observer was not registered");
    act(() => resize?.([{ contentRect: { width: 280 } }]));
    expect(page).toHaveAttribute("data-width", "280");
    expect(container.querySelector("[data-pdf-page-frame]")).toHaveStyle({ width: "280px" });
    expect(container.querySelector("[data-pdf-page-content]")).toHaveStyle({
      backgroundColor: "transparent",
    });
    expect(container.querySelector("[data-pdf-page-content]")).not.toHaveStyle({ maxHeight: "800px" });
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("fills wide editors and keeps the selection outline inside the scroll viewport", async () => {
    let resize: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: typeof resize) { resize = callback; }
      observe() {}
      disconnect() {}
    });
    selection.isSelected = true;
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const { container } = render(<PdfViewerComponent {...props} />);
    const page = await screen.findByTestId("pdf-page");
    act(() => resize?.([{ contentRect: { width: 1100 } }]));
    expect(page).toHaveAttribute("data-width", "1100");

    const viewport = container.querySelector("[data-pdf-viewport]");
    const frame = container.querySelector("[data-pdf-page-frame]");
    expect(frame).toHaveStyle({ width: "1100px", outlineWidth: "2px", outlineOffset: "2px" });
    expect(viewport).toHaveStyle({ padding: "4px" });
    expect(viewport).not.toHaveStyle({ overflowX: "auto" });
  });

  it("pins the controls while zoomed pages scroll sideways inside the frame", async () => {
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const user = userEvent.setup();
    const { container } = render(
      <div style={{ "--editor-scroll-padding": "12px" } as React.CSSProperties}>
        <PdfViewerComponent {...props} />
      </div>,
    );
    await screen.findByTestId("pdf-page");
    await user.click(screen.getByRole("button", { name: "pdfViewerComponent.zoomIn" }));

    expect(container.querySelector("[data-pdf-controls]")).toHaveStyle({ position: "sticky", top: "calc(-1 * 12px)" });
    expect(container.querySelector("[data-pdf-page-frame]")).toHaveStyle({ width: "750px", maxWidth: "100%" });
    expect(container.querySelector("[data-pdf-page-content]")).toHaveStyle({ overflowX: "auto" });
    for (let element = container.querySelector("[data-pdf-controls]")!.parentElement;
      element && element !== container.firstElementChild;
      element = element.parentElement) {
      expect(getComputedStyle(element).overflowX).not.toMatch(/auto|scroll|hidden/);
    }
  });

  it("defaults dark pages to the color scheme and stores only a differing override", async () => {
    scheme.systemMode = "dark";
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const user = userEvent.setup();
    render(<PdfViewerComponent {...props} />);
    const page = await screen.findByTestId("pdf-page");
    const toggle = screen.getByRole("button", { name: "pdfViewerComponent.darkPages" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(page).toHaveStyle({ filter: "invert(0.9) hue-rotate(180deg)" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(page).toHaveStyle({ filter: "none" });
    expect(window.localStorage.getItem(DARK_PAGES_STORAGE_KEY)).toBe("off");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem(DARK_PAGES_STORAGE_KEY)).toBeNull();
  });

  it("restores a stored override over the color scheme", async () => {
    window.localStorage.setItem(DARK_PAGES_STORAGE_KEY, "on");
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    render(<PdfViewerComponent {...props} />);
    await screen.findByTestId("pdf-page");
    expect(screen.getByRole("button", { name: "pdfViewerComponent.darkPages" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("requests native fullscreen for the viewer", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true, value: requestFullscreen,
    });
    try {
      vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
      const user = userEvent.setup();
      const { container } = render(<PdfViewerComponent {...props} />);
      await screen.findByTestId("pdf-page");
      await user.click(screen.getByRole("button", { name: "pdfViewerComponent.enterFullScreen" }));
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      expect(requestFullscreen.mock.contexts[0]).toBe(container.querySelector("[data-pdf-viewport]"));
    } finally {
      delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
    }
  });

  it("falls back to an in-page overlay without element fullscreen and closes on Escape", async () => {
    vi.mocked(getCachedUrl).mockResolvedValue("https://example.com/sample.pdf");
    const user = userEvent.setup();
    const { container } = render(<PdfViewerComponent {...props} />);
    await screen.findByTestId("pdf-page");
    const viewport = container.querySelector("[data-pdf-viewport]");

    await user.click(screen.getByRole("button", { name: "pdfViewerComponent.enterFullScreen" }));
    expect(viewport).toHaveAttribute("data-fullscreen", "true");
    expect(viewport).toHaveStyle({ position: "fixed", overflowY: "auto" });

    await user.keyboard("{Escape}");
    expect(viewport).not.toHaveAttribute("data-fullscreen");
    expect(screen.getByRole("button", { name: "pdfViewerComponent.enterFullScreen" })).toBeInTheDocument();
  });
});
