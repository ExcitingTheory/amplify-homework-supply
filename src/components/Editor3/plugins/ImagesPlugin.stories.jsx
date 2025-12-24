/**
 * @fileoverview Storybook stories for ImagesPlugin
 * Demonstrates image embedding in both editable and read-only modes
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Button } from '@mui/material';

import ImagesPlugin, { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import { ImageNode } from '../components/ImageNode';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { MockUnitProvider } from '../../../../.storybook/__mocks__/MockUnitProvider';

export default {
  title: 'Editor3/Plugins/ImagesPlugin',
  component: ImagesPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertImageButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: 'Sample Image',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuYjBmOGJlOSwgMjAyMS8xMi8wOC0xOTo1MToyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTAxLTE1VDEwOjAwOjAwLTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YWJjZGVmMTIzNDU2Nzg5MCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDphYmNkZWYxMjM0NTY3ODkwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6YWJjZGVmMTIzNDU2Nzg5MCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YWJjZGVmMTIzNDU2Nzg5MCIgc3RFdnQ6d2hlbj0iMjAyMy0wMS0xNVQxMDowMDowMC0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+VGhpcyBpcyBhIHRlc3QgaW1hZ2UAAACASURBVHic7dAxAQAADMOg+TfdyQqgAiGgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEIRCACEYhABCIQgQhEIAIRiEAEIhCBCEQgAhGIQAQiEIEI5AVz1gEX0Z7OFQAAAABJRU5ErkJggg==',
    });
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Sample Image
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: 'ImagesPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, ImageNode],
  };

  return (
    <MockUnitProvider>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Images Plugin - Editable Mode</h2>
          {showInsertButton && <InsertImageButton />}
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '400px',
            padding: '20px'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '350px' }} />}
              placeholder={
                <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#999' }}>
                  Enter text or insert images...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ImagesPlugin captionsEnabled={false} />
          </div>
        </div>
      </LexicalComposer>
    </MockUnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: 'ImagesPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, ImageNode],
  };

  return (
    <MockUnitProvider>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Images Plugin - Read-Only Mode</h2>
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '400px',
            padding: '20px',
            backgroundColor: '#f5f5f5'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '350px' }} />}
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <ImagesPlugin captionsEnabled={false} />
          </div>
        </div>
      </LexicalComposer>
    </MockUnitProvider>
  );
};

const sampleImageState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Image Example',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Below is an embedded image:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'image',
        version: 1,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        altText: 'Sample image placeholder',
        width: 400,
        height: 300,
        maxWidth: 500,
        showCaption: false,
        caption: {
          editorState: {
            root: {
              children: [],
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
};

export const EditableWithImage = {
  render: () => <EditableTemplate editorState={sampleImageState} />,
};

export const ReadOnlyWithImage = {
  render: () => <ReadOnlyTemplate editorState={sampleImageState} />,
};
