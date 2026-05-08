/**
 * TableHoverActionsPlugin - Floating "+" buttons for adding rows/columns on hover.
 *
 * Adapted from the Lexical playground TableHoverActionsV2Plugin.
 * Shows a "+" button above each column when hovering the first row,
 * and a "+" button to the left of each row when hovering the first column.
 *
 * Works with the standard @lexical/table system.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import {
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
} from '@lexical/table';
import { $getNearestNodeFromDOMNode, isHTMLElement } from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

const BUTTON_SIZE = 20;
const BUTTON_OFFSET = 4;

function getTableFromTarget(
  target: EventTarget | null,
): HTMLTableElement | null {
  if (!isHTMLElement(target)) return null;
  const cell = (target as HTMLElement).closest('td, th');
  return cell?.closest('table') ?? null;
}

function TableHoverActions({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const t = useTranslations('common');

  // Top "+" button (add column)
  const [topButtonPos, setTopButtonPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [topCell, setTopCell] = useState<HTMLTableCellElement | null>(null);

  // Left "+" button (add row)
  const [leftButtonPos, setLeftButtonPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [leftCell, setLeftCell] = useState<HTMLTableCellElement | null>(null);

  const topRef = useRef<HTMLButtonElement | null>(null);
  const leftRef = useRef<HTMLButtonElement | null>(null);

  // Track whether the mouse is over a button so we don't hide during the gap
  const isOverButtonRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HIDE_DELAY_MS = 300;

  const scheduleHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!isOverButtonRef.current) {
        setTopButtonPos(null);
        setLeftButtonPos(null);
        setTopCell(null);
        setLeftCell(null);
      }
    }, HIDE_DELAY_MS);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Attach enter/leave listeners on the button elements
  useEffect(() => {
    const onEnter = () => {
      isOverButtonRef.current = true;
      cancelHide();
    };
    const onLeave = () => {
      isOverButtonRef.current = false;
      scheduleHide();
    };

    const topEl = topRef.current;
    const leftEl = leftRef.current;

    topEl?.addEventListener('mouseenter', onEnter);
    topEl?.addEventListener('mouseleave', onLeave);
    leftEl?.addEventListener('mouseenter', onEnter);
    leftEl?.addEventListener('mouseleave', onLeave);

    return () => {
      topEl?.removeEventListener('mouseenter', onEnter);
      topEl?.removeEventListener('mouseleave', onLeave);
      leftEl?.removeEventListener('mouseenter', onEnter);
      leftEl?.removeEventListener('mouseleave', onLeave);
    };
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      // Don't reposition if hovering the buttons themselves
      if (
        (topRef.current && topRef.current.contains(event.target as Node)) ||
        (leftRef.current && leftRef.current.contains(event.target as Node))
      ) {
        cancelHide();
        return;
      }

      const tableElement = getTableFromTarget(event.target);
      const rootElement = editor.getRootElement();

      if (
        !tableElement ||
        !rootElement ||
        !rootElement.contains(tableElement)
      ) {
        scheduleHide();
        return;
      }

      const target = event.target as HTMLElement;
      const hoveredCell = target.closest<HTMLTableCellElement>('td, th');
      if (!hoveredCell) {
        scheduleHide();
        return;
      }

      // Mouse is over the table — cancel any pending hide
      cancelHide();

      const tableRect = tableElement.getBoundingClientRect();
      const cellRect = hoveredCell.getBoundingClientRect();

      // Determine row index via parentElement.rowIndex
      const row = hoveredCell.parentElement as HTMLTableRowElement | null;
      const rowIndex = row?.rowIndex ?? -1;
      const colIndex = hoveredCell.cellIndex ?? -1;

      // Show top "+" button when hovering cells in the first row
      if (rowIndex === 0) {
        const centerX = cellRect.left + cellRect.width / 2;
        setTopButtonPos({
          left: centerX - BUTTON_SIZE / 2,
          top: tableRect.top - BUTTON_SIZE - BUTTON_OFFSET,
        });
        setTopCell(hoveredCell);
      } else {
        setTopButtonPos(null);
        setTopCell(null);
      }

      // Show left "+" button when hovering cells in the first column
      if (colIndex === 0) {
        const centerY = cellRect.top + cellRect.height / 2;
        setLeftButtonPos({
          left: tableRect.left - BUTTON_SIZE - BUTTON_OFFSET,
          top: centerY - BUTTON_SIZE / 2,
        });
        setLeftCell(hoveredCell);
      } else {
        setLeftButtonPos(null);
        setLeftCell(null);
      }
    },
    [editor, cancelHide, scheduleHide],
  );

  useEffect(() => {
    if (!isEditable) return;

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, isEditable]);

  // Hide buttons when the mouse leaves the editor root
  useEffect(() => {
    const handleMouseLeave = (event: MouseEvent) => {
      const related = event.relatedTarget as Node | null;
      if (
        (topRef.current && topRef.current.contains(related)) ||
        (leftRef.current && leftRef.current.contains(related))
      ) {
        return;
      }
      scheduleHide();
    };

    return editor.registerRootListener((rootElement) => {
      if (rootElement) {
        rootElement.addEventListener('mouseleave', handleMouseLeave);
        return () =>
          rootElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    });
  }, [editor, scheduleHide]);

  const handleAddColumn = useCallback(() => {
    if (!topCell) return;
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(topCell);
      if ($isTableCellNode(cellNode)) {
        cellNode.selectEnd();
        $insertTableColumnAtSelection();
      }
    });
  }, [editor, topCell]);

  const handleAddRow = useCallback(() => {
    if (!leftCell) return;
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(leftCell);
      if ($isTableCellNode(cellNode)) {
        cellNode.selectEnd();
        $insertTableRowAtSelection();
      }
    });
  }, [editor, leftCell]);

  if (!isEditable) return null;

  return (
    <>
      {topButtonPos && (
        <button
          ref={topRef}
          className="table-hover-add-button table-hover-add-column"
          aria-label={t('table.addColumn', 'Add column')}
          type="button"
          style={{
            position: 'fixed',
            left: topButtonPos.left,
            top: topButtonPos.top,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
          }}
          onClick={handleAddColumn}
        />
      )}
      {leftButtonPos && (
        <button
          ref={leftRef}
          className="table-hover-add-button table-hover-add-row"
          aria-label={t('table.addRow', 'Add row')}
          type="button"
          style={{
            position: 'fixed',
            left: leftButtonPos.left,
            top: leftButtonPos.top,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
          }}
          onClick={handleAddRow}
        />
      )}
    </>
  );
}

export default function TableHoverActionsPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): React.ReactPortal | null {
  const isEditable = useLexicalEditable();

  return isEditable
    ? createPortal(
        <TableHoverActions anchorElem={anchorElem} />,
        anchorElem,
      )
    : null;
}
