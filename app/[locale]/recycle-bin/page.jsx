"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
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
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import RestoreIcon from "@mui/icons-material/Restore";
import SchoolIcon from "@mui/icons-material/School";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AdminRouteGuard from "../admin/_components/AdminRouteGuard";
import {
  RecycleBinProvider,
  useRecycleBinContext,
} from "@/context/recycleBinContext";

const MODEL_ICONS = {
  Unit: <MenuBookIcon />,
  Section: <SchoolIcon />,
  Question: <QuizIcon />,
  Word: <HelpOutlineIcon />,
  File: <InsertDriveFileIcon />,
  Document: <DescriptionIcon />,
  AssistantChat: <SmartToyIcon />,
};

const MODEL_COLORS = {
  Unit: "primary",
  Section: "secondary",
  Question: "warning",
  Word: "info",
  File: "default",
  Document: "success",
  AssistantChat: "error",
};

function getItemName(item) {
  return (
    item.name ||
    item.phrase ||
    item.prompt ||
    item.filename ||
    item.title ||
    item.description ||
    item.id
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function RecycleBinContent() {
  const {
    allDeletedItems,
    loading,
    restoreRecord,
    permanentDelete,
    MODELS_WITH_SOFT_DELETE,
  } = useRecycleBinContext();

  const [modelFilter, setModelFilter] = React.useState("all");
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(null);

  const filteredItems = React.useMemo(() => {
    if (modelFilter === "all") return allDeletedItems;
    return allDeletedItems.filter((item) => item._modelName === modelFilter);
  }, [allDeletedItems, modelFilter]);

  const handleRestore = async (item) => {
    setActionLoading(item.id);
    try {
      await restoreRecord(item._modelName, item.id);
    } catch (err) {
      console.error("Restore failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDialog) return;
    setActionLoading(confirmDialog.id);
    try {
      await permanentDelete(confirmDialog._modelName, confirmDialog.id);
    } catch (err) {
      console.error("Permanent delete failed:", err);
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {[1, 2, 3, 4].map((i) => (
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
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <DeleteOutlineIcon sx={{ fontSize: 32 }} />
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Recycle Bin
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={modelFilter}
            label="Filter"
            onChange={(e) => setModelFilter(e.target.value)}
          >
            <MenuItem value="all">All ({allDeletedItems.length})</MenuItem>
            {MODELS_WITH_SOFT_DELETE.map((model) => {
              const count = allDeletedItems.filter(
                (i) => i._modelName === model,
              ).length;
              return (
                <MenuItem key={model} value={model}>
                  {model} ({count})
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {filteredItems.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <FolderIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              {modelFilter === "all"
                ? "Recycle bin is empty"
                : `No deleted ${modelFilter} items`}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List disablePadding>
          {filteredItems.map((item) => (
            <ListItem
              key={item.id}
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
                    edge="end"
                    color="success"
                    title="Restore"
                    disabled={actionLoading === item.id}
                    onClick={() => handleRestore(item)}
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    title="Permanently delete"
                    disabled={actionLoading === item.id}
                    onClick={() => setConfirmDialog(item)}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                {MODEL_ICONS[item._modelName] || <InsertDriveFileIcon />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body1" noWrap sx={{ maxWidth: 400 }}>
                      {getItemName(item)}
                    </Typography>
                    <Chip
                      label={item._modelName}
                      size="small"
                      color={MODEL_COLORS[item._modelName] || "default"}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Deleted {item.deletedBy ? `by ${item.deletedBy}` : ""}{" "}
                    {formatTimeAgo(item.deletedAt)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Permanent delete confirmation dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Permanently Delete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will archive &quot;
            {confirmDialog && getItemName(confirmDialog)}
            &quot; to S3 storage and remove it from the active database. An
            admin can unarchive it later if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            onClick={handlePermanentDelete}
            color="error"
            variant="contained"
            disabled={actionLoading === confirmDialog?.id}
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function RecycleBinPage() {
  return (
    <AdminRouteGuard>
      <RecycleBinProvider>
        <RecycleBinContent />
      </RecycleBinProvider>
    </AdminRouteGuard>
  );
}
