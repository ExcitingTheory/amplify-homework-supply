import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentExtractionWarnings from "../DocumentExtractionWarnings";

vi.mock("next-intl", () => ({
  useTranslations: () => Object.assign((key: string) => key, { has: () => false }),
}));

describe("DocumentExtractionWarnings", () => {
  it.each([undefined, null, {}, { analysis: { reviewWarnings: [] } }])(
    "does not warn for documents without extraction issues (%j)", (metadata) => {
      render(<DocumentExtractionWarnings metadata={metadata} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );
  it.each([false, true])("shows actionable warnings from metadata (JSON=%s)", (json) => {
    const metadata = { analysis: {
      reviewWarnings: ['Page 2: vocabulary "Lysosomes": answer_not_in_source'],
      reviewWarningCount: 2,
    } };
    render(<DocumentExtractionWarnings metadata={json ? JSON.stringify(metadata) : metadata} />);
    expect(screen.getByRole("alert")).toHaveTextContent("AI extraction needs human review");
    expect(screen.getByRole("alert")).toHaveTextContent("import remains available");
    expect(screen.getByRole("listitem")).toHaveTextContent('Page 2: vocabulary "Lysosomes"');
    expect(screen.getByText(/Showing the first review warnings/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("reports invalid metadata instead of silently showing no warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<DocumentExtractionWarnings metadata="{bad json" />);
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to read extraction review warnings");
      expect(error).toHaveBeenCalledOnce();
    } finally { error.mockRestore(); }
  });
});
