import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export const PLAYLIST_FILE_DRAG_TYPE =
  "application/x-homework-supply-playlist-files";

export interface PlaylistFileOption {
  id: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

export interface PlaylistFileDragPayload {
  fileIDs: string[];
}

type MediaKind = "all" | "audio" | "video";

interface PlaylistFilePickerDialogProps {
  open: boolean;
  files: PlaylistFileOption[];
  excludedFileIDs?: string[];
  initialKind?: MediaKind;
  initialQuery?: string;
  onClose: () => void;
  onInsert: (fileIDs: string[]) => void;
}

export function parsePlaylistFileDragData(
  dataTransfer: DataTransfer,
): PlaylistFileDragPayload | null {
  const rawPayload = dataTransfer.getData(PLAYLIST_FILE_DRAG_TYPE);
  if (!rawPayload) return null;

  try {
    const payload = JSON.parse(rawPayload) as Partial<PlaylistFileDragPayload>;
    const fileIDs = Array.isArray(payload.fileIDs)
      ? payload.fileIDs.filter(
          (fileID): fileID is string =>
            typeof fileID === "string" && fileID.length > 0,
        )
      : [];
    return fileIDs.length > 0 ? { fileIDs } : null;
  } catch {
    return null;
  }
}

export function filterPlaylistFiles(
  files: PlaylistFileOption[],
  kind: MediaKind,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return files.filter((file) => {
    const mimeType = file.mimeType?.toLocaleLowerCase() || "";
    const isMedia =
      mimeType.startsWith("audio/") || mimeType.startsWith("video/");
    const matchesKind = kind === "all" || mimeType.startsWith(`${kind}/`);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      file.name?.toLocaleLowerCase().includes(normalizedQuery) ||
      mimeType.includes(normalizedQuery);

    return isMedia && matchesKind && Boolean(matchesQuery);
  });
}

export default function PlaylistFilePickerDialog({
  open,
  files,
  excludedFileIDs = [],
  initialKind = "all",
  initialQuery = "",
  onClose,
  onInsert,
}: PlaylistFilePickerDialogProps) {
  const [kind, setKind] = React.useState<MediaKind>(initialKind);
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedFileIDs, setSelectedFileIDs] = React.useState<Set<string>>(
    new Set(),
  );
  const labels = {
    all: "All",
    audio: "Audio",
    cancel: "Cancel",
    empty: "No matching audio or video files",
    insert: "Add to playlist",
    search: "Search files",
    title: "Add files to playlist",
    video: "Video",
  };

  React.useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setQuery(initialQuery);
    setSelectedFileIDs(new Set());
  }, [initialKind, initialQuery, open]);

  const excluded = React.useMemo(
    () => new Set(excludedFileIDs),
    [excludedFileIDs],
  );
  const filteredFiles = React.useMemo(
    () =>
      filterPlaylistFiles(
        files.filter((file) => !excluded.has(file.id)),
        kind,
        query,
      ),
    [excluded, files, kind, query],
  );

  const toggleFile = (fileID: string) => {
    setSelectedFileIDs((current) => {
      const next = new Set(current);
      if (next.has(fileID)) next.delete(fileID);
      else next.add(fileID);
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            mb: 2,
          }}
        >
          <TextField
            autoFocus
            fullWidth
            label={labels.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            exclusive
            value={kind}
            onChange={(_, nextKind: MediaKind | null) => {
              if (nextKind) setKind(nextKind);
            }}
            size="small"
          >
            <ToggleButton value="all">{labels.all}</ToggleButton>
            <ToggleButton value="audio">{labels.audio}</ToggleButton>
            <ToggleButton value="video">{labels.video}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {filteredFiles.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            {labels.empty}
          </Typography>
        ) : (
          <List disablePadding>
            {filteredFiles.map((file) => (
              <ListItemButton
                key={file.id}
                selected={selectedFileIDs.has(file.id)}
                onClick={() => toggleFile(file.id)}
              >
                <Checkbox
                  checked={selectedFileIDs.has(file.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={file.name || file.id}
                  secondary={file.mimeType || undefined}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={selectedFileIDs.size === 0}
          onClick={() => {
            onInsert([...selectedFileIDs]);
            onClose();
          }}
        >
          {labels.insert}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
