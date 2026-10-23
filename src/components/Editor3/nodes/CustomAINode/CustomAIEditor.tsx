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
import { lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  createFilterOptions,
  Skeleton,
} from "@mui/material";

// Lazy-load DataGrid only when CustomAIEditor is rendered (authoring only)
const DataGrid = lazy(() =>
  import("@mui/x-data-grid").then((m) => ({ default: m.DataGrid })),
);
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { ExerciseBlockCard } from "../../components/ExerciseBlockCard";

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

const INPUT_MODE_OPTIONS: { value: CustomAIInputMode; labelKey: string }[] = [
  { value: "text", labelKey: "customAIEditor.inputModeText" },
  { value: "audio", labelKey: "customAIEditor.inputModeAudio" },
  { value: "image", labelKey: "customAIEditor.inputModeImage" },
  { value: "drawing", labelKey: "customAIEditor.inputModeDrawing" },
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
  const questionBankMap = React.useMemo(
    () => (questionBank || {}) as Record<string, any>,
    [questionBank],
  );

  // Build rows from question IDs
  const rows = React.useMemo(() => {
    if (!questionIDs)
      return [] as { id: string; prompt: string; answer: string }[];
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
        (row): row is { id: string; prompt: string; answer: string } =>
          row != null,
      );
  }, [questionIDs, questionBankMap]);

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

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "prompt",
        headerName: t("customAIEditor.questionPromptHeader"),
        flex: 2,
        minWidth: 200,
      },
      {
        field: "answer",
        headerName: t("customAIEditor.expectedAnswerHeader"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "actions",
        headerName: "",
        width: 60,
        sortable: false,
        renderCell: (params: { row: { id: string } }) => (
          <IconButton
            size="small"
            onClick={() => removeQuestion(params.row.id)}
            aria-label={t("customAIEditor.removeQuestion")}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [t, removeQuestion],
  );

  // Available questions for the autocomplete
  const availableQuestions = React.useMemo(() => {
    const usedIds = new Set(questionIDs || []);
    return Object.values(questionBankMap)
      .filter((q: any) => q && !usedIds.has(q.id))
      .map((q: any) => ({
        id: q.id,
        prompt:
          q.prompt ||
          q.question ||
          t("customAIEditor.questionFallback", { id: q.id }),
      }));
  }, [questionBankMap, questionIDs, t]);

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
    <ExerciseBlockCard
      // eslint-disable-next-line i18next/no-literal-string -- block type identifier
      blockType="custom-ai"
      selected={isSelected}
      sx={{ maxWidth: "72rem" }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t("customAIEditor.title")}
        </Typography>
        <Chip
          icon={<SecurityIcon />}
          label={t("customAIEditor.secureGrading")}
          size="small"
          color="success"
          variant="outlined"
        />
      </Box>

      <Typography variant="body1" component="p">
        {t("customAIEditor.description")}
      </Typography>

      {/* Allowed Input Modes */}
      <Box sx={{ mt: 1.5, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("customAIEditor.studentInputModes")}
        </Typography>
        <ToggleButtonGroup
          value={localAllowedInput}
          onChange={handleAllowedInputChange}
          aria-label={t("customAIEditor.allowedInputModes")}
          size="small"
        >
          {INPUT_MODE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Grading Criteria */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("customAIEditor.gradingCriteria")}
        </Typography>
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          value={localCriteria}
          onChange={handleCriteriaChange}
          onBlur={saveCriteria}
          placeholder={t("customAIEditor.criteriaPlaceholder")}
          variant="outlined"
          size="small"
          helperText={t("customAIEditor.criteriaHelperText")}
        />
      </Box>

      {/* Question Selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("customAIEditor.questionsCount", {
            count: questionIDs?.length || 0,
          })}
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
              placeholder={t("customAIEditor.searchQuestions")}
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
        <Suspense
          fallback={
            <Skeleton variant="rectangular" width="100%" height={300} />
          }
        >
          <Box
            sx={{ height: Math.min(300, 52 + rows.length * 52), width: "100%" }}
          >
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
        </Suspense>
      )}

      {/* Security Notice */}
      <Box sx={{ mt: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <SecurityIcon
            fontSize="inherit"
            sx={{ verticalAlign: "middle", mr: 0.5 }}
          />
          {t("customAIEditor.securityNotice")}
        </Typography>
      </Box>
    </ExerciseBlockCard>
  );
});
