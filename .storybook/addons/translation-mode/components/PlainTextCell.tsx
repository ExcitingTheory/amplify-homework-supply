import React, { useCallback, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $createLineBreakNode,
  EditorState,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import type { HistoryState } from '@lexical/history';
import { useTheme } from '@mui/material/styles';

export interface PlainTextCellProps {
  /** Current text value */
  value: string;
  /** Called with new text on every change */
  onChange: (text: string) => void;
  /** Called when the editor loses focus */
  onBlur?: () => void;
  /** Placeholder shown when empty */
  placeholder?: string;
  /** Label displayed above the editor */
  label?: string;
  /** Shared history state for cross-editor undo/redo */
  historyState: HistoryState;
  /** Whether to use multiline (default true) */
  multiline?: boolean;
  /** Min height in px */
  minHeight?: number;
  /** Additional CSS for the contentEditable */
  style?: React.CSSProperties;
  /** Whether the field is highlighted as active (e.g. current language) */
  highlighted?: boolean;
}

/**
 * Inner plugin to sync external value → editor when value changes
 * from outside (e.g. selecting a different translation key).
 * Uses discrete update tag so the sync doesn't pollute the undo stack.
 */
function SyncValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const lastExternalValue = useRef(value);

  useEffect(() => {
    // Only update editor if the external value changed
    if (value === lastExternalValue.current) return;
    lastExternalValue.current = value;

    editor.update(
      () => {
        const root = $getRoot();
        const currentText = root.getTextContent();
        if (currentText === value) return;

        root.clear();
        const paragraph = $createParagraphNode();
        if (value) {
          const lines = value.split('\n');
          lines.forEach((line, i) => {
            paragraph.append($createTextNode(line));
            if (i < lines.length - 1) {
              paragraph.append($createLineBreakNode());
            }
          });
        }
        root.append(paragraph);
      },
      { tag: 'history-merge' }, // Merge into current history entry so external syncs don't create separate undo steps
    );
  }, [value, editor]);

  return null;
}

/**
 * Plugin that fires onBlur when the Lexical editor loses focus.
 */
function BlurPlugin({ onBlur }: { onBlur?: () => void }) {
  const [editor] = useLexicalComposerContext();
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        onBlurRef.current?.();
        return false; // Don't prevent default
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

const PlainTextCell: React.FC<PlainTextCellProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = '',
  label,
  historyState,
  multiline = true,
  minHeight = 36,
  style,
  highlighted = false,
}) => {
  const theme = useTheme();
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        onChange(text);
      });
    },
    [onChange],
  );

  const initialConfig = {
    namespace: `PlainTextCell-${label || 'field'}`,
    theme: {},
    onError: (error: Error) => console.error('[PlainTextCell] Lexical error:', error),
    editorState: () => {
      const root = $getRoot();
      root.clear();
      if (value) {
        const paragraph = $createParagraphNode();
        const lines = value.split('\n');
        lines.forEach((line, i) => {
          paragraph.append($createTextNode(line));
          if (i < lines.length - 1) {
            paragraph.append($createLineBreakNode());
          }
        });
        root.append(paragraph);
      }
    },
  };

  const borderColor = highlighted ? '#2196F3' : theme.palette.divider;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ position: 'relative' }}>
        <PlainTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ContentEditable
              style={{
                minHeight: multiline ? minHeight : 28,
                padding: '6px 10px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                outline: 'none',
                color: theme.palette.text.primary,
                backgroundColor: 'transparent',
                lineHeight: 1.5,
                resize: multiline ? 'vertical' : 'none',
                overflow: 'auto',
                ...style,
              }}
            />
          }
          placeholder={
            placeholder ? (
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '10px',
                  color: theme.palette.text.disabled,
                  pointerEvents: 'none',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                {placeholder}
              </div>
            ) : null
          }
        />
        <HistoryPlugin externalHistoryState={historyState} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <BlurPlugin onBlur={onBlur} />
        <SyncValuePlugin value={value} />
      </div>
    </LexicalComposer>
  );
};

export default PlainTextCell;
