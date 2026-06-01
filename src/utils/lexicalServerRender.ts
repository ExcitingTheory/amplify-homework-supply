/**
 * Server-side Lexical HTML rendering utility.
 *
 * Uses @lexical/headless to create a server-side editor instance and
 * linkedom to provide DOM APIs for node exportDOM() calls.
 * Converts serialized Lexical JSON → HTML string for instant content visibility.
 *
 * Pattern from: https://github.com/2wheeh/lexical-nextjs-ssr
 *
 * Architecture:
 * 1. setupDom() - provides linkedom document/window as global DOM
 * 2. createHeadlessEditor() - creates a server-side Lexical editor
 * 3. editor.setEditorState() - loads parsed state
 * 4. editor.update() + $generateHtmlFromNodes() - renders HTML
 * 5. Cleanup global DOM references
 */

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { parseHTML } from "linkedom";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/extension";
import { HashtagNode } from "@lexical/hashtag";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

// Import custom nodes — server-safe extractions (no React dependencies)
import {
  YouTubeNode,
  MeaningAssociationNode,
  QuizNode,
  PlaylistNode,
  PdfViewerNode,
  ImageNode,
  AnswerNode,
  CustomAnswerNode,
  ArmorEditorNode,
  FileMetadataNode,
  AutocompleteNode,
  AIContentSuggestionNode,
  AILoadingNode,
} from "@/components/Editor3/nodes/server-nodes";
import { WordBlockNode } from "@/components/Editor3/nodes/WordBlockNode";
// These are already server-safe (only lexical + @lexical/utils imports)
import { LayoutContainerNode } from "@/components/Editor3/components/LayoutContainerNode";
import { LayoutItemNode } from "@/components/Editor3/components/LayoutItemNode";

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
 * Sets up a linkedom DOM environment and returns a cleanup function.
 * linkedom is lightweight and safe for concurrent server-side usage.
 */
function setupDom() {
  const { window, document } = parseHTML(
    "<!DOCTYPE html><html><body></body></html>",
  );

  const prevWindow = (globalThis as any).window;
  const prevDocument = (globalThis as any).document;
  const prevHTMLElement = (globalThis as any).HTMLElement;

  (globalThis as any).window = window;
  (globalThis as any).document = document;
  (globalThis as any).HTMLElement = (window as any).HTMLElement;

  return () => {
    // Restore previous values (may be undefined)
    if (prevWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = prevWindow;

    if (prevDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = prevDocument;

    if (prevHTMLElement === undefined) delete (globalThis as any).HTMLElement;
    else (globalThis as any).HTMLElement = prevHTMLElement;
  };
}

/**
 * Creates a configured headless Lexical editor with all custom nodes.
 */
function createSSREditor(namespace = "WorkbookSSR") {
  return createHeadlessEditor({
    namespace,
    nodes: headlessNodes,
    onError: (error) => {
      console.error("[lexicalServerRender] Headless editor error:", error);
    },
  });
}

/**
 * Generate HTML from a serialized Lexical editor state JSON string.
 * Runs entirely server-side using @lexical/headless + linkedom.
 *
 * Uses the editor.update() Promise pattern from lexical-nextjs-ssr for
 * reliable HTML generation that properly resolves async node transforms.
 *
 * @param serializedEditorState - JSON string of Lexical editor state (Unit.data)
 * @returns HTML string of the rendered content, or empty string on failure
 */
export async function generateHtmlFromLexicalState(
  serializedEditorState: string,
): Promise<string> {
  if (!serializedEditorState) return "";

  try {
    const parsed =
      typeof serializedEditorState === "string"
        ? JSON.parse(serializedEditorState)
        : serializedEditorState;

    // Set up the editor and parse state (no DOM needed for this step)
    const editor = createSSREditor();
    editor.setEditorState(editor.parseEditorState(parsed));

    // Generate HTML within editor.update() — this ensures all node
    // transforms are resolved before generating output.
    const html: string = await new Promise((resolve, reject) => {
      editor.update(() => {
        const cleanup = setupDom();
        try {
          const generatedHtml = $generateHtmlFromNodes(editor, null);
          cleanup();
          resolve(generatedHtml);
        } catch (e) {
          cleanup();
          reject(e);
        }
      });
    });

    return html;
  } catch (error) {
    console.error("[lexicalServerRender] Failed to generate HTML:", error);
    return "";
  }
}
