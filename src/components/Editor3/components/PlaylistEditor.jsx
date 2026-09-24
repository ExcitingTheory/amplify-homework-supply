import * as React from "react";
import { lazy, Suspense } from "react";

import { Box, IconButton, Skeleton, Tooltip, Typography } from "@mui/material";

// Lazy-load DataGrid only when PlaylistEditor is rendered (authoring only)
const DataGrid = lazy(() =>
  import("@mui/x-data-grid").then((m) => ({ default: m.DataGrid })),
);
import { roundedCheckboxIcons } from "../../RoundedCheckboxIcon";
import { useTranslations } from "next-intl";

import { Menu, MenuItem } from "@mui/material";

import Button from "@mui/material/Button";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";

import { $isPlaylistNode } from "../plugins/PlaylistPlugin";

import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { getAmplifyClient } from "../../../utils/amplifyClient";
import FileContext from "../../../context/fileContext";
import UnitContext from "../../../context/unitContext";
import PlaylistFilePickerDialog, {
  PLAYLIST_FILE_DRAG_TYPE,
  parsePlaylistFileDragData,
} from "./PlaylistFilePickerDialog";

const columns = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 100 },
  { field: "size", headerName: "Size", flex: 1, minWidth: 100 },
];

export function ActionsMenu({ ids, removeFileIDs }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const removeFromPlaylist = () => {
    console.log("removeFrom", ids);
    removeFileIDs(ids);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        id="playlist-edit-button"
        color="inherit"
        aria-controls={open ? "playlist-edit-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          minWidth: "3rem",
          margin: "0 0 0 0.5rem",
        }}
      >
        <MoreVertIcon />
      </Button>
      <Menu
        id="playlist-edit-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "playlist-edit-button",
        }}
      >
        <MenuItem onClick={removeFromPlaylist}>Remove from Playlist</MenuItem>
      </Menu>
    </>
  );
}

export default function PlaylistEditor({
  className,
  format,
  nodeKey,
  // setFileIDs,
  fileIDs,
}) {
  const t = useTranslations("editor.shared");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [gridSelection, setGridSelection] = React.useState([]);
  const dropPrompt = dragActive
    ? "Drop to add files"
    : "Drag audio or video here";
  const playlistRef = React.useRef(null);

  const [editor] = useLexicalComposerContext();

  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const { unit } = React.useContext(UnitContext);

  const { myPlaylistFiles } = React.useContext(FileContext);

  const fileOptions = React.useMemo(() => {
    return Object.values(myPlaylistFiles).filter(
      (file) =>
        file != null &&
        file.id != null &&
        (file.mimeType?.startsWith("audio/") ||
          file.mimeType?.startsWith("video/")),
    );
  }, [myPlaylistFiles]);

  const rows = React.useMemo(() => {
    const _rows = [];
    if (fileIDs) {
      fileIDs.forEach((id) => {
        const file = myPlaylistFiles[id];
        if (file) {
          _rows.push({
            id: file.id,
            title: file.name,
            size: (file.size / 100000).toFixed(2) + " MB",
          });
        }
      });
    }
    return _rows;
  }, [fileIDs, myPlaylistFiles]);

  const onDelete = React.useCallback(
    async (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isPlaylistNode(node)) {
          node.remove();
          // Remove relationship to file
          const client = getAmplifyClient();
          const _operations = [];
          fileIDs.forEach((id) => {
            _operations.push(client.models.UnitFile.delete({ id }));
          });
          await Promise.allSettled(_operations);
        }
      }
      return false;
    },
    [nodeKey],
  );

  const addFileIDs = React.useCallback(
    async (ids) => {
      if (!unit?.id) return;

      const currentIDs = new Set(fileIDs || []);
      const newIDs = ids.filter(
        (id) =>
          !currentIDs.has(id) && fileOptions.some((file) => file.id === id),
      );
      if (newIDs.length === 0) return;

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isPlaylistNode(node)) {
          newIDs.forEach((id) => node.appendId(id));
        }
      });

      const client = getAmplifyClient();
      await Promise.allSettled(
        newIDs.map((fileID) =>
          client.models.UnitFile.create({
            unitID: unit.id,
            fileID,
          }),
        ),
      );
    },
    [editor, fileIDs, fileOptions, nodeKey, unit?.id],
  );

  const handleDragOver = (event) => {
    if (!event.dataTransfer.types.includes(PLAYLIST_FILE_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const handleDrop = (event) => {
    const payload = parsePlaylistFileDragData(event.dataTransfer);
    if (!payload) return;
    event.preventDefault();
    setDragActive(false);
    void addFileIDs(payload.fileIDs);
  };

  const removeFileIDs = (ids) => {
    editor.update(async () => {
      const node = $getNodeByKey(nodeKey);
      if ($isPlaylistNode(node)) {
        node.removeIntersection(ids);
        // Remove relationship to file
        const client = getAmplifyClient();
        const _operations = [];
        ids.forEach((id) => {
          _operations.push(client.models.UnitFile.delete({ id }));
        });
        await Promise.allSettled(_operations);
      }
    });
  };

  // React.useEffect(() => {
  //     if (fileIDs.length === 0) return;
  //     prevFileIDs.current = fileIDs;
  //     let _rows = []
  //     fileIDs.forEach((id) => {

  //         const file = myPlaylistFiles[id];
  //         if (file) {
  //             _rows.push({
  //                 id: file.id,
  //                 title: file.name,
  //                 size: (file.size/100000).toFixed(2) + ' MB' ,
  //             });
  //         }
  //     });

  //     setRows(_rows);
  // }, [fileIDs]);

  React.useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (
            playlistRef.current &&
            (event.target === playlistRef.current ||
              playlistRef.current.contains(event.target))
          ) {
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
  }, [editor, nodeKey, onDelete]);

  return (
    <div
      ref={playlistRef}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setDragActive(false);
        }
      }}
      onDrop={handleDrop}
      style={{
        maxHeight: "32rem",
        maxWidth: "72rem",
        padding: "8px",
        border: dragActive
          ? "2px dashed var(--mui-palette-primary-main)"
          : "2px dashed transparent",
        borderRadius: "8px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Add files">
          <IconButton
            aria-label="Add files to playlist"
            color="primary"
            onClick={() => setPickerOpen(true)}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Typography sx={{ flex: 1 }} color="text.secondary" variant="body2">
          {dropPrompt}
        </Typography>
        <ActionsMenu removeFileIDs={removeFileIDs} ids={gridSelection} />
      </Box>

      <PlaylistFilePickerDialog
        open={pickerOpen}
        files={fileOptions}
        excludedFileIDs={fileIDs || []}
        onClose={() => setPickerOpen(false)}
        onInsert={(ids) => void addFileIDs(ids)}
      />

      {rows.length === 0 && (
        <div style={{ marginTop: "0.5" }}>
          <p>
            {t("playlistEditor.noFilesMessage")}
            {/* Or drop the files into the playlist, and the files will be added automatically. */}
          </p>
        </div>
      )}
      {rows.length > 0 && (
        <Suspense
          fallback={
            <Skeleton variant="rectangular" width="100%" height={300} />
          }
        >
          <DataGrid
            sx={{
              marginTop: "0.5rem",
            }}
            rows={rows}
            columns={columns}
            hideFooter
            checkboxSelection
            disableRowSelectionExcludeModel
            slotProps={{ baseCheckbox: roundedCheckboxIcons }}
            rowSelectionModel={{ type: "include", ids: new Set(gridSelection) }}
            onRowSelectionModelChange={(model) => {
              const ids =
                model.type === "exclude"
                  ? rows.map((r) => r.id).filter((id) => !model.ids.has(id))
                  : [...model.ids];
              setGridSelection(ids);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
