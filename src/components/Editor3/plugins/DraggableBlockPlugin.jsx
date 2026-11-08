/**
 * @fileoverview DraggableBlockPlugin - Block-level drag and drop functionality.
 * @module DraggableBlockPlugin
 * 
 * Enables dragging and dropping blocks/nodes within the editor for reordering.
 * Provides visual feedback during drag operations.
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {eventFiles} from '@lexical/rich-text';
import {mergeRegister} from '@lexical/utils';
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from 'lexical';
import * as React from 'react';
import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import AddIcon from '@mui/icons-material/Add';
import {useTranslations} from 'next-intl';
import {OPEN_BLOCK_INSERT_MENU_COMMAND} from '../constants/blockInsertion';
import {useAppShell} from '../../AppShellContext';
import {scrollToEditorNode} from '../utils/scrollToEditorNode';
export function isPoint(x) {
  return x instanceof Point;
}

export function isHTMLElement(x) {
  return x instanceof HTMLElement;
}

export class Point {
  constructor(x, y) {
    this._x = x;
    this._y = y;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  equals({x, y}) {
    return this.x === x && this.y === y;
  }

  calcDeltaXTo({x}) {
    return this.x - x;
  }

  calcDeltaYTo({y}) {
    return this.y - y;
  }

  calcHorizontalDistanceTo(point) {
    return Math.abs(this.calcDeltaXTo(point));
  }

  calcVerticalDistance(point) {
    return Math.abs(this.calcDeltaYTo(point));
  }

  calcDistanceTo(point) {
    return Math.sqrt(
      Math.pow(this.calcDeltaXTo(point), 2) +
        Math.pow(this.calcDeltaYTo(point), 2),
    );
  }
}

export class Rect {
  constructor(left, top, right, bottom) {
    const [physicTop, physicBottom] =
      top <= bottom ? [top, bottom] : [bottom, top];

    const [physicLeft, physicRight] =
      left <= right ? [left, right] : [right, left];

    this._top = physicTop;
    this._right = physicRight;
    this._left = physicLeft;
    this._bottom = physicBottom;
  }

  get top() {
    return this._top;
  }

  get right() {
    return this._right;
  }

  get bottom() {
    return this._bottom;
  }

  get left() {
    return this._left;
  }

  get width() {
    return Math.abs(this._left - this._right);
  }

  get height() {
    return Math.abs(this._bottom - this._top);
  }

  equals({top, left, bottom, right}) {
    return (
      top === this._top &&
      bottom === this._bottom &&
      left === this._left &&
      right === this._right
    );
  }

  contains(target) {
    if (isPoint(target)) {
      const {x, y} = target;

      const isOnTopSide = y < this._top;
      const isOnBottomSide = y > this._bottom;
      const isOnLeftSide = x < this._left;
      const isOnRightSide = x > this._right;

      const result =
        !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide;

      return {
        reason: {
          isOnBottomSide,
          isOnLeftSide,
          isOnRightSide,
          isOnTopSide,
        },
        result,
      };
    } else {
      const {top, left, bottom, right} = target;

      return (
        top >= this._top &&
        top <= this._bottom &&
        bottom >= this._top &&
        bottom <= this._bottom &&
        left >= this._left &&
        left <= this._right &&
        right >= this._left &&
        right <= this._right
      );
    }
  }

  intersectsWith(rect) {
    const {left: x1, top: y1, width: w1, height: h1} = rect;
    const {left: x2, top: y2, width: w2, height: h2} = this;
    const maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
    const maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
    const minX = x1 <= x2 ? x1 : x2;
    const minY = y1 <= y2 ? y1 : y2;
    return maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2;
  }

  generateNewRect({
    left = this.left,
    top = this.top,
    right = this.right,
    bottom = this.bottom,
  }) {
    return new Rect(left, top, right, bottom);
  }

  static fromLTRB(
    left,
    top,
    right,
    bottom,
  ) {
    return new Rect(left, top, right, bottom);
  }

  static fromLWTH(
    left,
    width,
    top,
    height,
  ) {
    return new Rect(left, top, left + width, top + height);
  }

  static fromPoints(startPoint, endPoint) {
    const {y: top, x: left} = startPoint;
    const {y: bottom, x: right} = endPoint;
    return Rect.fromLTRB(left, top, right, bottom);
  }

  static fromDOM(dom) {
    const {top, width, left, height} = dom.getBoundingClientRect();
    return Rect.fromLWTH(left, width, top, height);
  }
}

// import {isHTMLElement} from '../../utils/guard';
// import {Point} from '../../utils/point';
// import {Rect} from '../../utils/rect';

const SPACE = 4;
// Gutter order, left to right: [drag handle] [line number] [insert], equal 28px buttons, 2px gaps.
const GUTTER_BUTTON_SIZE = 28;
const GUTTER_HANDLE_OFFSET = 88;
const GUTTER_NUMBER_OFFSET = 58;
const GUTTER_INSERT_OFFSET = 28;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';
const TEXT_BOX_HORIZONTAL_PADDING = 4;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

let prevIndex = Infinity;

function getCurrentIndex(keysLength) {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }

  return Math.floor(keysLength / 2);
}

function getTopLevelNodeKeys(editor) {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}

function getCollapsedMargins(elem) {
  const getMargin = (
    element,
    margin,
  ) =>
    element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

  const {marginTop, marginBottom} = window.getComputedStyle(elem);
  const prevElemSiblingMarginBottom = getMargin(
    elem.previousElementSibling,
    'marginBottom',
  );
  const nextElemSiblingMarginTop = getMargin(
    elem.nextElementSibling,
    'marginTop',
  );
  const collapsedTopMargin = Math.max(
    parseFloat(marginTop),
    prevElemSiblingMarginBottom,
  );
  const collapsedBottomMargin = Math.max(
    parseFloat(marginBottom),
    nextElemSiblingMarginTop,
  );

  return {marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin};
}

function getBlockElement(
  anchorElem,
  editor,
  event,
  useEdgeAsDefault = false,
) {
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);

  let blockElem = null;

  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0]),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]),
      ];

      const [firstNodeRect, lastNodeRect] = [
        firstNode?.getBoundingClientRect(),
        lastNode?.getBoundingClientRect(),
      ];

      if (firstNodeRect && lastNodeRect) {
        if (event.y < firstNodeRect.top) {
          blockElem = firstNode;
        } else if (event.y > lastNodeRect.bottom) {
          blockElem = lastNode;
        }

        if (blockElem) {
          return;
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const elem = editor.getElementByKey(key);
      if (elem === null) {
        break;
      }
      const point = new Point(event.x, event.y);
      const domRect = Rect.fromDOM(elem);
      const {marginTop, marginBottom} = getCollapsedMargins(elem);

      // Extend the rect to the left edge (including gutter area) to make drag handle more accessible
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left, // Extend to left edge of editor
        right: anchorElementRect.right,
        top: domRect.top - marginTop,
      });

      const {
        result,
        reason: {isOnTopSide, isOnBottomSide},
      } = rect.contains(point);

      if (result) {
        blockElem = elem;
        prevIndex = index;
        break;
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          // stop search block element
          direction = Infinity;
        }
      }

      index += direction;
    }
  });

  return blockElem;
}

// Selects a whole top-level block: its content for element blocks, the node itself for decorators.
export function selectEditorBlock(editor, key) {
  editor.update(() => {
    const node = $getNodeByKey(key);
    if (!node) return;
    if ($isElementNode(node) && !node.isEmpty()) {
      node.select(0, node.getChildrenSize());
    } else if ($isElementNode(node)) {
      node.selectStart();
    } else {
      const selection = $createNodeSelection();
      selection.add(key);
      $setSelection(selection);
    }
  });
  editor.focus();
}

function isOnMenu(element) {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export function setMenuPosition(
  targetElem,
  floatingElem,
  anchorElem,
  rootElem,
) {
  if (!targetElem || !rootElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const targetRect = targetElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const lineHeight = parseFloat(window.getComputedStyle(targetElem).lineHeight) || 24;
  const top = targetRect.top - anchorElementRect.top +
    Math.min(targetRect.height, lineHeight) / 2 - GUTTER_BUTTON_SIZE / 2;
  const left = rootElem.getBoundingClientRect().left - anchorElementRect.left - GUTTER_HANDLE_OFFSET;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

function setDragImage(
  dataTransfer,
  draggableBlockElem,
) {
  const {transform} = draggableBlockElem.style;

  // Remove dragImage borders
  draggableBlockElem.style.transform = 'translateZ(0)';
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);

  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
}

function setTargetLine(
  targetLineElem,
  targetBlockElem,
  mouseY,
  anchorElem,
) {
  const targetBlockElemRect = targetBlockElem.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();
  
  const {top: targetBlockElemTop, height: targetBlockElemHeight} = targetBlockElemRect;
  const {top: anchorTop, width: anchorWidth} = anchorRect;

  let lineTop = targetBlockElemTop;
  if (mouseY >= targetBlockElemTop + targetBlockElemHeight / 2) {
    // Position below the block
    lineTop = targetBlockElemTop + targetBlockElemHeight;
  }
  // Otherwise position above the block (at top)

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT;

  targetLineElem.style.top = `${top}px`;
  targetLineElem.style.left = '0px';
  targetLineElem.style.width = `${anchorWidth}px`;
  targetLineElem.classList.add('draggable-block-target-line--visible');
}

function hideTargetLine(targetLineElem) {
  if (targetLineElem) {
    targetLineElem.classList.remove('draggable-block-target-line--visible');
    targetLineElem.style.top = '-10000px';
    targetLineElem.style.left = '-10000px';
  }
}

function useDraggableBlockMenu(
  editor,
  anchorElem,
  isEditable,
){
  const scrollerElem = anchorElem.parentElement;
  const t = useTranslations('editor.authoring');
  const {appBarHeight} = useAppShell();
  const gutterId = useId();

  const menuRef = useRef(null);
  const targetLineRef = useRef(null);
  const activeKeyRef = useRef(null);
  const isDraggingBlockRef = useRef(false);
  const [draggableBlockElem, setDraggableBlockElem] =
    useState(null);
  const [gutter, setGutter] = useState({rows: [], activeKey: null});
  const [targetKey, setTargetKey] = useState(null);
  const [insertMenuKey, setInsertMenuKey] = useState(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const rowFragment = (key) => `${gutterId}-${key}`;

  useEffect(() => {
    const prefix = `#${gutterId}-`;
    const syncTarget = () => {
      const {hash} = window.location;
      setTargetKey(hash.startsWith(prefix) ? decodeURIComponent(hash.slice(prefix.length)) : null);
    };
    syncTarget();
    window.addEventListener('hashchange', syncTarget);
    return () => window.removeEventListener('hashchange', syncTarget);
  }, [gutterId]);
  const activeBlockElem = gutter.rows.find((row) => row.key === gutter.activeKey)?.element;
  const handleBlockElem = draggableBlockElem || activeBlockElem;
  const handleRow = gutter.rows.find((row) => row.element === handleBlockElem);
  // The insert button follows the hovered block like the handle, but stays put while its menu is open.
  const insertKey = insertMenuKey ?? handleRow?.key;

  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => schedule());
    const observed = new Set();
    function refresh() {
      const root = editor.getRootElement();
      if (!root) {
        setGutter({rows: [], activeKey: null});
        return;
      }
      const anchorRect = anchorElem.getBoundingClientRect();
      const left = root.getBoundingClientRect().left - anchorRect.left;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const selectedNode = $isRangeSelection(selection)
          ? selection.focus.getNode()
          : selection?.getNodes()[0];
        if (selection !== null) {
          activeKeyRef.current = selectedNode?.getTopLevelElement()?.getKey() ?? null;
        }
        const activeKey = activeKeyRef.current;
        const rows = $getRoot().getChildrenKeys().flatMap((key, index) => {
          const element = editor.getElementByKey(key);
          if (!element) return [];
          const rect = element.getBoundingClientRect();
          const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight) || 24;
          return [{
            key, element, number: index + 1, left,
            top: rect.top - anchorRect.top + Math.min(rect.height, lineHeight) / 2 - GUTTER_BUTTON_SIZE / 2,
          }];
        });
        setGutter({rows, activeKey});
        const elements = new Set([anchorElem, root, ...rows.map(({element}) => element)]);
        observed.forEach((element) => {
          if (!elements.has(element)) {
            observer.unobserve(element);
            observed.delete(element);
          }
        });
        elements.forEach((element) => {
          if (!observed.has(element)) {
            observer.observe(element);
            observed.add(element);
          }
        });
        if (menuRef.current) {
          setMenuPosition(
            draggableBlockElem || rows.find((row) => row.key === activeKey)?.element,
            menuRef.current, anchorElem, root,
          );
        }
      });
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    }
    const unregister = mergeRegister(
      editor.registerUpdateListener(schedule),
      editor.registerRootListener(schedule),
    );
    window.addEventListener('resize', schedule);
    scrollerElem?.addEventListener('scroll', schedule, {passive: true});
    schedule();
    return () => {
      unregister();
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      scrollerElem?.removeEventListener('scroll', schedule);
    };
  }, [editor, anchorElem, scrollerElem, draggableBlockElem]);

  useEffect(() => {
    function onMouseMove(event) {

      const target = event.target;
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null);
        return;
      }

      // Keep the drag handle visible when hovering over it
      if (isOnMenu(target)) {
        return;
      }

      const _draggableBlockElem = getBlockElement(anchorElem, editor, event);

      // Only update state if the element actually changed
      setDraggableBlockElem(prev => prev === _draggableBlockElem ? prev : _draggableBlockElem);
    }

    function onMouseLeave() {
      setDraggableBlockElem(null);
    }

    scrollerElem?.addEventListener('mousemove', onMouseMove, { passive: true });
    scrollerElem?.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      scrollerElem?.removeEventListener('mousemove', onMouseMove);
      scrollerElem?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [scrollerElem, anchorElem, editor]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(handleBlockElem, menuRef.current, anchorElem, editor.getRootElement());
    }
  }, [anchorElem, handleBlockElem, editor, gutter]);

  useEffect(() => {
    function onDragover(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const {pageY, target} = event;
      if (!isHTMLElement(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem);
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault();
      return true;
    }

    function onDrop(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const {target, dataTransfer, pageY} = event;
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || '';
      
      if (!isHTMLElement(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      if (!targetBlockElem) {
        return false;
      }
      
      // Calculate position before entering editor.update()
      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top;
      const shouldInsertAfter = pageY >= targetBlockElemTop;
      
      // Wrap the node manipulation in editor.update() to ensure it's added to the undo stack
      editor.update(() => {
        const draggedNode = $getNodeByKey(dragData);
        if (!draggedNode) {
          return;
        }
        
        const targetNode = $getNearestNodeFromDOMNode(targetBlockElem);
        if (!targetNode) {
          return;
        }
        if (targetNode === draggedNode) {
          return;
        }
        
        if (shouldInsertAfter) {
          targetNode.insertAfter(draggedNode);
        } else {
          targetNode.insertBefore(draggedNode);
        }
      });
      
      setDraggableBlockElem(null);

      return true;
    }

    const onDOMDragover = (event) => {
      onDragover(event);
    };

    const onDOMDrop = (event) => {
      onDrop(event);
    };

    // Add native DOM listeners to ensure drag tracking works
    if (scrollerElem) {
      scrollerElem.addEventListener('dragover', onDOMDragover);
      scrollerElem.addEventListener('drop', onDOMDrop);
    }

    const commandCleanup = mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return onDrop(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );

    return () => {
      commandCleanup();
      if (scrollerElem) {
        scrollerElem.removeEventListener('dragover', onDOMDragover);
        scrollerElem.removeEventListener('drop', onDOMDrop);
      }
    };
  }, [anchorElem, editor, scrollerElem]);

  function onDragStart(event) {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !handleBlockElem || !isEditable) {
      return;
    }
    setDragImage(dataTransfer, handleBlockElem);
    let nodeKey = '';
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(handleBlockElem);
      if (node) {
        nodeKey = node.getKey();
      }
    });
    isDraggingBlockRef.current = true;
    setIsDraggingBlock(true);
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
  }

  function onDragEnd() {
    isDraggingBlockRef.current = false;
    setIsDraggingBlock(false);
    hideTargetLine(targetLineRef.current);
  }

  return createPortal(
    <>
      <div className="editor-block-gutter">
        {gutter.rows.map((row) => (
          <a
            key={row.key}
            id={rowFragment(row.key)}
            href={`#${rowFragment(row.key)}`}
            className="editor-gutter-button editor-block-number"
            aria-current={targetKey === row.key ? 'location' : undefined}
            style={{top: row.top, left: row.left - GUTTER_NUMBER_OFFSET}}
            onClick={(event) => {
              event.preventDefault();
              // Record the fragment without the browser's default jump, which ignores the app bar.
              window.history.replaceState(window.history.state, '', `#${rowFragment(row.key)}`);
              setTargetKey(row.key);
              scrollToEditorNode(editor, row.key, appBarHeight);
              if (isEditable) selectEditorBlock(editor, row.key);
            }}
          >
            {row.number}
          </a>
        ))}
      </div>
      {isEditable && gutter.rows.filter((row) => row.key === insertKey).map((row) => (
        <button
          key={row.key}
          type="button"
          className="editor-gutter-button editor-block-insert"
          style={{top: row.top, left: row.left - GUTTER_INSERT_OFFSET}}
          title={t('toolBarPlugin.insert')}
          aria-label={t('toolBarPlugin.insert')}
          aria-haspopup="menu"
          aria-expanded={insertMenuKey === row.key}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            const opened = editor.dispatchCommand(OPEN_BLOCK_INSERT_MENU_COMMAND, {
              anchor: event.currentTarget,
              nodeKey: row.key,
              onClose: () => setInsertMenuKey(null),
            });
            if (opened) setInsertMenuKey(row.key);
          }}
        >
          <AddIcon />
        </button>
      ))}
      <div
        className={`editor-gutter-button icon draggable-block-menu${isDraggingBlock ? ' is-pressed' : ''}`}
        ref={menuRef}
        draggable={isEditable}
        hidden={!isEditable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => {
          if (isEditable && handleRow) selectEditorBlock(editor, handleRow.key);
        }}
      >
        <div className={isEditable ? 'icon' : ''} />
      </div>
      <div className="draggable-block-target-line" ref={targetLineRef}>
        {/* Zero-width space to prevent Storybook's div:empty:last-child rule from hiding this */}
        {/* eslint-disable-line i18next/no-literal-string -- zero-width space, not user text */}
        &#8203;
      </div>
    </>,
    anchorElem,
  );
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(editor.isEditable());
  useEffect(() => editor.registerEditableListener(setIsEditable), [editor]);
  return useDraggableBlockMenu(editor, anchorElem, isEditable);
}