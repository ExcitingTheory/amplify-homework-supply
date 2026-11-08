import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createNodeSelection,
  $createParagraphNode,
  $getAdjacentNode,
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_DOWN_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type DecoratorNode,
  type NodeKey,
  type RangeSelection,
} from "lexical";

function $isNavigableBlock(node: LexicalNode | null): node is DecoratorNode<unknown> {
  // Legacy custom nodes inherit the inline default but are stored at block level.
  return $isDecoratorNode(node) && node.isKeyboardSelectable() &&
    (!node.isInline() || $isRootOrShadowRoot(node.getParent()));
}

function $getBlockBelow(editor: LexicalEditor, selection: RangeSelection) {
  const adjacent = $getAdjacentNode(selection.focus, false);
  if ($isNavigableBlock(adjacent)) return adjacent;

  const block = selection.focus.getNode().getTopLevelElement();
  const next = block?.getNextSibling() ?? null;
  if (!$isNavigableBlock(next)) return null;

  // At other offsets, only leave the paragraph from its last visual line.
  const element = block && editor.getElementByKey(block.getKey());
  const nativeSelection = element?.ownerDocument.getSelection();
  if (!element || !nativeSelection?.rangeCount) return null;
  const caret = nativeSelection.getRangeAt(0);
  if (!element.contains(caret.startContainer)) return null;
  const contents = element.ownerDocument.createRange();
  contents.selectNodeContents(element);
  const lines = contents.getClientRects();
  const lastLine = lines.item(lines.length - 1);
  const caretRect = caret.getBoundingClientRect();
  return lastLine && caretRect.bottom >= lastLine.bottom - 1 ? next : null;
}

export default function BlockNavigationPlugin() {
  const [editor] = useLexicalComposerContext();
  const scrollTarget = useRef<NodeKey | null>(null);

  useEffect(() => mergeRegister(
    editor.registerCommand(KEY_ARROW_DOWN_COMMAND, (event, targetEditor) => {
      if (targetEditor !== editor) return false;
      if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return false;
      const selection = $getSelection();
      if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length !== 1) return false;
        const block = nodes[0];
        if (!$isNavigableBlock(block)) return false;
        const next = block.getNextSibling();
        const paragraph = $isParagraphNode(next) ? next : $createParagraphNode();
        if (paragraph !== next) block.insertAfter(paragraph);
        paragraph.selectStart();
        scrollTarget.current = paragraph.getKey();
      } else if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const block = $getBlockBelow(editor, selection);
        if (!block) return false;
        const nodeSelection = $createNodeSelection();
        nodeSelection.add(block.getKey());
        $setSelection(nodeSelection);
        scrollTarget.current = block.getKey();
      } else {
        return false;
      }
      event.preventDefault();
      return true;
    }, COMMAND_PRIORITY_NORMAL),
    editor.registerUpdateListener(() => {
      const key = scrollTarget.current;
      if (key === null) return;
      scrollTarget.current = null;
      editor.getElementByKey(key)?.scrollIntoView({ block: "nearest" });
    }),
  ), [editor]);

  return null;
}
