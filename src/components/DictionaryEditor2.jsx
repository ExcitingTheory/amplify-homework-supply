"use strict";
import React from "react";
import DOMPurify from "dompurify";
import { useTranslations } from "next-intl";

// Lexical imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import {
  HistoryPlugin,
  createEmptyHistoryState,
} from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkNode } from "@lexical/mark";
import {
  DecoratorNode,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  createCommand,
} from "lexical";
import SearchHighlightPlugin from "./Editor3/plugins/SearchHighlightPlugin";

// MUI imports
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  Portal,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Description,
  ExpandLess,
  ExpandMore,
  MoreVert as MoreVertIcon,
  Mic as MicIcon,
  LibraryBooks as RubyIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import Skeleton from "@mui/material/Skeleton";
import RecordingStudio3Modal from "./RecordingStudio3Modal";
import { createWordPreset } from "../utils/recordingStudioPresets";

// Context imports
import DictionaryContext from "../context/dictionaryContext";
import FilesContext from "../context/fileContext";
import UnitContext from "../context/unitContext";
import { useTabContext } from "../context/tabContext";

// Virtualization
import { useVirtualizer } from "@tanstack/react-virtual";

// Import VocabularyCard from VocabularyReview2
import { VocabularyCard } from "./VocabularyReview2";

// Gen 2 client import
import { getAmplifyClient } from "../utils/amplifyClient";
import { uploadData } from "aws-amplify/storage";

// Commands for word operations
const UPDATE_WORD_COMMAND = createCommand("UPDATE_WORD");
const DELETE_WORD_COMMAND = createCommand("DELETE_WORD");
const POPULATE_WORDS_COMMAND = createCommand("POPULATE_WORDS");

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

const deduplicateUrls = (urls) => {
  const set = new Set(urls);
  return Array.from(set);
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Convert blob to base64 for serialization
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 to blob for deserialization
const base64ToBlob = (base64, mimeType = "audio/ogg") => {
  const byteString = atob(base64.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

// Conversion function for importing word nodes from HTML
function convertWordElement(domNode) {
  const wordId = domNode.getAttribute("data-lexical-word-id");
  const phrase = domNode.getAttribute("data-lexical-word-phrase") || "";
  const pronunciation =
    domNode.getAttribute("data-lexical-word-pronunciation") || "";
  const definition = domNode.getAttribute("data-lexical-word-definition") || "";
  const rubyTags = domNode.getAttribute("data-lexical-word-ruby-tags") || "";
  const version = domNode.getAttribute("data-lexical-word-version") || "1";

  // Parse audio keys
  let audio = [];
  const audioKeysAttr = domNode.getAttribute("data-lexical-audio-keys");
  if (audioKeysAttr) {
    try {
      audio = JSON.parse(audioKeysAttr);
    } catch (e) {
      console.error("Failed to parse audio keys:", e);
    }
  }

  // Parse audio URLs from script tag if present
  const audioScript = domNode.querySelector("script.lexical-word-audio-data");
  let audioData = null;
  if (audioScript) {
    try {
      audioData = JSON.parse(audioScript.textContent);
    } catch (e) {
      console.error("Failed to parse audio data:", e);
    }
  }

  // Create the node with imported data
  const node = $createWordDecoratorNode(
    wordId,
    phrase,
    pronunciation,
    definition,
    audio,
    rubyTags,
    parseInt(version, 10),
    true, // isExpanded
    false, // isSelected
    "", // searchTerm
    null, // sharedHistory - will be set by plugin
    null, // onUpdate - will be set by plugin
    null, // onDelete - will be set by plugin
    null, // onToggleExpand - will be set by plugin
    null, // onToggleSelect - will be set by plugin
    null, // onOpenRubyDialog - will be set by plugin
    {}, // audioFiles - would be populated from audioData if needed
    "", // identityId
    0, // index
  );

  return { node };
}

// Helper function for text width calculation
function getTextWidth(text) {
  const element = document.createElement("span");
  element.style.position = "absolute";
  element.style.visibility = "hidden";
  element.style.whiteSpace = "nowrap";
  element.textContent = text;
  document.body.appendChild(element);
  const style = getComputedStyle(element);
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  document.body.removeChild(element);
  return metrics.width;
}

// =============================================================================
// RubyTagEditor - Text selection based interface (from original DictionaryEditor)
// =============================================================================

function RubyTagEditor({ inPhrase, inPronunciation, word }) {
  const { bumpWordVersion } = React.useContext(DictionaryContext);
  const [phrase, setPhrase] = React.useState(inPhrase);
  const [pronunciation, setPronunciation] = React.useState(inPronunciation);
  const [selectedPhrase, setSelectedPhrase] = React.useState("");
  const [selectedPronunciation, setSelectedPronunciation] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [selectionStart, setSelectionStart] = React.useState(null);
  const [selectionEnd, setSelectionEnd] = React.useState(null);
  const [rubyTags, setRubyTags] = React.useState([]);

  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const _escapeHtml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const _setRubyTags = (phraseText, pronunciationText) => {
    const rubyTag = `${_escapeHtml(phraseText)}<rt>${_escapeHtml(pronunciationText)}</rt>`;
    setRubyTags([...rubyTags, rubyTag]);
  };

  const handlePhraseChange = (event) => {
    setPhrase(event.target.value);
  };

  const handlePronunciationChange = (event) => {
    setPronunciation(event.target.value);
  };

  const handleSelectionStart = (event) => {
    setSelectionStart(event.target.selectionStart);
  };

  const handleSelectionEndPhrase = (event) => {
    const selectionEnd = event.target.selectionEnd;
    if (selectionStart !== null && selectionEnd !== selectionStart) {
      const selectedPhrase = phrase.substring(selectionStart, selectionEnd);
      setPhrase(phrase.replace(selectedPhrase, ""));
      setSelectedPhrase(selectedPhrase);
      setSelectionStart(null);

      if (selectedPhrase.length > 0 && selectedPronunciation.length > 0) {
        _setRubyTags(selectedPhrase, selectedPronunciation);
        setSelectedPhrase("");
        setSelectedPronunciation("");
      }
    }
  };

  const handleSelectionEndPronunciation = (event) => {
    const selectionEnd = event.target.selectionEnd;
    if (selectionStart !== null && selectionEnd !== selectionStart) {
      const selectedPronunciation = pronunciation.substring(
        selectionStart,
        selectionEnd,
      );
      setPronunciation(pronunciation.replace(selectedPronunciation, ""));
      setSelectedPronunciation(selectedPronunciation);
      setSelectionStart(null);

      if (selectedPhrase.length > 0 && selectedPronunciation.length > 0) {
        _setRubyTags(selectedPhrase, selectedPronunciation);
        setSelectedPhrase("");
        setSelectedPronunciation("");
      }
    }
  };

  React.useEffect(() => {
    // Reset all state when props change (dialog reopens)
    setPhrase(inPhrase || "");
    setPronunciation(inPronunciation || "");
    setSelectedPhrase("");
    setSelectedPronunciation("");
    setSelectionStart(null);
    setSelectionEnd(null);
    setRubyTags([]);
    setLoading(false);
  }, [inPhrase, inPronunciation, word?.id]);

  const rubyTagsString = rubyTags.join(" ");

  let hideAll = false;

  if (
    selectedPhrase === "" &&
    phrase === "" &&
    selectedPronunciation === "" &&
    pronunciation === ""
  ) {
    hideAll = true;
  }

  return (
    <div
      style={{
        width: "100%",
        textWrap: "nowrap",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "900px",
          mx: "auto",
          p: 4,
        }}
      >
        <Alert
          severity="info"
          sx={{
            mb: 4,
            width: "100%",
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
        >
          <Typography
            variant="body1"
            sx={{ mb: 1.5, fontSize: "1.1rem", whiteSpace: "normal" }}
          >
            <strong>{t("dictionaryEditor.rubyTagsTitle")}</strong>
          </Typography>
          <Typography
            variant="body1"
            component="div"
            sx={{ fontSize: "1rem", lineHeight: 1.8, whiteSpace: "normal" }}
          >
            {t("dictionaryEditor.rubyTagsStep1")}
            <br />
            {t("dictionaryEditor.rubyTagsStep2")}
            <br />
            {t("dictionaryEditor.rubyTagsStep3")}
            <br />
            {t("dictionaryEditor.rubyTagsStep4")}
          </Typography>
        </Alert>
        {!hideAll && (
          <>
            <style>
              {`
          input::selection {
            background-color: yellow;
            color: black;
          }
          input {
            user-select: text;
          }
          .selected-text {
            background-color: yellow;
            color: black;
            user-select: none;
          }
        `}
            </style>
            <Box sx={{ mb: 4, width: "100%" }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  display: "block",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                }}
              >
                {t("dictionaryEditor.pronunciationLabel")}
              </Typography>
              {selectedPronunciation !== null && (
                <div
                  style={{
                    backgroundColor: "yellow",
                    color: "black",
                    userSelect: "none",
                    display: "inline-block",
                    fontSize: "2.5rem",
                    padding: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {selectedPronunciation}
                </div>
              )}
              <input
                style={{
                  caretColor: "black",
                  border: "3px solid #ccc",
                  borderRadius: "8px",
                  padding: "16px",
                  margin: 0,
                  display: "block",
                  width: "100%",
                  fontSize: "2.5rem",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
                type="text"
                value={pronunciation}
                onClick={doNothing}
                onChange={handlePronunciationChange}
                onSelect={handleSelectionStart}
                onBlur={handleSelectionEndPronunciation}
              />
            </Box>
            <Box sx={{ mb: 4, width: "100%" }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  display: "block",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                }}
              >
                {t("dictionaryEditor.phraseLabel")}
              </Typography>
              {selectedPhrase !== null && (
                <Typography
                  style={{
                    backgroundColor: "yellow",
                    color: "black",
                    userSelect: "none",
                    fontSize: "2.5rem",
                    padding: "8px",
                    marginBottom: "8px",
                    display: "inline-block",
                  }}
                >
                  {selectedPhrase}
                </Typography>
              )}
              <input
                style={{
                  caretColor: "black",
                  border: "3px solid #ccc",
                  borderRadius: "8px",
                  padding: "16px",
                  margin: 0,
                  display: "block",
                  width: "100%",
                  fontSize: "2.5rem",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
                type="text"
                value={phrase}
                onClick={doNothing}
                onChange={handlePhraseChange}
                onSelect={handleSelectionStart}
                onBlur={handleSelectionEndPhrase}
              />
            </Box>
          </>
        )}
        <Box sx={{ mb: 4, width: "100%" }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: "block",
              fontSize: "1.1rem",
              fontWeight: 500,
            }}
          >
            {t("dictionaryEditor.rubyTagPreview")}
          </Typography>
          <Box
            sx={{
              p: 3,
              border: "3px solid #e0e0e0",
              borderRadius: 2,
              minHeight: "120px",
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ruby
              style={{ fontSize: "2.5rem" }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  rubyTagsString || "<em>No ruby tags yet</em>",
                  { ALLOWED_TAGS: ["rt", "rp", "em"], ALLOWED_ATTR: [] },
                ),
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 2,
            justifyContent: "center",
          }}
        >
          <Tooltip title="Add selection">
            <span>
              <IconButton
                size="large"
                color="inherit"
                disabled={loading}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                sx={{ border: "2px solid currentColor" }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear and reset">
            <span>
              <IconButton
                size="large"
                color="error"
                disabled={loading}
                onClick={() => {
                  setRubyTags([]);
                  setSelectedPhrase("");
                  setSelectedPronunciation("");
                  setSelectionStart(null);
                  setSelectionEnd(null);
                }}
                sx={{ border: "2px solid currentColor" }}
              >
                <CloseIcon fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Save ruby tags">
            <span>
              <IconButton
                size="large"
                color="primary"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);

                  const versionCtrl = bumpWordVersion(word.id, word._version);
                  try {
                    const client = getAmplifyClient();
                    const { data: saved, errors } =
                      await client.models.Word.update({
                        id: word.id,
                        rubyTags: rubyTagsString,
                        _version: word._version,
                      });
                    if (errors?.length) {
                      versionCtrl.rollback();
                    } else if (saved) {
                      versionCtrl.confirm(saved._version);
                    }
                  } catch (error) {
                    versionCtrl.rollback();
                    console.error("Failed to save ruby tags:", error);
                  }

                  setRubyTags([]);
                  setSelectedPhrase("");
                  setSelectedPronunciation("");
                  setSelectionStart(null);
                  setSelectionEnd(null);
                  setLoading(false);
                }}
                sx={{ border: "2px solid currentColor" }}
              >
                <SaveIcon fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </div>
  );
}

// =============================================================================
// WordDecoratorNode - Represents a single vocabulary word in the editor
// =============================================================================

class WordDecoratorNode extends DecoratorNode {
  __wordId;
  __phrase;
  __pronunciation;
  __definition;
  __audio;
  __rubyTags;
  __version;
  __isExpanded;
  __isSelected;
  __searchTerm;
  __sharedHistory;
  __onUpdate;
  __onDelete;
  __onToggleExpand;
  __onToggleSelect;
  __onOpenRubyDialog;
  __audioFiles;
  __identityId;
  __index;
  __documentID;
  __fileID;
  __filename;
  __page;

  static getType() {
    return "word-decorator";
  }

  static clone(node) {
    return new WordDecoratorNode(
      node.__wordId,
      node.__phrase,
      node.__pronunciation,
      node.__definition,
      node.__audio,
      node.__rubyTags,
      node.__version,
      node.__isExpanded,
      node.__isSelected,
      node.__searchTerm,
      node.__sharedHistory,
      node.__onUpdate,
      node.__onDelete,
      node.__onToggleExpand,
      node.__onToggleSelect,
      node.__onOpenRubyDialog,
      node.__audioFiles,
      node.__identityId,
      node.__index,
      node.__documentID,
      node.__fileID,
      node.__filename,
      node.__page,
      node.__key,
    );
  }

  constructor(
    wordId,
    phrase,
    pronunciation,
    definition,
    audio,
    rubyTags,
    version,
    isExpanded = true,
    isSelected = false,
    searchTerm = "",
    sharedHistory = null,
    onUpdate = null,
    onDelete = null,
    onToggleExpand = null,
    onToggleSelect = null,
    onOpenRubyDialog = null,
    audioFiles = {},
    identityId = "",
    index = 0,
    documentID = null,
    fileID = null,
    filename = null,
    page = null,
    key,
  ) {
    super(key);
    this.__wordId = wordId;
    this.__phrase = phrase;
    this.__pronunciation = pronunciation;
    this.__definition = definition;
    this.__audio = audio || [];
    this.__rubyTags = rubyTags || "";
    this.__version = version;
    this.__isExpanded = isExpanded;
    this.__isSelected = isSelected;
    this.__searchTerm = searchTerm;
    this.__sharedHistory = sharedHistory;
    this.__onUpdate = onUpdate;
    this.__onDelete = onDelete;
    this.__onToggleExpand = onToggleExpand;
    this.__onToggleSelect = onToggleSelect;
    this.__onOpenRubyDialog = onOpenRubyDialog;
    this.__audioFiles = audioFiles;
    this.__identityId = identityId;
    this.__index = index;
    this.__documentID = documentID;
    this.__fileID = fileID;
    this.__filename = filename;
    this.__page = page;
  }

  static importJSON(serializedNode) {
    const {
      wordId,
      phrase,
      pronunciation,
      definition,
      audio,
      rubyTags,
      version,
      isExpanded,
      isSelected,
      index,
    } = serializedNode;
    return $createWordDecoratorNode(
      wordId,
      phrase,
      pronunciation,
      definition,
      audio,
      rubyTags,
      version,
      isExpanded,
      isSelected,
      "",
      null,
      null,
      null,
      null,
      null,
      null,
      {},
      "",
      index,
    );
  }

  exportJSON() {
    return {
      type: "word-decorator",
      wordId: this.__wordId,
      phrase: this.__phrase,
      pronunciation: this.__pronunciation,
      definition: this.__definition,
      audio: this.__audio,
      rubyTags: this.__rubyTags,
      version: this.__version,
      isExpanded: this.__isExpanded,
      index: this.__index,
    };
  }

  updateWord(updates) {
    const writable = this.getWritable();
    if (updates.phrase !== undefined) writable.__phrase = updates.phrase;
    if (updates.pronunciation !== undefined)
      writable.__pronunciation = updates.pronunciation;
    if (updates.definition !== undefined)
      writable.__definition = updates.definition;
    if (updates.audio !== undefined) writable.__audio = updates.audio;
    if (updates.rubyTags !== undefined) writable.__rubyTags = updates.rubyTags;
    if (updates._version !== undefined) writable.__version = updates._version;
  }

  setExpanded(isExpanded) {
    const writable = this.getWritable();
    writable.__isExpanded = isExpanded;
  }

  setSelected(isSelected) {
    const writable = this.getWritable();
    writable.__isSelected = isSelected;
  }

  setSearchTerm(searchTerm) {
    const writable = this.getWritable();
    writable.__searchTerm = searchTerm;
  }

  createDOM(config) {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-word-id", this.__wordId);
    div.setAttribute("data-lexical-word-phrase", this.__phrase || "");
    div.setAttribute(
      "data-lexical-word-pronunciation",
      this.__pronunciation || "",
    );
    div.setAttribute("data-lexical-word-definition", this.__definition || "");
    div.setAttribute("data-lexical-word-ruby-tags", this.__rubyTags || "");
    div.setAttribute("data-lexical-word-version", this.__version || "1");

    // Audio URLs (S3 keys)
    if (this.__audio && this.__audio.length > 0) {
      div.setAttribute("data-lexical-audio-keys", JSON.stringify(this.__audio));
    }

    // Store fully formed S3 URLs if available
    if (this.__audioFiles && this.__audio && this.__audio.length > 0) {
      const audioUrls = this.__audio
        .map((key) => {
          const file = this.__audioFiles[key];
          return file ? { key, url: file.url } : null;
        })
        .filter(Boolean);

      if (audioUrls.length > 0) {
        div.setAttribute("data-lexical-audio-urls", JSON.stringify(audioUrls));
      }
    }

    return div;
  }

  // Async method to export word with audio blobs as base64
  async exportDOMWithAudio() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-word-id", this.__wordId);
    element.setAttribute("data-lexical-word-phrase", this.__phrase || "");
    element.setAttribute(
      "data-lexical-word-pronunciation",
      this.__pronunciation || "",
    );
    element.setAttribute(
      "data-lexical-word-definition",
      this.__definition || "",
    );
    element.setAttribute("data-lexical-word-ruby-tags", this.__rubyTags || "");
    element.setAttribute("data-lexical-word-version", this.__version || "1");

    // Audio URLs (S3 keys)
    if (this.__audio && this.__audio.length > 0) {
      element.setAttribute(
        "data-lexical-audio-keys",
        JSON.stringify(this.__audio),
      );
    }

    // Store fully formed S3 URLs and base64 audio blobs
    if (this.__audioFiles && this.__audio && this.__audio.length > 0) {
      const audioUrls = [];
      const audioBlobs = [];

      for (const key of this.__audio) {
        const file = this.__audioFiles[key];
        if (file) {
          audioUrls.push({ key, url: file.url });

          // Convert blob to base64
          if (file.blob) {
            const base64 = await blobToBase64(file.blob);
            audioBlobs.push({
              key,
              base64,
              url: file.url,
            });
          }
        }
      }

      if (audioUrls.length > 0) {
        element.setAttribute(
          "data-lexical-audio-urls",
          JSON.stringify(audioUrls),
        );
      }

      if (audioBlobs.length > 0) {
        const script = document.createElement("script");
        script.type = "application/json";
        script.className = "lexical-word-audio-data";
        script.setAttribute("data-word-id", this.__wordId);
        script.textContent = JSON.stringify(audioBlobs);
        element.appendChild(script);
      }
    }

    return { element };
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-word-id", this.__wordId);
    element.setAttribute("data-lexical-word-phrase", this.__phrase || "");
    element.setAttribute(
      "data-lexical-word-pronunciation",
      this.__pronunciation || "",
    );
    element.setAttribute(
      "data-lexical-word-definition",
      this.__definition || "",
    );
    element.setAttribute("data-lexical-word-ruby-tags", this.__rubyTags || "");
    element.setAttribute("data-lexical-word-version", this.__version || "1");

    // Audio URLs (S3 keys)
    if (this.__audio && this.__audio.length > 0) {
      element.setAttribute(
        "data-lexical-audio-keys",
        JSON.stringify(this.__audio),
      );
    }

    // Store fully formed S3 URLs if available
    if (this.__audioFiles && this.__audio && this.__audio.length > 0) {
      const audioUrls = this.__audio
        .map((key) => {
          const file = this.__audioFiles[key];
          return file ? { key, url: file.url } : null;
        })
        .filter(Boolean);

      if (audioUrls.length > 0) {
        element.setAttribute(
          "data-lexical-audio-urls",
          JSON.stringify(audioUrls),
        );
      }
    }

    // Note: Audio blobs are NOT included in synchronous exportDOM
    // Use exportDOMWithAudio() for complete serialization with base64 audio

    return { element };
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-word-id")) {
          return null;
        }
        return {
          conversion: convertWordElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <WordRowComponent
        wordId={this.__wordId}
        phrase={this.__phrase}
        pronunciation={this.__pronunciation}
        definition={this.__definition}
        audio={this.__audio}
        rubyTags={this.__rubyTags}
        version={this.__version}
        isExpanded={this.__isExpanded}
        isSelected={this.__isSelected}
        searchTerm={this.__searchTerm}
        sharedHistory={this.__sharedHistory}
        onUpdate={this.__onUpdate}
        onDelete={this.__onDelete}
        onToggleExpand={this.__onToggleExpand}
        onToggleSelect={this.__onToggleSelect}
        onOpenRubyDialog={this.__onOpenRubyDialog}
        audioFiles={this.__audioFiles}
        identityId={this.__identityId}
        index={this.__index}
        documentID={this.__documentID}
        fileID={this.__fileID}
        filename={this.__filename}
        page={this.__page}
        nodeKey={this.__key}
      />
    );
  }

  isInline() {
    return false;
  }

  isTopLevel() {
    return true;
  }
}

function $createWordDecoratorNode(
  wordId,
  phrase,
  pronunciation,
  definition,
  audio,
  rubyTags,
  version,
  isExpanded,
  isSelected,
  searchTerm,
  sharedHistory,
  onUpdate,
  onDelete,
  onToggleExpand,
  onToggleSelect,
  onOpenRubyDialog,
  audioFiles,
  identityId,
  index,
  documentID = null,
  fileID = null,
  filename = null,
  page = null,
) {
  return new WordDecoratorNode(
    wordId,
    phrase,
    pronunciation,
    definition,
    audio,
    rubyTags,
    version,
    isExpanded,
    isSelected,
    searchTerm,
    sharedHistory,
    onUpdate,
    onDelete,
    onToggleExpand,
    onToggleSelect,
    onOpenRubyDialog,
    audioFiles,
    identityId,
    index,
    documentID,
    fileID,
    filename,
    page,
  );
}

function $isWordDecoratorNode(node) {
  return node instanceof WordDecoratorNode;
}

// =============================================================================
// WordRowComponent - The React component rendered by WordDecoratorNode
// =============================================================================

function WordRowComponent({
  wordId,
  phrase,
  pronunciation,
  definition,
  audio,
  rubyTags,
  version,
  isExpanded,
  isSelected,
  searchTerm,
  sharedHistory,
  onUpdate,
  onDelete,
  onToggleExpand,
  onToggleSelect,
  onOpenRubyDialog,
  audioFiles,
  identityId,
  index,
  documentID,
  fileID,
  filename,
  page,
  nodeKey,
}) {
  const t = useTranslations("components");
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [audioFilesToUpload, setAudioFilesToUpload] = React.useState([]);
  const [recordingDialogOpen, setRecordingDialogOpen] = React.useState(false);
  const [rubyDialogOpen, setRubyDialogOpen] = React.useState(false);
  const { unit } = React.useContext(UnitContext);

  // Memoize word preset to avoid recreating on every render
  const wordPreset = React.useMemo(
    () => createWordPreset({ phrase, pronunciation, definition }),
    [phrase, pronunciation, definition],
  );

  // Get the actual word object for RubyTagEditor
  const { filteredDictionary: dictionary } =
    React.useContext(DictionaryContext);
  const word = React.useMemo(() => {
    return dictionary
      ? Object.values(dictionary).find((w) => w.id === wordId)
      : null;
  }, [dictionary, wordId]);

  const isEvenRow = index % 2 === 0;
  const audioUrls = audio || [];
  const hasAudio = audioUrls.length > 0;

  // Handle audio file uploads
  React.useEffect(() => {
    const asyncFunc = async () => {
      if (audioFilesToUpload.length === 0) return;

      const _audio = [];
      for (let i = 0; i < audioFilesToUpload.length; i++) {
        const { file, name } = audioFilesToUpload[i];

        try {
          // Gen 2 API requires full path with protection level prefix
          const s3Path = `protected/${identityId}/audio/${name}`;

          const result = await uploadData({
            path: s3Path,
            data: file,
            options: {
              contentType: "audio/ogg",
              onProgress: ({ transferredBytes, totalBytes }) => {
                if (totalBytes) {
                  const percentage = Math.round(
                    (transferredBytes / totalBytes) * 100,
                  );
                  setFileOperations((prev) =>
                    prev.map((op, idx) =>
                      idx === i ? { ...op, progress: `${percentage}%` } : op,
                    ),
                  );
                }
              },
            },
          }).result;

          _audio.push(result.path);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }

      if (_audio.length > 0 && onUpdate) {
        const newAudio = deduplicateUrls([...audioUrls, ..._audio]);
        await onUpdate(wordId, { audio: newAudio }, version);
      }

      setAudioFilesToUpload([]);
      setFileOperations([]);
    };

    asyncFunc();
  }, [audioFilesToUpload]);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const _toupload = files.map((f, index) => ({
      file: f,
      name: `${unit.id}_${wordId}_${Date.now()}_${index}.ogg`,
    }));

    const _fileOperations = files.map((f) => ({
      name: f.name,
      progress: "0%",
    }));

    setAudioFilesToUpload(_toupload);
    setFileOperations(_fileOperations);
    setIsDragging(false);
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const confirmDeleteWord = async () => {
    // This function is a placeholder - deletion is now handled via the passed onDelete callback
    // which will trigger the confirmation dialog in the parent component
    if (onDelete) {
      await onDelete(wordId, phrase);
    }
  };

  const matchesSearch =
    searchTerm &&
    ((phrase && phrase.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pronunciation &&
        pronunciation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (definition &&
        definition.toLowerCase().includes(searchTerm.toLowerCase())));

  const wordItemRef = React.useRef(null);
  const tabContext = useTabContext();
  const [isHighlighted, setIsHighlighted] = React.useState(false);

  // Register ref for scrolling
  React.useEffect(() => {
    if (tabContext?.registerItemRef && wordId) {
      tabContext.registerItemRef("word", wordId, wordItemRef);
    }
    return () => {
      if (tabContext?.unregisterItemRef && wordId) {
        tabContext.unregisterItemRef("word", wordId);
      }
    };
  }, [wordId, tabContext]);

  // Highlight when focused from search results
  React.useEffect(() => {
    if (
      tabContext?.focusItem?.type === "word" &&
      tabContext.focusItem.id === wordId
    ) {
      setIsHighlighted(true);
      // Auto-expand when focused
      if (onToggleExpand && !isExpanded) {
        onToggleExpand(wordId);
      }
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [tabContext?.focusItem, wordId, onToggleExpand, isExpanded]);

  // Adapt word data to VocabularyItem interface
  const vocabularyItem = {
    word: phrase || "",
    definition: definition || "",
    context: pronunciation, // Use pronunciation field for phonetic context
    phonetic: pronunciation,
    audio: audio,
    documentID: documentID,
    fileID: fileID,
    filename: filename,
    page: page,
  };

  const handleUpdateWrapper = async (itemIndex, field, newValue) => {
    if (onUpdate) {
      // Map VocabularyCard field names to Word model field names
      const fieldMapping = {
        word: "phrase",
        definition: "definition",
        context: "pronunciation",
        phonetic: "pronunciation",
      };
      const mappedField = fieldMapping[field] || field;
      await onUpdate(wordId, { [mappedField]: newValue }, version);
    }
  };

  return (
    <Box ref={wordItemRef}>
      <VocabularyCard
        item={vocabularyItem}
        index={index}
        isSelected={isSelected}
        isExpanded={isExpanded}
        existsInDictionary={true}
        alreadyImported={true}
        searchTerm={searchTerm}
        onToggleSelect={() => onToggleSelect(wordId)}
        onToggleExpand={() => onToggleExpand(wordId)}
        onUpdate={handleUpdateWrapper}
        onOpenRubyEditor={() => setRubyDialogOpen(true)}
        onOpenAudioStudio={() => setRecordingDialogOpen(true)}
      />

      {/* Ruby Dialog */}
      <Dialog
        open={rubyDialogOpen}
        onClose={() => setRubyDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t("dictionaryEditor.rubyTagEditorTitle")} - {phrase}
        </DialogTitle>
        <DialogContent>
          <RubyTagEditor
            inPhrase={phrase}
            inPronunciation={pronunciation}
            word={word}
          />
        </DialogContent>
      </Dialog>

      {/* Recording Studio 3 Modal */}
      <RecordingStudio3Modal
        data-tour="audio-upload"
        open={recordingDialogOpen}
        onClose={() => setRecordingDialogOpen(false)}
        onSave={async (payload) => {
          const { phraseAudio, definitionAudio, scriptData } = payload;
          const updates = {};

          // Map phrase track takes to Word.audio[]
          if (phraseAudio?.length > 0) {
            const newPaths = phraseAudio
              .map((t) => t.audioPath)
              .filter(Boolean);
            const audioUrls = audio || [];
            updates.audio = deduplicateUrls([...audioUrls, ...newPaths]);
          }

          // Map definition track takes to Word.definitionAudio[]
          if (definitionAudio?.length > 0) {
            const newPaths = definitionAudio
              .map((t) => t.audioPath)
              .filter(Boolean);
            const defUrls = word?.definitionAudio || [];
            updates.definitionAudio = deduplicateUrls([
              ...defUrls,
              ...newPaths,
            ]);
          }

          // Persist full scriptData for re-opening
          if (scriptData) {
            updates.scriptData = JSON.stringify(scriptData);
          }

          if (Object.keys(updates).length > 0 && onUpdate) {
            await onUpdate(wordId, updates, version);
          }
        }}
        title={`${t("dictionaryEditor.audioStudioTitle")} - ${phrase}`}
        preset="word"
        scriptData={wordPreset.scriptData}
        lockedTracks={wordPreset.lockedTracks}
        identityId={identityId}
      />
    </Box>
  );
}

// =============================================================================
// WordsPlugin - Manages word nodes and synchronization
// =============================================================================
// NestedWordField - Individual field editor with Lexical
// =============================================================================

function NestedWordField({
  value,
  field,
  wordId,
  version,
  onSave,
  sharedHistory,
  searchTerm,
  placeholder,
  label = "",
}) {
  const [localValue, setLocalValue] = React.useState(value);
  const saveTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const initialConfig = React.useMemo(
    () => ({
      namespace: `WordField-${field}-${wordId}`,
      nodes: [MarkNode],
      theme: {
        mark: "search-highlight",
      },
      onError: (error) => console.error("Lexical error:", error),
      editorState: () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const text = $createTextNode(value || "");
        paragraph.append(text);
        root.append(paragraph);
      },
    }),
    [field, wordId, value],
  );

  const handleChange = (editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      setLocalValue(textContent);

      // Debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (onSave && textContent !== value) {
          onSave(wordId, { [field]: textContent }, version);
        }
      }, 1000);
    });
  };

  return (
    <Box
      sx={{
        padding: 0,
        margin: 0,
        "& .word-field-editor": {
          cursor: "text",
          // add chunky dashed border when not focused
          border: "3px dashed",
          borderColor: "divider",
          borderRadius: 1,
          padding: 1,
          margin: 1,
          "&::before": label
            ? {
                content: `"${label}"`,
                fontWeight: 600,
                color: "text.secondary",
              }
            : {},
        },
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className="word-field-editor" />}
          placeholder={
            <div
              style={{
                position: "absolute",
                top: 0,
                left: label ? "80px" : 0,
                color: "text.disabled",
                pointerEvents: "none",
              }}
            >
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {sharedHistory && (
          <HistoryPlugin externalHistoryState={sharedHistory} />
        )}
        <OnChangePlugin onChange={handleChange} />
        {searchTerm && searchTerm.length >= 2 && (
          <SearchHighlightPlugin searchTerm={searchTerm} />
        )}
      </LexicalComposer>
    </Box>
  );
}

// =============================================================================
// WordsPlugin - Manages word nodes and synchronization
// =============================================================================

function WordsPlugin({
  dictionary,
  searchTerm,
  expandedItems,
  selectedItems,
  onToggleExpand,
  onToggleSelect,
  onOpenRubyDialog,
  sharedHistory,
  audioFiles,
  identityId,
  parentRef,
  setConfirmDialog,
  fullDictionary,
}) {
  const { bumpWordVersion } = React.useContext(DictionaryContext);
  const [editor] = useLexicalComposerContext();

  // Setup virtualizer for performance
  const dictionaryEntries = React.useMemo(() => {
    return dictionary ? Object.entries(dictionary) : [];
  }, [dictionary]);

  const virtualizer = useVirtualizer({
    count: dictionaryEntries.length,
    getScrollElement: () => parentRef?.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Update words when dictionary changes
  React.useEffect(() => {
    if (!dictionary) return;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      Object.entries(dictionary).forEach(([key, word], index) => {
        const node = $createWordDecoratorNode(
          word.id,
          word.phrase,
          word.pronunciation,
          word.definition,
          word.audio || [],
          word.rubyTags || "",
          word._version || 1,
          expandedItems.has(word.id),
          selectedItems.has(word.id),
          searchTerm,
          sharedHistory,
          handleUpdateWord,
          handleDeleteWord,
          onToggleExpand,
          onToggleSelect,
          onOpenRubyDialog,
          audioFiles,
          identityId,
          index,
          word.documentID,
          word.fileID,
          word.filename,
          word.page,
        );
        root.append(node);
      });
    });
  }, [
    dictionary,
    searchTerm,
    expandedItems,
    selectedItems,
    audioFiles,
    editor,
  ]);

  const handleUpdateWord = async (wordId, updates, currentVersion) => {
    try {
      const word = Object.values(dictionary).find((w) => w.id === wordId);
      if (!word) return;

      // Skip DynamoDB update if no fields remain
      if (Object.keys(updates).length === 0) return;

      const versionCtrl = bumpWordVersion(word.id, word._version);
      const client = getAmplifyClient();
      const { data: saved, errors } = await client.models.Word.update({
        id: word.id,
        ...updates,
        _version: word._version,
      });
      if (errors?.length) {
        versionCtrl.rollback();
      } else if (saved) {
        versionCtrl.confirm(saved._version);
      }
    } catch (error) {
      console.error("Failed to update word:", error);
    }
  };

  const handleDeleteWord = async (wordId, phrase = "") => {
    if (!setConfirmDialog) {
      console.error("setConfirmDialog not available");
      return;
    }

    // Show confirmation dialog before deleting
    setConfirmDialog({
      open: true,
      message: `Delete word: "${phrase}"?`,
      severity: "warning",
      onConfirm: async () => {
        try {
          const word = Object.values(fullDictionary).find(
            (w) => w.id === wordId,
          );
          if (!word) {
            console.error("Word not found:", wordId);
            setConfirmDialog({
              open: false,
              message: "",
              onConfirm: null,
              severity: "warning",
            });
            return;
          }

          const client = getAmplifyClient();
          await client.models.Word.delete({ id: word.id });
          setConfirmDialog({
            open: false,
            message: "",
            onConfirm: null,
            severity: "warning",
          });
        } catch (error) {
          console.error("Failed to delete word:", error);
          setConfirmDialog({
            open: false,
            message: "",
            onConfirm: null,
            severity: "warning",
          });
        }
      },
    });
  };

  return null;
}

// =============================================================================
// Main DictionaryEditor2 Component
// =============================================================================

export function DictionaryEditor2() {
  const t = useTranslations("components");
  const [open, setOpen] = React.useState(false);
  const [isHelpOpen, setHelpOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState(new Set());
  const [filteredDictionary, setFilteredDictionary] = React.useState(null);
  const [selectedItems, setSelectedItems] = React.useState(new Set());
  const [contextMenu, setContextMenu] = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState({
    open: false,
    message: "",
    onConfirm: null,
    severity: "warning",
  });
  const sharedHistoryState = React.useRef(createEmptyHistoryState());
  const [search, setSearch] = React.useState("");
  const [newPhrase, setNewPhrase] = React.useState("");
  const [newPronunciation, setNewPronunciation] = React.useState("");
  const [newDefinition, setNewDefinition] = React.useState("");
  const [rubyDialogPhrase, setRubyDialogPhrase] = React.useState("");
  const [rubyDialogPronunciation, setRubyDialogPronunciation] =
    React.useState("");
  const [rubyDialogOpen, setRubyDialogOpen] = React.useState(false);
  const [rubyDialogWord, setRubyDialogWord] = React.useState(null);
  const [newWordFormOpen, setNewWordFormOpen] = React.useState(false);

  const { filteredDictionary: dictionary } =
    React.useContext(DictionaryContext);
  const { audioFiles, refreshAudioFiles, session } =
    React.useContext(FilesContext);
  const { identityId } = session || {};
  const { unit } = React.useContext(UnitContext);

  const parentRef = React.useRef(null);

  // Filter words based on search
  React.useEffect(() => {
    if (!search || !dictionary) {
      setFilteredDictionary(dictionary);
      return;
    }

    const filtered = {};
    Object.entries(dictionary).forEach(([key, word]) => {
      const matchesSearch =
        (word.phrase &&
          word.phrase.toLowerCase().includes(search.toLowerCase())) ||
        (word.pronunciation &&
          word.pronunciation.toLowerCase().includes(search.toLowerCase())) ||
        (word.definition &&
          word.definition.toLowerCase().includes(search.toLowerCase()));

      if (matchesSearch) {
        filtered[key] = word;
      }
    });

    setFilteredDictionary(filtered);
  }, [search, dictionary]);

  const handleToggleExpand = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allIds = Object.values(filteredDictionary || {}).map((w) => w.id);
    setExpandedItems(new Set(allIds));
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const handleSelectAll = () => {
    const allIds = Object.values(filteredDictionary || {}).map((w) => w.id);
    setSelectedItems(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setConfirmDialog({
      open: true,
      message: `Delete ${selectedItems.size} selected word(s)?`,
      severity: "error",
      onConfirm: async () => {
        try {
          const words = Object.values(dictionary).filter((w) =>
            selectedItems.has(w.id),
          );
          const client = getAmplifyClient();
          const results = await Promise.allSettled(
            words.map((word) => client.models.Word.delete({ id: word.id })),
          );
          const failures = results.filter((r) => r.status === "rejected");
          if (failures.length > 0) {
            console.warn(
              `[DictionaryEditor] ${failures.length} word(s) failed to delete`,
            );
          }
          setSelectedItems(new Set());
          setConfirmDialog({
            open: false,
            message: "",
            onConfirm: null,
            severity: "warning",
          });
        } catch (error) {
          console.error("Failed to delete words:", error);
          setConfirmDialog({
            open: false,
            message: "",
            onConfirm: null,
            severity: "warning",
          });
        }
      },
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const toggleNewWordFormOpen = () => {
    setNewWordFormOpen(!newWordFormOpen);
  };

  const handleOpenRubyDialog = (wordId, phrase, pronunciation) => {
    const word = Object.values(dictionary || {}).find((w) => w.id === wordId);
    setRubyDialogWord(word);
    setRubyDialogPhrase(phrase);
    setRubyDialogPronunciation(pronunciation);
    setRubyDialogOpen(true);
  };

  const handleCloseRubyDialog = () => {
    setRubyDialogOpen(false);
    setRubyDialogWord(null);
    setRubyDialogPhrase("");
    setRubyDialogPronunciation("");
  };

  const handleCreateNewWord = async () => {
    if (!newPhrase.trim()) return;

    try {
      const client = getAmplifyClient();
      await client.models.Word.create({
        phrase: newPhrase,
        pronunciation: newPronunciation,
        definition: newDefinition,
        audio: [],
        identityId: identityId,
      });

      setNewPhrase("");
      setNewPronunciation("");
      setNewDefinition("");
      setNewWordFormOpen(false);
    } catch (error) {
      console.error("Failed to create word:", error);
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((search) => {
      setSearch(search);
    }, 500),
    [],
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value.trim());
  };

  const initialConfig = React.useMemo(
    () => ({
      namespace: "DictionaryEditor2",
      theme: {},
      nodes: [WordDecoratorNode],
      onError: (error) => console.error("Lexical error:", error),
    }),
    [],
  );

  return (
    <>
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            {selectedItems.size} selected
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleContextMenuClose();
            handleBulkDelete();
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Selected
        </MenuItem>
      </Menu>

      {/* Toolbar */}
      <Box
        data-tour="dictionary"
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          padding: 1,
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Select/Deselect All">
            <Checkbox
              size="small"
              checked={
                filteredDictionary &&
                Object.keys(filteredDictionary).length > 0 &&
                selectedItems.size === Object.keys(filteredDictionary).length
              }
              indeterminate={
                selectedItems.size > 0 &&
                selectedItems.size <
                  Object.keys(filteredDictionary || {}).length
              }
              onChange={(e) => {
                if (
                  selectedItems.size ===
                  Object.keys(filteredDictionary || {}).length
                ) {
                  handleDeselectAll();
                } else {
                  handleSelectAll();
                }
              }}
              disabled={
                !filteredDictionary ||
                Object.keys(filteredDictionary).length === 0
              }
              sx={{ p: 0.25 }}
            />
          </Tooltip>

          <Tooltip
            title={expandedItems.size === 0 ? "Expand All" : "Collapse All"}
          >
            <IconButton
              size="small"
              onClick={
                expandedItems.size === 0 ? handleExpandAll : handleCollapseAll
              }
              disabled={
                !filteredDictionary ||
                Object.keys(filteredDictionary).length === 0
              }
              aria-label={
                expandedItems.size === 0
                  ? t("dictionaryEditor.expandAll")
                  : t("dictionaryEditor.collapseAll")
              }
            >
              {expandedItems.size === 0 ? (
                <ExpandMore fontSize="small" />
              ) : (
                <ExpandLess fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <TextField
          defaultValue={search}
          onInput={handleSearch}
          type="text"
          size="small"
          fullWidth
          placeholder="Search words..."
          label="Search"
        />

        <Tooltip title="New Word">
          <IconButton
            onClick={toggleNewWordFormOpen}
            color="primary"
            size="small"
            data-tour="add-word-button"
            aria-label={t("dictionaryEditor.newWordButton")}
          >
            <Description />
          </IconButton>
        </Tooltip>

        <Tooltip title="Actions">
          <IconButton
            onClick={(e) =>
              setContextMenu(
                contextMenu ? null : { mouseX: e.clientX, mouseY: e.clientY },
              )
            }
            size="small"
            disabled={selectedItems.size === 0}
            aria-label={t("dictionaryEditor.actionsButton")}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main editor area */}
      <Box
        ref={parentRef}
        sx={{
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  margin: 0,
                  padding: 0,
                  outline: "none",
                  minHeight: "100%",
                }}
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <WordsPlugin
            dictionary={filteredDictionary}
            searchTerm={search}
            expandedItems={expandedItems}
            selectedItems={selectedItems}
            onToggleExpand={handleToggleExpand}
            onToggleSelect={handleToggleSelect}
            onOpenRubyDialog={handleOpenRubyDialog}
            sharedHistory={sharedHistoryState.current}
            audioFiles={audioFiles}
            identityId={identityId}
            parentRef={parentRef}
            setConfirmDialog={setConfirmDialog}
            fullDictionary={dictionary}
          />
        </LexicalComposer>
      </Box>

      {/* New word dialog */}
      <Dialog
        open={newWordFormOpen}
        onClose={toggleNewWordFormOpen}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("dictionaryEditor.createNewWordTitle")}</DialogTitle>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateNewWord();
            }}
            data-tour="word-form"
          >
            <TextField
              value={newPhrase}
              required
              onChange={(e) => setNewPhrase(e.target.value)}
              fullWidth
              margin="normal"
              label="Phrase"
              variant="outlined"
              name="phrase"
            />
            <TextField
              value={newPronunciation}
              required
              onChange={(e) => setNewPronunciation(e.target.value)}
              fullWidth
              margin="normal"
              label="Pronunciation"
              variant="outlined"
              name="pronunciation"
            />
            <TextField
              value={newDefinition}
              required
              onChange={(e) => setNewDefinition(e.target.value)}
              fullWidth
              margin="normal"
              label="Definition"
              variant="outlined"
              multiline
              rows={3}
              name="definition"
            />
            <Button variant="contained" type="submit" sx={{ mt: 2 }}>
              {t("dictionaryEditor.createWordButton")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Snackbar - Rendered in Portal to escape container overflow */}
      <Portal>
        <Snackbar
          open={confirmDialog.open}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          onClose={(event, reason) => {
            if (reason === "clickaway") {
              return;
            }
          }}
        >
          <Alert
            severity={confirmDialog.severity}
            sx={{
              width: "100%",
              minWidth: "300px",
              boxShadow: 3,
            }}
            action={
              <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDialog.onConfirm) {
                      confirmDialog.onConfirm();
                    }
                  }}
                  variant="outlined"
                >
                  {t("dictionaryEditor.confirmButton")}
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({
                      open: false,
                      message: "",
                      onConfirm: null,
                      severity: "warning",
                    });
                  }}
                  variant="contained"
                >
                  {t("dictionaryEditor.cancel")}
                </Button>
              </Box>
            }
          >
            {confirmDialog.message}
          </Alert>
        </Snackbar>
      </Portal>
    </>
  );
}
