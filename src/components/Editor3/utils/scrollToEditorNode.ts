import type { LexicalEditor, NodeKey } from "lexical";

export function scrollToEditorNode(
  editor: LexicalEditor,
  key: NodeKey,
  menuBottom: number,
): void {
  const element = editor.getElementByKey(key);
  if (!element) return;

  const view = element.ownerDocument.defaultView;
  if (!view) return;

  let parent = element.parentElement;
  while (parent && parent !== element.ownerDocument.body) {
    if (
      parent.scrollHeight > parent.clientHeight &&
      /(auto|scroll|overlay)/.test(view.getComputedStyle(parent).overflowY)
    ) {
      const visibleTop = Math.max(
        parent.getBoundingClientRect().top + parent.clientTop,
        menuBottom,
      );
      parent.scrollTo({
        top: parent.scrollTop + element.getBoundingClientRect().top - visibleTop,
        behavior: "smooth",
      });
      return;
    }
    parent = parent.parentElement;
  }

  view.scrollTo({
    top: view.scrollY + element.getBoundingClientRect().top - menuBottom,
    behavior: "smooth",
  });
}
