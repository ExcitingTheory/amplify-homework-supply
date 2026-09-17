import { SEMANTIC_THEME } from "../../../themes/semanticTheme";
import { alpha } from "@mui/material/styles";

export const compactEditorAutocompleteSx = {
  flex: "1 1 18rem",
  minWidth: { xs: "100%", sm: "16rem" },
  "& .MuiOutlinedInput-root": {
    minHeight: 40,
    py: 0,
    borderRadius: `${SEMANTIC_THEME.radius.control}px`,
  },
};

export const editorDataGridSx = (theme) => ({
  mt: 1,
  borderRadius: `${SEMANTIC_THEME.radius.card}px`,
  overflow: "hidden",
  "& .MuiDataGrid-columnHeaders": {
    bgcolor: "background.paper",
  },
  "& .editor-grid-row--alternate:not(.Mui-selected)": {
    bgcolor: alpha(theme.palette.text.primary, 0.045),
  },
  "& .MuiDataGrid-row:not(.Mui-selected):hover": {
    bgcolor: alpha(
      theme.palette.text.primary,
      theme.palette.mode === "dark" ? 0.18 : 0.11,
    ),
  },
  "& .MuiDataGrid-row[data-id='__empty__'] .MuiDataGrid-cell": {
    visibility: "hidden",
  },
  "& .MuiDataGrid-row[data-id='__empty__'] .MuiDataGrid-cell[data-field='phrase'], & .MuiDataGrid-row[data-id='__empty__'] .MuiDataGrid-cell[data-field='prompt']":
    {
      position: "absolute",
      inset: 0,
      width: "100% !important",
      maxWidth: "none !important",
      visibility: "visible",
      justifyContent: "center",
      zIndex: 1,
      pointerEvents: "none",
      whiteSpace: "normal !important",
      overflowWrap: "anywhere",
      textOverflow: "clip",
      overflow: "visible",
    },
});

export function getEditorDataGridRowClassName(params) {
  return params.indexRelativeToCurrentPage % 2 === 0
    ? "editor-grid-row--alternate"
    : "";
}

export function isEditorControlTarget(target) {
  return Boolean(
    target?.closest?.(
      ".MuiDataGrid-root, button, input, textarea, [role='button'], [role='checkbox'], [role='combobox'], [role='menuitem']",
    ),
  );
}
