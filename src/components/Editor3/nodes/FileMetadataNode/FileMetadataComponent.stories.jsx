import React from "react";
import FileMetadataComponent from "./FileMetadataComponent";
import { Box } from "@mui/material";

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
  path: "public/images/cell-diagram.png",
  mimeType: "image/png",
  size: 345678,
  owner: "mock-user",
  _version: 1,
};

const mockParsedContent = {
  id: "parsed-1",
  documentID: "file-1",
  vocabularyJSON: JSON.stringify([
    { phrase: "mitochondria", definition: "organelle that generates ATP" },
    { phrase: "chloroplast", definition: "organelle for photosynthesis" },
  ]),
  summariesJSON: JSON.stringify([
    "Cell structure overview covering organelles and their functions.",
  ]),
  objectivesJSON: JSON.stringify([
    "Identify major cell organelles",
    "Explain cellular respiration",
  ]),
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
};

export const ImageFile = {
  args: {
    nodeKey: "node-2",
    file: mockImageFile,
    parsedContent: null,
    onFileNameUpdate: (name) => console.log("Filename updated:", name),
    onRemove: () => console.log("Removed"),
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
};

export const NoParsedContent = {
  args: {
    nodeKey: "node-4",
    file: mockPdfFile,
    parsedContent: null,
    onFileNameUpdate: () => {},
    onRemove: () => {},
  },
};
