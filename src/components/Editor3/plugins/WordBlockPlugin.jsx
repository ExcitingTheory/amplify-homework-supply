/**
 * @fileoverview WordBlockPlugin - Displays vocabulary word information in a card.
 * @module WordBlockPlugin
 *
 * Creates an interactive word block that displays a vocabulary word's phrase,
 * pronunciation, and definition from the dictionary context.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import {
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $createParagraphNode,
  CLICK_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_ENTER_COMMAND,
} from "lexical";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import * as React from "react";
import { useEffect, useContext, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

import DictionaryContext from "../../../context/dictionaryContext";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import AudioWaveformPlayer from "../components/AudioWaveformPlayer";
import getCachedUrl from "../../../utils/getCachedUrl";
import { sanitizeInlineHtml } from "../../../utils/sanitizeHtml";

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
  const t = useTranslations("editor.shared");

  const { wordMapId: dictionary } = useContext(DictionaryContext);
  const word = dictionary[wordID];
  const [signedAudioUrl, setSignedAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Sign the audio URL when word changes
  useEffect(() => {
    const signAudioUrl = async () => {
      if (word?.audio && word.audio[0]) {
        setAudioLoading(true);
        try {
          const url = await getCachedUrl(word.audio[0]);
          setSignedAudioUrl(url);
        } catch (error) {
          console.error("Error signing word audio URL:", error);
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
        nodeKey={nodeKey}
      >
        <Card
          variant="outlined"
          sx={{
            my: 2,
            bgcolor: "#fff3e0",
            borderColor: "#ff9800",
            borderWidth: 2,
          }}
        >
          <CardContent>
            <Typography variant="body2" color="error">
              {t("wordBlockPlugin.wordNotFound", { wordID })}
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
      nodeKey={nodeKey}
    >
      <Card
        variant="outlined"
        sx={{
          my: 2,
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.100",
          border: "none",
          borderRadius: 2,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.12)",
          transition: "all 0.2s ease",
          userSelect: "none",
          cursor: "default",
          "& *": {
            userSelect: "none",
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              {/* Phrase with Ruby Tags */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                {word.rubyTags ? (
                  <Typography
                    variant="h4"
                    component="ruby"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      fontFamily: word?.phrase?.match(
                        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
                      )
                        ? '"Noto Sans JP", sans-serif'
                        : "inherit",
                      "& rt": {
                        fontWeight: 400,
                        fontSize: "0.5em",
                        color: "text.secondary",
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeInlineHtml(word.rubyTags),
                    }}
                  />
                ) : (
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      fontFamily: word?.phrase?.match(
                        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
                      )
                        ? '"Noto Sans JP", sans-serif'
                        : "inherit",
                    }}
                  >
                    {word.phrase}
                  </Typography>
                )}
              </Box>

              {/* Audio Player with Waveform */}
              {word.audio && word.audio.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  {audioLoading ? (
                    <Typography variant="body2" sx={{ opacity: 0.6 }}>
                      {t("wordBlockPlugin.loadingAudio")}
                    </Typography>
                  ) : signedAudioUrl ? (
                    <AudioWaveformPlayer
                      audioUrl={signedAudioUrl}
                      title={null}
                      enableRecording={false}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.6, fontStyle: "italic" }}
                    >
                      {t("wordBlockPlugin.audioUnavailable")}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Pronunciation */}
              {word.pronunciation && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <RecordVoiceOverIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      fontStyle: "italic",
                      fontFamily: "monospace",
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
                  color: "text.primary",
                  lineHeight: 1.6,
                  mb: 1,
                }}
              >
                {word.definition}
              </Typography>

              {/* Additional metadata */}
              <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap" }}>
                {word.partOfSpeech && (
                  <Chip
                    label={word.partOfSpeech}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {word.context && (
                  <Chip label={word.context} size="small" variant="outlined" />
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

/**
 * WordBlockEditor - Edit-mode wrapper with selection and keyboard controls.
 */
const WordBlockEditor = React.memo(function WordBlockEditor({
  className,
  format,
  nodeKey,
  wordID,
}) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isWordBlockNode(node)) {
            node.remove();
          }
        });
        return true;
      }
      return false;
    },
    [isSelected, nodeKey, editor],
  );

  const onEscape = useCallback(
    (payload) => {
      if (isSelected) {
        payload.preventDefault();
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, clearSelection],
  );

  const onEnter = useCallback(
    (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isWordBlockNode(node)) {
            const paragraph = $createParagraphNode();
            node.insertAfter(paragraph);
            paragraph.select();
          }
        });
        return true;
      }
      return false;
    },
    [isSelected, nodeKey, editor],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;
          if (
            containerRef.current &&
            containerRef.current.contains(event.target)
          ) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
    );
  }, [
    editor,
    isSelected,
    onDelete,
    onEscape,
    onEnter,
    setSelected,
    clearSelection,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        border: isSelected
          ? "2px solid var(--mui-palette-primary-main, #1976d2)"
          : "1px solid transparent",
        borderRadius: 8,
        transition: "border 0.2s ease",
      }}
    >
      <WordBlockComponent
        className={className}
        format={format}
        nodeKey={nodeKey}
        wordID={wordID}
      />
    </div>
  );
});

function convertYoutubeElement(domNode) {
  const wordID = domNode.getAttribute("data-lexical-word-block");
  if (wordID) {
    /**
     * WordBlockNode - Lexical decorator block node for displaying vocabulary words.
     *
     * @class
     * @extends {DecoratorBlockNode}
     */
    const node = $createWordBlockNode(wordID);
    return { node };
  }
  return null;
}

export class WordBlockNode extends DecoratorBlockNode {
  __id;

  static getType() {
    return "word-block";
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
      type: "word-block",
      version: 1,
      wordID: this.__id,
    };
  }

  constructor(id, format, key) {
    super(key);
    this.__id = id;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-word-block", this.__id);
    return { element };
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-word-block")) {
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

  getTextContent(_includeInert, _includeDirectionless) {
    return this.__id;
  }

  decorate(_editor, config) {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    };
    const isEditable = _editor.isEditable();
    return (
      <>
        {isEditable && (
          <WordBlockEditor
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            wordID={this.__id}
          />
        )}
        {!isEditable && (
          <WordBlockComponent
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            wordID={this.__id}
          />
        )}
      </>
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
export function $isWordBlockNode(node) {
  return node instanceof WordBlockNode;
}

/**
 * Command to insert a word block into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_WORD_BLOCK_COMMAND = createCommand(
  "INSERT_WORD_BLOCK_COMMAND",
);

/**
 * WordBlockPlugin - Registers word block functionality.
 *
 * Registers the WordBlockNode with the editor and handles INSERT_WORD_BLOCK_COMMAND
 * to insert vocabulary word blocks into the editor.
 *
 * @returns {null} Plugin returns null
 */
export default function WordBlockPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([WordBlockNode])) {
      throw new Error(
        "WordBlockPlugin: WordBlockNode not registered on editor",
      );
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
