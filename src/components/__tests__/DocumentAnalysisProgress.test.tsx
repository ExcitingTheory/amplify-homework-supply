import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentAnalysisProgress from "../DocumentAnalysisProgress";

vi.mock("next-intl", () => ({
  useTranslations: () =>
    Object.assign((key: string) => key, { has: () => false }),
}));

describe("DocumentAnalysisProgress", () => {
  it("uses a persistent snackbar while working and a completion snackbar afterward", async () => {
    const { rerender } = render(
      <DocumentAnalysisProgress
        documentStatus={{
          status: "analyzing",
          analysis: { state: "analyzing", done: 1, totalPages: 3 },
        }}
      />,
    );

    expect(await screen.findByRole("status")).toHaveTextContent("analyzing");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(
      <DocumentAnalysisProgress
        documentStatus={{
          status: "analyzing",
          analysis: { state: "completed", done: 3, totalPages: 3 },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "fileManager2.documentStatus.analyzed",
      );
    });
    expect(screen.getByTestId("document-analysis-snackbar")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows a failure snackbar after analysis fails", async () => {
    const { rerender } = render(
      <DocumentAnalysisProgress
        documentStatus={{ status: "extracting" }}
      />,
    );
    await screen.findByRole("status");

    rerender(
      <DocumentAnalysisProgress documentStatus={{ status: "failed" }} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "fileManager2.documentStatus.failed",
    );
  });

  it("does not show a completion snackbar for an already-finished document", () => {
    render(
      <DocumentAnalysisProgress documentStatus={{ status: "completed" }} />,
    );

    expect(
      screen.queryByTestId("document-analysis-snackbar"),
    ).not.toBeInTheDocument();
  });
});
