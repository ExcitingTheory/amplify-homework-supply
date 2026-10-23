import * as React from "react";
import { lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Skeleton, Box } from "@mui/material";

// Lazy-load DataGrid only when AnswerEditor is rendered (authoring only)
const DataGrid = lazy(() =>
  import("@mui/x-data-grid").then((m) => ({ default: m.DataGrid })),
);
import { roundedCheckboxIcons } from "../../RoundedCheckboxIcon";

import {
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ListItemText,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";

import TextareaAutosize from "@mui/material/TextareaAutosize";
import Button from "@mui/material/Button";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";

import DictionaryContext from "../../../context/dictionaryContext";
import { ExerciseBlockCard } from "./ExerciseBlockCard";
import {
  compactEditorAutocompleteSx,
  editorDataGridSx,
  getEditorDataGridRowClassName,
  isEditorControlTarget,
} from "./editorControlStyles";

import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { getAmplifyClient } from "../../../utils/amplifyClient";
// Type import removed - not needed in runtime JS
import UnitContext from "../../../context/unitContext";
import { $isAnswerNode } from "../plugins/AnswerPlugin";

import {
  AnswerConfigurationSelector,
  MeaningAssociationPromptSelector,
  isAnswerConfigValid,
} from "./PromptMethodSelector";

const filter = createFilterOptions();

const EMPTY_ROW_CELL_SX = {
  width: "100%",
  textAlign: "center",
  fontStyle: "italic",
};
const AUTO_ROW_HEIGHT = "auto";
const INCLUDE_SELECTION_TYPE = "include";
const ANSWER_BLOCK_TYPE = "answer";
const PROMPT_FOR_WORD = "word";
const PROMPT_FOR_DEFINITION = "definition";

const getColumns = (t) => [
  {
    field: "phrase",
    headerName: t("meaningAssociationEditor.columnHeaders.phrase"),
    flex: 1,
    minWidth: 100,
    colSpan: (params) => (params.id === "__empty__" ? 4 : 1),
    renderCell: (params) =>
      params.id === "__empty__" ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={EMPTY_ROW_CELL_SX}
        >
          {params.value}
        </Typography>
      ) : (
        params.value
      ),
  },
  {
    field: "pronunciation",
    headerName: t("meaningAssociationEditor.columnHeaders.pronunciation"),
    flex: 1,
    minWidth: 100,
  },
  {
    field: "definition",
    headerName: t("meaningAssociationEditor.columnHeaders.definition"),
    flex: 1,
    minWidth: 200,
  },
];

export function ActionsMenu({ ids, removeWordIDs }) {
  const t = useTranslations("editor.blocks");
  const removeLabel = t("answerEditor.removeWords", { count: ids.length });

  return (
    <Button
      color="error"
      variant="outlined"
      size="small"
      startIcon={<RemoveCircleOutlineIcon />}
      disabled={ids.length === 0}
      onClick={() => removeWordIDs(ids)}
      sx={{ whiteSpace: "nowrap" }}
    >
      {removeLabel}
    </Button>
  );
}

const AnswerEditor = React.memo(function AnswerEditor({
  className,
  format,
  nodeKey,
  // setWordIDs,
  requestDefinition,
  wordIDs,
  allowedInput,
  promptMethod,
}) {
  const t = useTranslations("editor.blocks");
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState("");
  const [open, toggleOpen] = React.useState(false);
  // const [rows, setRows] = React.useState([]);
  const [gridSelection, setGridSelection] = React.useState([]);
  const [dialogValue, setDialogValue] = React.useState({
    phrase: "",
    definition: "",
    pronunciation: "",
  });

  const [title, setTitle] = React.useState(t("answerEditor.title"));

  React.useEffect(() => {
    setTitle(
      requestDefinition
        ? t("answerEditor.titleByDefinition")
        : t("answerEditor.titleByWord"),
    );
  }, [requestDefinition, t]);

  const { wordMapId } = React.useContext(DictionaryContext);

  const { unit } = React.useContext(UnitContext);

  const rows = [];

  if (wordIDs) {
    wordIDs.forEach((id) => {
      const word = wordMapId[id];
      if (word) {
        rows.push({
          id: word.id,
          phrase: word.phrase,
          pronunciation: word.pronunciation,
          definition: word.definition,
        });
      }
    });
  }

  const [editor] = useLexicalComposerContext();

  const answerRef = React.useRef(null);

  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const _dictionary = Object.values(wordMapId);

  const onDelete = React.useCallback(
    async (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isAnswerNode(node)) {
          node.remove();

          // Remove relationship to word
          const client = getAmplifyClient();
          const _operations = [];
          wordIDs.forEach((id) => {
            _operations.push(client.models.UnitWord.delete({ id }));
          });
          await Promise.allSettled(_operations);
        }
      }
      return false;
    },
    [isSelected, nodeKey, wordIDs],
  );

  const onEnter = React.useCallback(
    (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        // Focus on the autocomplete input when Enter is pressed
        const autocompleteInput = document.querySelector("#add-new-word input");
        if (autocompleteInput) {
          autocompleteInput.focus();
        }
        return true;
      }
      return false;
    },
    [isSelected],
  );

  const onEscape = React.useCallback(
    (payload) => {
      if (isSelected) {
        const event = payload;
        event.preventDefault();
        // Keep the block open until at least one input and one output
        // method are selected — otherwise the question isn't gradable.
        if (!isAnswerConfigValid(allowedInput, promptMethod)) {
          return true;
        }
        // Clear selection when Escape is pressed
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, clearSelection, allowedInput, promptMethod],
  );

  const handleClose = () => {
    setDialogValue({
      phrase: "",
      pronunciation: "",
      definition: "",
    });
    toggleOpen(false);
  };

  const addWordID = (id) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnswerNode(node)) {
        node.appendId(id);
        // Add relationship to word
        const client = getAmplifyClient();
        const { data: word } = await client.models.Word.get({ id });
        if (word) {
          await client.models.UnitWord.create({
            unitID: unit.id,
            wordID: id,
          });
        }
      }
    });
  };

  const setRequestDefinition = (payload) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnswerNode(node)) {
        node.setRequestDefinition(payload);
      }
    });
  };

  const setAllowedInput = (payload) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnswerNode(node)) {
        console.log("setAllowedInput", payload);
        node.setAllowedInput(payload);
      }
    });
  };

  const setPromptMethod = (payload) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnswerNode(node)) {
        console.log("setPromptMethod", payload);
        node.setPromptMethod(payload);
      }
    });
  };

  const removeWordIDs = (ids) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnswerNode(node)) {
        node.removeIntersection(ids);
        // Remove relationship to word
        const client = getAmplifyClient();
        const _operations = [];
        ids.forEach((id) => {
          _operations.push(client.models.UnitWord.delete({ id }));
        });
        await Promise.allSettled(_operations);
      }
    });
  };

  const removeRowLabel = (row) =>
    row.phrase
      ? t("answerEditor.removeNamedWord", { phrase: row.phrase })
      : t("answerEditor.removeWord");

  const gridColumns = [
    ...getColumns(t),
    {
      field: "actions",
      headerName: t("answerEditor.actionsColumn"),
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      renderCell: (params) => {
        if (params.row.id === "__empty__") return null;
        return (
          <Tooltip title={removeRowLabel(params.row)}>
            <IconButton
              size="small"
              aria-label={removeRowLabel(params.row)}
              sx={{ color: "common.black" }}
              onClick={(event) => {
                event.stopPropagation();
                removeWordIDs([params.row.id]);
                setGridSelection((current) =>
                  current.filter((id) => id !== params.row.id),
                );
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  const gridRows =
    rows.length > 0
      ? rows
      : [
          {
            id: "__empty__",
            phrase: t("meaningAssociationEditor.addWordLabel"),
            pronunciation: "",
            definition: "",
          },
        ];

  const handleSubmit = (event) => {
    event.preventDefault();
    setValue({
      phrase: dialogValue.phrase,
      // pronunciation: '',
      // definition: '',
    });
    handleClose();
  };

  React.useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (answerRef.current && answerRef.current.contains(event.target)) {
            if (isEditorControlTarget(event.target)) {
              return false;
            }
            event.preventDefault();
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
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    onEscape,
    setSelected,
  ]);

  return (
    <div ref={answerRef} style={{ cursor: "pointer" }}>
      <ExerciseBlockCard
        blockType={ANSWER_BLOCK_TYPE}
        selected={isSelected}
        sx={{ maxWidth: "72rem" }}
      >
        <Typography variant="h5">{title}</Typography>

        <Typography variant="p">{t("answerEditor.instructions")}</Typography>

        {/**
         * The short answer editor is a simple text input that allows the user to add words to the exercise.
         */}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            mt: 1,
          }}
        >
          <Autocomplete
            value={value}
            inputValue={inputValue}
            onInputChange={(_, nextInputValue) => setInputValue(nextInputValue)}
            onChange={(event, newValue) => {
              setInputValue("");
              if (typeof newValue === "string") {
                // timeout to avoid instant validation of the dialog's form.
                setTimeout(() => {
                  toggleOpen(true);
                  setDialogValue({
                    phrase: newValue,
                    pronunciation: "",
                    definition: "",
                  });
                });
              } else if (newValue && newValue.inputValue) {
                toggleOpen(true);
                setDialogValue({
                  phrase: newValue.inputValue,
                  pronunciation: "",
                  definition: "",
                });
              } else {
                console.log("Autocomplete.newValue", newValue);
                // Append wordID to wordIDs
                const newWordID = newValue?.id;
                if (newWordID) {
                  addWordID(newWordID);
                  setValue(null);
                  setDialogValue({
                    phrase: "",
                    pronunciation: "",
                    definition: "",
                  });
                }
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              if (params.inputValue !== "") {
                filtered.push({
                  inputValue: params.inputValue,
                  phrase: t("answerEditor.addNewOption", {
                    value: params.inputValue,
                  }),
                });
              }

              return filtered;
            }}
            sx={compactEditorAutocompleteSx}
            id="add-new-word"
            options={_dictionary}
            getOptionLabel={(option) => {
              // e.g value selected with enter, right from the input
              if (typeof option === "string") {
                return option;
              }
              if (option.inputValue) {
                return option.inputValue;
              }
              return option.phrase;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            renderOption={(props, option, { index }) => {
              let phrase = option.phrase;
              if (option.phrase && option.pronunciation) {
                phrase = `${option.phrase} (${option.pronunciation})`;
              }

              const { key, ...otherProps } = props;
              // Create a unique key using option ID if available, otherwise use phrase + index
              const uniqueKey = option.id || `${option.phrase}-${index}`;
              return (
                <li key={uniqueKey} {...otherProps}>
                  {phrase}
                </li>
              );
            }}
            // sx={{ width: 300 }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t("meaningAssociationEditor.addWordLabel")}
              />
            )}
          />
        </Box>

        <Dialog open={open} onClose={handleClose}>
          <form onSubmit={handleSubmit}>
            <DialogTitle>{t("answerEditor.dialogTitle")}</DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "fit-content",
              }}
            >
              <DialogContentText>
                {t("answerEditor.addWordToDict")}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                value={dialogValue.phrase}
                onChange={(event) =>
                  setDialogValue({
                    ...dialogValue,
                    phrase: event.target.value,
                  })
                }
                label={t("meaningAssociationEditor.phraseLabel")}
                type="text"
                variant="standard"
              />
              <TextField
                margin="dense"
                id="pronunciation"
                value={dialogValue.pronunciation}
                onChange={(event) =>
                  setDialogValue({
                    ...dialogValue,
                    pronunciation: event.target.value,
                  })
                }
                label={t("meaningAssociationEditor.pronunciationLabel")}
                type="text"
                variant="standard"
              />
              <TextareaAutosize
                minRows={3}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                }}
                id="definition"
                value={dialogValue.definition}
                onChange={(event) =>
                  setDialogValue({
                    ...dialogValue,
                    definition: event.target.value,
                  })
                }
                aria-label={t("meaningAssociationEditor.definitionAriaLabel")}
                placeholder={t(
                  "meaningAssociationEditor.definitionPlaceholder",
                )}
                type="text"
                variant="standard"
              />
            </DialogContent>
            <DialogActions>
              <Button
                // variant='contained'
                // color='error'
                onClick={handleClose}
              >
                {t("answerEditor.cancel")}
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {t("answerEditor.save")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Suspense
          fallback={
            <Skeleton variant="rectangular" width="100%" height={300} />
          }
        >
          <DataGrid
            sx={editorDataGridSx}
            rows={gridRows}
            columns={gridColumns}
            getRowHeight={(params) =>
              params.id === "__empty__" ? AUTO_ROW_HEIGHT : null
            }
            getRowClassName={getEditorDataGridRowClassName}
            hideFooter
            checkboxSelection
            isRowSelectable={(params) => params.id !== "__empty__"}
            disableRowSelectionExcludeModel
            slotProps={{ baseCheckbox: roundedCheckboxIcons }}
            rowSelectionModel={{
              type: INCLUDE_SELECTION_TYPE,
              ids: new Set(gridSelection),
            }}
            onRowSelectionModelChange={(model) => {
              const ids =
                model.type === "exclude"
                  ? rows.map((r) => r.id).filter((id) => !model.ids.has(id))
                  : [...model.ids];
              setGridSelection(ids);
            }}
          />
        </Suspense>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              order: { xs: 2, sm: 2 },
            }}
          >
            <MeaningAssociationPromptSelector
              promptFor={
                requestDefinition ? PROMPT_FOR_WORD : PROMPT_FOR_DEFINITION
              }
              setPromptFor={(promptFor) =>
                setRequestDefinition(promptFor === "word")
              }
            />
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              order: { xs: 3, sm: 3 },
              ml: { xs: 0, sm: "auto" },
            }}
          >
            <AnswerConfigurationSelector
              promptMethod={promptMethod}
              setPromptMethod={setPromptMethod}
              allowedInput={allowedInput}
              setAllowedInput={setAllowedInput}
            />
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              order: { xs: 1, sm: 1 },
            }}
          >
            <ActionsMenu
              removeWordIDs={(ids) => {
                removeWordIDs(ids);
                setGridSelection([]);
              }}
              ids={gridSelection}
            />
          </Box>
        </Box>
      </ExerciseBlockCard>
    </div>
  );
});

export default AnswerEditor;
