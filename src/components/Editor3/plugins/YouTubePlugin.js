/**
 * @fileoverview YouTubePlugin - Embeds YouTube videos in the editor.
 * 
 * This plugin provides YouTube video embedding with privacy-enhanced mode,
 * responsive sizing, and alignment controls.
 * 
 * @module YouTubePlugin
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand} from 'lexical';
import {useEffect} from 'react';

import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
DecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';

/**
 * YouTubeComponent - Renders an embedded YouTube video iframe.
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - CSS class name
 * @param {string} props.format - format/alignment
 * @param {string} props.nodeKey - Lexical node key
 * @param {string} props.videoID - YouTube video identifier
 * @returns {JSX.Element} YouTube iframe component
 */
  const YouTubeComponent = React.memo(function YouTubeComponent({
    className,
    format,
    nodeKey,
    videoID,
  }) {
    return (
      <BlockWithAlignableContents
        className={className}
        format={format}
        nodeKey={nodeKey}>
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          title="YouTube video"
        />
      </BlockWithAlignableContents>
    );
  });
  
  /**
   * Converts a DOM element into a YouTubeNode.
   * 
   * @param {HTMLElement} domNode - DOM element with YouTube video ID
   * @returns {{node: YouTubeNode} | null} Created node or null
   */
  function convertYoutubeElement(
    domNode,
  ){
    const videoID = domNode.getAttribute('data-lexical-youtube');
    if (videoID) {
      const node = $createYouTubeNode(videoID);
      return {node};
    }
    return null;
  }
  
  /**
   * YouTubeNode - Lexical DecoratorBlockNode for YouTube video embeds.
   * 
   * Embeds YouTube videos with privacy-enhanced mode (youtube-nocookie.com),
   * responsive sizing, and full-screen support.
   * 
   * @class YouTubeNode
   * @extends {DecoratorBlockNode}
   */
  export class YouTubeNode extends DecoratorBlockNode {
    __id;
  
    static getType() {
      return 'youtube';
    }
  
    static clone(node) {
      return new YouTubeNode(node.__id, node.__format, node.__key);
    }
  
    static importJSON(serializedNode) {
      const node = $createYouTubeNode(serializedNode.videoID);
      node.setFormat(serializedNode.format);
      return node;
    }
  
    exportJSON() {
      return {
        ...super.exportJSON(),
        type: 'youtube',
        version: 1,
        videoID: this.__id,
      };
    }
  
    constructor(id, format, key) {
      super(format, key);
      this.__id = id;
    }
  
    exportDOM() {
      const element = document.createElement('iframe');
      element.setAttribute('data-lexical-youtube', this.__id);
      element.setAttribute('width', '560');
      element.setAttribute('height', '315');
      element.setAttribute(
        'src',
        `https://www.youtube-nocookie.com/embed/${this.__id}`,
      );
      element.setAttribute('frameborder', '0');
      element.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      );
      element.setAttribute('allowfullscreen', 'true');
      element.setAttribute('title', 'YouTube video');
      return {element};
    }
  
    static importDOM() {
      return {
        iframe: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-youtube')) {
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
      return `https://www.youtube.com/watch?v=${this.__id}`;
    }
  
    decorate(_editor, config) {
      const embedBlockTheme = config.theme.embedBlock || {};
      const className = {
        base: embedBlockTheme.base || '',
        focus: embedBlockTheme.focus || '',
      };
      return (
        <YouTubeComponent
          className={className}
          format={this.__format}
          nodeKey={this.getKey()}
          videoID={this.__id}
        />
      );
    }
  }
  
  /**
   * Factory function to create a YouTubeNode.
   * 
   * @param {string} videoID - YouTube video identifier
   * @returns {YouTubeNode} New YouTube node instance
   */
  export function $createYouTubeNode(videoID) {
    return new YouTubeNode(videoID);
  }
  
  /**
   * Type guard for YouTubeNode.
   * 
   * @param {LexicalNode} node - Node to check
   * @returns {boolean} True if node is a YouTubeNode
   */
  export function $isYouTubeNode(
    node,
  ) {
    return node instanceof YouTubeNode;
  }

/**
 * Command to insert a YouTube video embed.
 * @type {LexicalCommand}
 */
export const INSERT_YOUTUBE_COMMAND = createCommand(
  'INSERT_YOUTUBE_COMMAND',
);

/**
 * YouTubePlugin - Registers YouTube embed functionality.
 * 
 * Registers the YouTubeNode with the editor and handles INSERT_YOUTUBE_COMMAND
 * to insert YouTube embeds into the editor.
 * 
 * @returns {null} Plugin returns null
 */
export default function YouTubePlugin(){
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        $insertNodeToNearestRoot(youTubeNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}