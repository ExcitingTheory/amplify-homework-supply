/**
 * TableActionMenuPlugin - Floating context menu for table cell operations.
 *
 * Adapted from the Lexical playground TableActionMenuPlugin.
 * Shows a small chevron button on the active table cell,
 * which opens a dropdown menu with insert/delete row/column actions.
 *
 * Works with the standard @lexical/table system.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $getTableColumnIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $computeTableMapSkipCellCheck,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
  TableObserver,
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  getDOMSelection,
  SELECTION_CHANGE_COMMAND,
  isDOMNode,
} from 'lexical';
import * as React from 'react';
import {
  ReactPortal,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// ─── TableActionMenu (the dropdown) ────────────────────────────────────────

type TableActionMenuProps = Readonly<{
  contextRef: { current: HTMLElement | null };
  onClose: () => void;
  setIsMenuOpen: (isOpen: boolean) => void;
  tableCellNode: TableCellNode;
}>;

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
}: TableActionMenuProps) {
  const [editor] = useLexicalComposerContext();
  const dropDownRef = useRef<HTMLDivElement | null>(null);
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  });

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      (nodeMutations) => {
        const nodeUpdated =
          nodeMutations.get(tableCellNode.getKey()) === 'updated';
        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
        }
      },
      { skipInitialization: true },
    );
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const shape = selection.getShape();
        updateSelectionCounts({
          columns: shape.toX - shape.fromX + 1,
          rows: shape.toY - shape.fromY + 1,
        });
      }
    });
  }, [editor]);

  // Position the dropdown near the context button
  useEffect(() => {
    const menuButton = contextRef.current;
    const dropDown = dropDownRef.current;
    const root = editor.getRootElement();

    if (menuButton && dropDown && root) {
      const menuRect = menuButton.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();

      dropDown.style.opacity = '1';
      const dropRect = dropDown.getBoundingClientRect();
      const margin = 5;

      let left = menuRect.right + margin;
      if (left + dropRect.width > window.innerWidth || left + dropRect.width > rootRect.right) {
        const pos = menuRect.left - dropRect.width - margin;
        left = (pos < 0 ? margin : pos) + window.pageXOffset;
      }
      dropDown.style.left = `${left + window.pageXOffset}px`;

      let top = menuRect.top;
      if (top + dropRect.height > window.innerHeight) {
        const pos = menuRect.bottom - dropRect.height;
        top = pos < 0 ? margin : pos;
      }
      dropDown.style.top = `${top}px`;
    }
  }, [contextRef, editor]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropDownRef.current &&
        contextRef.current &&
        isDOMNode(event.target) &&
        !dropDownRef.current.contains(event.target as Node) &&
        !contextRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [setIsMenuOpen, contextRef]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(
          tableNode,
          editor.getElementByKey(tableNode.getKey()),
        );
        if (tableElement) {
          const tableObserver = getTableObserverFromTableElement(tableElement);
          if (tableObserver) {
            tableObserver.$clearHighlight();
          }
        }
        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
      $setSelection(null);
    });
  }, [editor, tableCellNode]);

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          $insertTableRowAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumnAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns],
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;

      for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
        const mapCell = gridMap[tableRowIndex][col];
        if (mapCell?.cell) {
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);
      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;

      for (let row = 0; row < gridMap.length; row++) {
        const mapCell = gridMap[row][tableColumnIndex];
        if (mapCell?.cell) {
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  return createPortal(
    <div
      className="table-action-menu-dropdown"
      ref={dropDownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="table-action-menu-item"
        onClick={() => insertTableRowAtSelection(false)}
        data-test-id="table-insert-row-above"
      >
        <span className="table-action-menu-item-text">
          Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} above
        </span>
      </button>
      <button
        type="button"
        className="table-action-menu-item"
        onClick={() => insertTableRowAtSelection(true)}
        data-test-id="table-insert-row-below"
      >
        <span className="table-action-menu-item-text">
          Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} below
        </span>
      </button>
      <hr className="table-action-menu-divider" />
      <button
        type="button"
        className="table-action-menu-item"
        onClick={() => insertTableColumnAtSelection(false)}
        data-test-id="table-insert-column-before"
      >
        <span className="table-action-menu-item-text">
          Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`} left
        </span>
      </button>
      <button
        type="button"
        className="table-action-menu-item"
        onClick={() => insertTableColumnAtSelection(true)}
        data-test-id="table-insert-column-after"
      >
        <span className="table-action-menu-item-text">
          Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`} right
        </span>
      </button>
      <hr className="table-action-menu-divider" />
      <button
        type="button"
        className="table-action-menu-item"
        onClick={deleteTableRowAtSelection}
        data-test-id="table-delete-rows"
      >
        <span className="table-action-menu-item-text">Delete row</span>
      </button>
      <button
        type="button"
        className="table-action-menu-item"
        onClick={deleteTableColumnAtSelection}
        data-test-id="table-delete-columns"
      >
        <span className="table-action-menu-item-text">Delete column</span>
      </button>
      <button
        type="button"
        className="table-action-menu-item"
        onClick={deleteTableAtSelection}
        data-test-id="table-delete"
      >
        <span className="table-action-menu-item-text">Delete table</span>
      </button>
      <hr className="table-action-menu-divider" />
      <button
        type="button"
        className="table-action-menu-item"
        onClick={toggleTableRowIsHeader}
        data-test-id="table-row-header"
      >
        <span className="table-action-menu-item-text">
          {(tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
          TableCellHeaderStates.ROW
            ? 'Remove'
            : 'Add'}{' '}
          row header
        </span>
      </button>
      <button
        type="button"
        className="table-action-menu-item"
        onClick={toggleTableColumnIsHeader}
        data-test-id="table-column-header"
      >
        <span className="table-action-menu-item-text">
          {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
          TableCellHeaderStates.COLUMN
            ? 'Remove'
            : 'Add'}{' '}
          column header
        </span>
      </button>
    </div>,
    document.body,
  );
}

// ─── TableCellActionMenuContainer (floating button per cell) ───────────────

function TableCellActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const menuRootRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(null);

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;

    function disable() {
      if (menu) {
        menu.classList.remove('table-cell-action-button-container--active');
        menu.classList.add('table-cell-action-button-container--inactive');
      }
      setTableMenuCellNode(null);
    }

    if (selection == null || menu == null) {
      return disable();
    }

    const rootElement = editor.getRootElement();
    let tableObserver: TableObserver | null = null;
    let tableCellParentNodeDOM: HTMLElement | null = null;

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );

      if (tableCellNodeFromSelection == null) {
        return disable();
      }

      tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      );

      if (
        tableCellParentNodeDOM == null ||
        !tableCellNodeFromSelection.isAttached()
      ) {
        return disable();
      }

      const tableNode = $getTableNodeFromLexicalNodeOrThrow(
        tableCellNodeFromSelection,
      );
      const tableElement = getTableElement(
        tableNode,
        editor.getElementByKey(tableNode.getKey()),
      );

      if (tableElement === null) {
        return disable();
      }

      tableObserver = getTableObserverFromTableElement(tableElement);
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );
      if (!$isTableCellNode(anchorNode)) {
        return disable();
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
      const tableElement = getTableElement(
        tableNode,
        editor.getElementByKey(tableNode.getKey()),
      );
      if (tableElement === null) {
        return disable();
      }
      tableObserver = getTableObserverFromTableElement(tableElement);
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());
      if (tableCellParentNodeDOM == null) {
        return disable();
      }
    } else if (!activeElement) {
      return disable();
    }

    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable();
    }

    const enabled = !tableObserver || !tableObserver.isSelecting;
    menu.classList.toggle(
      'table-cell-action-button-container--active',
      enabled,
    );
    menu.classList.toggle(
      'table-cell-action-button-container--inactive',
      !enabled,
    );

    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = tableCellRect.top - anchorRect.top;
      const left = tableCellRect.right - anchorRect.left;
      menu.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu, { editor });
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        delayedCallback,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerRootListener((rootElement) => {
        if (rootElement) {
          rootElement.addEventListener('pointerup', delayedCallback);
          return () =>
            rootElement.removeEventListener('pointerup', delayedCallback);
        }
      }),
      () => clearTimeout(timeoutId),
    );
  });

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellDOM.current = tableCellNode;
  }, [tableCellNode]);

  return (
    <div
      className="table-cell-action-button-container"
      ref={menuButtonRef}
    >
      {tableCellNode != null && (
        <>
          <button
            type="button"
            className="table-cell-action-button chevron-down"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            ref={menuRootRef}
          >
            <i className="chevron-down" />
          </button>
          {isMenuOpen && (
            <TableActionMenu
              contextRef={menuRootRef}
              setIsMenuOpen={setIsMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              tableCellNode={tableCellNode}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Export ─────────────────────────────────────────────────────────────────

export default function TableActionMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): ReactPortal | null {
  const isEditable = useLexicalEditable();
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer anchorElem={anchorElem} />
    ) : null,
    anchorElem,
  );
}
