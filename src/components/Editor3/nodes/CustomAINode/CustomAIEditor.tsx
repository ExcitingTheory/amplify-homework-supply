/**
 * @fileoverview CustomAIEditor - Instructor-facing editor for AI-graded exercises.
 *
 * Allows instructors to:
 * - Select questions from the question bank
 * - Choose allowed input modes (text/audio/image/drawing)
 * - Write custom grading criteria
 *
 * The grading system prompt and output interface are immutable.
 *
 * @module CustomAINode/CustomAIEditor
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SecurityIcon from "@mui/icons-material/Security";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import DictionaryContext from "../../../../context/dictionaryContext";
import { $isCustomAINode } from "../../plugins/CustomAIPlugin";
import type { CustomAIInputMode } from "../../plugins/CustomAIPlugin";

const filter = createFilterOptions<{ id: string; prompt: string }>();

interface CustomAIEditorProps {
  className: { base: string; focus: string };
  format: string;
  nodeKey: string;
  ids: string[];
  inputMode: CustomAIInputMode;
  criteria: string;
  allowedInput: CustomAIInputMode[];
}

const INPUT_MODE_OPTIONS: { value: CustomAIInputMode; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Image" },
  { value: "drawing", label: "Drawing" },
];

export default React.memo(function CustomAIEditor({
  className,
  format,
  nodeKey,
  ids: questionIDs,
  inputMode,
  criteria,
  allowedInput,
}: CustomAIEditorProps) {
  const t = useTranslations("editor.blocks");
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const [localCriteria, setLocalCriteria] = React.useState(criteria || "");
  const [localAllowedInput, setLocalAllowedInput] = React.useState<
    CustomAIInputMode[]
  >(allowedInput?.length > 0 ? allowedInput : ["text"]);

  const { questionBank } = React.useContext(DictionaryContext);
  const questionBankMap = (questionBank || {}) as Record<string, any>;

  // Build rows from question IDs
  const rows = React.useMemo(() => {
    if (!questionIDs) return [] as { id: string; prompt: string; answer: string }[];
    return questionIDs
      .map((id) => {
        const q = questionBankMap[id];
        if (!q) return null;
        return {
          id: q.id,
          prompt: q.prompt || q.question || "",
          answer: q.answer || "",
        };
      })
      .filter(
        (row): row is { id: string; prompt: string; answer: string } => row != null,
      );
  }, [questionIDs, questionBankMap]);

  const columns = React.useMemo(
    () => [
      { field: "prompt", headerName: "Question Prompt", flex: 2, minWidth: 200 },
      { field: "answer", headerName: "Expected Answer", flex: 1, minWidth: 150 },
      {
        field: "actions",
        headerName: "",
        width: 60,
        sortable: false,
        renderCell: (params: { row: { id: string } }) => (
          <IconButton
            size="small"
            onClick={() => removeQuestion(params.row.id)}
            aria-label="Remove question"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [],
  );

  // Available questions for the autocomplete
  const availableQuestions = React.useMemo(() => {
    const usedIds = new Set(questionIDs || []);
    return Object.values(questionBankMap)
      .filter((q: any) => q && !usedIds.has(q.id))
      .map((q: any) => ({
        id: q.id,
        prompt: q.prompt || q.question || `Question ${q.id}`,
      }));
  }, [questionBankMap, questionIDs]);

  const addQuestion = React.useCallback(
    (questionId: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomAINode(node)) {
          node.appendId(questionId);
        }
      });
    },
    [editor, nodeKey],
  );

  const removeQuestion = React.useCallback(
    (questionId: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomAINode(node)) {
          node.removeId(questionId);
        }
      });
    },
    [editor, nodeKey],
  );

  const handleCriteriaChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalCriteria(value);
    },
    [],
  );

  const saveCriteria = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCustomAINode(node)) {
        node.setCriteria(localCriteria);
      }
    });
  }, [editor, nodeKey, localCriteria]);

  const handleAllowedInputChange = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newModes: CustomAIInputMode[]) => {
      if (newModes.length === 0) return; // Must have at least one
      setLocalAllowedInput(newModes);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomAINode(node)) {
          node.setAllowedInput(newModes);
          node.setInputMode(newModes[0]);
        }
      });
    },
    [editor, nodeKey],
  );

  // Handle delete key
  const onDelete = React.useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isCustomAINode(node)) {
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  React.useEffect(() => {
    return mergeRegister(
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
    );
  }, [editor, onDelete]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        my: 2,
        border: isSelected ? "2px solid" : "1px solid",
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <SmartToyIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AI-Graded Exercise
        </Typography>
        <Chip
          icon={<SecurityIcon />}
          label="Secure Grading"
          size="small"
          color="success"
          variant="outlined"
        />
      </Box>

      {/* Allowed Input Modes */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Student Input Modes
        </Typography>
        <ToggleButtonGroup
          value={localAllowedInput}
          onChange={handleAllowedInputChange}
          aria-label="Allowed input modes"
          size="small"
        >
          {INPUT_MODE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Grading Criteria */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Grading Criteria (AI Instructions)
        </Typography>
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          value={localCriteria}
          onChange={handleCriteriaChange}
          onBlur={saveCriteria}
          placeholder="Describe how the AI should grade student responses. E.g., 'Grade based on understanding of photosynthesis. Award full marks for mentioning light-dependent reactions, Calvin cycle, and role of chlorophyll.'"
          variant="outlined"
          size="small"
          helperText="The AI will use these criteria to evaluate student submissions. Students cannot see this."
        />
      </Box>

      {/* Question Selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Questions ({questionIDs?.length || 0})
        </Typography>
        <Autocomplete
          options={availableQuestions}
          getOptionLabel={(option) => option.prompt}
          onChange={(_, value) => {
            if (value) addQuestion(value.id);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search and add questions from the question bank"
              size="small"
            />
          )}
          filterOptions={(options, params) => filter(options, params)}
          value={null}
          blurOnSelect
          size="small"
        />
      </Box>

      {/* Questions DataGrid */}
      {rows.length > 0 && (
        <Box sx={{ height: Math.min(300, 52 + rows.length * 52), width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            density="compact"
            disableRowSelectionOnClick
            hideFooter={rows.length <= 5}
            pageSizeOptions={[5]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
          />
        </Box>
      )}

      {/* Security Notice */}
      <Box sx={{ mt: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <SecurityIcon
            fontSize="inherit"
            sx={{ verticalAlign: "middle", mr: 0.5 }}
          />
          Security: The AI grading prompt is hardened against prompt injection,
          character-breaking, and data leakage. Student input is sanitized.
          Grading criteria are hidden from students. Output is validated and
          PII-filtered.
        </Typography>
      </Box>
    </Paper>
  );
});
