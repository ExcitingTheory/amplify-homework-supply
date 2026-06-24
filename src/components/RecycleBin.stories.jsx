import React from "react";
import Box from "@mui/material/Box";
import RecycleBinPage from "../../app/[locale]/recycle-bin/page";

// We mock the RecycleBinContext at the story level since the page wraps itself
// with the provider that calls Amplify. Instead we render the inner component
// directly with a mock provider.

import {
  RecycleBinProvider,
  useRecycleBinContext,
} from "../context/recycleBinContext";

// --- Mock Context Provider ---
const mockDeletedItems = [
  {
    id: "unit-1",
    _modelName: "Unit",
    name: "Introduction to Biology",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 3600000).toISOString(),
    deletedBy: "instructor-1",
    _version: 3,
  },
  {
    id: "word-1",
    _modelName: "Word",
    phrase: "Photosynthesis",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 7200000).toISOString(),
    deletedBy: "instructor-1",
    _version: 2,
  },
  {
    id: "question-1",
    _modelName: "Question",
    prompt: "What is the powerhouse of the cell?",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 86400000).toISOString(),
    deletedBy: "instructor-1",
    _version: 1,
  },
  {
    id: "file-1",
    _modelName: "File",
    filename: "lecture-notes.pdf",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 172800000).toISOString(),
    deletedBy: "instructor-2",
    _version: 2,
  },
  {
    id: "section-1",
    _modelName: "Section",
    name: "Period 3 - Spring 2026",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 259200000).toISOString(),
    deletedBy: "instructor-1",
    _version: 1,
  },
  {
    id: "doc-1",
    _modelName: "Document",
    title: "Lab Report Template",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 604800000).toISOString(),
    deletedBy: "instructor-1",
    _version: 4,
  },
  {
    id: "chat-1",
    _modelName: "AssistantChat",
    description: "AI chat session - DNA replication",
    owner: "instructor-1",
    deletedAt: new Date(Date.now() - 1209600000).toISOString(),
    deletedBy: "instructor-1",
    _version: 1,
  },
];

const MODELS_WITH_SOFT_DELETE = [
  "Unit",
  "Section",
  "Question",
  "Word",
  "File",
  "Document",
  "AssistantChat",
];

function MockRecycleBinProvider({
  children,
  items = mockDeletedItems,
  loading = false,
}) {
  const value = React.useMemo(
    () => ({
      allDeletedItems: items,
      loading,
      error: null,
      softDelete: async (model, id) => {
        console.log("[Story] softDelete", model, id);
      },
      restoreRecord: async (model, id) => {
        console.log("[Story] restoreRecord", model, id);
      },
      permanentDelete: async (model, id) => {
        console.log("[Story] permanentDelete", model, id);
      },
      MODELS_WITH_SOFT_DELETE,
    }),
    [items, loading],
  );

  // We render children inside real context so useRecycleBinContext works
  const RecycleBinContext = React.createContext(null);
  return (
    <RecycleBinContext.Provider value={value}>
      {children}
    </RecycleBinContext.Provider>
  );
}

// We need to render the inner content component, not the full page
// which tries to use AdminRouteGuard and real provider.
// So we extract the content part.

// Since we can't easily extract the inner component, we'll create
// a story-specific version that uses the mock context.

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreIcon from "@mui/icons-material/Restore";
import FolderIcon from "@mui/icons-material/Folder";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import SmartToyIcon from "@mui/icons-material/SmartToy";
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
import Button from "@mui/material/Button";

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

/**
 * Self-contained RecycleBin content for Storybook (no Amplify dependencies).
 */
function RecycleBinStoryContent({ allDeletedItems, loading }) {
  const [modelFilter, setModelFilter] = React.useState("all");
  const [confirmDialog, setConfirmDialog] = React.useState(null);

  const filteredItems = React.useMemo(() => {
    if (modelFilter === "all") return allDeletedItems;
    return allDeletedItems.filter((item) => item._modelName === modelFilter);
  }, [allDeletedItems, modelFilter]);

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
                  <IconButton edge="end" color="success" title="Restore">
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    title="Permanently delete"
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

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Permanently Delete?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will archive &quot;
            {confirmDialog && getItemName(confirmDialog)}
            &quot; to S3 storage and remove it from the active database.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained">
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default {
  title: "Pages/RecycleBin",
  component: RecycleBinStoryContent,
  parameters: {
    layout: "fullscreen",
  },
};

export const WithItems = {
  args: {
    allDeletedItems: mockDeletedItems,
    loading: false,
  },
};

export const Empty = {
  args: {
    allDeletedItems: [],
    loading: false,
  },
};

export const Loading = {
  args: {
    allDeletedItems: [],
    loading: true,
  },
};

export const FilteredByUnit = {
  args: {
    allDeletedItems: mockDeletedItems.filter((i) => i._modelName === "Unit"),
    loading: false,
  },
};
