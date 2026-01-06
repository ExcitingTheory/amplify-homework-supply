import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Select, MenuItem, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from 'lexical';

import {
  SceneHeadingNode,
  ActionNode,
  CharacterNode,
  ParentheticalNode,
  DialogueNode,
  TransitionNode,
  ShotNode,
  FadeInNode,
  FadeOutNode,
} from './nodes/ScreenplayParagraphNode';
import { ScreenplayFormatPlugin } from './plugins/ScreenplayFormatPlugin';
import { ScreenplayTheme } from './theme/ScreenplayTheme';

// Map of node types for the dropdown
const NODE_TYPE_MAP = {
  'scene-heading': { class: SceneHeadingNode, label: 'Scene Heading' },
  'action': { class: ActionNode, label: 'Action' },
  'character': { class: CharacterNode, label: 'Character' },
  'parenthetical': { class: ParentheticalNode, label: 'Parenthetical' },
  'dialogue': { class: DialogueNode, label: 'Dialogue' },
  'transition': { class: TransitionNode, label: 'Transition' },
  'shot': { class: ShotNode, label: 'Shot' },
  'fade-in': { class: FadeInNode, label: 'Fade In' },
  'fade-out': { class: FadeOutNode, label: 'Fade Out' },
};

// Styled components for screenplay formatting
const ScreenplayContentEditable = styled(ContentEditable)(({ theme }) => ({
  fontFamily: 'Courier, "Courier New", monospace',
  fontSize: '12pt',
  lineHeight: '1.5',
  padding: '1in 1in 1in 1.5in', // top, right, bottom, left
  minHeight: 'calc(100vh - 100px)',
  outline: 'none',
  backgroundColor: '#fff',
  color: '#000',
  position: 'relative',
  
  // Page setup - approximately 55 lines per page
  '@media print': {
    padding: '1in 1in 1in 1.5in',
  },
}));

const FloatingFormatSelector = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'show',
})(({ theme, show }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  padding: theme.spacing(1, 2),
  zIndex: 1000,
  display: show ? 'flex' : 'none',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: theme.shadows[3],
}));

// Plugin for floating format selector
function FloatingFormatSelectorPlugin() {
  const [editor] = useLexicalComposerContext();
  const [currentType, setCurrentType] = useState('action');
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setShowSelector(false);
          return;
        }

        setShowSelector(true);

        const nodes = selection.getNodes();
        if (nodes.length === 0) {
          return;
        }

        let paragraphNode = nodes[0];
        while (paragraphNode && !NODE_TYPE_MAP[paragraphNode.__type]) {
          paragraphNode = paragraphNode.getParent();
        }

        if (paragraphNode) {
          setCurrentType(paragraphNode.__type);
        }
      });
    });
  }, [editor]);

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    const NodeClass = NODE_TYPE_MAP[newType].class;
    
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      const nodes = selection.getNodes();
      const nodesToUpdate = new Set();
      
      nodes.forEach((node) => {
        let paragraphNode = node;
        while (paragraphNode && !NODE_TYPE_MAP[paragraphNode.__type]) {
          paragraphNode = paragraphNode.getParent();
        }

        if (paragraphNode) {
          nodesToUpdate.add(paragraphNode);
        }
      });

      nodesToUpdate.forEach((oldNode) => {
        // Create a new node of the selected type
        const newNode = new NodeClass();
        
        // Copy over all children
        const children = oldNode.getChildren();
        children.forEach(child => {
          newNode.append(child);
        });
        
        // Replace the old node with the new one
        oldNode.replace(newNode);
        
        // Restore selection
        newNode.select();
      });
    });
  };

  return (
    <FloatingFormatSelector show={showSelector} elevation={3}>
      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Format:</Box>
      <Select
        value={currentType}
        onChange={handleTypeChange}
        size="small"
        sx={{ 
          minWidth: 150,
          '& .MuiSelect-select': {
            py: 0.5,
            fontSize: '0.875rem',
          }
        }}
      >
        {Object.entries(NODE_TYPE_MAP).map(([value, { label }]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FloatingFormatSelector>
  );
}

// Initialize editor with screenplay content
function InitializeScreenplayPlugin() {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          // Create initial FADE IN
          const fadeIn = new ScreenplayParagraphNode(SCREENPLAY_TYPES.FADE_IN);
          root.append(fadeIn);
          
          // Create initial scene heading
          const sceneHeading = new ScreenplayParagraphNode(SCREENPLAY_TYPES.SCENE_HEADING);
          root.append(sceneHeading);
          sceneHeading.select();
        }
      });
      setInitialized(true);
    }
  }, [editor, initialized]);

  return null;
}

function onError(error) {
  console.error(error);
}

export default function ScreenplayEditor() {
  const initialConfig = {
    namespace: 'ScreenplayEditor',
    theme: ScreenplayTheme,
    onError,
    nodes: [
      SceneHeadingNode,
      ActionNode,
      CharacterNode,
      ParentheticalNode,
      DialogueNode,
      TransitionNode,
      ShotNode,
      FadeInNode,
      FadeOutNode,
    ],
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <style jsx global>{`
        .screenplay-element {
          margin: 0;
          padding: 0;
        }
        
        .screenplay-scene-heading {
          text-align: left;
          text-transform: uppercase;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .screenplay-action {
          text-align: left;
          margin-bottom: 0.5em;
        }
        
        .screenplay-character {
          margin-left: 2.2in;
          text-align: left;
          text-transform: uppercase;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0;
        }
        
        .screenplay-parenthetical {
          margin-left: 1.6in;
          text-align: left;
          margin-bottom: 0;
        }
        
        .screenplay-dialogue {
          margin-left: 1.0in;
          margin-right: 1.5in;
          text-align: left;
          margin-bottom: 0.5em;
        }
        
        .screenplay-transition {
          text-align: right;
          text-transform: uppercase;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        .screenplay-shot {
          text-align: left;
          text-transform: uppercase;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .screenplay-fade-in {
          text-align: left;
          text-transform: uppercase;
          margin-bottom: 1em;
        }
        
        .screenplay-fade-out {
          text-align: right;
          text-transform: uppercase;
          margin-top: 1em;
        }
      `}</style>
      <LexicalComposer initialConfig={initialConfig}>
        <Box sx={{ maxWidth: '8.5in', mx: 'auto', my: 2, boxShadow: 3 }}>
          <HistoryPlugin />
          <ScreenplayFormatPlugin />
          <InitializeScreenplayPlugin />
          <FloatingFormatSelectorPlugin />
          
          <RichTextPlugin
            contentEditable={
              <ScreenplayContentEditable
                className="screenplay-editor"
                aria-placeholder="FADE IN:"
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </Box>
      </LexicalComposer>
    </Box>
  );
}
