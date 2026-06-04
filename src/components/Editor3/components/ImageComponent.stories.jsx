import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { Box } from "@mui/material";
import ImageComponent from "./ImageComponent";
import { ImageNode } from "./ImageNode";

/**
 * Minimal Lexical editor configuration required to render ImageComponent in isolation.
 * ImageComponent calls useLexicalComposerContext() internally, so it must always be
 * wrapped in a LexicalComposer.
 */
const lexicalConfig = {
  namespace: "ImageComponentStories",
  nodes: [ImageNode],
  onError: (error) => console.error("[Storybook Lexical]", error),
  theme: {},
};

function LexicalWrapper({ children }) {
  return (
    <LexicalComposer initialConfig={lexicalConfig}>{children}</LexicalComposer>
  );
}

export default {
  title: "✏️ Lesson Editor/Media/Image",
  component: ImageComponent,
  parameters: {
    layout: "padded",
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
  decorators: [
    (Story) => (
      <LexicalWrapper>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Story />
        </Box>
      </LexicalWrapper>
    ),
  ],
};

/**
 * Image with fileId + identityId — exercises the Phase 6 CDN path rewriting.
 * After publishUnit runs, `path` will point to `protected/units/images/{fileId}`
 * and `identityId` will be cleared to `""`.
 */
export const WithFileId = {
  args: {
    fileId: "abc123-def456",
    identityId: "us-east-1:mock-identity-id-0001",
    path: "protected/us-east-1:mock-identity-id-0001/abc123-def456",
    src: "",
    altText: "A diagram of cell structure",
    nodeKey: "image-node-with-fileid",
    width: 600,
    height: 400,
    maxWidth: 800,
    resizable: false,
    showCaption: false,
    captionsEnabled: false,
  },
};

/**
 * Image with a direct src URL — no fileId/identityId (e.g. an externally hosted image
 * or an image imported before Phase 6 migration). Verifies the component falls back
 * to rendering via the `src` prop rather than via getCachedUrl.
 */
export const WithSrcOnly = {
  args: {
    src: "https://picsum.photos/seed/editor/600/400",
    path: "",
    fileId: "",
    identityId: "",
    altText: "A placeholder image loaded from a URL",
    nodeKey: "image-node-src-only",
    width: 600,
    height: 400,
    maxWidth: 800,
    resizable: false,
    showCaption: false,
    captionsEnabled: false,
  },
};

/**
 * Published image — simulates a node that has already been through publishUnit.
 * path is under protected/units/images/ and identityId is cleared.
 */
export const PublishedPath = {
  args: {
    fileId: "abc123-def456",
    identityId: "",
    path: "protected/units/images/abc123-def456",
    src: "",
    altText: "Published cell structure diagram",
    nodeKey: "image-node-published",
    width: 600,
    height: 400,
    maxWidth: 800,
    resizable: false,
    showCaption: false,
    captionsEnabled: false,
  },
};
