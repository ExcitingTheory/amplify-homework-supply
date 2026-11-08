import {
  $getNodeByKey,
  $getRoot,
  createCommand,
  type NodeKey,
} from "lexical";

export interface BlockInsertMenuPayload {
  anchor: HTMLElement;
  nodeKey: NodeKey;
  /** Called once the menu opened by this request closes. */
  onClose?: () => void;
}

export const OPEN_BLOCK_INSERT_MENU_COMMAND =
  createCommand<BlockInsertMenuPayload>("OPEN_BLOCK_INSERT_MENU_COMMAND");

export function $selectInsertionPointAfterBlock(key: NodeKey): void {
  const block = $getNodeByKey(key);
  if (!block?.isAttached()) {
    throw new Error("The block selected for insertion is no longer in the editor.");
  }
  const offset = block.getIndexWithinParent() + 1;
  $getRoot().select(offset, offset);
}
