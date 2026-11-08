import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EditorWorkspace from "../EditorWorkspace";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

let resize: (width: number) => void;

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      resize = (width) => this.callback([{
        target,
        contentRect: new DOMRectReadOnly(0, 0, width, 800),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      }], this);
    }
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

function Workspace({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [leftOpen, setLeftOpen] = React.useState(initiallyOpen);
  const [rightOpen, setRightOpen] = React.useState(initiallyOpen);
  return (
    <EditorWorkspace
      appBarHeight={120}
      toolbar={null}
      left={{
        label: "Files",
        width: 640,
        open: leftOpen,
        onClose: () => setLeftOpen(false),
        content: <button onClick={() => setLeftOpen(true)}>Open files</button>,
      }}
      right={{
        label: "Assistant",
        width: 350,
        open: rightOpen,
        onClose: () => setRightOpen(false),
        content: <button onClick={() => setRightOpen(true)}>Open assistant</button>,
      }}
    >
      <div contentEditable suppressContentEditableWarning>Lesson content</div>
    </EditorWorkspace>
  );
}

const panel = (name: string) => screen.getByRole("complementary", { name });

describe("EditorWorkspace", () => {
  it("overlays open panels without a modal so the document stays a drop target", async () => {
    render(
      <ThemeProvider theme={createTheme({
        components: { MuiModal: { defaultProps: { disablePortal: true } } },
      })}>
        <Workspace />
      </ThemeProvider>,
    );
    act(() => resize(1700));
    fireEvent.click(screen.getByRole("button", { name: "Open files" }));
    const files = panel("Files");
    expect(files).toHaveAttribute("data-open", "true");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".MuiBackdrop-root")).toBeNull();

    const rail = document.querySelector('[data-sidebar-rail="left"]') as HTMLElement;
    const drawer = files.closest(".MuiDrawer-root") as HTMLElement;
    expect(getComputedStyle(rail).width).toBe("40px");
    expect(drawer).toHaveStyle({ position: "absolute", left: "0px", width: "640px", maxWidth: "1620px" });

    const lesson = screen.getByText("Lesson content");
    expect(lesson.closest("[aria-hidden='true']")).toBeNull();
    const drop = vi.fn();
    lesson.addEventListener("drop", drop);
    fireEvent.drop(lesson);
    expect(drop).toHaveBeenCalled();
    expect(files).toHaveAttribute("data-open", "true");
  });

  it("closes an overlay with Escape or its close button while retaining the tab rail", async () => {
    render(<Workspace />);
    act(() => resize(900));
    fireEvent.click(screen.getByRole("button", { name: "Open files" }));
    fireEvent.keyDown(panel("Files"), { key: "Escape" });
    expect(panel("Files")).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByRole("button", { name: "Open files" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.close" }));
    expect(panel("Files")).toHaveAttribute("data-open", "false");
    expect(screen.getByRole("button", { name: "Open files" })).toBeTruthy();
  });

  it("keeps both panels open only when the overlays do not collide", async () => {
    render(<Workspace initiallyOpen />);
    act(() => resize(1700));
    expect(panel("Files")).toHaveAttribute("data-open", "true");
    expect(panel("Assistant")).toHaveAttribute("data-open", "true");

    act(() => resize(900));
    await waitFor(() => expect(panel("Assistant")).toHaveAttribute("data-open", "false"));
    expect(panel("Files")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "actions.close" }));
    fireEvent.click(screen.getByRole("button", { name: "Open assistant" }));
    expect(panel("Assistant")).toHaveAttribute("data-open", "true");
    expect(panel("Files")).toHaveAttribute("data-open", "false");
  });
});
