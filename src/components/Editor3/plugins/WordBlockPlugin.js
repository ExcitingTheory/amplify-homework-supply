/**
 * @fileoverview WordBlockPlugin - Displays vocabulary word information in block format.
 * @module WordBlockPlugin
 * 
 * Creates an interactive word block that displays a vocabulary word's phrase,
 * pronunciation, and definition from the dictionary context.
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand} from 'lexical';
import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
DecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import * as React from 'react';
import { useEffect, useContext, useState, useRef } from 'react';

import DictionaryContext from '../../../context/dictionaryContext';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
} from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AudioWaveformPlayer from '../components/AudioWaveformPlayer';
import getCachedUrl from '../../../utils/getCachedUrl';

  /**
   * WordBlockComponent - Displays word information in a block.
   * 
   * @param {Object} props - Component props
   * @param {string} props.className - CSS className for styling
   * @param {string} props.format - Block alignment format
   * @param {string} props.nodeKey - Lexical node key
   * @param {string} props.wordID - Dictionary word identifier
   * @returns {JSX.Element} Word block component
   */
  const WordBlockComponent = React.memo(function WordBlockComponent({
    className,
    format,
    nodeKey,
    wordID,
  }) {

    const { wordMapId: dictionary } = useContext(DictionaryContext);
    const word = dictionary[wordID];
    const isEditable = useLexicalEditable();
    const [signedAudioUrl, setSignedAudioUrl] = useState(null);
    const [audioLoading, setAudioLoading] = useState(false);

    // Sign the audio URL when word changes
    useEffect(() => {
      const signAudioUrl = async () => {
        if (word?.audio && word.audio[0]) {
          setAudioLoading(true);
          try {
            const url = await getCachedUrl(word.audio[0], 'protected', word.identityId);
            setSignedAudioUrl(url);
          } catch (error) {
            console.error('Error signing word audio URL:', error);
            setSignedAudioUrl(null);
          } finally {
            setAudioLoading(false);
          }
        } else {
          setSignedAudioUrl(null);
          setAudioLoading(false);
        }
      };

      signAudioUrl();
    }, [word?.audio, word?.identityId]);

    if (!word) {
      return (
        <BlockWithAlignableContents
          className={className}
          format={format}
          nodeKey={nodeKey}>
          <Card 
            variant="outlined" 
            sx={{ 
              my: 2,
              bgcolor: '#fff3e0',
              borderColor: '#ff9800',
              borderWidth: 2
            }}
          >
            <CardContent>
              <Typography variant="body2" color="error">
                Word not found: {wordID}
              </Typography>
            </CardContent>
          </Card>
        </BlockWithAlignableContents>
      );
    }

    return (
      <BlockWithAlignableContents
        className={className}
        format={format}
        nodeKey={nodeKey}>
        <Card 
          variant="outlined" 
          sx={{ 
            my: 2,
            bgcolor: '#f5f5f5',
            border: 'none',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            cursor: 'default',
            '& *': {
              userSelect: 'none',
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                {/* Phrase */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1976d2',
                      fontFamily: word?.phrase?.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/) 
                        ? '"Noto Sans JP", sans-serif' 
                        : 'inherit'
                    }}
                  >
                    {word.phrase}
                  </Typography>
                </Box>

                {/* Audio Player with Waveform */}
                {word.audio && word.audio.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    {audioLoading ? (
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>Loading audio...</Typography>
                    ) : signedAudioUrl ? (
                      <AudioWaveformPlayer
                        audioUrl={signedAudioUrl}
                        waveformData={word.waveformData ? JSON.parse(word.waveformData) : undefined}
                        title={null}
                        enableRecording={false}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: 'italic' }}>Audio not available</Typography>
                    )}
                  </Box>
                )}

                {/* Pronunciation */}
                {word.pronunciation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <RecordVoiceOverIcon sx={{ fontSize: 18, color: '#666' }} />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#666',
                        fontStyle: 'italic',
                        fontFamily: 'monospace'
                      }}
                    >
                      /{word.pronunciation}/
                    </Typography>
                  </Box>
                )}

                {/* Definition */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#424242',
                    lineHeight: 1.6,
                    mb: 1
                  }}
                >
                  {word.definition}
                </Typography>

                {/* Additional metadata */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 2, flexWrap: 'wrap' }}>
                  {word.partOfSpeech && (
                    <Chip 
                      label={word.partOfSpeech} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )}
                  {word.context && (
                    <Chip 
                      label={word.context} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                  {word.level && (
                    <Chip 
                      label={`Level: ${word.level}`} 
                      size="small" 
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </BlockWithAlignableContents>
    );
  });
  
  function convertYoutubeElement(
    domNode,
  ){
    const wordID = domNode.getAttribute('data-lexical-word-block');
    if (wordID) {
  /**
   * WordBlockNode - Lexical decorator block node for displaying vocabulary words.
   * 
   * @class
   * @extends {DecoratorBlockNode}
   */
      const node = $createWordBlockNode(wordID);
      return {node};
    }
    return null;
  }
  
  export class WordBlockNode extends DecoratorBlockNode {
    __id;
  
    static getType() {
      return 'word-block';
    }
  
    static clone(node) {
      return new WordBlockNode(node.__id, node.__format, node.__key);
    }
  
    static importJSON(serializedNode) {
      const node = $createWordBlockNode(serializedNode.wordID);
      node.setFormat(serializedNode.format);
      return node;
    }
  
    exportJSON() {
      return {
        ...super.exportJSON(),
        type: 'word-block',
        version: 1,
        wordID: this.__id,
      };
    }
  
    constructor(id, format, key) {
      super(format, key);
      this.__id = id;
    }
  
    exportDOM() {
      const element = document.createElement('div');
      element.setAttribute('data-lexical-word-block', this.__id);
      return {element};
    }
  
    static importDOM() {
      return {
        div: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-word-block')) {
            return null;
          }
          return {
            conversion: convertYoutubeElement,
            priority: 1,
          };
        },
      };
    }
  
    updateDOM() {
      return false;
    }
  
    getId() {
      return this.__id;
    }
  
    getTextContent(
      _includeInert,
      _includeDirectionless
    ) {
      return this.__id;
    }
  
    decorate(_editor, config) {
      const embedBlockTheme = config.theme.embedBlock || {};
      const className = {
        base: embedBlockTheme.base || '',
        focus: embedBlockTheme.focus || '',
      };
      return (
        <WordBlockComponent
          className={className}
          format={this.__format}
          nodeKey={this.getKey()}
          wordID={this.__id}
        />
      );
    }
  }
  
  /**
   * Factory function to create a WordBlockNode.
   * 
   * @param {string} wordID - Dictionary word identifier
   * @returns {WordBlockNode} New word block node instance
   */
  export function $createWordBlockNode(wordID) {
    return new WordBlockNode(wordID);
  }
  
  /**
   * Type guard for WordBlockNode.
   * 
   * @param {LexicalNode} node - Node to check
   * @returns {boolean} True if node is a WordBlockNode
   */
  export function $isWordBlockNode(
    node,
  ) {
    return node instanceof WordBlockNode;
  }

/**
 * Command to insert a word block into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_WORD_BLOCK_COMMAND = createCommand(
  'INSERT_WORD_BLOCK_COMMAND',
);

/**
 * WordBlockPlugin - Registers word block functionality.
 * 
 * Registers the WordBlockNode with the editor and handles INSERT_WORD_BLOCK_COMMAND
 * to insert vocabulary word blocks into the editor.
 * 
 * @returns {null} Plugin returns null
 */
export default function WordBlockPlugin(){
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([WordBlockNode])) {
      throw new Error('WordBlockPlugin: WordBlockNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_WORD_BLOCK_COMMAND,
      (payload) => {
        const wordBlockNode = $createWordBlockNode(payload);
        $insertNodeToNearestRoot(wordBlockNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}