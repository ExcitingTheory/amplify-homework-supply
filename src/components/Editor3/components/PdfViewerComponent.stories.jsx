import React from "react";
import PdfViewerComponent from "./PdfViewerComponent";
import { Box } from "@mui/material";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { expect, waitFor, within } from "storybook/test";
import { MOCK_JAPANESE_GRAMMAR_PDF } from "../../../../.storybook/__mocks__/mockDocuments";

function LexicalWrapper({ children }) {
  const initialConfig = {
    namespace: "PdfViewerStory",
    onError: (error) => console.error(error),
    nodes: [],
  };
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable style={{ display: "none" }} />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {children}
    </LexicalComposer>
  );
}

export default {
  title: "✏️ Lesson Editor/Media/PDF Viewer",
  component: PdfViewerComponent,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <LexicalWrapper>
          <Story />
        </LexicalWrapper>
      </Box>
    ),
  ],
};

export const Default = {
  args: {
    path: "public/documents/sample.pdf",
    identityId: "mock-identity",
    filename: "biology-cell-structure.pdf",
    nodeKey: "pdf-node-1",
  },
};

export const LongFilename = {
  args: {
    path: "public/documents/very-long-filename-that-might-truncate.pdf",
    identityId: "mock-identity",
    filename:
      "advanced-biology-chapter-12-cellular-respiration-and-photosynthesis-review.pdf",
    nodeKey: "pdf-node-2",
  },
};

export const IntegratedPage = {
  args: {
    ...Default.args,
    path: MOCK_JAPANESE_GRAMMAR_PDF,
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const assertPageLayout = async () => {
      await waitFor(() => {
        const page = canvasElement.querySelector(".react-pdf__Page__canvas");
        const viewport = canvasElement.querySelector("[data-pdf-viewport]");
        const controls = canvasElement.querySelector("[data-pdf-controls]");
        const content = canvasElement.querySelector("[data-pdf-page-content]");
        expect(page).toBeTruthy();
        expect(page.height).toBeGreaterThan(0);
        const bounds = page.getBoundingClientRect();
        const frame = canvasElement.querySelector("[data-pdf-page-frame]");
        expect(Math.abs(controls.getBoundingClientRect().width - frame.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
        expect(Math.abs(content.scrollWidth - Math.max(bounds.width, content.clientWidth))).toBeLessThanOrEqual(1);
        expect(getComputedStyle(controls).position).toBe("sticky");
        expect(getComputedStyle(controls).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(content.getBoundingClientRect().height - bounds.height).toBeLessThanOrEqual(20);
        expect(viewport.scrollHeight - viewport.clientHeight).toBeLessThanOrEqual(1);
        expect(getComputedStyle(viewport).backgroundColor).toBe("rgba(0, 0, 0, 0)");
        expect(getComputedStyle(content).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      });
    };
    await assertPageLayout();
    await waitFor(() => {
      const viewport = canvasElement.querySelector("[data-pdf-viewport]");
      const frame = canvasElement.querySelector("[data-pdf-page-frame]");
      const style = getComputedStyle(viewport);
      const contentWidth = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      expect(Math.abs(frame.getBoundingClientRect().width - contentWidth)).toBeLessThanOrEqual(1);
      expect(parseFloat(style.paddingTop)).toBeGreaterThanOrEqual(4);
      expect(parseFloat(style.paddingBottom)).toBeGreaterThanOrEqual(4);
    });
    const initialWidth = canvasElement.querySelector(".react-pdf__Page__canvas").getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => {
      const width = canvasElement.querySelector(".react-pdf__Page__canvas").getBoundingClientRect().width;
      expect(width).toBeCloseTo(initialWidth * 1.25, 0);
    });
    await assertPageLayout();
    await userEvent.click(canvas.getByRole("button", { name: "Zoom out" }));
    await assertPageLayout();
    const next = canvas.getByRole("button", { name: "Next page" });
    if (!next.disabled) {
      await userEvent.click(next);
      await canvas.findByText(/^2 \//);
      await assertPageLayout();
    }
  },
};

export const NarrowPage = {
  ...IntegratedPage,
  render: (args) => (
    <Box sx={{ width: 280, maxWidth: "100%" }}>
      <PdfViewerComponent {...args} />
    </Box>
  ),
};

export const NarrowZoomInEditor = {
  args: IntegratedPage.args,
  render: (args) => (
    // The editor's global `* { max-width: 100% }` rule once squashed zoomed canvases here.
    <Box className="editor-container" sx={{ width: 280, maxWidth: "100%" }}>
      <PdfViewerComponent {...args} />
    </Box>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const pageCanvas = () => canvasElement.querySelector(".react-pdf__Page__canvas");
    await waitFor(() => {
      expect(pageCanvas()?.height).toBeGreaterThan(0);
      expect(pageCanvas().getBoundingClientRect().width).toBeLessThanOrEqual(280);
    });
    const initialWidth = pageCanvas().getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => {
      const bounds = pageCanvas().getBoundingClientRect();
      const content = canvasElement.querySelector("[data-pdf-page-content]");
      expect(bounds.width).toBeCloseTo(initialWidth * 1.5, 0);
      expect(bounds.width / bounds.height).toBeCloseTo(pageCanvas().width / pageCanvas().height, 2);
      expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
    });

    const darkPages = canvas.getByRole("button", { name: "Dark pages" });
    const initiallyDark = darkPages.getAttribute("aria-pressed") === "true";
    await userEvent.click(darkPages);
    await waitFor(() => {
      const filter = getComputedStyle(canvasElement.querySelector(".react-pdf__Page")).filter;
      if (initiallyDark) expect(filter).toBe("none");
      else expect(filter).toContain("invert");
    });
    await userEvent.click(darkPages);
  },
};
