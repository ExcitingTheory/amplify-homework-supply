"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Autocomplete,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import { useTranslations } from "next-intl";
import {
  grantCollaboratorAccess,
  revokeCollaboratorAccess,
  listUnitCollaborators,
  searchInstructors,
} from "../../app/actions/collaborator";

interface Collaborator {
  id: string;
  collaboratorId: string;
  grantedBy: string;
  permission: "READ" | "EDIT";
  grantedAt: string;
  _version: number;
}

interface InstructorOption {
  username: string;
  email: string;
  name: string;
}

interface CollaboratorManagerProps {
  unitId: string;
  unitOwner: string;
  currentUsername: string;
  isOwnerOrAdmin: boolean;
}

/**
 * CollaboratorManager - Sidebar component for managing unit collaborators.
 *
 * Shows current collaborators with permission levels.
 * Owner/admin can add and remove collaborators.
 */
export default function CollaboratorManager({
  unitId,
  unitOwner,
  currentUsername,
  isOwnerOrAdmin,
}: CollaboratorManagerProps) {
  const t = useTranslations("components");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorOption | null>(null);
  const [instructorOptions, setInstructorOptions] = useState<
    InstructorOption[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [newPermission, setNewPermission] = useState<"READ" | "EDIT">("READ");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listUnitCollaborators(unitId);
    if (result.success) {
      setCollaborators(result.data || []);
    } else {
      setError(result.error || t("collaboratorManager.failedToLoad"));
    }
    setLoading(false);
  }, [unitId]);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  // Debounced instructor search
  useEffect(() => {
    if (searchInput.length < 2) {
      setInstructorOptions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const result = await searchInstructors(
        searchInput,
        currentUsername,
        unitOwner,
      );
      if (result.success) {
        setInstructorOptions(result.data || []);
      }
      setSearchLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, currentUsername, unitOwner]);

  const handleAddCollaborator = async () => {
    if (!selectedInstructor) return;
    setSubmitting(true);
    setError(null);

    const result = await grantCollaboratorAccess(
      unitId,
      unitOwner,
      currentUsername,
      selectedInstructor.username,
      newPermission,
    );

    if (result.success) {
      setDialogOpen(false);
      setSelectedInstructor(null);
      setSearchInput("");
      setNewPermission("READ");
      await loadCollaborators();
    } else {
      setError(result.error || t("collaboratorManager.failedToAdd"));
    }
    setSubmitting(false);
  };

  const handleRemoveCollaborator = async (collab: Collaborator) => {
    setError(null);
    const result = await revokeCollaboratorAccess(collab.id, collab._version);
    if (result.success) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collab.id));
    } else {
      setError(result.error || t("collaboratorManager.failedToRemove"));
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <PeopleIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("collaboratorManager.title")}
        </Typography>
        {isOwnerOrAdmin && (
          <IconButton
            size="small"
            onClick={() => setDialogOpen(true)}
            aria-label={t("collaboratorManager.addCollaborator")}
          >
            <PersonAddIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={20} />
      ) : collaborators.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("collaboratorManager.noCollaborators")}
        </Typography>
      ) : (
        <List dense disablePadding>
          {collaborators.map((collab) => (
            <ListItem key={collab.id} disableGutters sx={{ py: 0.5, gap: 1 }}>
              <ListItemText
                primary={collab.collaboratorId}
                secondary={
                  <Chip
                    label={collab.permission === "EDIT" ? t("collaboratorManager.editPermission") : t("collaboratorManager.readPermission")}
                    size="small"
                    color={collab.permission === "EDIT" ? "primary" : "default"}
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                }
                sx={{ flex: 1, minWidth: 0 }}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ component: 'div' }}
              />
              {(isOwnerOrAdmin || collab.collaboratorId === currentUsername) && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleRemoveCollaborator(collab)}
                  aria-label={t("collaboratorManager.removeCollaborator", { name: collab.collaboratorId })}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Collaborator Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("collaboratorManager.addCollaborator")}</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={instructorOptions}
            getOptionLabel={(option) =>
              option.name
                ? `${option.name} (${option.username})`
                : option.username
            }
            value={selectedInstructor}
            onChange={(_e, value) => setSelectedInstructor(value)}
            inputValue={searchInput}
            onInputChange={(_e, value) => setSearchInput(value)}
            loading={searchLoading}
            noOptionsText={
              searchInput.length < 2
                ? t("collaboratorManager.typeAtLeast")
                : t("collaboratorManager.noInstructorsFound")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label={t("collaboratorManager.searchInstructors")}
                placeholder={t("collaboratorManager.searchPlaceholder")}
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? (
                        <CircularProgress size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>{t("collaboratorManager.permissionLevel")}</InputLabel>
            <Select
              value={newPermission}
              label={t("collaboratorManager.permissionLevel")}
              onChange={(e) => setNewPermission(e.target.value as "READ" | "EDIT")}
            >
              <MenuItem value="READ">{t("collaboratorManager.permissionRead")}</MenuItem>
              <MenuItem value="EDIT">{t("collaboratorManager.permissionEdit")}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("collaboratorManager.cancel")}</Button>
          <Button
            onClick={handleAddCollaborator}
            variant="contained"
            disabled={!selectedInstructor || submitting}
          >
            {submitting ? <CircularProgress size={20} /> : t("collaboratorManager.add")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
