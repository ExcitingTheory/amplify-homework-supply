"use strict";

import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getAmplifyClient } from "../utils/amplifyClient";
import { uploadData } from "aws-amplify/storage";

// Lexical imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import {
  HistoryPlugin,
  createEmptyHistoryState,
} from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { MarkNode } from "@lexical/mark";
import { DecoratorNode } from "lexical";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  createCommand,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import SearchHighlightPlugin from "./Editor3/plugins/SearchHighlightPlugin";

// MUI imports
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Menu,
  MenuItem,
  Portal,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  Description,
  ExpandLess,
  ExpandMore,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

// Context imports
import DictionaryContext from "../context/dictionaryContext";
import FilesContext from "../context/fileContext";
import UnitContext from "../context/unitContext";
import { useTabContext } from "../context/tabContext";
import ShowDeletedToggle from "./ShowDeletedToggle";
import { useRecycleBin } from "../hooks/useRecycleBin";

// i18n
import { useTranslations } from "next-intl";

// Import QuestionCard from QuestionsReview2
import { QuestionCard } from "./QuestionsReview2";

// Commands for question operations
const UPDATE_QUESTION_COMMAND = createCommand("UPDATE_QUESTION");
const DELETE_QUESTION_COMMAND = createCommand("DELETE_QUESTION");
const POPULATE_QUESTIONS_COMMAND = createCommand("POPULATE_QUESTIONS");

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

// Conversion function for importing question nodes from HTML
function convertQuestionElement(domNode) {
  const questionId = domNode.getAttribute("data-lexical-question-id");
  const prompt = domNode.getAttribute("data-lexical-question-prompt") || "";
  const hint = domNode.getAttribute("data-lexical-question-hint") || "";
  const answer = domNode.getAttribute("data-lexical-question-answer") || "";
  const version = domNode.getAttribute("data-lexical-question-version") || "1";

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
  const audioScript = domNode.querySelector(
    "script.lexical-question-audio-data",
  );
  let audioData = null;
  if (audioScript) {
    try {
      audioData = JSON.parse(audioScript.textContent);
    } catch (e) {
      console.error("Failed to parse audio data:", e);
    }
  }

  // Create the node with imported data
  const node = $createQuestionDecoratorNode(
    questionId,
    prompt,
    hint,
    answer,
    audio,
    parseInt(version, 10),
    true, // isExpanded
    false, // isSelected
    "", // searchTerm
    null, // sharedHistory - will be set by plugin
    null, // onUpdate - will be set by plugin
    null, // onDelete - will be set by plugin
    null, // onToggleExpand - will be set by plugin
    null, // onToggleSelect - will be set by plugin
    {}, // audioFiles - would be populated from audioData if needed
    "", // identityId
    0, // index
  );

  return { node };
}

// =============================================================================
// QuestionDecoratorNode - Represents a single question in the editor
// =============================================================================

class QuestionDecoratorNode extends DecoratorNode {
  __questionId;
  __prompt;
  __hint;
  __answer;
  __audio;
  __isExpanded;
  __isSelected;
  __searchTerm;
  __sharedHistory;
  __onUpdate;
  __onDelete;
  __onToggleExpand;
  __onToggleSelect;
  __audioFiles;
  __identityId;
  __index;
  __documentID;
  __fileID;
  __filename;
  __page;

  static getType() {
    return "question-decorator";
  }

  static clone(node) {
    return new QuestionDecoratorNode(
      node.__questionId,
      node.__prompt,
      node.__hint,
      node.__answer,
      node.__audio,
      node.__isExpanded,
      node.__isSelected,
      node.__searchTerm,
      node.__sharedHistory,
      node.__onUpdate,
      node.__onDelete,
      node.__onToggleExpand,
      node.__onToggleSelect,
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
    questionId,
    prompt,
    hint,
    answer,
    audio,
    isExpanded = true,
    isSelected = false,
    searchTerm = "",
    sharedHistory = null,
    onUpdate = null,
    onDelete = null,
    onToggleExpand = null,
    onToggleSelect = null,
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
    this.__questionId = questionId;
    this.__prompt = prompt;
    this.__hint = hint;
    this.__answer = answer;
    this.__audio = audio || [];
    this.__isExpanded = isExpanded;
    this.__isSelected = isSelected;
    this.__searchTerm = searchTerm;
    this.__sharedHistory = sharedHistory;
    this.__onUpdate = onUpdate;
    this.__onDelete = onDelete;
    this.__onToggleExpand = onToggleExpand;
    this.__onToggleSelect = onToggleSelect;
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
      questionId,
      prompt,
      hint,
      answer,
      audio,
      version,
      isExpanded,
      isSelected,
      index,
    } = serializedNode;
    return $createQuestionDecoratorNode(
      questionId,
      prompt,
      hint,
      answer,
      audio,
      version,
      isExpanded,
      isSelected,
      "",
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
      ...super.exportJSON(),
      type: "question-decorator",
      questionId: this.__questionId,
      prompt: this.__prompt,
      hint: this.__hint,
      answer: this.__answer,
      audio: this.__audio,
      isExpanded: this.__isExpanded,
      isSelected: this.__isSelected,
      index: this.__index,
    };
  }

  updateQuestion(updates) {
    const writable = this.getWritable();
    if (updates.prompt !== undefined) writable.__prompt = updates.prompt;
    if (updates.hint !== undefined) writable.__hint = updates.hint;
    if (updates.answer !== undefined) writable.__answer = updates.answer;
    if (updates.audio !== undefined) writable.__audio = updates.audio;
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
    div.setAttribute("data-lexical-question-id", this.__questionId);
    div.setAttribute("data-lexical-question-prompt", this.__prompt || "");
    div.setAttribute("data-lexical-question-hint", this.__hint || "");
    div.setAttribute("data-lexical-question-answer", this.__answer || "");
    div.setAttribute("data-lexical-question-version", this.__version || "1");

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

  // Async method to export question with audio blobs as base64
  async exportDOMWithAudio() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-question-id", this.__questionId);
    element.setAttribute("data-lexical-question-prompt", this.__prompt || "");
    element.setAttribute("data-lexical-question-hint", this.__hint || "");
    element.setAttribute("data-lexical-question-answer", this.__answer || "");

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

      // Convert blobs to base64 and store in script tag
      const audioBlobs = [];

      for (const key of this.__audio) {
        const file = this.__audioFiles[key];
        if (file && file.blob) {
          try {
            const base64 = await blobToBase64(file.blob);
            audioBlobs.push({
              key,
              base64,
              mimeType: file.blob.type || "audio/ogg",
              url: file.url,
            });
          } catch (error) {
            console.error("Failed to convert blob to base64:", error);
          }
        }
      }

      if (audioBlobs.length > 0) {
        const script = document.createElement("script");
        script.type = "application/json";
        script.className = "lexical-question-audio-data";
        script.setAttribute("data-question-id", this.__questionId);
        script.textContent = JSON.stringify(audioBlobs);
        element.appendChild(script);
      }
    }

    return { element };
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-question-id", this.__questionId);
    element.setAttribute("data-lexical-question-prompt", this.__prompt || "");
    element.setAttribute("data-lexical-question-hint", this.__hint || "");
    element.setAttribute("data-lexical-question-answer", this.__answer || "");
    element.setAttribute(
      "data-lexical-question-version",
      this.__version || "1",
    );

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
        if (!domNode.hasAttribute("data-lexical-question-id")) {
          return null;
        }
        return {
          conversion: convertQuestionElement,
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
      <QuestionRowComponent
        questionId={this.__questionId}
        prompt={this.__prompt}
        hint={this.__hint}
        answer={this.__answer}
        audio={this.__audio}
        isExpanded={this.__isExpanded}
        isSelected={this.__isSelected}
        searchTerm={this.__searchTerm}
        sharedHistory={this.__sharedHistory}
        onUpdate={this.__onUpdate}
        onDelete={this.__onDelete}
        onToggleExpand={this.__onToggleExpand}
        onToggleSelect={this.__onToggleSelect}
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

function $createQuestionDecoratorNode(
  questionId,
  prompt,
  hint,
  answer,
  audio,
  isExpanded,
  isSelected,
  searchTerm,
  sharedHistory,
  onUpdate,
  onDelete,
  onToggleExpand,
  onToggleSelect,
  audioFiles,
  identityId,
  index,
  documentID = null,
  fileID = null,
  filename = null,
  page = null,
) {
  return new QuestionDecoratorNode(
    questionId,
    prompt,
    hint,
    answer,
    audio,
    isExpanded,
    isSelected,
    searchTerm,
    sharedHistory,
    onUpdate,
    onDelete,
    onToggleExpand,
    onToggleSelect,
    audioFiles,
    identityId,
    index,
    documentID,
    fileID,
    filename,
    page,
  );
}

function $isQuestionDecoratorNode(node) {
  return node instanceof QuestionDecoratorNode;
}

// =============================================================================
// QuestionRowComponent - The React component rendered by QuestionDecoratorNode
// =============================================================================

function QuestionRowComponent({
  questionId,
  prompt,
  hint,
  answer,
  audio,
  isExpanded,
  isSelected,
  searchTerm,
  sharedHistory,
  onUpdate,
  onDelete,
  onToggleExpand,
  onToggleSelect,
  audioFiles,
  identityId,
  index,
  documentID,
  fileID,
  filename,
  page,
  nodeKey,
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [audioFilesToUpload, setAudioFilesToUpload] = React.useState([]);
  const { unit } = React.useContext(UnitContext);

  const audioUrls = audio || [];
  const hasAudio = audioUrls.length > 0;

  // Handle audio file uploads
  React.useEffect(() => {
    const asyncFunc = async () => {
      if (audioFilesToUpload.length === 0) return;

      const _fileOps = [...fileOperations];

      for (let i = 0; i < audioFilesToUpload.length; i++) {
        const item = audioFilesToUpload[i];
        try {
          const result = await uploadData({
            path: `public/${item.name}`,
            data: item.file,
            options: {
              onProgress: ({ transferredBytes, totalBytes }) => {
                if (totalBytes) {
                  const percentage = Math.round(
                    (transferredBytes / totalBytes) * 100,
                  );
                  _fileOps[i] = { ..._fileOps[i], progress: `${percentage}%` };
                  setFileOperations([..._fileOps]);
                }
              },
            },
          }).result;

          const newAudio = deduplicateUrls([...audioUrls, item.name]);

          // Update the question with new audio
          if (onUpdate) {
            await onUpdate(questionId, { audio: newAudio });
          }

          _fileOps[i] = { ..._fileOps[i], progress: "Complete" };
          setFileOperations([..._fileOps]);
        } catch (error) {
          console.error("Error uploading audio:", error);
          _fileOps[i] = { ..._fileOps[i], progress: "Error" };
          setFileOperations([..._fileOps]);
        }
      }

      setAudioFilesToUpload([]);
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
      name: `${unit.id}_${questionId}_${Date.now()}_${index}.ogg`,
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

  const confirmDeleteQuestion = async () => {
    // This function is a placeholder - deletion is now handled via the passed onDelete callback
    // which will trigger the confirmation dialog in the parent component
    if (onDelete) {
      await onDelete(questionId, prompt);
    }
  };

  const matchesSearch =
    searchTerm &&
    ((prompt && prompt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (answer && answer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hint && hint.toLowerCase().includes(searchTerm.toLowerCase())));

  const questionItemRef = React.useRef(null);
  const tabContext = useTabContext();
  const [isHighlighted, setIsHighlighted] = React.useState(false);

  // Register ref for scrolling
  React.useEffect(() => {
    if (tabContext?.registerItemRef && questionId) {
      tabContext.registerItemRef("question", questionId, questionItemRef);
    }
    return () => {
      if (tabContext?.unregisterItemRef && questionId) {
        tabContext.unregisterItemRef("question", questionId);
      }
    };
  }, [questionId, tabContext]);

  // Highlight when focused from search results
  React.useEffect(() => {
    if (
      tabContext?.focusItem?.type === "question" &&
      tabContext.focusItem.id === questionId
    ) {
      setIsHighlighted(true);
      // Auto-expand when focused
      if (onToggleExpand && !isExpanded) {
        onToggleExpand();
      }
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [tabContext?.focusItem, questionId, onToggleExpand, isExpanded]);

  // Adapt question data to QuestionItem interface
  const questionItem = {
    prompt: prompt || "",
    answer: answer || "",
    hint: hint,
    hasAudio: hasAudio,
    documentID: documentID,
    fileID: fileID,
    filename: filename,
    page: page,
  };

  const handleUpdateWrapper = async (itemIndex, field, newValue) => {
    if (onUpdate) {
      await onUpdate(questionId, { [field]: newValue });
    }
  };

  return (
    <Box ref={questionItemRef}>
      <QuestionCard
        item={questionItem}
        index={index}
        isSelected={isSelected}
        isExpanded={isExpanded}
        existsInQuestionBank={true}
        alreadyImported={true}
        searchTerm={searchTerm}
        onToggleSelect={() => onToggleSelect(index)}
        onToggleExpand={() => onToggleExpand(index)}
        onUpdate={handleUpdateWrapper}
      />
    </Box>
  );
}

// =============================================================================
// QuestionsPlugin - Manages question nodes and synchronization
// =============================================================================

function QuestionsPlugin({
  questionBank,
  searchTerm,
  expandedItems,
  selectedItems,
  onToggleExpand,
  onToggleSelect,
  sharedHistory,
  audioFiles,
  identityId,
  parentRef,
  setConfirmDialog,
  fullQuestionBank,
}) {
  const { bumpQuestionVersion } = React.useContext(DictionaryContext);
  const { softDelete } = useRecycleBin();
  const [editor] = useLexicalComposerContext();

  // Setup virtualizer for performance
  const questionEntries = React.useMemo(() => {
    return questionBank ? Object.entries(questionBank) : [];
  }, [questionBank]);

  const virtualizer = useVirtualizer({
    count: questionEntries.length,
    getScrollElement: () => parentRef?.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Update questions when questionBank changes
  React.useEffect(() => {
    if (!questionBank) return;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const entries = Object.entries(questionBank);

      // Render all questions - virtualization happens at render level
      entries.forEach(([id, question], index) => {
        const node = $createQuestionDecoratorNode(
          id,
          question.prompt,
          question.hint,
          question.answer,
          question.audio,
          expandedItems.has(id),
          selectedItems.has(id),
          searchTerm,
          sharedHistory,
          handleUpdateQuestion,
          handleDeleteQuestion,
          () => onToggleExpand(id),
          () => onToggleSelect(id),
          audioFiles,
          identityId,
          index,
          question.documentID,
          question.fileID,
          question.filename,
          question.page,
        );
        root.append(node);
      });
    });
  }, [
    questionBank,
    searchTerm,
    expandedItems,
    selectedItems,
    audioFiles,
    editor,
  ]);

  const handleUpdateQuestion = async (questionId, updates) => {
    try {
      const question = fullQuestionBank?.[questionId];
      const currentVersion = question?._version;
      const versionCtrl =
        currentVersion != null
          ? bumpQuestionVersion(questionId, currentVersion)
          : null;

      const client = getAmplifyClient();
      const { data, errors } = await client.models.Question.update({
        id: questionId,
        ...updates,
        ...(currentVersion != null && { _version: currentVersion }),
      });

      if (errors) {
        console.error("Error updating question:", errors);
        versionCtrl?.rollback();
      } else {
        versionCtrl?.confirm(data._version);
      }
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleDeleteQuestion = async (questionId, prompt = "") => {
    if (!setConfirmDialog) {
      console.error("setConfirmDialog not available");
      return;
    }

    // Show confirmation dialog before soft-deleting
    setConfirmDialog({
      open: true,
      message: `Move to Recycle Bin: "${prompt}"?`,
      severity: "warning",
      onConfirm: async () => {
        try {
          await softDelete("Question", questionId);
          console.log("Question soft deleted:", questionId);
          setConfirmDialog({
            open: false,
            message: "",
            onConfirm: null,
            severity: "warning",
          });
        } catch (error) {
          console.error("Error soft deleting question:", error);
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
// Main QuestionEditor2 Component
// =============================================================================

export function QuestionEditor2() {
  const t = useTranslations("components");
  const [open, setOpen] = React.useState(false);
  const [isHelpOpen, setHelpOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState(new Set());
  const [filteredQuestionBank, setFilteredQuestionBank] = React.useState(null);
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
  const [newPrompt, setNewPrompt] = React.useState("");
  const [newAnswer, setNewAnswer] = React.useState("");
  const [newHint, setNewHint] = React.useState("");
  const [newQuestionFormOpen, setNewQuestionFormOpen] = React.useState(false);
  const [fileOperations, setFileOperations] = React.useState([]);

  const { questionBank, showDeleted, setShowDeleted } =
    React.useContext(DictionaryContext);
  const { audioFiles, refreshAudioFiles, session } =
    React.useContext(FilesContext);
  const { identityId } = session || {};
  const { softDelete } = useRecycleBin();

  const parentRef = React.useRef(null);

  // Filter questions based on search
  React.useEffect(() => {
    if (!questionBank) {
      setFilteredQuestionBank(null);
      return;
    }

    if (!search) {
      setFilteredQuestionBank(questionBank);
      return;
    }

    const filtered = Object.fromEntries(
      Object.entries(questionBank).filter(([id, q]) => {
        const searchLower = search.toLowerCase();
        return (
          (q.prompt && q.prompt.toLowerCase().includes(searchLower)) ||
          (q.hint && q.hint.toLowerCase().includes(searchLower)) ||
          (q.answer && q.answer.toLowerCase().includes(searchLower))
        );
      }),
    );

    setFilteredQuestionBank(filtered);
  }, [search, questionBank]);

  const handleToggleExpand = (id) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (filteredQuestionBank) {
      setExpandedItems(new Set(Object.keys(filteredQuestionBank)));
    }
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const handleSelectAll = () => {
    if (filteredQuestionBank) {
      setSelectedItems(new Set(Object.keys(filteredQuestionBank)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    setConfirmDialog({
      open: true,
      message: `Move ${selectedItems.size} question(s) to Recycle Bin?`,
      severity: "warning",
      onConfirm: async () => {
        for (const id of selectedItems) {
          try {
            await softDelete("Question", id);
          } catch (error) {
            console.error("Error soft deleting question:", id, error);
          }
        }

        setSelectedItems(new Set());
        setContextMenu(null);
        setConfirmDialog({
          open: false,
          message: "",
          onConfirm: null,
          severity: "warning",
        });
      },
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const toggleNewQuestionFormOpen = () => {
    setNewQuestionFormOpen(!newQuestionFormOpen);
  };

  const handleCreateQuestion = async (event) => {
    event.preventDefault();

    if (!unit?.id) {
      console.error("No unit context available");
      return;
    }

    try {
      const client = getAmplifyClient();
      const { data, errors } = await client.models.Question.create({
        prompt: newPrompt,
        hint: newHint,
        answer: newAnswer,
        unitID: unit.id,
        audio: [],
      });

      if (errors) {
        console.error("Error creating question:", errors);
      } else {
        console.log("Question created:", data);
      }

      setNewPrompt("");
      setNewHint("");
      setNewAnswer("");
      toggleNewQuestionFormOpen();
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((search) => {
      setSearch(search);
    }, 500),
    [],
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const initialConfig = {
    namespace: "QuestionEditor2",
    theme: {},
    nodes: [QuestionDecoratorNode],
    onError: (error) => console.error("Lexical error:", error),
  };

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
          Move to Recycle Bin
        </MenuItem>
      </Menu>

      {/* Toolbar */}
      <Box
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
        <Box sx={{ display: "flex", gap: 0, alignItems: "center" }}>
          <Tooltip title="Select All">
            <Checkbox
              size="small"
              checked={
                filteredQuestionBank &&
                Object.keys(filteredQuestionBank).length > 0 &&
                selectedItems.size === Object.keys(filteredQuestionBank).length
              }
              indeterminate={
                selectedItems.size > 0 &&
                selectedItems.size <
                  Object.keys(filteredQuestionBank || {}).length
              }
              onChange={(e) => {
                if (e.target.checked) {
                  handleSelectAll();
                } else {
                  handleDeselectAll();
                }
              }}
              disabled={
                !filteredQuestionBank ||
                Object.keys(filteredQuestionBank).length === 0
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
                !filteredQuestionBank ||
                Object.keys(filteredQuestionBank).length === 0
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
          placeholder="Search questions..."
          label="Search"
        />

        <Tooltip title="New Question">
          <IconButton
            onClick={toggleNewQuestionFormOpen}
            color="primary"
            size="small"
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
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        <ShowDeletedToggle
          showDeleted={showDeleted}
          setShowDeleted={setShowDeleted}
        />
      </Box>

      {/* Main Editor */}
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
          <QuestionsPlugin
            questionBank={filteredQuestionBank}
            searchTerm={search}
            expandedItems={expandedItems}
            selectedItems={selectedItems}
            onToggleExpand={handleToggleExpand}
            onToggleSelect={handleToggleSelect}
            sharedHistory={sharedHistoryState.current}
            audioFiles={audioFiles}
            identityId={identityId}
            parentRef={parentRef}
            setConfirmDialog={setConfirmDialog}
            fullQuestionBank={questionBank}
          />
        </LexicalComposer>
      </Box>

      {/* New Question Dialog */}
      <Dialog
        open={newQuestionFormOpen}
        onClose={toggleNewQuestionFormOpen}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("questionEditor.dialogTitle")}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleCreateQuestion}>
            <TextField
              value={newPrompt}
              required
              onChange={(e) => setNewPrompt(e.target.value)}
              fullWidth
              margin="normal"
              label="Prompt"
              variant="outlined"
            />
            <TextField
              value={newHint}
              required
              onChange={(e) => setNewHint(e.target.value)}
              fullWidth
              margin="normal"
              label="Hint"
              variant="outlined"
            />
            <TextField
              value={newAnswer}
              required
              onChange={(e) => setNewAnswer(e.target.value)}
              fullWidth
              margin="normal"
              label="Answer"
              variant="outlined"
            />
            <Button variant="contained" type="submit" sx={{ mt: 2 }}>
              {t("questionEditor.save")}
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
                  {t("chatSidebar.confirm")}
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
                  {t("chatSidebar.cancel")}
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
