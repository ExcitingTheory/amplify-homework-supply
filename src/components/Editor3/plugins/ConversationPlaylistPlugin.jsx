/**
 * @fileoverview ConversationPlaylistPlugin - Embeds subtitle-synced conversation playlists in the editor.
 *
 * Stores audio File IDs, dialogue subtitle lines (with per-line timing and optional still image),
 * and an optional generated movie File ID. In read mode renders ConversationPlayerComponent;
 * in edit mode renders ConversationPlaylistEditor.
 *
 * @module ConversationPlaylistPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  DecoratorNode,
} from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import React, { lazy, Suspense, useEffect } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { getAmplifyClient } from '../../../utils/amplifyClient';
import UnitContext from '../../../context/unitContext';

const ConversationPlayerComponent = lazy(() =>
  import('../components/ConversationPlayerComponent'),
);
const ConversationPlaylistEditor = lazy(() =>
  import('../components/ConversationPlaylistEditor'),
);

/**
 * Command to insert a ConversationPlaylistNode into the editor.
 * Payload: { fileIDs, dialogue, scriptTitle, stills, movieFileID }
 * @type {LexicalCommand}
 */
export const INSERT_CONVERSATION_PLAYLIST_COMMAND = createCommand(
  'INSERT_CONVERSATION_PLAYLIST_COMMAND',
);

/**
 * ConversationPlaylistNode - Lexical DecoratorNode for subtitle-synced audio conversations.
 *
 * Serialised shape:
 * {
 *   type: 'conversation-playlist',
 *   version: 1,
 *   fileIDs: string[],          // audio File IDs (one per track clip)
 *   dialogue: DialogueLine[],   // subtitle lines with timing
 *   scriptTitle: string,
 *   movieFileID: string | null, // generated movie File ID when available
 * }
 *
 * DialogueLine: { id, speaker, text, timing: { start, end }, stillFileID?, audioFileID? }
 */
export class ConversationPlaylistNode extends DecoratorNode {
  __fileIDs;
  __dialogue;
  __scriptTitle;
  __movieFileID;

  static getType() {
    return 'conversation-playlist';
  }

  static clone(node) {
    return new ConversationPlaylistNode(
      node.__fileIDs,
      node.__dialogue,
      node.__scriptTitle,
      node.__movieFileID,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return new ConversationPlaylistNode(
      serializedNode.fileIDs || [],
      serializedNode.dialogue || [],
      serializedNode.scriptTitle || '',
      serializedNode.movieFileID || null,
    );
  }

  exportJSON() {
    return {
      type: 'conversation-playlist',
      version: 1,
      fileIDs: [...this.__fileIDs],
      dialogue: this.__dialogue ? JSON.parse(JSON.stringify(this.__dialogue)) : [],
      scriptTitle: this.__scriptTitle || '',
      movieFileID: this.__movieFileID || null,
    };
  }

  constructor(fileIDs = [], dialogue = [], scriptTitle = '', movieFileID = null, key) {
    super(key);
    this.__fileIDs = fileIDs;
    this.__dialogue = dialogue;
    this.__scriptTitle = scriptTitle;
    this.__movieFileID = movieFileID;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-conversation-playlist', JSON.stringify({
      fileIDs: this.__fileIDs,
      dialogue: this.__dialogue,
      scriptTitle: this.__scriptTitle,
      movieFileID: this.__movieFileID,
    }));
    return { element };
  }

  createDOM() {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-conversation-playlist', 'true');
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute('data-lexical-conversation-playlist')) {
          return null;
        }
        return {
          conversion: (domNode) => {
            try {
              const raw = domNode.getAttribute('data-lexical-conversation-playlist');
              const parsed = JSON.parse(raw);
              return {
                node: new ConversationPlaylistNode(
                  parsed.fileIDs || [],
                  parsed.dialogue || [],
                  parsed.scriptTitle || '',
                  parsed.movieFileID || null,
                ),
              };
            } catch {
              return null;
            }
          },
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

  getFileIDs() {
    return this.__fileIDs;
  }

  getDialogue() {
    return this.__dialogue;
  }

  getScriptTitle() {
    return this.__scriptTitle;
  }

  getMovieFileID() {
    return this.__movieFileID;
  }

  setMovieFileID(id) {
    const writable = this.getWritable();
    writable.__movieFileID = id;
  }

  setFileIDs(ids) {
    const writable = this.getWritable();
    writable.__fileIDs = [...ids];
  }

  getTextContent() {
    return this.__scriptTitle || '';
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
        {isEditable ? (
          <BlockWithAlignableContents
            className={className}
            nodeKey={this.getKey()}
            format={this.__format}
          >
            <Suspense
              fallback={
                <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
              }
            >
              <ConversationPlaylistEditor
                nodeKey={this.getKey()}
                fileIDs={this.__fileIDs}
                dialogue={this.__dialogue}
                scriptTitle={this.__scriptTitle}
                movieFileID={this.__movieFileID}
              />
            </Suspense>
          </BlockWithAlignableContents>
        ) : (
          <BlockWithAlignableContents
            className={className}
            nodeKey={this.getKey()}
            format={this.__format}
          >
            <Suspense
              fallback={
                <Skeleton variant="rectangular" width="100%" height={240} sx={{ borderRadius: 1 }} />
              }
            >
              <ConversationPlayerComponent
                nodeKey={this.getKey()}
                fileIDs={this.__fileIDs}
                dialogue={this.__dialogue}
                scriptTitle={this.__scriptTitle}
                movieFileID={this.__movieFileID}
              />
            </Suspense>
          </BlockWithAlignableContents>
        )}
      </>
    );
  }
}

export function $createConversationPlaylistNode(fileIDs, dialogue, scriptTitle, movieFileID) {
  return new ConversationPlaylistNode(fileIDs, dialogue, scriptTitle, movieFileID);
}

export function $isConversationPlaylistNode(node) {
  return node instanceof ConversationPlaylistNode;
}

/**
 * ConversationPlaylistPlugin - Registers the INSERT_CONVERSATION_PLAYLIST_COMMAND.
 * @returns {null}
 */
export default function ConversationPlaylistPlugin() {
  const [editor] = useLexicalComposerContext();
  const { unit } = React.useContext(UnitContext);

  const createUnitFileRelationship = async (fileId) => {
    try {
      if (!unit) return;
      const client = getAmplifyClient();
      const { data: existing } = await client.models.UnitFile.list({
        filter: {
          and: [
            { unitID: { eq: unit.id } },
            { fileID: { eq: fileId } },
          ],
        },
      });
      if (!existing || existing.length === 0) {
        await client.models.UnitFile.create({
          unitID: unit.id,
          fileID: fileId,
        });
      }
    } catch (error) {
      console.error('[ConversationPlaylistPlugin] UnitFile create error:', error);
    }
  };

  useEffect(() => {
    if (!editor.hasNodes([ConversationPlaylistNode])) {
      throw new Error(
        'ConversationPlaylistPlugin: ConversationPlaylistNode not registered on editor',
      );
    }

    return editor.registerCommand(
      INSERT_CONVERSATION_PLAYLIST_COMMAND,
      (payload) => {
        const { fileIDs = [], dialogue = [], scriptTitle = '', movieFileID = null } = payload || {};
        const node = $createConversationPlaylistNode(fileIDs, dialogue, scriptTitle, movieFileID);
        $insertNodeToNearestRoot(node);

        // Create UnitFile relationships for all audio files
        fileIDs.forEach((id) => {
          if (id) createUnitFileRelationship(id);
        });

        // Also link stills
        dialogue.forEach((line) => {
          if (line.stillFileID) createUnitFileRelationship(line.stillFileID);
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, unit]);

  return null;
}
