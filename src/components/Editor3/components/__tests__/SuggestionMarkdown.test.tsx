import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SuggestionMarkdown from "../SuggestionMarkdown";
import "../SuggestionBlockPreview";
import DictionaryContext from "../../../../context/dictionaryContext";

vi.mock("../../../../context/dictionaryContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ wordMapId: {} }) };
});
vi.mock("../../../../context/unitContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ unit: { id: "unit-1" } }) };
});

afterEach(cleanup);

describe("SuggestionMarkdown", () => {
  it("renders markdown instead of its source", () => {
    const { container } = render(
      <SuggestionMarkdown markdown={"**bold** text\n\n## Heading\n\n- one\n- two"} />,
    );
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("##");
  });

  it("renders actual word and meaning blocks in an inert preview", async () => {
    const word = { id: "word-1", phrase: "Chloroplast", definition: "A cell organelle" };
    const { container } = render(
      <DictionaryContext.Provider value={{ wordMapId: { [word.id]: word } }}>
        <SuggestionMarkdown
          markdown={"Read this.\n\n- :::word{w1}\n\n:::meaning[w1]"}
          referenceContext={{
            idByReference: { w1: word.id },
            fileById: {},
            questionById: {},
          }}
        />
      </DictionaryContext.Provider>,
    );
    const wordBlock = container.querySelector('[data-block-type="word"]');
    const meaningBlock = container.querySelector('[data-block-type="meaning"]');
    expect(await screen.findAllByText("Chloroplast", {}, { timeout: 20000 })).not.toHaveLength(0);
    expect(wordBlock?.querySelector("[inert]")).toBeInTheDocument();
    expect(meaningBlock?.querySelector("[inert]")).toBeInTheDocument();
    expect(wordBlock?.querySelector(".MuiCard-root")).toBeInTheDocument();
    expect(await screen.findByRole("grid", { hidden: true }, { timeout: 20000 })).toBeInTheDocument();
    expect(container.textContent).not.toContain(":::");
  });

});
