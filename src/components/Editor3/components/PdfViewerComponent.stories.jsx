import React from "react";
import PdfViewerComponent from "./PdfViewerComponent";
import { Box } from "@mui/material";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

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
