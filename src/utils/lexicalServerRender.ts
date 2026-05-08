/**
 * Server-side Lexical HTML rendering utility.
 *
 * Uses @lexical/headless to create a server-side editor instance and
 * linkedom to provide DOM APIs for node exportDOM() calls.
 * Converts serialized Lexical JSON → HTML string for instant content visibility.
 *
 * Pattern from: https://github.com/2wheeh/lexical-nextjs-ssr
 */

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { parseHTML } from "linkedom";
import { $getRoot } from "lexical";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HashtagNode } from "@lexical/hashtag";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

// Import custom nodes (only the node class definitions, no React components)
import { YouTubeNode } from "@/components/Editor3/plugins/YouTubePlugin";
import { WordBlockNode } from "@/components/Editor3/plugins/WordBlockPlugin";
import { MeaningAssociationNode } from "@/components/Editor3/plugins/MeaningAssociationPlugin";
import { QuizNode } from "@/components/Editor3/plugins/QuizPlugin";
import { PlaylistNode } from "@/components/Editor3/plugins/PlaylistPlugin";
import { PdfViewerNode } from "@/components/Editor3/components/PdfViewerNode";
import { ImageNode } from "@/components/Editor3/components/ImageNode";
import { LayoutContainerNode } from "@/components/Editor3/components/LayoutContainerNode";
import { LayoutItemNode } from "@/components/Editor3/components/LayoutItemNode";
import { AnswerNode } from "@/components/Editor3/plugins/AnswerPlugin";
import { CustomAnswerNode } from "@/components/Editor3/plugins/CustomAnswerPlugin";
import { ArmorEditorNode } from "@/components/Editor3/plugins/ArmorEditorPlugin";
import { FileMetadataNode } from "@/components/Editor3/nodes/FileMetadataNode";
import { AutocompleteNode } from "@/components/Editor3/components/AutocompleteNode";
import {
  AIContentSuggestionNode,
  AILoadingNode,
} from "@/components/Editor3/components/AIContentSuggestionNode";

/**
 * All node types registered in the headless editor.
 * Must match EditorNodes from editorConfig.ts.
 */
const headlessNodes: any[] = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  HashtagNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  YouTubeNode,
  WordBlockNode,
  MeaningAssociationNode,
  AutocompleteNode,
  AIContentSuggestionNode,
  AILoadingNode,
  ImageNode,
  QuizNode,
  PlaylistNode,
  PdfViewerNode,
  LayoutContainerNode,
  LayoutItemNode,
  AnswerNode,
  CustomAnswerNode,
  ArmorEditorNode,
  FileMetadataNode,
];

/**
 * Generate HTML from a serialized Lexical editor state JSON string.
 * Runs entirely server-side using @lexical/headless + linkedom.
 *
 * @param serializedEditorState - JSON string of Lexical editor state (Unit.data)
 * @returns HTML string of the rendered content, or empty string on failure
 */
export async function generateHtmlFromLexicalState(
  serializedEditorState: string,
): Promise<string> {
  if (!serializedEditorState) return "";

  try {
    // Provide DOM globals via linkedom so exportDOM() works
    const { document, window } = parseHTML(
      "<!DOCTYPE html><html><body></body></html>",
    );

    // Set global document/window for Lexical's $generateHtmlFromNodes
    (globalThis as any).document = document;
    (globalThis as any).window = window;
    (globalThis as any).HTMLElement = (window as any).HTMLElement;

    const editor = createHeadlessEditor({
      namespace: "WorkbookSSR",
      nodes: headlessNodes,
      onError: (error) => {
        console.error("[lexicalServerRender] Headless editor error:", error);
      },
    });

    // Parse the editor state
    const parsed =
      typeof serializedEditorState === "string"
        ? JSON.parse(serializedEditorState)
        : serializedEditorState;

    const editorState = editor.parseEditorState(parsed);

    let html = "";

    // Read the editor state and generate HTML
    editorState.read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    // Clean up global DOM references
    delete (globalThis as any).document;
    delete (globalThis as any).window;
    delete (globalThis as any).HTMLElement;

    return html;
  } catch (error) {
    console.error("[lexicalServerRender] Failed to generate HTML:", error);
    return "";
  }
}
