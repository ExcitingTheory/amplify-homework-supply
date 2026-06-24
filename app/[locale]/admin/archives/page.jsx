"use client";

import * as React from "react";
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
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { useRecycleBinAdmin } from "@/hooks/useRecycleBin";

function AdminArchivesContent() {
  const { listArchives, getArchive, unarchiveRecord, loading } =
    useRecycleBinAdmin();

  const [archives, setArchives] = React.useState([]);
  const [nextToken, setNextToken] = React.useState(null);
  const [modelFilter, setModelFilter] = React.useState("");
  const [pageLoading, setPageLoading] = React.useState(true);
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const [previewDialog, setPreviewDialog] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(null);

  const fetchArchives = React.useCallback(
    async (reset = false) => {
      setPageLoading(true);
      try {
        const result = await listArchives({
          modelName: modelFilter || undefined,
          limit: 50,
          continuationToken: reset ? undefined : nextToken,
        });
        if (reset) {
          setArchives(result.archives || []);
        } else {
          setArchives((prev) => [...prev, ...(result.archives || [])]);
        }
        setNextToken(result.nextToken);
      } catch (err) {
        console.error("Failed to list archives:", err);
      } finally {
        setPageLoading(false);
      }
    },
    [listArchives, modelFilter, nextToken],
  );

  React.useEffect(() => {
    fetchArchives(true);
  }, [modelFilter]);

  const handlePreview = async (archive) => {
    setActionLoading(archive.key);
    try {
      const result = await getArchive(archive.key);
      setPreviewDialog(result);
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchive = async () => {
    if (!confirmDialog) return;
    setActionLoading(confirmDialog.key);
    try {
      await unarchiveRecord(confirmDialog.key);
      setArchives((prev) => prev.filter((a) => a.key !== confirmDialog.key));
    } catch (err) {
      console.error("Unarchive failed:", err);
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const modelOptions = [
    "Unit",
    "Section",
    "Question",
    "Word",
    "File",
    "Document",
    "AssistantChat",
  ];

  if (pageLoading && archives.length === 0) {
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

      {archives.length === 0 ? (
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
            {archives.map((archive) => (
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

          {nextToken && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchArchives(false)}
                disabled={pageLoading}
                startIcon={pageLoading ? <CircularProgress size={16} /> : null}
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
            disabled={loading}
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

export default function AdminArchivesPage() {
  return (
    <AdminRouteGuard>
      <AdminArchivesContent />
    </AdminRouteGuard>
  );
}
