/**
 * @fileoverview PlaylistPlugin - Embeds audio/video playlists in the editor.
 * 
 * This plugin provides playlist functionality with multi-track playback,
 * navigation controls, and progress tracking for audio/video content.
 * 
 * @module PlaylistPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { 
  COMMAND_PRIORITY_EDITOR, 
  createCommand, 
  DecoratorNode,
  $getSelection,
  $isNodeSelection,
  $getNodeByKey
} from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import React, { lazy, Suspense, useContext } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { useEffect } from 'react';
import { getAmplifyClient } from '../../../utils/amplifyClient';
// Type import removed - not needed in runtime JS
import UnitContext from '../../../context/unitContext';

import PlaylistEditor from '../components/PlaylistEditor';
const MediaPlayerComponent = lazy(() => import('../components/MediaPlayerComponent'));

/**
 * Converts a DOM element into a PlaylistNode.
 * 
 * @param {HTMLElement} domNode - DOM element with playlist file IDs
 * @returns {{node: PlaylistNode} | null} Created node or null
 */
function convertPlaylistElement(
  domNode,
) {
  // comma separated list of word ids
  const fileIDs = domNode.getAttribute('data-lexical-playlist').split(',') || [];

  if (fileIDs) {
    const node = $createPlaylistNode(fileIDs);
    return { node };
  }
  return null;
}

/**
 * PlaylistNode - Lexical DecoratorNode for media playlists.
 * 
 * Embeds audio/video playlists with playback controls, track navigation,
 * and progress tracking capabilities.
 * 
 * @class PlaylistNode
 * @extends {DecoratorNode}
 */
export class PlaylistNode extends DecoratorNode {
  __ids;

  static getType() {
    return 'playlist';
  }

  static clone(node) {
    return new PlaylistNode(node.__ids, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createPlaylistNode(serializedNode.fileIDs);
    // node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      // ...super.exportJSON(),
      type: 'playlist',
      version: 1,
      fileIDs: [...this.__ids],
    };
  }

  constructor(ids = [], format, key) {
    super(key);
    this.__ids = ids;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-playlist', this.__ids.join(','));
    return { element };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-playlist', this.__ids.join(','));
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }


  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute('data-lexical-playlist')) {
          return null;
        }
        return {
          conversion: convertPlaylistElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM() {
    return false;
  }

  isKeyboardSelectable() {
    return true;
  }

  canBeEmpty() {
    return true;
  }

  getIds() {
    return this.__ids;
  }

  removeIntersection(ids) {
    const writable = this.getWritable();

    let intersection = this.__ids.filter(x => !ids.includes(x));
    writable.__ids = [...new Set([...intersection])];
  }


  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  mergeIds(ids) {
    const writable = this.getWritable();
    // Deduplicate with a Set and then convert back to array
    writable.__ids = [...new Set([...writable.__ids, ...ids])];
  }

  appendId(id) {
    const writable = this.getWritable();
    // Deduplicate with a Set and then convert back to array
    writable.__ids = [...new Set([...writable.__ids, id])];
  }

  getTextContent(
    _includeInert,
    _includeDirectionless
  ) {
    return this.__ids;
  }

  decorate(_editor, config) {
    const isEditable = _editor.isEditable();
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
        <>
        {isEditable && (
            <BlockWithAlignableContents
                className={className}
                nodeKey={this.getKey()}
                format={this.__format}
                // alignable={false}
                // alignableContents={false}
            >
            <PlaylistEditor
                className={className}
                format={this.__format}
                nodeKey={this.getKey()}
                fileIDs={this.__ids}
            />
            </BlockWithAlignableContents>

        )}
        {!isEditable && (
            <BlockWithAlignableContents
                className={className}
                nodeKey={this.getKey()}
                format={this.__format}
                // alignable={false}
                // alignableContents={false}
            >
            <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />}>
            <MediaPlayerComponent
                className={className}
                format={this.__format}
                nodeKey={this.getKey()}
                fileIDs={this.__ids}
            />
            </Suspense>

            </BlockWithAlignableContents>

        )}
        </>

    );
  }
}

/**
 * Factory function to create a PlaylistNode.
 * 
 * @param {string[]} fileIDs - Array of File IDs for playlist tracks
 * @returns {PlaylistNode} New playlist node instance
 */
export function $createPlaylistNode(fileIDs) {
  return new PlaylistNode(fileIDs);
}

/**
 * Type guard for PlaylistNode.
 * 
 * @param {LexicalNode} node - Node to check
 * @returns {boolean} True if node is a PlaylistNode
 */
export function $isPlaylistNode(
  node,
) {
  return node instanceof PlaylistNode;
}

/**
 * Command to insert a playlist into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_PLAYLIST_COMMAND = createCommand(
  'INSERT_PLAYLIST_COMMAND',
);

/**
 * PlaylistPlugin - Registers playlist functionality in the editor.
 * 
 * @returns {null} Plugin returns null
 */
export default function PlaylistPlugin() {
  const [editor] = useLexicalComposerContext();
  const { unit } = useContext(UnitContext);

  // Helper function to create UnitFile relationship
  const createUnitFileRelationship = async (fileId) => {
    try {
      if (!unit) return;
      const client = getAmplifyClient();
      
      // Check if UnitFile relationship already exists
      const { data: existingUnitFiles } = await client.models.UnitFile.list({
        filter: {
          and: [
            { unitID: { eq: unit.id } },
            { fileID: { eq: fileId } }
          ]
        }
      });
      
      if (existingUnitFiles && existingUnitFiles.length === 0) {
        const { data: file } = await client.models.File.get({ id: fileId });
        if (file) {
          await client.models.UnitFile.create({
            unitID: unit.id,
            fileID: fileId,
          });
        }
      }
    } catch (error) {
      console.error('Error creating UnitFile relationship:', error);
    }
  };

  useEffect(() => {
    if (!editor.hasNodes([PlaylistNode])) {
      throw new Error('PlaylistPlugin: PlaylistNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_PLAYLIST_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const fileIDs = Array.isArray(payload) ? payload : [payload];
        
        // Check if we have a node selection with a PlaylistNode
        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          const playlistNode = nodes.find(node => $isPlaylistNode(node));
          
          if (playlistNode) {
            // Append to existing playlist
            fileIDs.forEach(id => {
              if (id) {
                playlistNode.appendId(id);
                // Create UnitFile relationship asynchronously
                createUnitFileRelationship(id);
              }
            });
            return true;
          }
        }
        
        // No playlist selected, create new one
        const PlaylistNode = $createPlaylistNode(payload);
        $insertNodeToNearestRoot(PlaylistNode);
        
        // Create UnitFile relationships for new playlist asynchronously
        fileIDs.forEach(id => {
          if (id) {
            createUnitFileRelationship(id);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}