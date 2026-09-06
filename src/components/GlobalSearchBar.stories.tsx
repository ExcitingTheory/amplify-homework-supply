import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import GlobalSearchBar from "./GlobalSearchBar";
import SearchContext from "../context/searchContext";
import type { SearchResult } from "../context/searchContext";

const mockResults: SearchResult[] = [
  { type: "unit", id: "u1", title: "Cell Biology Basics", score: 0.95 },
  {
    type: "word",
    id: "w1",
    title: "Photosynthesis",
    description: "Process by which plants make food",
    score: 0.87,
  },
  { type: "file", id: "f1", title: "Chapter 3 Notes.pdf", score: 0.75 },
  { type: "question", id: "q1", title: "What is mitosis?", score: 0.68 },
];

function MockSearchProvider({
  children,
  results = [],
  searching = false,
}: {
  children: React.ReactNode;
  results?: SearchResult[];
  searching?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [currentResults, setCurrentResults] =
    React.useState<SearchResult[]>(results);
  const executeSearch = fn(async (q: string) => {
    setCurrentResults(q.length >= 2 ? results : []);
  });
  const clearSearch = fn(() => {
    setQuery("");
    setCurrentResults([]);
    setOpen(false);
  });

  return (
    <SearchContext.Provider
      value={{
        query,
        results: currentResults,
        searching,
        open,
        setQuery: (q) => {
          setQuery(q);
          setOpen(q.length > 0);
        },
        executeSearch,
        clearSearch,
        setOpen,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

const meta: Meta<typeof GlobalSearchBar> = {
  title: "🧩 UI Components/Global Search Bar",
  component: GlobalSearchBar,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof GlobalSearchBar>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <MockSearchProvider results={mockResults}>
        <Story />
      </MockSearchProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Search input is present
    const searchInput = canvas.getByRole("textbox", { name: /global search/i });
    expect(searchInput).toBeInTheDocument();

    // Type a search query
    await userEvent.type(searchInput, "cell{Enter}");

    // Dropdown should open with results
    await within(document.body).findByText("Cell Biology Basics");
  },
};

export const WithResults: Story = {
  name: "With Results",
  decorators: [
    (Story) => (
      <div style={{ width: 500 }}>
        <MockSearchProvider results={mockResults}>
          <Story />
        </MockSearchProvider>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole("textbox", { name: /global search/i });

    // Type to trigger search
    await userEvent.type(searchInput, "biology{Enter}");

    // Results appear grouped by type
    await within(document.body).findByText("Cell Biology Basics");

    // Clear the search with Escape
    await userEvent.keyboard("{Escape}");
  },
};

export const InToolbar: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          width: 400,
          padding: 16,
          background: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <MockSearchProvider results={mockResults}>
          <Story />
        </MockSearchProvider>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole("textbox", { name: /global search/i });
    await userEvent.type(searchInput, "notes{Enter}");
    await within(document.body).findByText("Chapter 3 Notes.pdf");
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <MockSearchProvider results={[]} searching={true}>
        <Story />
      </MockSearchProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("textbox", { name: /global search/i }),
    ).toBeInTheDocument();
  },
};

export const Error: Story = {
  decorators: [
    (Story) => (
      <MockSearchProvider results={[]}>
        <Story />
      </MockSearchProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole("textbox", { name: /global search/i });
    await userEvent.type(searchInput, "nonexistent{Enter}");
    const body = within(document.body);
    const results = body.queryByText("Cell Biology Basics");
    expect(results).toBeNull();
  },
};
