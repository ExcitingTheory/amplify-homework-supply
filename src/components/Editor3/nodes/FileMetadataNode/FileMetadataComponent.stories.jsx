import React from "react";
import FileMetadataComponent from "./FileMetadataComponent";
import { Box } from "@mui/material";
import { expect, within } from "storybook/test";

const mockPdfFile = {
  id: "file-1",
  name: "biology-cell-structure.pdf",
  path: "public/documents/biology-cell-structure.pdf",
  mimeType: "application/pdf",
  size: 2456789,
  owner: "mock-user",
  _version: 1,
};

const mockImageFile = {
  id: "file-2",
  name: "cell-diagram.png",
  path: "/story-mocks/animals-10008941_1280.jpg",
  mimeType: "image/png",
  size: 345678,
  owner: "mock-user",
  _version: 1,
};

// Normalized shape consumed by FileMetadataComponent (see FileMetadataNode /
// FileManager2 handleInsertIntoEditor which maps the raw ParsedContent model
// fields — vocabularyJSON { word, definition, context, page }, etc. — into this).
const mockParsedContent = {
  id: "parsed-1",
  documentID: "file-1",
  vocabulary: [
    { term: "mitochondria", definition: "organelle that generates ATP" },
    { term: "chloroplast", definition: "organelle for photosynthesis" },
  ],
  summaries: [
    {
      content:
        "Cell structure overview covering organelles and their functions.",
      type: "Overview",
    },
  ],
  objectives: [
    { description: "Identify major cell organelles", type: "Remember" },
    { description: "Explain cellular respiration", type: "Understand" },
  ],
  concepts: [
    {
      name: "Organelles",
      description:
        "Specialized subunits within a cell with specific functions.",
    },
  ],
  questions: [
    { question: "What organelle generates ATP?", answer: "Mitochondria" },
  ],
  status: "completed",
};

export default {
  title: "✏️ Lesson Editor/Nodes/File Metadata",
  component: FileMetadataComponent,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Story />
      </Box>
    ),
  ],
};

export const PdfWithParsedContent = {
  args: {
    nodeKey: "node-1",
    file: mockPdfFile,
    parsedContent: mockParsedContent,
    onFileNameUpdate: (name) => console.log("Filename updated:", name),
    onRemove: () => console.log("Removed"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/biology-cell-structure/)).toBeTruthy();
  },
};

export const ImageFile = {
  args: {
    nodeKey: "node-2",
    file: mockImageFile,
    parsedContent: null,
    onFileNameUpdate: (name) => console.log("Filename updated:", name),
    onRemove: () => console.log("Removed"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/cell-diagram/)).toBeTruthy();
  },
};

export const WithSearch = {
  args: {
    nodeKey: "node-3",
    file: mockPdfFile,
    parsedContent: mockParsedContent,
    search: "mitochondria",
    onFileNameUpdate: () => {},
    onRemove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/biology-cell-structure/)).toBeTruthy();
  },
};

export const NoParsedContent = {
  args: {
    nodeKey: "node-4",
    file: mockPdfFile,
    parsedContent: null,
    onFileNameUpdate: () => {},
    onRemove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/biology-cell-structure/)).toBeTruthy();
  },
};
