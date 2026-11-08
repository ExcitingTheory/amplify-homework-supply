import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { createEditor } from "lexical";
import { afterEach, expect, it, vi } from "vitest";
import { $createPdfViewerNode, PdfViewerNode } from "../PdfViewerNode";

vi.mock("../PdfViewerComponent", () => ({
  default: () => {
    throw new Error("PDF module failed");
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("keeps the surrounding editor visible when the PDF viewer fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const editor = createEditor({ nodes: [PdfViewerNode] });
  let pdf: React.ReactNode;
  editor.update(() => {
    pdf = $createPdfViewerNode({
      path: "public/sample.pdf",
      identityId: "identity",
      filename: "sample.pdf",
    }).decorate();
  }, { discrete: true });

  render(<><div>Editor toolbar</div>{pdf}</>);

  expect(await screen.findByText("componentErrorBoundary.couldNotLoad")).toBeInTheDocument();
  expect(screen.getByText("Editor toolbar")).toBeInTheDocument();
});
