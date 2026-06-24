import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import ArchiveIcon from "@mui/icons-material/Archive";
import FolderIcon from "@mui/icons-material/Folder";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityIcon from "@mui/icons-material/Visibility";

// =============================================================================
// Mock data
// =============================================================================

const MOCK_ARCHIVES = [
  {
    key: "private/archives/Unit/unit-abc-123/2026-06-01T12:00:00Z.json.gz",
    modelName: "Unit",
    recordId: "unit-abc-123",
    lastModified: "2026-06-01T12:00:00Z",
    size: 4096,
  },
  {
    key: "private/archives/Word/word-def-456/2026-05-28T09:30:00Z.json.gz",
    modelName: "Word",
    recordId: "word-def-456",
    lastModified: "2026-05-28T09:30:00Z",
    size: 1024,
  },
  {
    key: "private/archives/File/file-ghi-789/2026-05-20T15:45:00Z.json.gz",
    modelName: "File",
    recordId: "file-ghi-789",
    lastModified: "2026-05-20T15:45:00Z",
    size: 8192,
  },
  {
    key: "private/archives/Question/q-jkl-012/2026-05-15T08:00:00Z.json.gz",
    modelName: "Question",
    recordId: "q-jkl-012",
    lastModified: "2026-05-15T08:00:00Z",
    size: 2048,
  },
  {
    key: "private/archives/Document/doc-mno-345/2026-05-10T22:15:00Z.json.gz",
    modelName: "Document",
    recordId: "doc-mno-345",
    lastModified: "2026-05-10T22:15:00Z",
    size: 16384,
  },
];

const MOCK_PREVIEW = {
  model: "Unit",
  id: "unit-abc-123",
  archivedAt: "2026-06-01T12:00:00Z",
  archivedBy: "admin@school.edu",
  relatedRecordCount: 7,
  record: {
    id: "unit-abc-123",
    name: "Chapter 3 - Verbs",
    description: "Introduction to verb conjugation patterns",
    owner: "instructor@school.edu",
    _version: 5,
  },
};

// =============================================================================
// Story-only AdminArchives component (no Amplify dependencies)
// =============================================================================

function AdminArchivesStoryContent({
  archives = MOCK_ARCHIVES,
  loading = false,
  hasNextPage = false,
}) {
  const [modelFilter, setModelFilter] = React.useState("");
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const [previewDialog, setPreviewDialog] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(null);

  const modelOptions = [
    "Unit",
    "Section",
    "Question",
    "Word",
    "File",
    "Document",
    "AssistantChat",
  ];

  const filteredArchives = modelFilter
    ? archives.filter((a) => a.modelName === modelFilter)
    : archives;

  const handlePreview = (archive) => {
    setActionLoading(archive.key);
    setTimeout(() => {
      setPreviewDialog(MOCK_PREVIEW);
      setActionLoading(null);
    }, 500);
  };

  const handleUnarchive = () => {
    setActionLoading(confirmDialog?.key);
    setTimeout(() => {
      setActionLoading(null);
      setConfirmDialog(null);
    }, 800);
  };

  if (loading && archives.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={72}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <ArchiveIcon sx={{ fontSize: 32 }} />
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Archives (Admin)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={modelFilter}
            label="Model"
            onChange={(e) => setModelFilter(e.target.value)}
          >
            <MenuItem value="">All Models</MenuItem>
            {modelOptions.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredArchives.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <FolderIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              No archived records found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <List disablePadding>
            {filteredArchives.map((archive) => (
              <ListItem
                key={archive.key}
                sx={{
                  mb: 1,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      title="Preview"
                      disabled={actionLoading === archive.key}
                      onClick={() => handlePreview(archive)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      color="success"
                      title="Unarchive"
                      disabled={actionLoading === archive.key}
                      onClick={() => setConfirmDialog(archive)}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  <ArchiveIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {archive.recordId}
                      </Typography>
                      <Chip
                        label={archive.modelName}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Archived{" "}
                      {archive.lastModified
                        ? new Date(archive.lastModified).toLocaleDateString()
                        : ""}
                      {archive.size
                        ? ` · ${Math.round(archive.size / 1024)}KB`
                        : ""}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          {hasNextPage && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button
                variant="outlined"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                Load More
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Unarchive confirmation dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Unarchive Record?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will restore the record and its related data from S3 back into
            the active database. The record will become visible to its owner
            again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            onClick={handleUnarchive}
            color="success"
            variant="contained"
            disabled={!!actionLoading}
          >
            Unarchive
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewDialog}
        onClose={() => setPreviewDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Archive Preview</DialogTitle>
        <DialogContent>
          {previewDialog && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2">
                <strong>Model:</strong> {previewDialog.model}
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {previewDialog.id}
              </Typography>
              <Typography variant="body2">
                <strong>Archived:</strong>{" "}
                {new Date(previewDialog.archivedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Archived by:</strong> {previewDialog.archivedBy}
              </Typography>
              <Typography variant="body2">
                <strong>Related records:</strong>{" "}
                {previewDialog.relatedRecordCount}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Record data:</strong>
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  fontSize: 11,
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(previewDialog.record, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =============================================================================
// Stories
// =============================================================================

export default {
  title: "Pages/AdminArchives",
  component: AdminArchivesStoryContent,
  parameters: {
    layout: "fullscreen",
  },
};

export const WithArchives = {
  args: {
    archives: MOCK_ARCHIVES,
    loading: false,
    hasNextPage: true,
  },
};

export const Empty = {
  args: {
    archives: [],
    loading: false,
    hasNextPage: false,
  },
};

export const Loading = {
  args: {
    archives: [],
    loading: true,
    hasNextPage: false,
  },
};

export const SingleModel = {
  args: {
    archives: MOCK_ARCHIVES.filter((a) => a.modelName === "Unit"),
    loading: false,
    hasNextPage: false,
  },
};
