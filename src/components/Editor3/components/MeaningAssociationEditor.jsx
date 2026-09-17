import * as React from "react";
import { lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Skeleton, Box } from "@mui/material";

// Lazy-load DataGrid only when MeaningAssociationEditor is rendered (authoring only)
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
  Tooltip,
  Typography,
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
import { $isMeaningAssociationNode } from "../plugins/MeaningAssociationPlugin";
import {
  MeaningAssociationModeSelector,
  MeaningAssociationPromptSelector,
} from "./PromptMethodSelector";

import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import UnitContext from "../../../context/unitContext";

import { getAmplifyClient } from "../../../utils/amplifyClient";

const filter = createFilterOptions();

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
          fontStyle="italic"
          sx={{ width: "100%", textAlign: "center" }}
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

export function RemoveWordsButton({ ids, removeWordIDs }) {
  const removeLabel = `Remove ${ids.length} ${ids.length === 1 ? "word" : "words"}`;

  return (
    <Button
      color="error"
      variant="outlined"
      size="small"
      startIcon={<RemoveCircleOutlineIcon />}
      disabled={ids.length === 0}
      onClick={() => removeWordIDs(ids)}
      sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
    >
      {removeLabel}
    </Button>
  );
}

export default function MeaningAssociationEditor({
  className,
  format,
  nodeKey,
  // setWordIDs,
  wordIDs,
  enabledModes = ["learn", "easy", "hard"],
  promptFor = "definition",
  showAudio = true,
  showPronunciation = true,
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

  const meaningAssociationRef = React.useRef(null);

  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const _dictionary = Object.values(wordMapId);

  const onDelete = React.useCallback(
    async (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isMeaningAssociationNode(node)) {
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
      if ($isMeaningAssociationNode(node)) {
        node.appendId(id);
        // Add relationship to word
        if (unit) {
          const client = getAmplifyClient();
          const { data: word } = await client.models.Word.get({ id });
          if (word) {
            await client.models.UnitWord.create({
              unitID: unit.id,
              wordID: word.id,
            });
          }
        }
      }
    });
  };

  const removeWordIDs = (ids) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isMeaningAssociationNode(node)) {
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

  const setEnabledModes = (modes) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMeaningAssociationNode(node)) {
        node.setEnabledModes(modes);
      }
    });
  };

  const setPromptFor = (nextPromptFor) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMeaningAssociationNode(node)) node.setPromptFor(nextPromptFor);
    });
  };

  const setShowAudio = (nextValue) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMeaningAssociationNode(node)) node.setShowAudio(nextValue);
    });
  };

  const setShowPronunciation = (nextValue) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMeaningAssociationNode(node)) node.setShowPronunciation(nextValue);
    });
  };

  const gridColumns = [
    ...getColumns(t),
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      renderCell: (params) => {
        if (params.row.id === "__empty__") return null;
        return (
          <Tooltip title={`Remove ${params.row.phrase || "word"}`}>
            <IconButton
              size="small"
              aria-label={`Remove ${params.row.phrase || "word"}`}
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
            phrase: t("meaningAssociationEditor.emptyState"),
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

          if (
            meaningAssociationRef.current &&
            meaningAssociationRef.current.contains(event.target)
          ) {
            if (isEditorControlTarget(event.target)) {
              return false;
            }
            event.preventDefault();
            if (event.shiftKey) {
              setSelected((prev) => !prev);
            } else {
              // Only clear selection if we're not already selected
              setSelected((prev) => {
                if (!prev) {
                  clearSelection();
                }
                return true;
              });
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
      // editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      // editor.registerCommand(
      //     KEY_ESCAPE_COMMAND,
      //     onEscape,
      //     COMMAND_PRIORITY_LOW,
      // ),
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    // isResizing,
    isSelected,
    nodeKey,
    onDelete,
    // onEnter,
    // onEscape,
    setSelected,
  ]);

  return (
    <div ref={meaningAssociationRef} style={{ cursor: "pointer" }}>
      <ExerciseBlockCard
        blockType="meaning-association"
        selected={isSelected}
        sx={{ maxWidth: "72rem" }}
      >
        <Typography variant="h5">{t("blocks.meaning_association")}</Typography>

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
                  phrase: `Add "${params.inputValue}"`,
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
            <DialogTitle>
              {t("meaningAssociationEditor.dialogTitle")}
            </DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "fit-content",
              }}
            >
              <DialogContentText>
                {t("meaningAssociationEditor.dialogDescription")}
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
                aria-label="Definition"
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
                {t("meaningAssociationEditor.cancel")}
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {t("meaningAssociationEditor.add")}
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
              params.id === "__empty__" ? "auto" : null
            }
            getRowClassName={getEditorDataGridRowClassName}
            hideFooter
            checkboxSelection
            isRowSelectable={(params) => params.id !== "__empty__"}
            disableRowSelectionExcludeModel
            slotProps={{ baseCheckbox: roundedCheckboxIcons }}
            rowSelectionModel={{
              type: "include",
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
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <RemoveWordsButton
              removeWordIDs={(ids) => {
                removeWordIDs(ids);
                setGridSelection([]);
              }}
              ids={gridSelection}
            />
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <MeaningAssociationPromptSelector
              promptFor={promptFor}
              setPromptFor={setPromptFor}
            />
          </Box>
          <Box sx={{ ml: { xs: 0, sm: "auto" }, flexShrink: 0 }}>
            <MeaningAssociationModeSelector
              enabledModes={enabledModes}
              setEnabledModes={setEnabledModes}
              showAudio={showAudio}
              setShowAudio={setShowAudio}
              showPronunciation={showPronunciation}
              setShowPronunciation={setShowPronunciation}
            />
          </Box>
        </Box>
      </ExerciseBlockCard>
    </div>
  );
}
