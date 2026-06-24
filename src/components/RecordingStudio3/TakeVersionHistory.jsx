/**
 * TakeVersionHistory — lazy-loading Popover with S3 version list and Restore button
 *
 * Shows all recorded versions of a take slot. Lazy-fetches the S3 version list
 * on first open. Active version is marked; user can restore any previous version.
 */
import React, { useState, useCallback } from "react";
import {
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { listTakeVersions } from "../../utils/takeVersioning";

export default function TakeVersionHistory({
  identityId,
  dialogueId,
  slotId,
  currentVersion,
  currentAudioPath,
  takeType,
  onRestore,
  disabled = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [versions, setVersions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const open = Boolean(anchorEl);

  const handleOpen = useCallback(
    async (event) => {
      setAnchorEl(event.currentTarget);

      // Lazy-load versions on first open
      if (versions === null) {
        setLoading(true);
        setError(null);
        try {
          const result = await listTakeVersions(identityId, dialogueId, slotId);
          setVersions(result);
        } catch (err) {
          console.error("[TakeVersionHistory] Failed to list versions:", err);
          setError("Failed to load version history");
        } finally {
          setLoading(false);
        }
      }
    },
    [identityId, dialogueId, slotId, versions]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleRestore = useCallback(
    (versionKey) => {
      onRestore(dialogueId, slotId, versionKey);
      handleClose();
    },
    [dialogueId, slotId, onRestore, handleClose]
  );

  const isActiveVersion = (versionKey) => {
    return versionKey === currentAudioPath;
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        disabled={disabled || !slotId}
        title="Version History"
      >
        <HistoryIcon fontSize="small" />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2, minWidth: 280, maxWidth: 400 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon fontSize="small" />
            Version History
          </Typography>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Typography variant="body2" color="error" sx={{ p: 1 }}>
              {error}
            </Typography>
          )}

          {versions && versions.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No version history available
            </Typography>
          )}

          {versions && versions.length > 0 && (
            <List dense disablePadding>
              {[...versions].reverse().map((v) => {
                const active = isActiveVersion(v.key);
                return (
                  <ListItem key={v.version} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {active ? (
                        <RadioButtonCheckedIcon fontSize="small" color="primary" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={active ? 600 : 400}>
                            v{v.version}
                          </Typography>
                          {active && (
                            <Chip label="active" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )}
                          <Chip
                            label={takeType || "human"}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: "0.65rem" }}
                          />
                        </Box>
                      }
                      secondary={
                        v.lastModified
                          ? new Date(v.lastModified).toLocaleString()
                          : undefined
                      }
                    />
                    {!active && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleRestore(v.key)}
                        sx={{ ml: 1, textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Restore
                      </Button>
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
