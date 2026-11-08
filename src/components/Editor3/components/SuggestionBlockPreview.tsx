import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $getRoot } from "lexical";
import { EditorNodes } from "../editorConfig";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import { $parseMarkdownToNodes } from "../utils/insertMarkdown";
import {
  resolveSuggestionReferences,
  type SuggestionReferenceCatalog,
} from "../plugins/suggestionReferences";

interface SuggestionBlockPreviewProps {
  markdown: string;
  referenceContext: Pick<
    SuggestionReferenceCatalog,
    "idByReference" | "fileById" | "questionById"
  >;
}

export default function SuggestionBlockPreview({
  markdown,
  referenceContext,
}: SuggestionBlockPreviewProps) {
  const result = React.useMemo(() => {
    try {
      return {
        markdown: resolveSuggestionReferences(
          markdown,
          referenceContext.idByReference,
          referenceContext.fileById,
          referenceContext.questionById,
        ),
        error: null,
      };
    } catch (error) {
      return { markdown: null, error };
    }
  }, [markdown, referenceContext]);

  React.useEffect(() => {
    if (result.error) {
      console.error("[SuggestionBlockPreview] Invalid block reference:", result.error);
    }
  }, [result.error]);

  if (result.markdown === null) return <code>{markdown}</code>;
  const resolvedMarkdown = result.markdown;

  return (
    <span inert style={{ display: "block" }}>
      <LexicalComposer initialConfig={{
        // eslint-disable-next-line i18next/no-literal-string -- Internal editor namespace.
        namespace: "SuggestionBlockPreview",
        theme: LanguageEditorTheme,
        nodes: EditorNodes,
        editable: true,
        onError: (error) => { throw error; },
        editorState: () => {
          const nodes = $parseMarkdownToNodes(resolvedMarkdown, {
            fileById: referenceContext.fileById,
            questionById: referenceContext.questionById,
          });
          $getRoot().clear().append(...nodes);
        },
      }}>
        <RichTextPlugin
          contentEditable={<ContentEditable tabIndex={-1} />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </span>
  );
}
