import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import React, { lazy, Suspense } from 'react';
import { useEffect } from 'react';

import PlaylistEditor from '../components/PlaylistEditor';
const MediaPlayerComponent = lazy(() => import('../components/MediaPlayerComponent'));

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
    super(format, key);
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
            <Suspense fallback={<div>Loading...</div>}>
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

export function $createPlaylistNode(fileIDs) {
  return new PlaylistNode(fileIDs);
}

export function $isPlaylistNode(
  node,
) {
  return node instanceof PlaylistNode;
}

export const INSERT_PLAYLIST_COMMAND = createCommand(
  'INSERT_PLAYLIST_COMMAND',
);

export default function PlaylistPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([PlaylistNode])) {
      throw new Error('PlaylistPlugin: PlaylistNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_PLAYLIST_COMMAND,
      (payload) => {
        const PlaylistNode = $createPlaylistNode(payload);
        $insertNodeToNearestRoot(PlaylistNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}