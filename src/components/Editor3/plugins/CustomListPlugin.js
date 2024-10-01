import {ListItemNode, ListNode} from '@lexical/list';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useEffect} from 'react';
import {
  $handleListInsertParagraph,
  REMOVE_LIST_COMMAND,
  removeList,
} from '@lexical/list';

import {mergeRegister} from '@lexical/utils';
import {
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isElementNode,
  $isLeafNode,
  $applyNodeReplacement,
  DecoratorNode,
} from 'lexical';

function $getListItemValue(listItem) {
  const list = listItem.getParent();

  let value = 1;

  if (list != null) {
    if (!$isListNode(list)) {
      invariant(
        false,
        '$getListItemValue: list node is not parent of list item node',
      );
    } else {
      value = list.getStart();
    }
  }

  const siblings = listItem.getPreviousSiblings();
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];

    if ($isListItemNode(sibling) && !$isListNode(sibling.getFirstChild())) {
      value++;
    }
  }
  return value;
}

function $isSelectingEmptyListItem(
  anchorNode,
  nodes,
) {
  return (
    $isListItemNode(anchorNode) &&
    (nodes.length === 0 ||
      (nodes.length === 1 &&
        anchorNode.is(nodes[0]) &&
        anchorNode.getChildrenSize() === 0))
  );
}

export const INSERT_WORD_LIST_COMMAND = 'insert-word-list';
export const INSERT_PLAY_LIST_COMMAND = 'insert-play-list';
export const TAG_TO_LIST_TYPE = {
  ol: 'number',
  ul: 'bullet',
  dl: 'word',
};
export const LIST_TYPE_TO_TAG = {
  number: 'ol',
  bullet: 'ul',
  word: 'ol',
  play: 'ol',
};

export function updateChildrenListItemValue(
  list,
  children,
) {
  const childrenOrExisting = children || list.getChildren();
  if (childrenOrExisting !== undefined) {
    for (let i = 0; i < childrenOrExisting.length; i++) {
      const child = childrenOrExisting[i];
      if ($isListItemNode(child)) {
        const prevValue = child.getValue();
        const nextValue = $getListItemValue(child);

        if (prevValue !== nextValue) {
          child.setValue(nextValue);
        }
      }
    }
  }
}


function convertListItemElement(domNode) {
  const checked =
    isHTMLElement(domNode) && domNode.getAttribute('aria-checked') === 'true';
  return {node: $createListItemNode(checked)};
}

export function $createListItemNode(id) {
  return $applyNodeReplacement(new CustomListItemNode(id));
}

export function $isListItemNode(
  node,
) {
  return node instanceof CustomListItemNode;
}

function append(node, nodesToAppend) {
  node.splice(node.getChildrenSize(), 0, nodesToAppend);
}

function createListOrMerge(node, listType) {
  if ($isListNode(node)) {
    return node;
  }

  const previousSibling = node.getPreviousSibling();
  const nextSibling = node.getNextSibling();
  const listItem = $createListItemNode();
  listItem.setFormat(node.getFormatType());
  listItem.setIndent(node.getIndent());
  append(listItem, node.getChildren());

  if (
    $isListNode(previousSibling) &&
    listType === previousSibling.getListType()
  ) {
    previousSibling.append(listItem);
    node.remove();
    // if the same type of list is on both sides, merge them.

    if ($isListNode(nextSibling) && listType === nextSibling.getListType()) {
      append(previousSibling, nextSibling.getChildren());
      nextSibling.remove();
    }
    return previousSibling;
  } else if (
    $isListNode(nextSibling) &&
    listType === nextSibling.getListType()
  ) {
    nextSibling.getFirstChildOrThrow().insertBefore(listItem);
    node.remove();
    return nextSibling;
  } else {
    const list = $createListNode(listType);
    list.append(listItem);
    node.replace(list);
    updateChildrenListItemValue(list);
    return list;
  }
}




export function insertList(editor, listType) {
  editor.update(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes();
      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();
      const anchorNodeParent = anchorNode.getParent();

      if ($isSelectingEmptyListItem(anchorNode, nodes)) {
        const list = $createListNode(listType);

        if ($isRootOrShadowRoot(anchorNodeParent)) {
          anchorNode.replace(list);
          const listItem = $createListItemNode();
          if ($isElementNode(anchorNode)) {
            listItem.setFormat(anchorNode.getFormatType());
            listItem.setIndent(anchorNode.getIndent());
          }
          list.append(listItem);
        } else if ($isListItemNode(anchorNode)) {
          const parent = anchorNode.getParentOrThrow();
          append(list, parent.getChildren());
          parent.replace(list);
        }

        return;
      } else {
        const handled = new Set();
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (
            $isElementNode(node) &&
            node.isEmpty() &&
            !handled.has(node.getKey())
          ) {
            createListOrMerge(node, listType);
            continue;
          }

          if ($isLeafNode(node)) {
            let parent = node.getParent();
            while (parent != null) {
              const parentKey = parent.getKey();

              if ($isListNode(parent)) {
                if (!handled.has(parentKey)) {
                  const newListNode = $createListNode(listType);
                  append(newListNode, parent.getChildren());
                  parent.replace(newListNode);
                  updateChildrenListItemValue(newListNode);
                  handled.add(parentKey);
                }

                break;
              } else {
                const nextParent = parent.getParent();

                if (
                  $isRootOrShadowRoot(nextParent) &&
                  !handled.has(parentKey)
                ) {
                  handled.add(parentKey);
                  createListOrMerge(parent, listType);
                  break;
                }

                parent = nextParent;
              }
            }
          }
        }
      }
    }
  });
}

export class CustomListItemNode extends ListItemNode {

  __id;
  __phrase;
  __pronunciation;
  __definition;


  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'word-list-item',
      // phrase: this.getValue(),
      id: this.__id,
      phrase: this.__phrase,
      pronunciation: this.__pronunciation,
      definition: this.__definition,
      version: 1,
    };
  }
  
    static getType() {
      return 'word-list-item';
    }
  
    static clone(node) {
      return new CustomListItemNode(node, this.__id);
    }
  
    constructor(key, id) {
      super(key);
      this.__id = id;
    }

    append(...nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
  
        if ($isElementNode(node) && this.canMergeWith(node)) {
          const children = node.getChildren();
          this.append(...children);
          node.remove();
        } else {
          super.append(node);
        }
      }
  
      return this;
    }
  
}

export class CustomListNode extends ListNode {

  __lexicalListType;


  exportJSON() {
    return {
      ...super.exportJSON(),
      listType: this.getListType(),
      start: this.getStart(),
      tag: this.getTag(),
      type: this.getType(),
      version: 1,
    };
  }

  exportDOM(editor) {
    const {element} = super.exportDOM(editor);
    if (element && isHTMLElement(element)) {
      if (this.__listType === 'word') {
        element.setAttribute('__lexicalListType', 'word');
      }
      if (this.__listType === 'play') {
        element.setAttribute('__lexicalListType', 'play');
      }
    }
    return {
      element,
    };
  }

  static getType() {
    return this.__listType;
  }

  static clone(node) {
    const listType = node.__listType || TAG_TO_LIST_TYPE[node.__tag];

    return new CustomListNode(listType, node.__start, node.__key);
  }

  constructor(listType, start, key) {
    super(key);
    this.__listType = listType;
    this.__tag = LIST_TYPE_TO_TAG[listType] || 'ul';
    this.__start = start;
  }

  setListType(type) {
    const writable = this.getWritable();
    writable.__listType = type;
    writable.__tag = LIST_TYPE_TO_TAG[type] || 'ul';
  }

  append(...nodesToAppend) {
    for (let i = 0; i < nodesToAppend.length; i++) {
      const currentNode = nodesToAppend[i];

      if ($isListItemNode(currentNode)) {
        super.append(currentNode);
      } else {
        const listItemNode = $createListItemNode();

        if ($isListNode(currentNode)) {
          listItemNode.append(currentNode);
        } else if ($isElementNode(currentNode)) {
          const textNode = $createTextNode(currentNode.getTextContent());
          listItemNode.append(textNode);
        } else {
          listItemNode.append(currentNode);
        }
        super.append(listItemNode);
      }
    }
    updateChildrenListItemValue(this);
    return this;
  }


}

export function $createListNode(listType, start = 1) {
  return $applyNodeReplacement(new CustomListNode(listType, start));
}

export function $isListNode(
  node,
) {
  return node instanceof CustomListNode;
}

export function CustomListPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_WORD_LIST_COMMAND,
        () => {
          insertList(editor, 'word'); // list-style-type: upper-alpha;
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        INSERT_PLAY_LIST_COMMAND,
        () => {
          insertList(editor, 'play'); // list-style-type: lower-roman;
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        REMOVE_LIST_COMMAND,
        () => {
          removeList(editor);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const hasHandledInsertParagraph = $handleListInsertParagraph();

          if (hasHandledInsertParagraph) {
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  useEffect(() => {
    if (!editor.hasNodes([ListNode, ListItemNode])) {
      throw new Error(
        'WordListPlugin: ListNode and/or ListItemNode not registered on editor',
      );
    }
  }, [editor]);

  return null;
}


