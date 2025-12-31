/**
 * @fileoverview Storybook stories for ColorPicker
 * Demonstrates the HSV color picker with basic colors and custom selection
 */

import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Card, CardContent, Typography, Box } from '@mui/material';

import ColorPicker from './ColorPicker';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: 'Editor3/Plugins/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered',
  },
};

const onError = (error) => {
  console.error(error);
};

// Standalone ColorPicker demo without editor
const StandaloneTemplate = () => {
  const unitId = 'colorpicker-demo-standalone';
  const [selectedColor, setSelectedColor] = useState('#4a90e2');
  const [previewText, setPreviewText] = useState('Sample Text');

  seedMockUnit({
    id: unitId,
    name: 'Color Picker Standalone Demo',
    description: 'Demo for Color Picker',
    data: null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <div style={{ padding: '20px' }}>
        <Typography variant="h4" gutterBottom>
          Color Picker Component
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select colors using basic color palette or custom HSV picker
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Color Picker
              </Typography>
              <ColorPicker
                editor={null}
                color={selectedColor}
                onChange={(newColor) => {
                  setSelectedColor(newColor);
                }}
              />
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Selected Color: {selectedColor}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 60,
                    backgroundColor: selectedColor,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                    mb: 2,
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    fontSize: '14px',
                  }}
                  placeholder="Type text to preview..."
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  border: '1px solid #ccc',
                  minHeight: 100,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ color: selectedColor }}
                >
                  {previewText}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: selectedColor, mt: 1 }}
                >
                  The quick brown fox jumps over the lazy dog
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Features:</strong>
          </Typography>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>15 predefined basic colors for quick selection</li>
            <li>HSV saturation/value picker with visual feedback</li>
            <li>Hue slider for full spectrum selection</li>
            <li>Hexadecimal input for precise color values</li>
            <li>Live color preview</li>
          </ul>
        </Box>
      </div>
    </UnitProvider>
  );
};

// ColorPicker integrated with editor for text color
const EditorColorPickerPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [showPicker, setShowPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  const applyColor = (color) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          color: color,
        });
      }
    });
  };

  return (
    <div style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        style={{
          padding: '8px 16px',
          marginBottom: '10px',
          cursor: 'pointer',
          backgroundColor: currentColor,
          color: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        {showPicker ? 'Hide' : 'Show'} Color Picker
      </button>

      {showPicker && (
        <ColorPicker
          editor={editor}
          color={currentColor}
          onChange={(color) => {
            setCurrentColor(color);
            applyColor(color);
          }}
        />
      )}
    </div>
  );
};

const EditorTemplate = ({ editorState }) => {
  const unitId = 'colorpicker-demo-editor';
  
  const initialConfig = {
    namespace: 'ColorPickerEditorDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode],
  };

  seedMockUnit({
    id: unitId,
    name: 'Color Picker Editor Demo',
    description: 'Demo for Color Picker in Editor',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px' }}>
          <Typography variant="h4" gutterBottom>
            Color Picker in Editor
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select text in the editor below, then use the color picker to change its color
          </Typography>

          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '300px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '250px' }} />}
              placeholder={
                <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#999' }}>
                  Type some text and select it to change colors...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          <EditorColorPickerPlugin />
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleColorfulText = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Colorful Text Demo',
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
            style: 'color: #d0021b;',
            text: 'Red text ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: #f5a623;',
            text: 'orange text ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: #f8e71c;',
            text: 'yellow text ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: #7ed321;',
            text: 'green text ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: #4a90e2;',
            text: 'blue text ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: #bd10e0;',
            text: 'purple text',
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
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Select any text above and use the color picker below to change its color. You can choose from basic colors or create custom colors using the HSV picker.',
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
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const Standalone = {
  render: () => <StandaloneTemplate />,
};

export const EditorIntegration = {
  render: () => <EditorTemplate editorState={null} />,
};

export const EditorWithColorfulText = {
  render: () => <EditorTemplate editorState={sampleColorfulText} />,
};
