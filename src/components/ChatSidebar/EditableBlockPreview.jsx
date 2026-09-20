/**
 * EditableBlockPreview - Editable preview of an AI-generated editor block.
 *
 * Renders the block from a tool's `insert_editor_block` output inside a live,
 * editable MiniEditor, wrapped in a framed "dialogue" (header + copy/regenerate
 * actions, insert/reject footer). Unlike BlockInsertPreview (read-only), the
 * learner-facing editor can tweak the block before it is inserted; the edited
 * Lexical state is handed back through `onInsert` so the parent can transfer the
 * nodes into the lesson editor.
 *
 * @module ChatSidebar/EditableBlockPreview
 */

import React from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import QuizIcon from "@mui/icons-material/Quiz";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArticleIcon from "@mui/icons-material/Article";
import MiniEditor from "../MiniEditor/MiniEditor";

/** Empty paragraph so the editor keeps an editable line after the block. */
const EMPTY_PARAGRAPH = {
  children: [],
  direction: null,
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
};

/** Build the serialized block node matching each custom node's importJSON shape. */
function blockNodeFromToolOutput(blockType, blockData) {
  switch (blockType) {
    case "quiz":
      return {
        type: "quiz",
        version: 1,
        data: Array.isArray(blockData) ? blockData : blockData?.data || [],
      };
    case "answer":
      return {
        type: "answer",
        version: 1,
        wordIDs: blockData?.wordIDs || [],
        requestDefinition: blockData?.requestDefinition ?? "definition",
        allowedInput: blockData?.allowedInput ?? "text",
        promptMethod: blockData?.promptMethod ?? "word",
      };
    case "meaning-association":
      return {
        type: "meaning-association",
        version: 1,
        wordIDs: blockData?.wordIDs || [],
        enabledModes: blockData?.enabledModes || ["learn", "easy", "hard"],
      };
    case "custom-answer":
      return {
        type: "custom-answer",
        version: 1,
        wordIDs: blockData?.questionIDs || blockData?.wordIDs || [],
        promptMethod: blockData?.promptMethod ?? "word",
        allowedInput: blockData?.allowedInput ?? "text",
        format: blockData?.format ?? "default",
      };
    default:
      return null;
  }
}

/** Wrap a block (or reuse a full editor state) into a serialized root state. */
function buildBlockEditorState(blockType, blockData) {
  // Content blocks already carry a full serialized editor state.
  if (blockType === "content" && blockData?.root) {
    return blockData;
  }

  const createPromptNode = (text) => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  });

  const children =
    blockType === "quiz" && Array.isArray(blockData)
      ? [
          ...[
            ...new Set(blockData.map((item) => item.question).filter(Boolean)),
          ]
            .map((question) => [
              createPromptNode(question),
              blockNodeFromToolOutput(
                blockType,
                blockData.filter((item) => item.question === question),
              ),
            ])
            .flat(),
          EMPTY_PARAGRAPH,
        ]
      : (() => {
          const blockNode = blockNodeFromToolOutput(blockType, blockData);
          return blockNode ? [blockNode, EMPTY_PARAGRAPH] : [EMPTY_PARAGRAPH];
        })();

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

const BLOCK_ICONS = {
  quiz: QuizIcon,
  answer: EditIcon,
  "meaning-association": LinkIcon,
  "custom-answer": HelpOutlineIcon,
  content: ArticleIcon,
};

const BLOCK_TITLE_KEYS = {
  quiz: "editableBlockPreview.quiz",
  answer: "editableBlockPreview.answer",
  "meaning-association": "editableBlockPreview.meaningAssociation",
  "custom-answer": "editableBlockPreview.customAnswer",
  content: "editableBlockPreview.content",
};

/**
 * @param {object} props
 * @param {object} props.toolOutput - Parsed `insert_editor_block` tool output.
 * @param {(editorState: object, blockType: string) => void} props.onInsert
 * @param {() => void} [props.onReject]
 * @param {() => void} [props.onRegenerate]
 */
export default function EditableBlockPreview({
  toolOutput,
  onInsert,
  onReject,
  onRegenerate,
}) {
  const t = useTranslations("components");
  const [status, setStatus] = React.useState("pending");
  const [copied, setCopied] = React.useState(false);
  const editedRef = React.useRef(null);

  const valid =
    toolOutput &&
    toolOutput.success &&
    toolOutput.action === "insert_editor_block";

  const blockType = toolOutput?.blockType;

  const initialState = React.useMemo(
    () =>
      valid ? buildBlockEditorState(blockType, toolOutput.blockData) : null,
    [valid, blockType, toolOutput?.blockData],
  );

  const initialContent = React.useMemo(
    () => (initialState ? JSON.stringify(initialState) : null),
    [initialState],
  );

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(editedRef.current || initialState),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable in some sandboxes */
    }
  }, [initialState]);

  const handleInsert = React.useCallback(() => {
    onInsert?.(editedRef.current || initialState, blockType);
    setStatus("inserted");
  }, [onInsert, initialState, blockType]);

  const handleReject = React.useCallback(() => {
    onReject?.();
    setStatus("rejected");
  }, [onReject]);

  if (!valid) return null;

  const Icon = BLOCK_ICONS[blockType] || ArticleIcon;
  const title = t(BLOCK_TITLE_KEYS[blockType] || "editableBlockPreview.block");

  return (
    <Paper
      elevation={2}
      sx={{
        border: 1,
        borderColor: "primary.main",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.light",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={blockType}
            size="small"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip
            title={
              copied
                ? t("editableBlockPreview.copied")
                : t("editableBlockPreview.copy")
            }
          >
            <IconButton
              size="small"
              onClick={handleCopy}
              color={copied ? "success" : "default"}
            >
              {copied ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {onRegenerate && (
            <Tooltip title={t("editableBlockPreview.regenerate")}>
              <IconButton size="small" onClick={onRegenerate}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Live editable block */}
      <Box sx={{ bgcolor: "background.paper", p: 1 }}>
        <MiniEditor
          mode="editable"
          content={initialContent}
          namespace={`editable-block-${blockType}`}
          onChange={(json) => {
            editedRef.current = json;
          }}
        />
      </Box>

      {/* Actions */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "action.hover",
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {status === "pending" ? (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ flex: 1 }}
            >
              {t("editableBlockPreview.editHint")}
            </Typography>
            <Button size="small" color="inherit" onClick={handleReject}>
              {t("editableBlockPreview.reject")}
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<InsertDriveFileIcon />}
              onClick={handleInsert}
            >
              {t("editableBlockPreview.insert")}
            </Button>
          </>
        ) : (
          <>
            {status === "inserted" ? (
              <Alert severity="success" sx={{ flex: 1, py: 0 }}>
                {t("editableBlockPreview.inserted")}
              </Alert>
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1 }}
              >
                {t("editableBlockPreview.rejected")}
              </Typography>
            )}
            <Button size="small" onClick={() => setStatus("pending")}>
              {t("editableBlockPreview.undo")}
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
}
